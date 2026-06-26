'use client'

import { useActionState, startTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClientAction } from '@/app/actions/clients'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert } from '@/components/ui/alert'
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import type { ActionResult, ClientRow } from '@/types/database.types'

interface ClientFormProps {
  defaultValues?: Partial<ClientRow>
  clientId?: string
  onSubmitAction: (prevState: ActionResult, formData: FormData) => Promise<ActionResult>
}

const initialState: ActionResult = { success: false }

export function ClientForm({ defaultValues, clientId, onSubmitAction }: ClientFormProps) {
  const [state, action, pending] = useActionState(onSubmitAction, initialState)

  return (
    <form action={action} className="space-y-6">
      {state.error && (
        <Alert className="border-destructive/50 bg-destructive/10 text-destructive flex items-start gap-2 py-3">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span className="text-sm">{state.error}</span>
        </Alert>
      )}

      {/* Basic Info */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Personal Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="full_name">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="full_name"
              name="full_name"
              defaultValue={defaultValues?.full_name}
              placeholder="Ram Sharma"
              required
            />
            {state.fieldErrors?.full_name && (
              <p className="text-xs text-destructive">{state.fieldErrors.full_name[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={defaultValues?.email ?? ''}
              placeholder="client@himalayanlegal.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={defaultValues?.phone ?? ''}
              placeholder="+977 9841000000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              id="company_name"
              name="company_name"
              defaultValue={defaultValues?.company_name ?? ''}
              placeholder="Himalayan Traders Pvt. Ltd."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="id_type">ID Type</Label>
            <select
              id="id_type"
              name="id_type"
              defaultValue={defaultValues?.id_type ?? ''}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select ID type</option>
              <option value="passport">Passport</option>
              <option value="national_id">National ID</option>
              <option value="drivers_license">Driver's License</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="id_number">ID / Passport Number</Label>
            <Input
              id="id_number"
              name="id_number"
              defaultValue={defaultValues?.id_number ?? ''}
              placeholder="27-01-79-12345"
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Address</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              name="address"
              defaultValue={defaultValues?.address ?? ''}
              placeholder="Maitighar, Ward No. 11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              name="city"
              defaultValue={defaultValues?.city ?? ''}
              placeholder="Kathmandu"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">State / Province</Label>
            <Input
              id="state"
              name="state"
              defaultValue={defaultValues?.state ?? ''}
              placeholder="Bagmati"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              name="country"
              defaultValue={defaultValues?.country ?? 'Nepal'}
              placeholder="Nepal"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="postal_code">Postal Code</Label>
            <Input
              id="postal_code"
              name="postal_code"
              defaultValue={defaultValues?.postal_code ?? ''}
              placeholder="44600"
            />
          </div>
        </div>
      </div>

      {/* Notes & Tags */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Additional Information</h2>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            name="tags"
            defaultValue={defaultValues?.tags?.join(', ')}
            placeholder="corporate, vip, family (comma-separated)"
          />
          <p className="text-xs text-muted-foreground">Separate tags with commas</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={defaultValues?.notes ?? ''}
            placeholder="Internal notes about this client..."
            rows={4}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link href={clientId ? `/clients/${clientId}` : '/clients'}>
          <Button variant="outline" type="button">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={pending} className="gap-2" id="client-form-submit">
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : clientId ? (
            'Save Changes'
          ) : (
            'Add Client'
          )}
        </Button>
      </div>
    </form>
  )
}
