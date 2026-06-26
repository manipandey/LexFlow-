'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { registerAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'
import { Loader2, Mail, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react'
import type { ActionResult } from '@/types/database.types'

const initialState: ActionResult = { success: false }

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerAction, initialState)

  if (state.success) {
    return (
      <div className="animate-fade-in space-y-4 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <h2 className="text-xl font-bold">Check your email</h2>
        <p className="text-muted-foreground text-sm">
          We sent a verification link to your email. Click it to activate your account 
          and set up your law firm.
        </p>
        <Link href="/login">
          <Button variant="outline" className="w-full">Back to login</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
        <p className="text-muted-foreground text-sm">
          Start your 14-day free trial. No credit card required.
        </p>
      </div>

      {state.error && (
        <Alert className="border-destructive/50 bg-destructive/10 text-destructive flex items-start gap-2 py-3">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span className="text-sm">{state.error}</span>
        </Alert>
      )}

      <form action={action} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="full_name"
              name="full_name"
              type="text"
              placeholder="James Sterling"
              className="pl-9"
              required
              autoComplete="name"
              aria-describedby={state.fieldErrors?.full_name ? 'name-error' : undefined}
            />
          </div>
          {state.fieldErrors?.full_name && (
            <p id="name-error" className="text-xs text-destructive">
              {state.fieldErrors.full_name[0]}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@lawfirm.com"
              className="pl-9"
              required
              autoComplete="email"
              aria-describedby={state.fieldErrors?.email ? 'reg-email-error' : undefined}
            />
          </div>
          {state.fieldErrors?.email && (
            <p id="reg-email-error" className="text-xs text-destructive">
              {state.fieldErrors.email[0]}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Min. 8 characters"
              className="pl-9"
              required
              autoComplete="new-password"
              aria-describedby={state.fieldErrors?.password ? 'pass-error' : undefined}
            />
          </div>
          {state.fieldErrors?.password && (
            <p id="pass-error" className="text-xs text-destructive">
              {state.fieldErrors.password[0]}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full gap-2" disabled={pending} id="register-submit-btn">
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            'Create free account'
          )}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        By creating an account, you agree to our{' '}
        <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
        {' '}and{' '}
        <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
      </p>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
