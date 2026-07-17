"use client";

import { useSyncExternalStore } from "react";
import type { ProviderMode } from "@/lib/env";

type VoiceSupport = "checking" | "supported" | "unsupported";

const PROVIDER_LABELS: Record<ProviderMode, string> = {
  replay: "Simulated (Replay mode)",
  live: "Live GPT-5.6",
};

const noopSubscribe = () => () => {};

// Capability detection only: never requests microphone permission.
function detectVoiceSupport(): VoiceSupport {
  return typeof window.MediaRecorder === "function" &&
    typeof navigator.mediaDevices?.getUserMedia === "function"
    ? "supported"
    : "unsupported";
}

export default function AppShell({
  providerMode,
}: {
  providerMode: ProviderMode;
}) {
  const voiceSupport = useSyncExternalStore<VoiceSupport>(
    noopSubscribe,
    detectVoiceSupport,
    () => "checking",
  );

  return (
    <>
      <header className="app-header">
        <h1>SishyaGuru</h1>
        <p className="tagline">You teach. AI learns. You master.</p>
        <div className="badges">
          <span className="badge">Pre-production foundation</span>
          <span className="badge">Provider: {PROVIDER_LABELS[providerMode]}</span>
        </div>
      </header>
      <main id="main" className="workspace">
        <aside className="panel" aria-label="Concept mastery map">
          <h2>Concept Mastery Map</h2>
          <p>
            The curated topic and its concept nodes will render here once the
            learning loop is built. No mastery has been assessed.
          </p>
        </aside>
        <section className="panel" aria-label="Teaching conversation">
          <h2>Teaching Conversation</h2>
          <p>
            This is the application foundation. The teaching conversation is
            not implemented yet, and no AI responses are produced.
          </p>
          <p data-testid="voice-support">
            {voiceSupport === "checking" && "Checking optional voice input support…"}
            {voiceSupport === "supported" &&
              "Optional voice input: this browser supports push-to-talk recording. No microphone access is requested until you activate it."}
            {voiceSupport === "unsupported" &&
              "Optional voice input: not supported in this browser. Typing remains the complete path."}
          </p>
        </section>
        <aside className="panel" aria-label="Mastery feedback">
          <h2>Mastery Feedback</h2>
          <p>Awaiting your first lesson to assess mastery.</p>
        </aside>
      </main>
      <footer className="app-footer">
        <p>
          Pre-production foundation build: no live model calls, no stored data,
          and no assessments are made. Mastery guidance, when built, is
          formative learning feedback — never a grade or certification.
        </p>
      </footer>
    </>
  );
}
