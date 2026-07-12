import React from 'react'
import { DocumentData } from '@/lib/document-generator'
import { formatNepaliDateInNepali } from '@/lib/utils'

interface DocumentPreviewProps {
  templateType: string
  data: DocumentData
}

export function DocumentPreview({ templateType, data }: DocumentPreviewProps) {
  const docDate = data.date ? formatNepaliDateInNepali(data.date) : '...................'
  // Common styled wrapper for the A4 paper look
  const Paper = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-white text-black shadow-xl mx-auto rounded-sm overflow-hidden" 
         style={{ 
           width: '100%', 
           maxWidth: '800px', 
           aspectRatio: '1 / 1.414', // A4 aspect ratio
           padding: '1in 1in 1in 1.5in', // 1.5 inch left margin
           fontFamily: 'system-ui, -apple-system, sans-serif', // Fallback
         }}>
      <div 
        className="h-full w-full overflow-y-auto pr-4 custom-scrollbar" 
        style={{ 
          fontFamily: "'Kalimati', sans-serif", 
          fontSize: '16px', 
          lineHeight: '1.8', 
          textAlign: 'justify' 
        }}>
        {children}
      </div>
    </div>
  )

  const Highlight = ({ children }: { children: React.ReactNode }) => (
    <span className="bg-yellow-200/50 px-1 rounded">{children}</span>
  )

  if (templateType === 'Vakalatnama') {
    return (
      <Paper>
        <div className="text-right text-lg mb-4">अनुसूची - १ (नियम १० सँग सम्बन्धित)</div>
        <div className="text-center font-bold text-lg mb-2">श्री <Highlight>{data.court || '..........................'}</Highlight> अदालत</div>
        <div className="text-center font-bold text-lg mb-6">विषय: वकालतनामा</div>

        <div className="mb-4">सम्वत् २०..... सालको रिट / पुनरावेदन / निवेदन / दे.मु. / फौ.मु. नम्बर <Highlight>{data.caseNo || '.........................'}</Highlight></div>
        
        <div className="mb-2"><span className="font-bold">पक्ष (वादी):</span> <Highlight>{data.clientName || '......................................................'}</Highlight></div>
        <div className="mb-2"><span className="font-bold">विपक्ष (प्रतिवादी):</span> <Highlight>{data.opponentName || '......................................................'}</Highlight></div>
        <div className="mb-6"><span className="font-bold">मुद्दा:</span> .........................................................................</div>

        <div className="mb-6">
          उपरोक्त मुद्दामा म <Highlight>{data.clientName || '..........................'}</Highlight> बादी/प्रतिवादी/पुनरावेदक/प्रत्यर्थी/निवेदक भएको हुनाले, 
          यो मुद्दा अन्तिम निर्णय नभएसम्म उपस्थित हुन, बहस पैरवी गर्न र मेरो नामको म्याद बुझिलिनसमेत 
          तपाईं वरिष्ठ अधिवक्ता/अधिवक्ता/अभिवक्ता <Highlight>{data.lawyerName || '..........................'}</Highlight> लाई मैले कानून व्यवसायी नियुक्त गरेको छु। 
          आजका मितिमा यो वकालतनामा लेखिदिएको छु।
        </div>

        <div className="mb-8">
          यो मुद्दामा मलाई अहित हुने कुनै कार्य नगर्नुहोला। मेरो तर्फबाट मुद्दामा प्रतिनिधित्व गर्दा मुद्दाको परिणामलाई लिएर 
          तपाईंउपर सो विषयमा कहीं कतै उजुरबाजुर गर्ने छैन।
        </div>

        <div className="flex justify-between mb-12">
          <div>
            <div className="font-bold">पक्षको नाम र सही:</div>
            <div>....................................................</div>
          </div>
          <div>
            <div className="font-bold">मिति:</div>
            <div><Highlight>{docDate}</Highlight></div>
          </div>
        </div>

        <div className="border-t border-dashed border-gray-400 my-8"></div>

        <div className="text-center font-bold mb-6">(अधिवक्ताको मन्जुरी खण्ड)</div>

        <div className="mb-8">
          तपाईं श्री <Highlight>{data.clientName || '..........................'}</Highlight> ले उपर्युक्त बेहोराको वकालतनामा मलाई दिनुभएकोले, 
          पक्षको तर्फबाट उपर्युक्त मुद्दामा बहस पैरवी गर्न मेरो मन्जुरी छ। यस मुद्दामा तपाईंलाई अहित हुने कुनै कार्य गर्ने छैन।
        </div>

        <div className="flex justify-between mb-8">
          <div>
            <div className="font-bold">अधिवक्ताको नाम र सही:</div>
            <div>....................................................</div>
          </div>
          <div>
            <div className="font-bold">मिति:</div>
            <div><Highlight>{docDate}</Highlight></div>
          </div>
        </div>
      </Paper>
    )
  }

  // Default / Legal Notice Preview
  return (
    <Paper>
      <div className="text-center font-bold text-lg mb-8">{templateType}</div>
      <div className="mb-4">मिति: <Highlight>{docDate}</Highlight></div>
      <div className="mb-6"><span className="font-bold">विषय:</span> .........................................................</div>
      
      <div className="mb-2">पक्ष (Client): <Highlight>{data.clientName || '................................'}</Highlight></div>
      <div className="mb-2">विपक्ष (Opponent): <Highlight>{data.opponentName || '................................'}</Highlight></div>
      <div className="mb-2">मुद्दा नम्बर: <Highlight>{data.caseNo || '................................'}</Highlight></div>
      <div className="mb-8">अदालत: <Highlight>{data.court || '................................'}</Highlight></div>
      
      <div className="italic text-gray-800 whitespace-pre-wrap">
        {data.legalDraftText || '[यहाँ कानूनी मस्यौदा तयार गर्नुहोस् (Draft your legal text here...)]'}
      </div>
    </Paper>
  )
}
