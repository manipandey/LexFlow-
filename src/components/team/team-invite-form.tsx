'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'
import type { ActionResult } from '@/types/database.types'

interface TeamInviteFormProps {
  action: (prevState: ActionResult, formData: FormData) => Promise<ActionResult>
}

const initialState: ActionResult = { success: false }

export function TeamInviteForm({ action }: TeamInviteFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState)
  const router = useRouter()

  useEffect(() => {
    if (state.success) {
      router.push('/team')
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

      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">
            Email Address <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="colleague@firm.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="full_name">
            Full Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="full_name"
            name="full_name"
            placeholder="John Doe"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">
            Role <span className="text-destructive">*</span>
          </Label>
          <select
            id="role"
            name="role"
            required
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="lawyer">Advocate</option>
            <option value="senior_lawyer">Senior Advocate</option>
            <option value="paralegal">Legal Assistant / Pleader</option>
            <option value="receptionist">Receptionist / Clerk</option>
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            This defines what the user is allowed to access and manage.
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/team')}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={pending} className="gap-2">
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            'Send Invitation'
          )}
        </Button>
      </div>
    </form>
  )
}
