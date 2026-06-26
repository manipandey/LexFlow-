'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { uploadDocumentAction } from '@/app/actions/documents'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert } from '@/components/ui/alert'
import { Loader2, AlertCircle, Upload, FileText, X } from 'lucide-react'
import { formatFileSize } from '@/lib/utils'

interface DocumentUploadFormProps {
  cases: { id: string; title: string; case_number: string }[]
  clients: { id: string; full_name: string }[]
  preselectedCaseId?: string
}

const CATEGORIES = [
  { value: 'agreement', label: 'Agreement / Contract' },
  { value: 'pleading', label: 'Pleading' },
  { value: 'evidence', label: 'Evidence' },
  { value: 'correspondence', label: 'Correspondence' },
  { value: 'court_order', label: 'Court Order' },
  { value: 'other', label: 'Other' },
]

export function DocumentUploadForm({ cases, clients, preselectedCaseId }: DocumentUploadFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setSelectedFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) setSelectedFile(file)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedFile) {
      setError('Please select a file to upload')
      return
    }
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.set('file', selectedFile)

    startTransition(async () => {
      const result = await uploadDocumentAction(formData)
      if (!result.success) {
        setError(result.error ?? 'Upload failed')
      } else {
        router.push('/documents')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert className="border-destructive/50 bg-destructive/10 text-destructive flex items-start gap-2 py-3">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span className="text-sm">{error}</span>
        </Alert>
      )}

      {/* File Drop Zone */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Select File</h2>

        {selectedFile ? (
          <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
            <FileText className="h-8 w-8 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setSelectedFile(null)}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <label
            className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 cursor-pointer transition-all
              ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/20'}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <Upload className={`h-10 w-10 ${isDragging ? 'text-primary' : 'text-muted-foreground/40'}`} />
            <div className="text-center">
              <p className="text-sm font-medium">
                Drop file here or <span className="text-primary">browse</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, DOCX, XLSX, PNG, JPG, and more
              </p>
            </div>
            <Input
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt,.csv"
            />
          </label>
        )}
      </div>

      {/* Document Details */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Document Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              name="category"
              defaultValue="other"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="case_id">Related Case (optional)</Label>
            <select
              id="case_id"
              name="case_id"
              defaultValue={preselectedCaseId ?? ''}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">None</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>{c.case_number} – {c.title}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_id">Related Client (optional)</Label>
            <select
              id="client_id"
              name="client_id"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">None</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="is_shared_with_client">Client Visibility</Label>
            <select
              id="is_shared_with_client"
              name="is_shared_with_client"
              defaultValue="false"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="false">Internal only</option>
              <option value="true">Share with client</option>
            </select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Brief description of this document..."
              rows={2}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending || !selectedFile} className="gap-2" id="upload-submit-btn">
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload Document
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
