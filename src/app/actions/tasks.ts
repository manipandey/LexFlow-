'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { ActionResult } from '@/types/database.types'

const TaskSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  case_id: z.string().uuid().optional().or(z.literal('')),
  assigned_to: z.string().uuid().optional().or(z.literal('')),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  due_date: z.string().optional(),
})

async function getTaskFirmId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase.from('profiles').select('firm_id').eq('id', user.id).single()
  if (!profile?.firm_id) throw new Error('No firm')
  return { supabase, user, profile, firmId: profile.firm_id }
}

export async function getTasks({ status, assignedTo, caseId }: { status?: string; assignedTo?: string; caseId?: string } = {}) {
  const { supabase, profile } = await getTaskFirmId()
  let query = supabase
    .from('tasks')
    .select('*, profiles!tasks_assigned_to_fkey(full_name, avatar_url), cases(title, case_number)')
    .eq('firm_id', profile.firm_id!)
    .order('due_date', { ascending: true, nullsFirst: false })
  if (status) query = query.eq('status', status)
  if (assignedTo) query = query.eq('assigned_to', assignedTo)
  if (caseId) query = query.eq('case_id', caseId)
  const { data } = await query
  return data ?? []
}

export async function createTaskAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user, profile } = await getTaskFirmId()
    const raw = Object.fromEntries(formData)
    const parsed = TaskSchema.safeParse(raw)
    if (!parsed.success) return { success: false, fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }

    const { error } = await supabase.from('tasks').insert({
      firm_id: profile.firm_id!, ...parsed.data,
      case_id: parsed.data.case_id || null,
      assigned_to: parsed.data.assigned_to || null,
      due_date: parsed.data.due_date || null,
      created_by: user.id,
    })
    if (error) return { success: false, error: error.message }
    revalidatePath('/tasks')
    return { success: true }
  } catch {
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function updateTaskStatusAction(id: string, status: string): Promise<ActionResult> {
  try {
    const { supabase, profile } = await getTaskFirmId()
    const updates: Record<string, unknown> = { status }
    if (status === 'completed') updates.completed_at = new Date().toISOString()
    await supabase.from('tasks').update(updates).eq('id', id).eq('firm_id', profile.firm_id!)
    revalidatePath('/tasks')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to update task' }
  }
}

export async function deleteTaskAction(id: string): Promise<ActionResult> {
  try {
    const { supabase, profile } = await getTaskFirmId()
    await supabase.from('tasks').delete().eq('id', id).eq('firm_id', profile.firm_id!)
    revalidatePath('/tasks')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to delete task' }
  }
}
