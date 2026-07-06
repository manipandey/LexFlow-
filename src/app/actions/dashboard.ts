'use server'

import { createClient } from '@/lib/supabase/server'
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns'
import type { DashboardMetrics } from '@/types/database.types'
// Retrieves the slug of the firm
export async function getFirmSlug(firmId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data: firm } = await supabase
    .from('firms')
    .select('slug')
    .eq('id', firmId)
    .single()

  return firm?.slug ?? null
}

export async function getDashboardMetrics(firmId: string): Promise<DashboardMetrics> {
  const supabase = await createClient()


  // Run all queries in parallel
  const [
    clientsResult,
    activeCasesResult,
    closedCasesResult,
    upcomingHearingsResult,
    pendingTasksResult,
    overdueTasksResult,
    teamResult,
    revenueResult,
  ] = await Promise.all([
    supabase.from('clients').select('id', { count: 'exact', head: true }).eq('firm_id', firmId).eq('is_active', true),
    supabase.from('cases').select('id', { count: 'exact', head: true }).eq('firm_id', firmId).neq('status', 'closed'),
    supabase.from('cases').select('id', { count: 'exact', head: true }).eq('firm_id', firmId).eq('status', 'closed'),
    supabase.from('hearings').select('id', { count: 'exact', head: true })
      .eq('firm_id', firmId)
      .eq('is_completed', false)
      .gte('hearing_date', format(new Date(), 'yyyy-MM-dd'))
      .lte('hearing_date', format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')),
    supabase.from('tasks').select('id', { count: 'exact', head: true })
      .eq('firm_id', firmId)
      .in('status', ['pending', 'in_progress']),
    supabase.from('tasks').select('id', { count: 'exact', head: true })
      .eq('firm_id', firmId)
      .eq('status', 'overdue'),
    supabase.from('profiles').select('id', { count: 'exact', head: true })
      .eq('firm_id', firmId)
      .neq('role', 'client')
      .eq('is_active', true),
    supabase.from('invoices').select('paid_amount')
      .eq('firm_id', firmId)
      .eq('status', 'paid')
      .gte('payment_date', format(startOfMonth(new Date()), 'yyyy-MM-dd'))
      .lte('payment_date', format(endOfMonth(new Date()), 'yyyy-MM-dd')),
  ])

  const monthlyRevenue = (revenueResult.data ?? []).reduce(
    (sum, inv) => sum + Number(inv.paid_amount),
    0
  )

  return {
    totalClients: clientsResult.count ?? 0,
    activeCases: activeCasesResult.count ?? 0,
    closedCases: closedCasesResult.count ?? 0,
    upcomingHearings: upcomingHearingsResult.count ?? 0,
    pendingTasks: pendingTasksResult.count ?? 0,
    overdueTasks: overdueTasksResult.count ?? 0,
    teamMembers: teamResult.count ?? 0,
    monthlyRevenue,
  }
}

export async function getCasesByStatus(firmId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('cases')
    .select('status')
    .eq('firm_id', firmId)

  if (!data) return []

  const counts = data.reduce((acc: Record<string, number>, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1
    return acc
  }, {})

  return Object.entries(counts).map(([name, value]) => ({ name, value }))
}

export async function getCasesByType(firmId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('cases')
    .select('case_type')
    .eq('firm_id', firmId)

  if (!data) return []

  const counts = data.reduce((acc: Record<string, number>, c) => {
    acc[c.case_type] = (acc[c.case_type] ?? 0) + 1
    return acc
  }, {})

  return Object.entries(counts).map(([name, value]) => ({ name, value }))
}

export async function getMonthlyClientGrowth(firmId: string) {
  const supabase = await createClient()
  const months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), 5 - i))

  const results = await Promise.all(
    months.map(async (month) => {
      const { count } = await supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('firm_id', firmId)
        .gte('created_at', format(startOfMonth(month), 'yyyy-MM-dd'))
        .lte('created_at', format(endOfMonth(month), 'yyyy-MM-dd'))
      return {
        month: format(month, 'MMM'),
        clients: count ?? 0,
      }
    })
  )
  return results
}

export async function getRecentActivity(firmId: string, limit = 10) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('activity_logs')
    .select('*, profiles(full_name, avatar_url)')
    .eq('firm_id', firmId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return data ?? []
}

export async function getUpcomingHearings(firmId: string, limit = 5) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('hearings')
    .select('*, cases(title, case_number), clients(full_name), profiles(full_name)')
    .eq('firm_id', firmId)
    .eq('is_completed', false)
    .gte('hearing_date', format(new Date(), 'yyyy-MM-dd'))
    .order('hearing_date', { ascending: true })
    .limit(limit)
  return data ?? []
}
