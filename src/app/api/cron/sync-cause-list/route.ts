import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as cheerio from 'cheerio'
import NepaliDate from 'nepali-date-converter'

// Function to convert English AD date to the BS equivalent using nepali-date-converter
function getTodayBS() {
  const nd = new NepaliDate()
  const year = nd.getYear().toString()
  const month = (nd.getMonth() + 1).toString().padStart(2, '0')
  const day = nd.getDate().toString().padStart(2, '0')
  return { year, month, day } 
}

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const today = new Date().toISOString().split('T')[0]
    
    // Delete existing data for today so we can do a fresh sync
    const { error: deleteError } = await supabase
      .from('court_cause_lists')
      .delete()
      .eq('date', today)

    if (deleteError) throw deleteError

    const { year, month, day } = getTodayBS()
    const url = 'https://supremecourt.gov.np/lic/sys.php?d=reports&f=daily_public'

    // STEP 1: Fetch the available benches for the given date
    const params = new URLSearchParams()
    params.append('mode', 'showbench')
    params.append('syy', year)
    params.append('smm', month)
    params.append('sdd', day)

    const benchRes = await fetch(url, {
      method: 'POST',
      body: params,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    })

    const benchHtml = await benchRes.text()
    const $1 = cheerio.load(benchHtml)
    
    const benches: { id: string, name: string }[] = []
    $1('select[name="bench_type"] option').each((i, el) => {
      const val = $1(el).attr('value')
      const text = $1(el).text().trim()
      if (val && text) {
        benches.push({ id: val, name: text })
      }
    })

    if (benches.length === 0) {
      return NextResponse.json({ message: 'No cause list available for today (or scraping failed to find benches).' })
    }

    // STEP 2: Fetch the cases for each bench
    const allCases: {
      date: string
      bench_type: string
      judge_name: string
      case_number: string
      party_name: string
      advocate_name: string
      hearing_status: string
      courtroom: string
    }[] = []
    
    for (const bench of benches) {
      const caseParams = new URLSearchParams()
      caseParams.append('mode', 'show')
      caseParams.append('sdate', `${year}${month}${day}`)
      caseParams.append('bench_type', bench.id)

      const caseRes = await fetch(url, {
        method: 'POST',
        body: caseParams,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0'
        }
      })
      
      const caseHtml = await caseRes.text()
      const $2 = cheerio.load(caseHtml)
      
      // Parse the HTML table.
      // Usually, the first table holds the data, and we skip headers.
      $2('table tr').each((i, el) => {
        if (i === 0) return // Skip header row
        const tds = $2(el).find('td')
        if (tds.length >= 6) {
          const caseNumber = $2(tds[2]).text().trim()
          const partyName = $2(tds[3]).text().trim()
          const advocate = $2(tds[4]).text().trim()
          const status = $2(tds[5]).text().trim()
          
          if (caseNumber && partyName) {
            allCases.push({
              date: today,
              bench_type: 'Supreme Court Bench', 
              judge_name: bench.name, // The option text usually contains the judges
              case_number: caseNumber,
              party_name: partyName,
              advocate_name: advocate,
              hearing_status: status,
              courtroom: 'TBD'
            })
          }
        }
      })
    }

    if (allCases.length === 0) {
       return NextResponse.json({ message: 'Parsed benches but found no cases in tables.' })
    }

    // STEP 3: Insert into database
    const { error: insertError } = await supabase
      .from('court_cause_lists')
      .insert(allCases)

    if (insertError) throw insertError

    return NextResponse.json({ 
      message: `Successfully scraped and synced ${allCases.length} cause list entries from the Supreme Court for today.`,
      count: allCases.length
    })

  } catch (error: any) {
    console.error('Scraping Error:', error)
    return new NextResponse(`Error syncing cause list: ${error.message}`, { status: 500 })
  }
}
