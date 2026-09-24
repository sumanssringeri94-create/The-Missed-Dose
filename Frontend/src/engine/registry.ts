import type { DoctorVerification, Prescription } from '../types'

export type RegistryRecord = { name: string; registration: string; hospital: string }
export interface RegistryProvider { verify(doctor: string, registration?: string, hospital?: string): DoctorVerification }

const mockRecords: RegistryRecord[] = [{ name: 'Dr. A. Mehta', registration: 'NMC-MH-1001', hospital: 'Sahyadri Clinic' }]

export class MockRegistryProvider implements RegistryProvider {
  verify(doctor: string, registration?: string, hospital?: string): DoctorVerification {
    if (!registration) return 'Unverified'
    const match = mockRecords.find((record) => record.registration === registration)
    if (!match) return 'Unverified'
    return match.name.toLowerCase() === doctor.toLowerCase() && (!hospital || match.hospital.toLowerCase() === hospital.toLowerCase()) ? 'Verified' : 'Inconsistent'
  }
}

// A real lookup can be plugged in here when an approved NMC registry API is available.
export function verifyDoctor(prescription: Prescription, provider: RegistryProvider = new MockRegistryProvider()): DoctorVerification {
  return provider.verify(prescription.doctor, prescription.doctorRegistration, prescription.hospital)
}

export function doctorVerificationCopy(status: DoctorVerification): string {
  return status === 'Verified' ? 'Verified in the available demo registry.' : status === 'Inconsistent' ? 'Inconsistent: the registration details do not match this prescription.' : "Unverified: we couldn't verify this registration in the available registry."
}
