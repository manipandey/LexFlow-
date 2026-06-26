import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getCaseById, updateCaseAction } from '@/app/actions/cases'
import { CaseForm } from '@/components/cases/case-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

interface EditCasePageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: EditCasePageProps): Promise<Metadata> {
  const { id } = await params
  const caseData = await getCaseById(id).catch(() => null)
  return { title: caseData ? `Edit – ${caseData.title}` : 'Edit Case' }
}

export default async function EditCasePage({ params }: EditCasePageProps) {
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

  const [caseData, { data: clients }, { data: teamMembers }] = await Promise.all([
    getCaseById(id).catch(() => null),
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

  if (!caseData) notFound()

  const boundAction = updateCaseAction.bind(null, id)

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" render={<Link href={`/cases/${id}`} />} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Case</h1>
          <p className="text-muted-foreground text-sm font-mono">{(caseData as any).case_number}</p>
        </div>
      </div>

      <CaseForm
        action={boundAction}
        clients={clients ?? []}
        teamMembers={teamMembers ?? []}
        defaultValues={caseData as any}
        isEditing
      />
    </div>
  )
}
