# Accessibility Audit

Date: 2026-07-18
Target: WCAG 2.2 AA for the P0 Replay judging path

## Automated evidence

- Axe scan covers WCAG 2 A/AA, 2.1 A/AA and 2.2 AA tags on the loaded Replay shell.
- The scan currently reports zero violations.
- Browser tests verify visible focusable controls, text/icon mastery labels, skip link,
  dynamic chat and mastery status regions, assertive error messages, and no secret leakage.
- A keyboard-only browser scenario activates sample, submit and session-summary controls
  without pointer input and completes all three turns.
- Responsive browser scenarios at 390, 640 and 820 CSS pixels verify that all workspace
  views remain reachable without horizontal document overflow. The 640-pixel scenario is
  the effective layout width of a 1280-pixel desktop at 200% zoom.
- Voice tests verify permission denial fallback, explicit record/stop/discard, elapsed time,
  transcript review before submission and a named native audio control.

## Screen-reader behavior

- New chat messages use a polite live region.
- The mastery map exposes a concise polite count rather than announcing every node.
- Errors use `role="alert"`.
- The per-second recording timer is not a live region; only the final ten-second warning
  is announced politely.
- Every mastery state has visible text and an icon; every spoken probe has identical text.

## Manual release checklist

- Keyboard focus order follows header, workspace navigation and active content controls.
- Focus is not moved when mastery or chat content updates.
- At compact widths, the three view buttons expose `aria-pressed` and the controlled panel.
- At desktop width, all three labelled landmarks remain visible and the compact view switch
  is hidden, avoiding inactive tab semantics.
- Text-only Replay remains complete when microphone and audio playback are unavailable.

## Scope note

Automated checks cannot prove every assistive-technology combination. The release evidence
supports the tested Chromium path and programmatic semantics; it does not claim certification
by an external accessibility auditor.
