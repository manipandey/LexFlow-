import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getInvoices } from '@/app/actions/billing'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate, formatCurrency, getStatusColor, formatStatusLabel } from '@/lib/utils'
import { Plus, FileText } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Billing' }

interface BillingPageProps {
  searchParams: Promise<{ status?: string; page?: string }>
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const { data: invoices, total } = await getInvoices({ status: params.status, page: Number(params.page ?? 1) })

  // Summary stats
  const totalOutstanding = invoices.filter((i: any) => i.status === 'sent' || i.status === 'overdue').reduce((s: number, i: any) => s + Number(i.total_amount) - Number(i.paid_amount), 0)
  const totalPaid = invoices.filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + Number(i.paid_amount), 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground text-sm mt-1">{total} invoice{total !== 1 ? 's' : ''}</p>
        </div>
        <Button render={<Link href="/billing/new" id="new-invoice-btn" />}>
          <>
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </>
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Outstanding</p>
          <p className="text-3xl font-bold text-orange-400 mt-1">{formatCurrency(totalOutstanding)}</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Collected (shown)</p>
          <p className="text-3xl font-bold text-green-400 mt-1">{formatCurrency(totalPaid)}</p>
        </div>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 flex-wrap">
        {['', 'draft', 'sent', 'paid', 'overdue', 'canceled'].map((s) => (
          <Link
            key={s}
            href={`/billing${s ? `?status=${s}` : ''}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              params.status === s || (!params.status && !s)
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:border-foreground/30'
            }`}
          >
            {s ? formatStatusLabel(s) : 'All'}
          </Link>
        ))}
      </div>

      {/* Invoice table */}
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr>
              <th className="text-left font-medium text-muted-foreground px-4 py-3">Invoice</th>
              <th className="text-left font-medium text-muted-foreground px-4 py-3">Client</th>
              <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Due Date</th>
              <th className="text-right font-medium text-muted-foreground px-4 py-3">Amount</th>
              <th className="text-left font-medium text-muted-foreground px-4 py-3">Status</th>
              <th className="text-right font-medium text-muted-foreground px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                  No invoices found.{' '}
                  <Link href="/billing/new" className="text-primary hover:underline">Create first invoice</Link>
                </td>
              </tr>
            ) : (
              invoices.map((invoice: any) => (
                <tr key={invoice.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium font-mono text-xs">{invoice.invoice_number}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{invoice.clients?.full_name}</p>
                      {invoice.cases && <p className="text-xs text-muted-foreground">{invoice.cases.case_number}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {formatDate(invoice.due_date)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatCurrency(invoice.total_amount)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={`text-[10px] ${getStatusColor(invoice.status)}`}>
                      {formatStatusLabel(invoice.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" render={<Link href={`/billing/${invoice.id}`} />}>
                      <>View</>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
