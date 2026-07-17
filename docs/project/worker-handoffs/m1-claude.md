# M1 Application Foundation — Worker Handoff (m1-claude)

Worker: Claude (backend/foundation), Ponytail full discipline.
Branch: `codex/sishyaguru-m1-claude`. No commits made; working tree only.

## DONE

- Next.js 16.2.10 App Router application with strict TypeScript 6 (`strict`,
  `noUncheckedIndexedAccess`), React 19.2. Static build; no runtime data fetching.
- Responsive three-region learning workspace shell (`app/page.tsx` +
  `components/AppShell.tsx`): Concept Mastery Map (left aside), Teaching
  Conversation (center section), Mastery Feedback (right aside), 25/50/25 grid at
  ≥1024px, single-column stack below. Header carries product name, tagline, a
  visible **Pre-production foundation** badge, and a server-authoritative provider
  badge (**Simulated (Replay mode)** by default). Footer states no live model
  calls, no stored data, no assessments — nothing fabricated as a live result.
- Server-only env parsing in `lib/env.ts`: `SISHYAGURU_PROVIDER` defaults to
  `replay` (also on empty string), rejects unknown values, fails closed if `live`
  is set without `OPENAI_API_KEY`, throws if evaluated in a browser, and never
  returns the key. Build and Replay need no credential (verified: build ran with
  no `.env`).
- Browser capability detection for optional `MediaRecorder` push-to-talk via
  `useSyncExternalStore` — presence check only (`window.MediaRecorder`,
  `navigator.mediaDevices.getUserMedia`); `getUserMedia` is never called, so no
  microphone permission prompt on load. Text path stated as the complete path.
- Accessibility: skip link, semantic landmarks (`header`/`main`/`aside`/`section`
  with `aria-label`s), visible 2px `:focus-visible` ring, global
  `prefers-reduced-motion` reduction, WCAG-AA-minded slate palette, all status
  conveyed as text (no color-only state).
- Tooling: ESLint 9 flat config with `eslint-config-next` core-web-vitals +
  typescript presets; Vitest 4 unit tests; Playwright browser smoke on a dev
  server at port 3199.
- Focused foundation tests:
  - `tests/foundation/env.test.ts` (6 unit tests): replay default, empty-string
    default, no key needed for replay, unknown provider rejected, live-without-key
    fails closed, key never present in the returned config.
  - `tests/foundation/smoke.spec.ts` (3 browser tests): three-region shell +
    honest badges render; voice capability text renders while an instrumented
    `getUserMedia` proves no permission request occurs; served HTML contains no
    `OPENAI_API_KEY` marker.

## Commands / results (2026-07-18)

| Command | Result |
| --- | --- |
| `npm install` | OK (Next 16.2.10, React 19.2.7, TS 6.0.3, ESLint 9.39.5, Vitest 4.1.10, Playwright 1.61.1) |
| `npm run lint` | OK — no issues |
| `npm run typecheck` | OK — clean |
| `npm test` | OK — 6/6 passed |
| `npm run build` | OK — static routes `/` and `/_not-found`, no credential required |
| `npm run smoke` | OK — 3/3 passed (Chromium, auto dev server on port 3199) |

## BLOCKED

- Nothing.

## RISK

- Tablet breakpoint (768–1023px) stacks to a single column instead of the UX
  spec's two-panel + off-canvas concept-map drawer; the drawer needs focus-trap
  behavior that belongs with the real interactive map (M3). Mobile tabbed
  navigation likewise deferred to M3 with the real content.
- `vitest.config.mts` (not `.ts`): package is CJS-typed, and Vitest 4's config
  loader requires ESM; `.mts` is the standard fix, no behavior difference.
- `next build` rewrote `tsconfig.json` (`jsx: react-jsx`, extra `.next` type
  includes) — Next-mandated, kept as-is.
- Playwright smoke runs against `next dev`; production-server smoke can be added
  when there is a golden loop worth smoking (M3).
- npm reported 2 moderate advisories in transitive dev tooling; not addressed to
  avoid forced major bumps in a foundation pass — revisit at the M5 dependency
  audit.

## NEXT

- M2: `lib/contract.ts` (zod + TS contract), curated water-cycle topic constants,
  mastery reducer/evidence validator, replay fixtures, contract tests.
- M3: interactive teaching loop, real concept map (plus tablet drawer / mobile
  tabs), session state machine, browser-local progress.
- Wire the provider badge to real turn responses (`providerMode` echo) once
  `/api/session/turn` exists (M2/M3 per architecture doc).
