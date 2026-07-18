# Handover

- Product: SishyaGuru, a reverse-teaching mastery coach.
- Tagline: You teach. AI learns. You master.
- Workspace: `D:\Work\Codex\Hackathon Projects\OpenAI Hackathon\SishyaGuru`.
- Phase: M1-M6 complete, published, submitted and verified.
- Primary category: Education.
- Core constraint: the project must be unique and substantially different from Incident Commander AI.
- Frozen P0: the Water Cycle with eight trusted concepts, evidence-bound mastery
  assessment, one curious AI follow-up per turn, live concept map, browser-local progress,
  deterministic Replay by default, and one bounded Live GPT-5.6 proof.
- Optional voice path: push-to-talk ≤60 seconds/≤5 MB → server-only
  `gpt-4o-mini-transcribe` → mandatory transcript review/edit → explicit submit through
  the unchanged GPT-5.6 contract → optional `gpt-4o-mini-tts` of the exact probe.
- Voice invariants: no continuous listening, no auto-submit, no audio persistence, no
  biometric/affect inference, AI-voice disclosure, identical visible text, and Replay
  makes zero OpenAI audio calls.
- Canonical mastery states: `unassessed`, `insufficient_evidence`, `emerging`, `developing`, `secure`.
- Provider contract: Responses API Structured Outputs via `text.format`, `store: false`; invalid evidence rejects the complete result; no automatic Live-to-Replay fallback.
- M1 evidence: strict Next.js App Router foundation, Replay-default server configuration,
  accessible responsive shell, microphone capability detection without a permission
  request, 6 unit tests and 3 Chromium smoke tests; all lint/typecheck/build gates pass.
- M2 evidence: one Zod contract source, exact canonical topic validation, atomic mastery
  updates, grounded turn/summary checks, strict audio/transcription envelopes and three
  deterministic Replay turns; 22 total unit/contract tests pass.
- M3 evidence: deterministic three-turn Replay UI, all eight mastery nodes, cited
  evidence/rationale, respectful misconception feedback, validated summary, versioned
  browser-local progress, confirmed clearing, and transcript review through the same gate;
  22 unit/contract tests and 9 Chromium scenarios pass.
- M4 evidence: server-only GPT-5.6 Structured Outputs, bounded transcription, exact-probe
  disclosed TTS, Live typed/voice UI, synchronous duplicate locks, abort/generation
  cancellation, strict provenance, streamed body limits, and fail-closed validation.
  A real application-route smoke proved the GPT-5.6 turn and the TTS-to-WebM-to-
  transcription chain without logging secrets or learner content.
- M5 evidence: streamed request limits, server turn budget, exact privacy disclosure,
  response security headers, corrected responsive semantics, concise live announcements,
  Axe, keyboard-only and 200%-equivalent responsive coverage. Public deployment is
  intentionally Replay-only with no OpenAI key.
- Current gates: lint, strict typecheck, 43 unit/domain tests, production build, 12 Replay
  browser tests and 7 Live browser tests pass. `npm audit --audit-level=high` reports only
  a moderate transitive PostCSS advisory whose forced fix would cross a breaking Next.js
  downgrade; no forced fix was applied.
- Publication evidence: public MIT repository and clean-clone verification pass. The
  Replay-only public application is live at `https://atchayamg.github.io/SishyaGuru/`;
  the Pages workflow, public teaching-turn smoke and 390px responsive check pass. The
  145.224-second final demo is public at `https://youtu.be/87eZyCzX-ns` with the custom
  thumbnail and creator-published English SRT; logged-out oEmbed returns HTTP 200.
  Devpost submission `1099528` is Submitted to OpenAI Build Week at
  `https://devpost.com/software/sishyaguru` and is linked to the public repository/video.
- Next: preserve public access through judging. The live submission requirements make a
  hosted website optional; judges use the repository's credential-free Replay quickstart.
  Do not add database, auth, queues, RAG, multiple topics or Realtime.
