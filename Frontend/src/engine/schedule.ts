import type { Dose, Medicine } from '../types'

const anchors = ['wake-up', 'breakfast', 'lunch', 'dinner', 'bedtime'] as const

export function buildSchedule(medicines: Medicine[]): Dose[] {
  return medicines.flatMap((medicine) => {
    const frequency = medicine.frequency.toLowerCase()
    const count = frequency.includes('qid') || frequency.includes('four') ? 4 : frequency.includes('tds') || frequency.includes('three') ? 3 : frequency.includes('bd') || frequency.includes('twice') ? 2 : 1
    const selected = count === 4 ? ['wake-up', 'lunch', 'dinner', 'bedtime'] : count === 3 ? ['breakfast', 'lunch', 'dinner'] : count === 2 ? ['breakfast', 'dinner'] : frequency.includes('hs') || frequency.includes('bed') ? ['bedtime'] : ['wake-up']
    return selected.map((routine, index) => ({ id: `${medicine.id}-${index}`, medicineId: medicine.id, medicineLabel: `${medicine.brand} ${medicine.strength}`, routine, taken: false }))
  })
}

export function routineLabel(routine: string): string {
  return routine === 'wake-up' ? 'Subah, uthte hi' : routine === 'breakfast' ? 'Nashta ke baad' : routine === 'lunch' ? 'Dopahar ke khane ke baad' : routine === 'dinner' ? 'Raat ke khane ke baad' : 'Sone se pehle'
}

export { anchors }
