# Backlog

Non-urgent work captured so it doesn't get lost. Not prioritised — review before picking up.

---

## Tooling / infra

### Fix silent ESLint crash in Vercel builds
**Status:** deferred — site deploys fine, but lint is effectively disabled in CI.

**What's wrong:**
- Every Vercel build logs `⨯ ESLint: Converting circular structure to JSON` during the "Linting and checking validity of types" step.
- This is an ESLint *internal* crash (FlatCompat + eslint-plugin-react cycle under Next 15), not a rule violation. Next doesn't fail the build on internal errors, so deploys pass with lint never actually running.
- Net effect: no lint rules are enforced on new code. The `⨯` in logs looks scary but is misleading.

**Root causes (ours, not upstream):**
1. Two ESLint configs coexist — `.eslintrc.json` (legacy, has `no-unused-vars` underscore rule) and `eslint.config.mjs` (flat, extends `next/core-web-vitals` + `next/typescript`). Next 15 picks the flat config and silently ignores the legacy one — so the underscore rule has been dead for a while.
2. `package.json` pins `eslint` and `eslint-config-next` to `"latest"`. Builds aren't reproducible.
3. `next.config.mjs` has a `dirs: [...]` allowlist restricting lint to 6 legacy project dirs. Anything newer (`blob-studio`, `new-home`, `trace`, `voiceinterface`) wouldn't be linted even if ESLint worked.
4. No dedicated lint step in CI — we rely on `next build`'s lenient handling, which hides crashes.

**Recommended approach when we come back to it:**
1. Consolidate to a single flat config (`eslint.config.mjs`), port the `no-unused-vars` rule over, delete `.eslintrc.json`.
2. Pin exact versions of `eslint` and `eslint-config-next` (not `"latest"`).
3. Resolve the circular bug either by (a) pinning to a known-good `eslint-plugin-react` version, or (b) dropping `next/typescript` from extends and keeping `next/core-web-vitals` only.
4. Add a dedicated `npm run lint` step in a GitHub Action so ESLint crashes and rule violations fail CI.
5. Adopt **change-based linting** in CI (`git diff --name-only origin/main...HEAD | grep -E '\.(ts|tsx)$' | xargs eslint`) so new code gets linted but legacy dirs stay grandfathered until touched. Drop the `dirs` allowlist in `next.config.mjs` once change-based linting is in place.

**Why defer:** none of this blocks shipping. Doing it now would either surface hundreds of legacy lint errors (time sink) or require a baseline ratchet tool to manage them. Change-based CI is the cleanest escape hatch and avoids both problems — but it's still meaningful setup work.

---

## Product work deferred from prior sessions

### Cancel button during Trace processing
Production risk if the Gemini API hangs — user has no way to bail out. Needed before Trace is truly production-ready.

### ClipStream simulation
Auto-play recording → processing → results loop for the `/demo-showcase` page. Not built.

### Voice Interface simulation
Design undecided. Separate from the Blob Studio page — this would be for the consolidated demo showcase.

### Case study URLs
All brand-carousel links on the home page point to `#` placeholders. Need real portfolio pages or external links.

### Port linear waveform from `otherexp` → `final-exp`
Linear waveform playground exists in `otherexp` but not in `final-exp`. Could ship as a gallery page similar to the radial waveform one.

### Consolidated `/demos` page
Single full-screen demo navigator (Figma "Dictation app" file). Nav with project dropdown + counter + up/down arrows, auto-playing simulation per demo, "Try Demo" + "View Case Study" CTAs. Would use simulation-mode versions of each project.

### Simulations for other projects
Only AI Confidence Tracker has one. Need similar for Trace (partially done), Clipstream, Voice UI, Ollama.

### Navigation bar for new home page
Old home page had `MainNavBar`. New home page doesn't. Either adapt or build fresh from Figma.

---

## Cleanup

### Old `/old-home` page
Preserved at `/old-home` since the April refactor. Can be removed once new home is confirmed stable.

### Old voice-interface JPG/PNG images
`wt1.jpg`, `wt6.png`, `wt7.jpeg` in the public folder are no longer referenced (replaced by WebP versions). Can be deleted.

### `@ts-nocheck` files
Three files have `@ts-nocheck` applied for Vercel build. Not urgent, but worth fixing when touching them:
- `src/pages/clipperstream/showcase/ClipOfflineScreen.tsx`
- `src/pages/trace/showcase/tracemorphing.tsx`
- `src/projects/home/components/Goal_Body.tsx`
