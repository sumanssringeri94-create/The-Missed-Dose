import { useEffect, useMemo, useState } from "react";
import { toPng } from "html-to-image";
import { Capacitor } from "@capacitor/core";
import {
  QueueStrategy,
  TextToSpeech,
} from "@capacitor-community/text-to-speech";
import {
  demoFirstExtraction,
  demoSecondExtraction,
  extractionToPrescription,
} from "./data/demo";
import { mapMedicine } from "./engine/brands";
import { findConflicts } from "./engine/conflicts";
import { runSafetyChecks } from "./engine/safety";
import {
  recordDose,
  missedDose,
  MISSED_DOSE_COPY,
  DUPLICATE_DOSE_COPY,
} from "./engine/doseSafety";
import {
  buildSchedule,
  doseStatus,
  doseWindowLabel,
  formatDoseTime,
  routineLabel,
} from "./engine/schedule";
import { doctorVerificationCopy, verifyDoctor } from "./engine/registry";
import { strings, speechLocales, type SupportedLanguage } from "./i18n/strings";
import { saveEncryptedProfile } from "./db";
import { ClarificationNotice } from "./components/ClarificationNotice";
import type {
  Conflict,
  DoseEvent,
  Medicine,
  PatientProfile,
  Prescription,
  SafetyFinding,
  Dose,
  DoseStatus,
} from "./types";
import "./App.css";

type Screen = "home" | "review" | "ledger" | "profile" | "safety" | "caregiver";
const blankProfile: PatientProfile = {
  id: "patient",
  name: "",
  age: "",
  sex: "",
  emergencyContact: "",
  conditions: "",
  allergies: "",
  currentMedications: "",
};

function App() {
  const [screen, setScreen] = useState<Screen>("profile");
  const [language, setLanguage] = useState<SupportedLanguage>("en");
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [profileDraft, setProfileDraft] =
    useState<PatientProfile>(blankProfile);
  const [ledger, setLedger] = useState<Prescription[]>([]);
  const [pending, setPending] = useState<Prescription | null>(null);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [findings, setFindings] = useState<SafetyFinding[]>([]);
  const [message, setMessage] = useState("");
  const [taken, setTaken] = useState<string[]>([]);
  const [doseEvents, setDoseEvents] = useState<DoseEvent[]>([]);
  const [duplicatePrompt, setDuplicatePrompt] = useState(false);
  const [emergency, setEmergency] = useState(false);
  const [showCabinet, setShowCabinet] = useState(false);
  const [speechMessage, setSpeechMessage] = useState("");
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [lateDosePrompt, setLateDosePrompt] = useState<Dose | null>(null);
  const [cardNode, setCardNode] = useState<HTMLDivElement | null>(null);
  const text = strings[language];
  const medicines = useMemo(
    () => ledger.flatMap((item) => item.medicines),
    [ledger],
  );
  const todayDoses = useMemo(() => buildSchedule(medicines), [medicines]);
  const completed = taken.length;
  const attentionCount = findings.filter((item) => item.level !== "ok").length;
  const missedCount = doseEvents.filter(
    (event) => event.status === "missed",
  ).length;
  const grouped = {
    Morning: todayDoses.filter((dose) =>
      ["wake-up", "breakfast"].includes(dose.routine),
    ),
    Afternoon: todayDoses.filter((dose) => dose.routine === "lunch"),
    Night: todayDoses.filter((dose) =>
      ["dinner", "bedtime"].includes(dose.routine),
    ),
  };

  useEffect(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.getVoices();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  function saveProfile(next = profileDraft) {
    setProfile(next);
    void saveEncryptedProfile(next);
    setScreen("home");
    setMessage(
      `Welcome, ${next.name || "friend"}. Only enter what your doctor has told you.`,
    );
  }
  function loadDemoPatient() {
    const demoProfile = {
      id: "patient" as const,
      name: "Ramesh",
      age: "62",
      sex: "Male",
      emergencyContact: "Meena: 98765 43210",
      conditions: "Diabetes, hypertension",
      allergies: "Penicillin",
      currentMedications: "Metformin",
      bloodGroup: "B+",
      height: "168 cm",
      weight: "74 kg",
    };
    setProfile(demoProfile);
    void saveEncryptedProfile(demoProfile);
    setScreen("home");
    setMessage("Demo patient loaded. Next: review a prescription.");
  }
  function preparePrescription(prescription: Prescription) {
    const mapped = {
      ...prescription,
      medicines: prescription.medicines.map(mapMedicine),
    };
    setPending(mapped);
    setConflicts(findConflicts(mapped, ledger));
    setFindings(runSafetyChecks(mapped, profile ?? undefined));
    setScreen("review");
  }
  function loadDemo() {
    const first = extractionToPrescription(demoFirstExtraction, "demo");
    const second = extractionToPrescription(demoSecondExtraction, "demo");
    const mappedFirst = {
      ...first,
      medicines: first.medicines.map(mapMedicine),
    };
    const mappedSecond = {
      ...second,
      medicines: second.medicines.map(mapMedicine),
    };
    setLedger([mappedFirst]);
    setPending(mappedSecond);
    setConflicts(findConflicts(mappedSecond, [mappedFirst]));
    setFindings(
      runSafetyChecks(
        mappedSecond,
        profile ?? { ...blankProfile, allergies: "Penicillin" },
      ),
    );
    setScreen("review");
  }

  async function handlePhoto(file: File | undefined) {
    if (!file) return;
    setMessage("Reading the prescription securely...");
    try {
      const body = new FormData();
      body.append("image", file);
      const endpoint = import.meta.env.VITE_API_URL || "/server/extract";
      const response = await fetch(endpoint, { method: "POST", body });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!response.ok)
        throw new Error(
          payload?.error ?? `Extraction failed (${response.status})`,
        );
      if (!payload || !("medicines" in payload))
        throw new Error("The reader returned an incomplete prescription.");
      preparePrescription(
        extractionToPrescription(
          payload as Parameters<typeof extractionToPrescription>[0],
          "photo",
        ),
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `${error.message} Load demo patient to continue offline.`
          : "The reader could not reach the server. Load demo patient to continue offline.",
      );
    }
  }
  function acceptReview() {
    if (!pending) return;
    setLedger((current) => [...current, pending]);
    setPending(null);
    setConflicts([]);
    setMessage(
      "Prescription added to your private ledger. Keep the card handy for your pharmacist.",
    );
    setScreen("home");
  }
  async function shareCard() {
    if (!cardNode) return;
    const dataUrl = await toPng(cardNode, { pixelRatio: 2 });
    const blob = await (await fetch(dataUrl)).blob();
    if (navigator.share)
      await navigator.share({
        title: "Medease clarification card",
        files: [
          new File([blob], "clarification-card.png", { type: "image/png" }),
        ],
      });
    else
      setMessage(
        "Card image prepared. Your browser does not offer direct sharing.",
      );
  }
  async function speakDose(label: string, routine: string) {
    const speechText = `${label}. ${routineLabel(routine)}`;
    if (Capacitor.isNativePlatform()) {
      try {
        setSpeechMessage("Reading dose aloud...");
        await TextToSpeech.speak({
          text: speechText,
          lang: speechLocales[language],
          rate: 0.82,
          pitch: 1,
          volume: 1,
          queueStrategy: QueueStrategy.Flush,
        });
        setSpeechMessage("");
      } catch {
        setSpeechMessage(
          "Android text-to-speech is unavailable. Install or enable a phone text-to-speech voice.",
        );
      }
      return;
    }
    if (
      !("speechSynthesis" in window) ||
      !("SpeechSynthesisUtterance" in window)
    ) {
      setSpeechMessage("Voice reading is not available in this browser.");
      return;
    }
    const synthesis = window.speechSynthesis;
    const voices = synthesis.getVoices();
    const requestedLocale = speechLocales[language];
    const voice =
      voices.find((item) =>
        item.lang.toLowerCase().startsWith(requestedLocale.slice(0, 2)),
      ) ?? voices.find((item) => item.lang.toLowerCase().startsWith("en"));
    const utterance = new SpeechSynthesisUtterance(
      `${label}. ${routineLabel(routine)}`,
    );
    utterance.lang = voice?.lang ?? requestedLocale;
    if (voice) utterance.voice = voice;
    utterance.volume = 1;
    utterance.rate = 0.82;
    utterance.pitch = 1;
    utterance.onstart = () => setSpeechMessage("Reading dose aloud...");
    utterance.onend = () => setSpeechMessage("");
    utterance.onerror = () =>
      setSpeechMessage(
        "Voice reading failed. Check your phone volume and text-to-speech settings.",
      );
    synthesis.cancel();
    synthesis.resume();
    synthesis.speak(utterance);
  }
  function confirmDose(doseId: string) {
    if (taken.includes(doseId)) {
      setDuplicatePrompt(true);
      return;
    }
    setTaken((current) => [...current, doseId]);
    setDoseEvents((current) => [...current, recordDose(doseId, current)]);
  }
  function doseEvent(doseId: string) {
    return doseEvents
      .filter((event) => event.doseId === doseId)
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp))[0];
  }
  function doseState(dose: Dose): DoseStatus {
    return doseStatus(dose, doseEvents, currentTime);
  }
  function takeDose(dose: Dose) {
    if (doseState(dose) === "MISSED") {
      setLateDosePrompt(dose);
      return;
    }
    if (doseState(dose) !== "ACTIVE") return;
    confirmDose(dose.id);
  }
  function confirmLateDose() {
    if (!lateDosePrompt) return;
    setTaken((current) => [...current, lateDosePrompt.id]);
    setDoseEvents((current) => [...current, recordDose(lateDosePrompt.id, current)]);
    setMessage(`${lateDosePrompt.medicineLabel} recorded as Taken late at ${formatDoseTime(currentTime.getHours() * 60 + currentTime.getMinutes())}.`);
    setLateDosePrompt(null);
  }
  function recordSecondDose() {
    const doseId = todayDoses.find((dose) => taken.includes(dose.id))?.id;
    if (doseId)
      setDoseEvents((current) => [...current, recordDose(doseId, current)]);
    setDuplicatePrompt(false);
    setEmergency(true);
  }
  function markMissed(doseId: string) {
    const dose = todayDoses.find((item) => item.id === doseId);
    if (!dose || doseState(dose) === "UPCOMING" || doseState(dose) === "TAKEN") return;
    setDoseEvents((current) => [...current, missedDose(doseId)]);
    setMessage(`${text.missed}: ${MISSED_DOSE_COPY}`);
  }
  function addOtc() {
    const brand = window.prompt("What OTC medicine did you buy?")?.trim();
    if (!brand) return;
    const strength =
      window
        .prompt("What strength is written on the pack? (Optional)")
        ?.trim() || "Strength not recorded";
    const frequency =
      window.prompt("How often do you take it? (Optional)")?.trim() ||
      "Routine not recorded";
    const duration =
      window.prompt("How long will you take it? (Optional)")?.trim() ||
      "Duration not recorded";
    const otc: Medicine = {
      id: crypto.randomUUID(),
      brand,
      strength,
      frequency,
      duration,
      confidence: {
        brand: "high",
        strength: strength === "Strength not recorded" ? "low" : "high",
        frequency: frequency === "Routine not recorded" ? "low" : "high",
      },
      requires_human_verification: true,
      mappedBy: "unknown",
    };
    setLedger((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        doctor: "Self-reported OTC",
        date: new Date().toISOString().slice(0, 10),
        medicines: [otc],
        source: "manual",
      },
    ]);
    setMessage(
      `${brand} was added to your ledger. Please confirm it with your doctor or pharmacist.`,
    );
  }

  if (emergency)
    return (
      <main className="app-shell">
        <section className="urgent-screen">
          <span className="urgent-symbol">!</span>
          <p className="eyebrow">DOSE EVENT</p>
          <h1>{text.emergency}</h1>
          <p>{text.confirmDose}</p>
          <button className="big-button" onClick={() => setEmergency(false)}>
            Back to today
          </button>
        </section>
      </main>
    );
  if (screen === "profile")
    return (
      <main className="app-shell">
        <header className="topbar">
          <div className="brand-mark">
            <span>M</span>
            <div>
              <strong>Medease</strong>
            </div>
          </div>
          <button
            className="language"
            onClick={() =>
              setLanguage(
                language === "en"
                  ? "hi"
                  : language === "hi"
                    ? "kn"
                    : language === "kn"
                      ? "ta"
                      : "en",
              )
            }
          >
            {language.toUpperCase()}
          </button>
        </header>
        <div className="step-bar">
          <span className="current">1 Profile</span>
          <span>2 Today</span>
          <span>3 Review</span>
        </div>
        <section className="profile-screen">
          <p className="eyebrow">STEP 1 OF 3</p>
          <h1>Tell us a little about you.</h1>
          <p className="lede">
            Only enter what your doctor has told you. You can skip any field.
          </p>
          <div className="profile-form">
            {(
              [
                "name",
                "age",
                "sex",
                "emergencyContact",
                "conditions",
                "allergies",
                "currentMedications",
                "bloodGroup",
                "height",
                "weight",
              ] as const
            ).map((field) => (
              <label key={field}>
                {field
                  .replace(/[A-Z]/g, (letter) => ` ${letter}`)
                  .replace(/^./, (letter) => letter.toUpperCase())}
                <input
                  value={profileDraft[field] ?? ""}
                  onChange={(event) =>
                    setProfileDraft((current) => ({
                      ...current,
                      [field]: event.target.value,
                    }))
                  }
                />
              </label>
            ))}
          </div>
          <div className="flow-actions">
            <button
              className="secondary-button"
              onClick={() => {
                setProfile(blankProfile);
                setScreen("home");
              }}
            >
              Skip for now
            </button>
            <button className="big-button" onClick={() => saveProfile()}>
              Next: Today <span>→</span>
            </button>
          </div>
          <button className="demo-button" onClick={loadDemoPatient}>
            Load demo patient: Ramesh
          </button>
        </section>
      </main>
    );

  const navigationScreen: Screen = screen;
  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark">
          <span>M</span>
          <div>
            <strong>Medease</strong>
          </div>
        </div>
        <button
          className="language"
          onClick={() =>
            setLanguage(
              language === "en"
                ? "hi"
                : language === "hi"
                  ? "kn"
                  : language === "kn"
                    ? "ta"
                    : "en",
            )
          }
        >
          {language.toUpperCase()}
        </button>
      </header>
      <div className="step-bar">
        <span className="complete">1 Profile</span>
        <span className={screen === "home" ? "current" : "complete"}>
          2 Today
        </span>
        <span className={screen === "review" ? "current" : ""}>3 Review</span>
      </div>
      {screen === "home" && (
        <>
          <section className="hero-copy">
            <p className="eyebrow">
              {profile?.name
                ? `${profile.name.toUpperCase()}'S MEDICINE LEDGER`
                : "YOUR MEDICINE LEDGER"}
            </p>
            <h1>One calm place for every prescription.</h1>
            <p className="lede">
              Your medicines stay on this phone by default. Add a prescription,
              check the whole history, and take the next step with a pharmacist.
            </p>
          </section>
          <section className="action-panel">
            <div className="panel-kicker">START HERE</div>
            <label className="primary-action">
              <span className="camera-icon">＋</span>
              <span>
                <strong>Scan a prescription</strong>
                <small>Take a photo or choose from gallery</small>
              </span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(event) => void handlePhoto(event.target.files?.[0])}
              />
            </label>
            <button className="demo-button" onClick={loadDemo}>
              Load demo data <span>→</span>
            </button>
          </section>
          {message && <p className="message">{message}</p>}
          {speechMessage && (
            <p className="message speech-message" role="status">
              {speechMessage}
            </p>
          )}
          <section className="today-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">TODAY</p>
                <h2>Your routine</h2>
              </div>
              <span className="scope-pill">
                {completed}/{todayDoses.length || 0} done
                <small className="schedule-clock">
                  Local time {currentTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </small>
              </span>
            </div>
            <div className="progress-track">
              <span
                style={{
                  width: `${todayDoses.length ? Math.min(100, (completed / todayDoses.length) * 100) : 0}%`,
                }}
              />
            </div>
            {Object.entries(grouped).map(
              ([group, doses]) =>
                doses.length > 0 && (
                  <div className="dose-group" key={group}>
                    <h3>{group}</h3>
                    {doses.map((dose) => {
                      const status = doseState(dose);
                      const event = doseEvent(dose.id);
                      const isUpcoming = status === "UPCOMING";
                      const isTaken = status === "TAKEN";
                      const isMissed = status === "MISSED";
                      return <div
                        className={`dose-row ${isTaken ? "dose-done" : ""}`}
                        key={dose.id}
                      >
                        <div>
                          <span className="routine">
                            {routineLabel(dose.routine)}
                          </span>
                          <strong>{dose.medicineLabel}</strong>
                          {isUpcoming && <small>🔒 Available at {doseWindowLabel(dose).split(" - ")[0]}</small>}
                          {isMissed && !event && <small>⚠️ Window ended. Did you take this?</small>}
                          {isTaken && event && <small>✅ Taken at {new Date(event.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</small>}
                          {event?.status === "missed" && <small>⚠️ Missed</small>}
                        </div>
                        <button
                          className="listen-button"
                          onClick={() =>
                            speakDose(dose.medicineLabel, dose.routine)
                          }
                        >
                          {text.listen}
                        </button>
                        <button disabled={isUpcoming || isTaken || event?.status === "missed"} onClick={() => takeDose(dose)}>
                          {isTaken ? text.recorded : `${text.taken}${isUpcoming ? " 🔒" : ""}`}
                        </button>
                        <button className="miss-button" disabled={isUpcoming || isTaken || event?.status === "missed"} onClick={() => markMissed(dose.id)}>
                          {event?.status === "missed" ? "⚠️ Missed" : `${text.missed}${isUpcoming ? " 🔒" : ""}`}
                        </button>
                      </div>
                    })}
                  </div>
                ),
            )}
            {todayDoses.length === 0 && (
              <div className="empty-state">
                <p>Your first routine will appear here.</p>
                <small>Load the demo to see how the daily view works.</small>
              </div>
            )}
          </section>
          <section
            className="safety-banner"
            onClick={() => setScreen("safety")}
          >
            <strong>Safety: {attentionCount} items need attention</strong>
            <span>Open safety details →</span>
          </section>
          <section className="scope-banner">
            <strong>Ledger scope</strong>
            <span>
              Based on {ledger.length} prescriptions logged since{" "}
              {ledger.length
                ? ledger.map((item) => item.date).sort()[0]
                : "today"}
            </span>
          </section>
          <section className="otc-prompt">
            <div>
              <strong>Did you buy any OTC medicine today?</strong>
              <span>
                Keep the full picture, even when there is no prescription.
              </span>
            </div>
            <button onClick={addOtc}>＋ Add</button>
          </section>
          <nav className="bottom-nav">
            <button className={screen === "home" ? "active" : ""} onClick={() => setScreen("home")}>
              <span className="nav-icon">⌂</span><span>Today</span>
            </button>
            <button className={navigationScreen === "ledger" ? "active" : ""} onClick={() => setScreen("ledger")}>
              <span className="nav-icon">▤</span><span>Ledger ({ledger.length})</span>
            </button>
            <button className={navigationScreen === "caregiver" ? "active" : ""} onClick={() => setScreen("caregiver")}>
              <span className="nav-icon">!</span><span>Caregiver alerts{missedCount > 0 && <b className="alert-badge">{missedCount}</b>}</span>
            </button>
          </nav>
          {showCabinet && (
            <div className="cabinet-toast">
              <strong>Caregiver alerts</strong>
              <span>
                {missedCount
                  ? `${missedCount} missed dose alert${missedCount === 1 ? "" : "s"} ready to share.`
                  : "No caregiver alerts right now."}
              </span>
              <button onClick={() => setShowCabinet(false)}>Close</button>
            </div>
          )}
        </>
      )}
      {screen === "review" && pending && (
        <section className="review-screen">
          <button className="back-button" onClick={() => setScreen("home")}>
            ← Back
          </button>
          <p className="eyebrow">PRESCRIPTION REVIEW</p>
          <h1>Let’s check the important bits.</h1>
          <p className="lede">
            We found {pending.medicines.length} medicines from {pending.doctor}.
            Only fields that could change safety need your attention.
          </p>
          <div className="registry-status">
            <strong>Doctor registration: {verifyDoctor(pending)}</strong>
            <span>{doctorVerificationCopy(verifyDoctor(pending))}</span>
          </div>
          <div className="medicine-review">
            {pending.medicines.map((medicine) => (
              <div className="medicine-card" key={medicine.id}>
                <div className="medicine-title">
                  <span className="medicine-dot" />
                  <div>
                    <strong>{medicine.brand}</strong>
                    <span>{medicine.generic ?? "Generic not found"}</span>
                  </div>
                  {medicine.mappedBy === "unknown" && (
                    <span className="check-chip">Check this</span>
                  )}
                </div>
                <div className="medicine-details">
                  <span>
                    <small>STRENGTH</small>
                    {medicine.strength}
                  </span>
                  <span>
                    <small>WHEN</small>
                    {medicine.frequency}
                  </span>
                  <span>
                    <small>FOR</small>
                    {medicine.duration}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {findings
            .filter((item) => item.level !== "ok")
            .map((item) => (
              <div className={`finding-card ${item.level}`} key={item.reason}>
                <strong>
                  {item.level === "urgent_verify"
                    ? "Urgent verification"
                    : "Please check this"}
                </strong>
                <p>
                  {item.reason} Please confirm with your doctor or pharmacist.
                </p>
              </div>
            ))}
          {conflicts.length > 0 && (
            <div className="conflict-stack">
              <div className="warning-heading">
                <span>!</span>
                <div>
                  <strong>One important check</strong>
                  <small>
                    This prescription overlaps with your existing ledger.
                  </small>
                </div>
              </div>
              {conflicts.map((conflict) => (
                <div className="conflict-card" key={conflict.reason}>
                  <strong>{conflict.medicines.join(" + ")}</strong>
                  <p>{conflict.reason}</p>
                </div>
              ))}
              <ClarificationNotice conflict={conflicts[0]} ledger={ledger} incoming={pending} patient={profile} cardRef={setCardNode} />
              <button
                className="outline-button"
                onClick={() => void shareCard()}
              >
                Share clarification card
              </button>
            </div>
          )}
          <div className="safety-note">
            Medease never tells you to change a dose. Please confirm concerns
            with a doctor or pharmacist.
          </div>
          <button className="big-button" onClick={acceptReview}>
            Add to my ledger <span>→</span>
          </button>
        </section>
      )}
      {screen === "safety" && (
        <section className="review-screen">
          <button className="back-button" onClick={() => setScreen("home")}>
            ← Today
          </button>
          <p className="eyebrow">{text.safety.toUpperCase()}</p>
          <h1>Checks worth a conversation.</h1>
          {findings.map((item) => (
            <div className={`finding-card ${item.level}`} key={item.reason}>
              <strong>
                {item.level === "ok"
                  ? "All clear for now"
                  : item.level === "urgent_verify"
                    ? "Urgent verification"
                    : "Please check this"}
              </strong>
              <p>
                {item.reason} Please confirm with your doctor or pharmacist.
              </p>
            </div>
          ))}
          <button className="big-button" onClick={() => setScreen("home")}>
            Back to today
          </button>
        </section>
      )}
      {screen === "caregiver" && (
        <section className="review-screen">
          <button className="back-button" onClick={() => setScreen("home")}>
            ← Back to Today
          </button>
          <p className="eyebrow">CAREGIVER ALERTS</p>
          <h1>Alerts for your care circle.</h1>
          <p className="lede">
            These are local demo alerts based on dose events. No medicine is
            changed here.
          </p>
          {missedCount === 0 &&
          doseEvents.filter((event) => event.status === "duplicate").length ===
            0 ? (
            <div className="empty-state">
              <p>No caregiver alerts right now.</p>
              <small>Missed or duplicate dose events will appear here.</small>
            </div>
          ) : (
            <div className="ledger-list">
              {doseEvents
                .filter((event) => event.status !== "taken")
                .map((event) => (
                  <article key={event.id}>
                    <strong>
                      {event.status === "missed"
                        ? "Missed dose alert"
                        : "Duplicate dose alert"}
                    </strong>
                    <small>{event.timestamp}</small>
                    <span>
                      {event.status === "missed"
                        ? MISSED_DOSE_COPY
                        : "Please contact a doctor, pharmacist or emergency service now."}
                    </span>
                  </article>
                ))}
            </div>
          )}
          <button className="big-button" onClick={() => setScreen("home")}>
            Back to Today <span>→</span>
          </button>
        </section>
      )}
      {screen === "ledger" && (
        <section className="ledger-screen">
          <button className="back-button" onClick={() => setScreen("home")}>
            ← Today
          </button>
          <p className="eyebrow">YOUR HISTORY</p>
          <h1>The full picture.</h1>
          <p className="lede">
            Every prescription is kept together on this device, across doctors
            and dates.
          </p>
          {ledger.map((item) => (
            <article className="ledger-entry" key={item.id}>
              <span>{item.date}</span>
              <strong>{item.doctor}</strong>
              <small>
                {item.medicines
                  .map((medicine) => `${medicine.brand} ${medicine.strength}`)
                  .join(", ")}
              </small>
            </article>
          ))}
          <button className="big-button" onClick={() => setScreen("home")}>
            Back to today <span>→</span>
          </button>
        </section>
      )}
      {duplicatePrompt && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>{DUPLICATE_DOSE_COPY}</h2>
            <p>
              This will be logged and your caregiver alert will be prepared.
            </p>
            <button className="big-button" onClick={recordSecondDose}>
              Yes, record it
            </button>
            <button
              className="outline-button"
              onClick={() => setDuplicatePrompt(false)}
            >
              No, go back
            </button>
          </div>
        </div>
      )}
      {lateDosePrompt && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>Did you take this dose late?</h2>
            <p>
              {lateDosePrompt.medicineLabel} was available during {doseWindowLabel(lateDosePrompt)}. We will record the real time and label it Taken late.
            </p>
            <button className="big-button" onClick={confirmLateDose}>
              Yes, record Taken late
            </button>
            <button className="outline-button" onClick={() => setLateDosePrompt(null)}>
              No, go back
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
