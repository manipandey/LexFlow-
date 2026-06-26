'use client'

import { useState } from 'react'
import { getDocumentSignedUrl, deleteDocumentAction } from '@/app/actions/documents'
import { formatDate, formatFileSize, formatStatusLabel } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Download, Trash2, Eye, File, Image, Archive } from 'lucide-react'
import { useRouter } from 'next/navigation'

const MIME_ICONS: Record<string, React.ElementType> = {
  'application/pdf': FileText,
  'image/': Image,
  'application/zip': Archive,
}

function getFileIcon(mimeType: string): React.ElementType {
  for (const [prefix, Icon] of Object.entries(MIME_ICONS)) {
    if (mimeType?.startsWith(prefix)) return Icon
  }
  return File
}

interface DocumentGridProps {
  documents: any[]
}

export function DocumentGrid({ documents }: DocumentGridProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDownload(filePath: string, name: string) {
    const url = await getDocumentSignedUrl(filePath)
    if (url) {
      const a = document.createElement('a')
      a.href = url
      a.download = name
      a.click()
    }
  }

  async function handleDelete(id: string, filePath: string) {
    if (!confirm('Delete this document permanently?')) return
    setDeletingId(id)
    await deleteDocumentAction(id, filePath)
    setDeletingId(null)
    router.refresh()
  }

  if (documents.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <FileText className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-muted-foreground text-sm">No documents found</p>
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {documents.map((doc: any) => {
        const Icon = getFileIcon(doc.mime_type)
        return (
          <div
            key={doc.id}
            className="group rounded-xl border bg-card p-4 hover:shadow-sm hover:border-border/80 transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" title={doc.name}>{doc.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                    {formatStatusLabel(doc.category)}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="mt-3 text-xs text-muted-foreground flex items-center justify-between">
              <span>{formatFileSize(doc.file_size)}</span>
              <span>{formatDate(doc.created_at)}</span>
            </div>

            {/* Actions */}
            <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-7"
                onClick={() => handleDownload(doc.file_path, doc.name)}
              >
                <Download className="h-3 w-3 mr-1" /> Download
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => handleDelete(doc.id, doc.file_path)}
                disabled={deletingId === doc.id}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
