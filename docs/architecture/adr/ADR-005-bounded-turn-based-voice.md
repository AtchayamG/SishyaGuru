# ADR-005 — Bounded turn-based voice over the text mastery contract

- **Status:** Accepted for planned P0; implementation unverified
- **Date:** 2026-07-18
- **Context:** `docs/blueprint/SISHYAGURU_MASTER_BLUEPRINT_v1.md` §§3–8

## Context

Speaking is a natural way for a learner to teach, and hearing the AI Learner's curious
question reinforces the role reversal. The existing product, however, depends on a
learner-owned text explanation and exact evidence quotes. Continuous speech-to-speech
would bypass transcript review and add a second conversation/session architecture.

## Decision

Add optional, request-based voice at the edges:

1. push-to-talk records one bounded audio turn;
2. `gpt-4o-mini-transcribe` produces candidate text;
3. the learner reviews/edits and explicitly submits that transcript;
4. the unchanged GPT-5.6 Structured Outputs contract assesses the confirmed text; and
5. `gpt-4o-mini-tts` may render only the validated probe question.

Use no Realtime session, continuous listening, automatic submission, audio persistence,
or independent voice-agent memory in P0. Replay uses labelled deterministic fixtures and
makes no OpenAI audio call.

## Rationale

- Preserves exact-substring evidence and learner agency.
- Uses OpenAI's simpler request-based path for bounded input and generated speech.
- Keeps the API key and audio adapters server-side.
- Makes microphone and speech failures optional presentation failures, not learning-loop
  failures.
- Adds one transcription route but no database, auth, queue, WebRTC credential service,
  telephony or new deployment.

## Consequences

- A voice turn has higher latency and up to three explicit model calls: transcription,
  mastery, and optional TTS.
- The learner must pause to review a transcript, so this is not full-duplex conversation.
- Browser `MediaRecorder` support and microphone permissions need explicit UX and tests.
- TTS output must be disclosed as AI-generated and must retain identical visible text.
- Realtime may be reconsidered only if tested learners need interruption or continuous
  low-latency dialogue and the evidence-review invariant can still be preserved.

