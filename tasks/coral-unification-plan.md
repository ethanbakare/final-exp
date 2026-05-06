# Coral Unification Plan (v8)

> v8 round 7 (current head) tightens the dirty/baseline contract and the
> bridge-state contract — the two places the reviewer flagged as most
> likely to produce subtle bugs during 3D-0 implementation. Plan-only
> changes; no code patch this round. Specific edits:
> - **F1 (P1).** `activeBaseline` is no longer typed as `LoadedOrb |
>   null`. New `BaselineSnapshot` shape: `{ key, shader, settings }` —
>   nothing else. Dirty comparator is now spelled out as code, not
>   prose, and explicitly excludes `name` / `pinned` / `lastModified` /
>   `sourceVariant`. Bookmark toggle, rename, and Save's
>   `lastModified` bump cannot mark the editor dirty by construction.
> - **F2 (P1).** Bridge-state migration gains a canonical-truth rule:
>   from step 1 onward, `activeOrbKey` + source arrays are the single
>   source of truth; old vars are demoted to read-compat mirrors; no
>   migrated code calls the old setters; bridge effects run in one
>   direction only. 3D-0 is NOT considered done until the bridge is
>   gone — verification step grep-checks for residual references.
> - **F3 (P2).** Editor default-selection cascade keeps "Kyoto
>   Realtime" first until 3D-1 lands Coral controls. Without this,
>   3D-0 alone would change the fresh-load editor experience from
>   "open Tube + tunable" to "open Coral + view-only," which is a
>   regression in flight.
> - **F4 (P2).** Immutability rule for slider setters: every helper
>   does `setKyotoProfiles(arr.map(p => p.id === activeId ? { ...p,
>   settings: { ...p.settings, base: { ...p.settings.base, scale: v
>   }}} : p))` style updates — no nested mutation. Baseline captured
>   via `structuredClone` at **selection and successful Save only**;
>   **Discard runs the inverse** (clones `baseline.settings` back into
>   active, leaves baseline untouched). Without immutable updates,
>   `activeOrb.settings` and `baseline.settings` can share nested
>   references and dirty silently returns false after edits.
> - **F5 (P3).** Round-6 commit hash (`c5a2d00`) filled in; new row
>   for round 7.
>
> v7 → v8 round 5 changelog (kept for reference):
>
> v8 incorporates a fifth round of human-reviewer feedback on v7. Three of
> the nine findings (F1, F3, F6) describe contradictions between what the
> plan says and what's actually shipped — they require a small code patch
> alongside the plan amendment. The remaining six are plan-only edits that
> re-shape the "Next in line" section before Phase 3D implementation
> starts. v1–v7 changelogs kept below. v8 changes:
> - **F1 — Same-shader Coral switching contract corrected.** v7's plan
>   said "no intro on same-shader switch," but the shipped Phase-3c code
>   bumps `replayCounter` on every Coral selection AND uses
>   `coral-${activeCoralId}-${replayCounter}` as the canvas key, which
>   remounts (and replays the intro) every time the user picks a
>   different Coral profile. Plan and code now reconciled to the original
>   intent: `selectCoralProfile` does NOT bump `replayCounter`; the
>   canvas key is `coral-${replayCounter}` only. Replay button is the
>   sole same-shader remount path. (Code patch ships with v8.)
> - **F2 — Phase 3D scope expanded with explicit 3D-0 state-model
>   migration step.** The risky bulk of "Coral controls panel" is not
>   adding sliders, it's migrating the editor's split state
>   (`activeId`/`profile`/`activeBaseline` for Kyoto + `activeShader`/
>   `activeCoralId`/`coralProfiles` for Coral) into a single
>   `activeOrb`/`activeOrbKey`/shader-aware-baseline model. Now broken
>   out as **Phase 3D-0** before any UI work. **3D-1** (controls + UI
>   gates), **3E** (save routing), **3F** (new-profile modal + name
>   validation in new-profile path) follow. v8 phase numbering uses
>   uppercase `3D-0 / 3D-1 / 3E / 3F` consistently — the lowercase
>   `3a / 3b / 3c` numbering in the Shipped table is kept as historical
>   record (those rows reference real past commits and are not edited
>   retroactively).
> - **F3 — Cross-source name-collision fix promoted out of 3G.** Coral
>   rename already persists to the Coral file via Phase 3b; today
>   `profileNameExists` checks Tube + gallery names but not Coral, so
>   two Coral entries can be renamed into the same name right now. Fix
>   shipped as part of v8's code patch (no longer waiting on 3G). 3G is
>   removed; new-profile validation is folded into 3F.
> - **F4 — Slider-table row for `morphSpeed` rewritten.** Old row said
>   "at 0, `delta / 0 → Infinity` and the existing animator handles it
>   gracefully" — wrong, this contradicts the floor rule stated three
>   sections above. New row: UI may display 0.00s as "instant," but
>   both live (`CoralRealtimeBlob`) and editor canvas wrappers must
>   floor to `Math.max(0.001, ...)` before passing to `CoralStoneMorph`.
>   Raw 0 is never safe.
> - **F5 — 3D-1 now lists the exact `activeShader === 'kyoto'` gates
>   that must flip to shader-aware renderers** (single-tab popover,
>   expanded drawer, tab buttons, Update/Discard). The bottom-bar
>   3-swatch shortcut row is intentionally NOT in this list — it stays
>   Tube-only (see F8). Without this enumeration, Coral controls could
>   be implemented and still be unreachable from the UI.
> - **F6 — Implementation-status row corrected.** v7's row said the
>   interim guard "replaces the placeholder text" — the code actually
>   *renders* the placeholder text. Wording fixed to "shows placeholder
>   text 'Coral tuning controls coming next.'"
> - **F7 — Coral Size editing semantics pinned.** When the Talking pill
>   is active, the visible Scale control edits `talking.scale` (Peak),
>   not `base.scale`. To edit `base.scale`, the user must select the
>   Idle, Listening, or Thinking pill. Stated explicitly to match
>   Tube's existing Rest/Peak pattern.
> - **F8 — Coral has no bottom-bar swatches in 3D.** The bottom-bar
>   swatch shortcut row in the editor is Tube-only and stays gated on
>   `activeShader === 'kyoto'`. (Tube has 3 swatches; Coral has none.)
> - **F9 — Speed-slider label difference repeated inside the range
>   row.** Coral shows literal seconds with no "≈ X.XXs visible" hint;
>   Tube keeps the tau-derived hint. Stated once at the top of the
>   slider table and repeated in the `morphSpeed` row to make it
>   copy-pasteable.
>
> v6 → v7 changelog (kept for reference):
>
> v7 reflected what's actually shipped vs what's next-in-line after the first
> implementation pass. v7 changes:
> - Implementation status table added (top of "Implementation status" section).
> - Phase 3 split into 3a/3b/3c (shipped) and 3d/3e/3f/3g (next in line).
> - Interim editor guard: when a Coral profile is active, the Tube-shaped
>   tabs / expanded panel / Update / Discard buttons are hidden. The user
>   can Bookmark, Rename, Replay, switch profiles, and use state pills.
>   Shows placeholder text "Coral tuning controls coming next".
> - The "Note on plan-review limits" gains a fourth round-of-review entry
>   capturing the user's UX-precision findings (active-shader glyph in
>   trigger, standalone bookmark, pinned opt-in vs auto-include).
>
> v5 → v6 changelog (kept for reference):

> v6 incorporates a fourth round of human-reviewer feedback on v5. Mostly editorial precision after v5's edits introduced a fresh contradiction; one math typo corrected; one unchanged-contract hardened. v1–v5 changelogs kept below; v6 changes:
> - **Stale "as the React key" sentence fixed.** v5 added the same-shader-no-remount rule but didn't propagate to the earlier `activeOrbKey` description, leaving a direct contradiction. Now consistent: `activeOrbKey` is logical identity (selection/localStorage/lookup), NOT a React reconciliation key on the renderer.
> - **Math typo fixed.** v5 said "with floor 0.001, one frame moves by `delta / 0.0005`" — the second number was wrong. Corrected to `delta / 0.001`.
> - **R3F replay verification kept out of `CoralStoneMorph`.** v5's verification note suggested adding a dev-only console assertion *inside* `CoralStoneMorph.useFrame`, which softens the "unchanged shader component" contract. Verification mechanisms moved to wrapper-level only (visible behavior, dev log in the editor's Coral branch, React DevTools).
> - **Fallback condition phrasing tightened.** v5 said "API fetch fails AND file is missing/empty" — should be OR (any failure path drops to the empty-list fallback). Now: "the fetched list for that shader is empty or unavailable."
>
> v4 → v5 changelog (kept for reference):
> - **Coral canvas uses `blobAudioData`** (the existing `audioActive && state !== 'idle' ? audioData : SILENT` gate), not raw `audioData`. Both shaders' previews now share the idle/listening audio contract.
> - **`CORAL_FALLBACK_ORB.name` = `'Coral Realtime'`** (was `'Coral'`). Removes the verification-vs-implementation contradiction; collision risk is not real because the fallback only loads when the seed file is absent.
> - **Same-shader profile-switch intro rule made explicit.** `activeOrbKey` is NOT the React reconciliation key on the renderer — only the shader change triggers a component swap (and thus a remount/intro). Same-shader profile A → B is just prop changes; no intro. Editor's Replay button is the only way to re-trigger the intro within a single shader.
> - **`morphSpeed = 0` made strictly safe.** `CoralRealtimeBlob` floors `effectiveMorphSpeed` to `Math.max(0.001, ...)` before passing to `CoralStoneMorph`. UI slider can still go to `0` (shows as "instant" / 0.00s); the floor only protects the `delta / morphSpeed` math from `0/0 → NaN`.
> - **Editor background sourcing** added to the state-model migration: `activeOrb.settings.base.bgColor` for both shaders.
> - **CRUD-verb precision.** Name validation only applies to Rename and New-profile (which have a candidate name). Save (settings update on active profile) does NOT re-validate the name — the active profile's existing name is already valid.
>
> v3 → v4 changelog (kept for reference):
> - Symbol-based references replace stale numeric line refs throughout (line numbers rot; symbols don't).
> - `activeOrbKey` / `setActiveOrbKey` naming consistent in pseudocode (v3's snippet had a setter mismatch).
> - Editor state-model migration documented explicitly: the JS animator at the existing `restartIntro`/animator effect is skipped for Coral profiles; `peakHas`/`peakEff`/`setPeak`/`clearPeak` need shader-aware variants for Coral's `PeakOverrides` shape; `profile: LinkedProfile` editor state evolves to `activeOrb: LoadedOrb | null`.
> - Phase 4 removed. Cleanup happens inline in Phase 2/3 (v3's Phase 4 duplicated work already done in earlier phases).
> - `CORAL_FALLBACK_ORB` / `NEBULARR_FALLBACK_ORB` shapes specified (id, name, lastModified all explicit).
> - localStorage keys aligned across live page and editor (both use composite-key format).
> - `LoadedOrb` → `RealtimeOrb` conversion explicit: derived in `VoiceRealtimeOpenAI` via `useMemo`.
> - `restartIntro` shader-branch shown as explicit code (not just "branch by shader").
> - Verification additions for both-files-fail, mid-conversation editor switches, mid-intro same-thumb clicks.
> - Default lucide glyph choices picked (`Circle` for Coral, `Disc` for Tube) so implementer isn't blocked.
> - R3F `key` remount note added.
>
> v2 → v3 changelog (kept for reference):
> - Seed `torusRadius` corrected to `0.275` (matches today's live `REALTIME_BASE.thinRadius` prop, not `WHIMSY_BASE.torusRadius`).
> - Seed values rewritten to reflect today's live `RealtimeBlob` Coral props (REALTIME_BASE adjustments + `morphSpeed × 1.08`), not raw studio constants.
> - Coral replay forces `previewState='idle'` before incrementing the replay key (otherwise replay-from-talking-pill remounts to a static sphere).
> - Active-orb persistence uses composite key `${sourceVariant}:${id}` (ids aren't globally unique across files).
> - Save/rename routing maintains separate per-source arrays; combined `orbs` list is a derived view, never POSTed back.
> - Name collision rules: new/rename normalizes against `realtime-coral`, `realtime-state`, and existing gallery profile names.
> - New-profile behavior: same-shader = clone active settings; different-shader = start from that shader's fallback values.
> - Coral slider ranges defined explicitly (with zero-speed behavior documented).
> - Intro behavior across active voice states documented (intros only morph visibly when `voiceState !== 'ai_speaking'` at mount).
>
> v2 → v1 changelog (kept for reference):
> - Editor's preview canvas dispatches by shader (was missing).
> - Coral morph direction made explicit (`talking → 0`, otherwise → `1`).
> - Native morph used; no `morphOverride`/`morphSeed` prop on `CoralStoneMorph`.
> - Schema includes `talking.scale` + `talking.color3` to match the editor's Peak slots.
> - `Promise.allSettled` with per-shader fallback (not `Promise.all`).
> - Single fetch owner (`VoiceRealtimeOpenAI`); wrapper is a pure renderer.
> - Thumbnail path rule defined (slug-based) with placeholder fallback.
> - Default selection rule defined (localStorage → "Coral Realtime" → first available).
> - Seed name is "Coral Realtime" (mirrors "Kyoto Realtime" pattern).
> - Delete UI removed from CRUD (current dropdown has no delete).
> - Temp test route dropped; Phases 2 + 3 merged.
> - Thumbnail-capture script honestly described as Tube-only (real work to extend).

## Implementation status (as of v8)

What has shipped, what's next in line, and what changed during implementation vs the design. v8 reorganizes the "Next in line" section after reviewer feedback (F1–F9) and ships a small code patch alongside the plan amendment.

### Shipped

| Step | Description | Commit |
|---|---|---|
| Phase 1 | `realtime-coral-profiles.json` seed at repo root + `?variant=realtime-coral` API mapping. | `3ceeae6` |
| Phase 2 | `CoralRealtimeBlob.tsx` (pure renderer), shader-aware `RealtimeBlob` dispatch, `VoiceRealtimeOpenAI` parallel fetch + data-driven thumbnail strip + composite-key localStorage default. Thumbnails copied to slug-based path. | `d249de9` |
| Phase 2.5 (added during impl) | `pinned: boolean` opt-in. Live page strip filters to `pinned===true` so profiles only show on the live page when explicitly pinned. Was originally "auto-show union of both files" in the design — corrected to explicit opt-in after a review round. | `5c4594d` |
| Phase 3a | Bookmark toggle in editor profile dropdown rows. | `1d92825` |
| Phase 3b | Coral entries appear in editor dropdown with shader glyphs (`Disc` for Tube/Kyoto in olive, `Circle` for Coral D in peach). Bookmark + rename for Coral entries persist to the Coral file. | `1bb595f` |
| Phase 3c | Editor preview canvas dispatches by shader (`<CoralStoneMorph>` when Coral active, `<GentleOrbThicken>` when Kyoto). Replay button branches by shader. **v7-shipped behavior:** Coral selection bumped a `replayCounter` keyed on `coral-${activeCoralId}-${replayCounter}`, which remounted on every Coral selection. **v8 corrects this** to match the plan's "no intro on same-shader switch" rule: `selectCoralProfile` no longer bumps `replayCounter`; canvas key is `coral-${replayCounter}` only; Replay button is the sole remount path. | `3845738` (v7) + v8 patch |
| Standalone UX | Active-shader glyph next to closed-dropdown trigger; standalone bookmark button in bottom bar (next to Replay/Auto-loop). | `a5b9799` |
| Interim guard | When a Coral profile is active, hide Tube-shaped tabs / expanded panel / Update / Discard buttons. **Shows placeholder text** "Coral tuning controls coming next." (Earlier draft of this row mistakenly said "replaces" — v8 wording corrected.) | `192026f` |
| **v8 patch — F1 + F3 corrections (round 5)** | (a) F1: same-shader Coral switch no longer remounts (see Phase 3c row above). (b) F3: `profileNameExists` now checks the Coral source array too — previously two Coral entries could be renamed into the same name. | `f22c0cc` |
| **v8 polish (round 5 self-review)** | Phase numbering standardized (3D-0 / 3D-1 / 3E / 3F); F8 swatch note moved out of Motion-tab row; 3D-0 contract expanded with Removed-vs-derived table + 6-step migration order + pre-mortem checks. Plan-only, no code. | `b0d0c4a` |
| **v8 patch — round 6 polish** | (F1 round 6) `pinned` documented in schema / `LoadedOrb` / fallback orbs / fetchVariant mapping — closes the loophole where Save round-trip could drop the field. (F2) `pickRealtimeUnusedName` extended to include `coralProfiles`. (F3) commit hashes filled in. (F4) one-line `previewState` ↔ `state` alias note added near the canvas pseudocode. (F5) live-page strip descriptions updated to mention the `pinned` filter. | `c5a2d00` |
| **v8 patch — round 7 polish (plan-only)** | (F1 round 7) `BaselineSnapshot` type replaces the old `LoadedOrb \| null` baseline shape — narrow contract (`{ key, shader, settings }`) prevents bookmark/rename/Save from spuriously marking the editor dirty. (F2) Canonical-truth rule for the bridge state: `activeOrbKey` + source arrays are the single source of truth from step 1; old vars are read-compat mirrors only; bridge is removed before 3D-0 is "done." (F3) Default-selection cascade keeps "Kyoto Realtime" first-fallback until 3D-1 ships Coral controls. (F4) Immutability rule for slider setters + deep-clone rule for baseline capture (selection + successful Save only; Discard runs the inverse). (F5) Round-6 commit hash filled in. | `90eca16` + `21e3fe1` |

### Next in line (NOT yet shipped — remaining Phase 3 items, reorganized in v8)

| Step | Description |
|---|---|
| **Phase 3D-0** | **Editor state-model migration.** Replace today's split state (`activeId` + `profile` + `activeBaseline` for Kyoto and `activeShader` + `activeCoralId` + `coralProfiles` for Coral) with the unified model the plan describes (`coralProfiles` + `kyotoProfiles` source arrays + derived `orbs` + `activeOrbKey` + `activeBaseline: BaselineSnapshot \| null`). This is the risky bulk of 3D — must land before Coral sliders, otherwise dirty/save/routing bugs are inevitable. **See "Editor state-model migration (read this first)" further down for the full contract**, including the dirty/baseline shape, immutability rule, canonical-truth bridge rule, removed-vs-derived variable map, and the 6-step migration order. |
| **Phase 3D-1** | **Coral controls panel + UI gates.** Once the state-model migration lands, restore the controls UI for Coral. Slider table per the explicit Coral section below (`Scale`, `Torus Radius`, `Settle Speed`, `Morph Speed`, `Wave Intensity`, `Breath Amp`, `Idle Amp`, colours + `talking` peaks). The exact gates that must flip from `activeShader === 'kyoto'` to shader-aware dispatch: **(1)** the single-tab popover, **(2)** the expanded 4-column drawer, **(3)** the tab buttons themselves, **(4)** Update/Discard buttons (gated on dirty + shader-aware baseline). The bottom-bar 3-swatch shortcut row stays Tube-only (Coral has no bottom swatches in this pass — F8). |
| **Phase 3E** | **Save (Update) routing for Coral edits.** Once Coral controls exist, `isDirtyCoral` compares active Coral settings against the shader-aware baseline. The Update button writes via `persistCoralProfiles` to `realtime-coral-profiles.json`. Discard reverts to baseline. Currently Update/Discard are gated on `activeShader === 'kyoto'`; that gate flips to "shader-aware dirty + shader-aware persist." |
| **Phase 3F** | **New-profile shader-choice modal + cross-source name validation in new-profile path.** "Save current state to new profile" asks which shader (Tube or Coral) before opening the name input. Same-shader = clone active settings; different-shader = start from that shader's fallback. **Validation reuses the v8-patched `profileNameExists`** (which now spans Coral + Tube + gallery), so cross-source collision is already correct by the time 3F lands. (Old "Phase 3G" was just this validation; promoted to v8 patch and folded into 3F.) |

### Known limitations of the current shipped state (until 3D-0 / 3D-1 / 3E / 3F land)

- Coral profile is **viewable** but not **tunable** in the editor — selecting a Coral entry shows the canvas + bookmark + rename, but no slider edits are possible.
- A user with a saved Coral profile can edit its values directly via JSON file (`realtime-coral-profiles.json`) and refresh; the editor will pick up the change in the dropdown and on the canvas.
- The live realtime page is fully functional regardless — pin/unpin via the editor, both shaders render correctly, intros play on shader switch.

## What we're trying to achieve

The realtime page (`/voiceinterface/realtime`) currently swaps between two visually distinct orbs — Coral and Nebularr. Nebularr's behavior flows from saved profile data in `realtime-state-profiles.json`, edited via `/voiceinterface/realtime-states`. Coral's behavior is hardcoded into TypeScript constants (`WHIMSY_BASE`, `DEFAULT_STATE_SETTINGS`) and can only be tweaked via code changes.

The goal is to give Coral the same editable, data-driven setup Nebularr already has, **without touching either shader's visual identity**:

- A saved profile file for Coral, parallel to the existing one for Nebularr.
- The realtime-states editor reads + writes both, with shader-aware controls **and** a shader-aware preview canvas.
- The live realtime page's thumbnail strip becomes data-driven (renders the **pinned** subset of the union of both files — Phase 2.5 added explicit opt-in via a per-profile `pinned` flag).
- Coral's renderer (`CoralStoneMorph`) and shader stay untouched — no API change, no animator change. Nebularr's renderer (`GentleOrbThicken`) and shader stay untouched. Each shader keeps its own animator, math, and visual feel.

The unification is **at the data and editor layers only.** Below the surface, Coral D and Tube/GentleOrb stay separate components with separate shaders. They converge at exactly two points:

1. The editor's profile dropdown + preview canvas (one list, mixed entries with shader glyphs; one canvas, dispatched by the active shader).
2. The live page's thumbnail strip + active orb dispatch (one strip, mixed entries; one `RealtimeBlob` that branches by the active orb's shader).

## Non-goals (explicitly out of scope)

- **No migration of Coral to GentleOrbThicken.** Coral D stays its own shader, with its own gallery section, its own bump-hue fragment, its own 24-wave golden-spiral.
- **No tau-unification.** Coral keeps its existing linear-advance morph animator and `morphSpeed` semantics (literal seconds). Nebularr keeps its exponential-tau animator. Deferred to a separate follow-up.
- **No changes to the gallery (`/blob-orb/gallery`)** or its existing profile files. Those keep serving the gallery page as today.
- **No shared persisted schema across shaders.** Each shader's profile file has its own clean schema, fit to that shader's actual fields. (The UI/runtime code DOES use a local discriminated union to route entries by shader — that's just type-safe routing, not data shape.)
- **No new API surface on `CoralStoneMorph`.** The native morph animator is sufficient.
- **No delete UI on the editor's profile dropdown.** Today's dropdown only has rename. Delete is a separate UX addition, not part of this pass.

## Architecture decisions (locked in)

1. **Per-shader JSON file pattern.** Two files: `realtime-state-profiles.json` (existing, Tube/Kyoto) and `realtime-coral-profiles.json` (NEW, Coral D). Matches existing gallery convention.
2. **Single editor page, shader-aware everything.** `/voiceinterface/realtime-states` stays the only editor route. Profile dropdown lists entries from both files; each entry carries a leading glyph indicating its shader. Selecting a Coral entry swaps the editor's slider set AND the preview canvas's renderer.
3. **No new prop on `CoralStoneMorph`.** Realtime adapter (`CoralRealtimeBlob`) uses the native animator: passes `goal = voiceState === 'ai_speaking' ? 0 : 1` and `morphSpeed = effectiveSpeed(state, profile)`. The intro is the natural fresh-mount behavior (`morphRef` initializes to `0`/sphere on mount, advances toward `goal`).
4. **Live thumbnail strip is data-driven.** `VoiceRealtimeOpenAI.tsx` fetches both profile files in parallel via `Promise.allSettled` on mount, with independent per-shader fallback on failure.
5. **Existing TS constants become fallbacks only.** After the live page is wired through the new system, `WHIMSY_BASE` + `DEFAULT_STATE_SETTINGS` get demoted to a `CORAL_FALLBACK_PROFILE` used only on API failure (mirrors `NEBULARR_FALLBACK_PROFILE`).

## Data layer

### `realtime-coral-profiles.json` schema

Located at the repo root, parallel to `realtime-state-profiles.json`. Coral-specific shape:

```ts
type CoralRealtimeProfile = {
  id: string;
  name: string;
  pinned: boolean;                 // Phase 2.5 opt-in: live-page strip shows only pinned entries.
  settings: {
    base: {
      scale: number;
      torusRadius: number;
      waveIntensity: number;
      breathAmp: number;
      idleAmp: number;
      morphSpeed: number;
      color1: string;
      color2: string;
      color3: string;
      bgColor: string;
    };
    talking?: {
      morphSpeed?: number;
      scale?: number;
      waveIntensity?: number;
      color3?: string;
    };
  };
  lastModified: number;
};
```

The `talking` block holds Peak overrides for the only state Coral differentiates today. Idle, listening, and thinking all share `base` values. Adding a `thinking` block is an open follow-up (out of scope).

**`pinned` is required at the persisted-schema layer** (matches the shipped `realtime-coral-profiles.json` and the symmetric `pinned: boolean` field on Kyoto profiles, both added in Phase 2.5). Save/Update CRUD MUST round-trip `pinned`; dropping it on serialization would silently unpin the user's profile and remove it from the live page strip. The editor's bookmark toggle is the only authority that flips this field. Plan-Review v8 round 6 (F1) explicitly called this out as the most likely remaining loophole — implementer wiring 3D-0/3E should treat `pinned` as a top-level field they must preserve verbatim through the save round-trip.

**Initial seed entry (one):**
```jsonc
{
  "id": "rt-coral-default",
  "name": "Coral Realtime",
  "pinned": true,
  "settings": {
    "base": {
      "scale": 1.04,
      "torusRadius": 0.275,
      "waveIntensity": 0.18,
      "breathAmp": 0.03,
      "idleAmp": 0.02,
      "morphSpeed": 1.296,
      "color1": "#944b2e",
      "color2": "#ffa279",
      "color3": "#ffc4c4",
      "bgColor": "#f7f6f4"
    },
    "talking": {
      "morphSpeed": 0.54,
      "waveIntensity": 0.20
    }
  },
  "lastModified": <timestamp at creation>
}
```

These values mirror **today's live `RealtimeBlob` Coral props**, not the raw studio constants:

| Field | Source | Note |
|---|---|---|
| `scale` | `REALTIME_BASE.scale = 1.04` | `RealtimeBlob.tsx` `REALTIME_BASE` constant overrides `WHIMSY_BASE.scale = 0.55` |
| `torusRadius` | `REALTIME_BASE.thinRadius = 0.275` | `RealtimeBlob.tsx`'s `<CoralStoneMorph>` prop binding passes `thinRadius` as the `torusRadius` prop. **Not** `WHIMSY_BASE.torusRadius = 0.3`. |
| `waveIntensity` | `DEFAULT_STATE_SETTINGS.idle.waveIntensity = 0.18` | base value (talking overrides to 0.20) |
| `breathAmp` | `DEFAULT_STATE_SETTINGS.idle.breathAmp = 0.03` | |
| `idleAmp` | `DEFAULT_STATE_SETTINGS.idle.idleAmp = 0.02` | |
| `morphSpeed` (base) | `DEFAULT_STATE_SETTINGS.idle.thickenSpeed × 1.08 = 1.296` | `RealtimeBlob.tsx` multiplies the picked-up `thickenSpeed` by `1.08` (the `morphSpeed = stateSettings.thickenSpeed * 1.08` line) |
| `morphSpeed` (talking) | `DEFAULT_STATE_SETTINGS.talking.thickenSpeed × 1.08 = 0.54` | same multiplier |
| `talking.waveIntensity` | `DEFAULT_STATE_SETTINGS.talking.waveIntensity = 0.20` | |
| `color1/2/3`, `bgColor` | `WHIMSY_BASE.*` | unchanged in REALTIME_BASE |

Initial migration is a value-preserving copy of the live page's props. Visual identity is the existing Coral exactly.

### Runtime UI types (discriminated union, code-only)

The persisted files have no `shader` field. The UI stamps it at load time:

```ts
type LoadedOrb =
  | {
      shader: 'coral';
      sourceVariant: 'realtime-coral';
      id: string;
      name: string;
      pinned: boolean;
      settings: CoralRealtimeProfile['settings'];
      lastModified: number;
    }
  | {
      shader: 'kyoto';
      sourceVariant: 'realtime-state';
      id: string;
      name: string;
      pinned: boolean;
      settings: LinkedProfile;
      lastModified: number;
    };
```

`sourceVariant` lets save/rename/new-profile CRUD route back to the right file without re-deriving from `shader`. `pinned` is hoisted from the persisted record into both branches of the union — the live-page strip filters by `o.pinned === true`, and the editor's bookmark toggle writes through to the persisted file.

### API endpoint

Currently: `/api/studio-profiles?variant=realtime-state` reads + writes `realtime-state-profiles.json`.

Add `realtime-coral` variant → `realtime-coral-profiles.json`. Same code path; one-line addition to the variant→file mapping.

## Renderer changes

### `CoralStoneMorph.tsx` — UNCHANGED

No new prop. No animator change. The native flow already does what we need:

- `morphRef = useRef(0)` on mount → starts at sphere (`morph=0`).
- Each frame: `if (goal === 1) morphRef += delta/morphSpeed; else morphRef -= delta/morphSpeed`.
- Smoothstep ease applied: `uMorph = t * t * (3 - 2*t)`.
- 0 = sphere/talking; 1 = torus/idle.

The wrapper just feeds `goal` and `morphSpeed`.

### NEW: `src/projects/voiceinterface/components/CoralRealtimeBlob.tsx`

Pure renderer. Mirrors `NebularrBlob.tsx` in structure but uses Coral's native animator:

- **Props:** `audioData`, `voiceState`, `profile: CoralRealtimeProfile['settings'] | null`, `width`, `height`. Does NOT fetch profiles.
- **Fallback:** when `profile` is null, uses `CORAL_FALLBACK_PROFILE` (the seed values, hardcoded inside the component).
- **Per-state effective values** (computed each render from profile + voiceState):
  - `goal = voiceState === 'ai_speaking' ? 0 : 1`
  - `effectiveMorphSpeed = voiceState === 'ai_speaking' ? (talking.morphSpeed ?? base.morphSpeed) : base.morphSpeed`
  - `effectiveScale = voiceState === 'ai_speaking' ? (talking.scale ?? base.scale) : base.scale`
  - `effectiveWaveIntensity = voiceState === 'ai_speaking' ? (talking.waveIntensity ?? base.waveIntensity) : base.waveIntensity`
  - `effectiveColor3 = voiceState === 'ai_speaking' ? (talking.color3 ?? base.color3) : base.color3`
  - `breathAmp`, `idleAmp`, `color1`, `color2`, `torusRadius`: base only.
- **Renders** `<CoralStoneMorph audioData goal morphSpeed={Math.max(0.001, effectiveMorphSpeed)} scale torusRadius waveIntensity breathAmp idleAmp color1 color2 color3 />` with the effective values above. The `Math.max(0.001, ...)` floor on `morphSpeed` is required because `CoralStoneMorph` computes `delta / morphSpeed`; with both `delta` and `morphSpeed` at `0` (rare but possible on the first frame after mount), the result is `NaN` and propagates into `morphRef` permanently. The floor is small enough that `0` on the user-facing slider still produces a near-instant transition (one frame at the floor moves `morphRef` by `delta / 0.001`, far beyond the 0–1 clamp range).

**Intro behavior (no extra code needed):**

When the user clicks the Coral thumbnail on the live page, `RealtimeBlob` swaps from `<NebularrBlob>` to `<CoralRealtimeBlob>` — different component types, so React unmounts the old and mounts the new fresh. `CoralRealtimeBlob` mounts → `CoralStoneMorph` mounts → `morphRef = 0` (sphere). If the default `voiceState` is `idle`, `goal = 1` → native animator advances `morph: 0 → 1` over `base.morphSpeed` seconds. That IS the intro.

**Same-shader profile switch — no intro by default.** Switching Coral A → Coral B (or Tube A → Tube B) in either the live page or the editor does NOT trigger an intro. The reasoning: `activeOrbKey` is the logical identity used for dropdown selection, localStorage, and source-list lookup, but it is **not** used as a React reconciliation `key` on the renderer. Only the *shader* change triggers a component swap (`<CoralRealtimeBlob>` ↔ `<NebularrBlob>` are different component types, so React unmounts + remounts naturally). Same-shader profile A → B is just prop changes flowing into the already-mounted renderer.

> **v8 reconciliation note (F1).** The v7 implementation in `realtime-states.tsx` violated this rule:
> - `selectCoralProfile` called `setReplayCounter(c => c + 1)` on every Coral selection.
> - The canvas key was `coral-${activeCoralId}-${replayCounter}` — `activeCoralId` changing on selection forced a remount even without the counter bump.
>
> v8's code patch reconciles both: `selectCoralProfile` no longer touches `replayCounter`, and the canvas key is `coral-${replayCounter}` only. The Replay button is the sole same-shader remount path (it bumps `replayCounter`). Cross-shader switching (Coral ↔ Kyoto) still remounts naturally because the canvas branches between two different component types.

Concrete consequence (after v8 patch):

- Live page: clicking a different Coral thumb when Coral is active → strip selection updates, profile prop changes, orb smoothly transitions to the new profile's values (no intro).
- Live page: clicking a Tube thumb when Coral is active → component swap, intro plays.
- Editor: clicking a different Coral entry in the dropdown when Coral is active → controls + canvas update, no intro. The user can press the Replay button (which increments `replayCounter` and is keyed on the canvas's Coral renderer) to manually re-trigger the intro within the same shader.
- Editor: clicking a Tube entry when Coral is active → canvas dispatch swaps from Coral renderer to Tube renderer, fresh-mount intro plays.

If a future requirement is "intro on every profile switch", the implementation knob is to add `activeOrb.id` (or `activeOrbKey`) to the `key` prop of the renderer. Out of scope for this plan.

**Intro during active voice states:**

The natural-mount intro only morphs visibly when `voiceState !== 'ai_speaking'` at mount time. If the user clicks the Coral thumbnail mid-conversation while the AI is speaking (`voiceState === 'ai_speaking'`), Coral mounts with `morphRef = 0` AND `goal = 0` — the orb appears as a sphere and stays a sphere until the AI stops, at which point `goal` flips to `1` and it morphs to torus. **This is consistent with the live state semantics, not a bug.**

Nebularr's intro overlay has the same property: when `voiceState === 'ai_speaking'` at mount, the talking-shape seed lerps toward the animator's output, which is also the talking shape — net visible morph is near-zero. Both shaders behave the same way: intros are a flourish for the typical case (user clicks while idle), and they become near-invisible during active conversation. No special-case code needed.

### `RealtimeBlob.tsx` — shader-aware dispatch

Replace the hardcoded `if (profile === 'nebularr')` branch:

```ts
type RealtimeOrb =
  | { shader: 'coral'; profile: CoralRealtimeProfile['settings'] | null }
  | { shader: 'kyoto'; profile: LinkedProfile | null };

interface RealtimeBlobProps {
  audioData: AudioData;
  voiceState: RealtimeVoiceState;
  orb: RealtimeOrb;
  width?: number;
  height?: number;
}

const RealtimeBlob: React.FC<RealtimeBlobProps> = ({ orb, audioData, voiceState, ... }) => {
  if (orb.shader === 'coral') {
    return <CoralRealtimeBlob audioData={audioData} voiceState={voiceState} profile={orb.profile} ... />;
  }
  return <NebularrBlob audioData={audioData} voiceState={voiceState} profile={orb.profile} ... />;
};
```

Drop the imports of `WHIMSY_BASE` / `DEFAULT_STATE_SETTINGS` from this file (they move to `CoralRealtimeBlob`'s fallback).

### `VoiceRealtimeOpenAI.tsx` — single fetcher, robust fallbacks

Owns fetching of BOTH profile files. Replaces the hardcoded `profileThumbs` array (lines 485-488 today):

```ts
const [orbs, setOrbs] = useState<LoadedOrb[]>([]);
const [activeOrbKey, setActiveOrbKey] = useState<string | null>(null);

const composite = (o: LoadedOrb) => `${o.sourceVariant}:${o.id}`;

useEffect(() => {
  const fetchVariant = async (variant: 'realtime-coral' | 'realtime-state', shader: 'coral' | 'kyoto'): Promise<LoadedOrb[]> => {
    try {
      const r = await fetch(`/api/studio-profiles?variant=${variant}`);
      const arr = await r.json();
      return Array.isArray(arr) ? arr.map(p => ({
        shader,
        sourceVariant: variant,
        id: p.id,
        name: p.name,
        pinned: p.pinned === true,           // explicit boolean coercion: missing field → false (defensive against legacy entries)
        settings: p.settings,
        lastModified: p.lastModified,
      })) as LoadedOrb[] : [];
    } catch {
      return [];
    }
  };

  Promise.allSettled([
    fetchVariant('realtime-coral', 'coral'),
    fetchVariant('realtime-state', 'kyoto'),
  ]).then(([coralRes, kyotoRes]) => {
    const coralOrbs = coralRes.status === 'fulfilled' && coralRes.value.length > 0
      ? coralRes.value
      : [CORAL_FALLBACK_ORB];
    const kyotoOrbs = kyotoRes.status === 'fulfilled' && kyotoRes.value.length > 0
      ? kyotoRes.value
      : [NEBULARR_FALLBACK_ORB];
    const merged = [...coralOrbs, ...kyotoOrbs];
    setOrbs(merged);

    // Default selection: localStorage → "Coral Realtime" → first available.
    // Use a composite key (sourceVariant:id) because ids are scoped per file
    // and could collide across files (especially user-created profiles).
    const persisted = window.localStorage.getItem('realtime-active-orb-key');
    const persistedExists = persisted && merged.find(o => composite(o) === persisted);
    const coralDefault = merged.find(o => o.name === 'Coral Realtime');
    const fallbackKey = coralDefault ? composite(coralDefault) : (merged[0] ? composite(merged[0]) : null);
    setActiveOrbKey(persistedExists ? persisted : fallbackKey);
  });
}, []);

// Persist on change.
useEffect(() => {
  if (activeOrbKey) window.localStorage.setItem('realtime-active-orb-key', activeOrbKey);
}, [activeOrbKey]);

// Derive the active orb + the props passed to RealtimeBlob.
const activeOrb = useMemo(
  () => orbs.find(o => composite(o) === activeOrbKey) ?? null,
  [orbs, activeOrbKey],
);
const realtimeOrbProp: RealtimeOrb | null = useMemo(
  () => (activeOrb ? { shader: activeOrb.shader, profile: activeOrb.settings } : null),
  [activeOrb],
);
```

`activeOrbKey` is the composite `${sourceVariant}:${id}` string used for dropdown selection, localStorage value, and source-list lookup. **It is NOT used as a React reconciliation `key` on the renderer.** Renderer React keys come from shader identity only — `<CoralRealtimeBlob>` and `<NebularrBlob>` are different component types, so the shader change is the only thing that triggers a remount/intro. Same-shader profile A → B is just prop changes flowing into the already-mounted renderer (see "Same-shader profile switch — no intro by default" below). The editor's Coral replay key (`coral-${replayCounter}`) is the one place a counter-derived key is used, scoped only to the editor canvas's Coral branch. The same composite-key convention applies in the editor's localStorage (`realtime-states-active-orb-key`).

The `RealtimeOrb` shape (used by `RealtimeBlob`) is derived from `LoadedOrb` (used everywhere else) via the `useMemo` above. Conversion is a one-line projection: `{ shader, profile: settings }`. This boundary is the only place the two unions meet.

### Fallback orb shapes (`CORAL_FALLBACK_ORB`, `NEBULARR_FALLBACK_ORB`)

Hardcoded constants used whenever the fetched list for a shader comes back empty or unavailable — i.e., any of: the network request rejected, the response was malformed, the file was missing, or the file existed but contained an empty array. The pseudocode above already collapses these cases via `coralRes.status === 'fulfilled' && coralRes.value.length > 0`; the fallback is the `else` branch. Shapes specified explicitly so the implementer doesn't guess:

```ts
const CORAL_FALLBACK_ORB: LoadedOrb = {
  shader: 'coral',
  sourceVariant: 'realtime-coral',
  id: 'rt-coral-fallback',                 // distinct from the seed's 'rt-coral-default'
  name: 'Coral Realtime',                  // matches the seed name; only loads when seed is absent, so no collision
  pinned: true,                            // fallbacks are always shown when their file fails (otherwise the strip would be empty in the failure case)
  settings: { /* values from the seed table above */ },
  lastModified: 0,                         // 0 = "never persisted"
};

const NEBULARR_FALLBACK_ORB: LoadedOrb = {
  shader: 'kyoto',
  sourceVariant: 'realtime-state',
  id: 'rt-nebularr-fallback',
  name: 'Nebularr',                        // matches the existing realtime-state-profiles.json entry name
  pinned: true,                            // same reasoning as CORAL_FALLBACK_ORB
  settings: { /* values from current NEBULARR_FALLBACK_PROFILE in NebularrBlob.tsx */ },
  lastModified: 0,
};
```

The fallback orb only loads when the file fetch returns nothing (missing file, malformed JSON, or empty array). In that case, no real entry exists with the same `name`, so collision is not a real risk. Using `'Coral Realtime'` matches the verification checklist's expectation ("the strip still includes a 'Coral Realtime' entry") and keeps default-selection lookup uniform whether or not the file is present. `lastModified: 0` makes any saved entry preferred in any sort-by-recency UI.

**Thumbnail strip:** iterates `orbs.filter(o => o.pinned)` (Phase 2.5 explicit opt-in — only profiles the user has pinned via the editor's bookmark toggle appear on the live page). Each thumb's image src derived from a slug rule:

```ts
const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const thumbSrc = `/thumbnails/realtime-states/${slug(orb.name)}.png`;
// On <img> error, falls back to /thumbnails/realtime-states/_placeholder.png
```

For the seed Coral entry: name "Coral Realtime" → slug "coral-realtime" → expected thumb `/thumbnails/realtime-states/coral-realtime.png`. We re-save today's `/thumbnails/realtime-production.png` under this name (or add an alias) as part of Phase 2.

For existing Kyoto entries: "Kyoto Realtime" → "kyoto-realtime", "Nebularr" → "nebularr". The Nebularr thumb already exists at `/thumbnails/realtime-states/nebularr.png`; the Kyoto Realtime thumb may need to be captured.

`RealtimeBlob` receives `orb={ shader, profile: settings }` for the active orb.

### Editor preview canvas — shader-aware dispatch (NEW REQUIREMENT)

> **Naming note (F4 round 6).** The pseudocode in this section and the `restartIntro` snippet further down use `previewState` / `setPreviewState` for readability. The **actual editor variable is named `state`** (typed `PreviewState`), with setter `setState`. They refer to the same thing — `previewState` is just a less-collision-prone name in prose. Implementer should NOT introduce a parallel state variable; use the existing `state` / `setState` everywhere the pseudocode says `previewState` / `setPreviewState`.

Today the canvas in `realtime-states.tsx` is hardwired to `<GentleOrbThicken>`. After unification, the canvas dispatches by the active profile's shader:

```jsx
<Canvas ...>
  <ambientLight intensity={0.5} />
  {activeShader === 'coral' ? (
    <CoralStoneMorph
      key={`coral-${replayCounter}`}     // remount on Replay
      audioData={blobAudioData}          // gated, not raw
      goal={previewState === 'talking' ? 0 : 1}
      morphSpeed={Math.max(0.001, effectiveCoralMorphSpeed)} // floor for 0/0 safety
      scale={effectiveCoralScale}
      torusRadius={profile.base.torusRadius}
      waveIntensity={effectiveCoralWaveIntensity}
      breathAmp={profile.base.breathAmp}
      idleAmp={profile.base.idleAmp}
      color1={profile.base.color1}
      color2={profile.base.color2}
      color3={effectiveCoralColor3}
    />
  ) : (
    <GentleOrbThicken {...existingTubeProps} />
  )}
</Canvas>
```

**`blobAudioData`, not raw `audioData`.** The existing Tube path uses a gated `blobAudioData = audioActive && state !== 'idle' ? audioData : SILENT` (the existing helper in `realtime-states.tsx`). Coral's preview MUST use the same gate or a Coral profile would visibly react to audio while idle, breaking the existing idle/listening contract. The same `blobAudioData` value flows into both branches.

**`Math.max(0.001, morphSpeed)` floor.** Coral's animator computes `delta / morphSpeed`. With `morphSpeed === 0` and `delta === 0` (rare but possible — first frame after mount, or under throttling), the result is `NaN`, which propagates to `morphRef` and stays there. The floor protects the math without changing the user-facing slider semantics: the slider can still show `0.00s` and feel instant (with the floor at `0.001`, a non-zero `delta` of e.g. 16ms gives `delta / 0.001 = 16` per frame, far beyond the 0–1 clamp range, so `morphRef` saturates in a single frame). Apply the same floor inside `CoralRealtimeBlob` for the live page.

The editor's existing `restartIntro` action stays, but branches by shader:

- **Kyoto:** existing path — seeds `render` via `introRender(profile)`, sets `state='idle'`, lets the JS animator settle. Unchanged.
- **Coral:** **first** sets `previewState='idle'`, **then** increments `replayCounter`. Both are required: the canvas pseudocode binds `goal = previewState === 'talking' ? 0 : 1`, so if the user is on the Talking pill and presses Replay, the remounted `CoralStoneMorph` would start at `morphRef=0` AND `goal=0` — nothing would morph. Forcing idle first ensures the remount lands with `goal=1`, so `morphRef` advances `0 → 1` and the sphere → torus intro plays. (Mirrors what Kyoto's existing `restartIntro` function already does — it calls `setState('idle')` before its other resets.)

## Editor changes (`/voiceinterface/realtime-states`)

### Editor state-model migration (read this first)

The editor today is ~1900 lines and its entire state machine assumes a Tube/Kyoto profile (`profile: LinkedProfile`). Before any UI work, the underlying state model has to evolve. This is the largest implementation risk in the plan; treat this subsection as the contract.

**State variables that change:**

| Today | After unification |
|---|---|
| `profile: LinkedProfile` (single state) | `coralProfiles: SavedCoralProfile[]` + `kyotoProfiles: SavedKyotoProfile[]` (two source arrays) + `activeOrbKey: string \| null` (composite key) |
| `activeId: string` | replaced by `activeOrbKey` (composite-keyed) |
| `activeBaseline: LinkedProfile` (for dirty detection) | becomes `activeBaseline: BaselineSnapshot \| null` — see "Dirty/baseline contract" below; **NOT** a full `LoadedOrb`. |
| (none) | `replayCounter: number` (Coral remount trigger) |

The combined `orbs` list is a derived view (`useMemo`) over the two source arrays, exactly as in `VoiceRealtimeOpenAI`. `activeOrb` is derived from `activeOrbKey + orbs`.

**Dirty/baseline contract (round 7 F1 + F4).** Earlier drafts said `activeBaseline: LoadedOrb | null`, with prose telling the reader to "compare active settings against the baseline of the same shader." That's too loose — a literal `LoadedOrb` includes `id` / `name` / `pinned` / `lastModified` / `sourceVariant`, and a naive deep-equal would mark the editor dirty whenever the user toggles the bookmark, renames, or completes a Save (which rewrites `lastModified`). The contract:

```ts
type BaselineSnapshot =
  | { key: string; shader: 'kyoto'; settings: LinkedProfile }
  | { key: string; shader: 'coral'; settings: CoralRealtimeProfile['settings'] };

const isDirty = (active: LoadedOrb | null, baseline: BaselineSnapshot | null): boolean => {
  if (!active || !baseline) return false;
  if (composite(active) !== baseline.key) return false;       // mismatched baseline → not dirty (will be re-snapshotted)
  if (active.shader !== baseline.shader) return false;         // shader-shape mismatch → not comparable
  return !deepEqual(active.settings, baseline.settings);       // ONLY the settings tree, never name/pinned/lastModified
};
```

Concrete rules a 3D-0 implementer MUST follow:

1. **Baseline carries `settings` only**, plus the composite key + shader for sanity checks. Not `id`, not `name`, not `pinned`, not `lastModified`, not `sourceVariant`.
2. **Baseline is captured as a deep clone** at exactly two moments: (a) on profile selection, (b) immediately after a successful Save (Update). Snapshot via `structuredClone` or a `JSON.parse(JSON.stringify(...))` fallback; do NOT alias the source-array entry's `settings` reference. **Discard does NOT re-capture baseline** — Discard runs the inverse: it sets `activeOrb.settings = structuredClone(baseline.settings)`, leaving baseline untouched. Active becomes equal to baseline by clone, `isDirty` returns `false`, and the source array entry gets the cloned reverted settings written back via the immutable helper from rule 3. (Capturing baseline on Discard would be the exact opposite operation — it would freeze the dirty edits as the new baseline, silently treating unsaved changes as saved. Easy mistake to make from a "just snapshot here too" reading; explicitly forbidden.)
3. **Slider `onChange` setters MUST update immutably.** Helper signatures look like `setKyotoField('base.scale', v)` and internally do `setKyotoProfiles(arr.map(p => p.id === activeId ? { ...p, settings: { ...p.settings, base: { ...p.settings.base, scale: v } } } : p))`. No `arr[i].settings.base.scale = v` direct assignment, anywhere. Without this, `activeOrb.settings` and the captured baseline can share a nested reference and dirty detection silently returns `false` after edits.
4. **Bookmark toggle, rename, and Save bumping `lastModified` do NOT mark the editor dirty.** Bookmark + rename operate on top-level fields (`pinned`, `name`); they bypass dirty/baseline entirely and persist immediately. Save produces a new `lastModified` but immediately re-snapshots the baseline, so dirty returns to `false`.
5. **Cross-shader switch resets baseline.** When `activeOrbKey` flips and `activeOrb.shader` changes, the baseline is re-captured for the new orb. Same-shader switch (Coral A → Coral B) also re-captures so dirty is per-orb, not per-session.

The `BaselineSnapshot` type is intentionally narrow. Anything broader (a full `LoadedOrb`, or "the whole thing") opens the door to dirty-by-bookmark and dirty-after-save bugs that are tedious to reproduce and easy to ship past tests.

**Removed vs derived variables (3D-0 contract).**

| Variable today | After 3D-0 | Why |
|---|---|---|
| `activeId: string` | **Removed.** All references switch to `activeOrbKey`. | A composite key already encodes the same identity; keeping both is redundant and a likely bug source if they drift. |
| `activeShader: 'coral' \| 'kyoto'` | **Derived (`useMemo`).** `activeShader = activeOrb?.shader ?? 'kyoto'`. | The shader is a property of the active orb; storing it separately can drift from `activeOrbKey`. Keep the read API but compute it. |
| `activeCoralId: string \| null` | **Removed.** All references replaced with `activeOrbKey` lookup or `activeOrb.id` if shader is coral. | Same as `activeId` — composite key already encodes this. |
| `profile: LinkedProfile` | **Removed.** Reads switch to `activeOrb.shader === 'kyoto' ? activeOrb.settings : null`. Writes (slider edits) go through `kyotoSetPeak` / `kyotoClear`-style helpers that route to `kyotoProfiles[i].settings`. | The single `profile` mirror was a Kyoto-specific shortcut; in a multi-shader world it has to be computed per shader. |
| `coralProfiles: SavedCoralProfile[]` | **Renamed in place** as the canonical Coral source array. (Already exists today; just stays.) | Already correctly scoped. |
| `profiles: SavedProfile[]` | **Renamed to `kyotoProfiles: SavedKyotoProfile[]`.** | Naming alignment with `coralProfiles`; makes derived-view code symmetric. |

Anything not listed above is unchanged.

**Migration order at implementation time.**

The migration is one PR but the changes are sequenced inside the file to keep the editor working at every step. Suggested order:

1. **Add the new state without removing the old.** Introduce `activeOrbKey`, `kyotoProfiles` (renamed from `profiles`), the derived `activeShader`/`activeOrb` `useMemo`s. Leave `activeId` / `activeCoralId` / `profile` in place; populate them from the new derived values via small bridge effects. The editor still works exactly as before because all read sites still see the old variables. **Canonical-truth rule (round 7 F2):** the moment the bridge is installed, `activeOrbKey` + the two source arrays are the **single source of truth**. The old vars (`activeId`, `activeCoralId`, `activeShader`, `profile`) are demoted to **read-compat mirrors only** — their setters MUST NOT be called by any new or migrated code. Any code path that wants to change the selection must call `setActiveOrbKey`; any code path that wants to change settings must call the immutable shader-aware helpers (see Dirty/baseline contract above). The bridge effect runs in one direction only: canonical → mirror. If you find yourself writing `setActiveId(...)` after step 1, that's the bridge running backwards and the migration is broken.
2. **Add the localStorage persistence (no backward-compat needed).** Today's editor does NOT persist active-profile selection in localStorage — it always defaults on mount. After 3D-0, write `activeOrbKey` to `realtime-states-active-orb-key` (composite `${sourceVariant}:${id}`) on change, and read it on mount with the cascade: persisted → **"Kyoto Realtime"** → first available. **F3 round 7 — keep Kyoto-first cascade until 3D-1 lands.** The plan's earlier drafts had the cascade fall back to "Coral Realtime"; that would silently change the first-load editor experience for fresh users (no persisted key) from "Tube editor open and tunable" to "Coral viewer open with no controls" while 3D-1 is in flight. Until 3D-1 ships Coral controls, the fresh-load fallback stays "Kyoto Realtime"; flip the priority to "Coral Realtime" → "Kyoto Realtime" only when 3D-1 lands and Coral is editable. (The live page's `realtime-active-orb-key` is a separate key — different surface, different storage, and the live page already cascades to "Coral Realtime" because Coral is fully functional there.)
3. **Switch read sites one at a time.** Profile-dropdown rows, the canvas dispatch, the controls panel, the bottom-bar pinned/replay buttons — each gets migrated to read from `activeOrb` instead of `activeId`/`profile`. Keep the bridge effects from step 1 alive while sites migrate; remove a bridge effect only when no read site depends on its output.
4. **Switch write sites one at a time.** Slider `onChange` handlers update the relevant source array via shader-aware **immutable** helpers (see Dirty/baseline contract rule 3). The Save (Update) button POSTs only the relevant source array. Rename + new-profile route by `activeOrb.sourceVariant`.
5. **Remove the old variables and bridge effects** once nothing reads them. **3D-0 is NOT considered done while any bridge effect is still installed.** The verification step below grep-checks that `activeId`, `activeCoralId`, `setActiveId`, `setActiveCoralId`, `setActiveShader`, `setProfile` (as a state setter — not the Coral one), and the `profile` state symbol have zero references in the editor file. Bridge state was a tool for the migration, not a permanent shape.
6. **Verify dirty-detection** end-to-end before declaring 3D-0 done. The pre-mortem checks (below) are the test plan: dirty stuck on/off, localStorage persistence, animator early-return placement, plus an immutability sanity check (edit a slider → dirty → Discard reverts → not dirty → edit same slider to same value → dirty? should be `false`, which only works if helpers cloned correctly).

**Why this order, specifically.** The non-obvious risks are: (a) flipping `activeBaseline` from `LinkedProfile` to a shader-aware shape while Tube users have an unsaved-edit session in progress would silently mark them clean (or stuck dirty) — solved by the explicit `BaselineSnapshot` contract; (b) renaming `profiles` to `kyotoProfiles` in one sweep would touch ~30+ sites and any miss is a silent compile-time win that breaks at runtime — solved by the bridge approach in step 1; (c) bridge effects running in both directions create state oscillation — solved by the canonical-truth rule in step 1.

**Pre-mortem checks (do BEFORE first 3D-0 commit).** Three-line list, anchored to actual failure modes the prior phases hit:

- **Dirty signal stuck on/off.** Today's `isDirty = !deepEqual(profile, activeBaseline)`. After migration, the comparator is the `isDirty(active, baseline)` function from the Dirty/baseline contract — it inspects only `settings`, not the `LoadedOrb` envelope. If the comparator accidentally compares the full active orb against the baseline (or vice-versa), `isDirty` flips on bookmark / rename / save and the test below catches it. Test: load editor → no dirty indicator. Edit one slider → dirty. Discard → not dirty. Toggle bookmark → still not dirty. Rename via the dropdown → still not dirty. Save → not dirty (immediately re-snapshots).
- **localStorage persistence works end-to-end.** Test: select a non-default profile, refresh page, confirm the editor reopens with that profile selected. Then clear `localStorage`, refresh, confirm the cascade works (defaults to "Kyoto Realtime" if present until 3D-1 lands; flip priority to "Coral Realtime" first when 3D-1 ships Coral controls).
- **JS-animator early-return placed at the wrong line.** The `if (activeOrbRef.current?.shader !== 'kyoto') { ... return; }` gate must go AT THE TOP of the `animate` function, not inside its conditional branches. Misplaced, it stops Tube's animator too. Test: Tube profile renders + animates as before; Coral profile shows a static `<CoralStoneMorph>` (its own native animator handles motion).

**The JS animator (Kyoto's exponential lerp) is SKIPPED for Coral profiles.**

The existing animator effect (the `useEffect` containing the `requestAnimationFrame` loop with `lerpRender(cur, target, alpha)`) is Tube-specific. For Coral profiles:

- The animator's `setRender(next)` calls produce a `RenderValues` object that is **not consumed by the canvas** (the canvas dispatches to `<CoralStoneMorph>`, which uses its own native morph state). The animator can either:
  1. Early-return at the top of each tick when `activeOrb.shader === 'coral'` (cleanest — no wasted compute, no stale state).
  2. Keep running but ignore its output (wasteful but lower-risk if the animator state is referenced elsewhere).
- Choose option 1. Add `if (activeOrbRef.current?.shader !== 'kyoto') { raf = requestAnimationFrame(animate); return; }` at the top of the animate function (where `activeOrbRef` is the standard ref-mirror of `activeOrb`).
- The talking-exit override mechanism (`activeTauOverrideRef`) and `previousStateRef` also become Tube-only by the same gate.

**`peakHas` / `peakEff` / `setPeak` / `clearPeak` become shader-aware.**

These helpers today operate on `LinkedProfile`'s `PeakOverrides` shape. Coral's `talking` shape is different (no `thickRadius`/`waveCount`/`thickenSpeed`/`entrySpeed`/`settleSpeed`; has `morphSpeed`/`scale`/`waveIntensity`/`color3` only).

Rather than make these helpers handle a union, **introduce parallel helpers for Coral**:

```ts
// Existing (rename to make Tube-specific):
const kyotoPeakHas = (scope: 'thinking' | 'talking', field: keyof PeakOverrides) => ...;
const kyotoPeakEff = ...;
const kyotoSetPeak = ...;
const kyotoClearPeak = ...;

// New (parallel set, Coral's talking-only peak shape):
type CoralTalkingOverride = NonNullable<CoralRealtimeProfile['settings']['talking']>;
const coralPeakHas = (field: keyof CoralTalkingOverride) => ...;
const coralPeakEff = ...;
const coralSetPeak = ...;
const coralClearPeak = ...;
```

Editor controls call the appropriate helper based on `activeOrb.shader`. Each helper writes back to its own source array (`kyoto*` writes to `kyotoProfiles`, `coral*` writes to `coralProfiles`).

**Existing `restartIntro` becomes the explicit branch shown below.**

**The audio-active-jump-to-talking effect** (today: `if (audioActive) { setAutoLoop(false); setState('talking'); }`) stays unchanged — it operates on `state` only, not on profile shape, so it works for both shaders. For Coral, `state='talking'` flows through the canvas-dispatch's `goal = previewState === 'talking' ? 0 : 1` and triggers Coral's morph. ✓

**Editor background sourcing.** The page bg and Canvas bg today read `profile.base.bgColor`. After the migration, both shader profiles' settings types still expose `base.bgColor` at the same path, so the source becomes `activeOrb.settings.base.bgColor` for both shaders. No conditional needed; the field name and shape are identical between schemas by intent. Stated explicitly so the implementer doesn't conditionalize this unnecessarily.

**The auto-loop interval** (today: `setState((p) => STATES[(STATES.indexOf(p) + 1) % STATES.length])`) stays unchanged — same reason.

**Effects that don't apply to Coral** (idle/listening/thinking are visually identical, no thinking-pulse):

- The `pulseRef` reset on `state !== 'thinking'` — harmless to leave running for Coral; pulseRef just stays at `{phase:0, dir:1}`.
- The `thinkingPaused` flag — same.

These can stay as-is; they're cheap and Tube-specific behavior simply isn't visible on Coral because the canvas isn't reading from `render`.

### `restartIntro` — explicit shader branch

```ts
const restartIntro = (orb: LoadedOrb | null = activeOrb) => {
  // Universal resets (apply to both shaders).
  setAutoLoop(false);
  setThinkingPaused(false);
  setPreviewState('idle');

  if (!orb) return;

  if (orb.shader === 'coral') {
    // Coral's intro is the natural fresh-mount morph: morphRef = 0 → goal = 1.
    // We force a remount via the replay key; previewState is already 'idle'
    // above, which guarantees goal === 1 on the next render.
    setReplayCounter(c => c + 1);
    return;
  }

  // Kyoto path (existing logic).
  lastTsRef.current = performance.now();
  pulseRef.current = { phase: 0, dir: 1 };
  activeTauOverrideRef.current =
    orb.settings.talking.settleSpeed ?? orb.settings.base.thickenSpeed;
  if (stateRef.current !== 'idle') {
    previousStateRef.current = 'talking';
  }
  setRenderNow(talkingRenderForProfile(orb.settings));
};
```

Order matters: `setPreviewState('idle')` runs first so React has time to commit the state change before the next render — Coral's canvas then reads `previewState === 'idle'` → `goal = 1`. Tube's path doesn't depend on this timing because its tau override is set synchronously in the same handler.

**R3F `key` remount note:** `<CoralStoneMorph key={`coral-${replayCounter}`}>` inside `<Canvas>` should trigger Three.js mesh recreation when the key changes — R3F's reconciler treats child components like a normal React tree. Verify during implementation by **wrapper-level mechanisms only** (preserving the "CoralStoneMorph unchanged" contract):
- Visible behavior: pressing Replay while the orb is settled at torus visibly returns it to sphere and morphs back.
- Wrapper-level dev log: a `useEffect(() => console.log('coral mount', replayCounter), [])` (empty deps) inside the editor's Coral branch — fires once per mount.
- React DevTools: confirm `<CoralStoneMorph>`'s instance id changes on each Replay click.

Do NOT add console assertions inside `CoralStoneMorph.tsx` itself — that file is in the "Unchanged" list and adding dev-only code would soften that contract for an avoidable reason.



The profile menu (the `<div ref={profileMenuRef}>` block in `realtime-states.tsx`) lists entries from both files via the same `Promise.allSettled` pattern as the live page. Each row has a leading glyph.

**Default glyph picks** (so the implementer isn't blocked):

- **Coral** entries: lucide `Circle` icon, 14×14, color tinted to Coral's peach (`var(--VoiceCoral, #ffa279)` or close).
- **Tube/Kyoto** entries: lucide `Disc` icon, 14×14, color tinted to Kyoto's olive (`#949e05` or close).

Both icons are available from the `lucide-react` package already used elsewhere in the editor. Final swap to letter-chips or other glyphs is a 1-line change at implementation review time if these don't read well.

Rows show: `[glyph] [name]` with rename action to the right (no delete in this pass).

### Default selection on load

Same composite-key format as the live page, but a **different priority on the fallback** (round 7 F3): localStorage `realtime-states-active-orb-key` (composite `${sourceVariant}:${id}`) → **"Kyoto Realtime" entry → first available** while 3D-1 is in flight. Once 3D-1 lands and Coral is fully editable in the editor, the priority flips to "Coral Realtime" → "Kyoto Realtime" → first available, matching the live page. The two pages use different localStorage keys (`realtime-active-orb-key` for the live page; `realtime-states-active-orb-key` for the editor) so each surface can remember its own last selection independently. The live page's cascade does **not** change with this rule — Coral is fully functional there, so "Coral Realtime" stays first.

### Dirty-edit behavior on switch

Switching to a different profile via the dropdown discards unsaved edits to the previous profile (matches today's behavior — there's no warning prompt). The `Discard` and `Update` buttons in the bottom bar remain the explicit save mechanism. Adding a "you have unsaved edits" warning is a separate UX improvement, not part of this pass. **Documented behavior: discard, no warning.**

### Shader-aware controls panel

Tabs stay (Size, Thickness, Motion, Colours). Slider set differs by active shader:

#### Coral (`shader === 'coral'`):

| Tab | Controls per pill | Notes |
|---|---|---|
| **Size** | Idle/listening/thinking pills: `Scale` slider edits `base.scale` directly. Talking pill: `Scale (Peak)` edits `talking.scale` (PeakSliderRow, inherited if unset). All pills also show `Torus Radius` editing `base.torusRadius`. | **F7 — base.scale is NOT editable from the Talking pill.** When the Talking pill is active, the only Scale control visible is the Peak (`talking.scale`). To edit `base.scale`, the user selects Idle, Listening, or Thinking. This mirrors Tube's existing Rest/Peak pattern — there is no separate "always-visible Rest/base" Size control on the Talking pill. `talking.scale` is the only Peak slot for size. |
| **Thickness** | Idle/listening pills: `Settle Speed` slider edits `base.morphSpeed` (literal seconds). Talking pill: `Morph Speed (→ talking)` edits `talking.morphSpeed` (inherited from `base.morphSpeed` if unset). Thinking pill: empty + a small note "Coral has no thinking pulse — uses idle settings." | Coral speed sliders show **literal seconds, no `≈ visible` hint** (see F9 in slider-range table below). |
| **Motion** | All pills: `Wave Intensity` slider edits `base.waveIntensity` directly. Talking pill additionally shows `Wave Intensity (Peak)` editing `talking.waveIntensity`. `Breath Amp` and `Idle Amp` (base only, shown on all pills). | |
| **Colours** | All pills: `color1` / `color2` / `color3` / `bgColor` (base). Talking pill additionally shows `color3 (Peak)` editing `talking.color3`. | |

Thinking and listening pills for Coral don't have meaningful Peak overrides (Coral has no thinking pulse). Their tabs render as if on idle. The thinking pill shows the "no pulse" note in the Thickness tab so the user understands.

**F8 — Bottom-bar swatch shortcut row stays Tube-only.** Independent of any tab, the editor's bottom bar carries a 3-swatch shortcut row (`color1` / `color2` / `color3`) that lets a user edit core colours without opening the Colours tab. This row is NOT replicated for Coral in this pass — it stays gated on `activeShader === 'kyoto'`. Coral users edit colours from the Colours tab. (Adding a Coral swatch row is a small follow-up if it turns out to be missed; out of scope for 3D-1.)

#### Coral slider ranges (explicit)

> **Speed-label rule (F9, repeated for copy-paste safety):** Coral speed sliders display **literal seconds** (e.g., "1.30s"). They do NOT show the "≈ X.XXs visible" hint that Tube speed sliders use. Tube's hint is tau-derived (exponential animator) — not applicable to Coral, which uses linear-advance morph in literal seconds. Implementer copying from the Tube slider markup must strip the `≈ visible` hint when rendering Coral rows.

| Field | min | max | step | Notes |
|---|---|---|---|---|
| `morphSpeed` (base + talking) | 0 | 4.0 | 0.02 | Literal seconds for full sphere ↔ torus transition. **F4 — value-zero handling.** The slider may go to `0` and the UI may display `0.00s` as "instant," **but neither the live wrapper (`CoralRealtimeBlob`) nor the editor canvas wrapper passes raw `0` to `CoralStoneMorph`.** Both wrappers apply `Math.max(0.001, effectiveMorphSpeed)` before the prop binding. Reason: `CoralStoneMorph` computes `delta / morphSpeed`; with `morphSpeed === 0` and a non-zero `delta`, the result is `Infinity` (then clamped, fine on its own); with `morphSpeed === 0` AND `delta === 0` (rare but possible — first frame after mount, or under throttling), the result is `NaN`, which propagates to `morphRef` and stays there. The floor is small enough that user-facing `0.00s` still feels instant: at the floor, one 16ms frame moves `morphRef` by `delta / 0.001 = 16`, far past the 0–1 clamp range, so saturation is single-frame. **Raw 0 is never safe; the floor is the contract.** Range matches Tube's speed sliders for muscle-memory consistency. **Label: literal seconds, no `≈ visible` hint** (see speed-label rule above). |
| `scale` (base + `talking.scale`) | 0.05 | 1.5 | 0.01 | Same range as Tube's Scale. |
| `torusRadius` (base) | 0.05 | 0.45 | 0.005 | Coral's "ring tightness" — analogous to Tube's tube thickness range. |
| `waveIntensity` (base + `talking.waveIntensity`) | 0 | 1.0 | 0.01 | Same range as Tube's Wave Intensity. |
| `breathAmp` (base) | 0 | 0.1 | 0.005 | Matches Tube's Breath Amp. |
| `idleAmp` (base) | 0 | 0.1 | 0.005 | Matches Tube's Idle Amp. |

Color sliders aren't numeric — the existing color picker (with format toggle) is reused as-is.

#### Tube/Kyoto (`shader === 'kyoto'`):

Existing slider set unchanged. The `≈ X.XXs visible` hint stays on Tube speed sliders (Tube uses tau coefficients).

### Save / rename / new-profile CRUD

**Implementation rule — keep per-source arrays:** the editor maintains two separate state arrays (`coralProfiles: SavedCoralProfile[]` and `kyotoProfiles: SavedKyotoProfile[]`). The combined `orbs` list passed to UI components is **a derived view** computed from these two arrays — never POSTed back. The API endpoint writes the whole array per file, so save MUST update only the relevant source array, not the merged list. Otherwise one file could accidentally receive entries from the other shader.

The four CRUD verbs differ in what they validate:

- **Save (Update):** persist the active profile's *current settings* back to its source file. **Does NOT validate the name** — the active profile's name is already valid (it was either a seed entry or a successfully-created/renamed entry). Routing: `activeOrb.sourceVariant` → its source array (replace entry by `id`, bump `lastModified`) → POST to `?variant=<sourceVariant>`. The other source file is NOT touched.
- **Rename:** change the active profile's name. **Validates the candidate name** (lowercase + trim) against the union of `realtime-coral` + `realtime-state` + gallery-variant names. Same source routing as Save.
- **New profile:** create a new entry. A small modal first asks "New Tube profile or new Coral profile?", then opens a name input. **Validates the candidate name** the same way Rename does. Each choice writes to the right file with a fresh `id` (`rt-coral-${uuid}` or `rt-${uuid}`). Initial settings depend on whether the chosen shader matches the current active shader — see "New-profile starting settings" below.
- **Delete:** OUT OF SCOPE for this pass. Today's dropdown has no delete; adding it is a separate UX change.

The distinction matters because Save runs frequently (every settings tweak) and re-running name validation on each Save would be wasted work — and could spuriously block normal updates if the validation logic ever changes to consider the active name "in use."

### New-profile starting settings

The new-profile modal's two choices behave differently based on the current active shader:

- **Same shader as active** (e.g., editing a Coral profile and choosing "New Coral"): clone the active profile's settings (Save As semantics). User can immediately tweak from a familiar starting point.
- **Different shader from active** (e.g., editing Kyoto and choosing "New Coral"): start from the target shader's fallback default values (`CORAL_FALLBACK_PROFILE` or `NEBULARR_FALLBACK_PROFILE`). The active profile's settings are NOT coerced into the new schema — Coral and Kyoto schemas are not interchangeable.

The new entry is added to the relevant source array, then immediately set as active, switching the canvas + controls to the new shader if needed.

### Name collision rules (across all three sources)

The existing editor already fetches gallery profile names into the `externalProfileNames` state via the `Promise.all(Object.values(GALLERY_API_KEYS).map(fetchProfileNames))` effect to prevent cross-surface collisions. This unification adds two more sources to check:

- `realtime-coral` (this plan's new file).
- `realtime-state` (existing).
- All gallery variant files (existing check, unchanged).

Rename and New-profile (the two CRUD verbs that take a candidate name — see CRUD section above) normalize the candidate name (lowercase, trim) and reject if it collides with ANY name across all three source groups. The error UI is the existing rename-validation pattern (red border + disabled save button), already used by the `profileNameExists` helper. The Save (Update) verb does NOT re-validate the name — the active profile's existing name is already valid by construction.

**Suggestion pool tracks the validation pool (F2).** The editor's `pickRealtimeUnusedName` helper produces a default name for the New-profile flow by sampling `CURATED_NAMES` against a set of "names already in use." That set must mirror exactly what `profileNameExists` checks — gallery names + Kyoto profile names + Coral profile names. If suggestion-pool drifts from validation-pool, the helper can hand back a candidate that the validator immediately rejects, flipping the Save button red on first paint and giving the user a confusing "I haven't typed anything and it's already invalid" experience. v8's round-6 patch already fixed this in code; the rule is documented here so 3F's modal work doesn't regress it.

## Live page changes (`/voiceinterface/realtime`)

Already covered under `VoiceRealtimeOpenAI.tsx`. Net effect:
- Hardcoded `profileThumbs` array deleted.
- Profiles fetched via `Promise.allSettled` with per-shader fallback.
- Strip rendered from `orbs.filter(o => o.pinned)` — Phase 2.5 opt-in. Unpinned profiles are visible in the editor dropdown but NOT on the live page.
- Active orb passed to `RealtimeBlob` as `{ shader, profile }`.
- Dispatch by `shader` inside `RealtimeBlob`.
- localStorage persistence of last-selected orb (composite key, scoped to the pinned subset on default-selection cascade).

## Migration ordering (3 phases, each independently revertable)

### Phase 1 — Data + API (no UI changes, no visual changes)

1. Create `realtime-coral-profiles.json` at repo root with the seed "Coral Realtime" entry.
2. Update `src/pages/api/studio-profiles.ts`: map `?variant=realtime-coral` → `realtime-coral-profiles.json`.
3. Verify: GET returns the seed; POST round-trips. Run `git diff` to confirm only the JSON file changes during a save.

**Rollback:** delete the JSON; revert the API line.

### Phase 2 — Renderer + live page (single-step swap)

4. Create `src/projects/voiceinterface/components/CoralRealtimeBlob.tsx`. Includes its own `CORAL_FALLBACK_PROFILE` constant.
5. Update `src/projects/voiceinterface/components/RealtimeBlob.tsx`: shader-aware dispatch via `RealtimeOrb` discriminated union. Drop `WHIMSY_BASE` / `REALTIME_BASE` imports.
6. Update `src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx`: `Promise.allSettled` fetch, unified `orbs` state, slug-based thumb sources, localStorage default selection.
7. Save `/public/thumbnails/realtime-states/coral-realtime.png` (re-save today's `/thumbnails/realtime-production.png` under the new name) and `/public/thumbnails/realtime-states/_placeholder.png` (a generic neutral thumb).
8. **Verification:** load `/voiceinterface/realtime`. Coral thumb shows the Coral orb (visually identical). Nebularr thumb shows Nebularr (visually identical). Switching plays the appropriate intro on each. Default selection survives a refresh (localStorage).

**Rollback:** revert the three modified files; the new wrapper stays as dead code until removed.

### Phase 3 — Editor wiring

9. Editor: parallel-fetch both files via `Promise.allSettled`. Maintain TWO state arrays (`coralProfiles`, `kyotoProfiles`); the combined `orbs` list passed to UI is a derived view.
10. Editor preview canvas: dispatch by `activeOrb.shader` between `<CoralStoneMorph>` and `<GentleOrbThicken>`.
11. Editor profile dropdown: combined list with leading glyphs.
12. Editor controls panel: Coral slider set per the table above (gated on `activeOrb.shader === 'coral'`). Tube sliders unchanged. Coral slider ranges per the explicit table.
13. Editor `restartIntro`: branch by shader. For Coral, **first** `setPreviewState('idle')`, **then** increment `replayCounter` (passed as `key` on the canvas's Coral renderer) to force remount.
14. Editor save / rename: route by `activeOrb.sourceVariant`. Update only the relevant source array; POST that array to its file. Other file untouched.
15. Editor new-profile: shader-choice modal. Same-shader = clone active settings; different-shader = start from that shader's fallback. New entry pushed to relevant source array, then activated.
16. Editor name validation: collision check across `realtime-coral` + `realtime-state` + gallery variant names.
17. Default selection: composite key persistence via `realtime-states-active-orb-key` localStorage. Fallback chain: persisted → "Kyoto Realtime" → first available (round 7 F3 — flips to Coral-first when 3D-1 ships).
18. **Verification:** switch to Coral profile in the dropdown; canvas renders Coral. Edit `talking.morphSpeed`. Save. `git diff` shows ONLY `realtime-coral-profiles.json` changed. Refresh; both editor and live page pick up the change. Switch to Tube; everything Tube still works. Press Replay while on the Talking pill — Coral resets to idle and plays the sphere → torus morph.

**Rollback:** revert the editor changes; editor falls back to Tube-only.

**Phase 4 (cleanup) was removed.** v3 had a separate cleanup phase that duplicated work already completed in Phase 2:
- "Remove `WHIMSY_BASE`/`REALTIME_BASE` imports from `RealtimeBlob.tsx`" — already done in Phase 2 step 5.
- "`CORAL_FALLBACK_PROFILE` becomes the only path referencing studio constants" — already true after Phase 2 step 4 (the fallback IS where the constants land).

The original `WHIMSY_BASE` + `DEFAULT_STATE_SETTINGS` constants stay defined in `blobStudioTypes.ts` because the gallery and other surfaces may still consume them. Don't delete at the source. This is a non-event, not a phase.

## Verification checklist

End-of-implementation:

- Live `/voiceinterface/realtime`: clicking the Coral thumb shows Coral orb (visually identical to today).
- Live: clicking the Nebularr thumb shows Nebularr orb (visually identical to today).
- Live: switching Coral → Nebularr plays Nebularr's intro.
- Live: switching Nebularr → Coral plays Coral's natural-mount intro (sphere → torus over `base.morphSpeed`).
- Live: localStorage persists the last-selected orb across refreshes (composite key `${sourceVariant}:${id}`, not just `id`).
- Live: if `realtime-coral-profiles.json` is missing or corrupt, Coral falls back to `CORAL_FALLBACK_PROFILE` and the strip still includes a "Coral Realtime" entry. Same for Kyoto failure.
- Live: clicking a Coral thumb mid-conversation (during `ai_speaking`) shows Coral as a sphere with no visible morph until the AI stops — then morphs to torus. Same expectation for Nebularr.
- Editor `/voiceinterface/realtime-states`: dropdown lists both Coral and Tube profiles together with shader glyphs.
- Editor: clicking a Coral profile swaps both the controls AND the preview canvas to Coral.
- Editor: editing `talking.morphSpeed` on Coral and saving updates `realtime-coral-profiles.json` (verify via `git diff` — `realtime-state-profiles.json` must be untouched).
- Editor: clicking back to a Tube profile restores Tube's slider set + Tube renderer; Tube editing still works end-to-end. Saving a Tube profile writes only to `realtime-state-profiles.json`.
- Editor: creating a new profile opens the shader-choice modal; saving writes to the correct file. Same-shader new = clones active settings; different-shader new = starts from that shader's fallback values.
- Editor: rename UI rejects names that collide with any existing profile name across `realtime-coral`, `realtime-state`, and gallery variants (normalized comparison).
- Editor: Replay button on Coral fresh-mounts the canvas and plays the intro **even when previewState was 'talking' before the click** (replay forces idle first); on Kyoto, existing seed-render behavior.
- Editor: ids that collide across files (e.g., both files have `rt-default`) don't break dropdown selection — composite keys disambiguate.
- Live + Editor: clicking the **same** thumb twice in rapid succession while an intro is mid-flight does NOT remount or restart — the second click is a no-op (same component type, same key). Intro continues uninterrupted.
- Live: if **both** profile API endpoints fail (both files missing or corrupted), the strip still shows two thumbs (Coral fallback + Nebularr fallback) and clicking each renders the corresponding orb using the hardcoded fallback settings.
- Editor: if the active profile's source file is deleted mid-session and the user clicks Save, the file is recreated with the in-memory array (the API endpoint creates new files on POST).
- Editor: when audio-active triggers `setState('talking')` on a Coral profile, the canvas's Coral renderer morphs to sphere (`goal=0`) using `talking.morphSpeed`. Confirms the `state` machine drives Coral's canvas dispatch even when the JS animator is gated off.
- TypeScript: `npx tsc --noEmit` clean.
- API: `/api/studio-profiles?variant=realtime-coral` returns the Coral list; `?variant=realtime-state` returns the Kyoto/Tube list (unchanged).

## Files affected (concrete list)

**New:**
- `realtime-coral-profiles.json` — repo root.
- `src/projects/voiceinterface/components/CoralRealtimeBlob.tsx`.
- `public/thumbnails/realtime-states/coral-realtime.png` (renamed copy of `realtime-production.png`).
- `public/thumbnails/realtime-states/_placeholder.png` (generic neutral fallback).

**Modified:**
- `src/pages/api/studio-profiles.ts` — add `realtime-coral` variant mapping.
- `src/projects/voiceinterface/components/RealtimeBlob.tsx` — shader-aware dispatch via `RealtimeOrb`. Drop `WHIMSY_BASE`/`REALTIME_BASE` imports.
- `src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx` — dual-fetch via `Promise.allSettled`, data-driven thumb strip, `LoadedOrb` discriminated union, slug-based thumb src, localStorage default selection.
- `src/pages/voiceinterface/realtime-states.tsx` — combined dropdown with glyphs, shader-aware controls panel, shader-aware preview canvas dispatch, shader-aware `restartIntro` (replay counter for Coral), shader-aware save/rename/new-profile CRUD, localStorage default selection.

**Unchanged:**
- `src/projects/blob-orb/variants/CoralStoneMorph.tsx` — no API change. Native morph animator already does what we need.
- `src/projects/blob-orb/variants/GentleOrbThicken.tsx`.
- `src/projects/voiceinterface/components/useLinkedProfileAnimator.ts`.
- `src/projects/voiceinterface/components/NebularrBlob.tsx`.
- `src/projects/voiceinterface/components/blob-studio/blobStudioTypes.ts` — constants stay defined (gallery still imports).

## Open follow-ups (NOT part of this plan)

- **Tau-unification across Coral.** Coral on the realtime page would adopt the same exponential-tau math Tube uses, with the `≈ X.XXs visible` hint applying to Coral sliders too. Decision deferred per user — "leave the coefficient for later."
- **Migrating gallery Coral profiles to tau.** Even further out; would require re-tuning every saved Coral gallery entry.
- **Adding a `thinking` peak slot to Coral.** Coral today has no thinking-pulse equivalent; idle/listening/thinking are visually identical. Deferred until a use case appears.
- **Profile delete UI.** Today's dropdown has no delete. Adding it is a small UX change but explicitly out of scope this pass.
- **Dirty-edit warning on profile switch.** Today (and after this plan): switching profiles silently discards unsaved edits. A confirmation dialog or auto-save would be a separate UX improvement.
- **Per-profile thumbnail capture.** `scripts/capture-realtime-thumbnails.mjs` is currently **Tube-only** — it drives the realtime-states editor with Tube profiles and saves to `/public/thumbnails/realtime-states/<slug>.png`. After unification:
  - The script needs to read both profile files (or drive the editor with each name in the combined list).
  - The script needs to handle the editor canvas's shader dispatch (rendering Coral when on a Coral profile).
  - Output naming continues to use the slug rule; no path change.
  This is real work, not a config tweak. Out of scope for this plan.
- **A new shader joining the realtime page** (e.g., `radial-inward`). Same pattern: new file, new dispatch branch, new shader-aware controls. The plan above is structured so additional shaders are additive.
- **Per-profile "force intro on selection" toggle (round 7 testing feedback).** Currently the plan's contract is: same-shader switch = prop-only, no intro; cross-shader switch = component swap, intro plays. On the live page, switching between two Tube-shader profiles (Kyoto Realtime ↔ Nebularr) therefore does NOT play the sphere → torus intro, while switching Coral → Tube or Tube → Coral does. User feedback during 3D-0 step-3 testing: they want an opt-in override. Proposed shape: a per-profile `forceIntroOnSelect: boolean` field on the persisted record (same level as `pinned`), defaulting to `false`. When `true`, clicking that profile's thumbnail on the live page (or selecting it in the editor) forces a remount via a counter on the shader's React key — the same mechanism the editor's Replay button uses. UI surface: a small toggle next to the bookmark icon in the editor's profile row, plus the schema bump on both `realtime-state-profiles.json` and `realtime-coral-profiles.json`. Out of scope for 3D-0; revisit after 3D-1/3E land so the field round-trips through the same Save path as `pinned`.
- **First-paint flash on editor reload (round 7 testing feedback round 4).** When the persisted profile is NOT Kyoto Realtime (e.g. Coral or Nebularr), reloading `/voiceinterface/realtime-states` shows the Kyoto seed for ~150ms before cascade applies the persisted choice. Root cause: useState defaults are Kyoto-shaped (`activeId='rt-kyoto'`, `profile=KYOTO_SEED`, `activeOrbKey='realtime-state:rt-kyoto'`), and cascade runs in an async `useEffect` after both fetches resolve. There's a window where reads see the Kyoto defaults before reads see the cascade-applied state. Proposed fix (deferred until step 5 deletes mirrors): (a) lazy-init `activeOrbKey` from localStorage in the `useState` initializer so the first render knows the persisted key; (b) render a neutral skeleton (or hide the canvas) until `kyotoLoaded && coralLoaded` is true. The R3F WebGL init blank rectangle is independent — that's inherent to `<Canvas>` mount and would need a saved-thumbnail placeholder to mask. Lower priority than core 3D-0/3D-1 work; a polish commit after step 6 is the right time.

- **Coral thinking pulse (post-3D-1 testing feedback).** The plan's Coral controls table says "Coral has no thinking pulse — uses idle settings" and the editor's Thickness tab on the Thinking pill renders that as a placeholder note. **This claim is wrong.** `LoopingBlob.tsx` (used on the home page's Voice UI Library demo card via `PreviewVoiceAnimated`) renders a `<CoralStoneMorph>` AND animates `torusRadius` itself during the thinking state via a `setPulseRadius` RAF loop (`LoopingBlob.tsx:200-213`). The animation cycles `torusRadius` between `base.thinRadius` and `base.thickRadius` while voiceState is `thinking`, then resets to `null` on exit. Net effect: Coral D pulses during thinking just like Tube does. To bring this to our realtime page + editor: (a) port the `setPulseRadius` mechanism into `CoralRealtimeBlob` so it consumes a `thickRadius` (or analogous) field; (b) extend the Coral schema with `base.thickRadius` (or rename the existing `torusRadius` semantics — TBD); (c) add a Thinking pill UI to the Coral Thickness tab with thickRadius + a pulse-speed slider; (d) replace the "Coral has no thinking pulse" placeholder note. **Stretch idea (deferred further):** the user proposed time-bounding the thinking-pulse cycle against the actual API response duration — if the model returns a streaming token before one full pulse cycle completes, the pulse short-circuits to talking; if the response takes longer, more pulse cycles play. Interesting but would need response-timing telemetry plumbed from the realtime SDK. Basic version (mirror LoopingBlob) is the right first cut.

- **Coral fork-from-clean-A semantics.** When user has Coral A active with unsaved slider edits and clicks Save → Coral → "Coral B": the new B profile is created with the edited settings (correct, that's a fork), but because `persistCoralProfiles` writes the entire `coralProfiles` array to disk and slider edits dual-write through the immutable helpers into A's source-array entry, A's unsaved edits ALSO get persisted as a side effect. Symmetric issue exists on Tube. Proposed fix: in `handleSave`'s same-shader-fork branch, build the persist array with the active profile's BASELINE settings instead of its current source-array settings — so the on-disk version of A reverts to last-saved while the new B carries the edits. Test: edit Coral A → fork to B → A on disk should match A's last-saved state, B should have the edited values. Out of scope for 3D-0/3F; revisit when forking semantics become a felt issue.

- **Refactor: split realtime-states.tsx into focused modules (post-3D testing feedback).** File is currently ~2900 lines after 3D-0 + 3D-1 + 3E + 3F. Too big for one file by any reasonable standard. Proposed 4-file split (shader-agnostic naming — no "Kyoto" or "Coral" in module names, since shaders are stable but profile names aren't):
    - `realtime-states/types.ts` (~250 lines): type definitions (`LoadedOrb`, `BaselineSnapshot`, `SavedProfile`, `SavedCoralProfile`, `DropdownRow`, `RenderValues`, `ControlTab`, `PeakScope`) + small pure helpers (`compositeKey`, `normalizeProfileName`, color conversion utilities `hexToRgb` / `rgbToHsl` / `rgbToHex`).
    - `realtime-states/api.ts` (~80 lines): I/O layer — `fetchProfiles`, `persistProfiles`, `fetchCoralProfiles`, `persistCoralProfiles`, `fetchProfileNames`.
    - `realtime-states/controls.tsx` (~1000 lines): both tab renderers (Tube + Coral) plus their shared UI primitives (`SliderRow`, `PeakSliderRow`, `ColorFormatControl`, `EditableColorValue`, `ColorChannelFields`, `ColorPickerButton`, `RealtimeColorRow`, `PeakColorRow`). One file = "everything inside the controls bar."
    - `realtime-states/index.tsx` (~1500 lines): the page component itself — state machine, useEffects, action handlers, dropdown, save dialog, canvas dispatch, bottom bar JSX.
  Naming rule: shader names (`Tube`, `Coral`) stay agnostic of saved-profile names (`Kyoto Realtime`, `Nebularr`, `Coral Realtime`) — if a profile is renamed tomorrow, the file/function names shouldn't churn. Each file has a single named purpose; debugging localizes cleanly. Most code lives in `index.tsx` and `controls.tsx`; `types.ts` and `api.ts` are infrastructure files only touched when adding a new type or persistence path. Tighter 3-file alternative: merge types + api into a single `lib.ts` — viable if 4 feels like too many; 4 reads more cleanly because types and api have different reasons to change. Out of scope for 3D-0; queue as a polish commit after Step 6 verification.

## Note on plan-review limits (lessons from v4 → v5)

A self-run plan-review skill pass was run on v3 to produce v4. The human reviewer of v4 then surfaced six findings the self-run pass had missed. Captured here so the next planner doesn't repeat the gap.

**Three patterns explain the misses:**

1. **Symbols verified, data plumbing not traced.** The self-run pass confirmed that `audioData` flows to the Canvas and `morphSpeed` reaches the shader. It did NOT check whether the existing canvas pre-processes `audioData` (the `blobAudioData = audioActive && state !== 'idle' ? audioData : SILENT` gate) or whether `morphSpeed === 0` is mathematically safe (`delta / 0 → NaN` propagates). Findings 1 and 4 were both this. Lesson: for every prop binding in pseudocode, find the existing real binding and walk the data, not just the name.
2. **Verification section not cross-checked line-by-line against implementation.** The verification line "the strip still includes a 'Coral Realtime' entry" contradicted the implementation line `name: 'Coral'` for the fallback. The self-run pass treated Dimension 2 (internal consistency) as a vibe check rather than a literal walkthrough. Finding 2. Lesson: read each verification bullet, find the implementation it derives from, confirm equality.
3. **CRUD-verb conflation.** "Save and rename normalize the candidate name" lumped together verbs with different validation rules. The self-run pass missed this under Dimension 5 (contract clarity). Finding 6. Lesson: enumerate each CRUD verb, name what each one validates, treat verbs with different inputs as distinct.

**One miss that is genuinely harder to catch automatically:** Finding 3 (same-shader profile-switch intro behavior). The plan said "no intro on same-shader switch" in one section and "activeOrbKey used everywhere as the React key" in another, and these weren't logically incompatible (the second statement was loose phrasing). Catching this would require building an internal model of "what changes a React component identity" and walking it. Worth a future plan-review-pattern note.

**Findings 5** (background sourcing) is a polish-completeness item — the plan didn't actually mislead an implementer, just left a gap. Acceptable miss.

### Additional lesson from v5 → v6

Round 4 surfaced a different failure mode: **edits introduce new contradictions if consistency isn't re-checked after each edit pass.** v5 added the same-shader-no-remount rule in one section but didn't propagate the implication back to the earlier `activeOrbKey` description that still called it "the React key." The two sections were separately correct in isolation, contradictory together. Plus a numeric typo (`0.0005` for a `0.001` floor) and a verification mechanism (console assertion in the unchanged shader file) that contradicted the file's "Unchanged" classification.

Lesson: after each substantive edit pass, re-walk Dimension 2 (internal consistency) at minimum — read every paragraph that names the concept being edited, not just the paragraph being edited. The cost is one extra pass; the cost of skipping it is another reviewer round.

### Additional lesson from v7 → v8

Round 5 hit a new failure mode the earlier rounds had not exposed: **plan-vs-code drift after partial implementation.** v7 was correct as a design document, but the Phase 3c commit (`3845738`) shipped same-shader Coral switching with `selectCoralProfile` bumping `replayCounter` AND a canvas key of `coral-${activeCoralId}-${replayCounter}` — both of which directly contradict the plan's "no intro on same-shader switch" rule. v7's "Implementation status" table claimed Phase 3c shipped "as designed," but it didn't. Three findings of this round (F1, F3, F6) are all variants of the same pattern: the plan describes a correct intent; the code actually shipped does something else; the status table records "shipped" without checking which.

Three concrete lessons:

1. **Status-table entries must be checked against the actual code, not the plan.** When marking a phase "shipped," the reviewer (or self-reviewer) should open the relevant file at the named symbol and confirm the behavior matches the plan paragraph that describes it. v7's table conflated "code landed" with "code matches plan." After v8 the rule is: every shipped row links to a commit hash AND cites the source file + symbol the reviewer can open to verify.
2. **Verbs in the status table matter.** v7 said the interim guard "replaces" the placeholder text, but the code "shows" it. Tiny wording, but the implementation reviewer reads "replaces" as "the placeholder is no longer there" and gets confused. Each status row must use the verb that matches what the code actually does.
3. **Validation that touches multiple source files must be implemented at the time the first file gets multi-source CRUD, not deferred.** v7 deferred cross-source name validation to Phase 3G, but Phase 3b shipped Coral rename — which is exactly the path that needs the validation. Deferring opened a window where two Coral entries can collide. Rule: when CRUD verbs land, their validation lands the same commit. Don't park validation in a "later" phase if the verb is shipping now.

These three patterns explain why the v8 patch ships *with* the v8 plan amendment rather than after: the plan-amendment-only path would leave the contradictions visible to anyone reading code-vs-plan together.

## Scope estimate

**3–4 hours focused work**, distributed:

- Phase 1: ~15 min (file + API line + verification).
- Phase 2: ~75 min (`CoralRealtimeBlob`, `RealtimeBlob` refactor, `VoiceRealtimeOpenAI` dual-fetch + strip + localStorage, thumbnail re-save).
- Phase 3: ~120 min (editor state-model migration, parallel Coral peak helpers, JS animator gating, combined dropdown, shader-aware canvas dispatch, Coral controls per the table, replay counter + restartIntro branch, new-profile modal, save routing). Bumped from v3's 90 min after the state-model migration was made explicit.

Plus verification time at each phase boundary.
