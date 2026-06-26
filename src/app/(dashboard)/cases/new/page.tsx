import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createCaseAction } from '@/app/actions/cases'
import { CaseForm } from '@/components/cases/case-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'New Case' }

export default async function NewCasePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('firm_id')
    .eq('id', user.id)
    .single()

  if (!profile?.firm_id) redirect('/onboarding')

  // Fetch clients and team members for the dropdowns
  const [{ data: clients }, { data: teamMembers }] = await Promise.all([
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
  ])

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" render={<Link href="/cases" />} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Open New Case</h1>
          <p className="text-muted-foreground text-sm">Fill in the case details below</p>
        </div>
      </div>

      <CaseForm
        action={createCaseAction}
        clients={clients ?? []}
        teamMembers={teamMembers ?? []}
      />
    </div>
  )
}
