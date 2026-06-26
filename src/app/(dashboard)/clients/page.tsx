import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getClients } from '@/app/actions/clients'
import { ClientsTable } from '@/components/clients/client-table'
import { Button } from '@/components/ui/button'
import { UserPlus } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Clients' }

interface ClientsPageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    status?: string
  }>
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const page = Number(params.page ?? 1)
  const search = params.search
  const status = params.status

  const { data: clients, total } = await getClients({ page, pageSize: 20, search, status })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {total.toLocaleString()} total client{total !== 1 ? 's' : ''}
          </p>
        </div>
        <Button render={<Link href="/clients/new" id="add-client-btn" />}>
          <>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Client
          </>
        </Button>
      </div>

      <ClientsTable
        clients={clients}
        total={total}
        page={page}
        pageSize={20}
        initialSearch={search}
        initialStatus={status}
      />
    </div>
  )
}
