# Safari Spinner Wobble — Handoff

## Problem

The Trace "Processing Image" / "Analysing Audio" spinner rotates off its center axis in **Safari only**. Chrome, Firefox, Edge, and the in-tool preview window all render it correctly (clean rotation around a stable center point).

In Safari, the spinner icon appears to "drift" vertically and horizontally as it rotates — it's clearly still animating, but each rotation wobbles visibly as if the rotation center is shifting every frame.

## Reproduction

1. Open Safari (tested on macOS Safari)
2. Navigate to either:
   - `/trace` — trigger a recording / upload to enter `processing_audio` or `processing_image` state
   - `/trace/showcase/tracecomponent` — the spinner buttons are visible statically
3. Watch the circular arrow spinner inside the button
4. **Expected:** Spinner rotates cleanly around its center, icon stays in one spot
5. **Actual (Safari only):** Icon wobbles off axis — appears to bob up/down and left/right as it rotates

## Where the code lives

Three separate `.spinner-container` rules in styled-jsx blocks, each with identical structure:

### 1. `src/projects/trace/components/ui/tracenavbar.tsx` (lines ~557–573)
Used in the real Trace app (`/trace`) via `TRNavbar` → `TRNavbarV2`.

```tsx
.spinner-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
```

### 2. `src/projects/trace/components/ui/tracebuttons.tsx` (lines ~380–397)
`ProcessingAudioButton` — used in the showcase page only.

### 3. `src/projects/trace/components/ui/tracebuttons.tsx` (lines ~455–472)
`ProcessingImageButton` — used in the showcase page only.

All three contain the same 24×24 spinner SVG with this markup:

```tsx
<div className="spinner-container">
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M400 800c-54.66666 0-106.33334-10.5-155-31.5-48.66667-21-91.16667-49.66669-127.5-86-36.33333-36.33331-65-78.83331-86-127.5-21-48.66666-31.5-100.33334-31.5-155 0-55.33334 10.5-107.16666 31.5-155.5 21-48.33333 49.66667-90.66667 86-127 36.33333-36.33333 78.83333-65 127.5-86 48.66666-21 100.33334-31.5 155-31.5 11.33334 0 20.83334 3.83333 28.5 11.5 7.66666 7.66667 11.5 17.16667 11.5 28.5 0 11.33333-3.83334 20.83333-11.5 28.5-7.66666 7.66666-17.16666 11.5-28.5 11.5-88.66666 0-164.16667 31.16667-226.5 93.5-62.33333 62.33333-93.5 137.83334-93.5 226.5 0 88.66666 31.16667 164.16669 93.5 226.5 62.33333 62.33331 137.83334 93.5 226.5 93.5 88.66666 0 164.16669-31.16669 226.5-93.5 62.33331-62.33331 93.5-137.83334 93.5-226.5 0-11.33334 3.83331-20.83334 11.5-28.5 7.66669-7.66666 17.16669-11.5 28.5-11.5 11.33331 0 20.83331 3.83334 28.5 11.5 7.66669 7.66666 11.5 17.16666 11.5 28.5 0 54.66666-10.5 106.33334-31.5 155-21 48.66669-49.66669 91.16669-86 127.5-36.33331 36.33331-78.66669 65-127 86-48.33334 21-100.16666 31.5-155.5 31.5z"
      transform="translate(2, 2) scale(0.025)"
      fill="currentColor"
    />
  </svg>
</div>
```

Key detail: the path data is in a 0–1000 coordinate space, then reduced into a 24×24 viewBox via an inline SVG transform `translate(2, 2) scale(0.025)`. After this transform the path's visual center is approximately `(12, 12)`, but not to perfect integer precision — the fractional path points scaled by 0.025 land on non-integer pixel values.

## Suspected root cause

This looks like Safari's well-known CPU-rasterized small-transform wobble:

1. The rotating element is a 24×24 div — small enough that Safari won't promote it to a compositor layer automatically.
2. Safari rasterizes CSS rotations on the CPU for non-composited elements.
3. On each animation frame, Safari re-snaps the sub-pixel rendering of the already-sub-pixel path data. Because the bounding box of the rotated path changes with angle, the snap direction changes too.
4. The cumulative effect is the icon appearing to jitter off its center.

Chrome/Firefox/Edge promote small rotating elements to their own GPU compositor layer more aggressively, so they rasterize the bitmap **once** and then rotate that bitmap on the GPU — no per-frame re-snapping, no wobble.

## Attempted fix (did not work)

Committed as `a161484`, then reverted as `a75e070`. The attempt was to force GPU compositing by adding:

```css
.spinner-container {
  /* ...existing... */
  transform-origin: 50% 50%;
  will-change: transform;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

@keyframes spin {
  from { transform: rotate(0deg) translateZ(0); }
  to   { transform: rotate(360deg) translateZ(0); }
}
```

**Result:** No visible change on Safari — spinner still wobbles off center.

This is surprising — these properties should have forced layer promotion. Possible reasons the fix didn't work:

- The wobble may not be caused by CPU rasterization at all; it may be the SVG path's intrinsic geometry being off-center and Safari computing `transform-origin` differently from other browsers.
- `will-change: transform` on a child element may not be enough if the parent button is also being re-laid out by the flex container around it.
- The path's `transform="translate(2, 2) scale(0.025)"` may be miscalculating the geometric bounding box in Safari, so `transform-origin: 50% 50%` (which is the layout box center) isn't the visual center.

## Things to try next

### 1. Rotate the SVG itself, not the parent div

Apply the animation directly to the `<svg>` element and use `transform-box: fill-box` to tell Safari to compute transform-origin from the SVG's own box:

```css
.spinner-container svg {
  transform-box: fill-box;
  transform-origin: 50% 50%;
  animation: spin 1s linear infinite;
}
```

### 2. Replace the path with a cleaner, already-centered SVG

The path data is a 1000-unit circle-arc scaled down by 0.025. Replace it with a native 24-unit path that's perfectly centered in a 24×24 viewBox with no inline transform. Example using a circle-stroke with dash-array:

```tsx
<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
  <circle
    cx="12"
    cy="12"
    r="9"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeDasharray="40 20"
  />
</svg>
```

This eliminates the sub-pixel scaling entirely — all coordinates are integers at render time.

### 3. Rotate via SVG's own `<animateTransform>`

SMIL animation runs inside the SVG rendering pipeline rather than via CSS layer compositing, which can sidestep the bug:

```tsx
<svg width="24" height="24" viewBox="0 0 24 24">
  <g>
    <path ... />
    <animateTransform
      attributeName="transform"
      type="rotate"
      from="0 12 12"
      to="360 12 12"
      dur="1s"
      repeatCount="indefinite"
    />
  </g>
</svg>
```

Note the `from="0 12 12"` / `to="360 12 12"` syntax — the `12 12` explicitly sets the rotation center in user units, bypassing `transform-origin` entirely.

### 4. Check DevTools in Safari

Open Safari Web Inspector → Layers panel on `/trace` while the spinner is active. If `.spinner-container` is **not** listed as a compositor layer, layer promotion is failing and you need to force it harder. If it IS a layer but still wobbles, the bug is in path geometry, not compositing.

### 5. Nuclear option: use a CSS-only spinner (no SVG)

Replace the SVG entirely with a CSS-drawn ring:

```css
.spinner-container {
  width: 24px;
  height: 24px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
```

CSS borders are drawn as pixel-perfect geometry, so there's no sub-pixel path to wobble.

## Current state

- Revert committed: `a75e070`
- All three `.spinner-container` rules back to original state
- Issue is not blocking — the spinner still visibly spins in Safari, it just wobbles cosmetically
- Worth fixing but low priority compared to functional bugs

## Files to touch when fixing

- `src/projects/trace/components/ui/tracenavbar.tsx` (main app spinner)
- `src/projects/trace/components/ui/tracebuttons.tsx` (both showcase button spinners)

All three should receive the same fix — whichever approach works, apply it uniformly.
