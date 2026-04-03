import { GoogleGenerativeAI } from '@google/generative-ai'

const MODEL = 'gemini-2.0-flash'

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set')
  return new GoogleGenerativeAI(apiKey)
}

export async function callGemini(prompt: string): Promise<unknown> {
  const genAI = getClient()
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      // Ask Gemini to respond with JSON directly
      responseMimeType: 'application/json',
    },
  })

  const result = await model.generateContent(prompt)
  const response = result.response

  // Check for safety blocks or empty responses
  const finishReason = response.candidates?.[0]?.finishReason
  if (finishReason && finishReason !== 'STOP' && finishReason !== 'MAX_TOKENS') {
    throw new Error(`Gemini blocked the response: ${finishReason}`)
  }

  let text: string
  try {
    text = response.text().trim()
  } catch (e) {
    throw new Error(`Gemini returned no text: ${e instanceof Error ? e.message : String(e)}`)
  }

  if (!text) {
    throw new Error('Gemini returned an empty response')
  }

  try {
    // Strip markdown code blocks if present (some models still add them)
    const cleaned = text
      .replace(/^```(?:json)?\n?/i, '')
      .replace(/\n?```$/i, '')
      .trim()
    return JSON.parse(cleaned)
  } catch {
    throw new Error(`Failed to parse Gemini response as JSON: ${text.slice(0, 200)}`)
  }
}
