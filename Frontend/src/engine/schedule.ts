import type { Dose, DoseEvent, DoseStatus, Medicine } from '../types'

const anchors = ['wake-up', 'breakfast', 'lunch', 'dinner', 'bedtime'] as const
const windows: Record<string, { start: number; end: number }> = {
  'wake-up': { start: 8 * 60, end: 10 * 60 },
  breakfast: { start: 8 * 60, end: 10 * 60 },
  lunch: { start: 13 * 60, end: 15 * 60 },
  dinner: { start: 20 * 60, end: 22 * 60 },
  bedtime: { start: 22 * 60, end: 23 * 60 + 30 },
}

export function buildSchedule(medicines: Medicine[]): Dose[] {
  return medicines.flatMap((medicine) => {
    const frequency = medicine.frequency.toLowerCase()
    const count = frequency.includes('qid') || frequency.includes('four') ? 4 : frequency.includes('tds') || frequency.includes('three') ? 3 : frequency.includes('bd') || frequency.includes('twice') ? 2 : 1
    const selected = count === 4 ? ['wake-up', 'lunch', 'dinner', 'bedtime'] : count === 3 ? ['breakfast', 'lunch', 'dinner'] : count === 2 ? ['breakfast', 'dinner'] : frequency.includes('hs') || frequency.includes('bed') ? ['bedtime'] : ['wake-up']
    return selected.map((routine, index) => {
      const window = windows[routine] ?? windows['wake-up']
      return { id: `${medicine.id}-${index}`, medicineId: medicine.id, medicineLabel: `${medicine.brand} ${medicine.strength}`, routine, taken: false, scheduledMinutes: window.start, windowEndMinutes: window.end }
    })
  })
}

export function routineLabel(routine: string): string {
  return routine === 'wake-up' ? 'Subah, uthte hi' : routine === 'breakfast' ? 'Nashta ke baad' : routine === 'lunch' ? 'Dopahar ke khane ke baad' : routine === 'dinner' ? 'Raat ke khane ke baad' : 'Sone se pehle'
}

export function formatDoseTime(minutes: number): string {
  const hour = Math.floor(minutes / 60)
  const minute = minutes % 60
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`
}

export function doseStatus(dose: Dose, events: DoseEvent[], now = new Date()): DoseStatus {
  const latest = events.filter((event) => event.doseId === dose.id).sort((left, right) => right.timestamp.localeCompare(left.timestamp))[0]
  if (latest?.status === 'taken') return 'TAKEN'
  if (latest?.status === 'missed') return 'MISSED'
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  if (currentMinutes < dose.scheduledMinutes) return 'UPCOMING'
  if (currentMinutes <= dose.windowEndMinutes) return 'ACTIVE'
  return 'MISSED'
}

export function doseWindowLabel(dose: Dose): string {
  return `${formatDoseTime(dose.scheduledMinutes)} - ${formatDoseTime(dose.windowEndMinutes)}`
}

export { anchors }
