import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getInvoiceById } from '@/app/actions/billing'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { InvoiceActions } from '@/components/billing/invoice-actions'
import { ArrowLeft, FileText, User, Briefcase, Calendar } from 'lucide-react'
import { formatDate, formatCurrency, getStatusColor, formatStatusLabel } from '@/lib/utils'
import type { Metadata } from 'next'

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: InvoiceDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const invoice = await getInvoiceById(id).catch(() => null)
  return { title: invoice?.invoice_number ?? 'Invoice' }
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const invoice = await getInvoiceById(id).catch(() => null) as any
  if (!invoice) notFound()

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" render={<Link href="/billing" />} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
              {invoice.invoice_number}
            </span>
            <Badge variant="outline" className={getStatusColor(invoice.status)}>
              {formatStatusLabel(invoice.status)}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold">Invoice</h1>
        </div>
        <InvoiceActions invoice={invoice} />
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Client', value: invoice.clients?.full_name, icon: User },
          { label: 'Case', value: invoice.cases?.case_number ?? '—', icon: Briefcase },
          { label: 'Issue Date', value: formatDate(invoice.issue_date), icon: Calendar },
          { label: 'Due Date', value: formatDate(invoice.due_date), icon: Calendar },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </div>
            <p className="font-semibold truncate">{item.value ?? '—'}</p>
          </div>
        ))}
      </div>

      {/* Client Details */}
      {invoice.clients && (
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold mb-3">Bill To</h2>
          <div className="text-sm space-y-0.5 text-muted-foreground">
            <p className="font-semibold text-foreground">{invoice.clients.full_name}</p>
            {invoice.clients.email && <p>{invoice.clients.email}</p>}
            {invoice.clients.phone && <p>{invoice.clients.phone}</p>}
            {invoice.clients.address && <p>{invoice.clients.address}</p>}
            {(invoice.clients.city || invoice.clients.state) && (
              <p>{[invoice.clients.city, invoice.clients.state].filter(Boolean).join(', ')}</p>
            )}
          </div>
        </div>
      )}

      {/* Line Items */}
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr>
              <th className="text-left font-medium text-muted-foreground px-5 py-3">Description</th>
              <th className="text-right font-medium text-muted-foreground px-5 py-3">Qty</th>
              <th className="text-right font-medium text-muted-foreground px-5 py-3">Unit Price</th>
              <th className="text-right font-medium text-muted-foreground px-5 py-3">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {(invoice.invoice_items ?? []).map((item: any) => (
              <tr key={item.id}>
                <td className="px-5 py-3">{item.description}</td>
                <td className="px-5 py-3 text-right text-muted-foreground">{item.quantity}</td>
                <td className="px-5 py-3 text-right text-muted-foreground">
                  {formatCurrency(item.unit_price, invoice.currency)}
                </td>
                <td className="px-5 py-3 text-right font-medium">
                  {formatCurrency(item.amount, invoice.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="border-t bg-muted/10 px-5 py-4 space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
          </div>
          {invoice.tax_rate > 0 && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Tax ({invoice.tax_rate}%)</span>
              <span>{formatCurrency(invoice.tax_amount, invoice.currency)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base border-t pt-2">
            <span>Total</span>
            <span>{formatCurrency(invoice.total_amount, invoice.currency)}</span>
          </div>
          {invoice.paid_amount > 0 && (
            <div className="flex justify-between text-sm text-green-400">
              <span>Paid</span>
              <span>{formatCurrency(invoice.paid_amount, invoice.currency)}</span>
            </div>
          )}
          {invoice.status !== 'paid' && invoice.paid_amount > 0 && (
            <div className="flex justify-between text-sm font-semibold text-orange-400 border-t pt-2">
              <span>Balance Due</span>
              <span>{formatCurrency(invoice.total_amount - invoice.paid_amount, invoice.currency)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold mb-2">Notes</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{invoice.notes}</p>
        </div>
      )}

      {/* Payment info */}
      {invoice.payment_date && (
        <div className="rounded-xl border bg-green-500/10 border-green-500/20 p-4 text-sm text-green-400">
          ✓ Paid on {formatDate(invoice.payment_date)}
        </div>
      )}
    </div>
  )
}
