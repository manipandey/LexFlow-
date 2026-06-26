'use client'

import { useActionState, useState, useEffect } from 'react'
import { createFirmAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'
import { Scale, Loader2, AlertCircle, Building2, CheckCircle2 } from 'lucide-react'
import { slugify } from '@/lib/utils'
import type { ActionResult } from '@/types/database.types'
import type { Metadata } from 'next'

const initialState: ActionResult = { success: false }

export default function OnboardingPage() {
  const [state, action, pending] = useActionState(createFirmAction, initialState)
  const [firmName, setFirmName] = useState('')
  const [slug, setSlug] = useState('')
  const [debugInfo, setDebugInfo] = useState('Loading...')

  useEffect(() => {
    fetch('/api/diagnostic')
      .then(r => r.json())
      .then(data => setDebugInfo(JSON.stringify(data, null, 2)))
      .catch(e => setDebugInfo('Error: ' + e.message))
  }, [])

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value
    setFirmName(name)
    if (!slug || slug === slugify(firmName)) {
      setSlug(slugify(name))
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-lg animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg mx-auto mb-4 glow-blue">
            <Scale className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Welcome to LexFlow</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Let&apos;s set up your law firm workspace. This only takes a minute.
          </p>
        </div>

        {state.error && (
          <Alert className="border-destructive/50 bg-destructive/10 text-destructive flex items-start gap-2 py-3 mb-6">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="text-sm">{state.error}</span>
          </Alert>
        )}

        <div className="mb-6 p-4 bg-muted/30 border border-muted rounded-xl text-xs overflow-auto max-h-48 font-mono whitespace-pre-wrap break-all">
          <p className="font-bold text-destructive mb-2">DEBUG INFO (Please screenshot this or copy-paste it!):</p>
          <div id="debug-info">{debugInfo}</div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <form action={action} className="space-y-5">
            {/* Firm Name */}
            <div className="space-y-2">
              <Label htmlFor="firm_name">
                Firm Name <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="firm_name"
                  name="firm_name"
                  value={firmName}
                  onChange={handleNameChange}
                  placeholder="Sterling & Associates Law Firm"
                  className="pl-9"
                  required
                />
              </div>
              {state.fieldErrors?.firm_name && (
                <p className="text-xs text-destructive">{state.fieldErrors.firm_name[0]}</p>
              )}
            </div>

            {/* Slug (Workspace URL) */}
            <div className="space-y-2">
              <Label htmlFor="slug">Workspace URL <span className="text-destructive">*</span></Label>
              <div className="flex items-center rounded-md border border-input overflow-hidden">
                <span className="bg-muted px-3 py-2 text-sm text-muted-foreground border-r border-input whitespace-nowrap">
                  lexflow.app/
                </span>
                <input
                  id="slug"
                  name="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="sterling-associates"
                  className="flex-1 bg-transparent px-3 py-2 text-sm outline-none"
                  required
                />
              </div>
              {state.fieldErrors?.slug && (
                <p className="text-xs text-destructive">{state.fieldErrors.slug[0]}</p>
              )}
            </div>

            {/* Optional fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" name="phone" type="tel" placeholder="+1 555 000 0000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City (optional)</Label>
                <Input id="city" name="city" placeholder="New York" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State (optional)</Label>
                <Input id="state" name="state" placeholder="NY" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country (optional)</Label>
                <Input id="country" name="country" defaultValue="US" />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full gap-2"
              disabled={pending || !firmName || !slug}
              id="create-firm-btn"
            >
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating your workspace...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Create Workspace & Continue
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Your 14-day free trial starts now. No credit card required.
        </p>
      </div>
    </div>
  )
}
