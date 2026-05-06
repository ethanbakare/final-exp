# Realtime-states — handoff

> Snapshot for picking up in a new conversation. Captures what's shipped, what's open, where to read context, and what to verify when you have time. Replaces the previous handoff doc (the older Kyoto-only one from May 2026 — the entire Coral unification effort, Phase 4, and first-paint flash fix all happened after that).

## Current state (as of commit `559afde`)

All planned phases of the Coral unification plan are **shipped**:

- **Phase 1–3**: data layer + live page renderer + editor wiring (Coral entries appear in the dropdown, canvas dispatches by shader, save routing per shader).
- **Phase 3D-0 / 3D-1 / 3E / 3F**: editor state-model migration → Coral controls panel → save routing → new-profile shader-choice modal.
- **Phase 4 (A/B/C)**: Coral thinking pulse — schema additions (`thickRadius`, `pulseSpeed`), `useCoralThinkingPulse` hook (lifted from `LoopingBlob`), editor Thick Radius + Pulse Speed sliders.
- **Coral state-prop easing**: `useEasedNumber` / `useEasedColor` hooks for scale / waveIntensity / color3 with `startValue` (intro animation) and `resetKey` (replay) options.
- **`talking.settleSpeed` peak slider** on Coral Talking pill; direction-aware `morphSpeed` via state-machine on previous voice state.
- **Editor controls polish**: clearer directional labels (`Settle Speed (→ idle)`, `Morph Speed (→ talking)`, `Pulse Speed (thin → thick)`), Tube-style color names (Highlight / Mid Tone / Edge), Torus Radius hidden on Talking pill.
- **Editor first-paint flash fix** (`559afde`): parent/child component split, `cascadeReady` gate, skeleton until cascade resolves, lazy `colorFormat` init.

## Architecture (post first-paint fix)

`src/pages/voiceinterface/realtime-states.tsx` is now structured as:

- **`RealtimeStates` (parent, default export, ~158 lines)** — owns the data layer:
  - `kyotoProfiles` / `coralProfiles` source arrays + loaded flags.
  - `activeOrbKey`, `activeBaseline`, `cascadeReady` state.
  - `externalProfileNames` (gallery name collision detection).
  - `colorFormat` (lazy-init from localStorage).
  - First-load fetch effect, gallery-names effect, cascade-once effect, persist-on-change effect.
  - Renders `<RealtimeStatesSkeleton />` until `cascadeReady && activeOrb` resolves; then mounts `<RealtimeStatesEditor>` with resolved data as props.

- **`RealtimeStatesEditor` (child, ~3000 lines, internal — not exported)** — owns visual + animator + JSX:
  - All UI state (state pill, render, replayCounter, autoLoop, expanded, activeTab, thinkingPaused, audio, dialog).
  - All eased hooks + thinking pulse + JS animator effect.
  - All slider helpers + action handlers (`selectProfile`, `handleSave`, etc.).
  - Lazy useState init for `render` from `activeOrb.settings` (Tube path) — fixes the Nebularr-render-from-KYOTO_SEED bug.
  - Lazy useRef init for `activeTauOverrideRef` from `activeOrb.settings.talking.settleSpeed`.
  - Post-mount `useEffect` watching `activeOrb.id` / `activeOrb.shader` runs `restartIntro` on Kyoto transitions only (first mount handled by lazy init).

- **`RealtimeStatesSkeleton`** — neutral page bg + empty 328×328 canvas slot. No bottom bar (the real one is `position: fixed`, so its absence cannot reflow other content).

## Open follow-ups (priority order)

### 1. File split refactor — biggest remaining mechanical task

Plan: `tasks/coral-unification-plan.md` Open Follow-ups section.

Current file: `src/pages/voiceinterface/realtime-states.tsx` is **3253 lines**. Proposed 4-file split (shader-agnostic naming — no "Kyoto" / "Coral" in module names, since shaders are stable but profile names aren't):

- **`realtime-states/types.ts`** (~250 lines) — type defs (`LoadedOrb`, `BaselineSnapshot`, `SavedProfile`, `SavedCoralProfile`, `DropdownRow`, `RenderValues`, `ControlTab`, `PeakScope`) + small pure helpers (`compositeKey`, `normalizeProfileName`, color utilities).
- **`realtime-states/api.ts`** (~80 lines) — `fetchProfiles`, `persistProfiles`, `fetchCoralProfiles`, `persistCoralProfiles`, `fetchProfileNames`.
- **`realtime-states/controls.tsx`** (~1000 lines) — both tab renderers (Tube + Coral) plus shared UI primitives (`SliderRow`, `PeakSliderRow`, `ColorFormatControl`, etc.).
- **`realtime-states/index.tsx`** (~1500 lines) — page component (parent + child).

Pure refactor; zero behavior change. **Should have its own plan + reviewer pass before starting.** Inline-extracted components and hooks need to come along — care needed because some hooks have closures over component-scoped variables.

### 2. Verification cleanup

- **Remove the temporary `console.log`** in the cascade effect at `realtime-states.tsx` (~line 3217, inside the cascade `useEffect`). It logs `'cascade resolved: target=..., persisted=...'` for first-paint-fix verification. Once you've confirmed the fix works on persisted Coral and persisted Nebularr (throttled-CPU reproduction), delete it.

### 3. Per-profile `forceIntroOnSelect` toggle

Plan: `tasks/coral-unification-plan.md` Open Follow-ups section.

Same-shader switches (Kyoto Realtime ↔ Nebularr, Coral A ↔ Coral B) are prop-only by design — no intro replay. User wants an opt-in override per profile. Proposed shape:

- New `forceIntroOnSelect: boolean` field on persisted records (same level as `pinned`), defaulting to `false`.
- When `true`, clicking that profile's thumbnail forces a remount via a counter on the React key.
- UI: small toggle next to the bookmark icon in the editor's profile row.

Schema bump on both `realtime-state-profiles.json` and `realtime-coral-profiles.json`. Out of scope for current commits; revisit when actually wanted.

### 4. Fork-from-clean-A semantics

Plan: `tasks/coral-unification-plan.md` Open Follow-ups section.

When forking a Coral (or Tube) profile that has unsaved edits, the on-disk A profile gets persisted with the unsaved edits as a side effect of `persistCoralProfiles` writing the entire array. Subtle UX issue.

Fix: in `handleSave`'s same-shader-fork branch, build the persist array with the active profile's BASELINE settings instead of its current source-array settings. So on-disk A reverts to last-saved while new B carries the edits.

Small fix when prioritized.

### 5. R3F WebGL init blank rectangle

Plan: `tasks/first-paint-flash-plan.md` "What this does NOT change" section.

The `<Canvas>` takes ~50ms to initialize WebGL on first mount. With the recent first-paint fix, the Canvas now mounts AFTER cascadeReady flips, so this blank period is more isolated/visible than before.

To fully mask: render the active orb's saved thumbnail PNG (`/public/thumbnails/realtime-states/<slug>.png`) in the canvas slot during the skeleton phase + the WebGL init period. Fade it out as the orb renders. Polish-only; pure cosmetic.

### 6. Manual verification items still owed

From the v2.2 plan's verification section:

- Persist Coral Realtime → reload → confirm neutral skeleton briefly → Coral with intro animation (sphere starting at `talking.scale`, growing to `base.scale`).
- Persist Nebularr → reload → skeleton → Nebularr with Tube `render` correctly seeded from Nebularr's talking values (not `KYOTO_SEED`).
- First-ever visit (clear localStorage) → skeleton → "Kyoto Realtime" fallback.
- Throttled-CPU reproduction (DevTools Performance, 4× CPU slowdown + Slow 3G network) — confirm no Kyoto-content flash during the longer skeleton phase.
- HSL/HSB persisted color format → reload → Colours tab opens at persisted format (no HEX flash).
- Slider edits, Save, Discard, profile switching, Replay, bookmark, rename — all unchanged behaviorally.

User has been verifying organically through normal use; throttled-CPU reproduction is the one scripted check still owed.

## Key plan documents in repo

- **`tasks/coral-unification-plan.md`** — main plan (v8, 7+ rounds of reviewer feedback). Canonical reference for everything Coral-related: schema, ownership rules, dirty contract, immutability rule, hook conventions, peak helpers, name-collision rules, save routing, Phase 4 thinking pulse spec, all Open Follow-ups.
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
559afde  editor first-paint flash fix (parent/child split + cascadeReady)
0a1f863  plan: first-paint flash v2.2
419f97e  plan: first-paint flash v2.1
b07a4df  plan: first-paint flash v2
3147980  plan: first-paint flash v1
eef527f  Coral controls labels + settle peak + remove hidden-Torus note
a125790  user tuning — Coral talking.scale=0.75, Kyoto unpinned
d1d53e7  hide Torus Radius slider on Coral Talking pill
bed12f6  user-tuned talking.scale=0.5
d02f7c3  defer live page orb mount until profiles loaded
37f4164  mount eased props at talking values so intro plays talking→base
8997fab  ease scale / waveIntensity / color3 on Coral state changes
b4f8a00  Phase 4C — editor controls for thinking pulse
904ff76  Phase 4B — useCoralThinkingPulse hook + wire into both consumers
b85b057  Phase 4A — schema additions for thinking pulse
87b9aea  plan: Phase 4 amendments from plan-review pass
2a5a9c9  plan: Phase 4 — Coral thinking pulse spec
```

## Picking up in a new conversation

Open with: "Read `tasks/realtime-states-handoff.md` for context, then [next task]."

Most likely next tasks, by descending value:

- **"Plan and implement the file split refactor"** → start with reading `coral-unification-plan.md` Open Follow-ups, write a focused split plan, get reviewer pass, then implement.
- **"Remove the temporary cascade-resolved console.log"** → tiny cleanup; one-line edit + commit.
- **"Implement `forceIntroOnSelect`"** → small feature; brief plan, schema bump, UI toggle, wiring.
- **"Implement fork-from-clean-A"** → small fix; no plan needed; just edit `handleSave`.
- **"Mask the WebGL init blank with thumbnails"** → cosmetic polish; needs a small plan.
