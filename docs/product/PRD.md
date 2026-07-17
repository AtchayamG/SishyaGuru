# SishyaGuru — Product Requirements (PRD)

> **You teach. AI learns. You master.**
>
> Companion to `docs/blueprint/SISHYAGURU_MASTER_BLUEPRINT_v1.md` (source of truth). This
> PRD frames the *product* requirements; the blueprint governs any conflict.

- **Category:** Education.
- **One-line:** SishyaGuru is a reverse-teaching mastery coach where students teach an AI
  learner, answer its curious questions, and watch their understanding grow through a live
  concept mastery map.
- **Status:** Pre-production. No working product or live GPT-5.6 result is claimed.

---

## 1. Problem

Learners think they understand a topic until they try to explain it. Passive tutoring
tells you answers; it rarely reveals *where your own understanding is thin*. There is no
low-stakes, honest mirror that shows a learner the exact concepts where their explanation
is secure, developing, emerging, or not yet supported by enough evidence — in their
own words, without pretending to grade them.

## 2. Solution

Flip the roles. The learner teaches an **AI Learner** — a curious novice persona — one
curated topic. The AI asks the naive follow-up questions a real beginner would ask. As the
learner explains, SishyaGuru surfaces a **live Concept Mastery Map**: each concept marked
`secure`, `developing`, `emerging`, or `insufficient_evidence`, every judgment **quoting
the learner's own words**. At the end, a formative Session Summary shows strengths, gaps,
and a suggested next explanation — explicitly *guidance, not a grade*.

## 3. Who it's for

- **Primary:** self-directed learners (students, bootcampers, professionals) who want to
  find the gaps in their own understanding before it matters.
- **Secondary:** hackathon judges / demo viewers who must experience the full loop with
  **no credential** via clearly-labelled Replay mode.

## 4. Differentiation from Incident Commander AI

SishyaGuru is an **education** product. Its core object is a learner's explanation of a
concept; its core output is a cited, uncertainty-aware mastery map. It has no incidents,
alerts, on-call, responder coordination, or runbooks and reuses none of Incident Commander
AI's logic, prompts, domain model, or data flow. Substantial difference is a hard
requirement, not a preference.

## 5. P0 requirements (must-have)

| # | Requirement |
| --- | --- |
| P0-1 | The curated **Water Cycle** Topic with **6–8** Concept Nodes rendered as a live Concept Mastery Map. |
| P0-2 | Learner submits an Explanation and receives, via strict Structured Outputs, per-node Mastery Assessments, zero-or-more Misconceptions, and **one** Curious Follow-up probe. |
| P0-3 | Every mastery/misconception judgment quotes the learner's **verbatim** words; enforced server-side. |
| P0-4 | Uncertainty (`insufficient_evidence`) is reachable and shown honestly. |
| P0-5 | A Session Summary quotes the learner's words and carries the formative-not-a-grade disclaimer. |
| P0-6 | Progress persists **browser-local**, user-clearable with confirmation. |
| P0-7 | Clearly-labelled deterministic **Replay** mode runs the whole loop with no credential; never presented as a live result. |
| P0-8 | The OpenAI key is server-only; never in the client bundle, responses, logs, fixtures, or Git. |
| P0-9 | Keyboard-operable; map conveys state without relying on colour alone. |
| P0-10 | One bounded **live GPT-5.6** turn behind the same contract (proof of concept). |

## 6. Non-goals (P0)

Accounts, auth, database, multi-user, server-side history, multiple/user-authored topics,
open-ended chat, queues/workers/microservices, vector DB/RAG, external calendar/email,
sharing/publishing, certified scores or credentials or diagnoses, voice, multiplayer,
mobile-native. See blueprint §18. None of these may be implied as working.

## 7. User stories

- *As a learner*, I teach a concept in my own words and immediately see which parts of my
  explanation were secure and which wobbled, quoted back to me.
- *As a learner*, when I'm vague, the system tells me it doesn't have enough to judge —
  rather than inventing a grade.
- *As a learner*, the AI Learner's curious question pushes me to explain the part I glossed over.
- *As a learner*, I get an honest end-of-session summary that is guidance, not a verdict.
- *As a judge*, I run the full experience with no API key and can tell it's simulated.

## 8. Success metrics (P0, demo-scoped)

- Golden loop completes end-to-end in Replay in under a few seconds per turn with zero cost.
- 100% of shown mastery/misconception judgments carry a verbatim learner quote (enforced, so structurally 100%).
- At least one live GPT-5.6 turn demonstrated behind the identical contract.
- Zero secrets in bundle/logs/Git (verified by test).

## 9. Experience principles

- **Honest over flattering.** Prefer "not enough evidence" to a confident wrong grade.
- **In your own words.** Every judgment is cited to the learner's text.
- **Curious, not authoritative.** The AI plays a novice, never a grader.
- **Formative, never certified.** No score of record, credential, or diagnosis.
- **Accessible by default.** Keyboard + non-colour state + screen-reader announcements.

## 10. Risks

- **Model over-claims mastery** → mitigated by mandatory verbatim-evidence check and
  `insufficient_evidence` fallback (ADR-002).
- **Replay mistaken for live** → mitigated by server-authoritative `providerMode` + per-turn
  Simulated badge (ADR-003).
- **Key leakage** → mitigated by server-only route + bundle/log absence tests (ADR-001, blueprint §12).
- **Scope creep into DB/auth/services** → hard STOP condition; not a P0 change.

## 11. Acceptance & done

See blueprint §16 (acceptance criteria) and §17 (definition of done). This PRD adds no
acceptance criteria beyond those; it must not be read as loosening them.
