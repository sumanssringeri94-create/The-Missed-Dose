import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import multer from 'multer'
import { extractPrescription } from './extraction.js'

const app = express()
const upload = multer({ limits: { fileSize: 8 * 1024 * 1024 } })
app.use(cors())
app.use(express.json())

app.post('/server/extract', upload.single('image'), async (request, response) => {
  if (!request.file) return response.status(400).json({ error: 'Prescription image is required.' })
  try {
    const mediaType = request.file.mimetype === 'image/png' ? 'image/png' : request.file.mimetype === 'image/webp' ? 'image/webp' : 'image/jpeg'
    const extraction = await extractPrescription({ image: request.file.buffer, mimeType: mediaType, googleApiKey: process.env.GOOGLE_API_KEY, geminiModel: process.env.GEMINI_MODEL, groqApiKey: process.env.GROQ_API_KEY, groqModel: process.env.GROQ_MODEL })
    return response.json(extraction)
  } catch (error) {
    console.error('Extraction failed', error)
    return response.status(500).json({ error: 'The cached prescription could not be loaded.' })
  }
})

app.get('/health', (_request, response) => response.json({ ok: true }))
const port = Number(process.env.PORT ?? 8787)
app.listen(port, () => {
  console.log(`VitaForge server listening on http://localhost:${port}`)
  console.log(`Provider configuration: GOOGLE_API_KEY=${process.env.GOOGLE_API_KEY ? 'found' : 'not found'}, GROQ_API_KEY=${process.env.GROQ_API_KEY ? 'found' : 'not found'}`)
})
