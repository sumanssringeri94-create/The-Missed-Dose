# 💊 Medease (The Missed Dose)

**An offline-first medication safety assistant for fragmented healthcare.**
Built by **Team ChaturKrudinX** for a healthcare hackathon.

Snap a photo of a prescription. Medease reads it, checks it against everything the patient is already taking, and turns it into a simple daily routine. It never plays doctor. When something looks wrong, it flags it and sends the patient back to their doctor or pharmacist.

---

## The problem

Picture a family where someone takes several medicines a day, prescribed by different doctors, in handwriting nobody can read. Mistakes here are quiet: a missed dose, a double dose, two medicines that shouldn't be taken together. Nobody notices until it's too late.

This hits hardest for elderly patients, people with limited health literacy, and homes managing many medicines at once. In India the same molecule is sold under many brand names (Dolo, Crocin and Calpol are all paracetamol), so patients often can't tell what they're actually taking.

WHO (2016) found that 57.3% of people practicing allopathic medicine in India lack a valid medical qualification, and only 18.8% of rural allopathic practitioners hold proper medical degrees. Patients can't rely on manual checks alone — they need a second pair of eyes between the prescription and the patient.

## What it does

- **Prescription intake:** photograph a handwritten or printed prescription. A vision model extracts medicine, strength, frequency and duration.
- **Honest scanning:** if the AI is unsure about a critical field (medicine name or strength), it asks the user to confirm instead of guessing.
- **Running medicine ledger:** prescriptions are remembered on the device, so conflicts between different doctors, even weeks apart, are caught.
- **Brand-to-generic mapping:** Indian brand names are mapped to their generic molecule and drug class before any check runs.
- **Safety checks:** duplicate medicines, duplicate drug classes, known interactions, allergy conflicts, and inconsistent or ambiguous instructions.
- **Doctor Clarification Card:** on a conflict, the app generates a formal, medical-form-style notice the patient can export or share with a chemist or doctor.
- **Routine-based schedule:** doses are grouped into Morning, Afternoon and Night and anchored to real life ("after lunch", "before breakfast").
- **Time-aware dose actions:** upcoming doses stay locked, active doses can be marked Taken or Missed, and duplicate taps are blocked. A dose left unconfirmed after its window prompts the user instead of auto-marking it Missed.
- **Photo-verified "Taken":** optionally confirm a dose by photographing the medicine; the app checks it against the scheduled medicine and marks it taken automatically on a match, or falls back to manual confirmation.
- **Accessibility:** large text, high contrast, one main action per screen, and read-aloud (text-to-speech).
- **Cached demo mode:** the Ramesh demo runs fully offline, so it works even with bad Wi-Fi.

## How it works

```
Prescription photo
      ↓
Gemini vision extraction (via local proxy)
      ↓
Confidence gate (asks only when a critical field is unclear)
      ↓
Ledger: brand → generic, checked against all past prescriptions
      ↓
Safety engine: duplicates, interactions, allergies, inconsistencies
      ↓
Schedule: Morning / Afternoon / Night with time-aware actions
      ↓
Reminders + local caregiver alert indicator
```

## Tech stack

**Frontend**
- React + TypeScript, built with Vite (PWA-ready)
- Tailwind CSS, styled with a WebMD-inspired clinical theme
- Dexie (IndexedDB) for the on-device medicine ledger
- WebCrypto (AES-GCM) to encrypt the ledger locally
- Vitest for unit tests (conflict engine, schedule engine, extraction)
- Web Speech API for read-aloud ("Listen")
- MediaDevices API for camera capture (prescriptions and dose-verification photos)
- html-to-image + Web Share API for the exportable Doctor Clarification Card

**Backend**
- Node.js + Express, written in TypeScript (`tsx`)
- Multer for image upload handling
- Google Gemini 2.5 (vision) for prescription and dose-photo extraction, with a cached demo fallback if the API is unavailable
- dotenv for config; API keys never reach the client

**Domain logic**
- Custom conflict engine: duplicate therapy, drug-class duplicates, interactions, allergy checks
- Custom schedule engine: converts frequency into Morning/Afternoon/Night doses, with a time-aware state machine (Upcoming → Active → Taken/Missed)
- Local brand-to-generic dataset for Indian medicine names

**Mobile packaging**
- Capacitor, targeting Android
- `@capacitor-community/text-to-speech` for native voice playback

## Project structure

```
The-Missed-Dose/
├── Backend/    Proxy server that forwards image extraction to Gemini (keeps the key off the client)
├── Frontend/   Patient app (React + Vite)
├── docs/       Architecture notes and demo script
└── README.md
```

## Run locally

### Frontend

```bash
cd Frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5174
```

The app opens at `http://localhost:5174/`. To test on an Android phone on the same Wi-Fi, open the **Network URL** that Vite prints in the terminal.

### Backend proxy (optional)

The backend is only needed for **live** prescription extraction. The Ramesh demo works without it.

```bash
cd Backend
copy .env.example .env        # macOS/Linux: cp .env.example .env
npm install
npm run dev
```

Then edit `.env`:

| Variable | Purpose |
| --- | --- |
| `GOOGLE_API_KEY` | Your Gemini API key. Add it only when live extraction is needed. Never commit it. Get a free key at [aistudio.google.com](https://aistudio.google.com/) (free tier: up to 1,500 requests/day, no credit card required). |
| `GEMINI_MODEL` | A vision-capable Gemini model, e.g. `gemini-2.5-flash` or `gemini-2.5-pro` for tougher handwriting. |

The frontend proxies `/server/extract` (and the dose-verification endpoint) to `http://localhost:8787`. Without a key, network access, or an enabled vision model, the app falls back to cached demo results with `source: "cache"` in the response.

## Tests and builds

```bash
cd Frontend
npm test
npm run build

cd ../Backend
npm test
npm run build
```

## Android packaging

The web/PWA slice is ready for Capacitor. From `Frontend`, add the Android platform once, then sync:

```bash
npm install @capacitor/cli
npx cap init "The Missed Dose" com.vitaforge.misseddose --web-dir dist
npx cap add android
npm run build
npx cap sync android
# Open the generated android folder in Android Studio
```

The Android build uses `@capacitor-community/text-to-speech` for louder native playback. Run `npx cap sync android` after installing dependencies so the native plugin is included in the APK. On the phone, enable a system text-to-speech engine and raise the media volume — the app cannot override the device's hardware volume limit.

## Demo

See [docs/demo-script.md](docs/demo-script.md) for the live walkthrough.

In short: load the demo patient Ramesh, upload a messy prescription, see the confidence flag and the allergy alert, open the Doctor Clarification Card, review the time-aware schedule, then leave a dose unconfirmed to see the caregiver alert.

## Privacy and safety

- Prescription and profile data are intended to stay on the device by default. The profile is written to a Dexie vault encrypted with WebCrypto AES-GCM.
- The optional extraction request sends only the selected image to the local proxy, which forwards it to Gemini when configured. Dose-verification photos are handled the same way — used only for the one-time match check, stored locally, never uploaded elsewhere.
- The app flags uncertainty and conflicts. It **never** tells a patient to stop, skip or change a medicine, and it always says to confirm with a doctor or pharmacist.
- "No conflicts" is never shown alone. It always appears with the ledger scope, e.g. *"Based on 3 prescriptions logged since Jan 2026."*
- No API keys are shipped to the client.

## Current scope and limitations

Built and working in this version (Phase 1):

- Prescription intake, confidence gating, brand-to-generic mapping, conflict engine, formal-style clarification card, time-aware schedule, photo-verified Taken, read-aloud, cached Ramesh demo.

Intentionally paused for later phases:

- Ambient-audio dose detection
- Camera motion checks and post-dose wellness signals (PPG, tremor)
- Caregiver share code (the current caregiver alert is a **local demo indicator**)
- Smart cabinet / refill tracking

Other limitations:

- The brand map and interaction table are curated and limited, not a full drug database.
- Doctor registration checking, where present, is a mock and not a live registry lookup.
- Handwriting recognition can fail on poor images. The app asks for confirmation on critical fields instead of guessing.
- This is a prototype. It is **not a medical device**, has not been clinically validated, and is not a substitute for professional medical advice.

## Roadmap

- Live doctor-registry verification
- Caregiver sharing with a revocable share code
- Ambient audio and sensor-based checks
- Smart cabinet and refill alerts
- Larger brand and interaction datasets reviewed by pharmacists
- More languages and voice guidance

## Team

**Team ChaturKrudinX**



## License

Project for hackathon use.
