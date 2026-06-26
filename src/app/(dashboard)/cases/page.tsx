import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCases } from '@/app/actions/cases'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FolderPlus } from 'lucide-react'
import { formatDate, getStatusColor, formatStatusLabel } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Cases' }

interface CasesPageProps {
  searchParams: Promise<{ page?: string; search?: string; status?: string; type?: string }>
}

export default async function CasesPage({ searchParams }: CasesPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const page = Number(params.page ?? 1)
  const { data: cases, total } = await getCases({
    page, pageSize: 20, search: params.search, status: params.status, type: params.type,
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cases</h1>
          <p className="text-muted-foreground text-sm mt-1">{total.toLocaleString()} total cases</p>
        </div>
        <Button render={<Link href="/cases/new" id="new-case-btn" />}>
          <>
            <FolderPlus className="mr-2 h-4 w-4" />
            New Case
          </>
        </Button>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 flex-wrap">
        {['', 'open', 'in_progress', 'hearing_scheduled', 'filed', 'awaiting_decision', 'closed'].map((s) => (
          <Link
            key={s}
            href={`/cases${s ? `?status=${s}` : ''}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              params.status === s || (!params.status && !s)
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:border-foreground/30'
            }`}
          >
            {s ? formatStatusLabel(s) : 'All'}
          </Link>
        ))}
      </div>

      {/* Cases grid */}
      <div className="space-y-2">
        {cases.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <FolderPlus className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">No cases found</p>
            <Link href="/cases/new">
              <Button variant="outline" size="sm" className="mt-3">Create First Case</Button>
            </Link>
          </div>
        ) : (
          cases.map((c: any) => (
            <Link
              key={c.id}
              href={`/cases/${c.id}`}
              className="flex items-center gap-4 rounded-xl border bg-card p-4 hover:bg-muted/30 hover:border-border/80 transition-all duration-150 group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground font-mono">{c.case_number}</span>
                  <Badge variant="outline" className={`text-[10px] py-0 ${getStatusColor(c.status)}`}>
                    {formatStatusLabel(c.status)}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] py-0">
                    {formatStatusLabel(c.case_type)}
                  </Badge>
                </div>
                <p className="font-semibold mt-1 group-hover:text-primary transition-colors truncate">{c.title}</p>
                <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                  <span>👤 {c.clients?.full_name}</span>
                  {c.profiles && <span>⚖️ {c.profiles.full_name}</span>}
                  {c.filing_date && <span>📅 Filed {formatDate(c.filing_date)}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className={`h-2.5 w-2.5 rounded-full ${
                  c.priority === 'urgent' ? 'bg-red-400' :
                  c.priority === 'high' ? 'bg-orange-400' :
                  c.priority === 'medium' ? 'bg-yellow-400' : 'bg-slate-400'
                }`} title={`Priority: ${c.priority}`} />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
