import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getCaseById } from '@/app/actions/cases'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CaseTimeline } from '@/components/cases/case-timeline'
import {
  ArrowLeft, Pencil, Clock, Calendar, User, Gavel,
  FileText, CheckSquare, Scale, AlertTriangle,
} from 'lucide-react'
import { formatDate, getStatusColor, formatStatusLabel, getPriorityColor, formatCurrency } from '@/lib/utils'
import type { Metadata } from 'next'

interface CaseDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: CaseDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const caseData = await getCaseById(id).catch(() => null)
  return { title: caseData?.title ?? 'Case Detail' }
}

export default async function CaseDetailPage({ params }: CaseDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const caseData = await getCaseById(id).catch(() => null)
  if (!caseData) notFound()

  const c = caseData as any

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" render={<Link href="/cases" />} className="shrink-0 mt-1">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
              {c.case_number}
            </span>
            <Badge variant="outline" className={getStatusColor(c.status)}>
              {formatStatusLabel(c.status)}
            </Badge>
            <Badge variant="secondary">{formatStatusLabel(c.case_type)}</Badge>
            <span className={`text-xs font-medium ${getPriorityColor(c.priority)}`}>
              {c.priority.charAt(0).toUpperCase() + c.priority.slice(1)} Priority
            </span>
          </div>
          <h1 className="text-2xl font-bold truncate">{c.title}</h1>
        </div>
        <Button variant="outline" size="sm" render={<Link href={`/cases/${id}/edit`} />}>
          <>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </>
        </Button>
      </div>

      {/* Info grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Client', value: c.clients?.full_name, icon: User },
          { label: 'Assigned Lawyer', value: c.profiles?.full_name ?? '—', icon: Scale },
          { label: 'Filed', value: formatDate(c.filing_date), icon: Calendar },
          { label: 'Court', value: c.court_name ?? '—', icon: Gavel },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </div>
            <p className="font-semibold truncate">{item.value ?? '—'}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList>
          <TabsTrigger value="timeline">
            <Clock className="mr-1.5 h-3.5 w-3.5" /> Timeline
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            Documents ({c.documents?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <CheckSquare className="mr-1.5 h-3.5 w-3.5" />
            Tasks ({c.tasks?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="hearings">
            <Calendar className="mr-1.5 h-3.5 w-3.5" />
            Hearings ({c.hearings?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-4">
          <CaseTimeline caseId={id} updates={c.case_updates ?? []} currentUserId={user.id} />
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <div className="space-y-2">
            {(c.documents ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No documents attached to this case.</p>
            ) : (
              (c.documents ?? []).map((doc: any) => (
                <div key={doc.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{formatStatusLabel(doc.category)} · {formatDate(doc.created_at)}</p>
                  </div>
                </div>
              ))
            )}
            <div className="pt-2">
              <Button variant="outline" size="sm" render={<Link href={`/documents?case=${id}`} />}>
                <>Manage Documents</>
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <div className="space-y-2">
            {(c.tasks ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No tasks for this case.</p>
            ) : (
              (c.tasks ?? []).map((task: any) => (
                <div key={task.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
                  <CheckSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatStatusLabel(task.status)} · Due {formatDate(task.due_date)}
                    </p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${getStatusColor(task.status)}`}>
                    {formatStatusLabel(task.status)}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="hearings" className="mt-4">
          <div className="space-y-2">
            {(c.hearings ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No hearings scheduled for this case.</p>
            ) : (
              (c.hearings ?? []).map((hearing: any) => (
                <div key={hearing.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{hearing.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(hearing.hearing_date)}
                      {hearing.start_time && ` at ${hearing.start_time}`}
                      {hearing.court_name && ` · ${hearing.court_name}`}
                    </p>
                  </div>
                  {hearing.is_completed && (
                    <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-400">Completed</Badge>
                  )}
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
