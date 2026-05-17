# Session handoff — CSW-010 circle-voice port, bug saga, review-skill draft

Cold-start contract. Read this top-to-bottom before continuing. Branch:
**`csw-010-circle-voice-port`** (final-exp). `main` is UNTOUCHED — none of
this is on main.

---

## 0. TL;DR state

- **CSW-010 Circle Voice port (P0→P3): complete & gate-verified.** Standalone
  page, realtime-states arm, live OpenAI-realtime integration all done and
  Playwright/Chrome-verified.
- **A post-port "audio stops on Save" bug: ROOT-CAUSED & FIXED.** Plus an
  eye-ghost fix, delete-for-all-shaders feature, and several data-preservation
  commits.
- **A new review-skill is being designed** (v2 draft just written). This is
  meta/process work, not code.
- **Pending:** user to hard-reload `/voiceinterface/realtime-states` and
  confirm the Save fix in their real browser; then iterate the v2 skill draft
  and optionally write the companion prod-build smoke piece.

---

## 1. CSW-010 port — done

Plan/contract live in **otherexp**: `otherexp/tasks/CSW-010_PLAN_FINAL_EXP_PORT.md`
and `…_HANDOFF_FINAL_EXP_PORT.md`. P0 (the 5 reusable units +
`circleWaveformControls`) was done in otherexp; P1–P3 implemented here.

- **P1** — standalone `/voiceinterface/circle-voice`: 6 units copied
  (`circleWaveformCore`, `circleWaveformControls`, `useCircleVoiceAnimator`,
  `CircleVoiceOrb`, `CircleControlsPanel` verbatim; `circleVoice.ts` adapted —
  R2 no loose seeder, R3 whole-array, R7 extended integrity, §6
  collision-checked 20-name pool), seed JSON shipped, variant registered,
  `api.ts`, page shell with R-11 (no standalone live-pin UI). Gate PASS.
- **P2** — realtime-states arm: `SavedCircleProfile` + circle in
  `LoadedOrb`/`DropdownRow`/`BaselineSnapshot`; radial-parity
  `fetchCircleProfiles`/`persistCircleProfiles`; `CircleEditorPanel`;
  `CircleRealtimeBlob`; full `index.tsx` wiring (BOTH orbs projections per
  seam-audit §6.1; select/pin/rename/update/save/discard branches; dropdown
  rows; side-panel). Gate PASS.
- **P3** — live page: `RealtimeBlob` dispatch + `VoiceRealtimeOpenAI` (circle
  fetch/projection, `CIRCLE_FALLBACK_ORB` with the plan §7 #12 conditional
  insert, live `pinned===true` filter). `OPENAI_API_KEY` is configured in
  `.env.local` (token endpoint returns a valid ephemeral key). Gate PASS.

Verification was Playwright + headless Chrome (SwiftShader for the R3F
shaders; circle itself is pure SVG). Per-phase ≈ commits `245d424 … e0593dc`
(P1), `afd3368/eaef9da/27975fe` (P2), `cc7bf1a/e6bde32` (P3).

## 2. The post-port bug saga (resolved)

Order of events and the final disposition of each:

1. **Eye-ghosts didn't show in realtime-states circle editor** (Max/Min
   Height hover, Wave-Amplitude eye). Cause: `CircleRealtimeBlob` is the
   "live orb" path (no ghosts, §3c); `CircleEditorPanel` owned hover state
   locally, never wired to the orb. **Fixed** (`923a997`): added optional
   `editorGhosts` to `CircleRealtimeBlob` (live page never passes it → §3c
   preserved); lifted ghost state into the editor child. Verified.
2. **Stable-bundle + sync-in-render audioDataRef changes** (`7f7811a` and the
   commit before): legitimate robustness improvements (prevent RAF
   re-subscribe storm; remove a `useEffect`-latch on the shared `SILENT`
   constant). **Kept** — they are correct, but were NOT the root cause.
3. **THE root cause — "audio stops on Save" (circle-only):** proven by the
   user's Fast-Refresh stack trace (captured in `AUDIO-BUG-REPORT.md`).
   `circle-voice/api.ts` did `import seed from
   '../../../../circle-waveform-voicesets.json'` for `CIRCLE_FALLBACK`. That
   put the **live, runtime-written data file into the webpack module graph**.
   Every Save/Update/delete writes that JSON → Next dev watcher → **React
   Fast Refresh rebuild → `RealtimeStatesEditor` remounts → its
   `useEffect(() => () => audioService.stop(), [])` cleanup fires →
   `AudioContext.close()` + mic `track.stop()` → mic dead** while the UI
   still shows "on". Circle-only because only circle imported its data file
   (coral/tube/radial fallbacks are code constants). **FIX (`1d4fdc6`):** new
   `circle-voice/circleFallback.ts` — a self-contained hardcoded
   `CIRCLE_FALLBACK` constant (byte-equivalent to the pristine seed, commit
   `4ce2269`); `api.ts` no longer imports the JSON, re-exports from
   `circleFallback`. Data file is now OUT of the module graph. **Verified**
   via Playwright+fake-mic (POST blocked so data untouched): writing the file
   now causes ZERO `AudioContext.close`/`track.stop`/editor-remount; audio
   keeps reacting. Diagnostic `[CV-DBG]` instrumentation removed (`4cc785e`).
4. **Delete-profile for ALL shaders** (`5a0a452`): user-requested. Trash +
   two-step confirm on tube/coral/radial/circle dropdown rows; per-shader
   `delete*Profile` handlers re-point the active orb to a same-shader
   survivor first (never let `activeOrb` go null → that returns the parent
   Skeleton → editor unmount → `audioService.stop`). Verified.

**Still to confirm by the user:** hard-reload `/voiceinterface/realtime-states`
(**Cmd+Shift+R** — Fast Refresh does NOT cleanly apply hook/ref changes, so a
stale tab still shows the old bug), then repro: circle profile → mic on →
talk → **Save a new profile** → slider → Update. Audio should keep
responding. If it still fails after a hard reload, the headless mechanism-fix
didn't capture their exact condition — re-run the self-contained console
PROBE snippet (see §4) and read the labels; do not declare done on a
"couldn't reproduce."

## 3. DATA-FILE HANDLING RULES (non-negotiable — caused real data loss)

`circle-waveform-voicesets.json` (and `radial-states-profiles.json`,
`realtime-state-profiles.json`, `realtime-coral-profiles.json`) are **live
application databases the app writes at runtime**, not config.

- **NEVER** `git checkout` / `git restore` / `git reset` / overwrite them to
  "restore a pristine seed." This destroyed a user profile ("Cypress") earlier
  in the session. The committed copy is just the shipped seed; the working
  copy is user data.
- Before any test that writes them: `cp` to `/tmp` backup; restore with `cp`,
  **never git**.
- In Playwright tests, **block the POST** (`route.fulfill 200`) so the file is
  never written — verify behavior without touching user data.
- When the commit-reminder hook flags them: **inspect the diff first**
  (profile-name list vs HEAD), confirm additive/user-data, then commit
  **verbatim** with a specific `git add` (never `-A`, never reset). This
  *preserves* user work — the protective pattern (commits `2a1504b`,
  `b151333`, `4bec30b`, `032df30`). Never include Co-Authored-By / Anthropic
  email.
- User profiles currently preserved in git: Default Voice, **Cypress**,
  **Caldera** (circle); **Thorn** (radial); **Cascade** (coral).

## 4. Verification harness notes

- Playwright + Chromium. R3F shaders need
  `--enable-unsafe-swiftshader --use-gl=angle --use-angle=swiftshader
  --ignore-gpu-blocklist`. Mic tests add
  `--use-fake-ui-for-media-stream --use-fake-device-for-media-stream
  --autoplay-policy=no-user-gesture-required` + context
  `permissions:['microphone']`.
- Circle is pure SVG (no WebGL). Pre-seed
  `localStorage['realtime-states-active-orb-key'] =
  'circle-waveform-voiceset:<id>'` so the editor mounts on circle and avoids
  the coral/tube WebGL canvas.
- Dev server: the user's `localhost:3000` (Next dev). It HMRs on src changes.
- Self-contained **console PROBE snippet** (no code dependency; user pastes in
  DevTools, reproduces, reads labels): patches `AudioContext.close` +
  `MediaStreamTrack.stop` (red "CALLED" = teardown) and samples a mid orb
  `<ellipse ry>` → variance → label `AUDIO-REACTING` / `ambient-only` /
  `FROZEN`. The full text + the user's captured run is in
  `AUDIO-BUG-REPORT.md` (committed).
- `tsc --noEmit` is the per-change gate. Never `npm run build` while a dev
  server runs (constraint from the CSW-010 contract).

## 5. The review-skill design work (in progress)

Premise: this bug class (copy-then-diverge → unwritten-invariant break; new
role for a shared artifact; emergent/latent/silent/at-scale failure) is
unguarded between plan-review (pre-code, intent-as-written) and code-review
(whole-diff line correctness). It needs a separate skill.

- **v1 draft:** `DIVERGENCE-SEAM-REVIEW.skill-DRAFT.md` (committed `e4cf966`).
  User feedback: **too narrow** — framed only around copied/adapted code.
- **Reframe (agreed):** the skill is about whether an implemented plan
  *faithfully and soundly* realizes intent — incl. under-specified decisions —
  without invisible failure. Copy-divergence is ONE site type of four:
  **Interpretation / Approach-soundness / Composition-emergence /
  Observability.** Four lenses: **F**idelity, **S**oundness, **E**mergence,
  **O**bservability. Hunting target = the **Mandelbug**, not the Bohrbug.
- **Principles floor** (established practice the skill rests on): Gray
  (Bohrbug/Mandelbug), Reason (Swiss Cheese / latent), Perrow (Normal
  Accidents), Leveson (STAMP/STPA), Avizienis (fault→error→failure), Spolsky
  (Schlemiel / leaky abstractions / accidentally-quadratic), Sutter &
  Alexandrescu (premature pessimization), Brooks (accidental vs essential
  complexity), Hyrum's Law + spec gap, Snowden (Cynefin-complex = why a
  separate skill), Klein/FMEA/FTA (proactive debugging), Kernighan's Law
  (shift-left ROI), Chesterton's Fence.
- **v2 draft just written:** `IMPLEMENTATION-FIDELITY-REVIEW.skill-DRAFT-v2.md`
  (NOT yet committed when this handoff was written — commit it). v1 kept for
  side-by-side. Style deliberately echoes `~/.claude/skills/plan-review.skill.md`
  skeleton (frontmatter/Mindset/When-to-run/central-move/lenses/Process/
  checklist/worked-examples/output/boundaries/self-checks) but is a scalpel:
  starts from intent+decision-surface (not end-to-end), carries a literal
  checklist (it runs post-code), one set of 3 inline worked examples spanning
  the lenses (the CSW-010 JSON-import bug; an accidentally-quadratic loop; a
  silent+co-occurrence audio latch), ~half the length, active lane-defence.

**Next steps for the skill:** (a) commit the v2 draft; (b) user reviews v2 and
iterates (this is the reviewer-feedback loop applied to a skill draft — treat
their notes as hypotheses, five-step pattern); (c) optionally draft the
companion **production-build interaction/load smoke** the skill hands off to
(it *names* dynamic checks; the smoke *runs* them); (d) when stable, install
as a real skill alongside plan-review (`~/.claude/skills/`).

## 6. Process lessons (the post-mortem, for production going forward)

- The bug was an **execution flaw enabled by a plan gap**: the plan said the
  seed "doubles as the in-code source"; I chose a too-clever DRY *import* of a
  runtime-mutable file, against the existing safe pattern (constants).
- Plan-review structurally can't catch this (pre-code; can't simulate
  HMR↔effect-cleanup↔singleton). Generic code-review walks past a JSON import.
- Mitigations: (1) tag runtime-mutable artifacts — never import/reset, treat
  as DB; (2) every "mirror X / adapt Y" is a RISK SITE — state X's invariant,
  prove the adaptation preserves it; (3) test the **prod build** and the
  **interaction at scale**, not units in dev only (this bug was dev-only in
  symptom, prod-stale in reality); (4) re-run the seam audit whenever a change
  gives an existing artifact a **new role** (I added "bundled module" as a
  third role and didn't re-audit).

## 7. Key files

- Port: `src/projects/voiceinterface/circle-voice/` (units + `api.ts` +
  `circleFallback.ts` + `index.tsx`), `src/pages/voiceinterface/circle-voice.tsx`,
  `circle-waveform-voicesets.json` (root, live DB), `src/pages/api/studio-profiles.ts`.
- Realtime-states arm: `src/projects/voiceinterface/realtime-states/{types,api,index,CircleEditorPanel}.ts(x)`,
  `src/projects/voiceinterface/components/{CircleRealtimeBlob,RealtimeBlob,VoiceRealtimeOpenAI}.tsx`.
- Diagnostics/process: `AUDIO-BUG-REPORT.md`,
  `DIVERGENCE-SEAM-REVIEW.skill-DRAFT.md` (v1),
  `IMPLEMENTATION-FIDELITY-REVIEW.skill-DRAFT-v2.md` (v2),
  `tasks/realtime-states-seam-audit.md` (read for P2/P3 context).

## 8. Commit log (this branch, newest first at handoff time)

`e4cf966` v1 skill draft · `032df30` preserve user circle edits · `4cc785e`
remove [CV-DBG] · `1d4fdc6` ROOT-CAUSE FIX (no JSON import) · `4bec30b`
preserve Caldera + report template · `5a0a452` delete-for-all-shaders ·
`b151333` preserve Cypress/Thorn/Cascade · `7f7811a` SILENT-latch fix ·
`923a997` eye-ghost fix · then P3/P2/P1 commits down to `245d424`.
(After this handoff: commit the v2 skill draft + this handoff file.)

## 9. Environment

- macOS; Brave (user) / headless Chromium (verification). Next dev on
  `localhost:3000` (user-owned — do not kill). `OPENAI_API_KEY` in
  `.env.local`. Node/Playwright present in final-exp `node_modules`.
- Global rules: always commit when an action finishes; NEVER Co-Authored-By
  or @anthropic.com in commit messages.
