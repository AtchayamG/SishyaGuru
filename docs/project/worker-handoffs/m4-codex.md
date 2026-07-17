# M4 Codex Handoff

## Done

- Added the official OpenAI JavaScript SDK and a server-only client singleton.
- Added `POST /api/session/turn` with GPT-5.6 Responses Structured Outputs,
  `store: false`, a 25-second timeout, strict canonical request validation, and
  a second application-side evidence validation before any state can change.
- Added optional `gpt-4o-mini-tts` generation from only the validated
  `probe.question`; failures preserve the text turn and the response discloses
  `AI-generated voice` when audio is ready.
- Added `POST /api/audio/transcribe` with a WebM/MP4 signature allowlist, 5-MB
  cap, server-side container duration parsing, 60-second cap, memory-only upload,
  and candidate-only `gpt-4o-mini-transcribe` output.
- Added safe error envelopes, bounded body checks, provider timeouts and an
  eight-request-per-minute in-process abuse guard. Raw provider errors and the
  API key never enter client envelopes or logs.
- Used the previously authorized existing `OPENAI_API_KEY` for one minimal Live
  text proof. It returned a validated Live envelope with eight canonical
  assessments and a precipitation-targeted probe. No audio was requested.

## Verification

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: 30/30 passed before integration.
- `npm run build`: passed with both Node route handlers present.
- `npm audit --audit-level=high`: passed; two moderate transitive PostCSS
  advisories remain pinned through Next.js and have no non-breaking fix.

## Boundaries

- No Realtime session, database, authentication, learner-audio persistence,
  arbitrary TTS endpoint, or automatic Live-to-Replay fallback was added.
- The rate limit is intentionally an instance-local P0 guard; a distributed
  deployment would need a shared edge/store-backed limiter.
- Browser recording, transcript review, Live turn wiring and final spoken-probe
  playback remain client integration work. The server contracts are ready.
