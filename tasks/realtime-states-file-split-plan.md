# Realtime-states file-split refactor — plan v7

> Goal: split `src/pages/voiceinterface/realtime-states.tsx` (3253 lines) into a small set of focused modules, with **zero behavior change**. This is a pure mechanical refactor — no semantic changes, no new features, no inline cleanups.
>
> Status: **v7 — second external reviewer pass applied (6 findings, all post-edit consistency in v6). Implementation-ready.**
>
> Predecessor handoff: `tasks/realtime-states-handoff.md`.

## 0. Concept index

To make consistency-checking tractable on a long plan, every named concept appears here once:

| Concept | First defined | Notes |
| --- | --- | --- |
| `RealtimeStates` | §3 | Default-export page component (parent). Owns data layer + cascade. |
| `RealtimeStatesEditor` | §3 | Internal child component. Owns visual + animator + JSX. |
| `RealtimeStatesSkeleton` | §3 | Empty-canvas page shown until `cascadeReady` flips. |
| `LoadedOrb`, `BaselineSnapshot`, `SavedProfile`, `SavedCoralProfile`, `DropdownRow` | §4 (types.ts) | Discriminated unions over both shaders. |
| `RenderValues`, `LinkedProfile`, `BaseSettings`, `PeakOverrides` | §4 (types.ts) | Tube/Kyoto-shaped settings. |
| `KYOTO_SEED`, `STATES`, `TALKING_GEOMETRY`, `SILENT`, `REALTIME_SEED_NAME`, `COLOR_FORMATS`, `SETTLE_DURATION_MULTIPLIER` | §4b (constants.ts) | Constants — split from types per the local convention (every `src/projects/<thing>/types.ts` in this repo is types-only). |
| `pickPeak`, `baseRender`, `talkingRenderForProfile`, `lerpRender`, `lerp`, `lerpHex`, `clampNumber`, `normalizeProfileName`, `compositeKey` | §4c (helpers.ts) | Pure helpers — no React, no I/O. |
| Color helpers (`hexToRgb`, `rgbToHex`, `rgbToHsl`, `hslToRgb`, `rgbToHsb`, `hsbToRgb`, `parseHexColor`, `parseColorValue`, `formatColorValue`, `readColorNumbers`, `colorFieldValues`, `colorDraftsToHex`) | §4c (helpers.ts) | Pure — no React. Co-located with the other pure helpers. |
| `fetchProfiles`, `persistProfiles`, `fetchCoralProfiles`, `persistCoralProfiles`, `fetchProfileNames` | §5 (api.ts) | All network I/O. The two URL strings (`API`, `CORAL_API`) are module-private `const`s in api.ts — not exported. |
| `PeakSliderRow`, `ColorFormatControl`, `EditableColorValue`, `ColorChannelFields`, `ColorPickerButton`, `RealtimeColorRow`, `PeakColorRow` | §6 (controls.tsx) | UI primitives. Pure components — already self-contained in source. |
| `TubeTabPanel`, `CoralTabPanel` | §6 (controls.tsx) | Renamed from `renderTabControls` / `renderCoralTabControls`. Component form, props-driven. |
| `TubeController`, `CoralController` | §6 (controls.tsx) | Prop bundles to keep the tab-panel signatures readable (mutators + readers + state). |
| `useCoralThinkingPulse`, `useEasedNumber`, `useEasedColor` | unchanged | Imported from `@/projects/voiceinterface/components/CoralRealtimeBlob`. Not moved. |

## 1. Why this refactor

Three concrete pains in the current 3253-line file:

1. **Search-and-edit friction.** Jumping between the Tube renderer, Coral renderer, and the animator means navigating 1000-line stretches. Adding a new slider means three round-trips through the file.
2. **PR review hostility.** Even a small change diff touches the largest file in the repo, dwarfing the change-of-interest with surrounding context.
3. **Test-of-knowledge.** A reader new to the file has to scroll past 1000 lines of pure helpers to reach the page component.

Splitting addresses all three. **The split changes nothing about behavior, persistence, routing, schemas, or the live page.** Anything that does belongs in a separate plan.

### 1.1 Where the split lands

This codebase's standing convention: `src/pages/<thing>/index.tsx` (or `<thing>.tsx`) is a thin route entrypoint; all support code lives at `src/projects/<thing>/`. Examples already in the tree: `src/pages/clipperstream/index.tsx` is a 3-line file that imports from `@/projects/clipperstream/components/...`; trace, ai-confidence-tracker, receipt-scanner, reading-practice all follow the same shape.

The 3253-line `src/pages/voiceinterface/realtime-states.tsx` is the outlier — a god-component sitting in `pages/` instead of being split across `pages/` (entrypoint) and `projects/` (everything else). This refactor brings it into line.

The split modules land at `src/projects/voiceinterface/realtime-states/` (six implementation files; see §3 for the breakdown). The page file becomes a 3-line re-export shim:

```tsx
// src/pages/voiceinterface/realtime-states.tsx
import RealtimeStates from '@/projects/voiceinterface/realtime-states';
export default RealtimeStates;
```

Route `/voiceinterface/realtime-states` is preserved exactly.

## 2. Out of scope (explicit)

The following are **NOT** part of this refactor. Each has its own follow-up entry in the handoff doc and remains there:

- Removing the temporary `console.log` in the cascade effect (the line moves with the code; the cleanup is a separate one-line commit, post-split).
- `forceIntroOnSelect` per-profile toggle.
- Fork-from-clean-A `handleSave` fix.
- WebGL init blank → thumbnail mask.
- Throttled-CPU manual verification.
- Deduplicating the `orbs` useMemo (defined in both parent at L3157 and child at L1128 — the duplication migrates as-is; cleaning it up is a small follow-up after the split).

If the implementer is tempted to fix any of these "while I'm here," **stop and revisit after this plan ships.** Bundling cleanups into a refactor PR makes the diff harder to verify against the zero-behavior-change contract.

## 3. Target file layout

```
src/pages/voiceinterface/realtime-states.tsx        ← 3-line re-export shim (NEW)
src/projects/voiceinterface/realtime-states/
├── types.ts                                         ← types only (~120 lines)
├── constants.ts                                     ← module-wide constants (~50 lines)
├── helpers.ts                                       ← pure helpers (render math + color math + name + key) (~200 lines)
├── api.ts                                           ← network I/O wrappers (~80 lines)
├── controls.tsx                                     ← UI primitives + tab panels (~1000 lines)
└── index.tsx                                        ← page component (parent + child + skeleton) (~1500 lines)
```

Total LOC is **rough** — per-file estimates are budgets, not predictions. The current 3253-line file has comment blocks and whitespace that get redistributed but not condensed; expect the post-split sum to land in the 2900–3200 range. Verify after the move; §11 acceptance does not depend on LOC count.

The page route `/voiceinterface/realtime-states` is preserved by the shim.

### 3.1 Why six modules

The earlier draft of this plan packed types + constants + every pure helper into a single `types.ts` (~250 lines). Three reasons the v6 split is six files instead of four:

1. **Local convention.** Every `types.ts` already in this repo (`src/projects/voiceinterface/types.ts`, `src/projects/blob-orb/types.ts`, `src/projects/radial-waveform/types.ts`) is type-only. A `types.ts` containing render math, color conversions, and `lerp` would be the only outlier. Honest naming wins.
2. **Constants colocation.** `src/projects/voiceinterface/constants.ts` exists. The split's constants (KYOTO_SEED, STATES, etc.) belong in a sibling `constants.ts`, not jammed under `types.ts`.
3. **Helpers earn their own file.** ~200 lines of pure functions (render math + color math + name normalization + composite key) is enough to justify standalone. Keeping them out of `types.ts` lets the types file render in 30 seconds in a reader's head.

Six files is well below the "8–10 files would be too many" threshold flagged by the external reviewer. A larger split (e.g., breaking `controls.tsx` into `panels-tube.tsx` and `panels-coral.tsx`) would help future readability marginally but multiplies closure-extraction surface in this PR; defer.

A smaller split (e.g., folding `api.ts` into `helpers.ts`) would mix pure code with `fetch` I/O, which complicates isolation if we ever want to test the helpers.

## 4. `types.ts` — types only

**Responsibility.** TypeScript types. Nothing else. Matches the convention of every existing `src/projects/<thing>/types.ts` in the repo.

**Exports** (alphabetical):

`BaseSettings`, `BaselineSnapshot`, `ColorFormat`, `ControlTab`, `DropdownRow`, `LinkedProfile`, `LoadedOrb`, `PeakOverrides`, `PeakScope`, `PreviewState`, `RenderValues`, `SavedCoralProfile`, `SavedProfile`.

Plus two re-exports (not redefined — single source of truth):

- `CoralRealtimeSettings` from `@/projects/voiceinterface/components/CoralRealtimeBlob`.
- `AudioData` from `@/projects/voiceinterface/types` (consumed by `constants.ts` for `SILENT`'s annotation, and by `index.tsx` for the audio-polling state). Re-exporting here keeps every sibling-files import going through `./types`.

**Constraints.**
- Zero React imports.
- Zero non-type exports.
- Zero side effects on module load.

## 4b. `constants.ts` — module-wide constants

**Responsibility.** Constants consumed by two or more sibling modules. (URL constants like `API` / `CORAL_API` are private to `api.ts` and stay there — they're not consumed elsewhere.)

**Exports.**

- `KYOTO_SEED` — Tube/Kyoto fallback profile.
- `STATES` — `['idle','listening','thinking','talking']`.
- `TALKING_GEOMETRY` — pinned thickRadius for talking state (sphere shape).
- `SILENT` — zeroed `AudioData`.
- `REALTIME_SEED_NAME` — `'Kyoto Realtime'`.
- `COLOR_FORMATS` — `['hex','rgb','hsl','hsb']`.
- `SETTLE_DURATION_MULTIPLIER` — visible-duration multiplier for speed sliders.

**Constraints.**

- Imports types from `./types` (including the re-exported `AudioData` — `SILENT` is typed `AudioData`). Nothing else.
- `KYOTO_SEED` stays a plain `const`. Do **not** add `Object.freeze` — the source code doesn't, and adding it would be a behavior change.

## 4c. `helpers.ts` — pure helpers

**Responsibility.** Pure functions that take primitives or our own settings shapes and return primitives or shapes — no React, no `fetch`, no DOM access, no `window`.

**Exports** (grouped):

Render math — `baseRender`, `lerp`, `lerpHex`, `lerpRender`, `pickPeak`, `talkingRenderForProfile`.

Color math — `clampNumber`, `colorDraftsToHex`, `colorFieldValues`, `formatColorValue`, `hexToRgb`, `hsbToRgb`, `hslToRgb`, `parseColorValue`, `parseHexColor`, `readColorNumbers`, `rgbToHex`, `rgbToHsb`, `rgbToHsl`.

Names + keys — `compositeKey`, `normalizeProfileName`.

**Constraints.**

- Imports types from `./types` and the single constant `TALKING_GEOMETRY` from `./constants` (used by `talkingRenderForProfile` at L469 of the source). No other constants needed; verify during step 3 of §9.
- Zero React, zero `fetch`, zero `window`, zero side effects on module load.

## 5. `api.ts` — network I/O

**Responsibility.** All `fetch` wrappers. Consumers call these, never `fetch` directly.

**Exports.**
- `fetchProfiles(): Promise<SavedProfile[]>`
- `persistProfiles(arr: SavedProfile[]): Promise<void>`
- `fetchCoralProfiles(): Promise<SavedCoralProfile[]>`
- `persistCoralProfiles(arr: SavedCoralProfile[]): Promise<void>`
- `fetchProfileNames(variant: string): Promise<string[]>`

**Module-private (NOT exported).**
- `const API = '/api/studio-profiles?variant=realtime-state'`
- `const CORAL_API = '/api/studio-profiles?variant=realtime-coral'`

These are local `const` declarations consumed only by the wrappers above. They're not exported in the source today (lines 189, 228); the export list in earlier drafts of this plan was wrong.

**Constraints.**
- Imports types from `./types`. Nothing else.
- Console-error message strings stay byte-identical to current code (`'[realtime-states] persist failed'` etc.) — they appear in production logs and any change is a behavior change, however cosmetic.

## 6. `controls.tsx` — UI primitives + tab panels

**Responsibility.** All "leaf" UI components that render a row, color row, picker, etc. Plus the two big tab-panel renderers, converted from the in-component `renderTabControls` / `renderCoralTabControls` into prop-driven components.

### 6.1 Pure-leaf components (move as-is)

These are already self-contained — they take props, render, return. Move with no signature change:

- `PeakSliderRow`
- `ColorFormatControl`
- `EditableColorValue`
- `ColorChannelFields`
- `ColorPickerButton`
- `RealtimeColorRow`
- `PeakColorRow`

### 6.2 `TubeTabPanel` and `CoralTabPanel` — renamed and prop-driven

The current `renderTabControls(tab)` (Tube) and `renderCoralTabControls(tab)` (Coral) are arrow functions inside `RealtimeStatesEditor`. They close over `profile`, `state`, `colorFormat`, `setBase`, `setPeak`, `clearPeak`, `peakHas`, `peakEff`, `chooseColorFormat`, and (Coral) `activeCoralSettings`, `coralSetBase`, `coralSetPeak`, `coralClearPeak`, `coralPeakHas`, `coralPeakEff`.

To extract them:

1. **Rename.** `renderTabControls` → `TubeTabPanel`. `renderCoralTabControls` → `CoralTabPanel`. They become React components (PascalCase) — capitalisation matters because we render them as `<TubeTabPanel ... />` in `index.tsx`.
2. **Group dependencies into "controller" prop bundles** to keep the signature readable:

```ts
// in controls.tsx
export interface TubeController {
  profile: LinkedProfile;
  state: PreviewState;
  setBase: (patch: Partial<BaseSettings>) => void;
  setPeak: (scope: PeakScope, patch: Partial<PeakOverrides>) => void;
  clearPeak: <K extends keyof PeakOverrides>(scope: PeakScope, field: K) => void;
  peakHas: (scope: PeakScope, field: keyof PeakOverrides) => boolean;
  peakEff: (scope: PeakScope, field: keyof PeakOverrides & keyof BaseSettings) => number | string;
}

export interface CoralController {
  settings: CoralRealtimeSettings;
  state: PreviewState;
  coralSetBase: (patch: Partial<CoralRealtimeSettings['base']>) => void;
  coralSetPeak: (patch: Partial<NonNullable<CoralRealtimeSettings['talking']>>) => void;
  coralClearPeak: <K extends keyof NonNullable<CoralRealtimeSettings['talking']>>(field: K) => void;
  coralPeakHas: <K extends keyof NonNullable<CoralRealtimeSettings['talking']>>(field: K) => boolean;
  coralPeakEff: <K extends keyof NonNullable<CoralRealtimeSettings['talking']>>(
    field: K,
  ) =>
    | NonNullable<CoralRealtimeSettings['talking']>[K]
    | CoralRealtimeSettings['base'][K extends keyof CoralRealtimeSettings['base'] ? K : never]
    | undefined;
}

// ↑ Return type matches the source at realtime-states.tsx:1418–1425. Do NOT widen to `unknown` —
// every call site (e.g. `(coralPeakEff('scale') as number) ?? baseS.scale`) relies on the
// precise generic union to compile.

export interface TubeTabPanelProps {
  tab: ControlTab;
  controller: TubeController;
  colorFormat: ColorFormat;
  onColorFormatChange: (format: ColorFormat) => void;
}

export interface CoralTabPanelProps {
  tab: ControlTab;
  controller: CoralController;
  colorFormat: ColorFormat;
  onColorFormatChange: (format: ColorFormat) => void;
}

export const TubeTabPanel: React.FC<TubeTabPanelProps> = ({ tab, controller, colorFormat, onColorFormatChange }) => {
  const { profile, state, setBase, setPeak, clearPeak, peakHas, peakEff } = controller;
  // ... existing renderTabControls body, switch (tab) { ... } ...
};

export const CoralTabPanel: React.FC<CoralTabPanelProps> = ({ tab, controller, colorFormat, onColorFormatChange }) => {
  const { settings, state, coralSetBase, coralSetPeak, coralClearPeak, coralPeakHas, coralPeakEff } = controller;
  // ... existing renderCoralTabControls body, switch (tab) { ... } ...
};
```

3. **Index.tsx call sites.** `renderTabControls(activeTab)` becomes `<TubeTabPanel tab={activeTab} controller={tubeController} colorFormat={colorFormat} onColorFormatChange={chooseColorFormat} />`. The expanded-drawer `tabs.map((t) => renderTabControls(t.key))` becomes `tabs.map((t) => <TubeTabPanel key={t.key} tab={t.key} ... />)`. Same for Coral.

4. **Controller construction** lives in `index.tsx` as a plain object literal — see §13 for the full rationale and the typed-nullable form. Short version:

   ```tsx
   const tubeController: TubeController = {
     profile, state, setBase, setPeak, clearPeak, peakHas, peakEff,
   };
   const coralController: CoralController | null = activeCoralSettings
     ? { settings: activeCoralSettings, state, coralSetBase, coralSetPeak, coralClearPeak, coralPeakHas, coralPeakEff }
     : null;
   ```

   **No `useMemo`** — see §13.

### 6.3 Why component-form, not function-form

A function `renderTabControls(tab) → JSX` is cheaper to extract (just pass everything as args), but loses the ability to memoise. A component lets us `React.memo` the panels later if perf demands it. We're not memoising in this PR — but the structural choice should not foreclose it.

### 6.4 Naming convention reaffirmed

Module names are shader-agnostic in this layer's casing because the layer hosts both shaders. Component names use `Tube`/`Coral` because those are stable shader identities. **Do not** use `Kyoto` in module or component names — `Kyoto Realtime` is a profile name, not a shader.

### 6.5 Imports `controls.tsx` will need

Listed for sanity-check during step 5 of §9 (the controls.tsx creation step).

External:

- `react` — default + `React.FC` + hooks for the leaf components (`useState`, `useEffect`, `useLayoutEffect`, `useRef`).
- `react-dom` — `createPortal` (used by `ColorPickerButton`).
- `react-aria-components` — `ColorArea`, `ColorSlider`, `ColorThumb`, `SliderTrack`, `parseColor`, `Color` type (used by `ColorPickerButton`).
- `@/components/ui/slider` — `Slider` (used by `PeakSliderRow`).
- `@/projects/blob-orb/components/shared/SliderRow` — default `SliderRow` (used by both panels).
- `@/projects/blob-orb/galleryTypes` — `approxPixelDia` (used by Tube `size` tab).
- `@/projects/voiceinterface/components/CoralRealtimeBlob` — value imports `CORAL_PULSE_DEFAULTS` (used by Coral `thickness` tab thinking branch). Type-only imports of `CoralRealtimeSettings` go through `./types` (the re-export).

Internal:

- `./types` — every type used inside the panels.
- `./constants` — `COLOR_FORMATS` (used by `ColorFormatControl`), `SETTLE_DURATION_MULTIPLIER` (used by `PeakSliderRow` and the Tube thickness tab's "≈ visible" hint).
- `./helpers` — every color helper used inside the leaf components (`hexToRgb`, `rgbToHex`, `rgbToHsl`, `hslToRgb`, `rgbToHsb`, `hsbToRgb`, `parseHexColor`, `parseColorValue`, `formatColorValue`, `colorFieldValues`, `colorDraftsToHex`, `clampNumber`, `readColorNumbers`).

`controls.tsx` does **NOT** import lucide-react; every lucide icon (Menu, X, Repeat, ChevronDown, Save, Check, Pause, Play, RotateCcw, Pencil, Bookmark, Disc, Circle) is bottom-bar-only and stays in `index.tsx`. `controls.tsx` does **NOT** import any constants beyond the two listed above; `KYOTO_SEED`, `STATES`, etc. stay in `index.tsx`-only territory.

## 7. `index.tsx` — page component

**Responsibility.** Everything not in types, api, or controls:

- `RealtimeStates` (parent, default export) — data layer, cascade, `cascadeReady` gate. Lines 3095–3253 today.
- `RealtimeStatesEditor` (child) — visual + animator + JSX.
- `RealtimeStatesSkeleton`.
- All component-scoped `useEffect` (animator, audio polling, auto-loop, dropdown outside-click, talking-exit tau, leave-thinking unpause).
- All component-scoped `useState` / `useRef` / `useMemo`.
- The two `<Canvas>` branches (Coral / Tube).
- The bottom-bar JSX (Menu, state pills, profile dropdown, tabs row, swatches, action buttons, Save dialog).

**Imports.** Listed explicitly so an implementer can copy-paste during step 6 of §9.

External:

- `react` — default + hooks (`useEffect`, `useLayoutEffect`, `useMemo`, `useRef`, `useState`).
- `@react-three/fiber` — `Canvas`.
- `lucide-react` — `Menu`, `X`, `Repeat`, `ChevronDown`, `Save`, `Check`, `Pause`, `Play`, `RotateCcw`, `Pencil`, `Bookmark`, `Disc`, `Circle` (every icon in the bottom bar / dropdown / Save dialog).
- `@/projects/blob-orb/variants/GentleOrbThicken` — Tube canvas branch.
- `@/projects/blob-orb/variants/CoralStoneMorph` — Coral canvas branch.
- `@/projects/blob-orb/components/GalleryAudioControls` — microphone toggle.
- `@/projects/blob-orb/galleryTypes` — `CURATED_NAMES`, `GALLERY_API_KEYS` (used by `pickRealtimeUnusedName` and the parent's gallery-name effect; `approxPixelDia` does NOT need to be imported here — it's only used in `controls.tsx`).
- `@/projects/blob-orb/services/audioService` — `audioService` (used by audio polling effect + cleanup-on-unmount).
- `@/projects/voiceinterface/components/CoralRealtimeBlob` — value imports `CORAL_FALLBACK_PROFILE`, `useCoralThinkingPulse`, `useEasedColor`, `useEasedNumber`. Type imports of `CoralRealtimeSettings` and `AudioData` go through `./types` (re-exports — see §4).

Internal (sibling files):

- `./types` — every type used by parent + editor + Canvas branches, plus the re-exported `AudioData` and `CoralRealtimeSettings`.
- `./constants` — `COLOR_FORMATS`, `KYOTO_SEED`, `REALTIME_SEED_NAME`, `SETTLE_DURATION_MULTIPLIER`, `SILENT`, `STATES`, `TALKING_GEOMETRY`.
- `./helpers` — `baseRender`, `compositeKey`, `lerpRender`, `normalizeProfileName`, `pickPeak`, `talkingRenderForProfile`. (Color and `lerp`/`lerpHex` helpers stay unimported here — they're used by `controls.tsx` + transitively inside `lerpRender`, not directly by `index.tsx`.)
- `./api` — `fetchProfiles`, `persistProfiles`, `fetchCoralProfiles`, `persistCoralProfiles`, `fetchProfileNames`.
- `./controls` — `TubeTabPanel`, `CoralTabPanel`, `ColorPickerButton` (used directly in the bottom-bar swatches at L2867 of the source — must remain exported from `controls.tsx`).

If anything is missing from this list during the move, `tsc --noEmit` will surface it. The list is a starting point, not a contract — verify each file's imports against actual usage.

## 8. The `EditorProps` interface

Stays exactly as-is. Lives in `index.tsx` (it's an internal contract between the parent and child of that file). Not exported.

## 9. Migration steps (single commit)

This is one atomic refactor. A multi-commit split would leave the build broken on intermediate commits because `realtime-states.tsx` would temporarily be missing exports it still imports from itself.

**Step 0 — pin the pre-split SHA.** Before touching anything, capture the current commit:

```bash
PRE_SPLIT_SHA=$(git rev-parse HEAD)
echo "$PRE_SPLIT_SHA" > /tmp/realtime-states-pre-split.sha
```

This SHA is referenced in §11.3 for the diff verification — `HEAD~1` is fragile because the split may take more than one commit (a fix-up after lint, etc.).

**Steps 1–8 — within the single split commit:**

1. Create `src/projects/voiceinterface/realtime-states/types.ts`. Copy type declarations + the `CoralRealtimeSettings` re-export from the current file. Verify zero non-type exports.
2. Create `src/projects/voiceinterface/realtime-states/constants.ts`. Copy module-wide constants per §4b. Verify only imports from `./types`.
3. Create `src/projects/voiceinterface/realtime-states/helpers.ts`. Copy pure helpers per §4c (render math + color math + name/key). Verify no React, no `fetch`, no `window`, only imports from `./types`.
4. Create `src/projects/voiceinterface/realtime-states/api.ts`. Copy fetch/persist helpers + the two API URL constants (`API`, `CORAL_API`). Verify only imports from `./types`.
5. Create `src/projects/voiceinterface/realtime-states/controls.tsx`. Copy UI primitives. Convert `renderTabControls` and `renderCoralTabControls` to `TubeTabPanel` and `CoralTabPanel` per §6.2. Verify the JSX bodies are byte-identical to today's render bodies modulo the closure → prop substitution. Verify imports per §6.5 (including the value import of `CORAL_PULSE_DEFAULTS`).
6. Create `src/projects/voiceinterface/realtime-states/index.tsx`. Copy the page component bodies (`RealtimeStates`, `RealtimeStatesEditor`, `RealtimeStatesSkeleton`, `EditorProps`). Replace inline `renderTabControls` / `renderCoralTabControls` calls with `<TubeTabPanel />` / `<CoralTabPanel />`. Construct `tubeController` / `coralController` as **plain object literals** per §13 (no `useMemo`). Guard `coralController` use with `activeOrb.shader === 'coral' && coralController && <CoralTabPanel ... />`. Verify imports per §7.
7. Replace `src/pages/voiceinterface/realtime-states.tsx` with the 3-line re-export shim.
8. Run static checks per §11.1, then manual smoke test per §11.2.

If a step fails, **stash and diagnose** rather than committing an incomplete state.

## 10. Behavioral preservation contract

Zero changes to:

- Persistence wire format (settings JSON shape, file paths, lastModified semantics).
- API endpoints (`/api/studio-profiles?variant=realtime-state` and `?variant=realtime-coral`).
- Cascade timing (kyotoLoaded + coralLoaded gate, cascadeReady flip order).
- Animator math (`tau = max(0.05, tauSpeed) * 0.5`, `alpha = 1 - exp(-dt/tau)`, lerpRender ordering).
- localStorage keys (`realtime-states-active-orb-key`, `realtime-states-color-format`).
- Replay key format (`coral-${replayCounter}`).
- DOM structure of the bottom bar (no class changes, no hierarchy changes — class lists are byte-equal).
- DOM structure of the tab panels: rendered output (the actual HTML) is byte-equal at the document level. The React fiber tree gains one wrapper element per active panel (`<TubeTabPanel>` / `<CoralTabPanel>` become first-class fibers), but they introduce **no extra wrapper `<div>`, no className, no attribute** to the rendered DOM — `TubeTabPanel` returns the same `<div className="space-y-3">…</div>` JSX trees the in-component renderer returned today.
- Console-error / console-log message strings stay byte-equal **during the split**. The temporary cascade-resolved log (§2) keeps its current position and message; it is removed in a separate one-line follow-up commit.
- React component identity for animator-driven components (the Canvas `<GentleOrbThicken>` / `<CoralStoneMorph>` are still rendered from the same component, so refs and effects don't reset).
- Hook-call inventory inside `RealtimeStatesEditor` is preserved exactly — no hooks added, no hooks removed, no hooks made conditional, no hooks reordered. The `tubeController` / `coralController` are plain object literals (§6.2 step 4), not `useMemo` calls; converting `renderTabControls` from an arrow expression to a component does not add a hook because the arrow expression was not a hook to begin with.

The two write-paths that mutate state (`updateActiveKyotoSettings` and `updateActiveCoralSettings`) keep their immutable-spread shape exactly. The `isDirty` IIFE keeps its current shape.

## 11. Verification

### 11.1 Static checks (must pass before manual test)

- `npx tsc --noEmit` exits 0.
- `npm run lint` exits 0.
- `npm run build` exits 0. The build output's route manifest contains `/voiceinterface/realtime-states` and **no** new routes under that path.
- `grep -nE "key=\\{[^}]*\\b(state|activeTab)\\b" src/projects/voiceinterface/realtime-states/index.tsx` returns **no matches**. (See pre-mortem item 4 in §14: leaf-component useState would silently reset if a panel's React `key` is built from `state` or `activeTab`. The grep makes the failure mode visible at code-review time, not just at runtime.)

### 11.2 Manual smoke test (browser)

Run the dev server. For each scenario, the editor must behave **identically** to before the split. To compare against the pre-refactor state, use a worktree on the SHA pinned in §9 step 0: `git worktree add ../pre-split "$PRE_SPLIT_SHA" && (cd ../pre-split && npm install && npm run dev -- -p 3001)`, then load both ports side-by-side. (Don't use `HEAD~1` — that only matches pre-split if the split is exactly one commit; a lint fix-up commit would invalidate it.)

1. **First-paint cascade — persisted Kyoto.**
   - localStorage has `realtime-states-active-orb-key = "realtime-state:rt-kyoto"`.
   - Reload. Skeleton briefly visible → Kyoto orb renders with intro animation (talking → idle).
2. **First-paint cascade — persisted Coral.**
   - Switch to a Coral profile, reload.
   - Skeleton briefly → Coral orb renders with talking-→-base intro.
3. **First-paint cascade — clean localStorage.**
   - Clear localStorage, reload.
   - Skeleton → "Kyoto Realtime" fallback orb.
4. **Slider edits dirty + Update.**
   - Edit a Tube slider — Discard/Update buttons appear. Update persists. Reload → edit holds.
   - Same for Coral slider.
5. **Discard.**
   - Edit a slider, click Discard — orb reverts; Discard/Update buttons disappear.
6. **Save-as-new (both shaders).**
   - Tube path: open Save → choose Tube → name → Save → new entry appears in dropdown, becomes active, intro replays.
   - Coral path: open Save → choose Coral → name → Save → new entry appears, becomes active.
7. **Profile rename.**
   - Rename a Tube profile → name updates in dropdown. Same for Coral.
8. **Profile pin/unpin.**
   - Bookmark icon toggles; pinned profiles persist across reload.
9a. **State pills + auto-loop.**
   - All four state pills work. Auto-loop cycles every 2.5s.
9b. **Tube Replay.**
   - With a Kyoto/Tube profile active, click Replay → `restartIntro()` runs → orb reseeds to talking values and morphs to base. **No Canvas remount.** (Verify by attaching a `console.log` to a long-lived ref OR by visually confirming no flicker.)
9c. **Coral Replay.**
   - With a Coral profile active, click Replay → `replayCounter` bumps → Canvas remounts via the `key={"coral-${replayCounter}"}` prop → sphere → torus intro plays from scratch.
10. **Audio mode.**
    - Click microphone, speak — orb reacts to audio data; cancelling audio returns control to manual pills.
11. **Color format.**
    - Switch HEX → HSL → HSB → RGB. Editing values in non-HEX format updates the orb. Format persists across reload (no HEX flash).
12. **Thinking pulse — both shaders.**
    - Thinking pill: Tube pulses thin↔thick; Coral pulses torusRadius. Pause/resume button works.
13. **Cross-shader switch.**
    - Kyoto active → click a Coral entry → Canvas remounts as `CoralStoneMorph`, intro plays.
    - Coral active → click a Kyoto entry → Canvas remounts as `GentleOrbThicken`, intro plays.
14. **In-progress inline edit during animator re-renders.**
    - Open the Colours tab in any state — the animator's `setRender` runs at 60Hz across all four states, so this scenario reproduces in `idle`, `listening`, `thinking`, and `talking` equally. Pick one (e.g. `talking` for visual feedback).
    - Click the HEX value text next to the Highlight color (this engages `EditableColorValue.editing = true`).
    - Type a partial value (e.g. `#ff` then pause).
    - **Confirm:** the input retains focus, the draft text is preserved, and pressing Enter commits the new color. If the field blurs or the draft resets mid-type, the split has caused unintended remounts.
    - Repeat for a `PeakSliderRow` numeric value (click the number, type partial, confirm preserved).
    - Repeat for `ColorChannelFields` (open the picker popover, edit one of R/G/B fields, confirm preserved).

### 11.3 Diff smell test

Use `$PRE_SPLIT_SHA` from §9 step 0 (NOT `HEAD~1` — that's only the pre-split commit if the split is exactly one commit, which a lint fix-up would break).

- `git diff --stat $PRE_SPLIT_SHA` shows: `src/pages/voiceinterface/realtime-states.tsx` shrinks to 3 lines; six new files appear under `src/projects/voiceinterface/realtime-states/`. No other files changed.
- The new files' contents must be a near-verbatim move of the old ranges, with only:
  - import / export keyword additions and file boundaries.
  - `renderTabControls` → `TubeTabPanel` rename + closure-to-prop substitution (mechanical: every `profile` → `controller.profile`, `setBase` → `controller.setBase`, etc.).
  - No logic edits, no class-list edits, no message-string edits.

Concrete side-by-side (since `git diff` of new files shows them as 100% added):

```bash
PRE=$(cat /tmp/realtime-states-pre-split.sha)

# Compare types.ts against the type-declaration region of the old file:
git show "$PRE":src/pages/voiceinterface/realtime-states.tsx | sed -n '35,165p' \
  | diff - src/projects/voiceinterface/realtime-states/types.ts

# Same pattern for constants.ts (line ranges from the old file ~166–191), helpers.ts
# (~192–486), api.ts (~194–250), controls.tsx (~488–989). Adjust ranges to actual.
```

Or open both in a side-by-side viewer (VS Code's "Compare Selected"). If the side-by-side surfaces anything that **isn't** (a) an import / export keyword addition, (b) the `renderTabControls` → `TubeTabPanel` rename + closure-to-prop substitution, or (c) the move of a code block from one file to another, **revert and try again**. Logic edits, class-list edits, and message-string edits all count as "anything else."

## 12. Risks and how the plan mitigates each

| Risk | Likelihood | Mitigation |
| --- | --- | --- |
| Closure-to-prop substitution misses a reference | Medium | §11.3 mechanical-diff check; `tsc --noEmit` catches missing references. |
| Hook-order drift inside `RealtimeStatesEditor` | Low | §10 explicit contract: no hooks added/removed at editor scope. Controllers are plain object literals (§6.2 step 4 + §13), not hooks. The two new components in `controls.tsx` have their own hook scopes; moving JSX into them adds new hook scopes for *those* components, but existing hooks in the editor stay put. |
| Controller object referential identity changes every render and re-renders panels | Acceptable | Identical to today's behavior (the in-component arrow renderer also has fresh closures per render). `React.memo` + `useCallback` is a follow-up optimization plan (§13). |
| Re-export shim path doesn't resolve | Low | The `@/*` alias is configured in `tsconfig.json` paths (`"@/*": ["./src/*"]`) and is already used in the existing codebase (e.g., the source file itself imports `@/projects/blob-orb/...`). |
| Unintentional behavior change in tab-panel JSX during the move | Medium | §11.2 enumerates 14 scenarios (16 sub-checks counting 9a/9b/9c separately); §11.3 enforces mechanical-diff discipline. |

## 13. Controller construction — finalised decision

Per §6.2 step 4, controllers are **plain object literals**, not `useMemo`. Decision rationale repeated here so the reviewer doesn't have to cross-reference:

- `setBase` / `setPeak` / `clearPeak` / `peakEff` / `peakHas` are arrow expressions inside the editor body today (declarations span lines 1355–1375 of the source). They get a new identity every render.
- Wrapping them in a `useMemo` controller with those values as deps would trigger the memo to invalidate every render anyway → fresh object every render → identical to a plain object literal.
- Adding the `useMemo` would also add two hooks at editor scope, violating §10's "no hooks added" contract.
- Therefore: plain object literal. Free of cost, free of contract violation.

Concrete shape in `index.tsx`:

```tsx
const tubeController: TubeController = {
  profile, state, setBase, setPeak, clearPeak, peakHas, peakEff,
};
const coralController: CoralController | null = activeCoralSettings
  ? {
      settings: activeCoralSettings,
      state,
      coralSetBase, coralSetPeak, coralClearPeak, coralPeakHas, coralPeakEff,
    }
  : null;
```

JSX uses `coralController` only inside the `activeOrb.shader === 'coral'` branch, where it is provably non-null.

**Future optimization plan (out of scope for this PR):** wrap the five mutator/reader closures in `useCallback`, wrap controllers in `useMemo`, wrap `TubeTabPanel` / `CoralTabPanel` in `React.memo`. That is a separate plan with its own behavioral implications (referential stability changes might surface in test snapshots, dev-mode strict-mode double-renders, etc.).

## 14. Pre-mortem — three ways this could fail on first implementation

1. **TypeScript narrowing breaks at the controller boundary.** `peakEff` in the current file uses keyof intersections (`keyof PeakOverrides & keyof BaseSettings`) and union-narrowing tricks. Moving its body into a generic component while passing it as a closure prop may surface narrowing issues that don't exist today because everything is in one scope. *Mitigation:* keep the function signatures identical; only the closure-to-prop boundary changes. Run `tsc --noEmit` aggressively after each step.

2. **A "tiny" cleanup gets bundled in.** The implementer notices `lerp` is used three times and "could be inlined" or sees the `orbs` duplication and "while I'm here" deduplicates it. *Mitigation:* §2 is explicit; reviewer enforces zero-cleanup discipline.

3. **The `colorFormat` plumbing accidentally drops `onColorFormatChange` on a `RealtimeColorRow`.** Today, several `RealtimeColorRow` calls inside the tab panels pass `onColorFormatChange={chooseColorFormat}`. After the split, `chooseColorFormat` reaches the panels via the `onColorFormatChange` prop, then must be re-passed to each `RealtimeColorRow` and `PeakColorRow` inside the panels' bodies. *Mitigation:* §11.2 scenarios 11 and 12 exercise both color-format switching and peak color editing; visually catches a missed plumb.

4. **Leaf-component `useState` (`editing`/`draft`/`drafts`) silently lost on unintended remount.** `EditableColorValue.editing/draft`, `PeakSliderRow.editing/draft`, and `ColorChannelFields.drafts` are useState declared inside leaf components. Today they survive the animator's 60Hz re-renders because React reconciles by element type and key. After the split, if `<TubeTabPanel>` / `<CoralTabPanel>` get a new `key` prop on every parent render (e.g. `key={`${activeTab}-${state}`}`) the leaf state is reset on every state pill or tab toggle and the user's in-flight edit is silently discarded. *Mitigation:* §11.2 scenario 14 reproduces deterministically in the browser; the call sites in §6.2 step 3 deliberately use only stable keys (`tab.key` for the expanded-drawer map; no `key` prop on the single-panel form).

## 15. Open questions for the reviewer

1. ~~**`useMemo` controllers — keep or drop?**~~ Resolved in v2: **drop**. Plain object literals (§13).
2. ~~**Co-locate constants in `types.ts` vs. a separate `constants.ts`?**~~ Resolved in v6: **separate `constants.ts`** per the local convention (every existing `types.ts` in the repo is types-only). See §4b.
3. **`controls.tsx` size budget.** The estimate is rough (§3 softened it to "verify after the move"). If `controls.tsx` reads dense in practice — long switch statements + helpers + interfaces in one file — the follow-up split is to separate `panels-tube.tsx` and `panels-coral.tsx` from the leaf-component primitives. Plan defaults to "accept and revisit post-merge."

---

## Reviewer feedback log

### Round 1 — internal plan-review pass (self)

12 findings applied. Summary:

- **Critical 1** (§10 ↔ §13 hooks contradiction): resolved by dropping the `useMemo` and rewriting §10 + §13 to be consistent.
- **Critical 2** (`coralPeakEff` `unknown` return type): resolved by inlining the precise generic union from the source.
- **Critical 3** (verification gap for in-progress inline edits): added scenario 14 in §11.2 covering `EditableColorValue`, `PeakSliderRow`, `ColorChannelFields`.
- **Major 4** (`git stash` misuse): replaced with `git worktree add HEAD~1`.
- **Major 5** ("parent renders 60×/s" wrong attribution): corrected to child editor in §13.
- **Major 6** (§6.2 ↔ §13 hedge on `useMemo`): committed to "drop `useMemo`" — see resolved item 1 above.
- **Major 7** (§10 DOM contract didn't cover tab panels): extended.
- **Minor 8** (controls.tsx imports): listed in new §6.5.
- **Minor 9** (LOC math): rebadged as rough.
- **Minor 10** (§10 console-log wording): clarified.
- **Minor 11** (Tube vs Coral Replay): split into 9b/9c.
- **Minor 12** (diff-tooling wording): replaced with concrete `diff <(sed ...)` and side-by-side viewer suggestion.

### Round 2 — re-read of v2 (post-edit consistency)

7 findings applied (most introduced by the round-1 edits themselves — exactly the kind of drift the plan-review skill warns about):

- **Critical R2-1** (§9 step 4 still said `useMemo`): rewritten to "plain object literals per §13."
- **Critical R2-2** (§12 risks table referenced the dropped `useMemo`): two rows replaced with one acknowledging the plain-object-every-render is identical to today's behavior.
- **Major R2-3** (§6 subsection ordering scrambled — 6.5 inserted between 6.2 and 6.3): renumbered to 6.1 → 6.2 → 6.3 → 6.4 → 6.5.
- **Major R2-4** (`coralController: ... : null!` vs `: null` mismatch): unified on the typed-nullable `CoralController | null` form. §6.2 step 4 now points at §13 for the canonical form.
- **Major R2-5** (`coralPeakEff` return type unnecessarily clever): replaced the `Record<infer KB, unknown>` extends-infer dance with the source's straightforward `CoralBase[K extends keyof CoralBase ? K : never]`.
- **Minor R2-6** (§13 line range): tightened from "1345–1375" to "1355–1375 (the five mutator/reader declarations)."
- **Minor R2-7** (§11.2 scenario 14 said "in talking state"): broadened to "any state — the animator runs in all four."

§12 also tightened: the shim-path-doesn't-resolve mitigation now correctly cites `tsconfig.json` paths (rather than `next.config.mjs`'s `resolve.modules.push`, which is a different mechanism).

### Round 6 — second external reviewer pass on v6 (6 findings)

All six findings accepted; all were genuine post-edit consistency drift in v6 (the kind plan-review skill flags as "edits introduce new issues").

- **F1 [P1] — `helpers.ts` cannot import only `./types`.** Verified: `talkingRenderForProfile` at L469 references `TALKING_GEOMETRY`, which moved to `constants.ts` in v6. §4c constraint relaxed to allow that single constant import; §9 step 3 already says "verify during step 3" so the implementer will catch any other transitive constant references.
- **F2 [P1] — `constants.ts` import constraint misses `AudioData`.** Verified: `SILENT` at L188 is typed `AudioData` (imported externally at L32). Reviewer's cleaner fix accepted: re-export `AudioData` from `./types` alongside `CoralRealtimeSettings`. §4 export list updated; §4b constraint clarified; §7 internal-imports list updated to drop the external `AudioData` import in favor of the `./types` re-export.
- **F3 [P2] — "four split modules" stale.** §1.1 said "four"; v6 went to six. Updated.
- **F4 [P2] — §11.2 still uses `HEAD~1`.** Reviewer is right — I added the SHA pin in §9 step 0 but missed §11.2's worktree command. Now uses `"$PRE_SPLIT_SHA"`.
- **F5 [P2] — `API`/`CORAL_API` exported vs. private contradiction.** Verified at L189 and L228 of source: both are top-level `const` declarations, never exported (no consumer imports them; the wrappers use them internally). Plan §5 export list was wrong. Now lists them under "Module-private (NOT exported)" with the explicit explanation.
- **F6 [P3] — §15 q2 stale.** Marked resolved per v6's `constants.ts` decision.

### Round 5 — external reviewer (5 findings) + 1 self-found

External reviewer's verdict: directionally right, four-module structure reasonable. Five findings:

- **F1 [P1] — `CORAL_PULSE_DEFAULTS` missing from controls.tsx imports.** Accepted. Verified at source line 33 (import) + lines 2225-2226 (usage in `renderCoralTabControls`). Direct value import added to §6.5; no controller-passthrough invented (would manufacture a contract for no reason).
- **F2 [P2] — index.tsx imports too incomplete.** Accepted. §7 expanded from three placeholder lines into an explicit external + internal import enumeration. Includes the `approxPixelDia` exclusion note (lives in `controls.tsx` only) so the implementer doesn't double-import.
- **F3 [P2] — types.ts is doing more than "types".** Refined further than the reviewer suggested. Reviewer proposed renaming to `model.ts`. Codebase check showed every existing `types.ts` in this repo is **types-only** (no `model.ts` precedent anywhere). Right answer: honor the convention, split into `types.ts` (types only) + `constants.ts` + `helpers.ts`. Six total files, well below the "8-10 too many" threshold the reviewer flagged. Plan §3, §3.1, §4, §4b, §4c, §6.5, §7, §9 all updated.
- **F4 [P2] — controls.tsx will likely be large but acceptable for this pass.** Reviewer endorsing existing §15 q3 stance. No action.
- **F5 [P3] — `HEAD~1` reliance fragile.** Accepted. Plan now pins `$PRE_SPLIT_SHA` as a §9 step 0; §11.3 references it instead of `HEAD~1`.

Self-found:

- **F-self-1 [P3] — pre-mortem item 4 only verifiable at runtime.** Pre-mortem #4 (leaf-component useState loss on remount) was checked only by §11.2 scenario 14 (browser test). Added a code-review-time grep check in §11.1 to catch unstable React keys before the dev server even starts.

### Round 4 — user pushback on §1.1 framing

User flagged that v1–v4 made the destination decision sound like a contested routing-constraint discovery. It isn't — it's the established convention in this codebase (clipperstream, trace, ai-confidence-tracker, receipt-scanner, reading-practice, etc. all keep page files thin and put support code in `src/projects/<thing>/`). v5 trims §1.1 from a "Decision" section into a one-paragraph statement of where files go, removes the obsolete "routing constraint" risk row from §12, and updates the predecessor-handoff reference to stop calling out the location as a "conflict."

### Round 3 — re-read of v3

5 findings, all minor / polish:

- **Major R3-1** (§12 risks table said "13 scenarios"): updated to "14 scenarios (16 sub-checks counting 9a/9b/9c separately)."
- **Major R3-2** (§15 question 3 still cited a hard "~1000 lines" budget after §3 softened LOC): rewritten to a soft "if `controls.tsx` reads dense, follow-up is `panels-tube.tsx` / `panels-coral.tsx`."
- **Major R3-3** (Pre-mortem missing the inline-edit-state-loss case): added §14 item 4 covering `EditableColorValue` / `PeakSliderRow` / `ColorChannelFields` useState loss on unintended remount, paired with the §11.2 scenario 14 verification.
- **Minor R3-4** (§11.3 referenced `/tmp/realtime-states.OLD.tsx` without telling the implementer to populate it): replaced with self-contained `git show HEAD~1:... | diff -`.
- **Minor R3-5** (§11.3 "three categories" wording but only two were listed): rewritten to enumerate categories (a)/(b)/(c) explicitly.

After v4, the plan is ready for an external reviewer or implementation.
