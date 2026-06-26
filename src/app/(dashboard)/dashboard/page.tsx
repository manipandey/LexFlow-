import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  getDashboardMetrics,
  getCasesByStatus,
  getCasesByType,
  getMonthlyClientGrowth,
  getRecentActivity,
  getUpcomingHearings,
} from '@/app/actions/dashboard'
import { MetricCard } from '@/components/dashboard/metric-card'
import { DashboardCharts } from '@/components/dashboard/charts'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { UpcomingHearings } from '@/components/dashboard/upcoming-hearings'
import {
  Users,
  Briefcase,
  CheckSquare,
  Calendar,
  DollarSign,
  UserCheck,
  Archive,
  AlertTriangle,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('firm_id')
    .eq('id', user.id)
    .single()

  const firmId = profile?.firm_id
  if (!firmId) redirect('/onboarding')

  // Parallel data fetching
  const [metrics, casesByStatus, casesByType, clientGrowth, activity, hearings] =
    await Promise.all([
      getDashboardMetrics(),
      getCasesByStatus(firmId),
      getCasesByType(firmId),
      getMonthlyClientGrowth(firmId),
      getRecentActivity(firmId),
      getUpcomingHearings(firmId),
    ])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Overview of your firm&apos;s operations
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Clients"
          value={metrics.totalClients.toLocaleString()}
          icon={Users}
          href="/clients"
          color="blue"
        />
        <MetricCard
          title="Active Cases"
          value={metrics.activeCases.toLocaleString()}
          icon={Briefcase}
          href="/cases"
          color="purple"
        />
        <MetricCard
          title="Closed Cases"
          value={metrics.closedCases.toLocaleString()}
          icon={Archive}
          href="/cases?status=closed"
          color="teal"
        />
        <MetricCard
          title="Monthly Revenue"
          value={formatCurrency(metrics.monthlyRevenue)}
          icon={DollarSign}
          href="/billing"
          color="gold"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Upcoming Hearings"
          value={metrics.upcomingHearings.toLocaleString()}
          subtitle="This week"
          icon={Calendar}
          href="/hearings"
          color="orange"
        />
        <MetricCard
          title="Pending Tasks"
          value={metrics.pendingTasks.toLocaleString()}
          icon={CheckSquare}
          href="/tasks"
          color="blue"
        />
        <MetricCard
          title="Overdue Tasks"
          value={metrics.overdueTasks.toLocaleString()}
          icon={AlertTriangle}
          href="/tasks?status=overdue"
          color="red"
          alert={metrics.overdueTasks > 0}
        />
        <MetricCard
          title="Team Members"
          value={metrics.teamMembers.toLocaleString()}
          icon={UserCheck}
          href="/team"
          color="teal"
        />
      </div>

      {/* Charts */}
      <DashboardCharts
        casesByStatus={casesByStatus}
        casesByType={casesByType}
        clientGrowth={clientGrowth}
      />

      {/* Bottom row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <UpcomingHearings hearings={hearings} />
        <RecentActivity activities={activity} />
      </div>
    </div>
  )
}
