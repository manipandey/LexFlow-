'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { ActionResult } from '@/types/database.types'

async function getBillingFirmId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase.from('profiles').select('firm_id').eq('id', user.id).single()
  if (!profile?.firm_id) throw new Error('No firm')
  return { supabase, user, profile, firmId: profile.firm_id }
}

export async function getInvoices({ status, page = 1, pageSize = 20 }: { status?: string; page?: number; pageSize?: number } = {}) {
  const { supabase, profile } = await getBillingFirmId()
  let query = supabase
    .from('invoices')
    .select('*, clients(full_name), cases(title, case_number)', { count: 'exact' })
    .eq('firm_id', profile.firm_id!)
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)
  if (status) query = query.eq('status', status)
  const { data, count } = await query
  return { data: data ?? [], total: count ?? 0 }
}

export async function getInvoiceById(id: string) {
  const { supabase, profile } = await getBillingFirmId()
  const { data } = await supabase
    .from('invoices')
    .select('*, clients(full_name, email, phone, address, city, state), cases(title, case_number), invoice_items(*)')
    .eq('id', id)
    .eq('firm_id', profile.firm_id!)
    .single()
  return data
}

export async function createInvoiceAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user, profile } = await getBillingFirmId()
    const clientId = formData.get('client_id') as string
    const caseId = formData.get('case_id') as string | null
    const dueDate = formData.get('due_date') as string | null
    const taxRate = Number(formData.get('tax_rate') ?? 0)
    const notes = formData.get('notes') as string | null
    const currency = (formData.get('currency') as string) || 'NPR'

    // Parse line items from JSON
    const itemsJson = formData.get('items') as string
    const items: { description: string; quantity: number; unit_price: number }[] = JSON.parse(itemsJson)

    const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0)
    const taxAmount = (subtotal * taxRate) / 100
    const totalAmount = subtotal + taxAmount

    const { data: invNum } = await supabase.rpc('generate_invoice_number', { p_firm_id: profile.firm_id! })

    const { data: invoice, error } = await supabase.from('invoices').insert({
      firm_id: profile.firm_id!, client_id: clientId,
      case_id: caseId || null, invoice_number: invNum,
      status: 'draft', issue_date: new Date().toISOString().split('T')[0],
      due_date: dueDate || null, subtotal, tax_rate: taxRate,
      tax_amount: taxAmount, total_amount: totalAmount,
      paid_amount: 0, currency, notes: notes || null, created_by: user.id,
    }).select('id').single()

    if (error) return { success: false, error: error.message }

    // Insert line items
    await supabase.from('invoice_items').insert(
      items.map((item, i) => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.quantity * item.unit_price,
        sort_order: i,
      }))
    )

    revalidatePath('/billing')
    return { success: true, data: { id: invoice.id } }
  } catch (e) {
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function markInvoicePaidAction(id: string, paidAmount: number): Promise<ActionResult> {
  try {
    const { supabase, profile } = await getBillingFirmId()
    await supabase.from('invoices').update({
      status: 'paid', paid_amount: paidAmount,
      payment_date: new Date().toISOString().split('T')[0],
    }).eq('id', id).eq('firm_id', profile.firm_id!)
    revalidatePath('/billing')
    revalidatePath(`/billing/${id}`)
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to update invoice' }
  }
}

export async function updateInvoiceStatusAction(id: string, status: string): Promise<ActionResult> {
  try {
    const { supabase, profile } = await getBillingFirmId()
    await supabase.from('invoices').update({ status }).eq('id', id).eq('firm_id', profile.firm_id!)
    revalidatePath('/billing')
    revalidatePath(`/billing/${id}`)
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to update' }
  }
}
