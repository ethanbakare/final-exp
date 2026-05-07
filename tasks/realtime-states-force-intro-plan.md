# `forceIntroOnSelect` per-profile toggle — plan v5

> Per-profile boolean flag that forces the talking-to-idle intro animation to replay when the user selects that profile, even on a same-shader switch. Opt-in (default off; **Coral-only** behavioral change — see §5.1). Lands as a small feature with a schema bump on both profile JSON files. No behavior change for existing profiles.
>
> Status: **v5 — external reviewer round-3 cleanup applied (3 P3 wording fixes; reviewer signed off as implementation-ready in round-3).**

## 0. Concept index

| Concept | First defined | Notes |
| --- | --- | --- |
| `forceIntroOnSelect` | §3 | New optional boolean field on both `SavedProfile` and `SavedCoralProfile`. |
| `selectionReplayCounter` | §5.3 | New counter on the **live page only**. Bumps when a force-intro profile is selected (subject to §5.3's four-condition guard). The editor reuses its existing `replayCounter` for the same purpose; no new editor counter is introduced. |
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
- Cross-shader switches — these already remount the canvas via component-type swap; the toggle has no effect on cross-shader paths. (Caveat: cross-shader Tube → Coral on the talking pill has a pre-existing intro-doesn't-play bug — see §5.2a. Force-intro doesn't address it.)
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

Field is **optional**. Existing JSON entries lack the field; they read as `undefined` → treated as `false`. **No file migration needed.** Save-as-new omits the field entirely (per §5.4); the toggle path is the only writer and writes both `true` and `false` explicitly when the user toggles.

The `LoadedOrb` discriminated union (in both editor and live page) gains the optional field — but only the **live page** actually reads it via `LoadedOrb` (the `handleThumbnailClick(orb)` handler reads `orb.forceIntroOnSelect === true`). The **editor** reads the field directly from the source-array profile entry inside `selectCoralProfile`: `const found = coralProfiles.find(...); if (found.forceIntroOnSelect === true) ...`. The dropdown row JSX likewise renders from `coralProfiles.map(...)` directly, not from a `LoadedOrb` projection. `LoadedOrb` carries the field in the editor purely for type-shape consistency / forward use (e.g. if a future change wants to read flags off `activeOrb` directly).

**Optional-on-LoadedOrb contract:** the field is `forceIntroOnSelect?: boolean` everywhere — `SavedProfile`, `SavedCoralProfile`, both arms of `LoadedOrb`. The `orbs` useMemo construction passes the value through unchanged (`forceIntroOnSelect: p.forceIntroOnSelect`, no normalization), so `LoadedOrb` instances may have `undefined`, `true`, or `false`. **All runtime reads use `=== true` defensively** — never truthy check, never `?? false` rewrites — so missing/false/true all behave correctly. This contract makes fallback orbs (`CORAL_FALLBACK_ORB`, `NEBULARR_FALLBACK_ORB`) work without modification.

## 4. UI — editor dropdown row toggle

**Coral rows only** — Tube rows are unchanged (per §5.1 — Tube already replays on every select today, so a toggle there would be misleading).

The Coral row gains a third icon button between the existing bookmark and pencil:

```
Coral row:  [Circle icon] [Profile name]    [Bookmark] [Force-intro toggle] [Pencil]
Tube row:   [Disc icon]   [Profile name]    [Bookmark]                       [Pencil]   ← unchanged
```

**Visual spec.**

- Icon: lucide `RotateCcw` (matches the existing Replay button's iconography — same conceptual action).
- Off state: `text-gray-300 hover:text-gray-600` (matches today's pencil button).
- On state: `text-amber-500 hover:text-amber-600` (matches today's pinned-bookmark active state).
- Title (off state): `Force intro replay on select`
- Title (on state): `Force-intro on — intro replays every time this profile is selected (click to disable)`. **Do not** use the word "Pinned" — that's bookmark/pin terminology and would confuse the two features.
- Click target: 12px icon, same hit area as bookmark/pencil.

**Behavior.**

- Click toggles the field, persists immediately via `persistCoralProfiles` (Tube has no toggle UI per §5.1, so `persistProfiles` is not part of this feature; the schema field on `SavedProfile` is forward-compat only).
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

**Decision:** **Hide the toggle UI on Tube dropdown rows.** Showing an interactive toggle that does nothing (off-state still replays, on-state changes nothing) is misleading UX. The schema field stays on `SavedProfile` for forward compatibility — if Tube same-shader behavior is ever changed to prop-only, this field is ready to gate the replay mechanism. But the editor's dropdown JSX renders the toggle button **only on Coral rows**.

If a future change toggles Tube same-shader behavior to prop-only, two things flip together: (a) `selectProfile` stops calling `restartIntro` unconditionally and starts gating on `forceIntroOnSelect`, (b) the dropdown JSX starts rendering the toggle for Tube rows. Document this future-state coupling in §6 file comments.

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
  // dropdown short-circuits BOTH the state flip and the counter bump
  // below. That's intentional: self-select on a force-intro profile
  // is a no-op (user has the Replay button for manual replay).
  if (activeOrb?.shader === 'coral' && activeOrb.id === id) {
    setShowProfileDropdown(false);
    return;
  }
  setActiveOrbKey(`realtime-coral:${id}`);
  setActiveBaseline({ key: ..., shader: 'coral', settings: structuredClone(found.settings) });
  // Force-intro bump path. Two conditions required:
  //  1. Active orb is already Coral (same-shader switch). On cross-shader
  //     Tube → Coral, the canvas naturally remounts via component-type
  //     swap; bumping the counter is redundant and contradicts §10's
  //     "cross-shader unchanged" contract.
  //  2. Target profile has the flag enabled.
  // The state flip mirrors the existing Replay button (index.tsx:1408-1417):
  // the Coral canvas computes `goal = state === 'talking' ? 0 : 1`. If
  // the user is currently on the talking pill, remounting alone keeps
  // goal=0 → sphere stays sphere, NO intro. So we also flip state to
  // 'idle' so the freshly mounted blob targets goal=1 and morphRef-from-zero
  // plays sphere → torus.
  if (activeOrb?.shader === 'coral' && found.forceIntroOnSelect === true) {
    setState('idle');
    setReplayCounter((c) => c + 1);  // bumps Canvas key, forces remount
  }
  setShowProfileDropdown(false);
};
```

The `replayCounter` is already a React state in `RealtimeStatesEditor` and is already wired into the Canvas's `<CoralStoneMorph key={`coral-${replayCounter}`}>`. Bumping it forces the canvas remount, which is the existing same-shader replay mechanism (used by the Replay button). The `setState('idle')` call mirrors the Replay button's path; without it, mid-talking force-intro fails silently. No new state, no new prop plumbing — self-select guard + same-shader/flag gate + state flip + bump.

**Note on cross-shader behavior:** when `activeOrb?.shader === 'tube'` and the user selects a Coral profile (with or without force-intro), the same-shader guard above rejects the bump — the cross-shader natural remount handles the canvas swap. See §5.2a for a known limitation in this path.

### 5.2a Cross-shader Coral on talking pill — known limitation (pre-existing, out of scope)

This plan does **not** fix an existing bug: cross-shader Tube → Coral while the user is on the `talking` state pill, with or without `forceIntroOnSelect`, fails to play the sphere → torus intro.

Reasoning:

1. `selectCoralProfile` (today's behavior) doesn't flip state on cross-shader.
2. Canvas dispatches by shader → fresh `<CoralStoneMorph>` mounts.
3. But state is still `'talking'` → `goal=0` → sphere stays sphere; no morph fires.

This is asymmetric with Tube: cross-shader Coral → Tube DOES replay because `selectProfile` (Tube path) calls `restartIntro` unconditionally, which reseeds render values regardless of state.

**Why out of scope here:** force-intro's purpose is to override the *same-shader-no-replay contract*. The cross-shader-talking-pill bug is an asymmetry between Tube and Coral cross-shader behavior — different concern, separate fix. Two scope-clean options for a follow-up plan:

- (a) Always `setState('idle')` on cross-shader Coral selection (matches Tube's restartIntro path).
- (b) Add a Coral equivalent of `restartIntro` that's invoked from `selectCoralProfile` on cross-shader paths.

Either way, that work is independent of this plan. **Force-intro's contract here is: "when the editor or live page is in a non-talking state and the user selects this profile, the intro replays on same-shader switches that wouldn't otherwise replay."** Talking-pill cross-shader behavior is what it is today; force-intro doesn't promise to fix it.

### 5.3 Live page — both shaders

`VoiceRealtimeOpenAI.tsx`'s thumbnail-strip click handler currently:

```tsx
onClick={() => setActiveOrbKey(key)}
```

`RealtimeBlob` (the dispatcher) takes `orb` and renders `<NebularrBlob>` or `<CoralRealtimeBlob>` based on `orb.shader`. There's no current per-shader replay mechanism on the live page (no Replay button — that's editor-only). Adding force-intro for the live page requires adding a counter prop that gets keyed onto the inner blob component.

Two options for the live page:

**Option A — counter in `VoiceRealtimeOpenAI` + key on `<RealtimeBlob>`.** Simpler. `<RealtimeBlob key={…}>` remount cascades down through both branches. But this remounts the dispatcher every time, even on pure prop updates from the same profile — that's unnecessary noise.

**Option B — counter in `VoiceRealtimeOpenAI`, passed as prop to `RealtimeBlob`, applied to the inner blob's key.** Surgical. Requires `RealtimeBlob` to take a new `selectionReplayKey?: number` prop and pass it down (combined with shader) into the inner blob's React key. e.g. `<CoralRealtimeBlob key={`coral-${selectionReplayKey ?? 0}`}>` and the same shape on `<NebularrBlob>`.

**Decision:** **Option B**. One extra prop, applied surgically. Same approach as the editor's `replayCounter`. Doesn't pollute the dispatcher with extra remounts.

`VoiceRealtimeOpenAI` change:

```tsx
const [selectionReplayCounter, setSelectionReplayCounter] = useState(0);

const handleThumbnailClick = (orb: LoadedOrb) => {
  const targetKey = orbKey(orb);
  // Four conditions must all hold to bump the counter:
  //  1. The target profile has the flag enabled.
  //  2. The user is NOT clicking the currently-active profile (composite key check).
  //  3. The switch is same-shader. Cross-shader switches already remount
  //     via component-type swap, so the counter bump would be redundant
  //     and would muddy §10's "cross-shader behavior unchanged" contract.
  //  4. The voice state is not currently 'ai_speaking'. See §5.3a below.
  if (
    orb.forceIntroOnSelect === true &&
    activeOrbKey !== targetKey &&
    activeOrb?.shader === orb.shader &&
    getVoiceState() !== 'ai_speaking'
  ) {
    setSelectionReplayCounter((c) => c + 1);
  }
  setActiveOrbKey(targetKey);
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
  selectionReplayKey?: number;  // NEW (number only, not number|string)
}

// in body:
const replayKey = selectionReplayKey ?? 0;
if (orb.shader === 'coral') {
  return <CoralRealtimeBlob key={`coral-${replayKey}`} ... />;
}
return <NebularrBlob key={`tube-${replayKey}`} ... />;
```

The inner blobs already remount on `key` change, which resets their internal animator state — exact same mechanism as cross-shader switch.

**Composite-key guard:** the click handler uses `activeOrbKey !== targetKey` (composite `${sourceVariant}:${id}` form, computed via `orbKey()`), not raw `id` comparison. Profile IDs are scoped per source file (`realtime-state-profiles.json` vs. `realtime-coral-profiles.json`), and there's no cross-file uniqueness guarantee. Comparing only `id` would risk false self-selects if a Tube and Coral profile ever shared an id. Composite-key comparison is the safe form, matching how the rest of the live page already keys orbs.

**Same-shader guard:** the `activeOrb?.shader === orb.shader` clause keeps cross-shader behavior unchanged (per §10's contract). Cross-shader switches remount the canvas naturally because `RealtimeBlob` dispatches to a different component-type; bumping the counter on top would be no-op-but-noisy state churn.

**Fallback orbs.** `CORAL_FALLBACK_ORB` and `NEBULARR_FALLBACK_ORB` (VoiceRealtimeOpenAI.tsx:58-75) currently lack a `forceIntroOnSelect` field. Since the field is optional on `LoadedOrb` and reads default to `false` via `=== true`, they don't need updating. **Reads must use `=== true`, not truthy-check** — that's the contract for the optional-field semantics. Document this in code comments at the schema definition.

### 5.3a Live page during `ai_speaking` — known limitation

`CoralRealtimeBlob.tsx:352-356` defines `goal = voiceState === 'ai_speaking' ? 0 : 1`. If the user clicks a force-intro thumbnail mid-conversation while the AI is speaking:

- Counter bumps (without the gate) → blob remounts → fresh `morphRef` initialized to 0 (sphere shape).
- But `voiceState` is still `'ai_speaking'`, so `goal` stays `0` → no morph fires.
- The orb sits as a sphere until the AI finishes speaking. Then `voiceState` flips to `'listening'`, `goal` flips to `1`, and the morph plays naturally — but it plays at the timing of the conversation state transition, not at the timing of the user's click. Confusing UX.

**Decision: gate force-intro on `voiceState !== 'ai_speaking'`.** Adding the fourth condition above (line 4 of the if-clause) means clicking a force-intro thumbnail mid-AI-response is silently no-op'd in terms of the intro replay (the profile data still updates via prop pass-through; just no remount/replay).

**Why option (a) over option (b) "temporary intro override":** force-intro's intent is a moment of attention — onboarding, brand-y entry, theatrical arrival. Mid-conversation isn't a moment of attention to the orb's identity; an intro animation interrupting an AI response would be jarring. The simpler gate matches user intent better than a temporary-state-override.

**Caveat documented for users (in tooltip or release notes):** force-intro on the live page only fires when the AI is not actively speaking. If the user wants the intro mid-conversation, they can wait for the response to finish, then re-click the thumbnail.

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

After this change: **Save-as-new omits the field entirely** — new profiles default off (the `=== true` runtime read returns `false` when the field is `undefined`). **No fork inheritance** — even when forking from a profile with `forceIntroOnSelect: true`, the new B profile starts off (the toggle is a per-profile preference, not a "settings" attribute, and inheriting it would be surprising). Same shape as `pinned` already does (Save creates with `pinned: false`, not by inheriting the source's pinned state).

The toggle path itself does write the field (both directions), so a profile's persisted JSON ends up in one of three states over its lifetime:

| Source action | Persisted state | Behavior |
| --- | --- | --- |
| Created by Save-as-new (or pre-existing legacy entry) | `{ ... }` (field absent) | `=== true` is `false` → off |
| Toggled on by user, never toggled off | `{ ..., forceIntroOnSelect: true }` | `=== true` is `true` → on |
| Toggled on then off | `{ ..., forceIntroOnSelect: false }` | `=== true` is `false` → off |

All three states behave identically at runtime per the §3 `=== true` contract. The user's toggle UI display checks `pr.forceIntroOnSelect === true` so absent/false/true read consistently.

Implementer notes:

- `togglePinned`'s pattern: `{ ...pr, pinned: !pr.pinned, lastModified: Date.now() }`.
- New `toggleForceIntroOnSelectCoral` follows the same shape, but with explicit `=== true` to handle the optional field cleanly: `{ ...pr, forceIntroOnSelect: !(pr.forceIntroOnSelect === true), lastModified: Date.now() }`. (`!(undefined === true)` = `true` on first toggle; `!(true === true)` = `false` on next; `!(false === true)` = `true` again. Three states cycle correctly.) (No matching `toggleForceIntroOnSelect` for Tube per §5.1; the toggle UI doesn't render on Tube rows so the mutator isn't needed.)

## 6. Files touched

- `src/projects/voiceinterface/realtime-states/types.ts` — add `forceIntroOnSelect?: boolean` to `SavedProfile`, `SavedCoralProfile`, and both arms of `LoadedOrb`. **Do NOT touch `DropdownRow`** — it's defined at L79 but unused outside its own type definition (verified: only self-references in comments). Adding the field there would propagate dead code; cleaning up `DropdownRow` is a separate concern.
- `src/projects/voiceinterface/realtime-states/index.tsx`:
  - In `selectCoralProfile`: add the same-shader-and-flag gate (`activeOrb?.shader === 'coral' && found.forceIntroOnSelect === true`) → `setState('idle')` + bump `replayCounter` (per §5.2).
  - New `toggleForceIntroOnSelectCoral` mutator (mirrors `togglePinnedCoral`). **No matching `toggleForceIntroOnSelect` for Tube** — Tube rows don't render the toggle (per §5.1).
  - Pass `forceIntroOnSelect` through the `orbs` useMemo (pass-through, no normalization). Note: this is for `LoadedOrb` type-shape consistency; the dropdown JSX reads from `coralProfiles.map(...)` directly, not from `orbs`.
  - Render the toggle button in the Coral dropdown row JSX only — between bookmark and pencil. The toggle reads `p.forceIntroOnSelect === true` directly from the `coralProfiles.map` callback's `p` argument. Tube rows (which iterate `tubeProfiles.map(...)` separately) remain unchanged — no third icon, no read.
- `src/projects/voiceinterface/realtime-states/controls.tsx` — no changes (this is the panels file; the toggle lives in the dropdown row, which is in `index.tsx`'s bottom-bar JSX).
- `src/projects/voiceinterface/components/RealtimeBlob.tsx` — accept new `selectionReplayKey?: number` prop (number only; see §10), thread into the inner blob's `key` (via `coral-${replayKey}` and `tube-${replayKey}`).
- `src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx`:
  - Extend `LoadedOrb` discriminated union with optional `forceIntroOnSelect?: boolean`.
  - Manage `selectionReplayCounter` React state (initial 0).
  - New `handleThumbnailClick(orb)` per §5.3 with the four-condition guard (composite key + same-shader + non-speaking + flag check).
  - Pass `selectionReplayKey={selectionReplayCounter}` to `<RealtimeBlob>`.
  - **Do NOT update `CORAL_FALLBACK_ORB` / `NEBULARR_FALLBACK_ORB`** — fallbacks omit the field; reads use `=== true` so missing reads as false. Add a comment at the fallback-object definitions noting this contract.

**Future-state coupling note (for §5.1 follow-on):** if Tube same-shader behavior is later changed to prop-only, two things flip together: (a) `selectProfile` stops calling `restartIntro` unconditionally and starts gating on `forceIntroOnSelect`, (b) the Tube dropdown row JSX starts rendering the toggle. Mention this in a code comment near `selectProfile`.

## 7. Migration steps

Single commit:

1. Add `forceIntroOnSelect?: boolean` to types in `realtime-states/types.ts` (`SavedProfile`, `SavedCoralProfile`, both arms of `LoadedOrb`).
2. Add the field to `LoadedOrb` in `VoiceRealtimeOpenAI.tsx`.
3. Add the field to `LoadedOrb`'s `orbs` useMemo construction in both editor and live page — **pass-through, no normalization**: `forceIntroOnSelect: p.forceIntroOnSelect` (LoadedOrb's field is also optional, so `undefined`/`true`/`false` flow through unchanged). All read sites use `=== true` defensively (per §3 contract).
4. Add `toggleForceIntroOnSelectCoral` mutator in `realtime-states/index.tsx` (mirrors `togglePinnedCoral`). **No matching Tube mutator** — Tube rows don't render the toggle.
5. Add the icon button to the **Coral** dropdown row JSX in `realtime-states/index.tsx` (between bookmark and pencil). The button reads `p.forceIntroOnSelect === true` from the map callback's `p` argument (a `SavedCoralProfile` from `coralProfiles`). **Tube rows are unchanged** (no third icon, separate `tubeProfiles.map` call site).
6. Update `selectCoralProfile` (per §5.2): add the self-select guard, the same-shader-and-flag gate (`activeOrb?.shader === 'coral' && found.forceIntroOnSelect === true`), `setState('idle')`, and `setReplayCounter` bump. All four parts must be present; missing the same-shader gate causes redundant remounts on cross-shader, missing the state flip causes silent failure on talking pill.
7. (Tube `selectProfile`: no change — already plays intro on every select via `restartIntro` call.)
8. Add `selectionReplayKey?: number` prop to `RealtimeBlob.tsx`, thread into both inner blob keys (`coral-${replayKey}` and `tube-${replayKey}`).
9. Add `selectionReplayCounter` state + `handleThumbnailClick(orb)` with the four-condition guard (composite key + same-shader + non-speaking + flag) in `VoiceRealtimeOpenAI.tsx`. Pass `selectionReplayKey={selectionReplayCounter}` to `<RealtimeBlob>`.
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

Numbered globally for easy citation.

1. **Toggle is hidden on Tube rows.** Open the editor's profile dropdown. **Expected:** Coral profile rows show three icon buttons (bookmark, force-intro, pencil); Tube rows show only two (bookmark, pencil). No third icon on Tube. Confirms §5.1 decision.
2. **Coral force-intro on, switch from another Coral, on idle pill.** Save a fresh second Coral profile via the Save dialog (or use any second pinned Coral). Toggle the force-intro icon on for `Coral Realtime`. Stay on the `idle` state pill. Switch to the second Coral. Then click `Coral Realtime` in the dropdown. **Expected:** sphere → torus intro replays. Toggle persists across reload.
3. **Coral force-intro on, on the talking pill.** Same setup as scenario 2, but switch to the `talking` pill before clicking the second Coral. Then click the second Coral. Then click `Coral Realtime`. **Expected:** Coral Realtime's selection flips state to `idle` AND remounts → sphere → torus intro plays. (Without the §5.2 `setState('idle')` fix, the orb would stay sphere because `goal=0` on talking.)
4. **Coral force-intro off, switch from another Coral.** Toggle off for `Coral Realtime`. Switch from the second Coral → `Coral Realtime`. **Expected:** prop-only smooth interpolation, no intro replay (today's contract).
5. **Self-select with toggle on.** Coral profile with toggle on, currently active. Click the same profile in the dropdown again. **Expected:** no replay — the self-select guard in `selectCoralProfile` (§5.2) early-returns before flipping state or bumping the counter. Equivalent expected behavior on the live page via the composite-key guard (§5.3).
6. **Cross-shader switch with target Coral force-intro on — counter NOT bumped (§5.2 + §5.3 same-shader guards).**
   - **Editor:** make a Coral profile have `forceIntroOnSelect: true`. Make active a Tube profile (e.g. `Kyoto Realtime`), state pill on `idle`. Click the Coral profile in the dropdown — `selectCoralProfile` IS called (the dropdown route always runs `selectCoralProfile` for Coral rows, regardless of active shader). **Expected:** the same-shader gate (`activeOrb?.shader === 'coral'`) rejects, so neither `setState('idle')` nor `setReplayCounter` fires. Cross-shader natural component-type swap mounts a fresh `<CoralStoneMorph>`; with state at `idle`, goal=1 and morphRef-from-zero plays sphere → torus naturally. Verify by tagging `replayCounter` value (via temporary `console.log` or React DevTools) — should NOT have incremented.
   - **Live page:** same setup. Click the cross-shader thumbnail with the flag on. **Expected:** `selectionReplayCounter` does NOT increment (verifiable via temporary log). Cross-shader remount happens naturally via the `<RealtimeBlob>` shader-dispatch.
   - **Talking-pill caveat (per §5.2a):** repeating the editor case while on the `talking` pill exposes a pre-existing limitation — the cross-shader Coral mount is goal=0 (sphere), no morph fires until state flips. Force-intro doesn't fix this; it's a separate concern. Document but don't treat as a regression.
7. **Save fork doesn't inherit the field.** Toggle on for one profile (e.g. `Coral Realtime`). Save-as-new under a different name. **Expected:** source's flag unchanged; new fork has `forceIntroOnSelect` absent (= false), toggle icon shows off state.
8. **Toggle does not mark editor dirty.** With the active profile, toggle the force-intro icon on. **Expected:** bottom-bar Discard/Update buttons do NOT appear. Confirms the toggle is metadata, not a settings change.
9. **Live page: pinned + force-intro round-trip across both shaders.** Pin two Coral profiles + two Tube profiles. Toggle force-intro on for one Coral. From the live page thumbnail strip, switch to each. **Expected:** the toggled-on Coral's selection (when coming from another Coral) forces a remount + intro. The toggled-off profiles' selections are prop-only smooth. Tube selections behave today's way (NebularrBlob remounts on cross-shader, prop-only on same-shader).
10. **Live page during AI speaking — known limitation (gate).** Start a conversation. While the AI is actively speaking (`voiceState === 'ai_speaking'`), click a force-intro Coral thumbnail. **Expected:** profile switches (data flows through props), but no remount / no sphere → torus animation interrupting the AI response. When the AI finishes and `voiceState` transitions to `listening`, the orb morphs naturally to torus along the new profile's values. Confirms §5.3a's intentional gate.
11. **JSON: toggle on persists the field (Coral file only).** Toggle on for a Coral profile in the editor. Inspect `realtime-coral-profiles.json` directly. **Expected:** the entry has `forceIntroOnSelect: true` written. Note: `realtime-state-profiles.json` (Tube) is NOT a writable target in this pass — Tube has no toggle UI per §5.1; the schema field on `SavedProfile` is forward-compat-only.
12. **JSON: toggle off persists `false` (not absence).** Toggle the same Coral profile off. **Expected:** the entry now has `forceIntroOnSelect: false` (the toggle path writes both directions explicitly per §5.4 table). Both `false` and absent read identically via `=== true` — verify the dropdown UI reflects the persisted state correctly across reload.
13. **JSON: existing Coral entries (no field) read as off.** Verify any pre-existing Coral profile entries in `realtime-coral-profiles.json` (created before this change) don't have the field, and their dropdown toggle UI shows the off state. Confirms the optional-field default contract.

### 9.3 Pre-mortem — three ways this could fail on first implementation attempt

1. **The self-select guard is skipped during implementation.** §5.2 specifies an explicit `if (activeOrb?.shader === 'coral' && activeOrb.id === id) { setShowProfileDropdown(false); return; }` early-return in `selectCoralProfile`. Today's `setActiveOrbKey(same-key)` is a React useState no-op, but bumping `replayCounter` ALWAYS re-renders and remounts the Canvas. Without the guard, clicking the active thumbnail (when the active profile has `forceIntroOnSelect: true`) would needlessly remount on every click. *Mitigation:* §5.2 has the explicit guard; verification scenario 5 catches this if missed.

2. **The `setState('idle')` flip is omitted and only the bump is added.** §5.2's bump path requires BOTH `setState('idle')` AND `setReplayCounter((c) => c + 1)`. If the implementer adds only the bump, force-intro will silently fail when the user is on the talking pill — fresh `<CoralStoneMorph>` mounts with `goal={state === 'talking' ? 0 : 1}` evaluating to `0` (sphere stays sphere), no morph fires. *Mitigation:* §5.2 explicit pseudocode + verification scenario 3 (talking-pill case) catches this immediately.

3. **The fork path drops the flag.** If `handleSave`'s same-shader fork branch builds the new entry from the active settings without explicitly omitting `forceIntroOnSelect`, a forked profile could either inherit the parent's flag (surprising) or lose it silently. *Mitigation:* §5.4 specifies "Save-as-new omits the field entirely" — the new entry shape literally doesn't include the field, and the runtime `=== true` read handles the absent case as off. Verification scenario 7 confirms.

## 10. Open questions

1. ~~Field omitted vs persisted as `false` when off?~~ Resolved in v2 §5.4 (table).
2. ~~Should `selectProfile` (Tube) gate `restartIntro` on the field?~~ Resolved in v2 §5.1; refined in v3 — Tube toggle hidden entirely.
3. ~~`selectionReplayKey` typed `number | string`?~~ Resolved in v2: `number`.
4. ~~Lucide `RotateCcw` or `Repeat`?~~ Resolved in v4 by reviewer round-2: **`RotateCcw`** — matches Replay button, communicates "run this intro again." `Repeat` is associated with auto-loop in this editor; reusing it for force-intro would blur two different concepts.
5. ~~Live-page voiceState gate option (a) vs (b)?~~ Resolved in v4 by reviewer round-2: **(a) — non-speaking gate.** Simpler, less invasive, avoids interrupting an active response with a theatrical visual replay. Kept as explicit limitation in §5.3a, verified manually in §9.2 scenario 10.

All open questions resolved. Plan is implementation-ready pending reviewer round-3 sanity check on the v4 patches.

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

### Round 3 — external reviewer round-1 (9 findings) + 2 self-found

All 9 reviewer findings accepted; 2 were Critical (P1) and required real semantic changes, 5 were Major (P2), 3 were P3 (cosmetic / hygiene). All claims verified against source before patching.

**Critical [P1] — Coral editor force-intro must also flip state to idle.** Reviewer cited index.tsx:961-982 (Coral canvas branch with `goal={isTalking ? 0 : 1}`) and the Replay button at 1408-1417 (which mirrors `setState('idle'); setReplayCounter(...)`). Confirmed: my v2 plan only had the bump, which would silently fail when user is on talking pill. **Patched in §5.2** — added `setState('idle')` before the bump, with a code comment explaining the goal=0 trap.

**Critical [P1] — Live page during `ai_speaking` won't replay.** Reviewer cited CoralRealtimeBlob.tsx where `voiceState === 'ai_speaking'` forces `goal=0`. Confirmed: same trap on the live page, but voiceState there is driven by the OpenAI session, not user clicks, so we can't unilaterally flip it. Reviewer offered two options: (a) gate on non-speaking, (b) temporary intro override. **Patched in §5.3 + new §5.3a** — chose option (a) with explicit limitation documentation; rationale noted in the new §5.3a section.

**Major [P2] — Tube toggle is misleading.** Reviewer noted that since Tube's `selectProfile` already replays unconditionally, an "active-looking" toggle that does nothing on either state is confusing UX. **Patched in §5.1** — hide the toggle entirely on Tube dropdown rows. Schema field still propagates to Tube types for forward compatibility (if Tube same-shader behavior is ever changed); document the future-state coupling in §6.

**Major [P2] — Live-page guard should use composite key.** Reviewer flagged `activeOrb?.id !== orb.id` as risky given IDs are scoped per source file (no cross-file uniqueness). **Patched in §5.3** — guard now uses `activeOrbKey !== orbKey(orb)`, comparing the full `${sourceVariant}:${id}` form.

**Major [P2] — Pseudocode bumps on cross-shader contradicts §10's "unchanged" contract.** Confirmed: my v2 pseudocode had no shader-equality check. **Patched in §5.3** — added `activeOrb?.shader === orb.shader` to the click-handler condition. Cross-shader switches now go through the natural component-type-swap remount only, no counter bump.

**Major [P2] — Fallback orbs need explicit handling.** Confirmed: `CORAL_FALLBACK_ORB`, `NEBULARR_FALLBACK_ORB` (VoiceRealtimeOpenAI.tsx:58-75) lack the field. Plan keeps the field optional, so they don't need updating, but the `=== true` read contract had to be made explicit. **Patched in §5.3 + §6** — fallbacks unchanged, reads use `=== true`, contract documented at the schema and fallback-object sites.

**P3 — DropdownRow churn.** Confirmed: `DropdownRow` is defined at types.ts:79 but referenced only in self-comments — effectively dead code. **Patched in §6** — explicitly do NOT touch `DropdownRow`. Cleanup of the dead type is a separate concern.

**P3 — "Pinned" copy bug.** Confirmed: my v2 had `Pinned: intro replays...` which conflates with bookmark terminology. **Patched in §4** — rewrote to "Force-intro on — intro replays every time this profile is selected (click to disable)".

**P3 — Verification numbering duplicated.** Confirmed: §9.2 restarted at 6/7/8 across three sub-sections. **Patched** — renumbered globally 1-13, also added two new scenarios (Tube toggle hidden in scenario 1, Coral talking-pill force-intro in scenario 3, cross-shader-no-bump in scenario 6, ai_speaking gate in scenario 10) reflecting v3 changes.

**Self-found, mine-1 [B] — Editor self-select guard interaction with state-flip.** Documented in §5.2 code comment that the guard short-circuits BOTH the state flip and the counter bump on self-select. That's intentional — self-select should be a no-op; user has the Replay button for manual replay.

**Self-found, mine-2 [B] — Cascade-on-load + force-intro = no double intro.** Cascade calls `setActiveOrbKey()` directly, bypassing `handleThumbnailClick`/`selectCoralProfile`, so the counter doesn't bump on first paint. The first-paint design already plays the intro via lazy-init seeding. Two paths to "intro on first mount" don't stack — already documented in §2 out-of-scope.

### Round 4 — external reviewer round-2 (5 findings + 2 reviewer calls + 1 self-found)

All 5 findings accepted with code-level verification before patching. Both reviewer calls (icon choice, voiceState gate option) locked in. One additional self-found surfaced.

**[P1] Editor cross-shader Coral selection still bumps replayCounter.** Confirmed: my v3 §5.2 lacked the same-shader guard the live page already had. Cross-shader Tube → Coral with the flag would bump unnecessarily, contradicting §10's "cross-shader unchanged" contract. **Patched** by adding `activeOrb?.shader === 'coral'` to the bump gate. The same-shader-and-flag combined check now protects both the contract and the redundant-remount concern.

**[P2] Scenario 6 wrong about editor path.** Confirmed: I claimed the editor scenario was N/A because Tube `selectProfile` doesn't reach `selectCoralProfile` — but the dropdown calls `selectCoralProfile` for any Coral row regardless of active shader. **Rewrote scenario 6** to cover both editor and live page cross-shader cases explicitly, including the talking-pill caveat from new §5.2a.

**[P2] Editor dropdown doesn't read from `orbs`.** Confirmed at index.tsx:1132 (Tube `tubeProfiles.map`) and L1234 (Coral `coralProfiles.map`). Dropdown JSX never iterates `orbs`. **Rewrote §3 + §6 + §7 step 3 + step 5** to clarify the read-source split: editor reads via source arrays directly; live page reads via `LoadedOrb` in `handleThumbnailClick`. `LoadedOrb` carries the field for type-shape consistency + live-page use.

**[P2] LoadedOrb optional-vs-normalized ambiguity.** Confirmed: §3 said optional but §7 step 3 said `=== true` which sounded like normalization. **Patched §3 + §7 step 3**: field is optional everywhere, projection is pass-through (`forceIntroOnSelect: p.forceIntroOnSelect`, no `=== true` rewrite at projection time), all reads use `=== true` defensively. Three runtime states (`undefined` / `true` / `false`) all behave correctly. Fallback orbs unchanged.

**[P3] §4 mentions `persistProfiles`.** Confirmed: Tube has no toggle (per v3 §5.1) so only `persistCoralProfiles` is in scope. **Patched §4** to call out the Tube-schema-only-forward-compat contract.

**Reviewer call §10 q4: lucide icon = `RotateCcw`.** Locked in. Matches Replay button; `Repeat` is auto-loop iconography, would blur concepts.

**Reviewer call §10 q5: voiceState gate option (a).** Locked in. Documented as explicit known limitation (§5.3a + §9.2 scenario 10); manually verified in scenario 10.

**Self-found, mine-3 [B] — Cross-shader Coral on talking pill is a pre-existing bug.** Surfaced during my [P1] thinking. Even with the [P1] fix, cross-shader Tube → Coral with force-intro on, while on talking pill, won't replay the intro — because `selectCoralProfile` doesn't flip state on cross-shader (today's behavior, not introduced by this plan), so the freshly-mounted `<CoralStoneMorph>` sees state='talking', goal=0, sphere stays sphere. Asymmetric with Tube cross-shader (which replays via `selectProfile`'s unconditional `restartIntro`). **Documented as new §5.2a** + scope-clean follow-up options (always-flip-state-on-cross-shader-Coral, or add a Coral `restartIntro` equivalent). Force-intro's contract here is narrowed to "non-talking-pill same-shader same-shader switches"; talking-pill cross-shader is its own concern.

### Round 5 — external reviewer round-3 (3 P3 cleanup; no blockers)

Reviewer signed off as implementation-ready. Three small wording fixes applied:

- **P3-1: Pre-mortem item 3 was stale.** It described a v2-era concern about the live-page cross-shader path that v4's same-shader guard structurally prevents. **Replaced** with a fresh pre-mortem item: "the `setState('idle')` flip is omitted and only the bump is added" — a real implementation risk that would cause silent talking-pill failure. Also tightened item 1 to reference the §5.2 mitigation explicitly.
- **P3-2: JSON scenario 11 mentioned `realtime-state-profiles.json`.** Since v4 hides the toggle on Tube rows and only implements `toggleForceIntroOnSelectCoral`, the only writable JSON target is `realtime-coral-profiles.json`. **Patched** scenarios 11–13 to target the Coral file specifically, with a note that `realtime-state-profiles.json` is schema-only forward-compat in this pass.
- **P3-3: Concept index `selectionReplayCounter` wording.** v3+ uses the editor's existing `replayCounter` for force-intro; `selectionReplayCounter` is only a new live-page state. **Patched** the concept-index entry to clarify "live page only" + cross-reference §5.3.

No code-level changes implied. Plan is now implementation-ready.
