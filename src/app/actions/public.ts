'use server'

import { createClient } from '@supabase/supabase-js'

// We use the service role key to bypass RLS since public visitors are not authenticated
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function getPublicFirmDetails(slug: string) {
  const { data: firm, error } = await supabase
    .from('firms')
    .select('id, name, tagline, description, hero_image_url, logo_url, address, city, phone, email, website')
    .eq('slug', slug)
    .single()

  if (error || !firm) {
    return null
  }

  // Fetch lawyers for this firm
  const { data: lawyers } = await supabase
    .from('profiles')
    .select('id, full_name, role, avatar_url, specialization, bio')
    .eq('firm_id', firm.id)
    .in('role', ['firm_owner', 'senior_lawyer', 'lawyer'])

  return { firm, lawyers: lawyers || [] }
}

export async function submitConsultationBooking(data: {
  firmId: string
  lawyerId: string
  name: string
  email: string
  phone: string
  legalIssue: string
  date: string
  time: string
}) {
  try {
    // 1. Create Lead
    const { data: lead, error: leadError } = await supabase
      .from('crm_leads')
      .insert({
        firm_id: data.firmId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        legal_issue: data.legalIssue,
        status: 'consultation_booked'
      })
      .select('id')
      .single()

    if (leadError) throw leadError

    // 2. Create Consultation
    const { error: consultationError } = await supabase
      .from('crm_consultations')
      .insert({
        firm_id: data.firmId,
        lead_id: lead.id,
        lawyer_id: data.lawyerId,
        consultation_date: data.date,
        start_time: data.time,
        status: 'scheduled'
      })

    if (consultationError) throw consultationError

    return { success: true }
  } catch (error) {
    console.error('Booking Error:', error)
    return { success: false, error: 'Failed to book consultation' }
  }
}
