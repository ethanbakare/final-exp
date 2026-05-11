# Radial editing controls on realtime-states — plan

## Goal

When a radial profile is active in `/voiceinterface/realtime-states`, surface the same editing controls (Geometry, Bars, Audio, Wave, Envelope, Style, Backdrop, Morph) that exist on `/voiceinterface/radial-states`. Edits persist via `persistRadialProfiles`. Same data file (`radial-states-profiles.json`) so changes are visible on both pages.

## Strategy

The radial-states page already has a `ControlsPanel` component (~431 lines, in `radial-states/index.tsx` ~L877–1349) that does all the editing. Strategy is to **extract** it (plus its UI primitives) into a standalone module that both pages can import.

## Stages

### Stage R0 — Plan doc (this file)
Commit: `docs(radial-states): plan for radial controls on realtime-states`

### Stage R1 — Extract ControlsPanel + dependencies
Create new file `src/projects/voiceinterface/radial-states/ControlsPanel.tsx`. Move into it:
- `ControlsPanel` (the main editor panel)
- UI primitives: `Slider`, `Toggle`, `ColorSwatch`, `PillGroup`
- Local-to-the-panel helpers: any backdrop-related private functions used by ControlsPanel

Also extract to `radial-states/editorHelpers.ts`:
- `applyPatch` (patch + link-propagation)
- `materializeState` (linked profile → focused-state RadialSettings)

Update `radial-states/index.tsx` to import from these new modules. No behaviour change on the radial-states page.

Commit: `refactor(radial-states): extract ControlsPanel + helpers into shared modules`

### Stage R2 — RadialEditorPanel wrapper
Create `src/projects/voiceinterface/realtime-states/RadialEditorPanel.tsx`. Takes:
- `profile: RadialLinkedProfile` (active radial orb's settings)
- `focused: PreviewState` ('idle' | 'listening' | 'thinking' | 'talking')
- `onProfileChange(next: RadialLinkedProfile)` (persisted callback)

Internally:
- Derive the focused state's `RadialSettings` via `materializeState`.
- On any field change, build the next profile via `applyPatch` (preserves link propagation).
- Mount `<ControlsPanel>` with the materialized settings + an `onChange` that bubbles up the patched profile.
- Pass `baselineSettings={null}` for now (no per-field reset icons; full dirty-tracking lands later).

Commit: `feat(realtime-states): RadialEditorPanel — bridges radial ControlsPanel to realtime-states state shape`

### Stage R3 — Wire into realtime-states bottom drawer
In `realtime-states/index.tsx`:
- When `activeOrb.shader === 'radial'`, the existing tab popover / expanded drawer renders `<RadialEditorPanel>` instead of `<TubeTabPanel>` / `<CoralTabPanel>`.
- On change: update `radialProfiles` array (replace the active profile by id) and `persistRadialProfiles`.

The tab-button row (Size/Thickness/Motion/Colours) is Tube/Coral-specific and is hidden for radial (the radial panel is a single scrollable surface with all sections, like the radial-states page).

Commit: `feat(realtime-states): mount RadialEditorPanel for radial profiles`

### Stage R4 — Smoke
- Select a radial profile → controls appear.
- Tweak a slider → orb reflects the change live, JSON is persisted, /voiceinterface/radial-states sees the same edit.

## Out of scope (for this slice)

- Per-field reset arrows / dirty highlighting (the realtime-states baseline machinery is shaped around Tube/Coral settings shapes; radial baseline tracking can land in a follow-up).
- Save-as-new for radial (the existing Save dialog only offers Tube/Coral targets).
- Renaming radial profiles inline in the dropdown (works on the radial-states page; can be added here later).
- Skip-intro toggle for radial (V2 animator has no intro animation, so toggle is N/A; the row already omits the icon).
