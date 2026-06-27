'use server'

import { GoogleGenAI } from '@google/genai'

export async function autoDraftLegalText(context: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    // Return a beautiful fallback if the user hasn't configured an API key yet
    return `[चेतावनी: GEMINI_API_KEY फेला परेन। कृपया आफ्नो .env.local फाइलमा API key राख्नुहोस्।]

मैले तल उल्लिखित तथ्यहरूको आधारमा यो मस्यौदा तयार गरेको छु:
${context}

(यहाँ वास्तविक कानूनी मस्यौदा आउनेछ जब तपाईंले API key राख्नुहुनेछ।)`
  }

  try {
    const ai = new GoogleGenAI({ apiKey })

    const prompt = `
You are an expert Nepalese lawyer. Your task is to take raw, informal facts about a case and write a highly formal, strictly structured legal narrative (मस्यौदा) in pure Nepali (Devanagari script) suitable for a court document (like a Legal Notice, Petition, or Affidavit).

Rules:
1. DO NOT include greetings (like Namaste, Dear Sir).
2. DO NOT include the header, subject, or footer (the template engine handles that).
3. ONLY write the core legal narrative/body.
4. Use highly formal Nepali legal terminology (अदालती भाषा).
5. Output ONLY the Devanagari text, nothing else. No markdown formatting.

Raw Case Context provided by the client/lawyer:
"${context}"
    `

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    })

    return response.text || 'मस्यौदा तयार गर्न सकिएन।'
  } catch (error) {
    console.error('Gemini Drafting Error:', error)
    return `[त्रुटि: AI मस्यौदा तयार गर्दा समस्या आयो।]`
  }
}
