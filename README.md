# MediTrail

**One trusted ledger for every prescription, from every doctor.**

MediTrail is an AI medication safety ledger for patients and caregivers in India. Photograph any prescription and MediTrail extracts the medicines, doses and schedule, then checks them against every other active medicine from every doctor, so duplicate ingredients and conflicting medicines are caught before they cause harm.

**Hackathon:** Innovators Conclave 2026, Track 03 Healthcare & Medical Technology
**Problem statement:** PS-02, The Missed Dose (Medication Adherence & Safety)

---

## The Problem

Patients with chronic conditions or many medicines struggle with instructions like "twice daily after food". Prescriptions are handwritten, brand names get confused, and each doctor sees only their own prescription. Errors fail silently: a missed dose, a duplicate dose, or a conflict nobody caught. Elderly patients and the caregivers managing several family members' medicines are hit hardest.

**The question MediTrail answers:** Can AI make medication instructions easier to understand while providing a reliable safety net against common medication errors?

---

## Key Features

### Core pipeline (working)
- **Prescription input:** photo upload, scan or manual entry
- **Intelligent extraction:** a vision LLM pulls medicine, dose, frequency and duration into structured JSON
- **Confidence-gated confirmation:** high-confidence fields commit silently, low-confidence fields are bundled into one spoken confirmation
- **Living ledger:** every new entry is checked against all other active entries for duplicate ingredients and known interactions, not just its own prescription
- **Clear schedule:** a simplified, accessible medication schedule
- **Caregiver dashboard and alerts:** monitoring plus notifications when a conflict or missed dose is detected

### What makes it different
- **Honest Coverage Score:** shows "based on 4 logged visits, last updated 12 days ago" instead of a false "all clear"
- **Indian brand-name funnel:** a curated brand-to-generic list (about 500 common brands), then an LLM suggestion verified against RxNorm, and anything unverified is marked "unresolved" rather than guessed
- **Append-only versioned ledger:** corrections create new versions, and any conflict result that depended on a corrected entry is recomputed automatically
- **Per-doctor adaptive confirmation:** familiar, legible sources need fewer confirmations, messy handwriting is still checked
- **QR clone detection:** scans are logged with time and rough location, and the same code verified from distant places is flagged as a likely clone
- **Opt-in adherence spectrum:** patients and families choose between one-tap confirmation, a pill photo, or optional camera confirmation
- **Backfill onboarding:** new users photograph past prescriptions first, which gives the ledger real history and lets cross-doctor conflicts fire live

### In progress
- Multilingual voice support
- Personalized reminders

---

## How It Works

```
Prescription photo
      |
Vision LLM extraction (medicine, dose, frequency, duration)
      |
Per-field confidence scoring
      |-- high confidence --> commit to ledger
      |-- low confidence  --> one bundled spoken confirmation
      |
Brand-name resolution (curated list -> LLM -> RxNorm check)
      |
Ledger update (append-only, versioned)
      |
Cross-prescription conflict check (duplicates and interactions)
      |
Plain-language alert + "confirm with your doctor or pharmacist"
      |
Caregiver notification + Coverage Score update
```

---

## Data Model

| Table | Purpose |
|---|---|
| `patients` | Patient and caregiver profiles |
| `prescriptions` | Append-only, versioned prescription records |
| `medications` | Resolved generic name, confidence and source |
| `ledger_entries` | Links each medication to its schedule |
| `conflicts` | Medication pair, reasoning and resolved status |
| `confirmations` | Pending low-confidence fields awaiting confirmation |

---

## Tech Stack

- **Extraction:** vision-capable LLM
- **Drug data:** RxNorm and RxNav (interactions), curated Indian brand-to-generic CSV
- **Storage:** versioned, append-only database with encrypted ledger

---



## Privacy and Safety

- **Not a medical decision-maker.** MediTrail shows information, explains why something was flagged in plain language, and always points back to a doctor or pharmacist. It never diagnoses, prescribes or scores a doctor's prescription.
- **No image retention.** Prescription photos are deleted right after extraction.
- **Encrypted ledger.** Only the structured ledger persists, protected with a device-bound key.
- **Private caregiver sharing.** Caregivers connect through a private family key rather than a shared cloud database.
- **Offline option.** An optional on-device OCR mode is available for privacy-conscious users, with lower accuracy.
- **Dignity first.** Adherence tracking is opt-in and the patient and family choose the level.
- **Data labelling.** Demo data is simulated and clearly labelled as such.

---

## Known Limitations

- RxNorm is US-based, so Indian brand coverage depends on the curated list, and unmatched drugs are marked "unresolved".
- The Coverage Score reflects only the visits that have been logged.
- Extraction accuracy depends on prescription image quality and handwriting.

---

## Roadmap

- Multilingual voice and simplified visuals across Indian languages
- Personalized reminders
- Guideline cross-reference, worded as information and not as a verdict
- Verified medicine donation routed through registered pharmacies and NGOs
- Scaling from families to pharmacies, clinics and NGOs

---

## Team

ChaturKridinX

## Team Members
Suman S
Vikas N
Lithin
Tejas

