# Handover

- Product: SishyaGuru, a reverse-teaching mastery coach.
- Tagline: You teach. AI learns. You master.
- Workspace: `D:\Work\Codex\Hackathon Projects\OpenAI Hackathon\SishyaGuru`.
- Phase: M1 application foundation verified; M2 domain contracts is active.
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
- Next: implement M2 contracts, the eight-node Water Cycle rubric, evidence validator,
  mastery reducer and deterministic Replay fixtures without adding a database, auth,
  queues, RAG, multiple topics, or a Realtime session.
