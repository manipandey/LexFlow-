import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getHearings } from '@/app/actions/hearings'
import { HearingCalendar } from '@/components/hearings/calendar'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Hearings' }

interface HearingsPageProps {
  searchParams: Promise<{ month?: string; year?: string }>
}

export default async function HearingsPage({ searchParams }: HearingsPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const now = new Date()
  const month = params.month ? Number(params.month) : now.getMonth() + 1
  const year = params.year ? Number(params.year) : now.getFullYear()

  const hearings = await getHearings({ month, year })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hearings & Calendar</h1>
          <p className="text-muted-foreground text-sm mt-1">{hearings.length} event{hearings.length !== 1 ? 's' : ''} this month</p>
        </div>
        <Button render={<Link href="/hearings/new" id="schedule-hearing-btn" />}>
          <>
            <Plus className="mr-2 h-4 w-4" />
            Schedule Hearing
          </>
        </Button>
      </div>
      <HearingCalendar hearings={hearings} month={month} year={year} />
    </div>
  )
}
