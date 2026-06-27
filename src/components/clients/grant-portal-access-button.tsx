'use client'

import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { GrantPortalAccessModal } from './grant-portal-access-modal'

interface GrantPortalAccessButtonProps {
  clientId: string
  clientName: string
  clientEmail?: string | null
}

export function GrantPortalAccessButton({
  clientId,
  clientName,
  clientEmail,
}: GrantPortalAccessButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        id="grant-portal-access-btn"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-all"
      >
        <ShieldCheck className="h-4 w-4" />
        Grant Portal Access
      </button>
      {open && (
        <GrantPortalAccessModal
          clientId={clientId}
          clientName={clientName}
          clientEmail={clientEmail}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
