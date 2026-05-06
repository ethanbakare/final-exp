# Editor first-paint flash — fix plan (v2)

> v2 incorporates reviewer findings (6 total: 2 P1 architectural, 3 P2 specificity, 1 P3 caveat). Key changes: child-component extraction (Finding 1, 6), exact `cascadeReady` flip timing (Finding 2), explicit "no defaults paint visible" rule (Finding 3), concrete skeleton contract (Finding 4), first-paint verification method (Finding 5).

## Problem

Reloading `/voiceinterface/realtime-states` while a non-Kyoto profile is persisted (e.g. Coral Realtime, Nebularr) shows the **default Kyoto Realtime** state for ~80–150ms, then snaps to the persisted profile. Three things visibly change at the snap moment:

1. Page background flips (`KYOTO_SEED.bgColor` → persisted profile's `bgColor`).
2. Bottom-bar tab buttons + slider set swap (Tube tabs → Coral tabs, or stay Tube with different settings).
3. Canvas swaps shader (`<GentleOrbThicken>` → `<CoralStoneMorph>` if persisted is Coral).

The live page no longer has this issue (deferred mount fix in commit `d02f7c3`). The editor still does.

## Why the current approach is wrong

The editor renders **meaningful default content** (Kyoto seed) on first paint, then swaps to the right content once the cascade resolves localStorage. This conflates two distinct states — "loading" and "Kyoto is the active profile" — into the same visual representation. The user briefly sees content that's *typed correctly* but *factually wrong about their selection*.

First-principles framing: async-loaded state has three states (`loading | error | success`). Each should get its own visible representation. Using "defaults" as a stand-in for "loading" is a category error.

## Existing pattern in this codebase

`src/pages/clipperstream/index.tsx:82–119` implements the canonical fix for this class:

```tsx
const ClipperStream: React.FC = () => {
  const [mounted, setMounted] = React.useState(false);
  useEffect(() => { /* seed */ setMounted(true); }, []);
  return (
    <div className="page">
      {mounted ? <ClipMasterScreen /> : <div style={{ width: 393, height: 852, background: '#1C1C1C' }} />}
    </div>
  );
};
```

**Caveat (Finding 6):** ClipperStream is a thin wrapper. `RealtimeStates` is ~3000 lines with many hooks before the JSX return — including `useCoralThinkingPulse`, `useEasedNumber`/`useEasedColor` for scale/wave/color3, and the cascade/persistence effects. A naive copy of the `mounted` flag at the top of `RealtimeStates` would either (a) leave the easing hooks initialized with `CORAL_FALLBACK_PROFILE` values from the pre-cascade window — first non-skeleton paint receives stale eased props at `<CoralStoneMorph>` (Finding 1), or (b) try to early-return before the hooks, breaking React hook order when `cascadeReady` flips.

The plan therefore requires **child-component extraction**: hook-using JSX moves into a child that only mounts when the parent has a resolved active orb.

## Proposed fix — three concrete pieces

### 1. Extract editor body into a child component

Split `RealtimeStates` into:

- **Parent** (`RealtimeStates`, the existing route component):
  - Owns: source-array fetches (`fetchProfiles`, `fetchCoralProfiles`), `kyotoLoaded`/`coralLoaded`/`coralProfiles`/`kyotoProfiles`, the cascade effect, `activeOrbKey` state, `cascadeReady` state.
  - Renders: skeleton until `cascadeReady === true && activeOrb` resolves; otherwise renders `<RealtimeStatesEditor activeOrb={...} ... />` once.
  - **Does not** mount any of the visual hooks (easing, pulse, animator). Those move to the child.

- **Child** (`RealtimeStatesEditor`, new component, can be inline-defined in the same file or extracted to a sibling file):
  - Receives: resolved `activeOrb`, source arrays, setters, etc. as props.
  - Owns: all the editor UI hooks (`useCoralThinkingPulse`, `useEasedNumber`, `useEasedColor`, JS animator effect, slider state).
  - Renders: the full editor JSX.

This guarantees that when `cascadeReady` flips true, the child mounts FRESH with a real `activeOrb`. Easing hooks' `useState` initializes from the actual profile's `talking` values via `startValue` (already supported). No stale-fallback first frame.

### 2. Exact `cascadeReady` flip timing

In the cascade `useEffect` (currently `realtime-states.tsx:1212–1248`), `cascadeReady` flips to `true` **at the very end of the success path**, after:

- `cascadeAppliedRef.current = true` (line 1217)
- `fallback` is resolved to a non-null value (line 1224 — `if (!fallback) return;`)
- `setActiveOrbKey(targetKey)` has been called
- `setActiveBaseline({...})` has been called
- The Kyoto branch's `restartIntro(fallback.settings)` has been scheduled (Coral branch has no equivalent)

Concretely:

```ts
// at the end of the cascade useEffect's success branch, AFTER all setStates
setCascadeReady(true);
```

If `fallback` is null (degenerate state — both fetches returned empty AND seed creation didn't happen), `cascadeReady` stays `false`. The skeleton persists. This is acceptable — the editor genuinely has nothing meaningful to show. **A future polish item could add an explicit error state**, but it's out of scope for this fix.

### 3. Skeleton contract (Finding 4 — fully specified)

The skeleton renders fixed elements that don't depend on profile data, hides everything that does. Layout dimensions match the real editor exactly so the swap doesn't reflow.

| Element | Skeleton state |
|---|---|
| **Top-right `<GalleryAudioControls>`** | **Shown** — doesn't depend on profile data. |
| **Page background** | Neutral `#fafafa`. Not Kyoto's `#fffafa`, not Coral's `#f7f6f4`. |
| **Canvas slot (328×328)** | Empty `<div style={{ width: 328, height: 328 }} />` with neutral background (matches page bg). No `<Canvas>` mounted yet. |
| **Bottom bar height** | Same as real bottom bar (preserved via fixed-height container). |
| **State pills (idle/listening/thinking/talking)** | **Hidden.** Don't render at all. (Showing them inert was considered but adds complexity for no gain — the skeleton is brief.) |
| **Profile dropdown trigger** | **Hidden.** No "Loading…" placeholder text. |
| **Tab buttons (Size / Thickness / Motion / Colours)** | **Hidden.** |
| **Bottom-bar swatch row** | **Hidden.** |
| **Replay / Auto-loop / Bookmark / Update / Discard / Save** | **Hidden.** |
| **Save dialog** | **Hidden** (state-controlled overlay; never opens before cascade). |

Net effect: a near-empty page with the audio controls in the top-right and a blank rectangle where the canvas will be. Honest about loading. When `cascadeReady` flips, the entire chrome appears at once with the correct profile already applied.

## Files affected

| File | Change |
|---|---|
| `src/pages/voiceinterface/realtime-states.tsx` | Split into parent (small) + `RealtimeStatesEditor` child (large). Add `cascadeReady` state in parent, flip at end of cascade effect. Parent renders skeleton OR child. Child receives resolved `activeOrb` + setters + source arrays as props. |

The child can be defined inline in the same file (anonymous component, ~2900 lines) or extracted to a sibling file. Inline is simpler for this commit; sibling extraction is the file-split follow-up. **Recommendation: inline for this commit** to keep the change focused.

## Verification (Finding 5 — first-paint method specified)

Standard checks:

- Persist Coral Realtime → reload → neutral skeleton briefly → Coral appears (no Kyoto in between, no eased-prop snap mid-paint).
- Persist Nebularr → reload → skeleton → Nebularr appears.
- First-ever visit (clear localStorage) → skeleton → "Kyoto Realtime" fallback resolves.
- `npx tsc --noEmit` clean.
- No regressions: slider edits, Save, Discard, profile switching, Replay, bookmark, rename.

First-paint verification (concrete):

1. **Throttled-load reproduction**: DevTools → Performance tab → CPU 4× slowdown + Network "Slow 3G" → reload page. Observe: skeleton visible for noticeable window, then snap to real content. **Pass criterion:** during the skeleton phase, no Kyoto-specific content appears (no Tube canvas, no Tube tabs, no Kyoto bg color).

2. **Console assertion (temporary, removed after verification)**: in the parent's cascade effect, immediately before `setCascadeReady(true)`, log `console.log('cascade resolved:', activeOrbKey, 'persisted was:', localStorage.getItem('realtime-states-active-orb-key'))`. After cascade, the resolved `activeOrbKey` should match the persisted value. Run with persisted Coral and persisted Nebularr.

3. **First-paint key check**: in the child's first render (a `useEffect` with empty deps), `console.log('child first render: shader=', activeOrb.shader, 'id=', activeOrb.id)`. Confirm the child's first render matches the persisted profile, not Kyoto.

Coverage requirement: must run the throttled reproduction with **both** persisted Coral and persisted Nebularr — Coral exercises shader swap + easing-hook initialization (the F1 hot path); Nebularr exercises Tube render seeding (the JS animator's `restartIntro` path).

## What this does NOT change

- **Cascade resolution logic**: the `useEffect` body that resolves localStorage → fallback → applies via `setActiveOrbKey` etc. is structurally unchanged. What changes: the editor's visible chrome is gated on `cascadeReady`, so cascade's resolution happens BEFORE any meaningful pixels are committed (Finding 3).
- **First-load fetch handler**: still flips `kyotoLoaded`/`coralLoaded`. Still creates the seed entry on empty fetch.
- **Child's hooks**: `useCoralThinkingPulse`, `useEasedNumber`/`useEasedColor`, JS animator effect — all behave identically once mounted. Their `startValue`/`resetKey` logic already handles a fresh mount with real data.

## Out of scope (deferred follow-ups)

- **Converging live page on the same `cascadeReady` gate**. Live page uses `realtimeOrb && <RealtimeBlob />` (lighter, partial). Both work; structural convergence happens during the file-split refactor.
- **WebGL init blank rectangle on `<Canvas>` mount**. Inherent to R3F; would need a saved-thumbnail placeholder to mask. Independent of this fix.
- **Explicit error state** when fallback is null (both fetches failed AND seed creation didn't happen). Skeleton persists in that case; a future polish could surface an explicit "couldn't load profiles" banner.
- **Skeleton styling polish** (subtle pulse animation, color match to active profile's hint color, etc.).
