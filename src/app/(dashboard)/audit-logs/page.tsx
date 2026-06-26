import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDateTime, formatStatusLabel } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getInitials } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Audit Logs' }

interface AuditLogsPageProps {
  searchParams: Promise<{ page?: string; entity_type?: string }>
}

export default async function AuditLogsPage({ searchParams }: AuditLogsPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('firm_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || !['firm_owner', 'senior_lawyer'].includes(profile.role)) {
    redirect('/dashboard')
  }

  const params = await searchParams
  const page = Number(params.page ?? 1)
  const pageSize = 50

  const { data: logs, count } = await supabase
    .from('activity_logs')
    .select('*, profiles(full_name, avatar_url)', { count: 'exact' })
    .eq('firm_id', profile.firm_id!)
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  const items = logs ?? []

  const ACTION_COLORS: Record<string, string> = {
    create: 'bg-green-500/10 text-green-400 border-green-500/20',
    update: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    delete: 'bg-red-500/10 text-red-400 border-red-500/20',
    upload: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    login: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    invite: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Complete activity trail for your firm
        </p>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr>
              <th className="text-left font-medium text-muted-foreground px-4 py-3">User</th>
              <th className="text-left font-medium text-muted-foreground px-4 py-3">Action</th>
              <th className="text-left font-medium text-muted-foreground px-4 py-3">Entity</th>
              <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">Description</th>
              <th className="text-left font-medium text-muted-foreground px-4 py-3">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                  No audit logs found
                </td>
              </tr>
            ) : (
              items.map((log: any) => (
                <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6 shrink-0">
                        <AvatarImage src={log.profiles?.avatar_url} />
                        <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                          {getInitials(log.profiles?.full_name ?? 'S')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs truncate max-w-[100px]">
                        {log.profiles?.full_name ?? 'System'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={`text-[10px] py-0 ${ACTION_COLORS[log.action] ?? ''}`}>
                      {log.action}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="text-xs text-muted-foreground">{log.entity_type}</span>
                      {log.entity_name && (
                        <p className="text-xs font-medium truncate max-w-[120px]">{log.entity_name}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell max-w-xs truncate">
                    {log.description}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDateTime(log.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
