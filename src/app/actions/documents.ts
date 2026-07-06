'use server'

import { createClient, createAdminClient, getCurrentProfile } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { ActionResult } from '@/types/database.types'

async function getDocFirmId() {
  const result = await getCurrentProfile()
  if (!result || !result.user) throw new Error('Unauthorized')
  if (!result.firmId) throw new Error('No firm')
  return { supabase: result.supabase, user: result.user, profile: result.profile, firmId: result.firmId }
}

export async function getDocuments({ caseId, clientId, category }: {
  caseId?: string; clientId?: string; category?: string
} = {}) {
  const { supabase, profile } = await getDocFirmId()
  let query = supabase.from('documents').select('*, profiles!documents_uploaded_by_fkey(full_name)').eq('firm_id', profile.firm_id!).order('created_at', { ascending: false })
  if (caseId) query = query.eq('case_id', caseId)
  if (clientId) query = query.eq('client_id', clientId)
  if (category) query = query.eq('category', category)
  const { data } = await query
  return data ?? []
}

export async function uploadDocumentAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase, user, profile } = await getDocFirmId()
    const file = formData.get('file') as File
    const caseId = formData.get('case_id') as string | null
    const clientId = formData.get('client_id') as string | null
    const category = (formData.get('category') as string) || 'other'
    const description = formData.get('description') as string | null
    const isShared = formData.get('is_shared_with_client') === 'true'

    if (!file || file.size === 0) return { success: false, error: 'No file provided' }

    const ext = file.name.split('.').pop()
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const filePath = `${profile.firm_id}/${category}/${safeName}`

    const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    })

    if (uploadError) return { success: false, error: uploadError.message }

    const { data: doc, error: dbError } = await supabase.from('documents').insert({
      firm_id: profile.firm_id!,
      case_id: caseId || null,
      client_id: clientId || null,
      uploaded_by: user.id,
      name: file.name,
      original_name: file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      category,
      description: description || null,
      is_shared_with_client: isShared,
    }).select('id').single()

    if (dbError) {
      await supabase.storage.from('documents').remove([filePath])
      return { success: false, error: dbError.message }
    }

    await supabase.from('activity_logs').insert({
      firm_id: profile.firm_id!, user_id: user.id, action: 'upload',
      entity_type: 'document', entity_id: doc.id, entity_name: file.name,
      description: `Uploaded document: ${file.name}`,
    })

    revalidatePath('/documents')
    if (caseId) revalidatePath(`/cases/${caseId}`)
    return { success: true, data: { id: doc.id } }
  } catch (e) {
    return { success: false, error: 'Upload failed' }
  }
}

export async function getDocumentSignedUrl(filePath: string): Promise<string | null> {
  const { supabase } = await getDocFirmId()
  const { data } = await supabase.storage.from('documents').createSignedUrl(filePath, 3600)
  return data?.signedUrl ?? null
}

export async function deleteDocumentAction(id: string, filePath: string): Promise<ActionResult> {
  try {
    const { supabase, user, profile } = await getDocFirmId()
    await supabase.storage.from('documents').remove([filePath])
    await supabase.from('documents').delete().eq('id', id).eq('firm_id', profile.firm_id!)
    await supabase.from('activity_logs').insert({
      firm_id: profile.firm_id!, user_id: user.id, action: 'delete',
      entity_type: 'document', entity_id: id, description: 'Deleted document',
    })
    revalidatePath('/documents')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to delete document' }
  }
}
