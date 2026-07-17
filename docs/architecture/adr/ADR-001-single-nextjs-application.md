# ADR-001 — Single Next.js application, no database/auth/services in P0

- **Status:** Accepted
- **Date:** 2026-07-18
- **Context doc:** `docs/blueprint/SISHYAGURU_MASTER_BLUEPRINT_v1.md`

## Context

P0 is one golden learning loop: a learner teaches an Explanation, a server route asks the
model for a cited Mastery Assessment + Misconceptions + one Curious Follow-up, the client
renders a live Concept Mastery Map, and progress persists browser-local. There is one
curated Topic, one user at a time, no data shared between users, and no data that must
outlive the browser.

The only hard secret is the OpenAI key, which must never reach the browser.

## Decision

Ship P0 as a **single Next.js 15+ App Router application in strict TypeScript**. Use one
family of Route Handlers (`/api/session/turn`, `/api/session/summary`) as the entire
backend, executing server-side so the key stays private. Use **no** database,
authentication, session store, queue, background worker, microservice, vector database,
or external calendar.

## Rationale (the ladder)

1. **Does this need to exist?** A DB stores cross-request/cross-user state. P0 has none:
   the server is stateless and progress is single-user and disposable → no DB.
2. **Native platform feature?** A Next.js Route Handler already gives a server boundary
   that keeps the key private. That is exactly and only what we need — no separate API
   service or auth layer.
3. **Auth?** No accounts, no PII, no per-user server data → nothing to authenticate.
4. **Queue/worker?** One synchronous model call per user action, no fan-out, no background
   jobs → nothing to enqueue.
5. **Vector DB / RAG?** The curated Topic is 6–8 constants; no retrieval needed.

Adding any of these would be speculative infrastructure that expands the attack surface,
the ops burden, and the secret count while satisfying nothing in P0.

## Consequences

- **Positive:** One deployment, one build, one trust boundary to secure. Judges run it
  with no infra. Fastest safe path to the golden loop.
- **Negative / accepted limits:** No cross-device progress, no multi-user, no server-side
  history. These are explicitly out of P0 (blueprint §18).
- **Revisit when:** real evidence demands durable/shared state (e.g. multi-device
  progress or classroom features). That is a new ADR, not a P0 change.

## STOP condition

If a requirement forces a database, auth, or multi-service split into P0, halt and
escalate rather than quietly adding it — per the objective's STOP rules.
