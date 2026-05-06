# Editor first-paint flash — fix plan (v2.2)

> v2.2 incorporates round-3 reviewer feedback. All four findings accepted (F1 P1, F2 P2, F3 P2, F4 P3) — they all surface real ownership-boundary gaps that v2.1's table missed. Reviewer's round-2 F4 pushback (footnote at bottom) is unchanged.

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
| **Source data** | **Visual / animator state** |
| `kyotoProfiles`, `coralProfiles` (source arrays) | `render: RenderValues` (animator output) |
| `kyotoLoaded`, `coralLoaded` (load flags) | `replayCounter` |
| `activeOrbKey` | `state: PreviewState` (idle/listening/thinking/talking pill) |
| `activeBaseline` (for dirty detection) | `autoLoop`, `expanded`, `activeTab`, `thinkingPaused` |
| `cascadeReady` (new) | All eased hooks (`useEasedNumber`, `useEasedColor`) |
| `externalProfileNames` | `useCoralThinkingPulse` |
| **Audio state (round-3 F2)** | The JS animator `useEffect` |
| `audioActive` — set by `<GalleryAudioControls>` which renders in the parent (visible in skeleton AND child-mounted phase) | All visual JSX |
| `audioData` + the audio polling `useEffect` — depends only on `audioActive`, doesn't need `state` | `restartIntro` (uses animator state). **Triggered post-mount via a child useEffect that watches `activeOrb` identity changes** — see "restartIntro post-mount mechanism" below. |
| **Modal / dialog UI state (round-3 F3)** | Slider helpers (`setBase`, `setPeak`, `clearPeak`, `coralSetBase`, etc.) — operate on parent-owned source arrays via passed-in setters |
| `showSaveDialog`, `saveStep`, `saveShader`, `saveName` | |
| `renamingId`, `renameDraft` | |
| **Color format (round-3 F4)** | |
| `colorFormat` — initialized via lazy `useState(() => ...)` reading localStorage synchronously on first render, so the format-flash is eliminated | |
| **Cascade effect** | |
| **First-load fetch effect** (sets `kyotoLoaded`/`coralLoaded`) | |
| **Action handlers**: `selectProfile`, `selectCoralProfile`, `handleSave`, `handleUpdate`, `togglePinned`, `togglePinnedCoral`, `commitRename`, `commitRenameCoral`, etc. | |

**Props flow:** parent passes resolved `activeOrb`, `activeBaseline`, source arrays, all dialog state + setters, `colorFormat` + setter, `audioActive` + `audioData`, and all action handlers as props. Child reads them, displays, calls handlers on user interaction.

**Why baseline lives in the parent:** the cascade `useEffect` is the natural place to capture baseline (`setActiveBaseline({key, shader, settings: structuredClone(...)})`) — that's how "the orb on disk = the orb in memory" is established. If baseline lived in the child, cascade couldn't pre-set it before the child mounts. Child receives `activeBaseline` as prop + `setActiveBaseline` as a callback for re-snapshotting after Save.

**Why dialog UI state lives in the parent (round-3 F3):** `handleSave` reads `saveName`, `saveShader`, `saveStep`. `commitRename` reads `renameDraft`. These are tightly coupled to the action handlers — keeping them with the handler keeps the action self-contained. The child renders the dialog UI but reads dialog state + calls dialog setters via props. Slightly more plumbing but cleaner action encapsulation.

**Why audio state lives in the parent (round-3 F2):** the skeleton renders `<GalleryAudioControls>` in the top-right (visible during the loading phase). That component calls `setAudioActive`. If `audioActive` lived in the child, the skeleton's audio control would either be non-functional during the loading phase OR couldn't be rendered at all. Putting it in the parent lets the audio control work continuously — turn audio on while the editor is still loading and the polling already works. Child receives `audioActive` + `audioData` as props.

**Why colorFormat lives in the parent with lazy init (round-3 F4):** today `colorFormat` defaults to `'hex'` and reads localStorage in a `useEffect` (line 1190–1195). On reload with persisted HSL/HSB, the Colours tab briefly shows HEX before the localStorage effect overwrites it. Lazy `useState` initializer reads localStorage synchronously on first render, eliminating the format flash:
```ts
const [colorFormat, setColorFormat] = useState<ColorFormat>(() => {
  if (typeof window === 'undefined') return 'hex';
  const stored = window.localStorage.getItem('realtime-states-color-format');
  return stored && COLOR_FORMATS.includes(stored as ColorFormat) ? (stored as ColorFormat) : 'hex';
});
```
The existing localStorage `useEffect` for color format becomes redundant and should be removed. Child receives `colorFormat` + `chooseColorFormat` (setter wrapper that also persists) as props.

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

### restartIntro post-mount mechanism (round-3 F1)

The child seeds its render state on first mount via the lazy useState initializer above. For **post-mount profile switches** — `selectProfile`, `handleSave` (which previously called `restartIntro` directly at lines 1561, 1705) — the parent's action handlers no longer call `restartIntro` themselves (they can't; it's child-local). Instead:

- Parent's `selectProfile(id)` updates source state: `setActiveOrbKey('realtime-state:${id}')` + `setActiveBaseline({...})`.
- Parent's `handleSave` (Kyoto branch) appends to `kyotoProfiles`, sets active key + baseline, persists.
- These setters propagate to the child as a new `activeOrb` prop.
- **Child has a `useEffect` that watches `activeOrb` identity changes (post-mount only) and runs `restartIntro` for Kyoto transitions:**

```tsx
const isFirstRenderRef = useRef(true);
useEffect(() => {
  if (isFirstRenderRef.current) {
    isFirstRenderRef.current = false;
    return; // first mount handled by lazy useState init above
  }
  if (activeOrb.shader === 'kyoto') {
    restartIntro(activeOrb.settings);
  }
  // Coral transitions don't use restartIntro — Coral has its own
  // native morph + the existing Replay/replayCounter mechanism.
}, [activeOrb.id, activeOrb.shader]);
```

Net behavior preserved:
- **First mount with Kyoto persisted**: lazy useState init seeds `render` from active profile. No restartIntro call. `activeTauOverrideRef` should also be lazy-initialized to `talking.settleSpeed ?? base.thickenSpeed` of the active profile so the talking-exit override works without an explicit restartIntro.
- **First mount with Coral persisted**: lazy init falls back to KYOTO_SEED render values (unused — Coral canvas doesn't read `render`). Coral's `<CoralStoneMorph>` mounts fresh; the `goal=1` + `morphRef=0` natural intro plays.
- **Post-mount Kyoto profile switch**: parent updates state → activeOrb prop changes → child's effect runs `restartIntro(activeOrb.settings)`. Same intro semantics as today.
- **Post-mount Coral profile switch**: parent updates state → activeOrb prop changes. Child's effect skips restartIntro (Coral path). The existing F1 round-7 contract (no intro replay on same-shader switch) still holds.
- **Post-mount cross-shader switch (Coral ↔ Kyoto)**: activeOrb.shader change still triggers the canvas dispatch swap via the existing JSX. Plus the new effect runs restartIntro on the Kyoto-side direction.

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
