# Coral Unification Plan

## What we're trying to achieve

The realtime page (`/voiceinterface/realtime`) currently swaps between two visually distinct orbs — Coral and Nebularr. Nebularr's behavior flows from saved profile data in `realtime-state-profiles.json`, edited via `/voiceinterface/realtime-states`. Coral's behavior is hardcoded into TypeScript constants (`WHIMSY_BASE`, `DEFAULT_STATE_SETTINGS`) and can only be tweaked via code changes.

The goal is to give Coral the same editable, data-driven setup Nebularr already has, **without touching either shader's visual identity**:

- A saved profile file for Coral, parallel to the existing one for Nebularr.
- The realtime-states editor reads + writes both, with shader-aware controls.
- The live realtime page's thumbnail strip becomes data-driven (iterates the union of both files), so adding a new profile in the editor automatically appears on the live page.
- Coral's renderer (`CoralStoneMorph`) and shader stay untouched. Nebularr's renderer (`GentleOrbThicken`) and shader stay untouched. Each shader keeps its own animator, math, and visual feel.

The unification is **at the data and editor layers only.** Below the surface, Coral D and Tube/GentleOrb stay separate components with separate shaders, separate per-shader profile schemas, and separate rendering paths. They converge at exactly two points:

1. The editor's profile dropdown (one list, mixed entries with shader glyphs).
2. The live page's thumbnail strip (one strip, mixed entries).

## Non-goals (explicitly out of scope)

- **No migration of Coral to GentleOrbThicken.** Coral D stays its own shader, with its own gallery section, its own bump-hue fragment, its own 24-wave golden-spiral, its own inner-face dampening curve.
- **No tau-unification.** Coral keeps its existing linear-advance morph animator and `morphSpeed` semantics (literal seconds for full transition). Nebularr keeps its exponential-tau animator and `thickenSpeed` semantics. Deferred to a separate follow-up.
- **No changes to the gallery (`/blob-orb/gallery`)** or its existing profile files (`gallery-coralmorph-profiles.json`, `gallery-thicken-profiles.json`, etc.). Those keep serving the gallery page as today.
- **No schema unification across shaders.** Each shader's profile file has its own clean schema, fit to that shader's actual fields. No discriminated union types, no shared base.

## Architecture decisions (locked in)

1. **Per-shader JSON file pattern.** Matches the existing gallery convention (one file per shader). Two files for the realtime page: `realtime-state-profiles.json` (existing, Tube/Kyoto) and `realtime-coral-profiles.json` (NEW, Coral D).
2. **Single editor page, shader-aware controls.** `/voiceinterface/realtime-states` stays the only editor route. The profile dropdown lists entries from both files; each entry carries a small leading glyph indicating its shader. Selecting a Coral entry swaps the editor's slider set to Coral's controls.
3. **Realtime Coral adapter wraps `CoralStoneMorph`.** A new `CoralRealtimeBlob.tsx` (mirroring `NebularrBlob.tsx`) handles per-state config, intro overlay, and profile fetching. The shader component itself only gets a small `morphOverride?: number` prop addition so the wrapper can drive the morph externally without disturbing existing gallery callers.
4. **Live thumbnail strip is data-driven.** `VoiceRealtimeOpenAI.tsx` fetches both profile files in parallel on mount and builds the strip from the union.
5. **Existing TS constants become fallbacks only.** After the live page is wired through the new system, `WHIMSY_BASE` + `DEFAULT_STATE_SETTINGS` get demoted to a `CORAL_FALLBACK_PROFILE` used only on API failure (mirrors `NEBULARR_FALLBACK_PROFILE`).

## Data layer

### `realtime-coral-profiles.json` schema

Located at the repo root, parallel to `realtime-state-profiles.json`. Same outer shape (array of saved profiles), Coral-specific inner shape:

```ts
type CoralRealtimeProfile = {
  id: string;
  name: string;
  settings: {
    base: {
      scale: number;
      torusRadius: number;          // Coral-specific: minor radius in torus state
      waveIntensity: number;
      breathAmp: number;
      idleAmp: number;
      morphSpeed: number;           // shared baseline (literal seconds)
      color1: string;
      color2: string;
      color3: string;
      bgColor: string;
    };
    talking?: {                     // Coral only differentiates talking today
      morphSpeed?: number;
      waveIntensity?: number;
      color3?: string;              // optional, future-friendly
    };
  };
  lastModified: number;
};
```

**Initial seed entry (one):**
```jsonc
{
  "id": "rt-coral-default",
  "name": "Coral",
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

### API endpoint

Currently: `/api/studio-profiles?variant=realtime-state` reads + writes `realtime-state-profiles.json`.

Add a new variant `realtime-coral` that reads + writes `realtime-coral-profiles.json`. Implementation likely a one-line addition to the variant→file mapping in `src/pages/api/studio-profiles.ts` — same code path otherwise.

## Renderer changes

### `CoralStoneMorph.tsx`

Add one optional prop:

```ts
export interface CoralStoneMorphProps {
  // ...existing fields...
  /** When provided, bypass the internal morph animator and use this
   *  value directly. Caller takes responsibility for advancing morph
   *  externally. Used by the realtime adapter (`CoralRealtimeBlob`)
   *  to drive a state-aware morph; gallery callers don't pass this. */
  morphOverride?: number;
}
```

In `useFrame`, when `morphOverride` is provided, skip the `morphRef.current += delta / morphSpeed` step and feed the override straight into `uMorph` (with the existing smoothstep ease retained for visual consistency).

**Gallery callers don't pass `morphOverride`** — their behavior is unchanged.

### NEW: `src/projects/voiceinterface/components/CoralRealtimeBlob.tsx`

Mirrors `NebularrBlob.tsx`:

- Accepts: `audioData`, `voiceState`, `profile: CoralRealtimeProfile | null`, `width`, `height`.
- Falls back to a hardcoded `CORAL_FALLBACK_PROFILE` (the seed values from above) when `profile` is null.
- Manages its own morph state: a single `morphRef` advanced by `delta / effectiveMorphSpeed` per frame, where `effectiveMorphSpeed` is `talking.morphSpeed` when `voiceState === 'ai_speaking'` else `base.morphSpeed`.
- Computes per-state effective values (waveIntensity per state, color3 if overridden, etc.) using the same base/peak inheritance pattern as the Nebularr animator (`scope[field] ?? base[field]`).
- Renders `<CoralStoneMorph morphOverride={morphRef.current} ...>`.
- Plays the talking-to-idle intro on fresh mount, identical pattern to `NebularrBlob`'s recently-added intro overlay (seeds morphRef at the talking value, crossfades to base).

### `RealtimeBlob.tsx`

Replace the hardcoded `if (profile === 'nebularr')` branch with a shader-aware dispatch:

```ts
type RealtimeOrb =
  | { shader: 'coral'; profile: CoralRealtimeProfile | null }
  | { shader: 'kyoto'; profile: LinkedProfile | null };

const RealtimeBlob: React.FC<RealtimeBlobProps> = ({ orb, audioData, voiceState, ... }) => {
  if (orb.shader === 'coral') {
    return <CoralRealtimeBlob profile={orb.profile} ... />;
  }
  return <NebularrBlob profile={orb.profile} ... />;
};
```

The `WHIMSY_BASE` + `REALTIME_BASE` constants imported here today get removed once `CoralRealtimeBlob` owns the Coral path.

### `VoiceRealtimeOpenAI.tsx`

Replace the hardcoded `profileThumbs` array (lines 485-488 today) with state populated from a parallel fetch of both profile files:

```ts
const [orbs, setOrbs] = useState<Array<{
  id: string;
  name: string;
  shader: 'coral' | 'kyoto';
  thumbSrc: string;
  profile: CoralRealtimeProfile | LinkedProfile;
}>>([]);

useEffect(() => {
  Promise.all([
    fetch('/api/studio-profiles?variant=realtime-coral').then(r => r.json()),
    fetch('/api/studio-profiles?variant=realtime-state').then(r => r.json()),
  ]).then(([coralList, kyotoList]) => {
    setOrbs([
      ...coralList.map(p => ({ id: p.id, name: p.name, shader: 'coral', thumbSrc: ..., profile: p.settings })),
      ...kyotoList.map(p => ({ id: p.id, name: p.name, shader: 'kyoto', thumbSrc: ..., profile: p.settings })),
    ]);
  }).catch(() => setOrbs([CORAL_FALLBACK_ORB])); // keep page functional
}, []);
```

Default selected orb stays the first Coral entry (current default). Thumbnail strip iterates `orbs`. `RealtimeBlob` receives the active orb's `{ shader, profile }`.

**Thumbnail image paths:** for the seed Coral entry, use `/thumbnails/realtime-production.png` (today's Coral thumb). For the Nebularr entry, use `/thumbnails/realtime-states/nebularr.png`. New profiles created via the editor get a default placeholder thumb until the thumbnail-capture script (already exists for Nebularr) is run.

## Editor changes (`/voiceinterface/realtime-states`)

### Profile dropdown — combined list with shader glyphs

The profile menu (currently rendered around line 1734) lists entries from both files. Each row gets a small leading glyph:

- **Coral** entries: a small `Circle` lucide icon, or a 1-character chip `C`, in Coral's signature peach color.
- **Tube/Kyoto** entries: a small `Disc` lucide icon, or a 1-character chip `T`, in Kyoto's signature olive color.

Final glyph choice TBD when we see them rendered — easy to swap. Both options ship with the lucide icons already imported elsewhere in the file.

Rows show: `[glyph] [name]` with the existing rename/delete actions to the right.

### Shader-aware controls panel

The bottom controls panel currently has 4 tabs: Size, Thickness, Motion, Colours. For Tube/Kyoto profiles, today's full slider set stays unchanged.

For Coral profiles, the Size / Thickness / Motion / Colours tabs render Coral's slider set instead:

| Tab | Coral controls | Notes |
|---|---|---|
| Size | `Scale (Peak)` per pill, `Torus Radius` (base) | torusRadius is Coral's "ring tightness" knob, ~0.05–0.5. |
| Thickness | `Settle Speed` (`base.morphSpeed`, idle/listening pills); `Morph Speed (→ talking)` (`talking.morphSpeed`, talking pill) | **Coral's morphSpeed is literal seconds**, so the `≈ X.XXs visible` hint introduced in commit `52e2092` does NOT apply to these sliders. Only the raw value is shown, with unit `s`. |
| Motion | `Wave Intensity` (Rest + Peak), `Breath Amp`, `Idle Amp` | Wave Intensity matches Tube's pattern. |
| Colours | color1 / color2 / color3 + bgColor | Same color picker, same format toggle. No scope distinction needed today (Coral's color3 has no per-state override yet, but the schema allows it for future). |

**State pills** (idle / listening / thinking / talking) stay visible for Coral but only `talking` is functionally distinct. The thinking pill greys out its peak controls (similar to how `Tube Thickness (Peak)` is hidden for talking on the Tube editor today). Acceptable mild redundancy in exchange for UI consistency.

### Save / rename / new-profile CRUD

- Saving an existing entry writes to its file, determined by the `shader` field stamped on the entry when loaded.
- Renaming works the same.
- Creating a new profile: a small modal asks "New Tube profile or new Coral profile?" before opening the name input. Each click writes to the right file.
- Deleting an entry removes from its file.

The "Save current state to current profile" button (the bookmark icon) writes back to whichever file the active profile came from.

### Profile loading on page mount

Editor fetches both files in parallel, builds a combined list. Active profile defaults to the first entry (a Coral entry, alphabetically). Switching profiles via the dropdown swaps `profile` state to the new entry's settings AND triggers `restartIntro` for the new shader.

## Live page changes (`/voiceinterface/realtime`)

Already covered under the `VoiceRealtimeOpenAI.tsx` section. Net effect: removing the hardcoded `profileThumbs` array, fetching both files, building a unified list, dispatching by shader.

## Migration ordering (each phase independently revertable)

### Phase 1 — Data + API (no UI changes, no visual changes)

1. Create `realtime-coral-profiles.json` at repo root with the single seed entry above.
2. Update `src/pages/api/studio-profiles.ts` to map `?variant=realtime-coral` → `realtime-coral-profiles.json`.
3. Verify: GET request returns the seed; POST round-trips correctly.

**Rollback if needed:** delete the file and the API line.

### Phase 2 — Renderer plumbing (live page still uses TS constants)

4. Add `morphOverride?: number` to `CoralStoneMorph.tsx`. Existing callers don't pass it; visual behavior unchanged.
5. Create `src/projects/voiceinterface/components/CoralRealtimeBlob.tsx` with intro overlay. Not yet wired into `RealtimeBlob`.
6. Add a temporary verification route `src/pages/voiceinterface/coral-realtime-test.tsx` that renders `CoralRealtimeBlob` directly with the seed profile, just to confirm rendering parity with the current Coral.

**Rollback:** delete the new files; `CoralStoneMorph`'s extra prop is dormant for non-realtime callers.

### Phase 3 — Live page wiring

7. Update `VoiceRealtimeOpenAI.tsx`: parallel fetch both files, build unified `orbs` list, replace hardcoded thumb array.
8. Update `RealtimeBlob.tsx`: shader-aware dispatch.
9. Verify: live page Coral path renders identically to before; live page Nebularr path renders identically.
10. Delete the temporary verification route from step 6.

**Rollback:** revert these three edits; live page falls back to the hardcoded version.

### Phase 4 — Editor wiring

11. Update editor's profile dropdown: parallel fetch both files, combined list, leading glyphs.
12. Add shader-aware controls (gated on active profile's shader). Coral slider set fully editable.
13. Update save / rename / new-profile / delete to be shader-aware.
14. Verify: edit a Coral value → save → refresh → live page picks it up.
15. Verify: Tube editing still works end-to-end.

**Rollback:** revert these edits; editor falls back to Tube-only.

### Phase 5 — Cleanup

16. After ~1 week of confidence in the new system, demote `WHIMSY_BASE` + `DEFAULT_STATE_SETTINGS` to a `CORAL_FALLBACK_PROFILE` constant inside `CoralRealtimeBlob.tsx` (same shape as `NEBULARR_FALLBACK_PROFILE`).
17. Remove unused imports of `WHIMSY_BASE` / `DEFAULT_STATE_SETTINGS` from `RealtimeBlob.tsx` if they're no longer referenced.

The original constants stay in `blobStudioTypes.ts` because the gallery and other surfaces may still consume them. Don't delete them at the source.

## Verification checklist

End-of-implementation:

- Live `/voiceinterface/realtime`: clicking the Coral thumb shows Coral orb (visually identical to today).
- Live `/voiceinterface/realtime`: clicking the Nebularr thumb shows Nebularr orb (visually identical to today).
- Live: switching Coral → Nebularr plays Nebularr's intro overlay (existing behavior).
- Live: switching Nebularr → Coral plays Coral's intro overlay (new behavior, parity with Nebularr's intro).
- Editor `/voiceinterface/realtime-states`: dropdown lists Coral + Tube profiles together with shader glyphs.
- Editor: clicking a Coral profile swaps the controls to Coral's slider set.
- Editor: editing `talking.morphSpeed` on Coral and saving updates `realtime-coral-profiles.json` (verify via `git diff`).
- Editor: clicking back to a Tube profile restores Tube's slider set; Tube editing still works.
- Editor: creating a new profile opens the shader-choice modal; saving writes to the correct file.
- TypeScript: `npx tsc --noEmit` clean.
- API: `/api/studio-profiles?variant=realtime-coral` returns the Coral list; `?variant=realtime-state` returns the Kyoto/Tube list (unchanged).

## Files affected (concrete list)

**New:**
- `realtime-coral-profiles.json` — repo root.
- `src/projects/voiceinterface/components/CoralRealtimeBlob.tsx`.

**Modified:**
- `src/pages/api/studio-profiles.ts` — add `realtime-coral` variant mapping.
- `src/projects/blob-orb/variants/CoralStoneMorph.tsx` — add `morphOverride?: number` prop.
- `src/projects/voiceinterface/components/RealtimeBlob.tsx` — shader-aware dispatch; remove hardcoded `WHIMSY_BASE`/`REALTIME_BASE` once `CoralRealtimeBlob` is the Coral path.
- `src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx` — dual-fetch, data-driven thumbnail strip, unified orb list state.
- `src/pages/voiceinterface/realtime-states.tsx` — shader-aware editor controls, dual-source dropdown, shader-aware CRUD.

**Temporary (created in Phase 2, deleted in Phase 3):**
- `src/pages/voiceinterface/coral-realtime-test.tsx`.

## Open follow-ups (NOT part of this plan)

- **Tau-unification across Coral.** Coral on the realtime page would adopt the same `tau = value * 0.5; alpha = 1 - exp(-dt/tau)` math Tube uses, with the `≈ X.XXs visible` hint applying to Coral sliders too. Decision deferred per user — "leave the coefficient for later."
- **Migrating gallery Coral profiles to tau.** Even further out; would require re-tuning every saved Coral gallery entry.
- **Adding a `thinking` peak slot to Coral.** Coral today has no thinking-pulse equivalent; idle/listening/thinking are visually identical. Deferred until a use case appears.
- **A new shader joining the realtime page (e.g., `radial-inward`).** Same pattern: new file, new dispatch branch, new shader-aware editor controls. The plan above is structured so additional shaders are additive, not refactors.
- **Per-profile thumbnail capture.** Currently a Playwright script captures Nebularr thumbs. Extending it to capture every profile in both files is a small follow-up once the unified system is in place.

## Scope estimate

Roughly **2–3 hours** of focused work, distributed across the phases:

- Phase 1: ~15 min (file creation + API line).
- Phase 2: ~45 min (`CoralRealtimeBlob` mirroring `NebularrBlob`, plus the test route).
- Phase 3: ~30 min (live page rewiring + verification).
- Phase 4: ~60 min (editor's shader-aware controls is the bulk).
- Phase 5: ~10 min (cleanup, after verification window).

Plus verification time at each phase boundary.
