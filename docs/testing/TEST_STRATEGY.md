# Test Strategy

## Quality objective

Prove that the reverse-teaching loop is deterministic at its boundaries, honest about provenance, accessible, safe under adversarial learner input and runnable by judges without credentials.

## Test layers

### Static gates

- ESLint passes with no ignored product errors.
- TypeScript strict mode passes without `any` at domain/provider boundaries.
- Production build succeeds with no API key present in replay mode.
- Markdown links and JSON fixtures validate.

### Unit tests

- Mastery state reducer accepts only valid transitions.
- Confidence values remain in the documented range.
- Evidence quotes are exact substrings of learner text.
- Unknown concept IDs are rejected.
- Duplicate evidence is normalized deterministically.
- `insufficient_evidence` cannot mark a concept mastered.
- Clear-session removes browser progress.

### Contract tests

- Live and replay providers implement the same request/response contract.
- Structured output rejects missing provenance, unsupported concept IDs and fabricated quotes.
- Server route maps validation, provider and timeout failures to stable public error codes.
- Live configuration fails closed when the API key is absent.
- Replay selection is explicit and never triggered merely because a live call failed.

### Integration tests

- Curated topic loads with its complete rubric.
- Learner explanation reaches the selected provider through the server route.
- Valid assessment updates conversation and mastery map atomically.
- Invalid assessment changes neither mastery nor conversation state.
- Session summary uses only validated evidence accumulated in the browser session.

### Browser tests

1. Start the curated topic in replay mode.
2. Submit the golden explanation.
3. Verify one curious follow-up question appears.
4. Verify the expected concepts change state.
5. Verify evidence and confidence are visible.
6. Submit a misconception and verify respectful retry guidance.
7. Complete the session and verify the summary.
8. Reload and confirm browser-local continuity.
9. Clear the session and verify removal.
10. Repeat critical layout checks at mobile and desktop widths.

### Accessibility checks

- Keyboard-only completion of the golden path.
- Visible focus and logical focus order.
- Semantic headings, form labels and status announcements.
- Concept state is conveyed by text/icon in addition to color.
- WCAG 2.2 AA contrast targets.
- Reduced-motion mode removes nonessential animation.
- Live mastery changes use a polite announcement and do not steal focus.

### Security and privacy checks

- Secret scan across full Git history before publication.
- Dependency audit with no unreviewed high-severity findings.
- Browser bundle search for API key names and known secret values.
- Prompt-injection, XSS, PII-shaped text, oversized input and malformed provider fixtures.
- Confirm server logs do not include raw learner explanations.

## Golden path acceptance

The golden replay must produce the same validated assessment across five fresh runs, with identical concept transitions, evidence quotes, provenance and session summary.

## Live proof

One bounded synthetic GPT-5.6 request must:

- use the production structured-output schema;
- disable storage when supported;
- contain no real learner or personal data;
- validate successfully or stop as insufficient evidence;
- save a redacted receipt containing model ID, timestamp, schema version, latency, token counts when available and hashes rather than prompt/response content.

## Commands contract

The implementation will expose these stable gates once scaffolding begins:

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm demo:assert
```

No command is claimed available until it exists and passes.

