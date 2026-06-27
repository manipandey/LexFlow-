'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { ActionResult } from '@/types/database.types'
import { format } from 'date-fns'

const HearingSchema = z.object({
  title: z.string().min(2),
  hearing_type: z.enum(['hearing', 'meeting', 'consultation', 'deadline', 'filing', 'client_meeting']),
  case_id: z.string().uuid().optional().or(z.literal('')),
  client_id: z.string().uuid().optional().or(z.literal('')),
  assigned_lawyer_id: z.string().uuid().optional().or(z.literal('')),
  court_name: z.string().optional(),
  location: z.string().optional(),
  hearing_date: z.string(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  notes: z.string().optional(),
  hearing_status: z.enum(['scheduled', 'sthagit', 'herna_nabhyayeko', 'adesh', 'faisala']).default('scheduled'),
  bench: z.string().optional(),
  recurrence_rule: z.string().optional(),
})

async function getHearingFirmId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase.from('profiles').select('firm_id').eq('id', user.id).single()
  if (!profile?.firm_id) throw new Error('No firm')
  return { supabase, user, profile, firmId: profile.firm_id }
}

export async function getHearings({ month, year }: { month?: number; year?: number } = {}) {
  const { supabase, profile } = await getHearingFirmId()
  const now = new Date()
  const m = month ?? now.getMonth() + 1
  const y = year ?? now.getFullYear()
  const startDate = `${y}-${String(m).padStart(2, '0')}-01`
  const endDate = `${y}-${String(m).padStart(2, '0')}-${new Date(y, m, 0).getDate()}`

  const { data } = await supabase
    .from('hearings')
    .select('*, cases(title, case_number), clients(full_name), profiles!hearings_assigned_lawyer_id_fkey(full_name)')
    .eq('firm_id', profile.firm_id!)
    .gte('hearing_date', startDate)
    .lte('hearing_date', endDate)
    .order('hearing_date', { ascending: true })
    
  const { data: consultations } = await supabase
    .from('crm_consultations')
    .select('*, crm_leads(name, legal_issue), profiles!crm_consultations_lawyer_id_fkey(full_name)')
    .eq('firm_id', profile.firm_id!)
    .gte('consultation_date', startDate)
    .lte('consultation_date', endDate)
    
  let allEvents = data ?? []
  
  if (consultations) {
    const mappedConsultations = consultations.map(c => ({
      id: c.id,
      title: `CRM Lead: ${c.crm_leads?.name || 'Unknown'}`,
      hearing_type: 'consultation',
      hearing_date: c.consultation_date,
      start_time: c.start_time,
      end_time: c.end_time,
      notes: c.crm_leads?.legal_issue || '',
      hearing_status: c.status,
      profiles: c.profiles
    }))
    
    allEvents = [...allEvents, ...mappedConsultations]
  }

  return allEvents
}

export async function createHearingAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user, profile } = await getHearingFirmId()
    const raw = Object.fromEntries(formData)
    const parsed = HearingSchema.safeParse(raw)
    if (!parsed.success) return { success: false, fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }

    const { error } = await supabase.from('hearings').insert({
      firm_id: profile.firm_id!, ...parsed.data,
      case_id: parsed.data.case_id || null,
      client_id: parsed.data.client_id || null,
      assigned_lawyer_id: parsed.data.assigned_lawyer_id || null,
      court_name: parsed.data.court_name || null,
      start_time: parsed.data.start_time || null,
      end_time: parsed.data.end_time || null,
      notes: parsed.data.notes || null,
      hearing_status: parsed.data.hearing_status || 'scheduled',
      bench: parsed.data.bench || null,
      recurrence_rule: parsed.data.recurrence_rule || null,
      created_by: user.id,
    })
    if (error) return { success: false, error: error.message }

    await supabase.from('activity_logs').insert({
      firm_id: profile.firm_id!, user_id: user.id, action: 'create',
      entity_type: 'hearing', entity_name: parsed.data.title,
      description: `Scheduled ${parsed.data.hearing_type}: ${parsed.data.title}`,
    })

    revalidatePath('/hearings')
    return { success: true }
  } catch {
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function updateHearingCompletedAction(id: string, completed: boolean): Promise<ActionResult> {
  try {
    const { supabase, profile } = await getHearingFirmId()
    await supabase.from('hearings').update({ is_completed: completed }).eq('id', id).eq('firm_id', profile.firm_id!)
    revalidatePath('/hearings')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to update' }
  }
}

export async function deleteHearingAction(id: string): Promise<ActionResult> {
  try {
    const { supabase, user, profile } = await getHearingFirmId()
    await supabase.from('hearings').delete().eq('id', id).eq('firm_id', profile.firm_id!)
    revalidatePath('/hearings')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to delete' }
  }
}

export async function updateHearingDateAction(id: string, newDate: string): Promise<ActionResult> {
  try {
    const { supabase, profile } = await getHearingFirmId()
    await supabase.from('hearings').update({ hearing_date: newDate }).eq('id', id).eq('firm_id', profile.firm_id!)
    revalidatePath('/hearings')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to update date' }
  }
}
