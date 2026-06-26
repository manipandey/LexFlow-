import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      return NextResponse.json({ success: false, error: 'Auth error: ' + authError.message })
    }
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'No user is logged in. Please log in first.' })
    }
    
    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      
    // Fetch all firms to see what has been created
    const { data: firms, error: firmsError } = await supabase
      .from('firms')
      .select('*')
      .limit(10)
      
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        metadata: user.user_metadata
      },
      profile: {
        exists: !!profile,
        data: profile,
        error: profileError ? profileError.message : null
      },
      firms: {
        count: firms ? firms.length : 0,
        data: firms,
        error: firmsError ? firmsError.message : null
      }
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message })
  }
}
