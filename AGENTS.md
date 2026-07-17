# Repository Instructions

Source of truth: `docs/blueprint/SISHYAGURU_MASTER_BLUEPRINT_v1.md`.

- Build the P0 golden learning loop before optional features.
- Keep the repository root clean. Root Markdown is limited to `AGENTS.md` and `README.md`.
- Store durable documentation under `docs/` using the existing purpose-based folders.
- Use strict TypeScript contracts and OpenAI Responses API Structured Outputs through `text.format` at the model boundary; set `store: false`.
- Never expose API keys to the browser, logs, fixtures, screenshots, or Git.
- Label deterministic replay data as simulated; never present it as a live GPT-5.6 result.
- Treat mastery estimates as learning guidance, not certified grades or diagnoses.
- Treat voice as an optional bounded interface: no background listening, no auto-submit,
  learner-reviewed transcripts only, AI-generated speech disclosure, and full text fallback.
- Require user confirmation before destructive actions or external publication.
- Keep P0 dependency-light: one Next.js application, browser-local progress, no database or authentication until evidence requires them.
- Run the documented lint, typecheck, test, build, and browser smoke gates before calling a milestone complete.
- Keep `docs/project/taskstatus.md`, `docs/project/handover.md`, `docs/project/BUILD_STATUS.json`, and `docs/project/CODEX_RESULT.md` current.

## External-agent routing

- Use `orchestrate-external-coding-agents` for delegated work.
- Route architecture, contracts, and complex reasoning to Claude Fable first; use Opus when Fable is unavailable.
- Route UI/UX and frontend integration to Antigravity.
- Use Hermes for bounded tests, documentation, repair, or fallback when authenticated.
- Give every writable worker a clean worktree and non-overlapping file ownership.
- Codex owns integration, verification, secrets review, commits, and publication.

## Product identity

- Name: SishyaGuru
- Tagline: You teach. AI learns. You master.
- Description: SishyaGuru is a reverse-teaching mastery coach where students teach an AI
  learner by typing or speaking, answer its curious written or spoken questions, and
  watch their understanding grow through a live concept mastery map.
