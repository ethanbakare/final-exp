# Coral Unification Plan (v7)

> v7 reflects what's actually shipped vs what's next-in-line after the first
> implementation pass. v1–v6 changelogs kept below for context. v7 changes:
> - Implementation status table added (top of "Implementation status" section).
> - Phase 3 split into 3a/3b/3c (shipped) and 3d/3e/3f/3g (next in line).
> - Interim editor guard: when a Coral profile is active, the Tube-shaped
>   tabs / expanded panel / Update / Discard buttons are hidden. The user
>   can Bookmark, Rename, Replay, switch profiles, and use state pills.
>   Replaces the placeholder text "Coral tuning controls coming next".
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

## Implementation status (as of v7)

What has shipped, what's next in line, and what changed during implementation vs the design.

### Shipped

| Step | Description | Commit |
|---|---|---|
| Phase 1 | `realtime-coral-profiles.json` seed at repo root + `?variant=realtime-coral` API mapping. | `3ceeae6` |
| Phase 2 | `CoralRealtimeBlob.tsx` (pure renderer), shader-aware `RealtimeBlob` dispatch, `VoiceRealtimeOpenAI` parallel fetch + data-driven thumbnail strip + composite-key localStorage default. Thumbnails copied to slug-based path. | `d249de9` |
| Phase 2.5 (added during impl) | `pinned: boolean` opt-in. Live page strip filters to `pinned===true` so profiles only show on the live page when explicitly pinned. Was originally "auto-show union of both files" in the design — corrected to explicit opt-in after a review round. | `5c4594d` |
| Phase 3a | Bookmark toggle in editor profile dropdown rows. | `1d92825` |
| Phase 3b | Coral entries appear in editor dropdown with shader glyphs (`Disc` for Tube/Kyoto in olive, `Circle` for Coral D in peach). Bookmark + rename for Coral entries persist to the Coral file. | `1bb595f` |
| Phase 3c | Editor preview canvas dispatches by shader (`<CoralStoneMorph>` when Coral active, `<GentleOrbThicken>` when Kyoto). Replay button branches by shader. Coral selection bumps a `replayCounter` keyed on the canvas → morphRef remount → sphere → torus intro. | `3845738` |
| Standalone UX | Active-shader glyph next to closed-dropdown trigger; standalone bookmark button in bottom bar (next to Replay/Auto-loop). | `a5b9799` |
| Interim guard | When a Coral profile is active, hide Tube-shaped tabs / expanded panel / Update / Discard buttons. Replace with placeholder text. Prevents accidental edits to Tube state while looking at Coral canvas. | (this milestone commit) |

### Next in line (NOT yet shipped — these are the remaining Phase 3 items)

| Step | Description |
|---|---|
| Phase 3d | **Coral controls panel.** Editor's tabs need shader-aware variants for Coral. Per the plan's earlier table: `Scale (base + talking peak)`, `Torus Radius (base)`, `Settle Speed = base.morphSpeed`, `Morph Speed = talking.morphSpeed`, `Wave Intensity (base + talking peak)`, `Breath Amp (base)`, `Idle Amp (base)`, color1/2/3 + bgColor (base) and `color3 (talking peak)`. Slider ranges per the explicit table further below. Today the tabs are simply hidden when Coral is active. |
| Phase 3e | **Save (Update) routing for Coral edits.** Once Coral controls exist, an `isDirtyCoral` signal compares the active Coral settings against `activeCoralBaseline`. The Update button writes via `persistCoralProfiles` to `realtime-coral-profiles.json`. Discard reverts to baseline. Currently Update/Discard are gated on `activeShader === 'kyoto'`. |
| Phase 3f | **New-profile shader-choice modal.** "Save current state to new profile" should ask which shader (Tube or Coral) before opening the name input. Same-shader = clone active settings; different-shader = start from that shader's fallback. Today the existing save dialog only creates Tube profiles. |
| Phase 3g | **Cross-source name-collision validation.** `profileNameExists` currently checks Tube + gallery names; needs to also check Coral entries. Trivial change once 3d/3e land. |

### Known limitations of the current shipped state (until 3d–3g land)

- Coral profile is **viewable** but not **tunable** in the editor — selecting a Coral entry shows the canvas + bookmark + rename, but no slider edits are possible.
- A user with a saved Coral profile can edit its values directly via JSON file (`realtime-coral-profiles.json`) and refresh; the editor will pick up the change in the dropdown and on the canvas.
- The live realtime page is fully functional regardless — pin/unpin via the editor, both shaders render correctly, intros play on shader switch.

## What we're trying to achieve

The realtime page (`/voiceinterface/realtime`) currently swaps between two visually distinct orbs — Coral and Nebularr. Nebularr's behavior flows from saved profile data in `realtime-state-profiles.json`, edited via `/voiceinterface/realtime-states`. Coral's behavior is hardcoded into TypeScript constants (`WHIMSY_BASE`, `DEFAULT_STATE_SETTINGS`) and can only be tweaked via code changes.

The goal is to give Coral the same editable, data-driven setup Nebularr already has, **without touching either shader's visual identity**:

- A saved profile file for Coral, parallel to the existing one for Nebularr.
- The realtime-states editor reads + writes both, with shader-aware controls **and** a shader-aware preview canvas.
- The live realtime page's thumbnail strip becomes data-driven (iterates the union of both files).
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

**Initial seed entry (one):**
```jsonc
{
  "id": "rt-coral-default",
  "name": "Coral Realtime",
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
      settings: CoralRealtimeProfile['settings'];
      lastModified: number;
    }
  | {
      shader: 'kyoto';
      sourceVariant: 'realtime-state';
      id: string;
      name: string;
      settings: LinkedProfile;
      lastModified: number;
    };
```

`sourceVariant` lets save/rename/new-profile CRUD route back to the right file without re-deriving from `shader`.

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

Concrete consequence:

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
  settings: { /* values from the seed table above */ },
  lastModified: 0,                         // 0 = "never persisted"
};

const NEBULARR_FALLBACK_ORB: LoadedOrb = {
  shader: 'kyoto',
  sourceVariant: 'realtime-state',
  id: 'rt-nebularr-fallback',
  name: 'Nebularr',                        // matches the existing realtime-state-profiles.json entry name
  settings: { /* values from current NEBULARR_FALLBACK_PROFILE in NebularrBlob.tsx */ },
  lastModified: 0,
};
```

The fallback orb only loads when the file fetch returns nothing (missing file, malformed JSON, or empty array). In that case, no real entry exists with the same `name`, so collision is not a real risk. Using `'Coral Realtime'` matches the verification checklist's expectation ("the strip still includes a 'Coral Realtime' entry") and keeps default-selection lookup uniform whether or not the file is present. `lastModified: 0` makes any saved entry preferred in any sort-by-recency UI.

**Thumbnail strip:** iterates `orbs`. Each thumb's image src derived from a slug rule:

```ts
const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const thumbSrc = `/thumbnails/realtime-states/${slug(orb.name)}.png`;
// On <img> error, falls back to /thumbnails/realtime-states/_placeholder.png
```

For the seed Coral entry: name "Coral Realtime" → slug "coral-realtime" → expected thumb `/thumbnails/realtime-states/coral-realtime.png`. We re-save today's `/thumbnails/realtime-production.png` under this name (or add an alias) as part of Phase 2.

For existing Kyoto entries: "Kyoto Realtime" → "kyoto-realtime", "Nebularr" → "nebularr". The Nebularr thumb already exists at `/thumbnails/realtime-states/nebularr.png`; the Kyoto Realtime thumb may need to be captured.

`RealtimeBlob` receives `orb={ shader, profile: settings }` for the active orb.

### Editor preview canvas — shader-aware dispatch (NEW REQUIREMENT)

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
| `activeBaseline: LinkedProfile` (for dirty detection) | becomes `activeBaseline: LoadedOrb \| null`; dirty check compares the active settings against the baseline of the same shader |
| (none) | `replayCounter: number` (Coral remount trigger) |

The combined `orbs` list is a derived view (`useMemo`) over the two source arrays, exactly as in `VoiceRealtimeOpenAI`. `activeOrb` is derived from `activeOrbKey + orbs`.

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

Same rule and same composite-key format as the live page: localStorage `realtime-states-active-orb-key` (composite `${sourceVariant}:${id}`) → "Coral Realtime" entry → first available. The two pages use different localStorage keys (`realtime-active-orb-key` for the live page; `realtime-states-active-orb-key` for the editor) so each surface can remember its own last selection independently.

### Dirty-edit behavior on switch

Switching to a different profile via the dropdown discards unsaved edits to the previous profile (matches today's behavior — there's no warning prompt). The `Discard` and `Update` buttons in the bottom bar remain the explicit save mechanism. Adding a "you have unsaved edits" warning is a separate UX improvement, not part of this pass. **Documented behavior: discard, no warning.**

### Shader-aware controls panel

Tabs stay (Size, Thickness, Motion, Colours). Slider set differs by active shader:

#### Coral (`shader === 'coral'`):

| Tab | Controls per pill | Notes |
|---|---|---|
| **Size** | Idle/listening/thinking pills: `Scale` editing `base.scale`. Talking pill: `Scale (Peak)` editing `talking.scale` (PeakSliderRow, inherited if unset). All pills also show `Torus Radius` editing `base.torusRadius`. | `talking.scale` is the only Peak slot for size. |
| **Thickness** | Idle/listening pills: `Settle Speed` (`base.morphSpeed`, literal seconds). Talking pill: `Morph Speed (→ talking)` (`talking.morphSpeed`, inherited if unset). Thinking pill: empty + a small note "Coral has no thinking pulse — uses idle settings". | The `≈ X.XXs visible` hint **does NOT apply to Coral sliders** — Coral's morphSpeed is already literal seconds. |
| **Motion** | All pills: `Wave Intensity` editing `base.waveIntensity`. Talking pill additionally shows `Wave Intensity (Peak)` editing `talking.waveIntensity`. `Breath Amp` and `Idle Amp` (base only, all pills). | |
| **Colours** | All pills: `color1` / `color2` / `color3` / `bgColor` (base). Talking pill additionally shows `color3 (Peak)` editing `talking.color3`. | |

Thinking and listening pills for Coral don't have meaningful Peak overrides (Coral has no thinking pulse). Their tabs render as if on idle. The thinking pill shows the "no pulse" note in the Thickness tab so the user understands.

#### Coral slider ranges (explicit)

| Field | min | max | step | Notes |
|---|---|---|---|---|
| `morphSpeed` (base + talking) | 0 | 4.0 | 0.02 | Literal seconds for full transition. **At `0`, `delta / 0` → Infinity → `morphRef` snaps to `goal` each frame → effectively instant.** Documented behavior; the existing animator handles it gracefully (`Math.min(1, ...)` / `Math.max(0, ...)` clamps the result). Range matches Tube's speed sliders for muscle-memory consistency. |
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

## Live page changes (`/voiceinterface/realtime`)

Already covered under `VoiceRealtimeOpenAI.tsx`. Net effect:
- Hardcoded `profileThumbs` array deleted.
- Profiles fetched via `Promise.allSettled` with per-shader fallback.
- Strip rendered from unified `orbs` list.
- Active orb passed to `RealtimeBlob` as `{ shader, profile }`.
- Dispatch by `shader` inside `RealtimeBlob`.
- localStorage persistence of last-selected orb.

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
17. Default selection: composite key persistence via `realtime-states-active-orb-key` localStorage. Fallback chain: persisted → "Coral Realtime" → first available.
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

## Scope estimate

**3–4 hours focused work**, distributed:

- Phase 1: ~15 min (file + API line + verification).
- Phase 2: ~75 min (`CoralRealtimeBlob`, `RealtimeBlob` refactor, `VoiceRealtimeOpenAI` dual-fetch + strip + localStorage, thumbnail re-save).
- Phase 3: ~120 min (editor state-model migration, parallel Coral peak helpers, JS animator gating, combined dropdown, shader-aware canvas dispatch, Coral controls per the table, replay counter + restartIntro branch, new-profile modal, save routing). Bumped from v3's 90 min after the state-model migration was made explicit.

Plus verification time at each phase boundary.
