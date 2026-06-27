'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'
import type { ActionResult } from '@/types/database.types'
import { NEPALI_COURTS } from '@/lib/constants'
import { formatNepaliDate } from '@/lib/utils'

interface CaseFormProps {
  action: (prevState: ActionResult, formData: FormData) => Promise<ActionResult>
  clients: { id: string; full_name: string }[]
  teamMembers: { id: string; full_name: string; role: string }[]
  defaultValues?: Record<string, any>
  isEditing?: boolean
}

const initialState: ActionResult = { success: false }

const CASE_TYPES = [
  { value: 'civil', label: 'Civil' },
  { value: 'criminal', label: 'Criminal' },
  { value: 'family', label: 'Family' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'property', label: 'Property' },
  { value: 'employment', label: 'Employment' },
  { value: 'immigration', label: 'Immigration' },
  { value: 'intellectual_property', label: 'Intellectual Property' },
  { value: 'tax', label: 'Tax' },
  { value: 'other', label: 'Other' },
]

export function CaseForm({ action, clients, teamMembers, defaultValues, isEditing }: CaseFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState)
  const [dateInput, setDateInput] = useState(defaultValues?.filing_date ?? '')

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <Alert className="border-destructive/50 bg-destructive/10 text-destructive flex items-start gap-2 py-3">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span className="text-sm">{state.error}</span>
        </Alert>
      )}

      {/* Core Details */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Case Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="title">
              Case Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              defaultValue={defaultValues?.title}
              placeholder="e.g. Smith vs. Acme Corporation"
              required
            />
            {state.fieldErrors?.title && (
              <p className="text-xs text-destructive">{state.fieldErrors.title[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_id">
              Client <span className="text-destructive">*</span>
            </Label>
            <select
              id="client_id"
              name="client_id"
              defaultValue={defaultValues?.client_id ?? ''}
              required
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select a client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
            {state.fieldErrors?.client_id && (
              <p className="text-xs text-destructive">{state.fieldErrors.client_id[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="case_type">
              Case Type <span className="text-destructive">*</span>
            </Label>
            <select
              id="case_type"
              name="case_type"
              defaultValue={defaultValues?.case_type ?? 'civil'}
              required
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {CASE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_lawyer_id">Assigned Lawyer</Label>
            <select
              id="assigned_lawyer_id"
              name="assigned_lawyer_id"
              defaultValue={defaultValues?.assigned_lawyer_id ?? ''}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Unassigned</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>{m.full_name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <select
              id="priority"
              name="priority"
              defaultValue={defaultValues?.priority ?? 'medium'}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Court & Filing */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Court & Filing Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="court_name">Court Name</Label>
            <Input
              id="court_name"
              name="court_name"
              list="nepali-courts"
              defaultValue={defaultValues?.court_name ?? ''}
              placeholder="e.g. Supreme Court of Nepal"
            />
            <datalist id="nepali-courts">
              {NEPALI_COURTS.map((court) => (
                <option key={court} value={court} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filing_date">Filing Date</Label>
            <Input
              id="filing_date"
              name="filing_date"
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
            />
            {dateInput && (
              <p className="text-[11px] text-primary/80 font-medium">B.S.: {formatNepaliDate(dateInput)}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimated_value">Estimated Case Value ($)</Label>
            <Input
              id="estimated_value"
              name="estimated_value"
              type="number"
              step="0.01"
              min="0"
              defaultValue={defaultValues?.estimated_value ?? ''}
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      {/* Description & Notes */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Additional Information</h2>
        <div className="space-y-2">
          <Label htmlFor="description">Case Description</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={defaultValues?.description ?? ''}
            placeholder="Brief description of the case..."
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Internal Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={defaultValues?.notes ?? ''}
            placeholder="Internal notes visible only to your team..."
            rows={3}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending} className="gap-2" id="case-form-submit">
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {isEditing ? 'Saving...' : 'Creating Case...'}
            </>
          ) : (
            isEditing ? 'Save Changes' : 'Create Case'
          )}
        </Button>
      </div>
    </form>
  )
}
