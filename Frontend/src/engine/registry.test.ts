import { describe, expect, it } from 'vitest'
import { MockRegistryProvider, verifyDoctor } from './registry'
import type { Prescription } from '../types'

const rx: Prescription = { id: 'rx', doctor: 'Dr. A. Mehta', doctorRegistration: 'NMC-MH-1001', hospital: 'Sahyadri Clinic', date: '2026-09-24', medicines: [], source: 'demo' }

describe('doctor registration provider', () => {
  it('verifies the bundled demo record', () => expect(verifyDoctor(rx, new MockRegistryProvider())).toBe('Verified'))
  it('defaults missing registrations to Unverified', () => expect(verifyDoctor({ ...rx, doctorRegistration: undefined })).toBe('Unverified'))
  it('never labels a mismatch as fake', () => expect(verifyDoctor({ ...rx, doctorRegistration: 'NMC-MH-1001', doctor: 'Dr. Other' })).toBe('Inconsistent'))
})
