'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { markInvoicePaidAction, updateInvoiceStatusAction } from '@/app/actions/billing'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronDown, CheckCircle, Send, XCircle, Loader2 } from 'lucide-react'

interface InvoiceActionsProps {
  invoice: {
    id: string
    status: string
    total_amount: number
    paid_amount: number
    currency: string
  }
}

export function InvoiceActions({ invoice }: InvoiceActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showPayDialog, setShowPayDialog] = useState(false)
  const [payAmount, setPayAmount] = useState(
    (invoice.total_amount - invoice.paid_amount).toFixed(2)
  )

  function handleStatusChange(status: string) {
    startTransition(async () => {
      await updateInvoiceStatusAction(invoice.id, status)
      router.refresh()
    })
  }

  function handleMarkPaid() {
    startTransition(async () => {
      await markInvoicePaidAction(invoice.id, parseFloat(payAmount) || invoice.total_amount)
      setShowPayDialog(false)
      router.refresh()
    })
  }

  return (
    <>
      <div className="flex items-center gap-2 shrink-0">
        {invoice.status !== 'paid' && invoice.status !== 'canceled' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPayDialog(true)}
            disabled={isPending}
            className="gap-2"
            id="mark-paid-btn"
          >
            <CheckCircle className="h-3.5 w-3.5 text-green-400" />
            Mark Paid
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" disabled={isPending} id="invoice-actions-btn" />}>
            <>
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Actions'}
              <ChevronDown className="ml-1 h-3.5 w-3.5" />
            </>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {invoice.status === 'draft' && (
              <DropdownMenuItem onClick={() => handleStatusChange('sent')}>
                <Send className="mr-2 h-3.5 w-3.5" />
                Mark as Sent
              </DropdownMenuItem>
            )}
            {invoice.status !== 'canceled' && invoice.status !== 'paid' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => handleStatusChange('canceled')}
                >
                  <XCircle className="mr-2 h-3.5 w-3.5" />
                  Cancel Invoice
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mark Paid Dialog */}
      {showPayDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-xl space-y-4 mx-4">
            <h3 className="text-lg font-semibold">Record Payment</h3>
            <div className="space-y-2">
              <Label htmlFor="pay-amount">Amount Received</Label>
              <Input
                id="pay-amount"
                type="number"
                step="0.01"
                min="0"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowPayDialog(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button onClick={handleMarkPaid} disabled={isPending} className="gap-2">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Record Payment
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
