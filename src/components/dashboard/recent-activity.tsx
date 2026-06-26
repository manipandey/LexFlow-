import Link from 'next/link'
import { formatRelativeTime, formatHearingDate, getInitials } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Clock,
  FileText,
  Briefcase,
  Users,
  Upload,
  LogIn,
  Pencil,
  Trash2,
} from 'lucide-react'

interface ActivityItem {
  id: string
  action: string
  entity_type: string
  entity_name: string | null
  description: string | null
  created_at: string
  profiles: { full_name: string; avatar_url: string | null } | null
}

interface RecentActivityProps {
  activities: ActivityItem[]
}

const ACTION_ICONS: Record<string, React.ElementType> = {
  create: FileText,
  update: Pencil,
  delete: Trash2,
  upload: Upload,
  login: LogIn,
  invite: Users,
  view: Clock,
}

const ENTITY_COLORS: Record<string, string> = {
  case: 'bg-purple-500/10 text-purple-400',
  client: 'bg-blue-500/10 text-blue-400',
  document: 'bg-teal-500/10 text-teal-400',
  invoice: 'bg-amber-500/10 text-amber-400',
  task: 'bg-orange-500/10 text-orange-400',
  hearing: 'bg-cyan-500/10 text-cyan-400',
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Recent Activity</h3>
        <Link
          href="/audit-logs"
          className="text-xs text-primary hover:underline"
        >
          View all
        </Link>
      </div>

      {activities.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          No recent activity
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => {
            const Icon = ACTION_ICONS[activity.action] ?? Clock
            const entityColor = ENTITY_COLORS[activity.entity_type] ?? 'bg-muted text-muted-foreground'

            return (
              <div key={activity.id} className="flex items-start gap-3">
                <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                  <AvatarImage src={activity.profiles?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                    {getInitials(activity.profiles?.full_name ?? 'U')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground/90 leading-snug">
                    <span className="font-medium">{activity.profiles?.full_name ?? 'System'}</span>{' '}
                    {activity.description ?? `${activity.action}d ${activity.entity_type}`}
                    {activity.entity_name && (
                      <span className="font-medium"> "{activity.entity_name}"</span>
                    )}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatRelativeTime(activity.created_at)}
                  </p>
                </div>
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${entityColor}`}>
                  <Icon className="h-3 w-3" />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
