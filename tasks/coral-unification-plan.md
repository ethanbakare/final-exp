# Coral Unification Plan (v2)

> v2 incorporates feedback from review of v1. See git history for v1; major changes in v2:
> - Editor's preview canvas now explicitly dispatches by shader (was missing).
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
      "torusRadius": 0.3,
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

Values mirror today's `WHIMSY_BASE` + `DEFAULT_STATE_SETTINGS.talking` exactly. Initial migration is a value-preserving copy.

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
    const persisted = window.localStorage.getItem('realtime-active-orb-id');
    const persistedExists = persisted && merged.find(o => o.id === persisted);
    const coralDefault = merged.find(o => o.name === 'Coral Realtime');
    setActiveOrbId(persistedExists ? persisted : (coralDefault?.id ?? merged[0]?.id ?? null));
  });
}, []);
```

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
- **Coral:** increments `replayCounter`, which forces `<CoralStoneMorph>` to remount → `morphRef` resets to 0 → native animator advances toward `goal=1` → intro plays.

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

#### Tube/Kyoto (`shader === 'kyoto'`):

Existing slider set unchanged. The `≈ X.XXs visible` hint stays on Tube speed sliders (Tube uses tau coefficients).

### Save / rename / new-profile CRUD

- **Save:** writes to whichever file the active profile came from, identified by `activeOrb.sourceVariant` (`'realtime-coral'` or `'realtime-state'`).
- **Rename:** writes to the same file. Existing rename UI in the dropdown carries over unchanged.
- **New profile:** a small modal asks "New Tube profile or new Coral profile?" before opening the name input. Each choice writes to the right file with a fresh `id` (`rt-coral-${uuid}` or `rt-${uuid}`).
- **Delete:** OUT OF SCOPE for this pass. Today's dropdown has no delete; adding it is a separate UX change.

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

9. Editor: parallel-fetch both files via `Promise.allSettled`. Build combined `orbs` list with `LoadedOrb` discriminated union.
10. Editor preview canvas: dispatch by `activeOrb.shader` between `<CoralStoneMorph>` and `<GentleOrbThicken>`.
11. Editor profile dropdown: combined list with leading glyphs.
12. Editor controls panel: Coral slider set per the table above (gated on `activeOrb.shader === 'coral'`). Tube sliders unchanged.
13. Editor `restartIntro`: branch by shader. For Coral, increment `replayCounter` (passed as `key` on the canvas's Coral renderer) to force remount.
14. Editor save / rename / new-profile: route by `activeOrb.sourceVariant`. New-profile modal added.
15. Default selection: localStorage `realtime-states-active-id` → "Coral Realtime" → first available.
16. **Verification:** switch to Coral profile in the dropdown; canvas renders Coral. Edit `talking.morphSpeed`. Save. `git diff` shows only `realtime-coral-profiles.json` changed. Refresh the editor and the live page; both pick up the change. Switch back to a Tube profile; everything Tube still works end-to-end.

**Rollback:** revert the editor changes; editor falls back to Tube-only.

### Phase 4 — Cleanup (after ~1 week of confidence)

17. Inside `CoralRealtimeBlob`, the `CORAL_FALLBACK_PROFILE` constant becomes the *only* path that references `WHIMSY_BASE` / `DEFAULT_STATE_SETTINGS` (and only on API failure). Remove unused imports of these constants from `RealtimeBlob.tsx` if no longer referenced.
18. The original constants stay defined in `blobStudioTypes.ts` because the gallery and other surfaces may still consume them. Don't delete at the source.

## Verification checklist

End-of-implementation:

- Live `/voiceinterface/realtime`: clicking the Coral thumb shows Coral orb (visually identical to today).
- Live: clicking the Nebularr thumb shows Nebularr orb (visually identical to today).
- Live: switching Coral → Nebularr plays Nebularr's intro.
- Live: switching Nebularr → Coral plays Coral's natural-mount intro (sphere → torus over `base.morphSpeed`).
- Live: localStorage persists the last-selected orb across refreshes.
- Live: if `realtime-coral-profiles.json` is missing or corrupt, Coral falls back to `CORAL_FALLBACK_PROFILE` and the strip still includes a "Coral Realtime" entry. Same for Kyoto failure.
- Editor `/voiceinterface/realtime-states`: dropdown lists both Coral and Tube profiles together with shader glyphs.
- Editor: clicking a Coral profile swaps both the controls AND the preview canvas to Coral.
- Editor: editing `talking.morphSpeed` on Coral and saving updates `realtime-coral-profiles.json` (verify via `git diff`).
- Editor: clicking back to a Tube profile restores Tube's slider set + Tube renderer; Tube editing still works end-to-end.
- Editor: creating a new profile opens the shader-choice modal; saving writes to the correct file.
- Editor: Replay button on Coral fresh-mounts the canvas and plays the intro; on Kyoto, existing seed-render behavior.
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
