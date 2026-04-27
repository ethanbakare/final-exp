# Trace Clear Button — Dormant State Plan

Date: 2026-04-27
Status: Draft for review (no code changes yet)

## 1. Goal

Make the Trace `<ClearButton>` *visually present but visibly inert* when clearing isn't currently appropriate. Users should see the button exists, register that it's locked, and intuit what would unlock it — never click it and have nothing happen, never wonder where it went.

## 2. Problem

The `<ClearButton>` is currently active in every state. Specifically:

- It opens the "are you sure you want to clear?" modal even when there are zero entries (nothing to clear).
- It opens the modal even when the navbar is mid-recording, mid-image-upload, or mid-transcription, allowing the user to obliterate work that's still being processed.

Internally, the type interface already declares `disabled?: boolean` on `ClearButtonProps` (via `BaseButtonProps`). The component never honors it — `disabled` is never threaded into the `<button>` element, and there are no `:disabled` styles. The interface anticipates the feature; the implementation never finished.

## 3. Best-practice reasoning

Three industry patterns for "action that's currently inappropriate":

| Pattern | Visual answer | Right when… |
|---|---|---|
| **Hide entirely** | Action is absent from the DOM | Action is *meaningless* in the current state (nothing to copy, no item to share) |
| **Disable visually** | Same control, dimmed / `cursor: not-allowed` / no hover affordance | Action is *contextually relevant* but *temporarily locked* — users learn the feature exists and what unlocks it |
| **State-variant morph** | Same slot, different control per state | Control's *meaning* changes per state |

For the Trace clear button, **Pattern 2 (disable visually)** is correct because:

1. **Affordance preservation matters.** Hide-on-empty trains fresh users that the feature doesn't exist; hide-during-recording leaves mid-flow users wondering where the button went. A muted, visible button telegraphs *"this exists, you'll use it later, just not now."*
2. **The button's meaning is constant.** It's always "clear all entries." There's no second mode it morphs into — Pattern 3 doesn't fit.
3. **Layout stability.** TraceDemo portals the clear button to a fixed bottom-right corner of the showcase canvas. Hiding leaves a hole; disabling keeps the chrome stable.

## 4. ClipStream as reference

ClipStream solves an analogous concern in two different ways depending on action type:

- **Tertiary, conditional**: `showCopyText` on `OptionsDropDown` (`clipmenudropdown.tsx:135`) hides "Copy Text" when there's no transcribed text to copy. Derivation: `cliplist.tsx:527` → `showCopyText={status === null}`. One source of truth at the call site, propagated via prop. **Hide-when-irrelevant** because copy on a transcribing clip is *meaningless*.
- **Primary, in-flight**: `RecordNavBarVarMorphing` takes `navState` and `variant` props and morphs its visual contract per state. **State-variant morph** because the control's role changes.

Trace clear button is a third category (visible/dormant rather than hidden/morphed), but the *architectural shape* matches ClipStream: derive once at the source, propagate via prop. We're picking a different visual answer appropriate to the action.

## 5. The rule (single source of truth)

Inside `TraceCore`, derive once per render:

```ts
const isClearDisabled = entries.length === 0 || navbarState !== 'idle';
```

Both inputs are local state. No new state, no synchronization, no caches.

The condition reads as: *clearing is inappropriate when there's nothing to clear, OR when an active flow (recording / processing audio / processing image) is in progress.*

## 6. Visual treatment

The user direction: *"muted and barely visible if not in use, that way people know that they can't click it."*

Concrete CSS additions to `.clear-button` in `tracebuttons.tsx`:

| Property | Disabled value | Reason |
|---|---|---|
| `opacity` | `0.35` | "Barely visible." Reads as ghost / inert without becoming completely absent |
| `cursor` | `not-allowed` | OS-level hint that click won't do anything. Required because the browser default for `<button disabled>` is `cursor: default`, not `not-allowed` |
| Hover styles | suppressed under `:disabled` | No hover lift / no color shift |
| Transition | shared with enabled state | Smooth fade between active and dormant when state flips |

**Click-blocking strategy:** the native `<button disabled>` attribute (wired in §7.2) blocks click events at the DOM level — no `onClick` fires, no programmatic `.click()` triggers the handler. We deliberately do **not** also apply `pointer-events: none` because that would suppress hover events on the element, which means the `cursor: not-allowed` affordance would never be seen. `<button disabled>` alone is sufficient for click-blocking; the early-return in `requestClearAll` (§7.4) is the additional defense-in-depth layer.

Token note: the existing `--trace-btn-processing` (used by the `disabled` `ProcessingAudioButton` / `ProcessingImageButton`) is a *background* token for those processing pills, not directly applicable as a foreground/icon mute. We'll keep ClearButton's visual treatment custom (opacity-based) rather than borrowing the processing token — the processing buttons live in a different visual register (in-line content) than ClearButton (chrome).

## 7. Structural changes

Five edits, intended as **one commit** because they form a single coherent change. Splitting would create transient states where the type signature is updated but the consumers aren't, or vice versa.

### 7.1 `BaseButtonProps` already declares `disabled?: boolean`

[trace.types.ts:24-28](../../src/projects/trace/types/trace.types.ts:24). No changes needed. We're honoring this declared API surface.

### 7.2 `ClearButton` honors `disabled`

[tracebuttons.tsx:215-266](../../src/projects/trace/components/ui/tracebuttons.tsx:215). Two changes:

- Destructure `disabled = false` from props.
- Pass through to `<button disabled={disabled}>`.

### 7.3 `.clear-button` gets `:disabled` styles

Same file, in the `<style jsx>` block. Add the visual treatment from §6.

### 7.4 `TraceCore` derives `isClearDisabled` and propagates

[TraceCore.tsx](../../src/projects/trace/components/TraceCore.tsx). Three local edits:

- Derive `isClearDisabled` near where `groupedDays` and `grandTotal` are computed.
- Standalone render path (line 400): `<ClearButton disabled={isClearDisabled} onClick={requestClearAll} />`.
- `requestClearAll` (lines 297-307) gains an early-return as defense in depth: `if (isClearDisabled) return;`.

### 7.5 `renderClearButton` callback signature extended

[TraceCore.tsx:87](../../src/projects/trace/components/TraceCore.tsx:87). Single source of truth flows to TraceDemo through the same callback:

```ts
// Before
renderClearButton?: (requestClearAll: () => void) => React.ReactNode

// After
renderClearButton?: (requestClearAll: () => void, isDisabled: boolean) => React.ReactNode
```

The line that invokes the callback (line 397) passes the second arg. Consumers can legally ignore the second parameter (TypeScript permits arity-narrowing on callback types — `(req) => ...` satisfies `(req, isDisabled) => ...`), so this is a **convention reinforced by the type signature**, not an enforced guarantee. The benefit is that the disabled state is *available* to every render-path consumer through the same channel as the click handler — they can't accidentally compute it from a different source. Catching a consumer that forgets to wire `isDisabled` through to its `<ClearButton>` is a code-review concern, not something the type system will surface automatically.

### 7.6 `TraceDemo` consumes the disabled flag

[TraceDemo.tsx:76-83](../../src/projects/demo-showcase/components/demos/TraceDemo.tsx:76). The portal render reads the second arg and passes it through:

```tsx
renderClearButton={(requestClearAll, isDisabled) => (
  isVisible && canvasContentEl ? createPortal(
    <div className="showcase-clear-button">
      <ClearButton disabled={isDisabled} onClick={requestClearAll} />
    </div>,
    canvasContentEl,
  ) : null
)}
```

TraceDemo never independently computes the disabled state — it consumes it. No state duplication, no drift risk.

## 8. What doesn't change

- `TraceSim` (showcase auto-loop) — doesn't render `ClearButton` at all. No changes needed.
- The clear modal flow (`TraceClearExpensesModal`, `TraceModalOverlay`) — once the user does click an enabled clear button, the modal opens / confirms / clears entries exactly as today.
- localStorage behavior — `STORAGE_KEY` reads/writes are unchanged. The kill-switch path doesn't touch this and shouldn't.
- The existing `[DEMO-SHOWCASE]` ports — the porting note at the top of `TraceCore.tsx` doesn't need updating; this change is part of standalone Trace's normal contract, not a showcase-only addition.
- `BaseButtonProps`, `ClearButtonProps` — already declare `disabled?`. No type changes.

## 9. Acceptance criteria

The change is correct only if **all** of the following are true:

1. On standalone `/trace` with no entries, the clear button is visibly muted (opacity ~0.35), shows `cursor: not-allowed` on hover, and clicking it does nothing.
2. On standalone `/trace` mid-recording, mid-`processing_audio`, or mid-`processing_image`, the clear button is visibly muted, even if there are existing entries.
3. As soon as `navbarState` returns to `'idle'` AND `entries.length > 0`, the clear button visibly returns to active (full opacity, normal cursor, click opens the modal).
4. On the showcase TraceDemo (Try Demo mode), all three behaviors above hold identically — the portal-rendered button visually matches the standalone button's enabled and disabled states.
5. Toggling the demo↔sim mode mid-flow (kill-switch abort) leaves the clear button in a consistent state on return — i.e., `handleCancelRecording` resets `navbarState` to `'idle'`, so the button returns to `entries.length`-driven only.
6. No console errors. No layout shift when the button transitions between active and dormant.
7. TraceSim (auto-loop) renders unchanged — no clear button visible, sim loops as today.

## 10. Out of scope / non-goals

- **Don't add a disabled-state tooltip.** The user direction is "barely visible" — opacity + cursor is enough. Tooltips on a tertiary destructive action would be over-engineering.
- **Don't change `BaseButtonProps`.** It already declares `disabled?: boolean`. Don't add documentation comments to the interface — the meaning is obvious.
- **Don't apply this pattern to `UploadButton`, `SpeakButton`, `CloseButton`, `SendAudioButton` reflexively.** Those are governed by `TRNavbarV2`'s `state` prop which is its own state machine. They may have similar concerns but the structural answer is different (state-variant morph, per ClipStream `RecordNavBarVarMorphing`). Out of scope for this change.
- **Don't gate based on toast visibility.** The `showError` toast is non-blocking; navbarState returns to `'idle'` on error. Clear is correctly enabled while a toast is up.
- **Don't introduce a "first time you click on disabled, show a tooltip" UX.** Stop at "barely visible" until proven insufficient.

## 11. Risks / edge cases

| Risk | Mitigation |
|---|---|
| Future render path is added that mounts `ClearButton` without going through TraceCore | Type interface enforces `disabled?` is wireable; reviewer should catch in PR |
| Disabled button focused via keyboard tab still highlights | Browser handles `<button disabled>` skipping for tab order natively |
| Race condition: user clicks clear right as `navbarState` flips from `'idle'` to `'recording'` | `requestClearAll`'s early-return is the safety net. Visual disable happens within one frame of state change |
| Showcase abort signal aborts mid-modal-open | `handleCancelRecording` doesn't touch `showClearModal`. Modal stays open; user can still confirm or cancel. Acceptable — the in-flight async was the reason for blocking, not the modal itself |

## 12. Suggested commit message

```
feat(Trace): dormant ClearButton when nothing to clear or flow in flight

Honors the disabled prop already declared on BaseButtonProps. Single
source of truth in TraceCore: isClearDisabled = entries.length === 0
|| navbarState !== 'idle'. Propagates through the standalone render
path and through the renderClearButton callback (signature extended
to include the disabled flag) so TraceDemo's portal-rendered button
shares the same source.

Visual: opacity 0.35, cursor: not-allowed on :disabled. Click-blocking
via the native <button disabled> attribute; defense-in-depth early-
return in requestClearAll. TraceSim untouched.
```

## 13. Review checklist (for the human reviewer)

- [ ] Confirm visual values: opacity 0.35, cursor not-allowed, no tooltip
- [ ] Confirm both conditions (empty AND non-idle) — neither alone is sufficient
- [ ] Confirm single commit (not split)
- [ ] Confirm `renderClearButton` signature change is acceptable (extends, doesn't break standalone)
- [ ] Confirm scope: only ClearButton, not UploadButton/SpeakButton/SendAudioButton
- [ ] Confirm: no changes to TraceSim
