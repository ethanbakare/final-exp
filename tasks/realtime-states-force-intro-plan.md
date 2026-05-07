# `forceIntroOnSelect` per-profile toggle — plan v2

> Per-profile boolean flag that forces the talking-to-idle intro animation to replay when the user selects that profile, even on a same-shader switch. Opt-in (default off). Lands as a small feature with a schema bump on both profile JSON files. No behavior change for existing profiles.
>
> Status: **v2 — internal plan-review pass applied (3 major + 4 minor findings).**

## 0. Concept index

| Concept | First defined | Notes |
| --- | --- | --- |
| `forceIntroOnSelect` | §3 | New optional boolean field on both `SavedProfile` and `SavedCoralProfile`. |
| `selectionReplayCounter` | §5 | New per-shader counter in the editor + live page. Bumps when a force-intro profile is selected. |
| `restartIntro()` | §5 | Existing helper in the editor (Tube path); called by Replay button and cascade. |
| `replayCounter` | §5 | Existing counter for Coral remount; the editor already uses it for the Replay button. |
| `selectionReplayKey` | §5.3 | New prop on `RealtimeBlob` (live page). Lifts the editor's `replayCounter` pattern into the dispatcher. Type: `number`. |
| Same-shader switch | §1 | Switching between two profiles of the same shader (e.g. Kyoto Realtime ↔ Nebularr). Currently prop-only — no remount, no intro. |
| Cross-shader switch | §1 | Switching between Coral and Tube. Currently remounts the canvas component-type → intro plays naturally. |

## 1. Why

Today's contract for profile selection:

| Switch | Behavior | Mechanism |
| --- | --- | --- |
| Cross-shader (Coral ↔ Tube) | Intro plays | Canvas component-type swap (CoralStoneMorph ↔ NebularrBlob in the live page; same in the editor) → React unmount/remount → fresh `morphRef`/`activeTauOverrideRef` → talking-to-idle intro |
| Same-shader (Kyoto ↔ Nebularr; Coral A ↔ Coral B) | No intro | Canvas stays mounted; props update in place. Smooth interpolation via `useEasedNumber`/`useEasedColor` (Coral) or the JS animator (Tube). |
| Cascade resolution on first paint | Intro plays | Editor lazy-init seeds `render` from `talkingRenderForProfile(activeOrb.settings)`; animator interpolates back to `idle`. Same effect as Replay. |

The same-shader "no intro" is the round-7 F1 contract — it's by design so the user can A/B between similar profiles without visual disruption. But sometimes a profile is distinctive enough to deserve the full talking → idle entry every time — e.g. a brand-y "signature" profile.

This adds an opt-in per-profile override. Default off preserves today's behavior across the entire profile library.

## 2. Out of scope (explicit)

- Toggling the field on the **active** profile to force an immediate intro replay — covered by the existing Replay button.
- Cross-shader switches — these already remount and play the intro; the toggle has no effect on cross-shader paths.
- Editor cascade-resolved first-paint — already plays the intro by lazy-init design (see `RealtimeStatesEditor`'s `useState<RenderValues>` initializer).
- A symmetric `pinnedOnLivePage` or any other unrelated schema change — purely the one new field.
- A "force intro on save" or "force intro on rename" toggle — those are separate features. The trigger is *selection*, not modification.

## 3. Schema bump

Both files gain one optional field on each profile entry:

```ts
interface SavedProfile {
  id: string;
  name: string;
  pinned?: boolean;
  forceIntroOnSelect?: boolean;  // NEW — default false when missing
  settings: LinkedProfile;
  lastModified: number;
}

interface SavedCoralProfile {
  id: string;
  name: string;
  pinned?: boolean;
  forceIntroOnSelect?: boolean;  // NEW — default false when missing
  settings: CoralRealtimeSettings;
  lastModified: number;
}
```

Field is **optional**. Existing JSON entries lack the field; they read as `undefined` → treated as `false`. **No file migration needed.** New profiles created after this change get `forceIntroOnSelect: false` written by the Save path (or the field is omitted entirely, since `false` is the default — TBD in §5; both work, see §5.4).

The `LoadedOrb` discriminated union in both editor and live page also needs the field, so `selectProfile` can read it without a separate dropdown-row lookup.

## 4. UI — editor dropdown row toggle

Each profile in the editor's dropdown gets a third icon button next to the existing bookmark + pencil:

```
[Disc/Circle icon] [Profile name]              [Bookmark] [Force-intro toggle] [Pencil]
```

**Visual spec.**

- Icon: lucide `RotateCcw` (matches the existing Replay button's iconography — same conceptual action).
- Off state: `text-gray-300 hover:text-gray-600` (matches today's pencil button).
- On state: `text-amber-500 hover:text-amber-600` (matches today's pinned-bookmark active state).
- Title: `Force intro replay on select` (off) / `Pinned: intro replays on every select (click to disable)` (on).
- Click target: 12px icon, same hit area as bookmark/pencil.

**Behavior.**

- Click toggles the field, persists immediately via `persistProfiles` / `persistCoralProfiles` (same path as `togglePinned` / `togglePinnedCoral`).
- Bumps `lastModified` (same as bookmark/rename).
- Does **not** mark the editor dirty — the field isn't part of `settings`, just like `pinned`. The `isDirty` IIFE compares only `activeOrb.settings` vs. `activeBaseline.settings`, so this naturally works without changes. **Explicit verification** (§9.2 scenario): toggling the field on the active profile must NOT show the Discard/Update buttons.

## 5. Wiring

### 5.1 Editor — Tube path

`selectProfile(id)` currently:

```tsx
const selectProfile = (id: string) => {
  const found = tubeProfiles.find((p) => p.id === id);
  if (!found) return;
  setActiveOrbKey(`realtime-state:${id}`);
  setActiveBaseline({ key: ..., shader: 'tube', settings: structuredClone(found.settings) });
  restartIntro(found.settings);  // ← already plays intro on every select today!
  setShowProfileDropdown(false);
};
```

**Surprise on re-read:** `selectProfile` already calls `restartIntro(found.settings)` on every select. Reading the existing code: when the user clicks a Tube profile in the dropdown, the intro **does** replay — because `restartIntro` reseeds `render` to talking values and re-arms the tau override. So the "same-shader switch = no intro" contract from round-7 F1 is **only** observed for **Coral** today, not Tube.

**Implication for this plan:** the Tube path needs zero changes for the field to take effect — Tube already replays on every select. The field's only effective use on Tube is hypothetical: if a future change ever made Tube same-shader switch prop-only, this field would gate it. For today, Tube is a no-op.

**Decision:** still expose the toggle on Tube profiles for symmetry (so users see the same UI on both shaders) and so the field exists when/if Tube same-shader behavior changes. But document in code + comments that Tube currently replays unconditionally.

### 5.2 Editor — Coral path

`selectCoralProfile(id)` currently:

```tsx
const selectCoralProfile = (id: string) => {
  const found = coralProfiles.find((p) => p.id === id);
  if (!found) return;
  setActiveOrbKey(`realtime-coral:${id}`);
  setActiveBaseline({ key: ..., shader: 'coral', settings: structuredClone(found.settings) });
  // No restartIntro — same-shader Coral A → B is prop-only by F1 contract.
  setShowProfileDropdown(false);
};
```

After the change:

```tsx
const selectCoralProfile = (id: string) => {
  const found = coralProfiles.find((p) => p.id === id);
  if (!found) return;
  // Self-select guard — clicking the already-active profile in the
  // dropdown should not re-bump replayCounter, otherwise the orb
  // re-mounts on every redundant click. (Mirrors §5.3's live-page
  // guard. Today's selectCoralProfile already silently no-ops on
  // self-select via React's setActiveOrbKey-with-same-value bail,
  // but bumping replayCounter forces a re-render regardless, so
  // we need the explicit guard here.)
  if (activeOrb?.shader === 'coral' && activeOrb.id === id) {
    setShowProfileDropdown(false);
    return;
  }
  setActiveOrbKey(`realtime-coral:${id}`);
  setActiveBaseline({ key: ..., shader: 'coral', settings: structuredClone(found.settings) });
  if (found.forceIntroOnSelect) {
    setReplayCounter((c) => c + 1);  // bumps the Canvas key, forces remount + intro
  }
  setShowProfileDropdown(false);
};
```

The `replayCounter` is already a React state in `RealtimeStatesEditor` and is already wired into the Canvas's `<CoralStoneMorph key={`coral-${replayCounter}`}>`. Bumping it forces the canvas remount, which is the existing same-shader replay mechanism (used by the Replay button). No new state, no new prop plumbing — just the guard plus one bump line.

### 5.3 Live page — both shaders

`VoiceRealtimeOpenAI.tsx`'s thumbnail-strip click handler currently:

```tsx
onClick={() => setActiveOrbKey(key)}
```

`RealtimeBlob` (the dispatcher) takes `orb` and renders `<NebularrBlob>` or `<CoralRealtimeBlob>` based on `orb.shader`. There's no current per-shader replay mechanism on the live page (no Replay button — that's editor-only). Adding force-intro for the live page requires adding a counter prop that gets keyed onto the inner blob component.

Two options for the live page:

**Option A — counter in `VoiceRealtimeOpenAI` + key on `<RealtimeBlob>`.** Simpler. `<RealtimeBlob key={…}>` remount cascades down through both branches. But this remounts the dispatcher every time, even on pure prop updates from the same profile — that's unnecessary noise.

**Option B — counter in `VoiceRealtimeOpenAI`, passed as prop to `RealtimeBlob`, applied to the inner blob's key.** Surgical. Requires `RealtimeBlob` to take a new `selectionReplayKey?: number | string` prop and pass it down (combined with shader) into the inner blob's React key. e.g. `<CoralRealtimeBlob key={`coral-${selectionReplayKey ?? 0}`}>` and the same shape on `<NebularrBlob>`.

**Decision:** **Option B**. One extra prop, applied surgically. Same approach as the editor's `replayCounter`. Doesn't pollute the dispatcher with extra remounts.

`VoiceRealtimeOpenAI` change:

```tsx
const [selectionReplayCounter, setSelectionReplayCounter] = useState(0);

const handleThumbnailClick = (orb: LoadedOrb) => {
  if (orb.forceIntroOnSelect && activeOrb?.id !== orb.id) {
    setSelectionReplayCounter((c) => c + 1);
  }
  setActiveOrbKey(orbKey(orb));
};

// in JSX:
<RealtimeBlob
  audioData={audioData}
  voiceState={getVoiceState()}
  orb={realtimeOrb}
  selectionReplayKey={selectionReplayCounter}  // NEW
/>
```

`RealtimeBlob.tsx` change:

```tsx
interface RealtimeBlobProps {
  audioData: AudioData;
  voiceState: RealtimeVoiceState;
  orb: RealtimeOrb;
  width?: number;
  height?: number;
  selectionReplayKey?: number | string;  // NEW
}

// in body:
const replayKey = selectionReplayKey ?? 0;
if (orb.shader === 'coral') {
  return <CoralRealtimeBlob key={`coral-${replayKey}`} ... />;
}
return <NebularrBlob key={`tube-${replayKey}`} ... />;
```

The inner blobs already remount on `key` change, which resets their internal animator state — exact same mechanism as cross-shader switch.

**Important guard:** the `if (orb.forceIntroOnSelect && activeOrb?.id !== orb.id)` check ensures clicking the **already-active** thumbnail doesn't bump the counter. Otherwise every same-thumb re-click would replay the intro, which is annoying. Same intent as the editor's bookmark icon doesn't fire its action when re-clicked.

### 5.4 Persistence: write the field on Save?

When the editor's two-step Save dialog creates a new profile, today the entry shape is:

```tsx
const entry: SavedProfile = {
  id: `rt-${crypto.randomUUID()}`,
  name,
  pinned: false,
  settings,
  lastModified: Date.now(),
};
```

After this change: **Save-as-new omits the field entirely** — new profiles default off via the `?? false` read. **No fork inheritance** — even when forking from a profile with `forceIntroOnSelect: true`, the new B profile starts off (the toggle is a per-profile preference, not a "settings" attribute, and inheriting it would be surprising). Same shape as `pinned` already does (Save creates with `pinned: false`, not by inheriting the source's pinned state).

The toggle path itself does write the field (both directions), so a profile's persisted JSON ends up in one of three states over its lifetime:

| Source action | Persisted state | Read-as |
| --- | --- | --- |
| Created by Save-as-new (or pre-existing legacy entry) | `{ ... }` (field absent) | `false` via `?? false` |
| Toggled on by user, never toggled off | `{ ..., forceIntroOnSelect: true }` | `true` |
| Toggled on then off | `{ ..., forceIntroOnSelect: false }` | `false` |

All three states behave identically at runtime. The user's toggle UI reads `pr.forceIntroOnSelect ?? false` so the absent and explicit-`false` cases are indistinguishable in the editor.

Implementer notes:

- `togglePinned`'s pattern: `{ ...pr, pinned: !pr.pinned, lastModified: Date.now() }`.
- New `toggleForceIntroOnSelect` follows the same shape: `{ ...pr, forceIntroOnSelect: !(pr.forceIntroOnSelect ?? false), lastModified: Date.now() }`. The `?? false` handles the "missing field reads as false" contract for the toggle's source-of-truth read.

## 6. Files touched

- `src/projects/voiceinterface/realtime-states/types.ts` — add `forceIntroOnSelect?: boolean` to `SavedProfile`, `SavedCoralProfile`, both arms of `LoadedOrb`, and `DropdownRow`.
- `src/projects/voiceinterface/realtime-states/index.tsx` — bump replayCounter in `selectCoralProfile` when set; new `toggleForceIntroOnSelect` / `toggleForceIntroOnSelectCoral` mutators (mirror `togglePinned`/`togglePinnedCoral`); pass `forceIntroOnSelect` through the `orbs` useMemo so the dropdown row can read it.
- `src/projects/voiceinterface/realtime-states/controls.tsx` — no changes (this is the panels file; the toggle lives in the dropdown row, which is in `index.tsx`'s bottom-bar JSX).
- `src/projects/voiceinterface/components/RealtimeBlob.tsx` — accept new `selectionReplayKey?: number | string` prop, thread it into the inner blob's `key`.
- `src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx` — extend `LoadedOrb` discriminated union with the field, read it in the thumbnail click handler, manage `selectionReplayCounter` state, pass `selectionReplayKey` to `RealtimeBlob`.

## 7. Migration steps

Single commit:

1. Add `forceIntroOnSelect?: boolean` to types in `realtime-states/types.ts`.
2. Add the field to `LoadedOrb` in `VoiceRealtimeOpenAI.tsx`.
3. Add the field to `LoadedOrb`'s `orbs` useMemo construction in both editor and live page (read from `p.forceIntroOnSelect === true`, default false).
4. Add `toggleForceIntroOnSelect` + `toggleForceIntroOnSelectCoral` mutators in `realtime-states/index.tsx` (mirroring `togglePinned`/`togglePinnedCoral`).
5. Add the icon button to the dropdown row JSX in `realtime-states/index.tsx` (between bookmark and pencil for both Tube and Coral rows).
6. Add the if-check + `setReplayCounter` bump to `selectCoralProfile`.
7. (Tube path: no change — already plays intro on every select.)
8. Add `selectionReplayKey` prop to `RealtimeBlob.tsx`, thread to inner blob keys.
9. Add `selectionReplayCounter` state + thumbnail click guard + prop pass in `VoiceRealtimeOpenAI.tsx`.
10. `npx tsc --noEmit` clean.
11. Manual smoke test (§9).

## 8. Behavioral preservation contract

Zero changes to:

- The `pinned` flag: behavior, persistence, UI.
- The `lastModified` bump pattern.
- The dirty-detection contract (`isDirty` IIFE compares only `settings`).
- The cascade resolution / `cascadeReady` gate.
- Cross-shader switch behavior (the new field is checked only on same-shader paths).
- Existing JSON entries: every existing profile reads as `forceIntroOnSelect: false`, which is identical to today's behavior.
- The Tube `selectProfile` — explicitly unchanged because it already replays unconditionally.

## 9. Verification

### 9.1 Static checks

- `npx tsc --noEmit` exits 0.
- `npm run build` exits 0.

### 9.2 Manual scenarios

**Editor** (at `/voiceinterface/realtime-states`):

1. **Coral force-intro on, switch from another Coral.** Save a fresh second Coral profile via the Save dialog (or use any second pinned Coral if present). Toggle the new icon on for `Coral Realtime`. Switch to the second Coral. Then click `Coral Realtime` in the dropdown. **Expected:** Coral Realtime's selection forces an intro replay (sphere → torus visible). The toggle persists across reload.
2. **Coral force-intro off, switch from another Coral.** Toggle off for `Coral Realtime`. Switch from the second Coral → `Coral Realtime`. **Expected:** prop-only smooth interpolation, no intro replay (today's contract).
3. **Tube force-intro on (today's no-op).** Toggle on for a Tube profile (`Nebularr`). Switch Kyoto Realtime → Nebularr. **Expected:** intro replays. **Note:** intro also replays without the toggle on Tube, because `selectProfile` already calls `restartIntro` unconditionally — toggle is a no-op for Tube today (documented in code comment alongside `selectProfile`).
4. **Self-select with toggle on.** Coral profile with toggle on. Click the same profile in the dropdown while it's already active. **Expected:** no replay — the new self-select guard in `selectCoralProfile` (§5.2) early-returns before bumping `replayCounter`. Same expected behavior on the live page (§5.3 guard).
5. **Save fork doesn't inherit the field.** Toggle on for one profile (e.g. `Coral Realtime`). Save-as-new under a different name (e.g. `Test Fork`). **Expected:** the source's flag is unchanged; the new fork has `forceIntroOnSelect` absent (= false) and its dropdown row's toggle icon shows the off state.

6. **Toggle does not mark editor dirty.** With the active profile, toggle the new icon on. **Expected:** the bottom-bar Discard/Update buttons do NOT appear (the toggle is metadata, like `pinned`, not a settings change). Confirms §4's dirty-detection contract.

**Live page** (at `/voiceinterface/realtime`):

6. Pin two Tube profiles + two Coral profiles. Toggle on for one Tube and one Coral. From the live page thumbnail strip, switch to each in turn. **Expected:** the toggled-on profiles' selections force a remount + intro; the toggled-off profiles' selections are prop-only smooth.
7. Click the active thumbnail repeatedly. **Expected:** no replay on each click (guard prevents self-select bump).

**JSON round-trip**:

8. Toggle on for a profile in the editor. Inspect `realtime-state-profiles.json` (or coral) — confirm the field is written.
9. Toggle off. Confirm the field is set to `false` (NOT removed — keeping the field as `false` is fine; treating undefined and false as equivalent is the contract).
10. Reload the editor. Confirm the toggle UI reflects the persisted value.

### 9.3 Pre-mortem — three ways this could fail

1. **The "self-select" guard is missed in the editor.** Editor's `selectCoralProfile` doesn't check if `id === activeOrb.id` before bumping. Today's `setActiveOrbKey` to the same key is a no-op (React useState bails on identical values), but bumping `replayCounter` ALWAYS triggers a re-render and a Canvas remount. So clicking the active thumbnail when the active profile has `forceIntroOnSelect: true` would needlessly remount on every click. *Mitigation:* add `if (id === activeOrb?.id) return;` early in `selectCoralProfile`, or guard the `setReplayCounter` call. Same shape as the live page guard in §5.3.

2. **The field is dropped on Save.** If `handleSave`'s same-shader fork branch builds the new entry from the active settings without including `forceIntroOnSelect`, a forked profile loses its parent's flag. *Mitigation:* `forceIntroOnSelect` is intentionally NOT inherited on fork — the new B is its own profile, defaults off. Document this explicitly in §5.4.

3. **The live page's `selectionReplayKey` prop is forgotten on the cross-shader path.** When user goes Coral → Tube on the live page with `forceIntroOnSelect: true` on the Tube target, the cross-shader switch already remounts; the additional key bump is redundant. Not a bug — just a no-op double trigger. But worth noting that the field's effect only matters on same-shader paths. The if-guard in §5.3 (`activeOrb?.id !== orb.id`) makes this work correctly for both cross-shader and same-shader.

## 10. Open questions for the reviewer

1. ~~Field omitted vs persisted as `false` when off?~~ Resolved in v2 §5.4 (table): all three persisted states are valid and equivalent. Save-as-new omits; toggle path writes both directions explicitly.
2. ~~Should `selectProfile` (Tube) gate `restartIntro` on the field?~~ Resolved in v2 §5.1: leave unconditional. Tube's existing behavior is "always replays on select"; the field is forward-looking infrastructure for if Tube same-shader behavior ever changes.
3. ~~`selectionReplayKey` typed `number | string`?~~ Resolved in v2: just `number`.
4. **Real open question.** Should the toggle icon use lucide `RotateCcw` (matches Replay button) or `Repeat` (matches auto-loop)? Both are conceptually adjacent. Slight preference for `RotateCcw` since it's literally the same action ("replay the intro"). Reviewer's call.

---

## Reviewer feedback log

### Round 1 — internal plan-review (self)

7 findings applied:

- **Major M1** (§10 q2 already decided): dropped, replaced with the icon-choice question (which is genuinely open).
- **Major M2** (§9.2 referenced deleted "Refactor Test" profile): rewrote scenarios 1, 2, 5 with generic phrasing.
- **Major M3** (editor self-select asymmetry): added explicit guard in `selectCoralProfile`, mirroring §5.3's live-page guard. Code shape now symmetric: both paths early-return on self-select before bumping their respective counters.
- **Minor m1** (§5.4 wording): rewrote with the persistence-states triple table making the three valid JSON states explicit.
- **Minor m2** (fork inheritance buried in pre-mortem): moved into §5.4 as canonical statement.
- **Minor m3** (`selectionReplayKey` type hedging): committed to `number`.
- **Minor m4** (concept index missing `selectionReplayKey`): added.

### Round 2 — pre-mortem

After v2 patches, the next likely reviewer findings would be: (a) the dropdown-row JSX layout might not have hit-area room for a third icon button between bookmark and pencil, and (b) the toggle's persistence path doesn't explicitly say "do NOT mark editor dirty" even though that's implied by `isDirty` only inspecting `settings`. Both are easy to verify pre-implementation; flag for the next round.
