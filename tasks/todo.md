# Realtime States Intro Fix

- [x] Seed realtime-states intro from the active profile's talking render.
- [x] Keep GentleOrbThicken on its normal torus geometry and reuse the existing talking-to-idle render animator.
- [x] Add a bottom-bar replay control for the talking-to-idle intro.
- [x] Verify with TypeScript and diff review.

## Review

- `npx tsc --noEmit` passes.
- `curl -i http://localhost:3000/voiceinterface/realtime-states` returns `HTTP/1.1 200 OK`.
- `npm run build` is still blocked by existing Next/ESLint/page-data issues unrelated to this patch.
- Headless screenshot verification is limited by a local WebGL context error in one Playwright run.
