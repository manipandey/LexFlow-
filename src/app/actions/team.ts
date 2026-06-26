'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { ActionResult } from '@/types/database.types'

async function getTeamFirmId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase.from('profiles').select('firm_id, role').eq('id', user.id).single()
  if (!profile?.firm_id) throw new Error('No firm')
  if (!['firm_owner', 'senior_lawyer'].includes(profile.role)) throw new Error('Insufficient permissions')
  return { supabase, user, profile, firmId: profile.firm_id }
}

export async function getTeamMembers() {
  const { supabase, profile } = await getTeamFirmId()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('firm_id', profile.firm_id!)
    .neq('role', 'client')
    .order('created_at', { ascending: true })
  return data ?? []
}

export async function inviteTeamMemberAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user, profile } = await getTeamFirmId()
    const email = formData.get('email') as string
    const role = formData.get('role') as string
    const fullName = formData.get('full_name') as string

    if (!email || !role) return { success: false, error: 'Email and role are required' }

    // Use admin client to invite user
    const adminClient = await createAdminClient()
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: fullName,
        firm_id: profile.firm_id,
        role,
        invited_by: user.id,
      },
    })

    if (inviteError) {
      if (inviteError.message.includes('already been registered')) {
        // User exists, just update their firm and role
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', (inviteData?.user as any)?.id ?? '')
          .single()

        if (existingProfile) {
          await supabase.from('profiles').update({ firm_id: profile.firm_id, role }).eq('id', existingProfile.id)
        }
      } else {
        return { success: false, error: inviteError.message }
      }
    }

    await supabase.from('activity_logs').insert({
      firm_id: profile.firm_id!, user_id: user.id, action: 'invite',
      entity_type: 'profile', entity_name: email,
      description: `Invited ${email} as ${role}`,
    })

    revalidatePath('/team')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Failed to send invitation' }
  }
}

export async function updateMemberRoleAction(memberId: string, role: string): Promise<ActionResult> {
  try {
    const { supabase, profile } = await getTeamFirmId()
    await supabase.from('profiles').update({ role }).eq('id', memberId).eq('firm_id', profile.firm_id!)
    revalidatePath('/team')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to update role' }
  }
}

export async function suspendMemberAction(memberId: string, suspended: boolean): Promise<ActionResult> {
  try {
    const { supabase, user, profile } = await getTeamFirmId()
    if (memberId === user.id) return { success: false, error: 'You cannot suspend yourself' }
    await supabase.from('profiles').update({ is_active: !suspended }).eq('id', memberId).eq('firm_id', profile.firm_id!)
    revalidatePath('/team')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to update member status' }
  }
}
