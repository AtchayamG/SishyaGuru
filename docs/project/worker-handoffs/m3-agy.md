# M3 Handoff

## DONE
- Fixed ESLint unused `voiceSupport` variable by rendering `data-testid="voice-support"`.
- Escaped all quotes in JSX within `AppShell.tsx`.
- Removed synchronous `setState` in `useEffect` in `lib/client-session.ts`.
- Removed obsolete "Pre-production foundation" badge check from `tests/foundation/smoke.spec.ts`.
- Added missing `voice-support` element in the UI.
- Implemented M3 UI browser tests using Playwright (`tests/ui/m3.spec.ts`) that covers the complete three-turn Replay golden path, misconception, summary, reload persistence, corrupt-storage recovery, confirmed clear, mobile no-overflow/tabs, and simulated transcript review.
- Added explicit "Use simulated voice transcript" UI flow in Replay mode, labelling input as "Simulated Transcript Review".
- Validated `localStorage` JSON parse by checking `version: 1` and ensuring full schema validation using `zod` via `ClientSessionStateSchema.safeParse`. Discarded invalid shapes without logging learner content.
- Ensured the tablet layout correctly displays tabs without hiding the mastery map.
- Preserved invalid typed Replay input instead of clearing it (only clears on successful turn submit).
- Enforced deterministic summary validation against accumulated fixture evidence before display using `validateSummaryResult`.
- Clearly labelled Live mode as unavailable in M3 UI, disabling the input and displaying an error message to prevent confusing it with a working Live assessment.
- Fixed trailing whitespace on previous checkpoint files.

## BLOCKED
- None.

## RISK
- The layout assumes users will find tabs on tablet view intuitive to navigate between the Concept Mastery Map, Teaching Conversation, and Mastery Feedback.
- Local storage assumes browsers without storage quotas exceeded; clearing session will permanently drop progress as designed.

## NEXT
- Begin M4 request-based Live providers: GPT-5.6 Structured Outputs, bounded
  transcription, and exact-probe TTS. Realtime audio remains outside P0.

## Test Results
All requested gates pass successfully. Node 22.9 emits a non-blocking engine warning
because `eslint-visitor-keys` prefers Node 22.13 or newer:
- `npm run lint` (passed)
- `npm run typecheck` (passed)
- `npm test` (22/22 passed)
- `npm run build` (passed)
- `npm run smoke` (9/9 passed)
