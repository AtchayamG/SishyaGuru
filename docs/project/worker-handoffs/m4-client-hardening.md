# M4 Client Hardening Handoff

## Scope

- Integrated Live typed turns and optional push-to-talk into the existing learning studio.
- Added Live summary generation without changing the frozen Water Cycle domain model.
- Preserved Replay as the default credential-free judging path.

## Safety and lifecycle controls

- Synchronous operation locks prevent duplicate turn, summary and microphone acquisition.
- Abort controllers plus generation checks discard late responses after clear or unmount.
- Live responses require server-authoritative provider provenance.
- Recordings stop at 60 seconds or 5 MB, expose elapsed time, support explicit discard,
  release microphone tracks and never auto-submit a transcript.
- One native audio control owns disclosed AI-probe playback.
- Summary request bodies are stream-bounded before JSON parsing.

## Verification reproduced by Codex

- `npm run lint`
- `npm run typecheck`
- `npm test` — 33 passed
- `npm run build`
- `npm run smoke` — 9 passed
- `npm run smoke:live-ui` — 7 passed
- `npm audit --audit-level=high` — no high/critical findings; two moderate transitive
  PostCSS findings remain because the suggested forced fix is a breaking Next.js downgrade.

## Live proof

The existing authorized key was used without printing it. A GPT-5.6 turn succeeded through
the application route. Disclosed TTS produced an MP3, a temporary WebM was submitted to the
application transcription route, and the response returned a candidate-only transcript
with server-derived duration. No learner text, transcript content or raw provider output
was logged.
