import { getClientDashboardData } from '@/app/actions/client-portal'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Briefcase, Calendar, FileText, Receipt, Gavel, MapPin } from 'lucide-react'
import { formatNepaliDate, formatDate } from '@/lib/utils'
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Client Portal | LexFlow' }

export default async function ClientPortalPage() {
  const data = await getClientDashboardData()
  
  const activeCases = data.cases.filter(c => c.status !== 'closed')

  return (
    <div className="animate-fade-in space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome to your Portal</h1>
        <p className="text-muted-foreground mt-2">
          Track your cases, view upcoming hearings, and manage documents securely.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <Briefcase className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{activeCases.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Hearings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.upcomingHearings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shared Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.recentDocuments.length}</div>
          </CardContent>
        </Card>
        <Card className={data.invoices.length > 0 ? "bg-red-500/5 border-red-500/20" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unpaid Invoices</CardTitle>
            <Receipt className={`h-4 w-4 ${data.invoices.length > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.invoices.length > 0 ? 'text-red-600' : ''}`}>
              {data.invoices.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Cases Section */}
        <Card>
          <CardHeader>
            <CardTitle>My Cases</CardTitle>
          </CardHeader>
          <CardContent>
            {data.cases.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No cases found.</p>
            ) : (
              <div className="space-y-4">
                {data.cases.map(c => (
                  <div key={c.id} className="flex justify-between items-start border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{c.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        <span>{c.case_number}</span>
                        {c.court_name && <span>• {c.court_name}</span>}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">{c.status.replace('_', ' ')}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Hearings Section */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Hearings</CardTitle>
            </CardHeader>
            <CardContent>
              {data.upcomingHearings.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No upcoming hearings.</p>
              ) : (
                <div className="space-y-4">
                  {data.upcomingHearings.map(h => (
                    <div key={h.id} className="flex gap-4 border-b pb-4 last:border-0 last:pb-0">
                      <div className="shrink-0 text-center w-14 bg-muted/50 rounded-md py-2">
                        <p className="text-sm font-bold text-primary">{formatDate(h.hearing_date).split(' ')[1]}</p>
                        <p className="text-[10px] text-muted-foreground">{formatDate(h.hearing_date).split(' ')[0]}</p>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{h.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          B.S.: {formatNepaliDate(h.hearing_date)} {h.start_time ? `at ${h.start_time}` : ''}
                        </p>
                        <div className="flex gap-2 mt-1.5 text-[10px] text-muted-foreground">
                          {h.court_name && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{h.court_name}</span>}
                          {(h.cases as any)?.case_number && <span>📁 {(h.cases as any).case_number}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents Section */}
          <Card>
            <CardHeader>
              <CardTitle>Recently Shared Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentDocuments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No documents shared yet.</p>
              ) : (
                <div className="space-y-3">
                  {data.recentDocuments.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-md">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{doc.name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {formatDate(doc.created_at)} {(doc.cases as any)?.case_number ? `• ${(doc.cases as any).case_number}` : ''}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">Shared</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
