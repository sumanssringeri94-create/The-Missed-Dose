import { describe, expect, it } from 'vitest'
import { checkAllergies, checkAmbiguity, checkInconsistencies } from './safety'
import type { PatientProfile, Prescription } from '../types'

const profile: PatientProfile = { id: 'patient', name: 'Ramesh', age: '62', sex: 'Male', emergencyContact: '', conditions: 'diabetes', allergies: 'Penicillin', currentMedications: '' }
const base = (medicines: Prescription['medicines']): Prescription => ({ id: 'rx', doctor: 'Dr Test', date: '2026-09-24', medicines, source: 'demo' })
const medicine = (brand: string, generic: string, strength = '500 mg', frequency = 'OD') => ({ id: crypto.randomUUID(), brand, generic, strength, frequency, duration: '5 days', confidence: { brand: 'high' as const, strength: 'high' as const, frequency: 'high' as const }, requires_human_verification: false, mappedBy: 'exact' as const })

describe('safety additions', () => {
  it('flags penicillin family medicines for a penicillin allergy', () => expect(checkAllergies(base([medicine('Augmentin', 'Amoxicillin')]), profile)[0].level).toBe('urgent_verify'))
  it('flags conflicting strength or frequency for one medicine', () => expect(checkInconsistencies(base([medicine('A', 'Metformin', '500 mg'), medicine('B', 'Metformin', '850 mg')]))[0].level).toBe('urgent_verify'))
  it('flags unclear critical fields', () => expect(checkAmbiguity(base([{ ...medicine('Unknown', 'Unknown'), strength: '', confidence: { brand: 'low', strength: 'low', frequency: 'low' } }]))[0].level).toBe('urgent_verify'))
})
