# Trace Sample-Receipt Picker — Plan

Date: 2026-04-27
Status: Draft for review (no code changes yet)

## 1. Goal

Let a user demoing Trace pick from a small set of pre-cleaned sample receipts when they don't have a real receipt photo on hand. The selection is a real upload — same parse-receipt API call, same processing UI — so the demo behaves like the product, not like a canned playback.

## 2. Scope

### In scope (this round — phase 1)

- **Showcase TraceDemo only** (`src/projects/demo-showcase/components/demos/TraceDemo.tsx`).
- A thumbnail strip beneath the demo card — four WebP squares positioned independently from the existing dormant Clear button (see §6 for the per-profile positions).
- A modal that opens on thumbnail click, showing a swipeable carousel of the four full-resolution PNGs with caption + page indicators + Upload action + close affordances.
- Wire-up to TraceCore's existing image-upload pipeline so Upload tap behaves identically to picking a file via the file picker.
- A single source-of-truth state-gating rule that prevents the picker from being opened or used while a recording / processing flow is in progress (see §5).

### Out of scope (defer to later phases)

- **Phase 2 — Standalone `/trace` page integration.** The strip will eventually live under the card on the standalone page too. That requires shifting the existing clear-button position to the right and wiring TraceCore's TraceModalOverlay (rather than ShowcaseModalContext) to the modal. Architecturally trivial once phase 1 is in; just punted until phase 1 is verified.
- **TraceSim** (the auto-loop simulation). Sim plays its own scripted flow with no manual interaction; sample-receipt thumbnails are explicitly hidden there.
- Animation polish beyond what the existing `ShowcaseModalLayer` already provides. Emil-style polish (blur-masked transitions, custom curves) is welcomed but not blocking.
- Mobile arrow buttons on the modal — see if they're needed after first build; the X close + drag swipe + page dots may be enough.
- Long-press, momentum drag, or any gesture more sophisticated than "drag horizontally to change selection."

## 3. Surfaces this touches

| File | Change |
|---|---|
| `src/projects/trace/data/sample-receipts.ts` | **NEW.** Single source of truth for the sample set: `[{ id, src, thumbSrc, caption, alt, mimeType }, ...]` |
| `src/projects/trace/components/ui/SampleReceiptPickerModal.tsx` | **NEW.** Carousel content rendered inside whatever modal layer the consumer provides. Pure presentation + selection state; doesn't open/close itself. |
| `src/projects/trace/components/TraceCore.tsx` | Refactor `handleUploadClick` to extract `processImageFile(file: File)`. Expose a new `onRequestSamplePicker?: (controls)` render-slot prop in the same shape as the existing `onRequestClearAll` so the showcase can mount the picker through `ShowcaseModalContext`. |
| `src/projects/demo-showcase/components/demos/TraceDemo.tsx` | Render the thumbnail strip (portaled to `.canvas-content` like the existing Clear button), wire `onRequestSamplePicker` to open the modal via `ShowcaseModalContext`. |
| `public/images/receipts-cutout/thumbs/` | **NEW.** Four WebP thumbnails (~150–200 px) generated via the `image-convert` skill from the cleaned PNGs. PNGs stay as the upload payload + modal preview. |

## 4. Data model

```ts
// src/projects/trace/data/sample-receipts.ts
export interface SampleReceipt {
  id: string;                    // 'tesco-1', 'sainsburys', etc.
  src: string;                   // /images/receipts-cutout/tesco-1.png — full PNG, the upload payload
  thumbSrc: string;              // /images/receipts-cutout/thumbs/tesco-1.webp — strip thumbnail
  alt: string;                   // for screen readers
  caption: string;               // shown at top of modal — describes the real-world condition
  mimeType: 'image/png';         // hardcoded; cleanup pipeline always emits PNG
}

export const SAMPLE_RECEIPTS: SampleReceipt[] = [/* ... */];
```

Order in the array is the order in the strip and the carousel. Default order: tesco-1 → tesco-2 → tesco-3 → sainsburys (date-ascending Tescos, then the outlier Sainsbury's last so the format-generalisation case is on the end).

## 5. State gating

The sample-receipt picker introduces a **second upload entrance** into Trace, alongside the existing TRNavbarV2 Upload/Speak buttons. Without explicit gating it would let a user kick off a sample upload while the navbar's state machine already has a recording or processing flow in progress — overwriting in-flight state and destroying work. The dormant ClearButton plan ([CLEAR-BUTTON-DORMANT-STATE.md](./CLEAR-BUTTON-DORMANT-STATE.md)) solved the analogous concern for clearing; this section defines the equivalent rule for the picker.

### 5.1 The rule

Single source of truth in TraceCore, evaluated once per render:

```ts
const isClearDisabled        = entries.length === 0 || navbarState !== 'idle';
const isSamplePickerDisabled =                          navbarState !== 'idle';
```

Note the picker condition is **strictly the navbar gate** — there's no `entries.length` clause because the picker is most useful in the empty-entries state (a fresh demo with nothing logged yet).

`navbarState !== 'idle'` is true for all three non-idle states the navbar tracks: `'recording'`, `'processing_audio'`, `'processing_image'`. So the picker is dormant whenever:

- The user is mid-recording an audio note
- An audio recording is being transcribed by `/api/trace/parse-voice`
- An image (sample or otherwise) is being parsed by `/api/trace/parse-receipt`

In all three cases, opening the picker or triggering an upload would race with about-to-render results. Gating closes that hole.

### 5.2 Where the rule applies

| Surface | Treatment when disabled |
|---|---|
| Strip thumbnails (`renderSampleStrip`) | Visually dormant — `opacity 0.35`, `cursor: not-allowed`, `<button disabled>` for native click-blocking. **Same recipe as the dormant Clear button** ([tracebuttons.tsx:240](../../src/projects/trace/components/ui/tracebuttons.tsx:240)). No `pointer-events: none` so the cursor affordance stays visible. |
| `onRequestSamplePicker` callback | Early-return at the top: if `isSamplePickerDisabled`, do nothing. Defense in depth — catches programmatic calls or anything that bypasses the visual disabled state. |
| Modal **Upload** button | Reads `isSamplePickerDisabled` and renders dormant if it flips true while the modal is open. Realistically only triggered by a kill-switch abort firing mid-modal, but consistency with the gating pattern matters more than the rarity of the case. |
| Modal **carousel navigation** (peek click, swipe, arrow keys) | Stays enabled. The user can still browse receipts mid-processing — they just can't commit. (Alternative: dismiss the modal entirely on state change. Simpler, but more disruptive. Default to "let them browse, just don't let them upload" unless we hear otherwise.) |

### 5.3 Propagation through the render-slot signatures

The strip render slot takes `isDisabled` as a plain boolean prop — same shape as the dormant Clear plan extended `renderClearButton`:

```ts
renderSampleStrip?: (
  receipts: SampleReceipt[],
  onThumbnailClick: (index: number) => void,
  isDisabled: boolean,
) => React.ReactNode;
```

The strip re-renders on every TraceCore render because it's a child of TraceCore's render tree. So a plain boolean prop is enough — when `navbarState` flips, TraceCore re-renders, the strip re-renders, the thumbnails reflect the new disabled state. Standard React data flow.

The modal is different — and this is the bit the reviewer correctly flagged was hand-waved before.

### 5.3.1 Why a plain boolean isn't enough for the modal

The showcase modal layer ([ShowcaseModalContext.tsx:16](../../src/projects/demo-showcase/context/ShowcaseModalContext.tsx:16), [ShowcaseModalLayer.tsx:56](../../src/projects/demo-showcase/components/ui/ShowcaseModalLayer.tsx:56)) stores the modal content as a `ReactNode` **once** at `openModal()` time and renders it directly. The captured node is whatever JSX TraceDemo passed in. If that JSX closes over `isSamplePickerDisabled = false` from the moment the modal opened, TraceCore re-rendering with `true` later won't propagate — the captured node is frozen.

So if the user opens the picker modal with everything idle, then a kill-switch abort fires `processing_image` mid-modal, the Upload button needs to dim **without re-firing `openModal()`** (which would replace the modal content and lose carousel state).

### 5.3.2 The fix — external store + `useSyncExternalStore`

TraceCore exposes an external-store contract on the controls bag, and the modal component consumes it via React's built-in `useSyncExternalStore` hook. Standard React pattern for "subscribe to a value that lives outside React's component tree."

```ts
onRequestSamplePicker?: (controls: {
  receipts: SampleReceipt[];
  initialIndex: number;
  selectReceipt: (file: File) => Promise<void>;
  cancel: () => void;
  // External-store contract for live disabled state. The modal
  // subscribes via useSyncExternalStore and re-renders on each
  // change, even though the modal content was captured by
  // openModal() once.
  subscribeIsDisabled: (callback: () => void) => () => void;  // returns unsubscribe
  getIsDisabled: () => boolean;
}) => void;
```

TraceCore implementation (sketch — full version in §9 Architecture):

```ts
const isSamplePickerDisabledRef = useRef(isSamplePickerDisabled);
const pickerSubscribersRef = useRef<Set<() => void>>(new Set());

useEffect(() => {
  isSamplePickerDisabledRef.current = isSamplePickerDisabled;
  // Notify all open-modal subscribers
  pickerSubscribersRef.current.forEach((cb) => cb());
}, [isSamplePickerDisabled]);

const subscribeIsDisabled = useCallback((cb: () => void) => {
  pickerSubscribersRef.current.add(cb);
  return () => { pickerSubscribersRef.current.delete(cb); };
}, []);
```

Modal consumption:

```tsx
// Inside <SampleReceiptPickerModal>
const isDisabled = useSyncExternalStore(
  controls.subscribeIsDisabled,
  controls.getIsDisabled,
);

// Used in the Upload button render:
<button disabled={isDisabled} onClick={...}>Upload</button>
```

`useSyncExternalStore` triggers a re-render of the modal component the moment a subscriber callback fires. The captured ReactNode is a thin wrapper that lets the inner component's hooks re-evaluate on each notification. Carousel state inside the modal is preserved because we're not replacing the captured node — only the inner component re-renders.

This contract is **the same shape Redux, Zustand, and other external-store libraries use to integrate with React 18+**. Idiomatic, well-supported, no polling, no provider-API surgery.

### 5.3.3 What this contract is NOT

- **Not a getter alone.** A getter returns the current value but doesn't tell React when to re-render. Calling `controls.isDisabled()` inside a captured ReactNode would always return the value-at-capture-time unless paired with a subscription that triggers re-renders.
- **Not a prop on the modal component.** Props would require re-mounting or re-passing, both of which require either replacing the captured ReactNode (loses carousel state) or extending the showcase modal context API (invasive). The `useSyncExternalStore` approach avoids both.
- **Not a polling loop.** No `setInterval`, no `requestAnimationFrame`. The subscriber callback is fired exactly when `isSamplePickerDisabled` changes — once per genuine state transition.

### 5.4 Why the picker stays dormant during `processing_audio` (subtle case)

The picker uploads images via `/api/trace/parse-receipt`. Audio processing uses a different endpoint (`/api/trace/parse-voice`). At the network layer they're independent. So why gate the picker on audio processing?

Because the **navbar UI** is in a non-idle state — same toast, same disabled controls, same in-flight expectation that the user is about to see results. Letting the picker punch through that state would visually conflict with what the user just initiated and what they're about to see. The gate is about UX coherence, not about API races.

### 5.5 Acceptance criteria for the gate

Folded into §11 as criteria #11–#13:

11. While `navbarState === 'recording'`, all four strip thumbnails render dormant. Clicking any does nothing.
12. While `navbarState === 'processing_audio'`, same as above.
13. While `navbarState === 'processing_image'`, same as above.

---

## 6. Caption drafts (for your edit)

Captions describe the real-world condition the receipt represents — what makes it a useful test case, not just a label.

| ID | Receipt | Draft caption |
|---|---|---|
| `tesco-1` | Tesco 21/12/2024, heavily crumpled | "Heavily crumpled receipt — folds compress line items." |
| `tesco-2` | Tesco 18/01/2025, lightly creased | "Standard receipt with thermal-paper fade — the everyday case." |
| `tesco-3` | Tesco 25/01/2025, short shop, well lit | "Quick three-item visit — short receipts can trip up parsers." |
| `sainsburys` | Sainsbury's 06/08/2022, different store | "Different supermarket, different layout — tests format generalisation." |

These are drafts. Edit / replace freely; the format is "≤ ~60 chars, sentence-case, period-terminated, framed as a stress-test description rather than a name."

## 7. Layout

### Architectural posture

Strip and Clear button are **independently positioned siblings**, not flexbox children of the same row. This was the right structural call after the reviewer pointed out the mobile-row math was tight (4×64 + gaps + 56-px Clear ≈ 352 px, leaving only ~3 px slack at 375-px viewport). Decoupling them:

- Removes the flexbox dependency between strip and Clear, so changes to either don't ripple.
- Makes Clear's position **identical across both profiles** (bottom-right corner, exactly where it lives today — see [TraceDemo.tsx:76-83](../../src/projects/demo-showcase/components/demos/TraceDemo.tsx:76)).
- Preserves the user's perceived "strip-on-left, Clear-on-right" outcome on mobile through Y-coordinate alignment, not through DOM siblinghood.

### Mobile layout

```
┌─────────────────────── demo card ───────────────────────┐
│                                                         │
│                  (Trace card content)                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
   ┌──┐ ┌──┐ ┌──┐ ┌──┐                              ┌──┐
   │T1│ │T2│ │T3│ │SB│                              │🗑 │
   └──┘ └──┘ └──┘ └──┘                              └──┘
```

- Strip: left-aligned at the bottom of the canvas, ~10 px from left edge, ~16 px below the card.
- Clear: bottom-right corner of the canvas, **unchanged** — `right: 8px; bottom: 8px;` (already in [TraceDemo.tsx:109-114](../../src/projects/demo-showcase/components/demos/TraceDemo.tsx:109)).
- Both share roughly the same Y position, so visually they form a row.

### Desktop layout

```
┌─────────────────────── demo card ───────────────────────┐
│                                                         │
│                  (Trace card content)                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
              ┌──┐ ┌──┐ ┌──┐ ┌──┐                    ┌──┐
              │T1│ │T2│ │T3│ │SB│                    │🗑 │
              └──┘ └──┘ └──┘ └──┘                    └──┘
              ←── strip centered ──→                  ↑ corner
```

- Strip: horizontally centered under the card.
- Clear: bottom-right corner of the canvas, **unchanged**.
- Plenty of horizontal slack on desktop, so neither needs to shift to make room for the other.

### Thumbnail dimensions

| Property | Mobile | Desktop |
|---|---|---|
| Square side | **64 px** | **80 px** |
| Gap between | 8 px | 10 px |
| Border radius | 8 px | 8 px |
| Image fit | square center-crop of the receipt PNG → WebP (see §10) | same |

No labels under thumbnails. No selection ring on the strip itself — selection is committed inside the modal, not on the strip.

### Both portaled to `.canvas-content`

The strip is rendered via `renderSampleStrip`, portaled into `.canvas-content` (same pattern as Clear). Two independent portals, two `position: absolute` placements, no shared parent.

### Modal layout — mobile

```
┌──────────────────────────┐  ← backdrop, blurs the demo
│                       ⓧ │
│                          │
│  Crumpled receipt —      │  ← caption
│  folds compress lines.   │
│                          │
│   ┌───────────────────┐  │
│   │                   │  │
│   │  [TESCO RECEIPT]  │  │  ← centered, fills width
│   │                   │  │
│   └───────────────────┘  │
│                          │
│        ●  ○  ○  ○        │  ← page dots
│                          │
│      ┌──────────┐        │
│      │  Upload  │        │
│      └──────────┘        │
└──────────────────────────┘
```

### Modal layout — desktop

```
┌────────────────────────────────────────────────────┐
│                                                ⓧ │
│                                                    │
│           Crumpled receipt — folds                 │  ← caption
│           compress line items.                     │
│                                                    │
│   ┌───┐  ┌──────────────────┐  ┌───┐               │
│   │T1 │  │   [TESCO RECEIPT]│  │T3 │               │  ← centered + 2 peeks
│   │   │  │                  │  │   │
│   └───┘  └──────────────────┘  └───┘
│   ↑                              ↑
│   45% opacity, ~60% height,      same
│   ~10px blur
│
│              ●  ●  ○  ○                           │
│
│            ┌──────────┐
│            │  Upload  │
│            └──────────┘
└────────────────────────────────────────────────────┘
```

### Peek receipts on desktop — exact spec

- **Opacity**: `0.45`
- **Height**: 60% of the centered receipt's height (width scales proportionally so aspect stays correct)
- **Filter**: `blur(10px)`
- **Position**: flanking the centered receipt with 24-32 px gap
- **Click target**: clicking either peek navigates the carousel one step in that direction (left peek → previous, right peek → next)

## 8. Interaction spec

| Trigger | Behavior |
|---|---|
| Click thumbnail #N in the strip | Modal opens with index N centered. Strip dims to ~50% behind the modal backdrop (free via existing `ShowcaseModalLayer` blur). |
| Drag horizontally inside the modal (mobile) | Carousel pages to next/prev based on swipe direction. Drag distinguished from tap by Δ-distance threshold (~20 px) so a tap to dismiss is never confused with a swipe. |
| Click left/right peek receipt (desktop) | Carousel pages one step in that direction. Smooth slide. |
| Press ←/→ key (desktop) | Same as click peek. |
| Click backdrop | Modal dismisses without uploading. |
| Click X (top-right of modal) | Same as backdrop click. |
| Tap **Upload** | Modal closes immediately. TraceCore enters `processing_image` state, fetches `/api/trace/parse-receipt`, adds the entry to the list. Identical to a real file-picker upload. |

The X button is something we add — not in your mock. Top-right of the modal, ~16 px in from corners, follows the close-button pattern used in `TraceClearExpensesModal`.

## 9. Architecture

### TraceCore changes

Today, `handleUploadClick` is one function that creates the file picker AND processes the result. We split:

```ts
// New, exposed via render-slot prop
const processImageFile = useCallback(async (file: File) => {
  const myRun = runIdRef?.current ?? 0;
  setNavbarState('processing_image');
  // ... existing fetch + setEntries logic, unchanged
}, [/* deps */]);

// Existing, calls the new function
const handleUploadClick = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    await processImageFile(file);
  };
  input.click();
};
```

Then expose two new optional props on `TraceCoreProps`, mirroring the existing `onRequestClearAll` / `renderClearButton` shape and threading the gating flag from §5:

```ts
// Optional callback — when present, the showcase delegates the
// sample-receipt picker modal to its own modal layer (same pattern
// as onRequestClearAll). Standalone /trace can implement this in
// phase 2 using TraceModalOverlay.
onRequestSamplePicker?: (controls: {
  receipts: SampleReceipt[];
  initialIndex: number;
  selectReceipt: (file: File) => Promise<void>;  // calls processImageFile
  cancel: () => void;
  // External-store contract for live disabled state inside the
  // open modal — see §5.3.2. Modal consumes via useSyncExternalStore.
  // The pair is what gets the modal to re-render when navbarState
  // flips mid-modal, even though the captured ReactNode is otherwise
  // frozen by ShowcaseModalContext.
  subscribeIsDisabled: (callback: () => void) => () => void;
  getIsDisabled: () => boolean;
}) => void;

// Optional render slot for the thumbnail strip itself, same pattern
// as renderClearButton. Lets the showcase position the strip inside
// its canvas chrome instead of TraceCore's default below-the-card
// layout. The third arg `isDisabled` propagates the §5 gate so
// thumbnails render dormant during recording / processing flows.
renderSampleStrip?: (
  receipts: SampleReceipt[],
  onThumbnailClick: (index: number) => void,
  isDisabled: boolean,
) => React.ReactNode;
```

Inside TraceCore:

```ts
const isClearDisabled        = entries.length === 0 || navbarState !== 'idle';
const isSamplePickerDisabled =                          navbarState !== 'idle';

// External-store plumbing (§5.3.2). The ref holds the latest value
// so any open-modal subscriber can read it synchronously; the Set
// holds the subscribers; the effect mirrors React state into the
// ref AND notifies subscribers on each change.
const isSamplePickerDisabledRef = useRef(isSamplePickerDisabled);
const pickerSubscribersRef = useRef<Set<() => void>>(new Set());

useEffect(() => {
  isSamplePickerDisabledRef.current = isSamplePickerDisabled;
  pickerSubscribersRef.current.forEach((cb) => cb());
}, [isSamplePickerDisabled]);

const subscribeIsDisabled = useCallback((cb: () => void) => {
  pickerSubscribersRef.current.add(cb);
  return () => { pickerSubscribersRef.current.delete(cb); };
}, []);

const handleStripClick = (index: number) => {
  if (isSamplePickerDisabled) return;          // §5.2 defense in depth
  if (onRequestSamplePicker) {
    onRequestSamplePicker({
      receipts: SAMPLE_RECEIPTS,
      initialIndex: index,
      selectReceipt: async (file) => {
        if (isSamplePickerDisabledRef.current) return;  // §5.2
        await processImageFile(file);
      },
      cancel: () => {},                        // showcase handles modal close
      subscribeIsDisabled,
      getIsDisabled: () => isSamplePickerDisabledRef.current,
    });
    return;
  }
  // Phase 2: open TraceModalOverlay-based picker here
};
```

Inside `<SampleReceiptPickerModal>`:

```tsx
const isDisabled = React.useSyncExternalStore(
  controls.subscribeIsDisabled,
  controls.getIsDisabled,
);

// Used to dim the Upload pill live:
<UploadButton disabled={isDisabled} onClick={handleUpload} />
```

### TraceDemo changes

Renders the strip via `renderSampleStrip` (portaled to `.canvas-content`, same pattern as the clear button) and wires `onRequestSamplePicker` to open `<SampleReceiptPickerModal>` through `useShowcaseModal()`:

```tsx
const handleSamplePickerRequest = useCallback((controls) => {
  openModal({
    closeOnBackdropClick: true,
    onRequestClose: () => { closeModal(); },
    content: (
      <SampleReceiptPickerModal
        receipts={controls.receipts}
        initialIndex={pendingIndex}
        onUpload={async (receipt) => {
          // Convert receipt to File, hand to TraceCore
          const blob = await fetch(receipt.src).then(r => r.blob());
          const file = new File([blob], `${receipt.id}.png`, { type: receipt.mimeType });
          closeModal();
          await controls.selectReceipt(file);
        }}
        onClose={closeModal}
      />
    ),
  });
}, [openModal, closeModal, pendingIndex]);
```

### `<SampleReceiptPickerModal>` component

Pure presentation + local carousel state. Receives the receipts array, the initial index, and two callbacks (onUpload, onClose). Renders:

- Caption (top, derived from `receipts[currentIndex].caption`)
- Carousel — center receipt full-size, peek receipts on desktop
- Page dots
- Upload pill at bottom
- X close button top-right

Internal state: `currentIndex` (number), `dragOffsetX` (transient during gesture).

## 10. Asset pipeline

### Generate WebP thumbnails

After this plan is approved, generate four WebP thumbnails from the existing cleaned PNGs using the `image-convert` skill:

```
public/images/receipts-cutout/
├── sainsburys.png     ← upload payload + modal preview (existing)
├── tesco-1.png        ← (existing)
├── tesco-2.png        ← (existing)
├── tesco-3.png        ← (existing)
└── thumbs/
    ├── sainsburys.webp     ← strip thumbnail (~150 px square, 80 quality)
    ├── tesco-1.webp
    ├── tesco-2.webp
    └── tesco-3.webp
```

The thumbnails are square-cropped center crops (receipts are taller than wide, so center-crop to a square loses some receipt content but reads better as a strip thumb). Or alternatively keep aspect ratio and pad — taste call. **Default: square crop.** Confirm.

### Why this asset split

- **WebP for the strip**: small file (~5–10 KB each), paint-fast, no transparency-on-arbitrary-bg concerns since the strip sits on the demo canvas.
- **PNG for the modal preview + upload**: full transparency-aware cutout, fully readable when zoomed, and the upload format Trace's `parse-receipt` API accepts.
- **No re-encoding on upload**: the PNG is fetched as a Blob, wrapped in a `File` with the correct MIME, and passed to `processImageFile`. Trace's pipeline never knows the difference between this and a phone-photo upload.

## 11. Implementation order (proposed)

Single feature, but a lot of moving parts. Suggested sub-commits:

1. **Data + assets.** Generate WebP thumbnails. Create `sample-receipts.ts`. No UI yet.
2. **TraceCore refactor.** Extract `processImageFile`. Add `onRequestSamplePicker` + `renderSampleStrip` render-slot props (declared, not yet consumed) **with the §5 `isDisabled` flag and `isDisabled()` getter wired in from day one**. Add the `isSamplePickerDisabled` derivation. Verify standalone `/trace` still works unchanged.
3. **`<SampleReceiptPickerModal>` component.** Build in isolation. Render in a Storybook-style scratch page or directly in TraceDemo for visual development. No upload wiring yet — Upload button is a no-op.
4. **TraceDemo wiring — strip.** Render the thumbnail strip via `renderSampleStrip`, portaled to `.canvas-content`. No modal yet.
5. **TraceDemo wiring — modal.** Wire `onRequestSamplePicker` → `useShowcaseModal()` → mount `<SampleReceiptPickerModal>`. Upload button still a no-op.
6. **Upload wire-up.** Connect `onUpload` to `controls.selectReceipt(file)`. End-to-end now: thumbnail → modal → upload → entry in list.
7. **Polish + Emil pass.** Modal entry/exit timing, peek hover, drag responsiveness. Optional last commit if time permits.

I'd vote step 2 lands as a standalone commit before any showcase work — TraceCore's contract-only change, low risk, easy to roll back if needed. Steps 3–6 then build on a stable contract.

## 12. Acceptance criteria

The change is correct only if **all** of the following hold:

1. On `/demo-showcase` slide 2 (Trace) in the simulation state, **no thumbnails or strip appear** — the sim runs identically to today.
2. On `/demo-showcase` slide 2 in **Try Demo** mode, four WebP thumbnails appear beneath the card. Strip and Clear are independent portals (see §7) — visually they sit on the same Y band as Clear on mobile, while desktop centers the strip under the card and Clear stays in its existing bottom-right corner.
3. Clicking thumbnail N opens the modal with receipt N centered, with the matching caption visible at the top.
4. On desktop, the modal shows peeks of the adjacent receipts at opacity 0.45, height 60%, blur 10px. On mobile, only the centered receipt is shown.
5. Drag/swipe horizontally on mobile changes selection without dismissing the modal. Tapping outside the receipt area dismisses the modal.
6. Arrow keys ←/→ on desktop change selection. Clicking a peek receipt navigates one step in that direction.
7. Tapping the X (top-right) or the backdrop dismisses the modal without changing TraceCore state.
8. Tapping **Upload** closes the modal immediately and triggers TraceCore's `processing_image` state. The entry appears in the list when `/api/trace/parse-receipt` returns. Behavior is identical to a manual file-picker upload.
9. Standalone `/trace` is **unchanged in this round**. No thumbnail strip, no picker — Phase 2 work.
10. No console errors or layout shift on modal open/close.
11. While `navbarState === 'recording'`, all four strip thumbnails render dormant (opacity 0.35, cursor `not-allowed`, click is a no-op). Same for `'processing_audio'` and `'processing_image'`.
12. If a kill-switch abort or other state change flips `navbarState` to non-idle while the modal is already open, the modal's **Upload** button reflects the new disabled state on its next render. Carousel navigation (peek click, swipe, arrow keys) remains enabled — user can still browse, just can't commit.
13. The picker rule is **strictly the navbar gate** (§5.1). It does NOT depend on `entries.length`, since the picker is most useful in the empty-entries state.

## 13. Open questions

| Question | Default if unanswered |
|---|---|
| Final caption copy | Use the drafts in §5 for first build; you edit the strings file once it's in place |
| Square-crop vs aspect-preserving thumbnail | Square-crop (cleaner strip layout) |
| Strip thumbnail size | 64 px mobile, 80 px desktop |
| Modal X button style | Match `TraceClearExpensesModal`'s close button (consistency with existing modals) |
| Bake captions into PNG metadata for accessibility? | No — `alt` field on `SampleReceipt` is enough; caption is presentational |

## 14. What we explicitly aren't building

To avoid scope creep:

- A "real" file picker fallback inside the picker modal. Modal is sample receipts only; the existing Upload button (in TRNavbarV2) keeps the file picker.
- Multi-select. One receipt at a time, same as a real upload.
- Drag-to-reorder thumbnails or any user-customisation of the sample set.
- Receipt search / filter UI in the modal.
- A "Why is this a good test case?" expanded-info panel — caption is the entirety of the editorial copy.
- An upload progress bar inside the modal — modal closes immediately on Upload, the existing TraceCore processing UI takes over.
- Server-side or build-time generation of the WebP thumbnails. Done once via the `image-convert` skill, committed as static assets.

## 15. Suggested commit message (final)

```
feat(Trace): sample-receipt picker for showcase demo

Adds a four-thumbnail strip beneath the TraceDemo card and a
swipeable carousel modal so users without a real receipt photo can
demo the upload flow with pre-cleaned sample receipts.

  - sample-receipts.ts: single source of truth for the sample set
  - SampleReceiptPickerModal: caption + carousel + Upload + X close
  - TraceCore: extracted processImageFile() so the upload pipeline
    can be invoked with any File regardless of source. Added
    onRequestSamplePicker / renderSampleStrip render slots in the
    same shape as onRequestClearAll / renderClearButton, with a
    single isSamplePickerDisabled = navbarState !== 'idle' rule
    propagated through both. Picker is dormant during recording /
    processing flows so a second upload entrance can't race the
    navbar state machine.
  - TraceDemo: renders the strip portaled to .canvas-content,
    opens the modal via ShowcaseModalContext.
  - WebP thumbnails (~150 px square, 80 quality) for the strip;
    full PNGs for the modal preview and upload payload (Trace's
    parse-receipt API doesn't accept WebP).

TraceSim untouched — sample receipts are demo-only by design.
Standalone /trace integration is phase 2 (see plan §2).
```

## 16. Review checklist (for the human reviewer)

- [ ] State-gating rule §5.1 — `isSamplePickerDisabled = navbarState !== 'idle'`, no entries-count clause
- [ ] §5.2 mid-modal behavior — Upload dims, carousel nav stays interactive (vs alternative: dismiss modal entirely on state change)
- [ ] Caption drafts in §6 — accept as starting point or rewrite
- [ ] Order of receipts in the carousel (currently tesco-1 → tesco-2 → tesco-3 → sainsburys)
- [ ] Square-crop vs aspect-preserving thumbnails
- [ ] Strip dimensions 64 / 80 px square
- [ ] §7 layout: independent positioning (strip and Clear in separate portals, not the same flexbox row)
- [ ] X button placement top-right + style matches existing modal close
- [ ] Phase 2 (standalone `/trace`) deferred — confirm
- [ ] TraceSim explicitly excluded — confirm
- [ ] Implementation order (§11) — single big commit vs the 7 sub-commits proposed
