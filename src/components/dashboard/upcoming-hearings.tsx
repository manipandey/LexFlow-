import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, User, Clock } from 'lucide-react'

interface HearingItem {
  id: string
  title: string
  hearing_type: string
  hearing_date: string
  start_time: string | null
  court_name: string | null
  cases: { title: string; case_number: string } | null
  clients: { full_name: string } | null
  profiles: { full_name: string } | null
}

interface UpcomingHearingsProps {
  hearings: HearingItem[]
}

const TYPE_COLORS: Record<string, string> = {
  hearing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  meeting: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  consultation: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
}

export function UpcomingHearings({ hearings }: UpcomingHearingsProps) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Upcoming Hearings</h3>
        <Link href="/hearings" className="text-xs text-primary hover:underline">
          View calendar
        </Link>
      </div>

      {hearings.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          No upcoming hearings
        </div>
      ) : (
        <div className="space-y-3">
          {hearings.map((hearing) => (
            <Link
              key={hearing.id}
              href={`/hearings/${hearing.id}`}
              className="block rounded-lg border border-border/50 p-3 hover:bg-muted/50 hover:border-border transition-all duration-150"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{hearing.title}</p>
                  {hearing.cases && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {hearing.cases.case_number} · {hearing.cases.title}
                    </p>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] shrink-0 ${TYPE_COLORS[hearing.hearing_type] ?? ''}`}
                >
                  {hearing.hearing_type}
                </Badge>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(hearing.hearing_date)}
                </span>
                {hearing.start_time && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {hearing.start_time}
                  </span>
                )}
                {hearing.court_name && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {hearing.court_name}
                  </span>
                )}
                {hearing.profiles && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {hearing.profiles.full_name}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
