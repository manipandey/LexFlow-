import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createHearingAction } from '@/app/actions/hearings'
import { HearingForm } from '@/components/hearings/hearing-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Schedule Hearing' }

export default async function NewHearingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('firm_id')
    .eq('id', user.id)
    .single()

  if (!profile?.firm_id) redirect('/onboarding')

  const [{ data: cases }, { data: clients }, { data: teamMembers }] = await Promise.all([
    supabase
      .from('cases')
      .select('id, title, case_number')
      .eq('firm_id', profile.firm_id)
      .neq('status', 'closed')
      .order('created_at', { ascending: false }),
    supabase
      .from('clients')
      .select('id, full_name')
      .eq('firm_id', profile.firm_id)
      .eq('is_active', true)
      .order('full_name', { ascending: true }),
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('firm_id', profile.firm_id)
      .neq('role', 'client')
      .order('full_name', { ascending: true }),
  ])

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" render={<Link href="/hearings" />} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Schedule Hearing</h1>
          <p className="text-muted-foreground text-sm">Add a court hearing, meeting, or consultation</p>
        </div>
      </div>

      <HearingForm
        action={createHearingAction}
        cases={cases ?? []}
        clients={clients ?? []}
        teamMembers={teamMembers ?? []}
      />
    </div>
  )
}
