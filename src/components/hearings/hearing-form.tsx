'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'
import type { ActionResult } from '@/types/database.types'
import { useEffect } from 'react'
import { NEPALI_COURTS } from '@/lib/constants'

interface HearingFormProps {
  action: (prevState: ActionResult, formData: FormData) => Promise<ActionResult>
  cases: { id: string; title: string; case_number: string }[]
  clients: { id: string; full_name: string }[]
  teamMembers: { id: string; full_name: string }[]
  defaultValues?: Record<string, any>
}

const initialState: ActionResult = { success: false }

export function HearingForm({ action, cases, clients, teamMembers, defaultValues }: HearingFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState)
  const router = useRouter()

  useEffect(() => {
    if (state.success) {
      router.push('/hearings')
    }
  }, [state.success, router])

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
        <h2 className="font-semibold">Event Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              defaultValue={defaultValues?.title}
              placeholder="e.g. Preliminary Hearing – Smith vs. Acme"
              required
            />
            {state.fieldErrors?.title && (
              <p className="text-xs text-destructive">{state.fieldErrors.title[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="hearing_type">
              Event Type <span className="text-destructive">*</span>
            </Label>
            <select
              id="hearing_type"
              name="hearing_type"
              defaultValue={defaultValues?.hearing_type ?? 'hearing'}
              required
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="hearing">Court Hearing</option>
              <option value="meeting">Meeting</option>
              <option value="consultation">Consultation</option>
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
              <option value="">Select lawyer</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>{m.full_name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="case_id">Related Case</Label>
            <select
              id="case_id"
              name="case_id"
              defaultValue={defaultValues?.case_id ?? ''}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">None</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>{c.case_number} – {c.title}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_id">Related Client</Label>
            <select
              id="client_id"
              name="client_id"
              defaultValue={defaultValues?.client_id ?? ''}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">None</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Date & Time */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Date & Time</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="hearing_date">
              Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="hearing_date"
              name="hearing_date"
              type="date"
              defaultValue={defaultValues?.hearing_date ?? ''}
              required
            />
            {state.fieldErrors?.hearing_date && (
              <p className="text-xs text-destructive">{state.fieldErrors.hearing_date[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="start_time">Start Time</Label>
            <Input
              id="start_time"
              name="start_time"
              type="time"
              defaultValue={defaultValues?.start_time ?? ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end_time">End Time</Label>
            <Input
              id="end_time"
              name="end_time"
              type="time"
              defaultValue={defaultValues?.end_time ?? ''}
            />
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Location</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="court_name">Court / Venue Name</Label>
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
            <Label htmlFor="location">Address / Room</Label>
            <Input
              id="location"
              name="location"
              defaultValue={defaultValues?.location ?? ''}
              placeholder="e.g. Room 4B, 200 W. Santa Ana Blvd"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Notes</h2>
        <div className="space-y-2">
          <Label htmlFor="notes">Internal Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={defaultValues?.notes ?? ''}
            placeholder="Any preparation notes, documents to bring, etc."
            rows={3}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending} className="gap-2" id="hearing-form-submit">
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Scheduling...
            </>
          ) : (
            'Schedule Event'
          )}
        </Button>
      </div>
    </form>
  )
}
