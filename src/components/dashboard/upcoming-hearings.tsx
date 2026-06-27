import Link from 'next/link'
import { formatDate, formatNepaliDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, User, Clock, Gavel } from 'lucide-react'

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
  hearing_status?: string
  bench?: string | null
}

interface UpcomingHearingsProps {
  hearings: HearingItem[]
}

const TYPE_COLORS: Record<string, string> = {
  hearing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  meeting: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  consultation: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  sthagit: 'bg-red-500/10 text-red-400 border-red-500/20',
  herna_nabhyayeko: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  adesh: 'bg-green-500/10 text-green-400 border-green-500/20',
  faisala: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Peshi Tayar',
  sthagit: 'Sthagit',
  herna_nabhyayeko: 'Herna Nabhyayeko',
  adesh: 'Adesh',
  faisala: 'Faisala',
}

export function UpcomingHearings({ hearings }: UpcomingHearingsProps) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Upcoming Hearings (Peshi)</h3>
        <Link href="/hearings" className="text-xs text-primary hover:underline">
          View calendar
        </Link>
      </div>

      {hearings.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          No upcoming peshi
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
                <div className="flex flex-col gap-1 items-end shrink-0">
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${TYPE_COLORS[hearing.hearing_type] ?? ''}`}
                  >
                    {hearing.hearing_type}
                  </Badge>
                  {hearing.hearing_status && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${STATUS_COLORS[hearing.hearing_status] ?? ''}`}
                    >
                      {STATUS_LABELS[hearing.hearing_status] ?? hearing.hearing_status}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1 font-medium text-foreground/80">
                  <Calendar className="h-3 w-3" />
                  {formatNepaliDate(hearing.hearing_date)} B.S. ({formatDate(hearing.hearing_date)})
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
                {hearing.bench && (
                  <span className="flex items-center gap-1">
                    <Gavel className="h-3 w-3" />
                    {hearing.bench}
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
