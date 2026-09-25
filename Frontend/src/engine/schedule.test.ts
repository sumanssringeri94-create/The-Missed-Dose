import { describe, expect, it } from 'vitest'
import { buildSchedule, doseStatus, doseWindowLabel } from './schedule'
import type { DoseEvent, Medicine } from '../types'

const medicine: Medicine = { id: 'aml', brand: 'Amlong', strength: '5 mg', frequency: 'OD', duration: '30 days', confidence: { brand: 'high', strength: 'high', frequency: 'high' }, requires_human_verification: false }
const dose = buildSchedule([medicine])[0]
const at = (hour: number, minute: number): Date => new Date(2026, 8, 25, hour, minute)
const event = (status: DoseEvent['status']): DoseEvent => ({ id: status, doseId: dose.id, status, timestamp: '2026-09-25T08:12:00.000Z' })

describe('time-aware medication schedule', () => {
  it('keeps a dose upcoming before its window', () => expect(doseStatus(dose, [], at(7, 59))).toBe('UPCOMING'))
  it('activates a dose inside its full medication window', () => expect(doseStatus(dose, [], at(9, 0))).toBe('ACTIVE'))
  it('shows a window-ended dose as missed without creating an event', () => expect(doseStatus(dose, [], at(10, 1))).toBe('MISSED'))
  it('honors recorded taken and missed events over the clock', () => { expect(doseStatus(dose, [event('taken')], at(23, 0))).toBe('TAKEN'); expect(doseStatus(dose, [event('missed')], at(9, 0))).toBe('MISSED') })
  it('formats a visible medication window', () => expect(doseWindowLabel(dose)).toBe('8:00 AM - 10:00 AM'))
})
