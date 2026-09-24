import type { Medicine, PatientProfile, Prescription, SafetyFinding } from '../types'

const allergenMolecules: Record<string, string[]> = {
  penicillin: ['amoxicillin', 'ampicillin', 'penicillin', 'amoxicillin + clavulanate'],
  sulfa: ['sulfamethoxazole', 'sulfasalazine', 'sulfadiazine'],
  nsaids: ['ibuprofen', 'diclofenac', 'naproxen', 'aspirin', 'aceclofenac', 'nimesulide'],
}

function clean(value: string): string { return value.trim().toLowerCase() }
function matchesAllergy(allergies: string, generic: string): string | undefined {
  const allergyText = clean(allergies); const molecule = clean(generic)
  return Object.entries(allergenMolecules).find(([allergen, molecules]) => allergyText.includes(allergen) && molecules.some((item) => molecule.includes(item)))?.[0]
}

function finding(level: SafetyFinding['level'], reason: string, medicines: string[]): SafetyFinding {
  return { level, reason, medicines, clarification: `${reason} Please confirm with your doctor or pharmacist.` }
}

export function checkAllergies(prescription: Prescription, profile?: PatientProfile): SafetyFinding[] {
  if (!profile?.allergies) return []
  return prescription.medicines.flatMap((medicine) => {
    const allergen = matchesAllergy(profile.allergies, medicine.generic ?? '')
    return allergen ? [finding('urgent_verify', `${medicine.brand} may belong to your recorded ${allergen} allergy group.`, [medicine.brand])] : []
  })
}

export function checkInconsistencies(prescription: Prescription): SafetyFinding[] {
  const findings: SafetyFinding[] = []
  const byGeneric = new Map<string, Medicine[]>()
  prescription.medicines.forEach((medicine) => {
    const key = clean(medicine.generic ?? medicine.brand)
    byGeneric.set(key, [...(byGeneric.get(key) ?? []), medicine])
  })
  byGeneric.forEach((medicines) => {
    const strengths = new Set(medicines.map((medicine) => clean(medicine.strength)))
    const frequencies = new Set(medicines.map((medicine) => clean(medicine.frequency)))
    if (medicines.length > 1 && (strengths.size > 1 || frequencies.size > 1)) findings.push(finding('urgent_verify', `${medicines[0].brand} appears with conflicting dose or frequency in this prescription.`, medicines.map((medicine) => medicine.brand)))
  })
  return findings
}

export function checkAmbiguity(prescription: Prescription): SafetyFinding[] {
  return prescription.medicines.flatMap((medicine) => {
    const missing: string[] = []
    if (!medicine.strength.trim() || medicine.confidence.strength === 'low') missing.push('strength')
    if (!medicine.frequency.trim() || medicine.confidence.frequency === 'low') missing.push('frequency')
    if (!medicine.duration.trim()) missing.push('duration')
    return missing.length ? [finding(missing.includes('strength') ? 'urgent_verify' : 'verify', `${medicine.brand} has an unclear ${missing.join(', ')}.`, [medicine.brand])] : []
  })
}

export function runSafetyChecks(prescription: Prescription, profile?: PatientProfile): SafetyFinding[] {
  const findings = [...checkAllergies(prescription, profile), ...checkInconsistencies(prescription), ...checkAmbiguity(prescription)]
  return findings.length ? findings : [finding('ok', 'No additional safety checks need attention in this prescription.', [])]
}
