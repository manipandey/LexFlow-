'use server'

import { createClient } from '@/lib/supabase/server'

export async function getClientDashboardData() {
  const supabase = await createClient()

  // Because RLS policies are in place for the 'client' role, we can simply query the tables.
  // Supabase will automatically restrict the rows returned to only those belonging to this client.

  const [
    { data: cases, error: casesError },
    { data: hearings, error: hearingsError },
    { data: invoices, error: invoicesError },
    { data: documents, error: docsError },
  ] = await Promise.all([
    // Fetch their cases
    supabase
      .from('cases')
      .select('id, case_number, title, status, court_name, priority')
      .order('created_at', { ascending: false }),

    // Fetch upcoming hearings
    supabase
      .from('hearings')
      .select('id, title, hearing_date, start_time, court_name, hearing_status, bench, cases(case_number)')
      .gte('hearing_date', new Date().toISOString().split('T')[0])
      .order('hearing_date', { ascending: true })
      .limit(5),

    // Fetch outstanding invoices
    supabase
      .from('invoices')
      .select('id, invoice_number, status, due_date, total_amount, currency')
      .neq('status', 'paid')
      .order('due_date', { ascending: true }),
      
    // Fetch recently shared documents
    supabase
      .from('documents')
      .select('id, name, created_at, cases(case_number)')
      .eq('is_shared_with_client', true)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  if (casesError) console.error('Error fetching cases:', casesError)
  if (hearingsError) console.error('Error fetching hearings:', hearingsError)
  if (invoicesError) console.error('Error fetching invoices:', invoicesError)
  if (docsError) console.error('Error fetching docs:', docsError)

  return {
    cases: cases || [],
    upcomingHearings: hearings || [],
    invoices: invoices || [],
    recentDocuments: documents || [],
  }
}
