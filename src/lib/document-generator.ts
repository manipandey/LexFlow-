import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from 'docx'
import { formatNepaliDateInNepali } from './utils'

export interface DocumentData {
  clientName: string
  address: string
  caseNo: string
  court: string
  opponentName: string
  lawyerName: string
  legalDraftText?: string
  date?: string
}

const GLOBAL_FONT = 'Kalimati'
const FONT_SIZE = 32 // 16pt in half-points

// Page Setup: A4 with 1.5 inch Left Margin (1440 twips = 1 inch)
// 1.5 inches = 2160 twips for Left
const PAGE_SETUP = {
  size: {
    width: 11906, // A4
    height: 16838, // A4
  },
  margin: {
    top: 1440,    // 1 inch
    right: 1440,  // 1 inch
    bottom: 1440, // 1 inch
    left: 2160,   // 1.5 inches for binding
  },
}

export const generateLegalDocument = async (
  templateType: string,
  data: DocumentData
): Promise<Blob> => {
  let doc: Document

  switch (templateType) {
    case 'Vakalatnama':
      doc = generateNepaliVakalatnama(data)
      break
    case 'Legal Notice':
      doc = generateNepaliLegalNotice(data)
      break
    case 'Power of Attorney':
      doc = generateGenericTemplate('अधिकृत वारेसनामा', data)
      break
    default:
      doc = generateGenericTemplate(templateType, data)
  }

  return await Packer.toBlob(doc)
}

function P(text: string, options?: { bold?: boolean; align?: any, size?: number }) {
  return new Paragraph({
    alignment: options?.align || AlignmentType.JUSTIFIED,
    spacing: { line: 360 }, // 1.5 line spacing (240 is single, 360 is 1.5)
    children: [
      new TextRun({
        text,
        font: GLOBAL_FONT,
        size: options?.size || FONT_SIZE,
        bold: options?.bold || false,
      }),
    ],
  })
}

function P_Complex(runs: { text: string; bold?: boolean; underline?: boolean }[], align?: any) {
  return new Paragraph({
    alignment: align || AlignmentType.JUSTIFIED,
    spacing: { line: 360 },
    children: runs.map(
      (r) =>
        new TextRun({
          text: r.text,
          font: GLOBAL_FONT,
          size: FONT_SIZE,
          bold: r.bold || false,
          underline: r.underline ? {} : undefined,
        })
    ),
  })
}

function generateNepaliVakalatnama(data: DocumentData): Document {
  const docDate = data.date ? formatNepaliDateInNepali(data.date) : '....................................................'
  return new Document({
    creator: 'LexFlow System',
    title: 'Vakalatnama',
    styles: {
      default: {
        document: {
          run: {
            font: GLOBAL_FONT,
            size: FONT_SIZE,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: PAGE_SETUP,
        },
        children: [
          P('अनुसूची - १ (नियम १० सँग सम्बन्धित)', { align: AlignmentType.RIGHT, size: 28 }),
          P(''),
          P(`श्री ${data.court || '..........................'} अदालत`, { bold: true, align: AlignmentType.CENTER }),
          P('विषय: वकालतनामा', { bold: true, align: AlignmentType.CENTER }),
          P(''),
          P(`सम्वत् २०..... सालको रिट / पुनरावेदन / निवेदन / दे.मु. / फौ.मु. नम्बर ${data.caseNo || '.........................'}`),
          P_Complex([
            { text: 'पक्ष (वादी): ', bold: true },
            { text: data.clientName || '......................................................' },
          ]),
          P_Complex([
            { text: 'विपक्ष (प्रतिवादी): ', bold: true },
            { text: data.opponentName || '......................................................' },
          ]),
          P_Complex([
            { text: 'मुद्दा: ', bold: true },
            { text: '.........................................................................' },
          ]),
          P(''),
          P(`उपरोक्त मुद्दामा म ${data.clientName || '..........................'} बादी/प्रतिवादी/पुनरावेदक/प्रत्यर्थी/निवेदक भएको हुनाले, यो मुद्दा अन्तिम निर्णय नभएसम्म उपस्थित हुन, बहस पैरवी गर्न र मेरो नामको म्याद बुझिलिनसमेत तपाईं वरिष्ठ अधिवक्ता/अधिवक्ता/अभिवक्ता ${data.lawyerName || '..........................'} लाई मैले कानून व्यवसायी नियुक्त गरेको छु। आजका मितिमा यो वकालतनामा लेखिदिएको छु।`),
          P(''),
          P('यो मुद्दामा मलाई अहित हुने कुनै कार्य नगर्नुहोला। मेरो तर्फबाट मुद्दामा प्रतिनिधित्व गर्दा मुद्दाको परिणामलाई लिएर तपाईंउपर सो विषयमा कहीं कतै उजुरबाजुर गर्ने छैन।'),
          P(''),
          P_Complex([
            { text: 'पक्षको नाम र सही: ', bold: true },
            { text: '....................................................' }
          ]),
          P_Complex([
            { text: 'मिति: ', bold: true },
            { text: docDate }
          ]),
          P(''),
          P('-----------------------------------------------------------------------------------------', { align: AlignmentType.CENTER }),
          P(''),
          P('(अधिवक्ताको मन्जुरी खण्ड)', { bold: true, align: AlignmentType.CENTER }),
          P(`तपाईं श्री ${data.clientName || '..........................'} ले उपर्युक्त बेहोराको वकालतनामा मलाई दिनुभएकोले, पक्षको तर्फबाट उपर्युक्त मुद्दामा बहस पैरवी गर्न मेरो मन्जुरी छ। यस मुद्दामा तपाईंलाई अहित हुने कुनै कार्य गर्ने छैन।`),
          P(''),
          P_Complex([
            { text: 'अधिवक्ताको नाम र सही: ', bold: true },
            { text: '....................................................' }
          ]),
          P_Complex([
            { text: 'मिति: ', bold: true },
            { text: docDate }
          ]),
        ],
      },
    ],
  })
}

function generateNepaliLegalNotice(data: DocumentData): Document {
  return generateGenericTemplate('कानूनी सूचना (Legal Notice)', data)
}

function generateGenericTemplate(title: string, data: DocumentData): Document {
  const docDate = data.date ? formatNepaliDateInNepali(data.date) : '...................'
  return new Document({
    creator: 'LexFlow System',
    title,
    styles: {
      default: {
        document: {
          run: {
            font: GLOBAL_FONT,
            size: FONT_SIZE,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: PAGE_SETUP,
        },
        children: [
          P(title, { bold: true, align: AlignmentType.CENTER }),
          P(''),
          P(`मिति: ${docDate}`),
          P(''),
          P_Complex([
            { text: 'विषय: ', bold: true },
            { text: '.........................................................' },
          ]),
          P(''),
          P(`पक्ष (Client): ${data.clientName || '................................'}`),
          P(`विपक्ष (Opponent): ${data.opponentName || '................................'}`),
          P(`मुद्दा नम्बर: ${data.caseNo || '................................'}`),
          P(`अदालत: ${data.court || '................................'}`),
          P(''),
          P(data.legalDraftText || '[यहाँ कानूनी मस्यौदा तयार गर्नुहोस् (Draft your legal text here...)]'),
        ],
      },
    ],
  })
}
