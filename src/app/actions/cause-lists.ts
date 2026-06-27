'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getCauseLists(dateStr?: string) {
  const supabase = await createClient()
  const date = dateStr || new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('court_cause_lists')
    .select('*')
    .eq('date', date)
    .order('bench_type', { ascending: true })
    .order('courtroom', { ascending: true })
    
  if (error) {
    console.error('Error fetching cause lists:', error)
    return []
  }
  
  return data || []
}

export async function triggerSyncAction() {
  const supabaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  try {
    const res = await fetch(`${supabaseUrl}/api/cron/sync-cause-list`, {
      method: 'GET'
    })
    const data = await res.json()
    revalidatePath('/cause-list')
    return { success: true, message: data.message }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
