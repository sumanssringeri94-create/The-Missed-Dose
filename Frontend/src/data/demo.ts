import type { ExtractionResponse, Prescription } from '../types'

export const demoFirstExtraction: ExtractionResponse = {
  doctor: 'Dr. A. Mehta', doctorRegistration: 'NMC-MH-1001', hospital: 'Sahyadri Clinic', date: '2026-09-24', medicines: [{ brand: 'Glycomet', strength: '500 mg', frequency: 'BD', duration: '30 days', confidence: { brand: 'high', strength: 'high', frequency: 'high' }, requires_human_verification: false }],
}

export const demoSecondExtraction: ExtractionResponse = {
  doctor: 'Dr. R. Kapoor', date: '2026-09-24', medicines: [
    { brand: 'Augmentin', strength: '500 mg', frequency: 'TDS', duration: '5 days', confidence: { brand: 'high', strength: 'high', frequency: 'high' }, requires_human_verification: false },
    { brand: 'Amlong', strength: '5 mg', frequency: 'OD', duration: '30 days', confidence: { brand: 'high', strength: 'high', frequency: 'high' }, requires_human_verification: false },
    { brand: 'Pan-40', strength: '40 mg', frequency: 'OD', duration: '30 days', confidence: { brand: 'high', strength: 'low', frequency: 'high' }, requires_human_verification: true },
  ],
}

export function extractionToPrescription(extraction: ExtractionResponse, source: Prescription['source']): Prescription {
  return { ...extraction, id: crypto.randomUUID(), source, medicines: extraction.medicines.map((medicine) => ({ ...medicine, id: crypto.randomUUID() })) }
}
