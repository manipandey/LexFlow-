import { inviteTeamMemberAction } from '@/app/actions/team'
import { TeamInviteForm } from '@/components/team/team-invite-form'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Invite Team Member' }

export default async function InviteTeamMemberPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Invite Team Member</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Send an invitation to join your firm's workspace.
        </p>
      </div>
      <TeamInviteForm action={inviteTeamMemberAction} />
    </div>
  )
}
