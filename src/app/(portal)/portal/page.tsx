import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { formatDate, getStatusColor, formatStatusLabel } from '@/lib/utils'
import { Briefcase, FileText, Calendar } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Client Portal | LexFlow' }

export default async function PortalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Find client record
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('profile_id', user.id)
    .single()

  if (!client) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Your client profile is being set up. Please contact your law firm.</p>
      </div>
    )
  }

  // Fetch related data
  const [casesResult, docsResult, hearingsResult] = await Promise.all([
    supabase.from('cases').select('id, case_number, title, status, case_type, created_at, profiles!cases_assigned_lawyer_id_fkey(full_name)').eq('client_id', client.id).order('created_at', { ascending: false }),
    supabase.from('documents').select('id, name, category, created_at').eq('client_id', client.id).eq('is_shared_with_client', true).order('created_at', { ascending: false }).limit(5),
    supabase.from('hearings').select('id, title, hearing_date, start_time, court_name, hearing_type').eq('client_id', client.id).eq('is_completed', false).gte('hearing_date', new Date().toISOString().split('T')[0]).order('hearing_date', { ascending: true }).limit(3),
  ])

  const cases = casesResult.data ?? []
  const docs = docsResult.data ?? []
  const hearings = hearingsResult.data ?? []

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {client.full_name.split(' ')[0]}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Here&apos;s an overview of your legal matters
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-3xl font-bold text-blue-400">{cases.length}</p>
          <p className="text-sm text-muted-foreground mt-1">Active Cases</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-3xl font-bold text-teal-400">{docs.length}</p>
          <p className="text-sm text-muted-foreground mt-1">Shared Documents</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-3xl font-bold text-amber-400">{hearings.length}</p>
          <p className="text-sm text-muted-foreground mt-1">Upcoming Appointments</p>
        </div>
      </div>

      {/* Upcoming hearings */}
      {hearings.length > 0 && (
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Upcoming Appointments
          </h2>
          <div className="space-y-2">
            {hearings.map((h: any) => (
              <div key={h.id} className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                <div className="flex-1">
                  <p className="font-medium text-sm">{h.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(h.hearing_date)}
                    {h.start_time && ` at ${h.start_time}`}
                    {h.court_name && ` · ${h.court_name}`}
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">{h.hearing_type}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cases */}
      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-primary" />
          My Cases
        </h2>
        {cases.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No cases yet</p>
        ) : (
          <div className="space-y-2">
            {cases.map((c: any) => (
              <div key={c.id} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-muted-foreground">{c.case_number}</span>
                    <Badge variant="outline" className={`text-[10px] py-0 ${getStatusColor(c.status)}`}>
                      {formatStatusLabel(c.status)}
                    </Badge>
                  </div>
                  <p className="font-medium text-sm mt-0.5 truncate">{c.title}</p>
                  {c.profiles && (
                    <p className="text-xs text-muted-foreground">Lawyer: {c.profiles.full_name}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documents */}
      {docs.length > 0 && (
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Recent Documents
          </h2>
          <div className="space-y-2">
            {docs.map((doc: any) => (
              <div key={doc.id} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">{formatStatusLabel(doc.category)} · {formatDate(doc.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
          <Link href="/portal/documents" className="text-xs text-primary hover:underline mt-3 block">
            View all documents →
          </Link>
        </div>
      )}
    </div>
  )
}
