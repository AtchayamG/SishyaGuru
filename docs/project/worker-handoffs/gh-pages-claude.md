# GitHub Pages deployment handoff

## Result

Status: complete

## Files changed

- `next.config.ts`: selects a static `/SishyaGuru` export only when
  `GITHUB_PAGES=true`; normal server builds retain security headers.
- `app/page.tsx`: pins the static export to Replay while normal builds remain
  request-time configurable through `connection()` and `getServerEnv()`.
- `scripts/build-pages.mjs`: builds without modifying source files and verifies
  the base path, Replay provider prop and visible simulated-mode label.
- `.github/workflows/deploy-pages.yml`: builds and deploys with official GitHub
  Pages actions and job-scoped minimum permissions.
- `.gitignore`, `package.json`, `README.md`: ignore output, expose the build
  command and document the hosted Replay boundary.

## Verification

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: 43 passed.
- `npm run build`: passed; `/` remains dynamically rendered.
- `npm run build:pages`: passed; `out/index.html` is Replay-only and base-path
  prefixed.
- `npm run smoke`: 12 passed.

## Remaining work

- Enable GitHub Pages with GitHub Actions, deploy, and verify the public URL.

## Risks

- GitHub Pages cannot emit the server response headers configured for the
  normal Next.js server. The public artifact is credential-free and Replay-only.
- Without JavaScript, the static shell remains on its loading message because
  the browser-local session initializes during hydration.

## Notes for integrator

- No secrets are required or included.
- Static output contains no callable server routes and cannot enable Live mode.
