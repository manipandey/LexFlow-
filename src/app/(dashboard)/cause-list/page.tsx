import { getCauseLists } from '@/app/actions/cause-lists'
import { CauseListView } from '@/components/cause-list/cause-list-view'
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Cause List (Peshi Suchi)' }

export default async function CauseListPage() {
  const today = new Date().toISOString().split('T')[0]
  const causeLists = await getCauseLists(today)

  return (
    <div className="animate-fade-in space-y-6">
      <CauseListView initialData={causeLists} selectedDate={today} />
    </div>
  )
}
