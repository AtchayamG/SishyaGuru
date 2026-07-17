"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { TranscriptionEnvelopeSchema, type MasteryState } from "@/lib/contract";
import { useClientSession } from "@/lib/client-session";
import type { ProviderMode } from "@/lib/env";
import { WATER_CYCLE_TOPIC } from "@/lib/topic";

type VoiceSupport = "checking" | "supported" | "unsupported";
type WorkspaceTab = "map" | "chat" | "feedback";

const PROVIDER_LABELS: Record<ProviderMode, string> = {
  replay: "Simulated (Replay mode)",
  live: "Live GPT-5.6 + bounded voice",
};
const TABS: readonly WorkspaceTab[] = ["map", "chat", "feedback"];
const STATE_ICONS: Record<MasteryState, string> = {
  unassessed: "○",
  insufficient_evidence: "?",
  emerging: "△",
  developing: "◇",
  secure: "★",
};
const noopSubscribe = () => () => {};

function detectVoiceSupport(): VoiceSupport {
  return typeof window.MediaRecorder === "function" &&
    typeof navigator.mediaDevices?.getUserMedia === "function"
    ? "supported"
    : "unsupported";
}

export default function AppShell({ providerMode }: { providerMode: ProviderMode }) {
  const voiceSupport = useSyncExternalStore<VoiceSupport>(
    noopSubscribe,
    detectVoiceSupport,
    () => "checking",
  );
  const {
    state,
    isLoaded,
    isBusy,
    probeAudio,
    clearSession,
    submitTurn,
    requestSummary,
    currentFixture,
  } = useClientSession(providerMode);
  const [inputText, setInputText] = useState("");
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("chat");
  const [isSimulatedTranscript, setIsSimulatedTranscript] = useState(false);
  const [voiceState, setVoiceState] = useState<"idle" | "recording" | "transcribing">("idle");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const chatLogRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const recordingIntervalRef = useRef<number | null>(null);
  const recordedBytesRef = useRef(0);
  const discardRecordingRef = useRef(false);
  const recordingTooLargeRef = useRef(false);
  const transcriptionAbortRef = useRef<AbortController | null>(null);
  const voiceGenerationRef = useRef(0);
  const voiceBusyRef = useRef(false);
  const replayEnabled = providerMode === "replay";
  const assessedConceptCount = Object.values(state.masteryStates).filter(
    (mastery) => mastery !== "unassessed",
  ).length;

  useEffect(() => {
    if (chatLogRef.current) chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
  }, [state.messages]);

  useEffect(() => () => {
    voiceGenerationRef.current += 1;
    transcriptionAbortRef.current?.abort();
    if (recorderRef.current?.state === "recording") {
      discardRecordingRef.current = true;
      recorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (recordingTimerRef.current !== null) window.clearTimeout(recordingTimerRef.current);
    if (recordingIntervalRef.current !== null) window.clearInterval(recordingIntervalRef.current);
    chunksRef.current = [];
  }, []);

  function activateTab(tab: WorkspaceTab) {
    setActiveTab(tab);
    window.requestAnimationFrame(() => document.getElementById(`tab-${tab}`)?.focus());
  }

  function handleTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const current = TABS.indexOf(activeTab);
    const delta = event.key === "ArrowRight" ? 1 : -1;
    activateTab(TABS[(current + delta + TABS.length) % TABS.length] ?? "chat");
  }

  async function submitExplanation() {
    if (!inputText.trim() || isBusy) return;
    if (await submitTurn(inputText)) {
      setInputText("");
      setIsSimulatedTranscript(false);
    }
  }

  function releaseMicrophone() {
    recorderRef.current = null;
    const stream = streamRef.current;
    streamRef.current = null;
    stream?.getTracks().forEach((track) => track.stop());
    if (recordingTimerRef.current !== null) window.clearTimeout(recordingTimerRef.current);
    recordingTimerRef.current = null;
    if (recordingIntervalRef.current !== null) window.clearInterval(recordingIntervalRef.current);
    recordingIntervalRef.current = null;
    voiceBusyRef.current = false;
    setRecordingSeconds(0);
  }

  function cancelVoiceWork(showDiscarded = false) {
    voiceGenerationRef.current += 1;
    transcriptionAbortRef.current?.abort();
    transcriptionAbortRef.current = null;
    discardRecordingRef.current = true;
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    releaseMicrophone();
    chunksRef.current = [];
    recordedBytesRef.current = 0;
    recordingTooLargeRef.current = false;
    setVoiceState("idle");
    if (showDiscarded) setVoiceError("Recording discarded. You can record again or continue by typing.");
  }

  async function startRecording() {
    if (
      providerMode !== "live" ||
      voiceSupport !== "supported" ||
      voiceState !== "idle" ||
      voiceBusyRef.current
    ) return;
    voiceBusyRef.current = true;
    setVoiceError(null);
    const generation = voiceGenerationRef.current + 1;
    voiceGenerationRef.current = generation;
    discardRecordingRef.current = false;
    recordingTooLargeRef.current = false;
    recordedBytesRef.current = 0;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (voiceGenerationRef.current !== generation) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((type) =>
        MediaRecorder.isTypeSupported(type),
      );
      if (!mimeType) throw new Error("unsupported recording format");
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;
      stream.getTracks().forEach((track) => {
        track.addEventListener?.("ended", () => {
          if (
            voiceGenerationRef.current === generation &&
            recorderRef.current === recorder &&
            recorder.state === "recording"
          ) {
            cancelVoiceWork();
            setVoiceError("Microphone capture ended unexpectedly. You can retry or continue by typing.");
          }
        });
      });
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (
          voiceGenerationRef.current !== generation ||
          recorderRef.current !== recorder
        ) return;
        if (event.data.size <= 0) return;
        chunksRef.current.push(event.data);
        recordedBytesRef.current += event.data.size;
        if (recordedBytesRef.current > 5 * 1024 * 1024) {
          recordingTooLargeRef.current = true;
          if (recorder.state === "recording") recorder.stop();
        }
      };
      recorder.onerror = () => {
        if (
          voiceGenerationRef.current !== generation ||
          recorderRef.current !== recorder
        ) return;
        cancelVoiceWork();
        setVoiceError("Recording stopped unexpectedly. You can retry or continue by typing.");
      };
      recorder.onstop = async () => {
        if (
          voiceGenerationRef.current !== generation ||
          recorderRef.current !== recorder
        ) return;
        const discarded = discardRecordingRef.current;
        const tooLarge = recordingTooLargeRef.current;
        const chunks = chunksRef.current;
        chunksRef.current = [];
        const blob = new Blob(chunks, { type: mimeType.split(";")[0] });
        releaseMicrophone();
        recordedBytesRef.current = 0;
        if (discarded || voiceGenerationRef.current !== generation) return;
        setVoiceState("transcribing");
        if (tooLarge || blob.size === 0 || blob.size > 5 * 1024 * 1024) {
          setVoiceError("The recording was empty or larger than 5 MB. Please retry or type instead.");
          setVoiceState("idle");
          return;
        }
        const controller = new AbortController();
        transcriptionAbortRef.current = controller;
        try {
          const form = new FormData();
          form.append("audio", blob, mimeType.startsWith("audio/mp4") ? "lesson.mp4" : "lesson.webm");
          const response = await fetch("/api/audio/transcribe", {
            method: "POST",
            body: form,
            signal: controller.signal,
          });
          if (voiceGenerationRef.current !== generation) return;
          const envelope = TranscriptionEnvelopeSchema.safeParse(await response.json());
          if (voiceGenerationRef.current !== generation) return;
          if (!envelope.success) {
            setVoiceError("The transcription response could not be read. You can continue by typing.");
          } else if (!envelope.data.ok) {
            setVoiceError(envelope.data.message);
          } else {
            setInputText(envelope.data.transcript);
            setIsSimulatedTranscript(true);
          }
        } catch (error) {
          if (
            voiceGenerationRef.current === generation &&
            !(error instanceof DOMException && error.name === "AbortError")
          ) {
            setVoiceError("The recording could not be transcribed. You can retry or continue by typing.");
          }
        } finally {
          if (voiceGenerationRef.current === generation) {
            transcriptionAbortRef.current = null;
            setVoiceState("idle");
          }
        }
      };
      recorder.start(250);
      setVoiceState("recording");
      recordingTimerRef.current = window.setTimeout(() => recorder.stop(), 60_000);
      recordingIntervalRef.current = window.setInterval(
        () => setRecordingSeconds((seconds) => Math.min(seconds + 1, 60)),
        1_000,
      );
    } catch {
      if (voiceGenerationRef.current !== generation) return;
      releaseMicrophone();
      setVoiceState("idle");
      setVoiceError("Microphone access was unavailable. Typing remains the complete path.");
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  function discardRecording() {
    cancelVoiceWork(true);
  }

  if (!isLoaded) {
    return (
      <main id="main" className="loading-state" aria-busy="true">
        Loading your browser-local learning session…
      </main>
    );
  }

  return (
    <>
      <header className="app-header">
        <div>
          <h1>SishyaGuru</h1>
          <p className="tagline">You teach. AI learns. You master.</p>
        </div>
        <div className="badges">
          <span className="badge">Provider: {PROVIDER_LABELS[providerMode]}</span>
          <button
            className="badge clear-button"
            type="button"
            onClick={() => {
              if (window.confirm("Clear browser-local progress and restart this session?")) {
                cancelVoiceWork();
                clearSession();
                setInputText("");
                setIsSimulatedTranscript(false);
                setVoiceError(null);
                setVoiceState("idle");
              }
            }}
          >
            Clear progress
          </button>
        </div>
        <p className="voice-support" data-testid="voice-support" role="status">
          {voiceSupport === "checking" && "Checking optional push-to-talk capability…"}
          {voiceSupport === "supported" &&
            (replayEnabled
              ? "Push-to-talk is simulated in Replay; no microphone permission is requested."
              : "Push-to-talk is ready. Recording starts only after you choose Record lesson.")}
          {voiceSupport === "unsupported" &&
            "Push-to-talk is unavailable in this browser; typing remains the complete path."}
        </p>
      </header>

      <nav className="mobile-tabs" aria-label="Learning workspace views">
        {TABS.map((tab) => (
          <button
            id={`tab-${tab}`}
            key={tab}
            type="button"
            aria-controls={`panel-${tab}`}
            aria-pressed={activeTab === tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => activateTab(tab)}
            onKeyDown={handleTabKeyDown}
          >
            {tab === "map" ? "Concept Map" : tab === "chat" ? "Conversation" : "Feedback"}
          </button>
        ))}
      </nav>

      <main id="main" className="workspace">
        <aside
          id="panel-map"
          aria-label="Concept Map"
          className={`panel ${activeTab !== "map" ? "hide-on-compact" : ""}`}
        >
          <h2>Concept Mastery Map</h2>
          <p role="status" aria-live="polite">
            {assessedConceptCount} of {WATER_CYCLE_TOPIC.nodes.length} concepts assessed.
          </p>
          <div className="node-list">
            {WATER_CYCLE_TOPIC.nodes.map((node) => {
              const mastery = state.masteryStates[node.id] ?? "unassessed";
              return (
                <div
                  key={node.id}
                  className={`node-item state-${mastery}`}
                  aria-label={`${node.label}: ${mastery.replace("_", " ")}`}
                >
                  <span aria-hidden="true" className="node-icon">
                    {STATE_ICONS[mastery]}
                  </span>
                  <span className="node-label">{node.label}</span>
                  <span className="node-state">{mastery.replace("_", " ")}</span>
                </div>
              );
            })}
          </div>
        </aside>

        <section
          id="panel-chat"
          aria-label="Conversation"
          className={`panel chat-panel ${activeTab !== "chat" ? "hide-on-compact" : ""}`}
        >
          <h2>Teaching Conversation</h2>
          <div className="chat-log" aria-live="polite" ref={chatLogRef}>
            {state.messages.map((message) => (
              <div key={message.id} className={`chat-bubble role-${message.role}`}>
                <strong>{message.role === "ai" ? "AI Learner" : "You"}: </strong>
                <span>{message.text}</span>
              </div>
            ))}
          </div>

          {state.messages.length > 1 && (
            <div className="spoken-probe-state">
              {!replayEnabled && probeAudio && (
                <audio
                  controls
                  preload="none"
                  aria-label="AI-generated spoken probe"
                  src={`data:${probeAudio.mediaType};base64,${probeAudio.dataBase64}`}
                />
              )}
              <span id="spoken-probe-help">
                {replayEnabled
                  ? "Spoken probe is disabled in Replay; the complete question is visible above."
                  : probeAudio
                    ? "AI-generated voice. Playback starts only when you choose Play."
                    : "Speech was unavailable; the complete question remains visible above."}
              </span>
            </div>
          )}

          {state.summary ? (
            <div className="summary-banner">Session ended. Review the validated summary.</div>
          ) : (
            <div className="chat-input-area">
              {state.error && <div className="error-message" role="alert">{state.error}</div>}
              {voiceError && <div className="error-message" role="alert">{voiceError}</div>}
              {isSimulatedTranscript && (
                <div className="transcript-badge" id="transcript-review-help">
                  {replayEnabled
                    ? "Simulated transcript — review and edit before explicit submission"
                    : "Transcribed candidate — review and edit before explicit submission"}
                </div>
              )}
              {!replayEnabled && (
                <div className="voice-actions">
                  {voiceState === "recording" ? (
                    <>
                      <button type="button" className="btn-secondary" onClick={stopRecording}>
                        Stop and transcribe
                      </button>
                      <button type="button" className="btn-secondary" onClick={discardRecording}>
                        Discard recording
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={voiceSupport !== "supported" || voiceState === "transcribing" || isBusy}
                      onClick={() => void startRecording()}
                    >
                      Record lesson
                    </button>
                  )}
                  <span>
                    {voiceState === "recording" &&
                      `Recording ${Math.floor(recordingSeconds / 60)}:${String(recordingSeconds % 60).padStart(2, "0")} / 1:00.`}
                    {voiceState === "transcribing" && "Transcribing… nothing will auto-submit."}
                    {voiceState === "idle" && "Optional push-to-talk; typing remains available."}
                  </span>
                  <span role="status" aria-live="polite">
                    {voiceState === "recording" && recordingSeconds >= 50
                      ? "Ten seconds or less remain."
                      : ""}
                  </span>
                </div>
              )}
              <textarea
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
                placeholder={
                  replayEnabled
                    ? "Teach the AI Learner…"
                    : "Teach Guru in your own words, or record a lesson…"
                }
                rows={5}
                aria-label={
                  isSimulatedTranscript
                    ? replayEnabled
                      ? "Simulated transcript review"
                      : "Transcribed candidate review"
                    : "Your explanation"
                }
                aria-describedby={isSimulatedTranscript ? "transcript-review-help" : undefined}
                disabled={isBusy || voiceState !== "idle"}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void submitExplanation();
                  }
                }}
              />
              <div className="chat-actions">
                {currentFixture && replayEnabled && (
                  <>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setInputText(currentFixture.explanation);
                        setIsSimulatedTranscript(false);
                      }}
                    >
                      Use Sample Explanation
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setInputText(currentFixture.explanation);
                        setIsSimulatedTranscript(true);
                      }}
                    >
                      Use simulated voice transcript
                    </button>
                  </>
                )}
                {currentFixture && (
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={!inputText.trim() || isBusy || voiceState !== "idle"}
                    onClick={() => void submitExplanation()}
                  >
                    {isBusy
                      ? "Assessing…"
                      : isSimulatedTranscript
                        ? "Submit Reviewed Transcript"
                        : "Submit Explanation"}
                  </button>
                )}
                {!currentFixture && (
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={isBusy}
                    onClick={() => void requestSummary()}
                  >
                    {isBusy ? "Creating summary…" : "End Session"}
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        <aside
          id="panel-feedback"
          aria-label="Feedback"
          className={`panel ${activeTab !== "feedback" ? "hide-on-compact" : ""}`}
        >
          <h2>Mastery Feedback</h2>
          <div aria-live="polite">
            {state.summary ? (
              <div className="summary-view">
                <h3>Session Summary</h3>
                <p className="disclaimer">{state.summary.disclaimer}</p>
                <h4>Strengths</h4>
                <ul>
                  {state.summary.strengths.map((strength) => (
                    <li key={strength.nodeId}>
                      <strong>{WATER_CYCLE_TOPIC.nodes.find((node) => node.id === strength.nodeId)?.label}</strong>
                      <p className="quote">“{strength.evidenceQuote}”</p>
                      <p>{strength.note}</p>
                    </li>
                  ))}
                </ul>
                <h4>Gaps to revisit</h4>
                <ul>
                  {state.summary.gaps.map((gap) => (
                    <li key={gap.nodeId}>
                      <strong>{WATER_CYCLE_TOPIC.nodes.find((node) => node.id === gap.nodeId)?.label}</strong>
                      <p>{gap.note}</p>
                    </li>
                  ))}
                </ul>
                <h4>Suggested next explanation</h4>
                <p>{state.summary.suggestedNextExplanation}</p>
              </div>
            ) : (
              <div className="turn-feedback">
                {state.misconceptions.length > 0 && (
                  <section className="misconceptions" aria-label="Misconceptions worth revisiting">
                    <h3>Worth revisiting</h3>
                    {state.misconceptions.map((misconception) => (
                      <div key={`${misconception.nodeId}-${misconception.evidenceQuote}`} className="feedback-card misconception-card">
                        <p className="quote">“{misconception.evidenceQuote}”</p>
                        <p>{misconception.gentleNote}</p>
                      </div>
                    ))}
                  </section>
                )}
                {state.lastAssessments.length > 0 && (
                  <section className="assessments" aria-label="Recent evidence assessments">
                    <h3>Recent evidence</h3>
                    {state.lastAssessments.map((assessment) => (
                      <div key={assessment.nodeId} className="feedback-card">
                        <div className="feedback-header">
                          <strong>{WATER_CYCLE_TOPIC.nodes.find((node) => node.id === assessment.nodeId)?.label}</strong>
                          <span className="badge">{assessment.state.replace("_", " ")}</span>
                        </div>
                        {assessment.evidenceQuote && <p className="quote">“{assessment.evidenceQuote}”</p>}
                        <p>{assessment.rationale}</p>
                      </div>
                    ))}
                  </section>
                )}
                {state.lastAssessments.length === 0 && state.misconceptions.length === 0 && (
                  <p>Awaiting your first lesson. No mastery has been assessed.</p>
                )}
              </div>
            )}
          </div>
        </aside>
      </main>

      <footer className="app-footer">
        <p>
          {replayEnabled
            ? "Replay uses labelled simulated evidence and makes no OpenAI or microphone calls."
            : "Live sends only explicitly submitted text or a bounded recording to OpenAI. Raw audio and unsubmitted transcript candidates are ephemeral; submitted reviewed text stays in browser-local progress until Clear. Provider processing still applies."}
          {" "}Progress stays in this browser. Do not include personal or sensitive information.
          Clear progress removes the browser-local session.
        </p>
      </footer>
    </>
  );
}
