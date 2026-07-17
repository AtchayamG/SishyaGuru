# ADR-003 — Explicit Live and Replay providers behind one interface

- **Status:** Accepted
- **Date:** 2026-07-18
- **Context doc:** `docs/blueprint/SISHYAGURU_MASTER_BLUEPRINT_v1.md` §8

## Context

The product must (a) demonstrate a real, bounded live GPT-5.6 result and (b) let a judge
with **no OpenAI credential** experience the entire golden loop deterministically, for
offline demos and for tests that must spend nothing. Both paths must produce output the
UI treats identically — but the Replay path must **never** be mistaken for or presented
as a live result.

## Decision

Define one `Provider` interface with two implementations selected from server env
(`SISHYAGURU_PROVIDER`, default `replay`):

- **Live** — calls OpenAI with the configured model using Structured Outputs (ADR-002).
- **Replay** — returns hand-authored fixtures keyed by `(topicId, turnIndex)`.

Both pass the **identical** validation (blueprint §6.1). The active mode is
server-authoritative and returned to the client as `providerMode`. The UI renders a
**"Simulated (Replay mode)"** badge on every Replay turn.

### Replay truthfulness rules (binding)

1. Replay is clearly labelled *Simulated* on every turn.
2. Replay output is never logged, screenshotted, or submitted as a live GPT-5.6 result.
3. Mode is chosen from server env only — a client cannot force Live or spend credits.
4. Fixtures are pedagogically honest (they include developing and insufficient-evidence turns),
   not cherry-picked to flatter.
5. Replay makes no OpenAI transcription or speech call. Any sample transcript or probe
   audio is versioned, deterministic and labelled simulated.

## Rationale (the ladder)

- **Two implementations justify the one interface** — this is the exact case where an
  abstraction earns its keep (Live *and* Replay both exist and ship), not a speculative
  seam for a single implementation.
- **Env-selected, not client-selected:** the smallest safe switch. It keeps credential
  spend and truthfulness under server control with no extra config surface.
- **Same validation for both:** reuses the ADR-002 schema; no parallel Replay contract to
  drift or to lie.

## Consequences

- **Positive:** Credential-free judging, zero-cost tests, honest labelling, and a single
  contract both providers satisfy. The live proof and the deterministic demo cost one
  interface.
- **Negative / accepted limits:** Fixtures must be maintained alongside the schema; a
  schema change requires refreshing fixtures (caught by the parity test). Replay realism
  is bounded by fixture authorship.
- **Revisit when:** more topics or dynamic replay recording are needed. New ADR.
