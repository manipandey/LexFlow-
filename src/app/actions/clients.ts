'use server'

import { createClient, getCurrentProfile } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import type { ActionResult, FilterState, SortState } from '@/types/database.types'

const ClientSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
  company_name: z.string().optional(),
  id_type: z.string().optional(),
  id_number: z.string().optional(),
  notes: z.string().optional(),
  tags: z.string().optional(), // comma-separated string from form
})

async function getClientFirmId() {
  const result = await getCurrentProfile()
  if (!result || !result.user) throw new Error('Unauthorized')
  if (!result.firmId) throw new Error('No firm')
  return { supabase: result.supabase, user: result.user, profile: result.profile, firmId: result.firmId }
}

// ============================================================
// GET CLIENTS (paginated + filtered)
// ============================================================

export async function getClients({
  page = 1,
  pageSize = 20,
  search,
  status,
  tags,
}: {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  tags?: string[]
} = {}) {
  const { supabase, profile } = await getClientFirmId()

  let query = supabase
    .from('clients')
    .select('*', { count: 'exact' })
    .eq('firm_id', profile.firm_id!)
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  if (status === 'active') query = query.eq('is_active', true)
  if (status === 'inactive') query = query.eq('is_active', false)
  if (tags && tags.length > 0) query = query.overlaps('tags', tags)

  const { data, count, error } = await query
  if (error) throw error

  return { data: data ?? [], total: count ?? 0 }
}

// ============================================================
// GET CLIENT BY ID
// ============================================================

export async function getClientById(id: string) {
  const { supabase, profile } = await getClientFirmId()

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('firm_id', profile.firm_id!)
    .single()

  if (error) throw error
  return data
}

// ============================================================
// GET CLIENT WITH RELATED DATA
// ============================================================

export async function getClientWithRelations(id: string) {
  const { supabase, profile } = await getClientFirmId()

  const [clientResult, casesResult, documentsResult, invoicesResult] = await Promise.all([
    supabase.from('clients').select('*').eq('id', id).eq('firm_id', profile.firm_id!).single(),
    supabase.from('cases').select('id, case_number, title, status, case_type, created_at').eq('client_id', id).order('created_at', { ascending: false }),
    supabase.from('documents').select('id, name, category, file_size, created_at').eq('client_id', id).order('created_at', { ascending: false }),
    supabase.from('invoices').select('id, invoice_number, total_amount, status, due_date, issue_date').eq('client_id', id).order('created_at', { ascending: false }),
  ])

  return {
    client: clientResult.data,
    cases: casesResult.data ?? [],
    documents: documentsResult.data ?? [],
    invoices: invoicesResult.data ?? [],
  }
}

// ============================================================
// CREATE CLIENT
// ============================================================

export async function createClientAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { supabase, user, profile } = await getClientFirmId()
    const raw = Object.fromEntries(formData)
    const parsed = ClientSchema.safeParse(raw)

    if (!parsed.success) {
      return {
        success: false,
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    const tags = parsed.data.tags
      ? parsed.data.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : []

    const { data, error } = await supabase.from('clients').insert({
      firm_id: profile.firm_id!,
      full_name: parsed.data.full_name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      city: parsed.data.city || null,
      state: parsed.data.state || null,
      country: parsed.data.country || null,
      postal_code: parsed.data.postal_code || null,
      company_name: parsed.data.company_name || null,
      id_type: parsed.data.id_type || null,
      id_number: parsed.data.id_number || null,
      notes: parsed.data.notes || null,
      tags,
      created_by: user.id,
    }).select('id').single()

    if (error) return { success: false, error: error.message }

    // Log activity
    await supabase.from('activity_logs').insert({
      firm_id: profile.firm_id!,
      user_id: user.id,
      action: 'create',
      entity_type: 'client',
      entity_id: data.id,
      entity_name: parsed.data.full_name,
      description: `Added new client ${parsed.data.full_name}`,
    })

    revalidatePath('/clients')
  } catch (e) {
    return { success: false, error: 'An unexpected error occurred' }
  }
  redirect('/clients')
}

// ============================================================
// UPDATE CLIENT
// ============================================================

export async function updateClientAction(
  id: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { supabase, user, profile } = await getClientFirmId()
    const raw = Object.fromEntries(formData)
    const parsed = ClientSchema.safeParse(raw)

    if (!parsed.success) {
      return {
        success: false,
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    const tags = parsed.data.tags
      ? parsed.data.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : []

    const { error } = await supabase
      .from('clients')
      .update({
        full_name: parsed.data.full_name,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        address: parsed.data.address || null,
        city: parsed.data.city || null,
        state: parsed.data.state || null,
        country: parsed.data.country || null,
        postal_code: parsed.data.postal_code || null,
        company_name: parsed.data.company_name || null,
        id_type: parsed.data.id_type || null,
        id_number: parsed.data.id_number || null,
        notes: parsed.data.notes || null,
        tags,
      })
      .eq('id', id)
      .eq('firm_id', profile.firm_id!)

    if (error) return { success: false, error: error.message }

    // Log activity
    await supabase.from('activity_logs').insert({
      firm_id: profile.firm_id!,
      user_id: user.id,
      action: 'update',
      entity_type: 'client',
      entity_id: id,
      entity_name: parsed.data.full_name,
      description: `Updated client ${parsed.data.full_name}`,
    })

    revalidatePath(`/clients/${id}`)
    revalidatePath('/clients')
  } catch (e) {
    return { success: false, error: 'An unexpected error occurred' }
  }
  redirect(`/clients/${id}`)
}

// ============================================================
// DELETE CLIENT
// ============================================================

export async function deleteClientAction(id: string): Promise<ActionResult> {
  try {
    const { supabase, user, profile } = await getClientFirmId()

    // Get client name first for logging
    const { data: client } = await supabase
      .from('clients')
      .select('full_name')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('firm_id', profile.firm_id!)

    if (error) return { success: false, error: error.message }

    await supabase.from('activity_logs').insert({
      firm_id: profile.firm_id!,
      user_id: user.id,
      action: 'delete',
      entity_type: 'client',
      entity_id: id,
      entity_name: client?.full_name,
      description: `Deleted client ${client?.full_name}`,
    })

    revalidatePath('/clients')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// ============================================================
// GRANT PORTAL ACCESS — Send Magic Link (Invite by Email)
// ============================================================

export async function inviteClientToPortalAction(
  clientId: string,
  email: string,
): Promise<ActionResult> {
  try {
    const { supabase, profile } = await getClientFirmId()

    // Verify client belongs to this firm
    const { data: client } = await supabase
      .from('clients')
      .select('id, full_name, email')
      .eq('id', clientId)
      .eq('firm_id', profile.firm_id!)
      .single()

    if (!client) return { success: false, error: 'Client not found' }

    const { createAdminClient } = await import('@/lib/supabase/server')
    const adminSupabase = await createAdminClient()

    // Check if a portal user already exists with this email
    const { data: existingList } = await adminSupabase.auth.admin.listUsers()
    const existingUser = existingList?.users?.find((u) => u.email === email)

    if (existingUser) {
      // Already has an account — just send a magic link
      const { error } = await adminSupabase.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/portal` },
      })
      if (error) return { success: false, error: error.message }
    } else {
      // Create new auth user with role = client
      const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
        email,
        email_confirm: false, // will be confirmed via magic link
        user_metadata: {
          full_name: client.full_name,
          role: 'client',
        },
      })
      if (createError) return { success: false, error: createError.message }

      // Update the auto-created profile to link it to this firm
      if (newUser?.user) {
        await adminSupabase
          .from('profiles')
          .update({ firm_id: profile.firm_id!, role: 'client' })
          .eq('id', newUser.user.id)
      }

      // Send invite / magic link
      const { error: linkError } = await adminSupabase.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/portal` },
      })
      if (linkError) return { success: false, error: linkError.message }
    }

    revalidatePath(`/clients/${clientId}`)
    return { success: true, data: { message: `Invite link sent to ${email}` } }
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'An unexpected error occurred' }
  }
}

// ============================================================
// GRANT PORTAL ACCESS — Set Password Manually
// ============================================================

export async function setClientPortalPasswordAction(
  clientId: string,
  email: string,
  password: string,
): Promise<ActionResult> {
  try {
    const { supabase, profile } = await getClientFirmId()

    const { data: client } = await supabase
      .from('clients')
      .select('id, full_name')
      .eq('id', clientId)
      .eq('firm_id', profile.firm_id!)
      .single()

    if (!client) return { success: false, error: 'Client not found' }

    const { createAdminClient } = await import('@/lib/supabase/server')
    const adminSupabase = await createAdminClient()

    // Check if user already exists
    const { data: existingList } = await adminSupabase.auth.admin.listUsers()
    const existingUser = existingList?.users?.find((u) => u.email === email)

    if (existingUser) {
      // Update the existing user's password
      const { error } = await adminSupabase.auth.admin.updateUserById(existingUser.id, { password })
      if (error) return { success: false, error: error.message }
    } else {
      // Create new auth user
      const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: client.full_name,
          role: 'client',
        },
      })
      if (createError) return { success: false, error: createError.message }

      // Link profile to firm
      if (newUser?.user) {
        await adminSupabase
          .from('profiles')
          .update({ firm_id: profile.firm_id!, role: 'client' })
          .eq('id', newUser.user.id)
      }
    }

    revalidatePath(`/clients/${clientId}`)
    return { success: true, data: { message: `Portal access granted for ${email}` } }
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'An unexpected error occurred' }
  }
}
