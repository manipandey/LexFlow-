import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getClientById, updateClientAction } from '@/app/actions/clients'
import { ClientForm } from '@/components/clients/client-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

interface EditClientPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: EditClientPageProps): Promise<Metadata> {
  const { id } = await params
  const client = await getClientById(id).catch(() => null)
  return { title: client ? `Edit – ${client.full_name}` : 'Edit Client' }
}

export default async function EditClientPage({ params }: EditClientPageProps) {
  const { id } = await params

  const client = await getClientById(id).catch(() => null)
  if (!client) notFound()

  const boundAction = updateClientAction.bind(null, id)

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" render={<Link href={`/clients/${id}`} />} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Client</h1>
          <p className="text-muted-foreground text-sm">{client.full_name}</p>
        </div>
      </div>

      <ClientForm
        defaultValues={client}
        clientId={id}
        onSubmitAction={boundAction}
      />
    </div>
  )
}
