import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Notifications' }

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })

  // Mark all as read
  await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('recipient_id', user.id)
    .eq('is_read', false)

  const items = notifications ?? []

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {items.length} notification{items.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="rounded-xl border bg-card divide-y divide-border/50">
        {items.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">🔔</div>
            <p className="text-muted-foreground text-sm">You&apos;re all caught up!</p>
          </div>
        ) : (
          items.map((n) => (
            <div
              key={n.id}
              className={cn(
                'px-5 py-4',
                !n.is_read && 'bg-primary/5'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {!n.is_read && (
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                    )}
                    <p className="font-medium text-sm">{n.title}</p>
                  </div>
                  {n.message && (
                    <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground/60 shrink-0 mt-0.5">
                  {formatRelativeTime(n.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
