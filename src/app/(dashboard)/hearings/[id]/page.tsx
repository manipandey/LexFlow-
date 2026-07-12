import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getHearingById, updateHearingAction } from '@/app/actions/hearings'
import { HearingForm } from '@/components/hearings/hearing-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

interface EditHearingPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: EditHearingPageProps): Promise<Metadata> {
  const { id } = await params
  const hearing = await getHearingById(id).catch(() => null)
  return { title: hearing ? `Hearing Details – ${hearing.title}` : 'Hearing Details' }
}

export default async function EditHearingPage({ params }: EditHearingPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('firm_id')
    .eq('id', user.id)
    .single()

  if (!profile?.firm_id) redirect('/onboarding')

  const [hearing, { data: clients }, { data: teamMembers }, { data: cases }] = await Promise.all([
    getHearingById(id).catch(() => null),
    supabase
      .from('clients')
      .select('id, full_name')
      .eq('firm_id', profile.firm_id)
      .eq('is_active', true)
      .order('full_name', { ascending: true }),
    supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('firm_id', profile.firm_id)
      .neq('role', 'client')
      .order('full_name', { ascending: true }),
    supabase
      .from('cases')
      .select('id, title, case_number')
      .eq('firm_id', profile.firm_id)
      .order('case_number', { ascending: true })
  ])

  if (!hearing) notFound()

  const boundAction = updateHearingAction.bind(null, id)

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" render={<Link href="/hearings" />} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hearing Outcome & Details</h1>
          <p className="text-muted-foreground text-sm">Update hearing details, room/location, or record final status.</p>
        </div>
      </div>

      <HearingForm
        action={boundAction}
        cases={cases ?? []}
        clients={clients ?? []}
        teamMembers={teamMembers ?? []}
        defaultValues={hearing}
      />
    </div>
  )
}
