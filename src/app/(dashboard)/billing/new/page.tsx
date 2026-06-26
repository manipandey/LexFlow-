import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { InvoiceForm } from '@/components/billing/invoice-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'New Invoice' }

export default async function NewInvoicePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('firm_id')
    .eq('id', user.id)
    .single()

  if (!profile?.firm_id) redirect('/onboarding')

  const [{ data: clients }, { data: cases }] = await Promise.all([
    supabase
      .from('clients')
      .select('id, full_name')
      .eq('firm_id', profile.firm_id)
      .eq('is_active', true)
      .order('full_name', { ascending: true }),
    supabase
      .from('cases')
      .select('id, title, case_number')
      .eq('firm_id', profile.firm_id)
      .neq('status', 'closed')
      .order('created_at', { ascending: false }),
  ])

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" render={<Link href="/billing" />} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Invoice</h1>
          <p className="text-muted-foreground text-sm">Create a new invoice for a client</p>
        </div>
      </div>

      <InvoiceForm clients={clients ?? []} cases={cases ?? []} />
    </div>
  )
}
