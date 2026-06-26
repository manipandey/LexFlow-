import { redirect } from 'next/navigation'
import { createClientAction } from '@/app/actions/clients'
import { ClientForm } from '@/components/clients/client-form'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Add Client' }

export default function NewClientPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" render={<Link href="/clients" />} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add New Client</h1>
          <p className="text-muted-foreground text-sm">Fill in the client&apos;s details below</p>
        </div>
      </div>
      <ClientForm onSubmitAction={createClientAction} />
    </div>
  )
}
