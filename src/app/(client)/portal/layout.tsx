import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Scale, LogOut, LayoutDashboard, Briefcase, FileText, Receipt } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { logoutAction } from '@/app/actions/auth'

export default async function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, firms(name)')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'client') {
    redirect('/dashboard') // Not a client
  }

  const navItems = [
    { href: '/portal', icon: LayoutDashboard, label: 'Dashboard' },
    // These routes can be built out in future iterations:
    // { href: '/portal/cases', icon: Briefcase, label: 'My Cases' },
    // { href: '/portal/documents', icon: FileText, label: 'Documents' },
    // { href: '/portal/invoices', icon: Receipt, label: 'Invoices' },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Client Sidebar */}
      <aside className="w-64 flex flex-col bg-sidebar backdrop-blur-xl border-r border-sidebar-border shrink-0">
        <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary shadow-lg">
            <Scale className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sidebar-foreground font-bold text-base leading-none truncate">
              Client Portal
            </p>
            <p className="text-sidebar-foreground/60 text-xs truncate mt-0.5">
              {profile.firms?.name || 'LexFlow Law Firm'}
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-1">
          <p className="text-sidebar-foreground/40 text-[10px] font-semibold uppercase tracking-widest mb-2 px-2">
            Overview
          </p>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium bg-sidebar-accent text-sidebar-foreground shadow-sm"
            >
              <item.icon className="h-4 w-4 shrink-0 text-primary" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-4 flex items-center gap-3">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="text-sm bg-primary/20 text-primary font-semibold">
              {getInitials(profile.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sidebar-foreground text-sm font-medium truncate">
              {profile.full_name}
            </p>
            <p className="text-sidebar-foreground/50 text-xs truncate">Client</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors p-1.5 rounded-md hover:bg-sidebar-accent"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-muted/20">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
