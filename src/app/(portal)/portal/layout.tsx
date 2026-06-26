import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Scale, LogOut, Briefcase, FileText, Calendar, MessageSquare } from 'lucide-react'
import { logoutAction } from '@/app/actions/auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, firms(name, logo_url)')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'client') redirect('/dashboard')

  const firm = (profile as any).firms

  return (
    <div className="min-h-screen bg-background">
      {/* Portal Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Scale className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold text-sm leading-none">{firm?.name ?? 'LexFlow'}</p>
              <p className="text-[10px] text-muted-foreground">Client Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Avatar className="h-7 w-7">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm hidden sm:block">{profile.full_name}</span>
            <form action={logoutAction}>
              <button type="submit" className="text-muted-foreground hover:text-foreground transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Portal Nav */}
      <nav className="border-b border-border bg-background">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-1">
            {[
              { href: '/portal', label: 'Overview', icon: Scale },
              { href: '/portal/cases', label: 'My Cases', icon: Briefcase },
              { href: '/portal/documents', label: 'Documents', icon: FileText },
              { href: '/portal/appointments', label: 'Appointments', icon: Calendar },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1.5 px-3 py-3 text-sm text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-primary transition-all"
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
