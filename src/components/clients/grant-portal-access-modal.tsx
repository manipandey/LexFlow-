'use client'

import { useState, useTransition } from 'react'
import { KeyRound, Mail, Eye, EyeOff, ShieldCheck, Loader2, X, Copy, Check } from 'lucide-react'
import { inviteClientToPortalAction, setClientPortalPasswordAction } from '@/app/actions/clients'

interface GrantPortalAccessModalProps {
  clientId: string
  clientName: string
  clientEmail?: string | null
  onClose: () => void
}

type Tab = 'invite' | 'password'

export function GrantPortalAccessModal({
  clientId,
  clientName,
  clientEmail,
  onClose,
}: GrantPortalAccessModalProps) {
  const [tab, setTab] = useState<Tab>('invite')
  const [isPending, startTransition] = useTransition()

  // Invite tab state
  const [inviteEmail, setInviteEmail] = useState(clientEmail ?? '')
  const [inviteResult, setInviteResult] = useState<{ success: boolean; message: string } | null>(null)

  // Password tab state
  const [passEmail, setPassEmail] = useState(clientEmail ?? '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passResult, setPassResult] = useState<{ success: boolean; message: string } | null>(null)
  const [copied, setCopied] = useState(false)

  function generatePassword() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!'
    let pw = ''
    for (let i = 0; i < 12; i++) pw += chars[Math.floor(Math.random() * chars.length)]
    setPassword(pw)
    setShowPassword(true)
  }

  async function copyPassword() {
    await navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteResult(null)
    startTransition(async () => {
      const res = await inviteClientToPortalAction(clientId, inviteEmail)
      setInviteResult({
        success: res.success,
        message: res.success
          ? (res.data as any)?.message ?? 'Magic link sent!'
          : res.error ?? 'Something went wrong',
      })
    })
  }

  function handleSetPassword(e: React.FormEvent) {
    e.preventDefault()
    setPassResult(null)
    if (password.length < 8) {
      setPassResult({ success: false, message: 'Password must be at least 8 characters' })
      return
    }
    startTransition(async () => {
      const res = await setClientPortalPasswordAction(clientId, passEmail, password)
      setPassResult({
        success: res.success,
        message: res.success
          ? (res.data as any)?.message ?? 'Portal access granted!'
          : res.error ?? 'Something went wrong',
      })
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl animate-fade-in"
        style={{ background: 'hsl(var(--card))' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Grant Portal Access</p>
              <p className="text-xs text-muted-foreground truncate max-w-[220px]">{clientName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4">
          <button
            onClick={() => setTab('invite')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === 'invite'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted/40'
            }`}
          >
            <Mail className="h-4 w-4" />
            Invite by Email
          </button>
          <button
            onClick={() => setTab('password')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === 'password'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted/40'
            }`}
          >
            <KeyRound className="h-4 w-4" />
            Set Password
          </button>
        </div>

        {/* Tab Content */}
        <div className="px-6 py-5">
          {tab === 'invite' && (
            <form onSubmit={handleInvite} className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                We'll send the client a <strong>magic link</strong> to their email. They click it and
                are instantly logged into the Client Portal — no password needed.
              </p>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Client Email</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="client@example.com"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {inviteResult && (
                <div
                  className={`rounded-lg px-3 py-2.5 text-sm ${
                    inviteResult.success
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}
                >
                  {inviteResult.message}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                {isPending ? 'Sending...' : 'Send Magic Link'}
              </button>
            </form>
          )}

          {tab === 'password' && (
            <form onSubmit={handleSetPassword} className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Manually set a password for the client. Share the credentials with them via phone or
                secure message. They can change it later from their portal settings.
              </p>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Client Email</label>
                <input
                  type="email"
                  required
                  value={passEmail}
                  onChange={(e) => setPassEmail(e.target.value)}
                  placeholder="client@example.com"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="text-xs text-primary hover:underline"
                  >
                    Generate strong password
                  </button>
                  {password && (
                    <button
                      type="button"
                      onClick={copyPassword}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      {copied ? (
                        <><Check className="h-3 w-3 text-green-400" /> Copied!</>
                      ) : (
                        <><Copy className="h-3 w-3" /> Copy</>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {passResult && (
                <div
                  className={`rounded-lg px-3 py-2.5 text-sm ${
                    passResult.success
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}
                >
                  {passResult.message}
                  {passResult.success && (
                    <div className="mt-2 font-mono text-xs bg-black/20 rounded px-2 py-1.5 flex items-center gap-2">
                      <span className="text-muted-foreground">Email:</span> {passEmail}
                      <br />
                      <span className="text-muted-foreground">Password:</span> {password}
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}
                {isPending ? 'Granting Access...' : 'Grant Portal Access'}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5">
          <p className="text-[11px] text-muted-foreground text-center">
            Portal URL:{' '}
            <span className="font-mono text-primary">
              {process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/portal
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
