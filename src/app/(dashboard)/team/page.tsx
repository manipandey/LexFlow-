import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTeamMembers } from '@/app/actions/team'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getInitials, getRoleLabel, formatRelativeTime } from '@/lib/utils'
import Link from 'next/link'
import { UserPlus, Shield, ShieldOff } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Team' }

const ROLE_COLORS: Record<string, string> = {
  firm_owner: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  senior_lawyer: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  lawyer: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  paralegal: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  receptionist: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
}

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const members = await getTeamMembers().catch(() => [] as any[])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground text-sm mt-1">{members.length} team member{members.length !== 1 ? 's' : ''}</p>
        </div>
        <Button render={<Link href="/team/invite" id="invite-member-btn" />}>
          <>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Member
          </>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member: any) => (
          <div
            key={member.id}
            className={`rounded-xl border bg-card p-5 transition-all hover:shadow-sm ${!member.is_active ? 'opacity-60' : ''}`}
          >
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12 shrink-0">
                <AvatarImage src={member.avatar_url} />
                <AvatarFallback className="text-sm bg-primary/10 text-primary">
                  {getInitials(member.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm truncate">{member.full_name}</p>
                  {!member.is_active && (
                    <Badge variant="outline" className="text-[10px] py-0 text-red-400 border-red-500/30">Suspended</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{member.title ?? member.role}</p>
                <div className="mt-2">
                  <Badge variant="outline" className={`text-[10px] py-0 ${ROLE_COLORS[member.role] ?? ''}`}>
                    {getRoleLabel(member.role)}
                  </Badge>
                </div>
              </div>
            </div>

            {member.phone && (
              <div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
                📞 {member.phone}
              </div>
            )}

            {member.last_seen_at && (
              <p className="mt-2 text-[10px] text-muted-foreground/60">
                Last seen {formatRelativeTime(member.last_seen_at)}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
