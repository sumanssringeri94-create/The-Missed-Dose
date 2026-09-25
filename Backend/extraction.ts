export type ExtractionMedicine = {
  brand: string
  strength: string
  frequency: string
  duration: string
  confidence: { brand: 'high' | 'low'; strength: 'high' | 'low'; frequency: 'high' | 'low' }
  requires_human_verification: boolean
}

export type Extraction = {
  doctor: string
  doctorRegistration?: string
  hospital?: string
  date: string
  medicines: ExtractionMedicine[]
}

export type ExtractionResult = Extraction & { source: 'gemini' | 'groq' | 'cache' }
export type FetchLike = typeof fetch

export const extractionPrompt = `You extract Indian prescription photos. Return JSON only, with no markdown fences, using this exact shape: {"doctor":"string","doctorRegistration":"string or empty","hospital":"string or empty","date":"YYYY-MM-DD or empty","medicines":[{"brand":"string","strength":"string","frequency":"string","duration":"string","confidence":{"brand":"high|low","strength":"high|low","frequency":"high|low"},"requires_human_verification":true}]} Never guess. If a word or field is ambiguous, preserve uncertainty with low confidence and requires_human_verification true. Only critical strength or molecule uncertainty should block review. Keep Indian routine abbreviations such as OD, BD, TDS, pc, ac, hs.`

export const cachedDemoExtraction: Extraction = {
  doctor: 'Dr. R. Kapoor',
  doctorRegistration: '',
  hospital: '',
  date: new Date().toISOString().slice(0, 10),
  medicines: [
    { brand: 'Augmentin', strength: '500 mg', frequency: 'TDS', duration: '5 days', confidence: { brand: 'high', strength: 'high', frequency: 'high' }, requires_human_verification: false },
    { brand: 'Amlong', strength: '5 mg', frequency: 'OD', duration: '30 days', confidence: { brand: 'high', strength: 'high', frequency: 'high' }, requires_human_verification: false },
    { brand: 'Pan-40', strength: '40 mg', frequency: 'OD', duration: '30 days', confidence: { brand: 'high', strength: 'low', frequency: 'high' }, requires_human_verification: true },
  ],
}

export function isExtraction(value: unknown): value is Extraction {
  if (!value || typeof value !== 'object') return false
  const candidate = value as { doctor?: unknown; date?: unknown; medicines?: unknown }
  return typeof candidate.doctor === 'string' && typeof candidate.date === 'string' && Array.isArray(candidate.medicines)
}

function parseJson(value: string): Extraction {
  const withoutFence = value.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  const parsed: unknown = JSON.parse(withoutFence)
  if (!isExtraction(parsed)) throw new Error('Model returned an incomplete prescription')
  return parsed
}

async function withTimeout<T>(operation: (signal: AbortSignal) => Promise<T>, milliseconds: number): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), milliseconds)
  try { return await operation(controller.signal) } finally { clearTimeout(timer) }
}

async function callGemini(image: Buffer, mimeType: string, apiKey: string, model: string, fetchImpl: FetchLike): Promise<Extraction> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`
  const result = await withTimeout((signal) => fetchImpl(url, { method: 'POST', signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: extractionPrompt }, { inline_data: { mime_type: mimeType, data: image.toString('base64') } }] }], generationConfig: { responseMimeType: 'application/json' } }) }), 10_000)
  if (!result.ok) throw new Error(`Gemini HTTP ${result.status}`)
  const payload = await result.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini returned no text')
  return parseJson(text)
}

async function callGroq(image: Buffer, mimeType: string, apiKey: string, model: string, fetchImpl: FetchLike): Promise<Extraction> {
  const result = await withTimeout((signal) => fetchImpl('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', signal, headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model, max_tokens: 1600, temperature: 0, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: extractionPrompt }, { role: 'user', content: [{ type: 'text', text: 'Extract this prescription. JSON only.' }, { type: 'image_url', image_url: { url: `data:${mimeType};base64,${image.toString('base64')}` } }] }] }) }), 10_000)
  if (!result.ok) throw new Error(`Groq HTTP ${result.status}`)
  const payload = await result.json() as { choices?: Array<{ message?: { content?: string } }> }
  const content = payload.choices?.[0]?.message?.content
  if (!content) throw new Error('Groq returned no text')
  return parseJson(content)
}

export async function extractPrescription(options: { image: Buffer; mimeType: string; googleApiKey?: string; geminiModel?: string; groqApiKey?: string; groqModel?: string; fetchImpl?: FetchLike; logger?: (message: string) => void }): Promise<ExtractionResult> {
  const fetchImpl = options.fetchImpl ?? fetch
  const logger = options.logger ?? console.warn
  if (options.googleApiKey) {
    try { return { ...(await callGemini(options.image, options.mimeType, options.googleApiKey, options.geminiModel ?? 'gemini-2.5-flash', fetchImpl)), source: 'gemini' } }
    catch (error) { logger(`Gemini extraction failed; falling back to Groq: ${error instanceof Error ? error.message : String(error)}`) }
  }
  if (options.groqApiKey) {
    try { return { ...(await callGroq(options.image, options.mimeType, options.groqApiKey, options.groqModel ?? 'meta-llama/llama-4-scout-17b-16e-instruct', fetchImpl)), source: 'groq' } }
    catch (error) { logger(`Groq extraction failed; falling back to cache: ${error instanceof Error ? error.message : String(error)}`) }
  }
  return { ...cachedDemoExtraction, source: 'cache' }
}
