import type { DoseEvent } from '../types'

export const MISSED_DOSE_COPY = 'Please check your prescription or ask your pharmacist or doctor what to do about this dose.'
export const DUPLICATE_DOSE_COPY = 'Are you recording the same dose again?'
export const URGENT_DUPLICATE_COPY = 'Please contact a doctor, pharmacist or emergency service now.'

export function recordDose(doseId: string, previous: DoseEvent[], timestamp = new Date().toISOString()): DoseEvent {
  const prior = previous.find((event) => event.doseId === doseId && event.status === 'taken')
  return { id: crypto.randomUUID(), doseId, status: prior ? 'duplicate' : 'taken', timestamp }
}

export function missedDose(doseId: string, timestamp = new Date().toISOString()): DoseEvent {
  return { id: crypto.randomUUID(), doseId, status: 'missed', timestamp }
}
