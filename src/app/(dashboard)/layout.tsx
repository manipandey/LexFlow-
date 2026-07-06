import { getCurrentProfile } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const result = await getCurrentProfile()
  if (!result || !result.user || !result.profile) redirect('/login')
  const profile = result.profile

  if (!profile.firm_id) redirect('/onboarding')

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar profile={profile} firm={profile.firms} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header profile={profile} firm={profile.firms} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
