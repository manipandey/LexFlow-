'use client'

import { useRouter } from 'next/navigation'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isToday, isSameDay, addMonths, subMonths, getDay,
} from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin } from 'lucide-react'
import { formatDate, formatStatusLabel } from '@/lib/utils'

interface HearingCalendarProps {
  hearings: any[]
  month: number
  year: number
}

const TYPE_COLORS: Record<string, string> = {
  hearing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  meeting: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  consultation: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function HearingCalendar({ hearings, month, year }: HearingCalendarProps) {
  const router = useRouter()
  const currentDate = new Date(year, month - 1, 1)
  const days = eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) })
  const firstDayOfWeek = getDay(days[0])

  function navigate(dir: 'prev' | 'next') {
    const next = dir === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1)
    router.push(`/hearings?month=${next.getMonth() + 1}&year=${next.getFullYear()}`)
  }

  function getHearingsForDay(day: Date) {
    return hearings.filter((h) => isSameDay(new Date(h.hearing_date), day))
  }

  return (
    <div className="space-y-4">
      {/* Calendar header */}
      <div className="flex items-center justify-between rounded-xl border bg-card px-5 py-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('prev')} id="prev-month-btn">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">{format(currentDate, 'MMMM yyyy')}</h2>
        <Button variant="ghost" size="icon" onClick={() => navigate('next')} id="next-month-btn">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-3 text-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {/* Empty cells for offset */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[90px] border-r border-b border-border/40 bg-muted/10 last:border-r-0" />
          ))}

          {days.map((day, i) => {
            const dayHearings = getHearingsForDay(day)
            const isCurrentDay = isToday(day)
            const col = (firstDayOfWeek + i) % 7
            const isLastCol = col === 6

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[90px] p-2 border-b border-border/40 ${!isLastCol ? 'border-r' : ''} ${isCurrentDay ? 'bg-primary/5' : ''}`}
              >
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium mb-1
                  ${isCurrentDay ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayHearings.slice(0, 2).map((h: any) => (
                    <div
                      key={h.id}
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium border truncate cursor-pointer
                        hover:opacity-80 transition-opacity ${TYPE_COLORS[h.hearing_type] ?? 'bg-muted text-muted-foreground border-border'}`}
                      title={h.title}
                    >
                      {h.start_time && <span className="mr-1">{h.start_time}</span>}
                      {h.title}
                    </div>
                  ))}
                  {dayHearings.length > 2 && (
                    <p className="text-[10px] text-muted-foreground pl-1">+{dayHearings.length - 2} more</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Events list below */}
      {hearings.length > 0 && (
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3">All Events This Month</h3>
          <div className="space-y-2">
            {hearings.map((h: any) => (
              <div key={h.id} className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors">
                <div className="shrink-0 text-center min-w-[40px]">
                  <p className="text-lg font-bold text-primary leading-none">{format(new Date(h.hearing_date), 'd')}</p>
                  <p className="text-[10px] text-muted-foreground">{format(new Date(h.hearing_date), 'EEE')}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{h.title}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[11px] text-muted-foreground">
                    {h.start_time && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{h.start_time}</span>}
                    {h.court_name && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{h.court_name}</span>}
                    {h.profiles && <span>⚖️ {h.profiles.full_name}</span>}
                    {h.cases && <span>📁 {h.cases.case_number}</span>}
                  </div>
                </div>
                <Badge variant="outline" className={`shrink-0 text-[10px] ${TYPE_COLORS[h.hearing_type] ?? ''}`}>
                  {h.hearing_type}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
