# ADR-004 — Browser-local progress (localStorage), no server persistence

- **Status:** Accepted
- **Date:** 2026-07-18
- **Context doc:** `docs/blueprint/SISHYAGURU_MASTER_BLUEPRINT_v1.md` §10

## Context

A learner should see their prior mastery when they return, so the Concept Mastery Map is
not blank each visit. But P0 has no accounts, solicits no PII, has no cross-user data, and no
requirement for cross-device continuity. Progress is small: a `Record<nodeId,
MasteryState>` plus a timestamp and topicId.

## Decision

Persist Progress **only in the browser** using `localStorage` under a single versioned key
`sishyaguru:progress:v1`. The server never stores, receives-for-storage, or persists
progress or explanations. The learner owns their data and can clear it (with an explicit
confirmation, per blueprint §9). Returning users see prior mastery clearly dated as
formative history.

Raw recordings, generated probe audio and microphone permission state are never stored
in Progress. A learner-confirmed transcript becomes ordinary explanation text only after
explicit submission and follows the same bounded browser-session rules.

## Rationale (the ladder)

- **Native platform feature over a service:** `localStorage` is exactly a per-user,
  per-origin key/value store — precisely the shape of Progress. No DB, no auth, no sync
  service needed.
- **Least data, least risk:** keeping progress off the server means no server-side user
  data to secure, leak, or regulate. The privacy stance (blueprint §10) falls out for free.
- **Versioned key:** a `:v1` suffix lets a future schema change migrate or discard old
  data without a migration framework.

## Consequences

- **Positive:** Zero-infra persistence, strong privacy default, user-owned and
  user-clearable, no accounts.
- **Negative / accepted limits:** No cross-device or cross-browser continuity; clearing
  browser storage erases progress. Both are acceptable for P0 and out of scope
  (blueprint §18).
- **Failure handling:** if `localStorage` is unavailable (private mode / disabled),
  progress degrades to in-memory for the session — the app still runs, no crash, no block.
- **Revisit when:** cross-device progress or classroom/shared features are actually
  required. That introduces accounts + a datastore and is a new ADR, not a P0 tweak.
