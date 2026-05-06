# Coral Unification Plan (v3)

> v3 incorporates a second round of review feedback. v1 → v2 changelog kept below for context; v3 changes:
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
| `scale` | `REALTIME_BASE.scale = 1.04` | RealtimeBlob.tsx line 47 — overrides `WHIMSY_BASE.scale = 0.55` |
| `torusRadius` | `REALTIME_BASE.thinRadius = 0.275` | RealtimeBlob.tsx line 99 passes `thinRadius` as the `torusRadius` prop. **Not** `WHIMSY_BASE.torusRadius = 0.3`. |
| `waveIntensity` | `DEFAULT_STATE_SETTINGS.idle.waveIntensity = 0.18` | base value (talking overrides to 0.20) |
| `breathAmp` | `DEFAULT_STATE_SETTINGS.idle.breathAmp = 0.03` | |
| `idleAmp` | `DEFAULT_STATE_SETTINGS.idle.idleAmp = 0.02` | |
| `morphSpeed` (base) | `DEFAULT_STATE_SETTINGS.idle.thickenSpeed × 1.08 = 1.296` | RealtimeBlob.tsx line 82 multiplies by `1.08` |
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
- **Renders** `<CoralStoneMorph audioData goal morphSpeed scale torusRadius waveIntensity breathAmp idleAmp color1 color2 color3 />` with the effective values above.

**Intro behavior (no extra code needed):**

When the user clicks the Coral thumbnail on the live page, `RealtimeBlob` swaps from `<NebularrBlob>` to `<CoralRealtimeBlob>` — different component types, so React unmounts the old and mounts the new fresh. `CoralRealtimeBlob` mounts → `CoralStoneMorph` mounts → `morphRef = 0` (sphere). If the default `voiceState` is `idle`, `goal = 1` → native animator advances `morph: 0 → 1` over `base.morphSpeed` seconds. That IS the intro.

Switching from one Coral profile to another (e.g., editor swapping between two Coral entries) does NOT trigger an intro because `CoralRealtimeBlob` stays mounted; only props change. For the editor's Replay button, we use a `key={replayCounter}` prop on `CoralStoneMorph` (or on `CoralRealtimeBlob`) that increments on click → forces a remount → intro plays.

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
const [activeOrbId, setActiveOrbId] = useState<string | null>(null);

useEffect(() => {
  const fetchVariant = async <T,>(variant: string, shader: 'coral' | 'kyoto'): Promise<LoadedOrb[]> => {
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
      })) : [];
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
    const composite = (o: LoadedOrb) => `${o.sourceVariant}:${o.id}`;
    const persisted = window.localStorage.getItem('realtime-active-orb-key');
    const persistedExists = persisted && merged.find(o => composite(o) === persisted);
    const coralDefault = merged.find(o => o.name === 'Coral Realtime');
    setActiveOrbKey(persistedExists ? persisted : (coralDefault ? composite(coralDefault) : (merged[0] ? composite(merged[0]) : null)));
  });
}, []);
```

`activeOrbKey` is the composite `${sourceVariant}:${id}` string used everywhere as the React key, dropdown selection, localStorage value, and source-list lookup. The same composite-key convention applies in the editor.

`CORAL_FALLBACK_ORB` and `NEBULARR_FALLBACK_ORB` are hardcoded constants in this file (or imported from each shader's wrapper).

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
      audioData={audioData}
      goal={previewState === 'talking' ? 0 : 1}
      morphSpeed={effectiveCoralMorphSpeed}
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

The editor's existing `restartIntro` action stays, but branches by shader:

- **Kyoto:** existing path — seeds `render` via `introRender(profile)`, sets `state='idle'`, lets the JS animator settle. Unchanged.
- **Coral:** **first** sets `previewState='idle'`, **then** increments `replayCounter`. Both are required: the canvas pseudocode binds `goal = previewState === 'talking' ? 0 : 1`, so if the user is on the Talking pill and presses Replay, the remounted `CoralStoneMorph` would start at `morphRef=0` AND `goal=0` — nothing would morph. Forcing idle first ensures the remount lands with `goal=1`, so `morphRef` advances `0 → 1` and the sphere → torus intro plays. (Mirrors what Kyoto's restartIntro already does at line 929 of today's editor.)

## Editor changes (`/voiceinterface/realtime-states`)

### Profile dropdown — combined list with shader glyphs

The profile menu (currently around line 1734) lists entries from both files via the same `Promise.allSettled` pattern as the live page. Each row has a leading glyph:

- **Coral** entries: a small `Circle` lucide icon, or a 1-character chip `C`, in Coral's signature peach color.
- **Tube/Kyoto** entries: a small `Disc` lucide icon, or a 1-character chip `T`, in Kyoto's olive color.

Final glyph TBD when seen rendered. Both options use lucide icons already imported in this file.

Rows show: `[glyph] [name]` with rename action to the right (no delete in this pass).

### Default selection on load

Same rule as live page: localStorage `realtime-states-active-id` → "Coral Realtime" entry → first available.

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

- **Save:** identifies the active source via `activeOrb.sourceVariant`. Updates the corresponding source array (replace entry by `id`, bump `lastModified`). POSTs that array verbatim to `?variant=<sourceVariant>`. The other source file is NOT touched.
- **Rename:** same routing as Save. Existing rename UI in the dropdown carries over.
- **New profile:** a small modal asks "New Tube profile or new Coral profile?" before opening the name input. Each choice writes to the right file with a fresh `id` (`rt-coral-${uuid}` or `rt-${uuid}`). Initial settings depend on whether the chosen shader matches the current active shader — see "New-profile starting settings" below.
- **Delete:** OUT OF SCOPE for this pass. Today's dropdown has no delete; adding it is a separate UX change.

### New-profile starting settings

The new-profile modal's two choices behave differently based on the current active shader:

- **Same shader as active** (e.g., editing a Coral profile and choosing "New Coral"): clone the active profile's settings (Save As semantics). User can immediately tweak from a familiar starting point.
- **Different shader from active** (e.g., editing Kyoto and choosing "New Coral"): start from the target shader's fallback default values (`CORAL_FALLBACK_PROFILE` or `NEBULARR_FALLBACK_PROFILE`). The active profile's settings are NOT coerced into the new schema — Coral and Kyoto schemas are not interchangeable.

The new entry is added to the relevant source array, then immediately set as active, switching the canvas + controls to the new shader if needed.

### Name collision rules (across all three sources)

The existing editor already fetches gallery profile names into `externalProfileNames` to prevent cross-surface collisions (lines 962-965 of today's `realtime-states.tsx`). This unification adds two more sources to check:

- `realtime-coral` (this plan's new file).
- `realtime-state` (existing).
- All gallery variant files (existing check).

Save and rename normalize the candidate name (lowercase, trim) and reject if it collides with ANY name across all three source groups. The error UI is the existing rename-validation pattern (red border + disabled save button). New-profile modal applies the same check before allowing creation.

## Live page changes (`/voiceinterface/realtime`)

Already covered under `VoiceRealtimeOpenAI.tsx`. Net effect:
- Hardcoded `profileThumbs` array deleted.
- Profiles fetched via `Promise.allSettled` with per-shader fallback.
- Strip rendered from unified `orbs` list.
- Active orb passed to `RealtimeBlob` as `{ shader, profile }`.
- Dispatch by `shader` inside `RealtimeBlob`.
- localStorage persistence of last-selected orb.

## Migration ordering (4 phases, each independently revertable)

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

### Phase 4 — Cleanup (after ~1 week of confidence)

19. Inside `CoralRealtimeBlob`, the `CORAL_FALLBACK_PROFILE` constant becomes the *only* path that references `WHIMSY_BASE` / `DEFAULT_STATE_SETTINGS` (and only on API failure). Remove unused imports of these constants from `RealtimeBlob.tsx` if no longer referenced.
20. The original constants stay defined in `blobStudioTypes.ts` because the gallery and other surfaces may still consume them. Don't delete at the source.

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

## Scope estimate

**3–4 hours focused work**, distributed:

- Phase 1: ~15 min (file + API line + verification).
- Phase 2: ~75 min (`CoralRealtimeBlob`, `RealtimeBlob` refactor, `VoiceRealtimeOpenAI` dual-fetch + strip + localStorage, thumbnail re-save).
- Phase 3: ~90 min (combined dropdown, shader-aware canvas dispatch, Coral controls per the table, replay counter, new-profile modal, save routing).
- Phase 4: ~10 min (cleanup after verification window).

Plus verification time at each phase boundary.
