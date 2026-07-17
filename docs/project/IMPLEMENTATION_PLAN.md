# Implementation Plan

## Scope rule

Finish the smallest complete learning loop before adding breadth. P0 ships one excellent
topic, one honest mastery provider boundary, and optional bounded voice input/output over
the same text contract; it does not ship a general learning-management or Realtime system.

## Milestones

### M0 - Pre-production

Deliverables:

- master blueprint and product requirements;
- system and voice architecture plus ADRs;
- UX, voice UX, accessibility and content specifications;
- threat model, test strategy and evaluation suite design;
- rules/evidence matrix and submission plan.

Exit gate: documents agree on the same P0 boundaries, contracts and truthfulness rules.

### M1 - Application foundation

Deliverables:

- Next.js App Router application with strict TypeScript;
- minimal lint, typecheck, unit test, build and browser-test commands;
- server-only configuration validation;
- professional base theme and responsive shell.
- browser capability detection for optional `MediaRecorder` without requesting permission.

Exit gate: credential-free build and static quality gates pass.

### M2 - Domain contracts and curated topic

Deliverables:

- water-cycle concept rubric;
- assessment request/response schemas;
- mastery reducer and evidence validator;
- deterministic replay fixtures.
- voice transport envelope, audio policy types and deterministic sample transcript/audio fixtures.

Exit gate: invalid concept IDs, fabricated quotes and unsupported mastery transitions are rejected.

### M3 - Reverse-teaching loop

Deliverables:

- teaching conversation;
- one-question curious learner response;
- concept mastery map;
- evidence/misconception panel;
- browser-local session state and reset.
- optional push-to-talk, transcript review/edit, and accessible probe playback states.

Exit gate: replay golden path completes by keyboard on desktop and mobile layouts.

### M4 - Live GPT-5.6 and bounded voice boundaries

Deliverables:

- server-only OpenAI provider;
- strict Structured Outputs;
- turn, input, output, latency and cost bounds;
- fail-closed errors and visible provider provenance;
- synthetic redacted smoke receipt.
- server-only `gpt-4o-mini-transcribe` adapter with MIME/byte/duration/timeout gates;
- transcript review and explicit-submit barrier;
- server-only `gpt-4o-mini-tts` rendering of exact validated probe text;
- AI-generated voice disclosure and text equivalence.

Exit gate: one bounded live text turn and one synthetic voice turn validate without
exposing secrets, retaining audio/transcript content, or claiming replay data as live.

### M5 - Reliability and evaluation

Deliverables:

- unit, contract, integration, browser, accessibility and adversarial tests;
- all text and voice evaluation scenarios;
- five identical replay demos;
- secret and dependency audits.

Exit gate: all hard safety and grounding graders pass.

### M6 - Submission package

Deliverables:

- public repository and judge quickstart;
- screenshots and under-three-minute narrated video;
- Devpost description, category, repository, session ID and testing instructions;
- final evidence receipt.

Exit gate: live Devpost status is Submitted and every public artifact is independently reachable.

## Cut order if time compresses

Cut in this order:

1. decorative animation;
2. playback speed control (retain play/pause/replay/stop);
3. topic selection;
4. export/share;
5. dynamic curriculum generation;
6. optional analytics.

Never cut schema validation, evidence grounding, transcript review/explicit submit,
AI-voice disclosure, visible text equivalence, provenance labels, replay path,
accessibility basics, privacy controls or required submission evidence.
