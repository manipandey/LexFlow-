'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Search, MapPin, Download, RefreshCw, User, Gavel } from 'lucide-react'
import { formatNepaliDate, formatDate } from '@/lib/utils'
import { triggerSyncAction } from '@/app/actions/cause-lists'
import { toast } from 'sonner'

interface CauseListEntry {
  id: string
  date: string
  bench_type: string
  judge_name: string | null
  case_number: string
  party_name: string | null
  advocate_name: string | null
  hearing_status: string | null
  courtroom: string | null
}

interface CauseListViewProps {
  initialData: CauseListEntry[]
  selectedDate: string
}

export function CauseListView({ initialData, selectedDate }: CauseListViewProps) {
  const [search, setSearch] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)

  const handleSync = async () => {
    setIsSyncing(true)
    const res = await triggerSyncAction()
    setIsSyncing(false)
    if (res.success) {
      toast.success(res.message)
    } else {
      toast.error(res.error || 'Failed to sync cause list')
    }
  }

  // Filter based on search query
  const filteredData = initialData.filter((item) => {
    const q = search.toLowerCase()
    return (
      item.case_number.toLowerCase().includes(q) ||
      (item.party_name && item.party_name.toLowerCase().includes(q)) ||
      (item.advocate_name && item.advocate_name.toLowerCase().includes(q))
    )
  })

  // Group by Bench Type
  const benchTypes = Array.from(new Set(filteredData.map(d => d.bench_type)))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Supreme Court Cause List (Peshi Suchi)</h2>
          <p className="text-muted-foreground text-sm mt-1">
            B.S.: {formatNepaliDate(selectedDate)} | {formatDate(selectedDate)}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search case, party, or advocate..."
              className="pl-8 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" onClick={handleSync} disabled={isSyncing} title="Sync latest cause list">
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {initialData.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
            <Gavel className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">No Cause List Found</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">
              The cause list for today hasn't been published or synced yet.
            </p>
          </div>
          <Button onClick={handleSync} disabled={isSyncing}>
            {isSyncing ? 'Syncing...' : 'Fetch Cause List Now'}
          </Button>
        </div>
      ) : benchTypes.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
          No results found for "{search}"
        </div>
      ) : (
        <Tabs defaultValue={benchTypes[0]} className="w-full">
          <TabsList className="w-full flex-wrap h-auto p-1 mb-4">
            {benchTypes.map(bench => (
              <TabsTrigger key={bench} value={bench} className="flex-1 min-w-[150px]">
                {bench}
                <Badge variant="secondary" className="ml-2 bg-background">
                  {filteredData.filter(d => d.bench_type === bench).length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
          
          {benchTypes.map(bench => (
            <TabsContent key={bench} value={bench} className="space-y-4 mt-0">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredData.filter(d => d.bench_type === bench).map((entry) => (
                  <div key={entry.id} className="rounded-lg border bg-card p-4 hover:border-primary/30 transition-colors">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 shrink-0">
                        {entry.case_number}
                      </Badge>
                      {entry.hearing_status && (
                        <Badge variant="secondary" className="text-[10px]">
                          {entry.hearing_status}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">
                      {entry.party_name || 'N/A'}
                    </p>
                    
                    <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                      {entry.judge_name && (
                        <div className="flex items-start gap-1.5 text-foreground/80 font-medium">
                          <Gavel className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                          <span>{entry.judge_name}</span>
                        </div>
                      )}
                      {entry.advocate_name && (
                        <div className="flex items-start gap-1.5">
                          <User className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                          <span>Adv. {entry.advocate_name}</span>
                        </div>
                      )}
                      {entry.courtroom && (
                        <div className="flex items-start gap-1.5">
                          <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                          <span>{entry.courtroom}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}
