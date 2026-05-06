# Editor first-paint flash — fix plan (v2.1)

> v2.1 incorporates round-2 reviewer feedback. Three accepts (F1, F2, F3 — real corrections folded in) and one light pushback (F4 — see footnote at bottom). Ready for implementation; reviewer pushback noted for re-read.

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

`src/pages/clipperstream/index.tsx:82–119` implements the canonical fix:

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

A `mounted` boolean flipped in `useEffect`, a placeholder rectangle until then.

**Caveat:** ClipperStream is a thin wrapper. `RealtimeStates` is ~3000 lines with many hooks before the JSX return — including `useCoralThinkingPulse`, `useEasedNumber`/`useEasedColor`, the JS animator effect. A naive copy of the `mounted` flag at the top of `RealtimeStates` would either (a) leave the easing hooks initialized with `CORAL_FALLBACK_PROFILE` values from the pre-cascade window — first non-skeleton paint receives stale eased props at `<CoralStoneMorph>`, or (b) try to early-return before the hooks, breaking React hook order when `cascadeReady` flips.

The plan therefore requires **child-component extraction**: hook-using JSX moves into a child that only mounts when the parent has a resolved active orb.

## Proposed fix — three concrete pieces

### 1. Parent / child ownership boundary (round-2 F2 — explicit table)

Split `RealtimeStates` into a parent component that handles data + actions, and a `RealtimeStatesEditor` child that handles presentation + visual state. Standard "smart parent / dumb-ish child" split.

| Owned by **parent** (`RealtimeStates`) | Owned by **child** (`RealtimeStatesEditor`) |
|---|---|
| `kyotoProfiles`, `coralProfiles` (source arrays) | `render: RenderValues` (animator output) |
| `kyotoLoaded`, `coralLoaded` (load flags) | `replayCounter` |
| `activeOrbKey` | `state: PreviewState` (idle/listening/thinking/talking pill) |
| `activeBaseline` (for dirty detection) | `autoLoop`, `expanded`, `activeTab`, `thinkingPaused` |
| `cascadeReady` (new) | All eased hooks (`useEasedNumber`, `useEasedColor`) |
| `externalProfileNames` | `useCoralThinkingPulse` |
| `colorFormat` (or move to child if cleaner) | The JS animator `useEffect` |
| **Cascade effect** | All visual JSX |
| **First-load fetch effect** (sets `kyotoLoaded`/`coralLoaded`) | `restartIntro` (uses animator state) |
| **Action handlers**: `selectProfile`, `selectCoralProfile`, `handleSave`, `handleUpdate`, `togglePinned`, `togglePinnedCoral`, `commitRename`, `commitRenameCoral`, etc. | Slider helpers (`setBase`, `setPeak`, `clearPeak`, `coralSetBase`, etc.) — **operate on parent-owned source arrays via passed-in setters** |

**Props flow:** parent passes resolved `activeOrb`, `activeBaseline`, source arrays, and all action handlers as props. Child reads them, displays, calls handlers on user interaction.

**Why baseline lives in the parent:** the cascade `useEffect` is the natural place to capture baseline (`setActiveBaseline({key, shader, settings: structuredClone(...)})`) — that's how "the orb on disk = the orb in memory" is established. If baseline lived in the child, cascade couldn't pre-set it before the child mounts. Child receives `activeBaseline` as prop + `setActiveBaseline` as a callback for re-snapshotting after Save.

### 2. Exact `cascadeReady` flip timing (round-1 F2 / round-2 F1)

In the cascade `useEffect` (currently `realtime-states.tsx:1212–1248`), `cascadeReady` flips to `true` at the very end of the success path, after:

- `cascadeAppliedRef.current = true` (line 1217)
- `fallback` is resolved to a non-null value (line 1224 — `if (!fallback) return;`)
- `setActiveOrbKey(targetKey)` has been called
- `setActiveBaseline({...})` has been called

```ts
// at the end of the cascade effect's success branch, AFTER all setStates
setCascadeReady(true);
```

**No `restartIntro` call from the parent** (round-2 F1 correction). `restartIntro` belongs to the child's animator state — the parent can't call it before the child exists. Instead, **the child seeds its visual state on first mount from the `activeOrb` prop directly:**

```tsx
// inside RealtimeStatesEditor, where the current code initializes render at line 1031
const [render, setRender] = useState<RenderValues>(() =>
  activeOrb.shader === 'kyoto'
    ? talkingRenderForProfile(activeOrb.settings)
    : talkingRenderForProfile(KYOTO_SEED), // Coral path: render isn't used by Coral canvas, fallback is fine
);
```

For persisted Tube profiles like Nebularr, the child's `render` useState now initializes from the resolved active profile instead of `KYOTO_SEED`. No `restartIntro` needed at mount because the initial render values already match the active profile.

The child's `restartIntro` function (still defined inside the child) remains available for the Replay button and any post-mount triggers.

If `fallback` is null (degenerate state — both fetches returned empty AND seed creation didn't happen), `cascadeReady` stays `false`. The skeleton persists. Acceptable; explicit error state is a deferred polish item.

### 3. Skeleton contract

The skeleton renders fixed elements that don't depend on profile data, hides everything that does. Layout dimensions match the real editor where it matters.

| Element | Skeleton state |
|---|---|
| **Top-right `<GalleryAudioControls>`** | **Shown** — doesn't depend on profile data. |
| **Page background** | Neutral `#fafafa`. Not Kyoto's `#fffafa`, not Coral's `#f7f6f4`. |
| **Canvas slot (328×328)** | Empty `<div style={{ width: 328, height: 328 }} />` with neutral background. No `<Canvas>` mounted. |
| **State pills (idle/listening/thinking/talking)** | **Hidden.** |
| **Profile dropdown trigger** | **Hidden.** |
| **Tab buttons (Size / Thickness / Motion / Colours)** | **Hidden.** |
| **Bottom-bar swatch row** | **Hidden.** |
| **Replay / Auto-loop / Bookmark / Update / Discard / Save** | **Hidden.** |
| **Bottom bar container** | **Omitted entirely.** The real bar is `position: fixed` so its absence/presence cannot reflow other content — see footnote on F4. |
| **Save dialog** | **Hidden** (state-controlled overlay; never opens before cascade). |

Net effect: a near-empty page with the audio controls in the top-right and a blank rectangle where the canvas will be. When `cascadeReady` flips, the entire chrome appears at once with the correct profile already applied.

## Files affected

| File | Change |
|---|---|
| `src/pages/voiceinterface/realtime-states.tsx` | Split into parent (small) + `RealtimeStatesEditor` child (large). Add `cascadeReady` state in parent, flip at end of cascade effect's success branch. Parent renders skeleton OR child. Child receives resolved `activeOrb` + `activeBaseline` + source arrays + action handlers as props. Child seeds `render` state via lazy initializer from `activeOrb.settings`. |

The child can be defined inline in the same file or extracted to a sibling file. **Recommendation: inline for this commit** to keep the change focused; sibling extraction happens during the file-split follow-up.

## Verification

Standard checks:

- Persist Coral Realtime → reload → neutral skeleton briefly → Coral appears (no Kyoto in between, no eased-prop snap mid-paint).
- Persist Nebularr → reload → skeleton → Nebularr appears with Tube `render` correctly seeded from Nebularr's settings (not KYOTO_SEED).
- First-ever visit (clear localStorage) → skeleton → "Kyoto Realtime" fallback resolves.
- `npx tsc --noEmit` clean.
- No regressions: slider edits, Save, Discard, profile switching, Replay, bookmark, rename.

First-paint verification (concrete):

1. **Throttled-load reproduction**: DevTools → Performance tab → CPU 4× slowdown + Network "Slow 3G" → reload page. Observe: skeleton visible for noticeable window, then snap to real content. **Pass criterion:** during the skeleton phase, no Kyoto-specific content appears (no Tube canvas, no Tube tabs, no Kyoto bg color).

2. **Console assertion (temporary, removed after verification)**: in the parent's cascade effect, immediately before `setCascadeReady(true)`, log:
   ```ts
   console.log('cascade resolved: target=', targetKey, 'persisted=', persisted);
   ```
   `targetKey` and `persisted` are both in scope inside the cascade effect at that moment (round-2 F3 fix — `activeOrbKey` would be stale because `setActiveOrbKey(targetKey)` was just scheduled).

3. **First-paint child mount check**: in the child's first render (a `useEffect` with empty deps), log `console.log('child first render: shader=', activeOrb.shader, 'id=', activeOrb.id)`. Confirm the child's first render matches the persisted profile, not Kyoto.

Coverage requirement: must run the throttled reproduction with **both** persisted Coral (shader swap + easing-hook initialization path) and persisted Nebularr (Tube render seeding path).

## What this does NOT change

- **Cascade resolution logic**: the `useEffect` body that resolves localStorage → fallback → applies via `setActiveOrbKey` etc. is structurally unchanged. What changes: the editor's visible chrome is gated on `cascadeReady`, so cascade's resolution happens BEFORE any meaningful pixels are committed.
- **First-load fetch handler**: still flips `kyotoLoaded`/`coralLoaded`. Still creates the seed entry on empty fetch.
- **Child's hooks**: `useCoralThinkingPulse`, `useEasedNumber`/`useEasedColor`, JS animator effect — all behave identically once mounted. Their `startValue`/`resetKey` logic already handles a fresh mount with real data.

## Out of scope (deferred follow-ups)

- **Converging live page on the same `cascadeReady` gate**. Live page uses `realtimeOrb && <RealtimeBlob />` (lighter, partial). Both work; structural convergence happens during the file-split refactor.
- **WebGL init blank rectangle on `<Canvas>` mount**. Inherent to R3F; would need a saved-thumbnail placeholder to mask. Independent of this fix.
- **Explicit error state** when fallback is null. Skeleton persists in that case.
- **Skeleton styling polish** (subtle pulse animation, color match to active profile's hint color, etc.).

---

## Footnote — pushback on round-2 F4

> **F4 (P3) — bottom-bar height responsive.** The reviewer's concern was that the real bottom bar uses `flex-wrap` and has variable height across viewport widths, so a skeleton that "preserves bottom bar shape" might still cause vertical snap on narrow screens.
>
> **Pushback:** the bottom bar is `position: fixed` (`realtime-states.tsx:2418`, `<div className="fixed bottom-0 left-0 right-0 z-40">`). Fixed-position elements are taken out of normal document flow — their presence or absence cannot reflow any other element. The skeleton can therefore omit the bar entirely without causing vertical snap of the canvas slot, audio controls, or any other content.
>
> The visible "snap" a user perceives during the skeleton-to-real transition is the bar appearing in its fixed location at the bottom — not other content shifting to accommodate it. That's a brief reveal, not a layout reflow.
>
> If we wanted polish, we *could* render an inert empty bar in the skeleton for visual continuity (so the bottom strip doesn't blink in). But that's a styling call, not a correctness one. F4's underlying concern (vertical snap) is structurally not possible given fixed positioning.
>
> **Disposition:** F4 is therefore not folded into the plan as a required change. Skeleton contract above specifies "Bottom bar container: omitted entirely" with a reference to this footnote. If the reviewer disagrees with the fixed-position analysis, happy to discuss further — otherwise this can be re-read with the rest of v2.1 and we proceed.
