'use server'

import { createClient, getCurrentProfile } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import type { ActionResult } from '@/types/database.types'

const CaseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  case_type: z.string(),
  description: z.string().optional(),
  client_id: z.string().uuid('Select a valid client'),
  assigned_lawyer_id: z.string().uuid().optional().or(z.literal('')),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  court_name: z.string().optional(),
  filing_date: z.string().optional(),
  estimated_value: z.string().optional(),
  notes: z.string().optional(),
  team_members: z.string().optional(), // comma-separated UUIDs
})

async function getCaseFirmId() {
  const result = await getCurrentProfile()
  if (!result || !result.user) throw new Error('Unauthorized')
  if (!result.firmId) throw new Error('No firm')
  return { supabase: result.supabase, user: result.user, profile: result.profile, firmId: result.firmId }
}

export async function getCases({ page = 1, pageSize = 20, search, status, type, assignedTo }: {
  page?: number; pageSize?: number; search?: string; status?: string; type?: string; assignedTo?: string
} = {}) {
  const { supabase, profile } = await getCaseFirmId()

  let query = supabase
    .from('cases')
    .select('*, clients(full_name), profiles!cases_assigned_lawyer_id_fkey(full_name)', { count: 'exact' })
    .eq('firm_id', profile.firm_id!)
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (search) query = query.or(`title.ilike.%${search}%,case_number.ilike.%${search}%`)
  if (status) query = query.eq('status', status)
  if (type) query = query.eq('case_type', type)
  if (assignedTo) query = query.eq('assigned_lawyer_id', assignedTo)

  const { data, count, error } = await query
  if (error) throw error
  return { data: data ?? [], total: count ?? 0 }
}

export async function getCaseById(id: string) {
  const { supabase, profile } = await getCaseFirmId()
  const { data, error } = await supabase
    .from('cases')
    .select(`
      *,
      clients(id, full_name, email, phone),
      profiles!cases_assigned_lawyer_id_fkey(id, full_name, title, avatar_url),
      case_updates(*, profiles(full_name, avatar_url)),
      hearings(*, profiles!hearings_assigned_lawyer_id_fkey(full_name)),
      documents(id, name, category, file_size, created_at),
      tasks(id, title, status, priority, due_date, assigned_to, profiles!tasks_assigned_to_fkey(full_name))
    `)
    .eq('id', id)
    .eq('firm_id', profile.firm_id!)
    .single()
  if (error) throw error
  return data
}

export async function createCaseAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user, profile } = await getCaseFirmId()
    const raw = Object.fromEntries(formData)
    const parsed = CaseSchema.safeParse(raw)
    if (!parsed.success) return { success: false, fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }

    // Generate case number
    const { data: caseNumber } = await supabase.rpc('generate_case_number', { p_firm_id: profile.firm_id! })

    const { data: newCase, error } = await supabase.from('cases').insert({
      firm_id: profile.firm_id!,
      case_number: caseNumber,
      title: parsed.data.title,
      case_type: parsed.data.case_type,
      description: parsed.data.description || null,
      client_id: parsed.data.client_id,
      assigned_lawyer_id: parsed.data.assigned_lawyer_id || null,
      priority: parsed.data.priority,
      status: 'open',
      court_name: parsed.data.court_name || null,
      filing_date: parsed.data.filing_date || null,
      estimated_value: parsed.data.estimated_value ? Number(parsed.data.estimated_value) : null,
      notes: parsed.data.notes || null,
      created_by: user.id,
    }).select('id').single()

    if (error) return { success: false, error: error.message }

    // Add initial timeline entry
    await supabase.from('case_updates').insert({
      firm_id: profile.firm_id!,
      case_id: newCase.id,
      author_id: user.id,
      update_type: 'note',
      title: 'Case Opened',
      content: `Case ${caseNumber} opened by ${user.email}`,
    })

    await supabase.from('activity_logs').insert({
      firm_id: profile.firm_id!, user_id: user.id, action: 'create',
      entity_type: 'case', entity_id: newCase.id, entity_name: parsed.data.title,
      description: `Opened case ${caseNumber}: ${parsed.data.title}`,
    })

    revalidatePath('/cases')
  } catch {
    return { success: false, error: 'An unexpected error occurred' }
  }
  redirect('/cases')
}

export async function updateCaseAction(id: string, _prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user, profile } = await getCaseFirmId()
    const raw = Object.fromEntries(formData)
    const parsed = CaseSchema.safeParse(raw)
    if (!parsed.success) return { success: false, fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }

    const { error } = await supabase.from('cases').update({
      title: parsed.data.title,
      case_type: parsed.data.case_type,
      description: parsed.data.description || null,
      client_id: parsed.data.client_id,
      assigned_lawyer_id: parsed.data.assigned_lawyer_id || null,
      priority: parsed.data.priority,
      court_name: parsed.data.court_name || null,
      filing_date: parsed.data.filing_date || null,
      estimated_value: parsed.data.estimated_value ? Number(parsed.data.estimated_value) : null,
      notes: parsed.data.notes || null,
    }).eq('id', id).eq('firm_id', profile.firm_id!)

    if (error) return { success: false, error: error.message }

    await supabase.from('activity_logs').insert({
      firm_id: profile.firm_id!, user_id: user.id, action: 'update',
      entity_type: 'case', entity_id: id, entity_name: parsed.data.title,
      description: `Updated case: ${parsed.data.title}`,
    })

    revalidatePath(`/cases/${id}`)
    revalidatePath('/cases')
  } catch {
    return { success: false, error: 'An unexpected error occurred' }
  }
  redirect(`/cases/${id}`)
}

export async function updateCaseStatusAction(id: string, status: string): Promise<ActionResult> {
  try {
    const { supabase, user, profile } = await getCaseFirmId()
    const { error } = await supabase.from('cases').update({ status }).eq('id', id).eq('firm_id', profile.firm_id!)
    if (error) return { success: false, error: error.message }
    revalidatePath(`/cases/${id}`)
    revalidatePath('/cases')
    return { success: true }
  } catch {
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function addCaseUpdateAction(caseId: string, content: string, title?: string): Promise<ActionResult> {
  try {
    const { supabase, user, profile } = await getCaseFirmId()
    await supabase.from('case_updates').insert({
      firm_id: profile.firm_id!, case_id: caseId, author_id: user.id,
      update_type: 'note', title: title || 'Note Added', content,
    })
    revalidatePath(`/cases/${caseId}`)
    return { success: true }
  } catch {
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function deleteCaseAction(id: string): Promise<ActionResult> {
  try {
    const { supabase, user, profile } = await getCaseFirmId()
    const { data: c } = await supabase.from('cases').select('title').eq('id', id).single()
    const { error } = await supabase.from('cases').delete().eq('id', id).eq('firm_id', profile.firm_id!)
    if (error) return { success: false, error: error.message }
    await supabase.from('activity_logs').insert({
      firm_id: profile.firm_id!, user_id: user.id, action: 'delete',
      entity_type: 'case', entity_id: id, entity_name: c?.title,
    })
    revalidatePath('/cases')
    return { success: true }
  } catch {
    return { success: false, error: 'An unexpected error occurred' }
  }
}
