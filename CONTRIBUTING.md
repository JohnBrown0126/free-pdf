# Contributing

## Running locally

```bash
npm install
npm start          # http://localhost:3000
```

Use `npm run dev` for auto-reload on server changes.

## Tests

```bash
npm test                # unit tests (Vitest)
npm run test:coverage   # with coverage report
npm run test:e2e        # E2E tests (Playwright, requires server running)
npm run test:e2e:ui     # Playwright UI mode
```

The E2E suite starts its own server via `playwright.config.js` — no need to run one separately.

## Code style

- ES modules in `public/js/` (browser), CommonJS in `server.js` and test files
- No build step — the app runs directly from `public/js/` as native ES modules in the browser
- Keep functions small and avoid DOM dependencies in pure logic (see `util.js`)

## Pull requests

- One logical change per PR
- All tests must pass (`npm test && npm run test:e2e`)
- Describe the *why* in the PR description, not just the what
