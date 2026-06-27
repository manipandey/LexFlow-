'use client'

import { DocumentPreview } from './document-preview'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { generateLegalDocument, DocumentData } from '@/lib/document-generator'
import { autoDraftLegalText } from '@/app/actions/drafting'
import { saveAs } from 'file-saver'
import { Download, FileText, Loader2, Eye, Sparkles } from 'lucide-react'

const TEMPLATES = [
  'Vakalatnama',
  'Power of Attorney',
  'Legal Notice',
  'Agreement',
  'Affidavit',
  'Contract',
  'Petition',
  'Reply'
]

interface CaseData {
  id: string
  title: string
  case_number: string
  court_name: string | null
  clients?: { full_name: string } | null
}

export function DocumentGenerator({ cases }: { cases: CaseData[] }) {
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0])
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [formData, setFormData] = useState<DocumentData>({
    clientName: '',
    address: '',
    caseNo: '',
    court: '',
    opponentName: '',
    lawyerName: '',
    legalDraftText: '',
    date: new Date().toLocaleDateString()
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [rawContext, setRawContext] = useState('')
  const [isDrafting, setIsDrafting] = useState(false)

  const handleCaseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const caseId = e.target.value
    setSelectedCaseId(caseId)
    
    if (caseId) {
      const selectedCase = cases.find(c => c.id === caseId)
      if (selectedCase) {
        setFormData({
          ...formData,
          clientName: selectedCase.clients?.full_name || '',
          caseNo: selectedCase.case_number || '',
          court: selectedCase.court_name || '',
        })
      }
    } else {
      // Clear auto-filled fields
      setFormData({
        clientName: '',
        address: formData.address,
        caseNo: '',
        court: '',
        opponentName: formData.opponentName,
        lawyerName: formData.lawyerName,
        legalDraftText: formData.legalDraftText,
        date: formData.date
      })
    }
  }

  const handleDraftText = async () => {
    if (!rawContext.trim()) return
    setIsDrafting(true)
    try {
      const draftedText = await autoDraftLegalText(rawContext)
      setFormData(prev => ({ ...prev, legalDraftText: draftedText }))
    } catch (error) {
      console.error(error)
      alert('Failed to auto-draft text.')
    } finally {
      setIsDrafting(false)
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    
    try {
      const blob = await generateLegalDocument(selectedTemplate, formData)
      const filename = `${selectedTemplate.replace(/\s+/g, '_')}_${formData.clientName || 'Document'}.docx`
      saveAs(blob, filename)
    } catch (error) {
      console.error('Error generating document:', error)
      alert('Failed to generate document.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT COLUMN: Controls & Form */}
      <div className="lg:col-span-5 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>1. Select Template</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full p-2 border rounded-md bg-background mb-2"
            >
              {TEMPLATES.map((template) => (
                <option key={template} value={template}>
                  {template}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Document Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Smart Fill from Case (Optional)</label>
                <select
                  value={selectedCaseId}
                  onChange={handleCaseChange}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  <option value="">-- Select a Case to auto-fill --</option>
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.case_number} - {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Client Name</label>
                  <input
                    required
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                    className="w-full p-2 border rounded-md"
                    placeholder="e.g. Ram Bahadur"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Client Address</label>
                  <input
                    required
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full p-2 border rounded-md"
                    placeholder="e.g. Kathmandu, Nepal"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Case Number</label>
                  <input
                    type="text"
                    value={formData.caseNo}
                    onChange={(e) => setFormData({...formData, caseNo: e.target.value})}
                    className="w-full p-2 border rounded-md"
                    placeholder="e.g. 081-CR-0012"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Court Name</label>
                  <input
                    type="text"
                    value={formData.court}
                    onChange={(e) => setFormData({...formData, court: e.target.value})}
                    className="w-full p-2 border rounded-md"
                    placeholder="e.g. Supreme Court of Nepal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Opponent Name</label>
                  <input
                    type="text"
                    value={formData.opponentName}
                    onChange={(e) => setFormData({...formData, opponentName: e.target.value})}
                    className="w-full p-2 border rounded-md"
                    placeholder="e.g. Shyam Prasad"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Lawyer Name</label>
                  <input
                    required
                    type="text"
                    value={formData.lawyerName}
                    onChange={(e) => setFormData({...formData, lawyerName: e.target.value})}
                    className="w-full p-2 border rounded-md"
                    placeholder="e.g. Adv. Hari Bahadur"
                  />
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">AI Drafting Context (Optional)</label>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    size="sm" 
                    onClick={handleDraftText}
                    disabled={isDrafting || !rawContext.trim()}
                  >
                    {isDrafting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4 text-primary" />}
                    {isDrafting ? 'Drafting...' : 'Auto-Draft Legal Text'}
                  </Button>
                </div>
                <textarea
                  value={rawContext}
                  onChange={(e) => setRawContext(e.target.value)}
                  className="w-full p-2 border rounded-md min-h-[100px] text-sm"
                  placeholder="e.g., My client lent 5 Lakhs to Shyam on Jan 5th and hasn't paid. Write a legal notice."
                />
              </div>

              <div className="pt-6 border-t">
                <Button type="submit" disabled={isGenerating} className="w-full text-lg h-12">
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating .docx...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-5 w-5" />
                      Download .docx
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  File will be generated in strict Nepali Court A4 format.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT COLUMN: Live Preview Pane */}
      <div className="lg:col-span-7">
        <Card className="h-full border-dashed bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-muted-foreground">
              <Eye className="mr-2 h-5 w-5" />
              Live HTML Preview (A4 Layout)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="bg-gray-200/50 p-4 md:p-8 rounded-lg">
              <DocumentPreview templateType={selectedTemplate} data={formData} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
