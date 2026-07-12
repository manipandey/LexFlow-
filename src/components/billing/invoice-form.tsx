'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createInvoiceAction } from '@/app/actions/billing'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert } from '@/components/ui/alert'
import { Loader2, AlertCircle, Plus, Trash2 } from 'lucide-react'
import { NepaliDatePicker } from '@/components/ui/nepali-date-picker'

interface LineItem {
  description: string
  quantity: number
  unit_price: number
}

interface InvoiceFormProps {
  clients: { id: string; full_name: string }[]
  cases: { id: string; title: string; case_number: string }[]
}

export function InvoiceForm({ clients, cases }: InvoiceFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [items, setItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unit_price: 0 },
  ])
  const [taxRate, setTaxRate] = useState(0)

  function addItem() {
    setItems((prev) => [...prev, { description: '', quantity: 1, unit_price: 0 }])
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateItem(idx: number, field: keyof LineItem, value: string | number) {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0)
  const taxAmount = (subtotal * taxRate) / 100
  const total = subtotal + taxAmount

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const validItems = items.filter((i) => i.description.trim())
    if (validItems.length === 0) {
      setError('Add at least one line item with a description')
      return
    }

    const formData = new FormData(e.currentTarget)
    formData.set('items', JSON.stringify(validItems))

    startTransition(async () => {
      const result = await createInvoiceAction({ success: false }, formData)
      if (!result.success) {
        setError(result.error ?? 'Failed to create invoice')
      } else {
        const data = result.data as { id?: string } | undefined
        router.push(data?.id ? `/billing/${data.id}` : '/billing')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert className="border-destructive/50 bg-destructive/10 text-destructive flex items-start gap-2 py-3">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span className="text-sm">{error}</span>
        </Alert>
      )}

      {/* Client & Case */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Invoice For</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="client_id">
              Client <span className="text-destructive">*</span>
            </Label>
            <select
              id="client_id"
              name="client_id"
              required
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="case_id">Related Case (optional)</Label>
            <select
              id="case_id"
              name="case_id"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">None</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>{c.case_number} – {c.title}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">Due Date</Label>
            <NepaliDatePicker
              id="due_date"
              name="due_date"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <select
              id="currency"
              name="currency"
              defaultValue="NPR"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="USD">USD – US Dollar</option>
              <option value="EUR">EUR – Euro</option>
              <option value="GBP">GBP – British Pound</option>
              <option value="CAD">CAD – Canadian Dollar</option>
              <option value="AUD">AUD – Australian Dollar</option>
              <option value="INR">INR – Indian Rupee</option>
              <option value="NPR">NPR – Nepalese Rupee</option>
            </select>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Line Items</h2>
          <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-2">
            <Plus className="h-3.5 w-3.5" />
            Add Item
          </Button>
        </div>

        <div className="space-y-3">
          {/* Header row */}
          <div className="grid grid-cols-[1fr_80px_110px_40px] gap-3 text-xs text-muted-foreground px-1">
            <span>Description</span>
            <span>Qty</span>
            <span>Unit Price</span>
            <span></span>
          </div>

          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_80px_110px_40px] gap-3 items-start">
              <Input
                placeholder="Description of service"
                value={item.description}
                onChange={(e) => updateItem(idx, 'description', e.target.value)}
                required={idx === 0}
              />
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={item.quantity}
                onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
              />
              <Input
                type="number"
                min="0"
                step="0.01"
                value={item.unit_price}
                onChange={(e) => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeItem(idx)}
                disabled={items.length === 1}
                className="text-muted-foreground hover:text-destructive h-9 w-9"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Tax Rate (%)</span>
              <Input
                name="tax_rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                className="w-20 h-7 text-xs"
              />
            </div>
            <span className="font-medium">{formatCurrency(taxAmount)}</span>
          </div>
          <div className="flex justify-between text-base font-bold border-t pt-2">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Notes</h2>
        <div className="space-y-2">
          <Label htmlFor="notes">Notes to Client</Label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Payment terms, bank details, or any other notes..."
            rows={3}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending} className="gap-2" id="invoice-form-submit">
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating Invoice...
            </>
          ) : (
            'Create Invoice'
          )}
        </Button>
      </div>
    </form>
  )
}
