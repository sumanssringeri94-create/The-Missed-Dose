import { describe, expect, it } from 'vitest'
import { clarificationMedicines, clarificationText } from './conflicts'
import type { Prescription } from '../types'

const medicine = (id: string, brand: string, generic: string) => ({ id, brand, generic, drugClass: 'Beta-blocker', strength: '50 mg', frequency: 'OD', duration: '30 days', confidence: { brand: 'high' as const, strength: 'high' as const, frequency: 'high' as const }, requires_human_verification: false, mappedBy: 'exact' as const })
const original: Prescription = { id: 'old', doctor: 'Dr A', date: '2026-01-01', medicines: [medicine('old-med', 'Metolar-50', 'Metoprolol')], source: 'demo' }
const incoming: Prescription = { id: 'new', doctor: 'Dr B', date: '2026-01-02', medicines: [medicine('new-med', 'Ciplar-40', 'Propranolol')], source: 'demo' }
const conflict = { severity: 'medium' as const, medicines: ['Metolar-50', 'Ciplar-40'], reason: 'Both medicines are in the Beta-blocker class.' }

describe('clarification notice pairing', () => {
  it('always identifies different original and new brands', () => {
    const pair = clarificationMedicines(conflict, [original], incoming)
    expect(pair.prior?.brand).toBe('Metolar-50')
    expect(pair.added?.brand).toBe('Ciplar-40')
    expect(pair.prior?.brand).not.toBe(pair.added?.brand)
    const message = clarificationText(conflict, [original], incoming)
    expect(message).toContain('currently taking Metolar-50')
    expect(message).toContain("Today's prescription adds Ciplar-40")
  })
})
