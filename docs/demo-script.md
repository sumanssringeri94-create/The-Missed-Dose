# The Missed Dose: Demo Script

## Setup

1. Start the Express proxy in `Backend` with `npm run dev` (the demo does not need an API key).
2. Start the PWA in `Frontend` with `npm run dev` and open the Network URL on an Android phone.
3. If the API is unavailable, use the bundled cached path below.

## Walkthrough

1. Open the app and tap **Load demo patient: Ramesh**. The profile shows Ramesh, 62, diabetes and hypertension, penicillin allergy, and Metformin. The profile is stored in the encrypted local Dexie vault.
2. Tap **Load demo data**. The cached extraction represents a second prescription with Metformin history plus Augmentin (the Amoxicillin family), Amlong, and Pan-40. In a live demo, the same screen can start from a prescription photo.
3. On review, show the **Urgent verification** allergy alert for Augmentin/Amoxicillin. The card always says to confirm with a doctor or pharmacist and never gives dose-changing advice.
4. Show the doctor registration status and open/share the clarification card. Accept the review only after explaining that it logs the prescription; it does not change any medicine.
5. Return to Today. The remaining drugs are grouped under Morning, Afternoon, and Night. Show the progress bar and tap **Listen** on a dose. The speech language follows the language toggle and falls back to English when the device has no matching voice.
6. Tap **Missed** on the evening dose. The page shows: “Please check your prescription or ask your pharmacist or doctor what to do about this dose.” The dashboard displays a caregiver alert count.
7. Tap **Taken** twice on a slot. The app asks whether this is the same dose again. Confirming the second event opens the urgent contact screen and logs a duplicate event.
8. Open **Safety** to show the complete finding list and the ledger scope. The whole flow works without network after the demo patient is loaded.

## Safety note

The audio, PPG, motion, caregiver sharing, and cabinet ideas remain paused for later phases. This prototype is a medication-recording and clarification assistant, not a diagnostic service. It never instructs a patient to change a medicine.
