# Editor first-paint flash — fix plan

## Problem

Reloading `/voiceinterface/realtime-states` while a non-Kyoto profile is persisted (e.g. Coral Realtime, Nebularr) shows the **default Kyoto Realtime** state for ~80–150ms, then snaps to the persisted profile. Three things visibly change at the snap moment:

1. Page background flips (`KYOTO_SEED.bgColor` → persisted profile's `bgColor`).
2. Bottom-bar tab buttons + slider set swap (Tube tabs → Coral tabs, or stay Tube but with different settings).
3. Canvas swaps shader (`<GentleOrbThicken>` → `<CoralStoneMorph>` if persisted is Coral).

The live page no longer has this issue (deferred mount fix in commit `d02f7c3`). The editor still does.

## Why the current approach is wrong

The editor renders **meaningful default content** (Kyoto seed) on first paint, then swaps to the right content once the cascade resolves localStorage. This conflates two distinct states — "loading" and "Kyoto is the active profile" — into the same visual representation. The user briefly sees content that's *typed correctly* but *factually wrong about their selection*.

First-principles framing: async-loaded state has three states (`loading | error | success`). Each should get its own visible representation. Using "defaults" as a stand-in for "loading" is a category error.

## Existing pattern in this codebase

`src/pages/clipperstream/index.tsx:82–119` already implements the canonical fix for this class of problem:

```tsx
const ClipperStream: React.FC = () => {
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    // ... seed sample clips
    setMounted(true);
  }, []);

  return (
    <div className="page">
      {mounted ? (
        <ClipMasterScreen />
      ) : (
        <div style={{ width: 393, height: 852, background: '#1C1C1C', borderRadius: 8 }} />
      )}
    </div>
  );
};
```

A `mounted` boolean flipped in `useEffect`, a placeholder rectangle with the same dimensions as the final UI until then. Honest about loading; no flash of wrong content.

## Proposed fix

Apply the same pattern to `src/pages/voiceinterface/realtime-states.tsx`. Specifically:

1. Add a `cascadeReady: boolean` state, defaulting to `false`. Flip to `true` at the end of the existing cascade `useEffect` (next to the `cascadeAppliedRef.current = true` line).

2. Until `cascadeReady === true`, return a skeleton component instead of the full editor JSX. Skeleton requirements:
   - Same overall layout dimensions as the editor page (full viewport height, centered orb area).
   - Empty/neutral canvas slot (328×328, neutral background).
   - Bottom-bar shape preserved (height + horizontal layout) but tab buttons + sliders hidden.
   - Dropdown trigger area visible but inert (or hidden).
   - Background color: a neutral grey (`#fafafa` or similar) — not committing to either Kyoto's or Coral's bg until cascade applies.

3. The cascade's existing logic — including the dual-write of mirrors and the localStorage cascade resolution — stays unchanged. Only the gating around the JSX changes.

## Files affected

| File | Change |
|---|---|
| `src/pages/voiceinterface/realtime-states.tsx` | Add `cascadeReady` state, flip in cascade effect, conditional render at top of return. New skeleton component (inline or extracted). |

No new files required if the skeleton is a simple inline JSX block. Out of scope: live page already uses a different (lighter) gate and the patterns can converge later as part of the file-split refactor.

## Open question for reviewer

- **Skeleton fidelity**: minimal (blank rectangle for the canvas, hide bottom bar entirely) vs. detailed (rendered tab buttons in a disabled state, dropdown trigger visible)? Minimal is honest and simple; detailed makes the snap-to-real less jarring. Lean minimal.

## Verification

- Persist Coral Realtime as the active selection → reload → should see neutral skeleton briefly, then Coral appears (no Kyoto in between).
- Persist Nebularr → reload → neutral skeleton → Nebularr appears (no flash of `Kyoto Realtime` label or `KYOTO_SEED` colors).
- First-ever visit (no localStorage key) → neutral skeleton → cascade resolves to "Kyoto Realtime" fallback → editor renders.
- `npx tsc --noEmit` clean.
- No regressions in existing Coral / Tube editing flows (slider edits, Save, Discard, profile switching, Replay, bookmark, rename).

## Out of scope (deferred follow-ups)

- Converging live page on the same `cascadeReady` gate (currently uses a lighter `realtimeOrb && <RealtimeBlob />` conditional). Both work; structural convergence can happen during the file-split refactor.
- WebGL init blank rectangle on `<Canvas>` mount. Inherent to R3F; would need a saved-thumbnail placeholder to mask. Independent of this fix.
- Skeleton styling polish (subtle pulse animation, exact color match, etc.).
