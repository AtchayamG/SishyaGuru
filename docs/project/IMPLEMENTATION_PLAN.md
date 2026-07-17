# Implementation Plan

## Scope rule

Finish the smallest complete learning loop before adding breadth. P0 ships one excellent topic and one honest provider boundary; it does not ship a general learning-management system.

## Milestones

### M0 - Pre-production

Deliverables:

- master blueprint and product requirements;
- system architecture and ADRs;
- UX, accessibility and content specifications;
- threat model, test strategy and evaluation suite design;
- rules/evidence matrix and submission plan.

Exit gate: documents agree on the same P0 boundaries, contracts and truthfulness rules.

### M1 - Application foundation

Deliverables:

- Next.js App Router application with strict TypeScript;
- minimal lint, typecheck, unit test, build and browser-test commands;
- server-only configuration validation;
- professional base theme and responsive shell.

Exit gate: credential-free build and static quality gates pass.

### M2 - Domain contracts and curated topic

Deliverables:

- water-cycle concept rubric;
- assessment request/response schemas;
- mastery reducer and evidence validator;
- deterministic replay fixtures.

Exit gate: invalid concept IDs, fabricated quotes and unsupported mastery transitions are rejected.

### M3 - Reverse-teaching loop

Deliverables:

- teaching conversation;
- one-question curious learner response;
- concept mastery map;
- evidence/misconception panel;
- browser-local session state and reset.

Exit gate: replay golden path completes by keyboard on desktop and mobile layouts.

### M4 - Live GPT-5.6 boundary

Deliverables:

- server-only OpenAI provider;
- strict Structured Outputs;
- turn, input, output, latency and cost bounds;
- fail-closed errors and visible provider provenance;
- synthetic redacted smoke receipt.

Exit gate: one bounded live call validates without exposing secrets or claiming replay data as live.

### M5 - Reliability and evaluation

Deliverables:

- unit, contract, integration, browser, accessibility and adversarial tests;
- all ten evaluation scenarios;
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
2. topic selection;
3. export/share;
4. dynamic curriculum generation;
5. optional analytics.

Never cut schema validation, evidence grounding, provenance labels, replay path, accessibility basics, privacy controls or required submission evidence.

