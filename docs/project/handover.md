# Handover

- Product: SishyaGuru, a reverse-teaching mastery coach.
- Tagline: You teach. AI learns. You master.
- Workspace: `D:\Work\Codex\Hackathon Projects\OpenAI Hackathon\SishyaGuru`.
- Phase: M1-M3 verified; M4 request-based Live providers are active.
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
- Next: implement M4 server-only request-based GPT-5.6, transcription and exact-probe TTS
  adapters without adding a database, auth, queues, RAG, multiple topics, or Realtime.
