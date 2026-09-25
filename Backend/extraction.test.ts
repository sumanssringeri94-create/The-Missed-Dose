import { describe, expect, it } from 'vitest'
import { cachedDemoExtraction, extractPrescription, type FetchLike } from './extraction'

const image = Buffer.from('demo-image')
const extraction = { doctor: 'Dr. Gemini', date: '2026-09-25', medicines: [{ brand: 'Dolo', strength: '500 mg', frequency: 'OD', duration: '5 days', confidence: { brand: 'high', strength: 'high', frequency: 'high' }, requires_human_verification: false }] }
const response = (body: unknown, status = 200): Response => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('provider fallback extraction', () => {
  it('uses Gemini first when it succeeds', async () => {
    const fetchMock: FetchLike = async (url) => String(url).includes('generativelanguage') ? response({ candidates: [{ content: { parts: [{ text: JSON.stringify(extraction) }] } }] }) : response({ choices: [] })
    const result = await extractPrescription({ image, mimeType: 'image/jpeg', googleApiKey: 'google-test', groqApiKey: 'groq-test', fetchImpl: fetchMock })
    expect(result.source).toBe('gemini')
    expect(result.doctor).toBe('Dr. Gemini')
  })

  it('falls back to Groq when Gemini fails', async () => {
    const groqExtraction = { ...extraction, doctor: 'Dr. Groq' }
    const fetchMock: FetchLike = async (url) => String(url).includes('generativelanguage') ? response({ error: 'timeout' }, 500) : response({ choices: [{ message: { content: JSON.stringify(groqExtraction) } }] })
    const result = await extractPrescription({ image, mimeType: 'image/jpeg', googleApiKey: 'google-test', groqApiKey: 'groq-test', fetchImpl: fetchMock })
    expect(result.source).toBe('groq')
    expect(result.doctor).toBe('Dr. Groq')
  })

  it('falls back to cached demo data when both providers fail', async () => {
    const fetchMock: FetchLike = async () => response({ error: 'unavailable' }, 503)
    const result = await extractPrescription({ image, mimeType: 'image/jpeg', googleApiKey: 'google-test', groqApiKey: 'groq-test', fetchImpl: fetchMock, logger: () => undefined })
    expect(result.source).toBe('cache')
    expect(result.medicines).toEqual(cachedDemoExtraction.medicines)
  })

  it('uses the cached demo when no provider keys are configured', async () => {
    const result = await extractPrescription({ image, mimeType: 'image/jpeg', logger: () => undefined })
    expect(result.source).toBe('cache')
    expect(result.medicines).toEqual(cachedDemoExtraction.medicines)
  })
})
