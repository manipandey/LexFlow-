'use client'

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { formatStatusLabel } from '@/lib/utils'

interface DashboardChartsProps {
  casesByStatus: { name: string; value: number }[]
  casesByType: { name: string; value: number }[]
  clientGrowth: { month: string; clients: number }[]
}

const STATUS_COLORS: Record<string, string> = {
  open: '#3b82f6',
  under_review: '#f59e0b',
  filed: '#8b5cf6',
  hearing_scheduled: '#f97316',
  in_progress: '#06b6d4',
  awaiting_decision: '#6366f1',
  closed: '#64748b',
}

const CHART_COLORS = [
  '#3b82f6', '#14b8a6', '#f59e0b', '#8b5cf6', '#f43f5e',
  '#06b6d4', '#10b981', '#f97316', '#6366f1', '#ec4899',
]

export function DashboardCharts({
  casesByStatus,
  casesByType,
  clientGrowth,
}: DashboardChartsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Cases by Status — Donut */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="text-sm font-semibold mb-4">Cases by Status</h3>
        {casesByStatus.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            No cases yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={casesByStatus}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {casesByStatus.map((entry, i) => (
                  <Cell
                    key={entry.name}
                    fill={STATUS_COLORS[entry.name] ?? CHART_COLORS[i % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value, name) => [value, formatStatusLabel(name as string)]}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
        {/* Legend */}
        <div className="mt-2 space-y-1">
          {casesByStatus.slice(0, 5).map((entry, i) => (
            <div key={entry.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ background: STATUS_COLORS[entry.name] ?? CHART_COLORS[i] }}
                />
                <span className="text-muted-foreground">{formatStatusLabel(entry.name)}</span>
              </div>
              <span className="font-medium">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cases by Type — Bar */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="text-sm font-semibold mb-4">Cases by Type</h3>
        {casesByType.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            No cases yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={casesByType} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="name"
                tickFormatter={(v) => v.split('_')[0]}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value, name) => [value, formatStatusLabel(name as string)]}
              />
              <Bar dataKey="value" name="Cases" radius={[4, 4, 0, 0]}>
                {casesByType.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Client Growth — Area */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="text-sm font-semibold mb-4">Client Growth (6 months)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={clientGrowth} margin={{ left: -20 }}>
            <defs>
              <linearGradient id="clientGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Area
              type="monotone"
              dataKey="clients"
              name="New Clients"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#clientGradient)"
              dot={{ fill: '#3b82f6', r: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
