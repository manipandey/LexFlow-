import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getClientWithRelations } from '@/app/actions/clients'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft, Pencil, Mail, Phone, MapPin, Building2,
  Briefcase, FileText, CreditCard, User,
} from 'lucide-react'
import { formatDate, formatCurrency, getStatusColor, formatStatusLabel } from '@/lib/utils'
import type { Metadata } from 'next'

interface ClientDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ClientDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const { client } = await getClientWithRelations(id).catch(() => ({ client: null, cases: [], documents: [], invoices: [] }))
  return { title: client?.full_name ?? 'Client' }
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { client, cases, documents, invoices } = await getClientWithRelations(id).catch(() => ({
    client: null, cases: [], documents: [], invoices: [],
  }))

  if (!client) notFound()

  const c = client as any

  const totalBilled = invoices.reduce((s: number, inv: any) => s + Number(inv.total_amount), 0)
  const totalPaid = invoices.filter((i: any) => i.status === 'paid').reduce((s: number, inv: any) => s + Number(inv.paid_amount), 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" render={<Link href="/clients" />} className="shrink-0 mt-1">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {c.is_active ? (
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px]">Active</Badge>
            ) : (
              <Badge variant="outline" className="bg-slate-500/10 text-slate-400 border-slate-500/20 text-[10px]">Inactive</Badge>
            )}
            {c.tags?.map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-[10px] py-0">{tag}</Badge>
            ))}
          </div>
          <h1 className="text-2xl font-bold">{c.full_name}</h1>
          {c.company_name && (
            <p className="text-muted-foreground text-sm flex items-center gap-1.5 mt-1">
              <Building2 className="h-3.5 w-3.5" />
              {c.company_name}
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" render={<Link href={`/clients/${id}/edit`} />}>
          <>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </>
        </Button>
      </div>

      {/* Contact & Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {c.email && (
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Mail className="h-3.5 w-3.5" /> Email
            </div>
            <a href={`mailto:${c.email}`} className="font-medium text-sm text-primary hover:underline truncate block">
              {c.email}
            </a>
          </div>
        )}
        {c.phone && (
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Phone className="h-3.5 w-3.5" /> Phone
            </div>
            <a href={`tel:${c.phone}`} className="font-medium text-sm text-primary hover:underline truncate block">
              {c.phone}
            </a>
          </div>
        )}
        {(c.city || c.state) && (
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <MapPin className="h-3.5 w-3.5" /> Location
            </div>
            <p className="font-medium text-sm truncate">
              {[c.city, c.state, c.country].filter(Boolean).join(', ')}
            </p>
          </div>
        )}
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <User className="h-3.5 w-3.5" /> Client Since
          </div>
          <p className="font-medium text-sm">{formatDate(c.created_at)}</p>
        </div>
      </div>

      {/* Billing Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Cases</p>
          <p className="text-2xl font-bold mt-1">{cases.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Billed</p>
          <p className="text-2xl font-bold mt-1 text-primary">{formatCurrency(totalBilled)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Collected</p>
          <p className="text-2xl font-bold mt-1 text-green-400">{formatCurrency(totalPaid)}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="cases" className="w-full">
        <TabsList>
          <TabsTrigger value="cases">
            <Briefcase className="mr-1.5 h-3.5 w-3.5" />
            Cases ({cases.length})
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            Documents ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="invoices">
            <CreditCard className="mr-1.5 h-3.5 w-3.5" />
            Invoices ({invoices.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cases" className="mt-4">
          <div className="space-y-2">
            {cases.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No cases for this client.</p>
            ) : (
              cases.map((cas: any) => (
                <Link
                  key={cas.id}
                  href={`/cases/${cas.id}`}
                  className="flex items-center gap-3 rounded-lg border bg-card p-3 hover:bg-muted/30 transition-colors"
                >
                  <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{cas.case_number}</span>
                      <Badge variant="outline" className={`text-[10px] py-0 ${getStatusColor(cas.status)}`}>
                        {formatStatusLabel(cas.status)}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium mt-0.5 truncate">{cas.title}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{formatDate(cas.created_at)}</span>
                </Link>
              ))
            )}
            <div className="pt-2">
              <Button variant="outline" size="sm" render={<Link href={`/cases/new`} />}>
                <>+ New Case for {c.full_name}</>
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <div className="space-y-2">
            {documents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No documents for this client.</p>
            ) : (
              documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatStatusLabel(doc.category)} · {formatDate(doc.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div className="pt-2">
              <Button variant="outline" size="sm" render={<Link href={`/documents/upload?client=${id}`} />}>
                <>Upload Document</>
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="mt-4">
          <div className="space-y-2">
            {invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No invoices for this client.</p>
            ) : (
              invoices.map((inv: any) => (
                <Link
                  key={inv.id}
                  href={`/billing/${inv.id}`}
                  className="flex items-center gap-3 rounded-lg border bg-card p-3 hover:bg-muted/30 transition-colors"
                >
                  <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{inv.invoice_number}</span>
                      <Badge variant="outline" className={`text-[10px] py-0 ${getStatusColor(inv.status)}`}>
                        {formatStatusLabel(inv.status)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Due {formatDate(inv.due_date)}</p>
                  </div>
                  <span className="font-semibold text-sm shrink-0">{formatCurrency(inv.total_amount)}</span>
                </Link>
              ))
            )}
            <div className="pt-2">
              <Button variant="outline" size="sm" render={<Link href={`/billing/new`} />}>
                <>+ New Invoice</>
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Notes */}
      {c.notes && (
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold mb-2">Notes</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{c.notes}</p>
        </div>
      )}

      {/* ID Info */}
      {(c.id_type || c.id_number) && (
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold mb-3">Identification</h2>
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            {c.id_type && (
              <div>
                <p className="text-xs text-muted-foreground">ID Type</p>
                <p className="font-medium capitalize">{c.id_type.replace('_', ' ')}</p>
              </div>
            )}
            {c.id_number && (
              <div>
                <p className="text-xs text-muted-foreground">ID Number</p>
                <p className="font-medium font-mono">{c.id_number}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
