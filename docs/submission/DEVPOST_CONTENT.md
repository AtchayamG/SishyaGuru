# Devpost Content Pack

Use this as a factual drafting pack for the OpenAI Build Week **Education** entry. The
submitter must review and personalize the public narrative before submission, as Devpost
explicitly asks builders not to submit AI-written project descriptions verbatim. Recheck
all links and final test counts immediately before submission. Do not describe the Replay
experience as live AI output.

## Project name

SishyaGuru

## Tagline

You teach. AI learns. You master.

## Short description

SishyaGuru is a reverse-teaching mastery coach. Students teach a curious AI learner by
voice or text, answer focused questions, and see a concept map update only when their own
words provide evidence of understanding.

## Inspiration

It is easy to feel that we understand a topic while reading or listening to an
explanation. The gap becomes visible when we try to teach it. Most AI tutors respond by
explaining more; we wanted an AI learning experience that makes the student do the
explaining.

SishyaGuru applies the learning-by-teaching idea in a low-stakes way. The AI plays a
curious novice, asks the question a beginner would ask next, and reflects the learner's
own evidence back to them. The result is formative guidance, not a grade, credential, or
permanent judgment.

## What it does

The learner teaches a curated Water Cycle lesson by typing or, in optional Live mode,
using bounded push-to-talk. A voice transcript is always shown for review and editing and
is never submitted automatically. After explicit submission, SishyaGuru:

- assesses eight concept nodes using the learner's explanation;
- accepts a mastery or misconception claim only when its evidence is an exact quote from
  that explanation;
- shows `secure`, `developing`, `emerging`, `insufficient evidence`, or `unassessed`
  states in a map that does not rely on colour alone;
- asks one focused follow-up question as visible text and, when requested in Live mode,
  as disclosed AI-generated speech; and
- produces a grounded session summary of demonstrated strengths and gaps to revisit.

Progress is stored only in the browser and can be cleared by the learner. The complete
three-turn Replay path is deterministic, labelled **Simulated**, and requires no account,
microphone, API key, or network model call. Live mode is an optional local proof path that
uses the project owner's OpenAI key; it is not the credential-free judging path.

## How we built it

SishyaGuru is one strict-TypeScript Next.js App Router application. The browser owns the
learning session and versioned local progress. Narrow server routes validate turn,
summary, and audio requests before they reach either of two providers:

- **Replay** returns versioned fixtures through the same contracts and validators as
  Live mode. It is the default, reproducible judge experience and makes no OpenAI audio
  calls.
- **Live** sends explicitly submitted text to GPT-5.6 using strict Structured Outputs
  with provider storage disabled for assessment requests. Application-level validators
  then check topic IDs, mastery transitions, and verbatim evidence before accepting the
  response.

Optional voice input uses `MediaRecorder`, a 60-second/5-MB boundary, container-signature
and server-derived-duration checks, and `gpt-4o-mini-transcribe`. The transcript is only a
candidate until the learner reviews and submits it. `gpt-4o-mini-tts` can speak only the
already-validated follow-up question, while identical text remains visible. Raw audio and
unsubmitted transcript candidates are ephemeral.

We deliberately avoided accounts, a database, RAG, continuous listening, Realtime voice,
queues, and microservices. A small stateless application made the evidence chain easier
for judges to inspect and safer for learners to understand.

## Challenges we ran into

The hardest challenge was preventing fluent model output from becoming an unsupported
mastery claim. Structured Outputs guarantee shape, but not grounding, so we added a
second fail-closed validation layer: every cited evidence fragment must be an exact
substring of the learner's submitted explanation, every concept ID must belong to the
curated topic, and invalid results leave the prior map unchanged.

Voice added a different trust problem. Browser WebM recordings can omit container
duration metadata. We implemented a bounded EBML/WebM duration parser so authentic Chrome
`MediaRecorder` output could be checked server-side without trusting client-reported
duration. We also kept transcription behind an explicit review gate so speech cannot
silently change learning state.

Finally, we had to make a deterministic demo useful without presenting fixtures as live
AI. Server-authoritative provider labels, matching provider contracts, and visible
**Simulated** provenance keep Replay honest while still giving judges a dependable path.

## Accomplishments that we're proud of

- A complete three-turn, credential-free reverse-teaching workflow covering eight Water
  Cycle concepts.
- Evidence-bound mastery and misconception claims that fail closed when quotes or topic
  IDs are invalid.
- A real owner-key proof through the application routes for GPT-5.6 assessment and the
  bounded speech-to-transcript-to-review-to-assessment-to-speech flow.
- Accessible keyboard operation, non-colour mastery states, concise live-region updates,
  and zero Axe WCAG A/AA violations in the tested Replay shell.
- A verified release gate comprising lint, strict typecheck, 43 unit/domain tests, a
  production build, 12 Replay browser scenarios, and 7 Live browser scenarios.
- A public MIT-licensed repository with a clean-clone quickstart and a Replay default
  that contains no shared OpenAI credential.

## What we learned

Schema-conformant AI output is only the beginning of trustworthy educational feedback.
The application must independently verify what the model says it observed. Exact learner
quotes make feedback inspectable and make uncertainty an honest outcome rather than an
error to hide.

We also learned that voice works best here as an input method, not as a separate learning
engine. Turning speech into editable learner-owned text preserves accessibility,
intentional submission, and the same evidence contract as typing. A deterministic Replay
provider can improve reliability without weakening truthfulness when provenance is
explicit and both providers pass the same validators.

## What's next

First, we would validate the reverse-teaching loop with learners and educators before
expanding scope. With evidence from those sessions, the next steps would be additional
teacher-authored topic packs, educator review tools for curriculum content, and clearer
longitudinal views of learner-owned progress. A production Live service would also need
authenticated users and durable distributed abuse and cost controls before exposing a
shared OpenAI credential.

We would keep the same core rule: SishyaGuru may suggest what to revisit, but it should
never turn a short AI-mediated session into a certified score or diagnosis.

## Judge testing instructions

Requirements: Node.js 22.13 or newer and npm.

```bash
git clone https://github.com/AtchayamG/SishyaGuru.git
cd SishyaGuru
npm ci
npm run dev
```

1. Open `http://localhost:3000`.
2. Confirm the provider badge says **Replay / Simulated**.
3. Select **Use Sample Explanation**, submit the turn, and inspect the quoted evidence,
   feedback, follow-up question, and changed concept nodes.
4. Repeat for all three turns, including the misconception/retry path.
5. Select **End Session** and inspect the grounded strengths and gaps.
6. Optionally verify persistence with a refresh and remove it with **Clear progress**.

No API key or microphone permission is needed for this golden path. Maintainers can test
the separate Live path locally by copying `.env.example` to `.env.local`, setting their
own `OPENAI_API_KEY`, and choosing `SISHYAGURU_PROVIDER=live`; do not enter personal or
sensitive information. The public judge experience remains Replay-only until a production
service has authenticated users and distributed abuse/cost controls.

## Technologies used

Next.js 16, React 19, TypeScript, OpenAI Responses API, GPT-5.6 Structured Outputs,
`gpt-4o-mini-transcribe`, `gpt-4o-mini-tts`, Zod, MediaRecorder, WebM/EBML, browser
localStorage, Vitest, Playwright, Axe, ESLint, GitHub, and Codex.

## OpenAI and Codex usage disclosure

GPT-5.6 is the Live mastery-reasoning provider. It returns strict structured assessments,
misconceptions, and one curious follow-up; SishyaGuru independently validates all output
against the curated topic and exact learner evidence before it can update mastery.
`gpt-4o-mini-transcribe` produces reviewable candidate text, and
`gpt-4o-mini-tts` renders only an already-validated visible question. The deterministic
Replay provider is clearly labelled and does not call OpenAI models.

Codex served as the product architect and integration owner: it helped shape the product
and safety constraints, implement typed contracts and provider boundaries, harden the
voice and responsive interaction paths, generate adversarial tests, reproduce release
gates, and prepare truthful submission evidence. Bounded work was delegated to coding
agents, but every accepted change was reviewed and reverified through the repository's
local gates. No AI-generated fixture or simulated result is presented as a live model
response.

## Submission-time placeholders

- Public app URL: **pending Replay-only deployment**
- Public YouTube URL: **pending publication and logged-out playback verification**
- SishyaGuru Codex `/feedback` session ID: `019f5282-7c6f-76d1-888e-ffb0c25de3c8`
  (the current primary build thread; do not invent a separate ID)
- Devpost status: **draft until the form reports Submitted**
