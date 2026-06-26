'use client'

import { useState, useActionState } from 'react'
import { addCaseUpdateAction } from '@/app/actions/cases'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { getInitials, formatRelativeTime, formatStatusLabel } from '@/lib/utils'
import { Clock, FileText, ArrowUpDown, MessageSquare, Loader2 } from 'lucide-react'
import type { ActionResult } from '@/types/database.types'

interface TimelineEntry {
  id: string
  update_type: string
  title: string | null
  content: string
  old_value: string | null
  new_value: string | null
  created_at: string
  profiles: { full_name: string; avatar_url: string | null } | null
}

interface CaseTimelineProps {
  caseId: string
  updates: TimelineEntry[]
  currentUserId: string
}

const initialState: ActionResult = { success: false }

export function CaseTimeline({ caseId, updates, currentUserId }: CaseTimelineProps) {
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submitNote(e: React.FormEvent) {
    e.preventDefault()
    if (!note.trim()) return
    setIsSubmitting(true)
    await addCaseUpdateAction(caseId, note.trim())
    setNote('')
    setIsSubmitting(false)
  }

  return (
    <div className="space-y-4">
      {/* Add note form */}
      <div className="rounded-xl border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3">Add Note</h3>
        <form onSubmit={submitNote} className="space-y-3">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a case note, update, or observation..."
            rows={3}
          />
          <Button type="submit" size="sm" disabled={isSubmitting || !note.trim()}>
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
            Add Note
          </Button>
        </form>
      </div>

      {/* Timeline */}
      <div className="relative space-y-4 before:absolute before:left-5 before:top-0 before:bottom-0 before:w-px before:bg-border">
        {updates.length === 0 ? (
          <p className="text-sm text-muted-foreground pl-10 py-4">No timeline entries yet.</p>
        ) : (
          updates.map((entry) => {
            const isStatusChange = entry.update_type === 'status_change'
            const isDocument = entry.update_type === 'document'

            return (
              <div key={entry.id} className="flex gap-4 pl-2">
                {/* Avatar / Icon */}
                <div className="relative z-10 flex h-6 w-6 mt-0.5 items-center justify-center shrink-0">
                  {entry.profiles ? (
                    <Avatar className="h-6 w-6 ring-2 ring-background">
                      <AvatarImage src={entry.profiles.avatar_url ?? undefined} />
                      <AvatarFallback className="text-[9px] bg-primary/20 text-primary">
                        {getInitials(entry.profiles.full_name)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-muted ring-2 ring-background flex items-center justify-center">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 rounded-xl border bg-card p-3">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <span className="text-sm font-medium">{entry.profiles?.full_name ?? 'System'}</span>
                      {entry.title && (
                        <span className="text-sm text-muted-foreground ml-1">· {entry.title}</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatRelativeTime(entry.created_at)}
                    </span>
                  </div>

                  {isStatusChange ? (
                    <div className="flex items-center gap-2 mt-2">
                      <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <Badge variant="outline" className="text-[10px]">{formatStatusLabel(entry.old_value ?? '')}</Badge>
                      <span className="text-xs text-muted-foreground">→</span>
                      <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                        {formatStatusLabel(entry.new_value ?? '')}
                      </Badge>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{entry.content}</p>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
