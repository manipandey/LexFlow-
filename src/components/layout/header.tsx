'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn, getInitials, formatRelativeTime } from '@/lib/utils'
import type { ProfileRow, FirmRow, NotificationRow } from '@/types/database.types'
import {
  Sun,
  Moon,
  Bell,
  Search,
  Settings,
  User,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { logoutAction } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/client'

interface HeaderProps {
  profile: ProfileRow
  firm: FirmRow | null
}

// Build breadcrumb from pathname
function getBreadcrumb(pathname: string): { label: string; href: string }[] {
  const segments = pathname.split('/').filter(Boolean)
  const labels: Record<string, string> = {
    dashboard: 'Dashboard',
    clients: 'Clients',
    cases: 'Cases',
    documents: 'Documents',
    hearings: 'Hearings',
    tasks: 'Tasks',
    team: 'Team',
    billing: 'Billing',
    notifications: 'Notifications',
    'audit-logs': 'Audit Logs',
    settings: 'Settings',
    new: 'New',
    edit: 'Edit',
  }
  return segments.map((seg, i) => ({
    label: labels[seg] ?? (seg.length === 36 ? 'Detail' : seg),
    href: '/' + segments.slice(0, i + 1).join('/'),
  }))
}

export function Header({ profile, firm }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const breadcrumbs = getBreadcrumb(pathname)
  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }: { data: NotificationRow[] | null }) => {
        if (data) {
          setNotifications(data)
          setUnreadCount(data.filter((n: NotificationRow) => !n.is_read).length)
        }
      })
  }, [profile.id])

  async function markAllRead() {
    const supabase = createClient()
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('recipient_id', profile.id)
      .eq('is_read', false)
    setUnreadCount(0)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-6 sticky top-0 z-10">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <div key={crumb.href} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            {i === breadcrumbs.length - 1 ? (
              <span className="font-medium text-foreground">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
          id="theme-toggle-btn"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Notifications */}
        <Popover>
          <PopoverTrigger render={
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 relative"
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              id="notifications-btn"
            />
          }>
            <>
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-primary hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-[320px] overflow-y-auto divide-y divide-border">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No notifications
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      'px-4 py-3 hover:bg-muted/50 transition-colors',
                      !n.is_read && 'bg-primary/5'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {!n.is_read && (
                        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                      <div className={cn(!n.is_read ? '' : 'pl-4')}>
                        <p className="text-sm font-medium">{n.title}</p>
                        {n.message && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {n.message}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {formatRelativeTime(n.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-border px-4 py-2">
              <Link
                href="/notifications"
                className="text-xs text-primary hover:underline"
              >
                View all notifications →
              </Link>
            </div>
          </PopoverContent>
        </Popover>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button
              variant="ghost"
              className="h-8 gap-2 pl-1 pr-2"
              id="user-menu-btn"
            />
          }>
            <>
              <Avatar className="h-6 w-6">
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:block max-w-24 truncate">
                {profile.full_name.split(' ')[0]}
              </span>
            </>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-0.5">
                <p className="text-sm font-semibold">{profile.full_name}</p>
                <p className="text-xs text-muted-foreground">{firm?.name}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/settings" className="cursor-pointer" />}>
              <>
                <User className="mr-2 h-4 w-4" />
                My Profile
              </>
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/settings" className="cursor-pointer" />}>
              <>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<button type="submit" className="flex w-full items-center text-destructive" />}>
              <form action={logoutAction} className="w-full">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
