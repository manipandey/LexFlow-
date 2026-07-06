'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn, getInitials, getRoleLabel } from '@/lib/utils'
import type { ProfileRow, FirmRow } from '@/types/database.types'
import {
  Scale,
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  Calendar,
  CheckSquare,
  UserCheck,
  Receipt,
  Bell,
  Settings,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Building2,
  LogOut,
  Gavel,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { logoutAction } from '@/app/actions/auth'

interface SidebarProps {
  profile: ProfileRow & { firms?: FirmRow | null }
  firm: FirmRow | null
}

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'Practice',
    items: [
      { href: '/clients', icon: Users, label: 'Clients' },
      { href: '/cases', icon: Briefcase, label: 'Cases' },
      { href: '/documents', icon: FileText, label: 'Documents' },
      { href: '/hearings', icon: Calendar, label: 'Hearings' },
      { href: '/cause-list', icon: Gavel, label: 'Cause List' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/tasks', icon: CheckSquare, label: 'Tasks' },
      { href: '/team', icon: UserCheck, label: 'Team' },
      { href: '/billing', icon: Receipt, label: 'Billing' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { href: '/notifications', icon: Bell, label: 'Notifications' },
      { href: '/audit-logs', icon: ClipboardList, label: 'Audit Logs' },
      { href: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
]

// Hide admin items from non-admin roles
const ADMIN_ONLY = ['/audit-logs', '/team']

export function Sidebar({ profile, firm }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const isAdmin = ['firm_owner', 'senior_lawyer'].includes(profile.role)

  return (
    <aside
      className={cn(
        'flex flex-col bg-sidebar backdrop-blur-xl border-r border-sidebar-border transition-all duration-300 ease-in-out relative shrink-0',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-5 border-b border-sidebar-border',
        collapsed && 'justify-center px-0'
      )}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary shadow-lg">
          <Scale className="h-5 w-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sidebar-foreground font-bold text-base leading-none truncate">
              LexFlow
            </p>
            <p className="text-sidebar-foreground/60 text-xs truncate mt-0.5">
              {firm?.name ?? 'Law Firm'}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter(
            (item) => isAdmin || !ADMIN_ONLY.includes(item.href)
          )
          if (visibleItems.length === 0) return null

          return (
            <div key={group.label} className="mb-4">
              {!collapsed && (
                <p className="text-sidebar-foreground/40 text-[10px] font-semibold uppercase tracking-widest px-2 mb-1">
                  {group.label}
                </p>
              )}
              {visibleItems.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href))

                const linkEl = (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                      'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent',
                      active && 'bg-sidebar-accent text-sidebar-foreground shadow-sm',
                      collapsed && 'justify-center px-2'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'h-4 w-4 shrink-0',
                        active ? 'text-primary' : 'text-sidebar-foreground/60'
                      )}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {active && !collapsed && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </Link>
                )

                if (collapsed) {
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger render={linkEl} />
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  )
                }
                return linkEl
              })}
            </div>
          )
        })}
      </nav>

      {/* User profile */}
      <div className={cn(
        'border-t border-sidebar-border p-3 flex items-center gap-3',
        collapsed && 'justify-center'
      )}>
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={profile.avatar_url ?? undefined} />
          <AvatarFallback className="text-xs bg-primary/20 text-primary">
            {getInitials(profile.full_name)}
          </AvatarFallback>
        </Avatar>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sidebar-foreground text-sm font-medium truncate">
              {profile.full_name}
            </p>
            <p className="text-sidebar-foreground/50 text-xs truncate">
              {getRoleLabel(profile.role)}
            </p>
          </div>
        )}
        {!collapsed && (
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors p-1 rounded"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground/60 hover:text-sidebar-foreground shadow-sm transition-colors z-10"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>
    </aside>
  )
}
