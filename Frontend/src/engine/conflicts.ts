import type { Conflict, Medicine, Prescription } from '../types'

const interactionTable: Array<{ first: string; second: string; reason: string }> = [
  { first: 'aspirin', second: 'ibuprofen', reason: 'Aspirin and ibuprofen can increase stomach bleeding risk when taken together.' },
  { first: 'aspirin', second: 'warfarin', reason: 'Aspirin and warfarin can increase bleeding risk when combined.' },
  { first: 'metoprolol', second: 'propranolol', reason: 'Both medicines slow the heart rate and lower blood pressure.' },
]

function genericParts(medicine: Medicine): string[] {
  return (medicine.generic ?? '').toLowerCase().split('+').map((part) => part.trim()).filter(Boolean)
}

function hasPart(medicine: Medicine, value: string): boolean {
  return genericParts(medicine).some((part) => part.includes(value))
}

export function findConflicts(newPrescription: Prescription, ledger: Prescription[]): Conflict[] {
  const existing = ledger.flatMap((prescription) => prescription.medicines)
  const conflicts: Conflict[] = []
  for (const incoming of newPrescription.medicines) {
    if (!incoming.generic || incoming.mappedBy === 'unknown') {
      conflicts.push({ severity: 'high', medicines: [incoming.brand], reason: `${incoming.brand} is not recognized. Please ask a pharmacist to verify the generic medicine before adding it.` })
      continue
    }
    for (const prior of existing) {
      if (incoming.generic.toLowerCase() === prior.generic?.toLowerCase()) {
        conflicts.push({ severity: 'high', medicines: [prior.brand, incoming.brand], reason: `These are two brands for the same medicine (${incoming.generic}). Please ask a pharmacist or doctor to verify the complete list.` })
      }
      if (incoming.drugClass && incoming.drugClass === prior.drugClass && incoming.generic !== prior.generic) {
        conflicts.push({ severity: 'medium', medicines: [prior.brand, incoming.brand], reason: `Both medicines are in the ${incoming.drugClass} class. Please ask a pharmacist or doctor whether both are intended.` })
      }
      for (const interaction of interactionTable) {
        const matches = (hasPart(incoming, interaction.first) && hasPart(prior, interaction.second)) || (hasPart(incoming, interaction.second) && hasPart(prior, interaction.first))
        if (matches) conflicts.push({ severity: 'high', medicines: [prior.brand, incoming.brand], reason: interaction.reason })
      }
    }
  }
  return conflicts.filter((conflict, index, all) => all.findIndex((item) => item.reason === conflict.reason && item.medicines.join('|') === conflict.medicines.join('|')) === index)
}

export function clarificationText(conflict: Conflict, ledger: Prescription[], incoming: Prescription): string {
  const prior = ledger.flatMap((item) => item.medicines).find((medicine) => medicine.brand === conflict.medicines[0])
  const added = incoming.medicines.find((medicine) => medicine.brand === conflict.medicines[conflict.medicines.length - 1])
  return `Notice for Pharmacist/Doctor: Patient is currently taking ${prior?.brand ?? conflict.medicines[0]}${prior?.strength ? ` (${prior.generic} ${prior.strength} ${prior.frequency})` : ''}. Today's prescription adds ${added?.brand ?? conflict.medicines[conflict.medicines.length - 1]}${added?.strength ? ` (${added.generic} ${added.strength} ${added.frequency})` : ''}. ${conflict.reason} Do not change or stop a dose without professional advice.`
}
