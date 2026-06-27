import { getCases } from '@/app/actions/cases'
import { DocumentGenerator } from '@/components/documents/document-generator'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Document Generator' }

export default async function DocumentGeneratorPage() {
  // Fetch up to 100 cases to populate the auto-fill dropdown
  const { data: cases } = await getCases({ pageSize: 100 })

  // Safely map the returned cases to fit our expected format
  const mappedCases = cases.map((c: any) => ({
    id: c.id,
    title: c.title,
    case_number: c.case_number,
    court_name: c.court_name,
    clients: c.clients
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Document Generator</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Auto-generate fully formatted Legal Notices, Vakalatnamas, and more using client data.
        </p>
      </div>

      <DocumentGenerator cases={mappedCases} />
    </div>
  )
}
