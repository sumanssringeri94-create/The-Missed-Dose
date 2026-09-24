import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import multer from 'multer'
import Groq from 'groq-sdk'

const app = express()
const upload = multer({ limits: { fileSize: 8 * 1024 * 1024 } })
app.use(cors())
app.use(express.json())

const extractionPrompt = `You extract Indian prescription photos. Return JSON only, no markdown, using this exact shape: {"doctor":"string","doctorRegistration":"string or empty","hospital":"string or empty","date":"YYYY-MM-DD or empty","medicines":[{"brand":"string","strength":"string","frequency":"string","duration":"string","confidence":{"brand":"high|low","strength":"high|low","frequency":"high|low"},"requires_human_verification":true}]} Never guess. If a word or field is ambiguous, preserve uncertainty with low confidence and requires_human_verification true. Only critical strength or molecule uncertainty should block review. Keep Indian routine abbreviations such as OD, BD, TDS, pc, ac, hs.`

function isExtraction(value: unknown): value is { doctor: string; date: string; medicines: unknown[] } {
  if (!value || typeof value !== 'object') return false
  const candidate = value as { doctor?: unknown; date?: unknown; medicines?: unknown }
  return typeof candidate.doctor === 'string' && typeof candidate.date === 'string' && Array.isArray(candidate.medicines)
}

app.post('/server/extract', upload.single('image'), async (request, response) => {
  if (!request.file) return response.status(400).json({ error: 'Prescription image is required.' })
  if (!process.env.GROQ_API_KEY) return response.status(503).json({ error: 'Extraction service is not configured.' })
  try {
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const mediaType = request.file.mimetype === 'image/png' ? 'image/png' : request.file.mimetype === 'image/webp' ? 'image/webp' : 'image/jpeg'
    const model = process.env.GROQ_MODEL ?? 'meta-llama/llama-4-scout-17b-16e-instruct'
    const result = await client.chat.completions.create({ model, max_tokens: 1600, temperature: 0, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: extractionPrompt }, { role: 'user', content: [{ type: 'text', text: 'Extract this prescription. JSON only.' }, { type: 'image_url', image_url: { url: `data:${mediaType};base64,${request.file.buffer.toString('base64')}` } }] }] })
    const content = result.choices[0]?.message.content
    if (!content) throw new Error('No extraction returned')
    const extraction: unknown = JSON.parse(content)
    if (!isExtraction(extraction)) throw new Error('The model returned an incomplete prescription')
    return response.json(extraction)
  } catch (error) {
    console.error('Extraction failed', error)
    if (error && typeof error === 'object' && 'status' in error && error.status === 404) return response.status(503).json({ error: 'The configured Groq model is unavailable or does not support vision. Set GROQ_MODEL to a vision-capable model enabled for your Groq account.' })
    return response.status(502).json({ error: 'The prescription could not be read. Please try a clearer photo or use cached demo data.' })
  }
})

app.get('/health', (_request, response) => response.json({ ok: true }))
const port = Number(process.env.PORT ?? 8787)
app.listen(port, () => console.log(`VitaForge server listening on http://localhost:${port}`))
