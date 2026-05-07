# Realtime-states — handoff

> Snapshot for picking up in a new conversation. Captures what's shipped, what's open, where to read context, and what to verify when you have time. Replaces v2 (which described the file split as the biggest remaining mechanical task — that just shipped).

## Current state (as of commit `b504a3f`, plus the post-handoff console-log cleanup commit)

All planned phases of the Coral unification plan are **shipped**. Plus the file-split refactor and the Kyoto→Tube rename.

- **Phase 1–3**: data layer + live page renderer + editor wiring (Coral entries appear in the dropdown, canvas dispatches by shader, save routing per shader).
- **Phase 3D-0 / 3D-1 / 3E / 3F**: editor state-model migration → Coral controls panel → save routing → new-profile shader-choice modal.
- **Phase 4 (A/B/C)**: Coral thinking pulse — schema additions (`thickRadius`, `pulseSpeed`), `useCoralThinkingPulse` hook (lifted from `LoopingBlob`), editor Thick Radius + Pulse Speed sliders.
- **Coral state-prop easing**: `useEasedNumber` / `useEasedColor` hooks for scale / waveIntensity / color3 with `startValue` (intro animation) and `resetKey` (replay) options.
- **`talking.settleSpeed` peak slider** on Coral Talking pill; direction-aware `morphSpeed` via state-machine on previous voice state.
- **Editor controls polish**: clearer directional labels (`Settle Speed (→ idle)`, `Morph Speed (→ talking)`, `Pulse Speed (thin → thick)`), Tube-style color names (Highlight / Mid Tone / Edge), Torus Radius hidden on Talking pill.
- **Editor first-paint flash fix** (`559afde`): parent/child component split, `cascadeReady` gate, skeleton until cascade resolves, lazy `colorFormat` init.
- **File-split refactor** (`5b6f088`): 3253-line page → 3-line shim + six modules under `src/projects/voiceinterface/realtime-states/`. Plan in `tasks/realtime-states-file-split-plan.md` (v7).
- **Kyoto → Tube rename** (`b504a3f`): the editor's shader discriminant was using `'kyoto'` as a synonym for the Tube/`GentleOrbThicken` shader. Renamed `'kyoto'` → `'tube'` everywhere it meant the shader (LoadedOrb / BaselineSnapshot / DropdownRow discriminants, `KYOTO_SEED` → `TUBE_SEED`, all `kyotoX` variables → `tubeX`, comments), while keeping the literal "Kyoto Realtime" profile name and its persisted `id: 'rt-kyoto'`. Zero behavior change — `shader` is never persisted.
- **Cascade-resolved console.log removed** (post-`b504a3f` commit): the temporary first-paint verification log is gone now that 14-scenario manual verification confirmed the fix works for persisted Tube, persisted Coral, and clean-localStorage paths.

## Architecture (post file-split)

The editor now lives at `src/projects/voiceinterface/realtime-states/`. The page at `src/pages/voiceinterface/realtime-states.tsx` is a 2-line re-export shim that preserves the existing route.

Six modules:

- **`types.ts`** (~142 lines) — types only. `BaseSettings`, `BaselineSnapshot`, `ColorFormat`, `ControlTab`, `DropdownRow`, `LinkedProfile`, `LoadedOrb`, `PeakOverrides`, `PeakScope`, `PreviewState`, `RenderValues`, `SavedCoralProfile`, `SavedProfile`. Plus re-exports of `AudioData` and `CoralRealtimeSettings` from sibling projects (single source of truth).
- **`constants.ts`** (~40 lines) — `TUBE_SEED`, `STATES`, `TALKING_GEOMETRY`, `SILENT`, `REALTIME_SEED_NAME`, `COLOR_FORMATS`, `SETTLE_DURATION_MULTIPLIER`.
- **`helpers.ts`** (~299 lines) — pure render math (`baseRender`, `lerp`, `lerpHex`, `lerpRender`, `pickPeak`, `talkingRenderForProfile`), color math (`hexToRgb`, `rgbToHex`, color-space converters, `formatColorValue`, `parseColorValue`, `colorFieldValues`, `colorDraftsToHex`, `clampNumber`), and name/key helpers (`compositeKey`, `normalizeProfileName`).
- **`api.ts`** (~68 lines) — fetch/persist wrappers (`fetchProfiles`, `persistProfiles`, `fetchCoralProfiles`, `persistCoralProfiles`, `fetchProfileNames`). API URL constants are module-private `const`s, NOT exported.
- **`controls.tsx`** (~1218 lines) — leaf UI components (`PeakSliderRow`, `ColorFormatControl`, `EditableColorValue`, `ColorChannelFields`, `ColorPickerButton`, `RealtimeColorRow`, `PeakColorRow`) + the two prop-driven tab panels: **`TubeTabPanel`** (was `renderTabControls`) and **`CoralTabPanel`** (was `renderCoralTabControls`). Each panel takes a `controller` prop bundle (`TubeController` / `CoralController`) so the closures-from-the-old-arrow-function become explicit props.
- **`index.tsx`** (~1746 lines) — the page component. Owns:
  - **`RealtimeStates` (parent, default export)** — data layer (kyoto + coral profile arrays, loaded flags, cascade, `cascadeReady` gate, `colorFormat` lazy-init from localStorage, gallery-names effect, persist-on-change effect). Renders `<RealtimeStatesSkeleton />` until `cascadeReady && activeOrb` resolves; then mounts the editor child with resolved data as props.
  - **`RealtimeStatesEditor` (child, internal — not exported)** — visual + animator + JSX. All UI state, eased hooks, thinking pulse, JS animator effect, slider helpers, action handlers (`selectProfile`, `handleSave`, etc.), the bottom bar JSX, the canvas dispatch. Constructs `tubeController` / `coralController` as plain object literals (no `useMemo` — see plan v7 §13 for the rationale).
  - **`RealtimeStatesSkeleton`** — neutral page bg + empty 328×328 canvas slot.

## Manual verification — completed

All 14 scenarios from `tasks/realtime-states-file-split-plan.md` §11.2 ran live in the browser via the preview MCP (post-rename, post-split, with the console.log still in place at the time of verification):

| Scenario | Result |
| --- | --- |
| First-paint cascade — persisted Tube/Kyoto | ✅ |
| First-paint cascade — persisted Coral | ✅ |
| First-paint cascade — clean localStorage | ✅ falls back to "Kyoto Realtime" |
| Slider edit dirty + Update (Tube path) | ✅ persisted |
| Discard reverts edit | ✅ |
| Save-as-new, two-step shader modal (Tube path) | ✅ |
| Profile rename | ✅ |
| Pin / unpin (active profile) | ✅ |
| State pills + auto-loop | ✅ |
| Tube Replay (no Canvas remount) | ✅ same canvas DOM survived |
| Coral Replay (Canvas remount + intro) | ✅ |
| Audio mode toggle (mic permission denied in headless preview; service logs gracefully) | ✅ wiring verified |
| Color format switch (HEX → HSL) | ✅ values reformatted, localStorage persisted |
| Thinking pulse — both shaders | ✅ pause/resume titles flip |
| Cross-shader switch (both directions) | ✅ |
| In-progress inline edit during animator | ✅ input stayed focused, draft survived ~36 frames |

Zero application errors over the full session. The only console errors were `Error accessing microphone: NotAllowedError: Permission denied` from the headless preview's mic-permission denial, caught and logged gracefully by `audioService` — not an application error.

## Open follow-ups (priority order)

### 1. Live realtime page — extend the Kyoto → Tube rename

The editor's `shader: 'kyoto'` discriminant was renamed to `shader: 'tube'`, but the LIVE realtime page (`src/projects/voiceinterface/components/RealtimeBlob.tsx`, `VoiceRealtimeOpenAI.tsx`) has its **own** internal `shader: 'kyoto'` discriminant (a separate type definition — they don't share `LoadedOrb`). The two are functionally independent, but the codebase is now half-renamed: editor uses `'tube'`, live page uses `'kyoto'`.

A future contributor will read this and ask "why are these different?" — that's the kind of inconsistency to fix proactively.

Surface area (audited via grep):

- `src/projects/voiceinterface/components/RealtimeBlob.tsx:27` — `| { shader: 'kyoto'; profile: LinkedProfile | null };`
- `src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx:32, 69, 166, 184, 199, 265` — multiple uses of `shader: 'kyoto'` and one `fetchVariant('realtime-state', 'kyoto')` (the second arg is the shader label, not the API variant).

Same rename rules as the editor: discriminant `'kyoto'` → `'tube'`. The `'realtime-state'` API variant string stays (matches the JSON file on disk). Probably an hour's work + a manual smoke test on `/voiceinterface/realtime`.

### 2. Per-profile `forceIntroOnSelect` toggle

Plan: `tasks/coral-unification-plan.md` Open Follow-ups section.

Same-shader switches (Kyoto Realtime ↔ Nebularr, Coral A ↔ Coral B) are prop-only by design — no intro replay. User wants an opt-in override per profile. Proposed shape:

- New `forceIntroOnSelect: boolean` field on persisted records (same level as `pinned`), defaulting to `false`.
- When `true`, clicking that profile's thumbnail forces a remount via a counter on the React key.
- UI: small toggle next to the bookmark icon in the editor's profile row.

Schema bump on both `realtime-state-profiles.json` and `realtime-coral-profiles.json`. Out of scope for current commits; revisit when actually wanted.

### 3. Fork-from-clean-A semantics

Plan: `tasks/coral-unification-plan.md` Open Follow-ups section.

When forking a Coral (or Tube) profile that has unsaved edits, the on-disk A profile gets persisted with the unsaved edits as a side effect of `persistCoralProfiles` writing the entire array. Subtle UX issue.

Fix: in `handleSave`'s same-shader-fork branch, build the persist array with the active profile's BASELINE settings instead of its current source-array settings. So on-disk A reverts to last-saved while new B carries the edits.

Small fix when prioritized.

### 4. Throttled-CPU reproduction (manual verification still owed)

DevTools Performance, 4× CPU slowdown + Slow 3G network — confirm no Tube-content flash during the longer skeleton phase. The first-paint fix has been working organically through normal use; this is the one scripted check still owed from the v2.2 plan's verification section.

### 5. R3F WebGL init blank rectangle

Plan: `tasks/first-paint-flash-plan.md` "What this does NOT change" section.

The `<Canvas>` takes ~50ms to initialize WebGL on first mount. With the first-paint fix, the Canvas now mounts AFTER cascadeReady flips, so this blank period is more isolated/visible than before.

To fully mask: render the active orb's saved thumbnail PNG (`/public/thumbnails/realtime-states/<slug>.png`) in the canvas slot during the skeleton phase + the WebGL init period. Fade it out as the orb renders. Polish-only; pure cosmetic.

### 6. Optional: deduplicate the `orbs` useMemo

`src/projects/voiceinterface/realtime-states/index.tsx` defines an `orbs = useMemo<LoadedOrb[]>(...)` in BOTH the parent (~L1641) and the editor child (~L211). Duplication migrated as-is from the pre-split file. Cleaning it up would require the parent to pass `orbs` (or just `tubeProfiles + coralProfiles` as it already does and let the child re-derive — which is what happens today). Not a priority; flagged for a future pass.

## Key plan documents in repo

- **`tasks/realtime-states-file-split-plan.md`** — v7. Six-file split of the editor; mechanical refactor; zero behavior change. Shipped as commit `5b6f088`. Plan kept for reference.
- **`tasks/coral-unification-plan.md`** — v8, 7+ rounds of reviewer feedback. Canonical reference for everything Coral-related: schema, ownership rules, dirty contract, immutability rule, hook conventions, peak helpers, name-collision rules, save routing, Phase 4 thinking pulse spec, all Open Follow-ups.
- **`tasks/first-paint-flash-plan.md`** — v2.2 with 3 rounds of reviewer iteration. Architecture is shipped; plan kept for reference.

## Reviewer-iteration discipline

This work used a tight reviewer-feedback loop. The pattern:

1. User writes a plan in markdown.
2. User passes plan to an external reviewer.
3. Reviewer responds with findings (P1/P2/P3 prioritized).
4. AI evaluates each finding critically — accepts, refines, or pushes back. Pushback is documented in the plan as a footnote so the reviewer can re-read.
5. Plan amended to vNext, committed.
6. Loop until reviewer signs off.

The plan-review skill at `~/.claude/skills/plan-review.skill.md` formalizes this. **Don't skip the loop on big architectural changes** — it caught real bugs in 3D-0 and the first-paint fix that would have shipped broken otherwise. Skip it for small mechanical fixes (one-line bug fixes, label changes, etc.).

## Recent commit timeline (most recent first)

```
<post-handoff>  chore(realtime-states): remove temporary cascade-resolved console.log; refresh handoff
b504a3f         refactor(realtime-states): rename Kyoto → Tube for the shader (not the profile)
5b6f088         refactor(realtime-states): split 3253-line page into six modules
cca82ac         docs: refresh realtime-states handoff after Coral unification + first-paint fix
559afde         editor first-paint flash fix (parent/child split + cascadeReady)
0a1f863         plan: first-paint flash v2.2
419f97e         plan: first-paint flash v2.1
b07a4df         plan: first-paint flash v2
3147980         plan: first-paint flash v1
eef527f         Coral controls labels + settle peak + remove hidden-Torus note
a125790         user tuning — Coral talking.scale=0.75, Kyoto unpinned
d1d53e7         hide Torus Radius slider on Coral Talking pill
bed12f6         user-tuned talking.scale=0.5
d02f7c3         defer live page orb mount until profiles loaded
37f4164         mount eased props at talking values so intro plays talking→base
8997fab         ease scale / waveIntensity / color3 on Coral state changes
b4f8a00         Phase 4C — editor controls for thinking pulse
904ff76         Phase 4B — useCoralThinkingPulse hook + wire into both consumers
b85b057         Phase 4A — schema additions for thinking pulse
```

## Picking up in a new conversation

Open with: "Read `tasks/realtime-states-handoff.md` for context, then [next task]."

Most likely next tasks, by descending value:

- **"Extend the Kyoto → Tube rename to the live realtime page"** → small refactor, ~1 hour. Scope: `src/projects/voiceinterface/components/RealtimeBlob.tsx` + `VoiceRealtimeOpenAI.tsx`. Same rename pattern as the editor. Manual smoke test on `/voiceinterface/realtime` after.
- **"Implement `forceIntroOnSelect`"** → small feature; brief plan, schema bump, UI toggle, wiring.
- **"Implement fork-from-clean-A"** → small fix; no plan needed; just edit `handleSave`.
- **"Mask the WebGL init blank with thumbnails"** → cosmetic polish; needs a small plan.
- **"Run the throttled-CPU repro"** → 15-minute manual check; no code change.
