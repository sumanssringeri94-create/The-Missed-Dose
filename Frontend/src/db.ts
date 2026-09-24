import Dexie, { type Table } from 'dexie'
import type { PatientProfile, Prescription } from './types'

type EncryptedProfile = { id: 'patient'; payload: string }

export class VitaForgeDB extends Dexie {
  prescriptions!: Table<Prescription, string>
  profiles!: Table<EncryptedProfile, string>
  constructor() {
    super('vita-forge-ledger')
    this.version(1).stores({ prescriptions: 'id,date,doctor', profiles: 'id' })
  }
}

export const db = new VitaForgeDB()

const encoder = new TextEncoder()
const decoder = new TextDecoder()

async function key(): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', await crypto.subtle.digest('SHA-256', encoder.encode('vita-forge-local-key')), 'AES-GCM', false, ['encrypt', 'decrypt'])
}

export async function encryptLedger(value: Prescription[]): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await key(), encoder.encode(JSON.stringify(value)))
  return `${btoa(String.fromCharCode(...iv))}.${btoa(String.fromCharCode(...new Uint8Array(encrypted)))} `
}

export async function decryptLedger(value: string): Promise<Prescription[]> {
  const [encodedIv, encodedData] = value.trim().split('.')
  const iv = Uint8Array.from(atob(encodedIv), (character) => character.charCodeAt(0))
  const data = Uint8Array.from(atob(encodedData), (character) => character.charCodeAt(0))
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, await key(), data)
  return JSON.parse(decoder.decode(plain)) as Prescription[]
}

export async function saveEncryptedProfile(profile: PatientProfile): Promise<void> {
  await db.profiles.put({ id: 'patient', payload: await encryptJson(profile) })
}

export async function loadEncryptedProfile(): Promise<PatientProfile | undefined> {
  const stored = await db.profiles.get('patient')
  return stored ? await decryptJson<PatientProfile>(stored.payload) : undefined
}

async function encryptJson(value: unknown): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await key(), encoder.encode(JSON.stringify(value)))
  return `${btoa(String.fromCharCode(...iv))}.${btoa(String.fromCharCode(...new Uint8Array(encrypted)))} `
}

async function decryptJson<T>(value: string): Promise<T> {
  const [encodedIv, encodedData] = value.trim().split('.')
  const iv = Uint8Array.from(atob(encodedIv), (character) => character.charCodeAt(0))
  const data = Uint8Array.from(atob(encodedData), (character) => character.charCodeAt(0))
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, await key(), data)
  return JSON.parse(decoder.decode(plain)) as T
}
