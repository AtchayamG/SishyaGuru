# ADR-002 — Structured, evidence-bound mastery contract via OpenAI Structured Outputs

- **Status:** Accepted
- **Date:** 2026-07-18
- **Context doc:** `docs/blueprint/SISHYAGURU_MASTER_BLUEPRINT_v1.md` §6–§7

## Context

The signature output is a **cited, uncertainty-aware Mastery Assessment**: per-node
mastery state, zero-or-more Misconceptions, and one Curious Follow-up — where *every*
mastery/misconception judgment must quote the learner's own words, and the system must be
able to say "not enough evidence." Free-form model prose cannot guarantee these
invariants; parsing prose for them is fragile and unsafe.

## Decision

Define the request/response as **strict TypeScript with one runtime schema (zod)** in a
single module. Hand the *same* schema to the OpenAI Responses API as Structured Outputs
through `text.format` with `strict: true` and `store: false`. Enforce, server-side and in
both directions, the evidence rules (blueprint §6.1): valid mastery states require a
**verbatim substring** of the explanation as `evidenceQuote`; missing/unfound quotes,
uncited misconceptions, and unknown node ids reject the complete result. The model must
emit `insufficient_evidence` explicitly when evidence is inadequate.

## Rationale (the ladder)

- **Native/first-party feature over custom parsing:** Structured Outputs already
  guarantees a schema-shaped response — no regex, no prose parsing, no hand-rolled JSON
  repair. Use it.
- **One schema, not two:** the same zod schema validates input, validates output, and is
  the OpenAI schema. Live and Replay literally cannot diverge, and there is no second
  definition to drift.
- **Mechanical evidence check over prompt hope:** "quote the learner's words" is enforced
  by a substring test in code, not merely requested in the prompt. The model cannot
  fabricate evidence that survives validation.
- **Uncertainty as a real value:** `insufficient_evidence` is an enum member and the
  fallback state, making honest "we can't tell" the default failure mode.

## Consequences

- **Positive:** Every judgment shown to a learner is cited and typed. Overclaiming is
  structurally hard. Contract tests can prove the invariants. Formative-not-a-grade is
  encoded, not just promised.
- **Negative / accepted limits:** The substring rule can reject an otherwise *correct*
  result when the model paraphrases instead of quoting; we accept honest under-claiming over
  unverifiable over-claiming. Strict schemas mean prompt/schema changes are coupled — an
  intentional cost for a single source of truth.
- **Revisit when:** we need richer evidence than verbatim substrings (e.g. spans across
  turns). New ADR.
