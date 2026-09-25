# Medease

Team VitaForge's offline-first medication safety assistant for fragmented healthcare.

## Run locally

Frontend:

```powershell
cd Frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5174
```

Backend proxy (optional for the cached demo):

```powershell
cd Backend
copy .env.example .env
# Recommended: put GOOGLE_API_KEY in .env for Gemini extraction.
# GROQ_API_KEY remains an alternate/fallback provider.
npm install
npm run dev
```

The proxy tries Google Gemini 2.5 Flash first, then Groq if Gemini fails. Gemini is recommended for handwriting accuracy; its free tier provides up to 1,500 requests/day with no credit card required. Create the key at [aistudio.google.com](https://aistudio.google.com/). Configure `GOOGLE_API_KEY` and `GEMINI_MODEL=gemini-2.5-flash`; keep `GROQ_API_KEY` and `GROQ_MODEL` for fallback. If both providers are unavailable, `/server/extract` returns the bundled cached demo extraction with `source: "cache"`.

The app opens at `http://localhost:5174/`. For an Android phone on the same Wi-Fi, use the Vite Network URL printed in the terminal. The frontend proxies `/server/extract` to `http://localhost:8787`; without a key, network, or enabled vision model, the Ramesh demo stays fully cached.

## Tests and builds

```powershell
cd Frontend
npm test
npm run build
cd ..\Backend
npm test
npm run build
```

## Android packaging

The web/PWA Phase 1 slice is ready for Capacitor. From `Frontend`, add the Android platform once, then sync:

```powershell
npm install @capacitor/cli
npx cap init "The Missed Dose" com.vitaforge.misseddose --web-dir dist
npx cap add android
npm run build
npx cap sync android
# Open the generated android folder in Android Studio
```

The Android build uses `@capacitor-community/text-to-speech` for louder native playback. Run `npx cap sync android` after installing dependencies so the native plugin is included in the APK. On a phone, enable a system text-to-speech engine and raise media volume; the app cannot override the device's hardware volume limit.

## Privacy and safety

Prescription and profile data are intended to stay on-device by default. The profile is written to a Dexie vault encrypted with WebCrypto AES-GCM. The optional extraction request sends only the selected image to the local proxy, which forwards it to Groq when configured. The app flags uncertainty and conflicts; it never tells a patient to change a medicine. Always confirm with a doctor or pharmacist.

The ambient-audio, camera motion, wellness signals, caregiver share code, and smart cabinet hardware workflows are intentionally paused for later phases. The current caregiver alert is a local demo indicator.

See [docs/demo-script.md](docs/demo-script.md) for the live walkthrough.
