'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { ActionResult } from '@/types/database.types'

const ExpenseSchema = z.object({
  case_id: z.string().uuid().optional().or(z.literal('')),
  category: z.enum(['travel', 'stamp_duty', 'printing', 'court_fee', 'filing_fee', 'photocopy', 'miscellaneous']),
  amount: z.coerce.number().min(0.01),
  expense_date: z.string(),
  description: z.string().optional(),
  is_billable: z.coerce.boolean().default(false),
})

async function getFirmContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase.from('profiles').select('firm_id').eq('id', user.id).single()
  if (!profile?.firm_id) throw new Error('No firm')
  return { supabase, user, profile, firmId: profile.firm_id }
}

export async function getCaseFinancials(caseId: string) {
  const { supabase, firmId } = await getFirmContext()

  // 1. Fetch Expenses
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*, profiles(full_name)')
    .eq('firm_id', firmId)
    .eq('case_id', caseId)
    .order('expense_date', { ascending: false })

  // 2. Fetch Invoices for this case to calculate Revenue
  const { data: invoices } = await supabase
    .from('invoices')
    .select('total_amount, status')
    .eq('firm_id', firmId)
    .eq('case_id', caseId)
    .neq('status', 'draft')

  const totalExpenses = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0
  const totalRevenue = invoices?.reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0
  
  return {
    expenses: expenses || [],
    totalExpenses,
    totalRevenue,
    profit: totalRevenue - totalExpenses
  }
}

export async function createExpenseAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user, firmId } = await getFirmContext()
    
    const raw = {
      case_id: formData.get('case_id'),
      category: formData.get('category'),
      amount: formData.get('amount'),
      expense_date: formData.get('expense_date'),
      description: formData.get('description'),
      is_billable: formData.get('is_billable') === 'on'
    }
    
    const parsed = ExpenseSchema.safeParse(raw)
    if (!parsed.success) {
      return { success: false, fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
    }

    const { error } = await supabase.from('expenses').insert({
      firm_id: firmId,
      ...parsed.data,
      case_id: parsed.data.case_id || null,
      logged_by: user.id,
    })

    if (error) return { success: false, error: error.message }

    revalidatePath(`/cases/${parsed.data.case_id}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred' }
  }
}

export async function deleteExpenseAction(id: string, caseId: string): Promise<ActionResult> {
  try {
    const { supabase, firmId } = await getFirmContext()
    await supabase.from('expenses').delete().eq('id', id).eq('firm_id', firmId)
    revalidatePath(`/cases/${caseId}`)
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to delete expense' }
  }
}
