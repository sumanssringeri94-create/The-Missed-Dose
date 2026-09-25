# 💊 Medease (The Missed Dose)

**An offline-first medication safety assistant for fragmented healthcare.**
Built by **Team VitaForge** for a healthcare hackathon.

Snap a photo of a prescription. Medease reads it, checks it against everything the patient is already taking, and turns it into a simple daily routine. It never plays doctor. When something looks wrong, it flags it and sends the patient back to their doctor or pharmacist.

---

## The problem

Picture a family where someone takes several medicines a day, prescribed by different doctors, in handwriting nobody can read. Mistakes here are quiet: a missed dose, a double dose, two medicines that shouldn't be taken together. Nobody notices until it's too late.

This hits hardest for elderly patients, people with limited health literacy, and homes managing many medicines at once. In India the same molecule is sold under many brand names (Dolo, Crocin and Calpol are all paracetamol), so patients often can't tell what they're actually taking.

## What it does

- **Prescription intake:** photograph a handwritten or printed prescription. A vision model extracts medicine, strength, frequency and duration.
- **Honest scanning:** if the AI is unsure about a critical field (medicine name or strength), it asks the user to confirm instead of guessing.
- **Running medicine ledger:** prescriptions are remembered on the device, so conflicts between different doctors, even weeks apart, are caught.
- **Brand-to-generic mapping:** Indian brand names are mapped to their generic molecule and drug class before any check runs.
- **Safety checks:** duplicate medicines, duplicate drug classes, known interactions, allergy conflicts, and inconsistent or ambiguous instructions.
- **Doctor Clarification Card:** on a conflict, the app creates a plain-language card the patient can show a chemist or doctor.
- **Routine-based schedule:** doses are grouped into Morning, Afternoon and Night and anchored to real life ("after lunch", "before breakfast").
- **Time-aware dose actions:** upcoming doses stay locked, active doses can be marked Taken or Missed, and duplicate taps are blocked.
- **Accessibility:** large text, high contrast, one main action per screen, and read-aloud (text-to-speech).
- **Cached demo mode:** the Ramesh demo runs fully offline, so it works even with bad Wi-Fi.

## How it works

```
Prescription photo
      ↓
Vision-LLM extraction (via local proxy)
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

| Layer | Technology |
| --- | --- |
| Frontend | React, TypeScript, Vite (PWA) |
| Backend | Node.js proxy in TypeScript (port 8787) |
| AI extraction | Groq vision model, called only from the backend |
| On-device storage | Dexie (IndexedDB), encrypted with WebCrypto AES-GCM |
| Android | Capacitor, with `@capacitor-community/text-to-speech` |

## Project structure

```
The-Missed-Dose/
├── Backend/    Proxy server that forwards image extraction to Groq (keeps the key off the client)
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
<<<<<<< HEAD
copy .env.example .env
# Recommended: put GOOGLE_API_KEY in .env for Gemini extraction.
# GROQ_API_KEY remains an alternate/fallback provider.
=======
copy .env.example .env        # macOS/Linux: cp .env.example .env
>>>>>>> 0eb4df0f9557eb8d66ab94842386c6fbb4ee3c53
npm install
npm run dev
```

<<<<<<< HEAD
The proxy tries Google Gemini 2.5 Flash first, then Groq if Gemini fails. Gemini is recommended for handwriting accuracy; its free tier provides up to 1,500 requests/day with no credit card required. Create the key at [aistudio.google.com](https://aistudio.google.com/). Configure `GOOGLE_API_KEY` and `GEMINI_MODEL=gemini-2.5-flash`; keep `GROQ_API_KEY` and `GROQ_MODEL` for fallback. If both providers are unavailable, `/server/extract` returns the bundled cached demo extraction with `source: "cache"`.

The app opens at `http://localhost:5174/`. For an Android phone on the same Wi-Fi, use the Vite Network URL printed in the terminal. The frontend proxies `/server/extract` to `http://localhost:8787`; without a key, network, or enabled vision model, the Ramesh demo stays fully cached.
=======
Then edit `.env`:

| Variable | Purpose |
| --- | --- |
| `GROQ_API_KEY` | Your Groq API key. Add it only when live extraction is needed. Never commit it. |
| `GROQ_MODEL` | A vision-capable model that is enabled for your Groq account. |

The frontend proxies `/server/extract` to `http://localhost:8787`. Without a key, network, or an enabled vision model, the demo falls back to cached results.
>>>>>>> 0eb4df0f9557eb8d66ab94842386c6fbb4ee3c53

## Tests and builds

```bash
cd Frontend
npm test
npm run build
<<<<<<< HEAD
cd ..\Backend
npm test
=======

cd ../Backend
>>>>>>> 0eb4df0f9557eb8d66ab94842386c6fbb4ee3c53
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

The Android build uses `@capacitor-community/text-to-speech` for louder native playback. Run `npx cap sync android` after installing dependencies so the native plugin is included in the APK. On the phone, enable a system text-to-speech engine and raise the media volume. The app cannot override the device's hardware volume limit.

## Demo

See [docs/demo-script.md](docs/demo-script.md) for the live walkthrough.

In short: load the demo patient Ramesh, upload a messy prescription, see the confidence flag and the allergy alert, open the Doctor Clarification Card, review the time-aware schedule, then leave a dose unconfirmed to see the caregiver alert.

## Privacy and safety

- Prescription and profile data are intended to stay on the device by default. The profile is written to a Dexie vault encrypted with WebCrypto AES-GCM.
- The optional extraction request sends only the selected image to the local proxy, which forwards it to Groq when configured.
- The app flags uncertainty and conflicts. It **never** tells a patient to stop, skip or change a medicine, and it always says to confirm with a doctor or pharmacist.
- "No conflicts" is never shown alone. It always appears with the ledger scope.
- No API keys are shipped to the client.

## Current scope and limitations

Built and working in this version (Phase 1):

- Prescription intake, confidence gating, brand-to-generic mapping, conflict engine, clarification card, time-aware schedule, read-aloud, cached Ramesh demo.

Intentionally paused for later phases:

- Ambient-audio dose detection
- Camera motion checks and post-dose wellness signals
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

Project for hackathon
