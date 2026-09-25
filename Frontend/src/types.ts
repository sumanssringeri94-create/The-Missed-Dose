export type Confidence = 'high' | 'low'

export type Medicine = {
  id: string
  brand: string
  strength: string
  frequency: string
  duration: string
  confidence: { brand: Confidence; strength: Confidence; frequency: Confidence }
  requires_human_verification: boolean
  generic?: string
  drugClass?: string
  mappedBy?: 'exact' | 'fuzzy' | 'unknown'
}

export type Prescription = {
  id: string
  doctor: string
  date: string
  medicines: Medicine[]
  source: 'demo' | 'photo' | 'manual'
  doctorRegistration?: string
  hospital?: string
}

export type ConflictSeverity = 'high' | 'medium' | 'info'

export type Conflict = {
  severity: ConflictSeverity
  reason: string
  medicines: string[]
}

export type ExtractedMedicine = Omit<Medicine, 'id' | 'generic' | 'drugClass' | 'mappedBy'>

export type ExtractionResponse = {
  doctor: string
  date: string
  doctorRegistration?: string
  hospital?: string
  medicines: ExtractedMedicine[]
}

export type PatientProfile = {
  id: 'patient'
  name: string
  age: string
  sex: string
  emergencyContact: string
  conditions: string
  allergies: string
  currentMedications: string
  bloodGroup?: string
  height?: string
  weight?: string
}

export type SafetyLevel = 'ok' | 'verify' | 'urgent_verify'

export type SafetyFinding = {
  level: SafetyLevel
  reason: string
  clarification: string
  medicines: string[]
}

export type DoctorVerification = 'Verified' | 'Unverified' | 'Inconsistent'

export type DoseEvent = {
  id: string
  doseId: string
  status: 'taken' | 'missed' | 'duplicate'
  timestamp: string
}

export type Dose = {
  id: string
  medicineId: string
  medicineLabel: string
  routine: string
  taken: boolean
  scheduledMinutes: number
  windowEndMinutes: number
}

export type DoseStatus = 'UPCOMING' | 'ACTIVE' | 'TAKEN' | 'MISSED'
