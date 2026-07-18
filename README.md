# SishyaGuru

> You teach. AI learns. You master.

SishyaGuru is a reverse-teaching mastery coach where students teach an AI learner by
typing or speaking, answer its curious written or spoken questions, and watch their
understanding grow through a live concept mastery map.

## Status

Pre-production architecture and milestones M1-M5 are implemented and verified. The app
includes a deterministic three-turn Replay learning loop, evidence-bound mastery map,
grounded feedback/summary, browser-local progress, and an explicit simulated transcript
review path. Live mode adds server-only GPT-5.6 Structured Outputs, bounded push-to-talk
transcription, and disclosed exact-probe speech; Replay remains the reliable
credential-free judging path.

The public source repository is available at
<https://github.com/AtchayamG/SishyaGuru>. The Replay-only deployment and final Devpost
entry are being finalized; the repository does not claim those links until they are live.

## Local quality checks

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run build
npm run smoke
npm run smoke:live-ui
```

## Quickstart for judges

Requirements: Node.js 22.13+ and npm.

```bash
git clone https://github.com/AtchayamG/SishyaGuru.git
cd SishyaGuru
npm ci
npm run dev
```

Open `http://localhost:3000`. Replay is the default: it requires no API key, labels all
simulated evidence, never requests microphone permission, and provides the complete
three-turn Water Cycle judging path. Choose **Use Sample Explanation**, submit each turn,
inspect the cited mastery changes, then choose **End Session**.

For the browser checks after installing Playwright Chromium once with
`npx playwright install chromium`, run `npm run smoke`.

## Optional Live mode

Copy `.env.example` to `.env.local`, set `OPENAI_API_KEY`, and change
`SISHYAGURU_PROVIDER=live`. Keep all model environment variables at their documented
defaults unless intentionally testing another compatible deployment.

```bash
npm run dev
```

Live mode sends explicitly submitted text to GPT-5.6. Optional push-to-talk records only
after a click, stops at 60 seconds or 5 MB, transcribes in memory, and always returns an
editable candidate before explicit submission. The exact visible follow-up may be rendered
as a disclosed AI-generated voice. Raw audio and unsubmitted transcript candidates are
ephemeral. Explicitly submitted reviewed text is retained in browser-local progress until
**Clear progress**. OpenAI provider processing still applies; do not enter personal or
sensitive information.

The public judge deployment intentionally runs Replay mode and contains no shared OpenAI
credential. Live mode is a local, owner-authorized proof path until a production deployment
adds authenticated users and durable distributed abuse/cost controls.

## Architecture and OpenAI use

- Next.js App Router hosts one responsive application and server-only API routes.
- GPT-5.6 returns strict Structured Outputs; application validators require exact learner
  evidence before mastery changes are accepted.
- `gpt-4o-mini-transcribe` creates candidate-only text and `gpt-4o-mini-tts` speaks only
  the already-validated probe.
- Deterministic Replay fixtures exercise the same domain validator without credentials.
- Progress is versioned browser-local state; there is no account, database, RAG, queue,
  continuous listening, affect inference, or automatic external action.

## Built with Codex

Codex accelerated the architecture, strict contracts, provider adapters, adversarial tests,
responsive UI and submission verification. Every accepted worker diff was independently
reviewed, reproduced through the local gates, and secret-scanned. The implementation uses
GPT-5.6 for evidence-bound mastery reasoning rather than presenting generated prose as a
grade or verified fact.

## Current limitations

- P0 intentionally covers one teacher-authored Water Cycle curriculum with eight concepts.
- Mastery is formative evidence for the current session, not a credential or final grade.
- Replay speech input is visibly simulated; real transcription and speech require Live mode.
- Browser-local progress does not sync across devices and is removed by **Clear progress**.
- Instance-local rate limiting is appropriate for this demo, not a distributed production
  deployment.

## Documentation

- Product source of truth: `docs/blueprint/SISHYAGURU_MASTER_BLUEPRINT_v1.md`
- Product requirements: `docs/product/PRD.md`
- Architecture: `docs/architecture/SYSTEM_ARCHITECTURE.md`
- Voice architecture: `docs/architecture/VOICE_ARCHITECTURE.md`
- UX specification: `docs/product/UX_SPECIFICATION.md`
- Voice UX specification: `docs/product/VOICE_UX_SPECIFICATION.md`
- Threat model: `docs/security/THREAT_MODEL.md`
- Test strategy: `docs/testing/TEST_STRATEGY.md`
- Evaluation plan: `docs/evaluation/EVALUATION_PLAN.md`
- Implementation plan: `docs/project/IMPLEMENTATION_PLAN.md`
- Project status: `docs/project/taskstatus.md`
- Hackathon evidence: `docs/hackathon/rules-and-evidence-matrix.md`

## License

MIT
