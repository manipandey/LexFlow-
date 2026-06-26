import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getDocuments } from '@/app/actions/documents'
import { DocumentGrid } from '@/components/documents/document-grid'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Documents' }

interface DocumentsPageProps {
  searchParams: Promise<{ case?: string; client?: string; category?: string }>
}

export default async function DocumentsPage({ searchParams }: DocumentsPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const documents = await getDocuments({
    caseId: params.case,
    clientId: params.client,
    category: params.category,
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {documents.length} document{documents.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button render={<Link href="/documents/upload" id="upload-doc-btn" />}>
          <>
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </>
        </Button>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 flex-wrap">
        {['', 'agreement', 'pleading', 'evidence', 'correspondence', 'court_order', 'other'].map((cat) => (
          <Link
            key={cat}
            href={`/documents${cat ? `?category=${cat}` : ''}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all capitalize ${
              params.category === cat || (!params.category && !cat)
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:border-foreground/30'
            }`}
          >
            {cat.replace('_', ' ') || 'All'}
          </Link>
        ))}
      </div>

      <DocumentGrid documents={documents} />
    </div>
  )
}
