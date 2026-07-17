"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { MasteryState } from "@/lib/contract";
import { useClientSession } from "@/lib/client-session";
import type { ProviderMode } from "@/lib/env";
import { WATER_CYCLE_TOPIC } from "@/lib/topic";

type VoiceSupport = "checking" | "supported" | "unsupported";
type WorkspaceTab = "map" | "chat" | "feedback";

const PROVIDER_LABELS: Record<ProviderMode, string> = {
  replay: "Simulated (Replay mode)",
  live: "Live configured — adapter unavailable in M3",
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
  const { state, isLoaded, clearSession, submitTurn, requestSummary, currentFixture } =
    useClientSession();
  const [inputText, setInputText] = useState("");
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("chat");
  const [isSimulatedTranscript, setIsSimulatedTranscript] = useState(false);
  const chatLogRef = useRef<HTMLDivElement>(null);
  const replayEnabled = providerMode === "replay";

  useEffect(() => {
    if (chatLogRef.current) chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
  }, [state.messages]);

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

  function submitExplanation() {
    if (!replayEnabled || !inputText.trim()) return;
    if (submitTurn(inputText)) {
      setInputText("");
      setIsSimulatedTranscript(false);
    }
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
                clearSession();
                setInputText("");
                setIsSimulatedTranscript(false);
              }
            }}
          >
            Clear progress
          </button>
        </div>
        <p className="voice-support" data-testid="voice-support" role="status">
          {voiceSupport === "checking" && "Checking optional push-to-talk capability…"}
          {voiceSupport === "supported" &&
            "This browser supports push-to-talk recording; M3 does not request microphone access."}
          {voiceSupport === "unsupported" &&
            "Push-to-talk is unavailable in this browser; typing remains the complete path."}
        </p>
      </header>

      {!replayEnabled && (
        <div className="live-pending" role="alert">
          Live mode is configured, but its GPT-5.6 and audio adapters are not implemented
          until M4. Assessment controls are disabled; no Replay result is presented as Live.
        </div>
      )}

      <nav className="mobile-tabs" aria-label="Learning workspace views" role="tablist">
        {TABS.map((tab) => (
          <button
            id={`tab-${tab}`}
            key={tab}
            type="button"
            role="tab"
            aria-controls={`panel-${tab}`}
            aria-selected={activeTab === tab}
            tabIndex={activeTab === tab ? 0 : -1}
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
          role="tabpanel"
          aria-labelledby="tab-map"
          className={`panel ${activeTab !== "map" ? "hide-on-compact" : ""}`}
        >
          <h2>Concept Mastery Map</h2>
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
          role="tabpanel"
          aria-labelledby="tab-chat"
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
              <button type="button" disabled aria-describedby="spoken-probe-help">
                Play spoken probe
              </button>
              <span id="spoken-probe-help">
                Spoken probe unavailable in Replay M3; the complete question is visible above.
              </span>
            </div>
          )}

          {state.summary ? (
            <div className="summary-banner">Session ended. Review the validated summary.</div>
          ) : (
            <div className="chat-input-area">
              {state.error && <div className="error-message" role="alert">{state.error}</div>}
              {isSimulatedTranscript && (
                <div className="transcript-badge" id="transcript-review-help">
                  Simulated transcript — review and edit before explicit submission
                </div>
              )}
              <textarea
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
                placeholder={
                  replayEnabled
                    ? "Teach the AI Learner…"
                    : "Live assessment is unavailable until the M4 adapters exist."
                }
                rows={5}
                aria-label={isSimulatedTranscript ? "Simulated transcript review" : "Your explanation"}
                aria-describedby={isSimulatedTranscript ? "transcript-review-help" : undefined}
                disabled={!replayEnabled}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    submitExplanation();
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
                    disabled={!inputText.trim() || !replayEnabled}
                    onClick={submitExplanation}
                  >
                    {isSimulatedTranscript ? "Submit Reviewed Transcript" : "Submit Explanation"}
                  </button>
                )}
                {!currentFixture && (
                  <button type="button" className="btn-primary" onClick={requestSummary}>
                    End Session
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        <aside
          id="panel-feedback"
          role="tabpanel"
          aria-labelledby="tab-feedback"
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
          M3 uses labelled deterministic Replay only. Progress stays in this browser;
          no audio, secret, or OpenAI request is stored or sent. Do not include personal
          or sensitive information. Clear progress removes the browser-local session.
        </p>
      </footer>
    </>
  );
}
