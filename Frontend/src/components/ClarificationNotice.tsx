import type { Ref } from 'react'
import { clarificationMedicines } from '../engine/conflicts'
import type { Conflict, PatientProfile, Prescription } from '../types'

type ClarificationNoticeProps = {
  conflict: Conflict
  ledger: Prescription[]
  incoming: Prescription
  patient: PatientProfile | null
  cardRef: Ref<HTMLDivElement>
}

function conflictType(reason: string): string {
  const text = reason.toLowerCase()
  if (text.includes('same medicine') || text.includes('duplicate')) return 'Duplicate therapy: the same medicine may be present under different brands.'
  if (text.includes('class')) return 'Same drug class: both medicines belong to the same therapeutic class.'
  if (text.includes('aspirin') || text.includes('ibuprofen') || text.includes('bleeding')) return 'Interaction: the medicine pair may have an interaction.'
  if (text.includes('allerg')) return 'Allergy: the medicine may match a recorded allergy.'
  return 'Medication safety conflict: professional verification is requested.'
}

function dateLabel(value: string): string {
  return new Date(value).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })
}

function medicineValue(value: string | undefined): string {
  return value || 'Not recorded'
}

export function ClarificationNotice({ conflict, ledger, incoming, patient, cardRef }: ClarificationNoticeProps) {
  const { prior, added } = clarificationMedicines(conflict, ledger, incoming)
  const generatedAt = new Date()
  const earliest = ledger.map((item) => item.date).sort()[0] ?? incoming.date
  const documentId = `MED-${generatedAt.toISOString().slice(0, 10).replaceAll('-', '')}-${conflict.medicines.map((brand) => brand.replace(/[^A-Za-z0-9]/g, '').slice(0, 5).toUpperCase()).join('-')}`
  const rows = [prior, added].filter((medicine): medicine is NonNullable<typeof medicine> => Boolean(medicine))

  return (
    <div ref={cardRef} className="clarification-notice">
      <header className="notice-letterhead">
        <div className="notice-brand"><span>M</span><strong>Medease</strong></div>
        <div className="notice-title"><strong>MEDICATION SAFETY NOTICE</strong><small>For clinical verification only</small></div>
        <div className="notice-reference"><strong>{documentId}</strong><span>Generated {generatedAt.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span></div>
      </header>

      <div className="notice-patient-strip">
        <span><small>NAME</small>{medicineValue(patient?.name)}</span>
        <span><small>AGE</small>{medicineValue(patient?.age)}</span>
        <span><small>DATE</small>{dateLabel(incoming.date)}</span>
      </div>

      <section className="notice-verification">
        <h3>FOR PHARMACIST / DOCTOR VERIFICATION</h3>
        <div className="notice-table" role="table" aria-label="Conflicting medicines">
          <div className="notice-table-row notice-table-head" role="row"><span>Brand</span><span>Generic</span><span>Strength</span><span>Frequency</span></div>
          {rows.map((medicine) => <div className="notice-table-row" role="row" key={medicine.id}><strong>{medicine.brand}</strong><span>{medicineValue(medicine.generic)}</span><span>{medicineValue(medicine.strength)}</span><span>{medicineValue(medicine.frequency)}</span></div>)}
        </div>
        <p className="notice-conflict-type">{conflictType(conflict.reason)}</p>
      </section>

      <div className="notice-warning"><span>!</span><strong>Do not change or stop any dose without professional advice. Please confirm with your doctor or pharmacist.</strong></div>

      <footer className="notice-footer">
        <div><strong>Medease</strong><span>Generated automatically — not a diagnosis. For verification only.</span><span>Ledger scope: Based on {ledger.length} prescriptions logged since {dateLabel(earliest)}.</span></div>
        <div className="notice-signature"><span>Pharmacist/Doctor signature &amp; date</span><i /></div>
      </footer>
    </div>
  )
}
