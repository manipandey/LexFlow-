import { notFound } from 'next/navigation'
import { getPublicFirmDetails } from '@/app/actions/public'
import { FirmHero, FirmContent } from '@/components/public/firm-ui'

export const revalidate = 60 // Revalidate every minute

export default async function PublicFirmPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = await getPublicFirmDetails(slug)
  
  if (!data) {
    notFound()
  }

  const { firm, lawyers } = data

  return (
    <div className="bg-[#f8fafc] min-h-screen">
      <FirmHero firm={firm} />
      <FirmContent firm={firm} lawyers={lawyers} />
    </div>
  )
}
