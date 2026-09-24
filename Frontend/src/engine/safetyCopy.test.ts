import { describe, expect, it } from 'vitest'
import { clarificationText } from './conflicts'
import type { Prescription } from '../types'

describe('hard safety language', () => {
  it('does not emit forbidden dose instructions', () => {
    const rx: Prescription = { id: 'rx', doctor: 'Doctor', date: '2026-09-24', source: 'demo', medicines: [{ id: 'one', brand: 'A', generic: 'Metoprolol', drugClass: 'Beta-blocker', strength: '50 mg', frequency: 'OD', duration: '30 days', confidence: { brand: 'high', strength: 'high', frequency: 'high' }, requires_human_verification: false, mappedBy: 'exact' }] }
    const output = clarificationText({ severity: 'high', medicines: ['A'], reason: 'Please confirm with your doctor or pharmacist.' }, [], rx).toLowerCase()
    expect(output).not.toMatch(/stop taking|skip this dose|discontinue|take an extra/)
  })
})
