'use client'

import { useRouter } from 'next/navigation'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Badge } from '@/components/ui/badge'
import { Clock, MapPin, Gavel } from 'lucide-react'
import { formatNepaliDate, formatStatusLabel, getNepaliMonthRange } from '@/lib/utils'
import { updateHearingDateAction } from '@/app/actions/hearings'
import { toast } from 'sonner'
import { format } from 'date-fns'
import NepaliDate from 'nepali-date-converter'

interface HearingCalendarProps {
  hearings: any[]
  month: number
  year: number
}

const TYPE_COLORS: Record<string, string> = {
  hearing: '#3b82f6', // blue-500
  meeting: '#10b981', // emerald-500
  consultation: '#14b8a6', // teal-500
  deadline: '#ef4444', // red-500
  filing: '#a855f7', // purple-500
  client_meeting: '#f97316', // orange-500
}

const TYPE_BADGE_COLORS: Record<string, string> = {
  hearing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  meeting: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  consultation: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  deadline: 'bg-red-500/20 text-red-400 border-red-500/30',
  filing: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  client_meeting: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
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

export function HearingCalendar({ hearings, month, year }: HearingCalendarProps) {
  const router = useRouter()
  
  const initialDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
  const nepaliMonthRange = getNepaliMonthRange(year, month)
  const englishMonthYear = format(new Date(year, month - 1, 1), 'MMMM yyyy')

  const events = hearings.map(h => {
    let start = h.hearing_date
    if (h.start_time) {
      start += `T${h.start_time}`
    }
    return {
      id: h.id,
      title: h.title,
      start,
      backgroundColor: TYPE_COLORS[h.hearing_type] || '#64748b',
      borderColor: 'transparent',
      extendedProps: { ...h }
    }
  })

  const handleEventDrop = async (info: any) => {
    const id = info.event.id
    const newDate = format(info.event.start, 'yyyy-MM-dd')
    
    // Optimistic UI updates are handled by FullCalendar internally
    const result = await updateHearingDateAction(id, newDate)
    if (!result.success) {
      info.revert() // Revert the drag if server fails
      toast.error('Failed to update event date')
    } else {
      toast.success('Event date updated successfully')
    }
  }

  const handleDatesSet = (arg: any) => {
    const currentMonth = arg.view.currentStart.getMonth() + 1
    const currentYear = arg.view.currentStart.getFullYear()
    if (currentMonth !== month || currentYear !== year) {
      router.push(`/hearings?month=${currentMonth}&year=${currentYear}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Interactive Drag & Drop Calendar */}
      <div className="rounded-xl border bg-card p-5 calendar-container">
        <style>{`
          .fc-theme-standard .fc-scrollgrid { border: none; }
          .fc-theme-standard td, .fc-theme-standard th { border-color: hsl(var(--border) / 0.4); }
          .fc .fc-toolbar-title { display: none; }
          .fc .fc-button-primary { 
            background-color: hsl(var(--primary)); 
            border-color: hsl(var(--primary));
            text-transform: capitalize;
          }
          .fc .fc-button-primary:hover { background-color: hsl(var(--primary) / 0.9); }
          .fc .fc-daygrid-day.fc-day-today { background-color: hsl(var(--primary) / 0.05); }
          .fc-event { cursor: pointer; padding: 2px 4px; font-size: 11px; border-radius: 4px; }
        `}</style>

        {/* Custom Header Title with Nepali Month Focus */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-border/40">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-baseline gap-2">
              <span className="text-2xl text-primary">{nepaliMonthRange}</span>
              <span className="text-sm font-normal text-muted-foreground">({englishMonthYear})</span>
            </h2>
          </div>
          <div className="text-xs text-muted-foreground font-medium bg-muted/50 px-2.5 py-1 rounded-md self-start sm:self-auto">
            🇳🇵 Bikram Sambat (B.S.) Calendar Active
          </div>
        </div>

        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          initialDate={initialDate}
          events={events}
          editable={true} // Enables Drag & Drop
          droppable={true}
          eventDrop={handleEventDrop}
          datesSet={handleDatesSet}
          eventClick={(info) => {
            router.push(`/hearings/${info.event.id}`)
          }}
          headerToolbar={{
            left: 'prev,next today',
            center: '', // Empty because we render our title above!
            right: 'dayGridMonth,dayGridWeek'
          }}
          dayCellContent={(arg) => {
            try {
              const nd = new NepaliDate(arg.date)
              const nepaliDay = nd.format('D', 'np') // e.g. "२८"
              const englishDay = arg.date.getDate() // e.g. 12
              return (
                <div className="flex flex-col items-center justify-center w-full h-full py-1">
                  <span className="text-base font-bold text-foreground leading-tight select-none">{nepaliDay}</span>
                  <span className="text-[10px] text-muted-foreground/75 leading-none select-none font-normal">{englishDay}</span>
                </div>
              )
            } catch (e) {
              return arg.dayNumberText
            }
          }}
          dayHeaderContent={(arg) => {
            const daysInNepali = ['आइत', 'सोम', 'मंगल', 'बुध', 'बिही', 'शुक्र', 'शनि']
            return daysInNepali[arg.date.getDay()]
          }}
          height="auto"
        />
      </div>

      {/* Events List */}
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
                  <p className="text-[10px] text-muted-foreground mt-0.5">B.S.: {formatNepaliDate(h.hearing_date)}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[11px] text-muted-foreground">
                    {h.start_time && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{h.start_time}</span>}
                    {h.court_name && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{h.court_name}</span>}
                    {h.bench && <span className="flex items-center gap-1"><Gavel className="h-3 w-3" />{h.bench}</span>}
                    {h.profiles && <span>⚖️ {h.profiles.full_name}</span>}
                    {h.cases && <span>📁 {h.cases.case_number}</span>}
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-end shrink-0">
                  <Badge variant="outline" className={`text-[10px] ${TYPE_BADGE_COLORS[h.hearing_type] ?? ''}`}>
                    {h.hearing_type}
                  </Badge>
                  {h.hearing_status && (
                    <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[h.hearing_status] ?? ''}`}>
                      {STATUS_LABELS[h.hearing_status] ?? h.hearing_status}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
