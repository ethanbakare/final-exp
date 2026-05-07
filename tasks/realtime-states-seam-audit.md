# Realtime-states seam audit

> Map of every place where two parts of the system shape the same outcome. For each seam: what each side promises, what each side expects, whether the contract is currently documented in code, and whether it's at risk.
>
> The Nebularr morph-collapse bug (commit `adc9208`) was a seam bug — a `useRef` init and a `useEffect` both wrote to `activeTauOverrideRef`, with no written precedence rule. This audit is the systematic version of that diagnostic, applied to every comparable seam in the editor + live page.
>
> Statuses:
>
> - **Documented** — the contract is written down in code (comments, types, or assertion). A reader editing either side will see it.
> - **Implicit** — the contract holds today but isn't written down. A future edit could break it without anyone noticing.
> - **Violated** — the contract is broken right now. Bug exists; may or may not be visible.
> - **Risky** — depends on framework/runtime behavior nobody on the team has internalized.

Files in scope:

- `src/projects/voiceinterface/realtime-states/{index,types,api,helpers,constants,controls}.{ts,tsx}`
- `src/projects/voiceinterface/components/{RealtimeBlob,NebularrBlob,CoralRealtimeBlob,VoiceRealtimeOpenAI,useLinkedProfileAnimator}.{ts,tsx}`

---

## 1. Multi-writer state and refs

### 1.1 `activeTauOverrideRef` — Tube animator settle-tau

**Location:** `realtime-states/index.tsx` editor child.

**Writers:**

1. `useRef` initial value (line ~211): seeds to `activeOrb.settings.talking.settleSpeed ?? activeOrb.settings.base.thickenSpeed` when Tube + skip-intro off. Else null.
2. Talking-exit `useEffect` (line ~365): when `prev !== state`, sets to `talking.settleSpeed ?? base.thickenSpeed` if exiting talking, else null.
3. `restartIntro` (line ~290): explicitly sets to `talking.settleSpeed ?? base.thickenSpeed` before bumping render to talking values.

**Reader:** animator RAF loop (line ~444): `tauSpeed = activeTauOverrideRef.current ?? target.thickenSpeed`.

**Contract (post-fix):**

- Writer 1 owns first-paint cascade: sets the override that the cascade-morph uses.
- Writer 2 only mutates on real state transitions (`prev !== state`). On first mount and StrictMode double-invocation, it short-circuits.
- Writer 3 owns explicit Replay action.
- Reader falls back to target.thickenSpeed when override is null.

**Status:** **Documented (post-fix).** Comment at writer 2 explicitly notes the short-circuit and why.

**Risk:** if a future edit removes the `if (prev === state) return` guard, the bug returns. If a profile with `base.thickenSpeed=0` and no `talking.settleSpeed` exists, the override fallback path produces tau=0.025. Defended: data fixture should include this case.

---

### 1.2 `previousStateRef` — Tube animator transition tracking

**Location:** `realtime-states/index.tsx` editor child.

**Writers:**

1. `useRef(state)` init: starts at `'idle'`.
2. Talking-exit `useEffect` (line ~376): assigns `state` after the override decision.

**Reader:** Talking-exit `useEffect` itself (`prev = previousStateRef.current`).

**Contract:** Single-effect ownership for mutations after init. Init seeds the "starting state" so the first transition is detectable.

**Status:** **Implicit.** No comment explains who owns it. The `useRef(state)` init is a naive seed that depends on `state`'s default being `'idle'`.

**Risk:** if `useState<PreviewState>('idle')` is changed to a different default, `previousStateRef`'s init must follow. Unwritten dep.

**Action item:** add a one-line comment at the useRef declaration: `// init must equal state's default — see talking-exit effect's prev/state diff logic`.

---

### 1.3 `lastTsRef` — animator dt tracking

**Location:** `realtime-states/index.tsx` editor child + `useLinkedProfileAnimator.ts`.

**Writers:**

1. `useRef(performance.now())` init: stamps mount time.
2. `restartIntro`: resets to `performance.now()` to avoid a giant first-frame dt after Replay.
3. Animator RAF loop: assigns `ts` each frame.

**Reader:** animator RAF loop (`dt = (ts - lastTsRef.current) / 1000`).

**Contract:** `dt` is clamped to `1/30` so a stale init or mount delay can't produce a multi-second delta. The clamp is the safety net; the resets are the optimization.

**Status:** **Documented at clamp site** (comment in the inline animator). **Implicit at writer #2** (restartIntro doesn't say "I reset this so first frame after Replay isn't huge").

**Risk:** future Replay-like actions might forget to reset `lastTsRef`. The clamp catches it but produces a 33ms first-frame jump, which can be visible at high tau.

**Action item:** docstring on `restartIntro` listing all the refs it resets and why.

---

### 1.4 `pulseRef` (thinking pulse) — multi-context writer

**Location:** `realtime-states/index.tsx` editor child + `useLinkedProfileAnimator.ts`.

**Writers:**

1. `useRef({ phase: 0, dir: 1 })` init.
2. `restartIntro`: resets to `{ phase: 0, dir: 1 }`.
3. Animator RAF loop while in `thinking` state: increments phase.
4. Animator RAF loop on every non-thinking frame: resets phase + dir.

**Reader:** animator RAF loop (uses phase to interpolate between base and thinking peak).

**Contract:** Pulse is 0..1 with direction. Reset whenever leaving thinking. Writer 4 ensures clean re-entry.

**Status:** **Documented.** Comments inline explain the reset.

**Risk:** low. Writer 4 guarantees correct state on re-entry regardless of how we got there.

---

### 1.5 `replayCounter` — Coral remount key

**Location:** `realtime-states/index.tsx` editor child.

**Writers:** `setReplayCounter` from Replay button onClick.
**Reader:** `coralResetKey = ${activeOrb.shader}-${replayCounter}` passed to `useEasedNumber`'s `resetKey`.

**Contract:** Bumping the counter triggers eased-hooks to snap to startValue and re-animate. Tied to `activeOrb.shader` so cross-shader switches also reset.

**Status:** **Documented.** Single-writer pattern; comment at the bump site.

**Risk:** low.

---

### 1.6 `coralActiveMorphSpeed` — direction-aware Coral morph speed

**Location:** `realtime-states/index.tsx` editor child + `CoralRealtimeBlob.tsx`.

**Writers:** `setCoralActiveMorphSpeed` from a state effect.
**Reader:** passed to `useEasedNumber`'s `duration`.

**Contract:** Updates only on talking-related transitions; uses talking.settleSpeed when leaving talking (mirror of Tube's `activeTauOverrideRef`).

**Status:** **Implicit.** The two parallel mechanisms (Tube tau-override and Coral morphSpeed-state) have the same intent but different shapes. Inconsistency is a future-edit hazard.

**Risk:** if someone "fixes" the Coral side to mirror the Tube side (or vice versa), they need to understand both. Currently no comment cross-references the two.

**Action item:** comment at one of them: `// Coral mirror of activeTauOverrideRef — see Tube animator. Different shape (state vs ref) because Coral uses useEasedNumber/useEasedColor which need duration as a value, not a ref.`

---

## 2. Lifecycle ordering seams

### 2.1 Lazy-init reads activeOrb prop at first child mount

**Location:** `realtime-states/index.tsx` editor child line ~162.

**Two sides:**

- **Parent**: gates child mount on `cascadeReady && activeOrb` being truthy. Promise: when the child first renders, `activeOrb` has the resolved profile.
- **Child**: `useState(() => seedFromActiveOrb)` reads activeOrb at first call.

**Contract:** Parent must NOT mount the child before cascade resolution. If it did, the lazy-init would seed from a stale/null profile and never re-init (lazy-init runs once).

**Status:** **Documented.** Parent comment explains the gate. Child comment explains the dependency.

**Risk:** the contract holds via the `if (!cascadeReady || !activeOrb)` early return in the parent. If anyone refactors the parent to render the child unconditionally with a placeholder activeOrb, the lazy-init silently captures the wrong profile.

**Action item:** strengthen the type. Currently `activeOrb: LoadedOrb` (non-nullable) in EditorProps but `activeOrb` in the parent is `LoadedOrb | null`. The cast at the prop boundary is implicit. Either propagate nullability or assert.

---

### 2.2 Effect declaration order = effect run order on mount

**Location:** `realtime-states/index.tsx` editor child lines ~313–451.

**Effects in declaration order:**

1. Audio data polling RAF.
2. Auto-loop interval setter.
3. Audio-active → setState('talking').
4. Leaving-thinking → clear thinkingPaused.
5. Talking-exit tau override.
6. Profile dropdown outside-click handler.
7. Animator RAF.
8. Audio cleanup on unmount.

**Contract (implicit):** the talking-exit effect (5) runs before the animator (7). On first mount, this matters: the override must be set before the first animator frame.

**Status:** **Risky.** Order is implicit. React guarantees declaration-order execution within a component, but a refactor that moves an effect or extracts it to a custom hook could break order without anyone noticing.

**Risk:** the post-fix talking-exit effect short-circuits when `prev === state`, so first-mount order doesn't matter anymore (override stays at useRef init). But this is a defensive structure, not an explicit contract.

**Action item:** add a section comment above the effects block: `// Effect declaration order matters: effects run in this order on mount. Specifically, the animator (#7) reads activeTauOverrideRef set by useRef init AND/OR the talking-exit effect (#5). Reordering these breaks first-paint cascade.`

---

### 2.3 React state-equality short-circuit (`setState` no-op)

**Location:** `restartIntro`, Replay button, throughout.

**Two sides:**

- React: `setState(sameValue)` is a no-op; effect deps don't fire.
- Code: `restartIntro` calls `setState('idle')` when state may already be `'idle'`.

**Contract (implicit):** Replay-from-idle relies on this no-op so the talking-exit effect doesn't re-fire and nullify the override `restartIntro` just set.

**Status:** **Risky.** The Nebularr browser-reload bug fingerprinted exactly this asymmetry — Replay worked because state was already idle, browser-reload broke because the cascade-mount fired the effect anyway. The fix to talking-exit's short-circuit (`prev === state`) closes this hole, but the dependency on state-equality short-circuiting is still implicit elsewhere.

**Risk:** any future code that does `setState(someValue)` expecting "if it doesn't change, nothing happens" is making a load-bearing assumption that may not hold under React 19 Concurrent or future schedulers.

**Action item:** memory entry on this trap. When relying on setState-noop semantics, document it explicitly: `// state may already be 'idle'; setState('idle') is a no-op so [thing] doesn't fire`.

---

### 2.4 StrictMode dev-mode double-invocation of effects

**Location:** every `useEffect` in the editor.

**Two sides:**

- React StrictMode (dev): mounts → runs effects → cleanup → re-runs effects. To detect non-idempotent setup.
- Code: most effects assume "I run once per mount."

**Contract (implicit):** all effects must be idempotent across this double-invocation.

**Status:** **Risky.** Audited so far:
- Talking-exit effect (post-fix): idempotent. Short-circuits when `prev === state`.
- `isFirstEditorRenderRef` guard pattern: NOT idempotent under StrictMode. First invocation flips the ref; second invocation sees `false` and runs the body. This is a real bug surface.

**Action item:** audit every `isFirstRef` pattern in the editor. Each must either (a) use `useEffect` with `[]` deps that's safe under double-invocation, or (b) use a guard pattern that's idempotent (e.g., compare against a value rather than mutate a flag).

Found instances (investigated):

- `isFirstEditorRenderRef` (line ~312): used to skip the post-mount `restartIntro` on first mount. Under StrictMode dev, the effect runs twice: first run flips ref to false and returns; second run sees `false` and calls `restartIntro`. **Benign in practice** — `restartIntro` on first paint is mostly a no-op because lazy-init already seeded render to talking values, state is already idle (so setState is a no-op), and the activeTauOverrideRef the second invocation sets matches the useRef init. But it's a smell: under prod (no StrictMode), this effect's "first mount" check works as intended; under dev, it's defeated. Production-only behavior for a guard intended to work universally is a code smell.
- `cascadeAppliedRef` (line ~1893, parent): used to ensure cascade applies once. Under StrictMode, the second effect setup runs while `tubeLoaded`/`coralLoaded` are still false, so it short-circuits before the ref-check matters. When fetch resolves and the effect re-runs (deps changed), it applies once and flips the ref. **Idempotent in practice** — applying the cascade twice with the same key/baseline produces the same result. Acceptable.

Recommendation: leave both alone; document the StrictMode interaction in a comment. The "fix" pattern of "compare against a value rather than mutate a flag" doesn't apply cleanly here because the values they're comparing aren't stable.

---

### 2.5 useState lazy-init runs once; props that change later don't reseed

**Location:** `realtime-states/index.tsx` line 162 (`render`) and line 1815 (`colorFormat`).

**Two sides:**

- React: `useState(initFn)` runs `initFn` only on first mount.
- Code: assumes activeOrb (or localStorage) has the right value at first call.

**Contract:** the dependency this lazy-init reads must be stable / correctly populated by the time of first call.

**Status:** **Documented at colorFormat** (comment notes the localStorage read is synchronous to avoid post-mount flash). **Implicit at render**.

**Risk:** the browser-cache-stale-fetch bug from earlier today (commit `19dc15a`) was exactly this class — fetch returned stale JSON without `skipIntroOnSelect`, so lazy-init seeded with the field undefined. The fix was on the fetch (`cache: 'no-store'`), not on the lazy-init. The lazy-init's dependency on its input being correct was never made explicit.

**Action item:** docstring on each `useState(() => ...)` lazy-init listing what it reads and what guarantees it depends on.

---

## 3. Cross-component prop boundary seams

### 3.1 `RealtimeBlob` dispatcher passes skipIntro through to inner blobs

**Two sides:**

- `VoiceRealtimeOpenAI` writes `skipIntro={activeOrb?.skipIntroOnSelect === true}`.
- `RealtimeBlob` accepts `skipIntro?: boolean`, threads to both `<NebularrBlob>` and `<CoralRealtimeBlob>`.

**Contract:** the field is per-active-orb; updates as activeOrb changes; inner blobs must honor on mount.

**Status:** **Documented.** Both type and prop comments explain.

**Risk:** if a future shader is added (third arm of RealtimeOrb), it must also consume `skipIntro` or the seam breaks silently. TypeScript enforces shape but not behavior — a new shader could accept the prop and ignore it.

---

### 3.2 Cross-shader = component-type swap = remount = intro replay

**Location:** `RealtimeBlob.tsx` dispatcher.

**Contract (implicit):** changing `orb.shader` between renders unmounts the inner blob (different React element type) and remounts the new one. This is the mechanism that produces the cross-shader intro animation.

**Status:** **Documented at the dispatcher** (header comment). **Implicit elsewhere** — code that depends on this mechanism (e.g., editor's cross-shader Coral mount) must understand it's relying on React's reconciler behavior.

**Risk:** if anyone wraps both branches in a single component (e.g., `<UnifiedBlob shader={shader}>`) for "cleanliness," the component-type-swap mechanism vanishes and cross-shader intros stop playing. Latent for that exact refactor.

---

### 3.3 LoadedOrb projection: source array → orbs useMemo → activeOrb

**Two sides:**

- **Source arrays** (`tubeProfiles`, `coralProfiles`): authoritative shapes from JSON.
- **`orbs` useMemo**: projects source arrays into `LoadedOrb[]`. Pass-through for optional fields.

**Contract:** the projection must include every field the rest of the editor reads from `activeOrb`. Optional fields must pass through unchanged (no normalization).

**Status:** **Documented at line ~1797 with a comment on `skipIntroOnSelect: p.skipIntroOnSelect`** noting "no normalization at projection time."

**Risk:** any new schema field added to `SavedProfile` must be added to BOTH places (parent's `orbs` useMemo + child's `orbs` useMemo, since they're duplicated — see 6.1). Forgetting either causes silent field-loss like the `skipIntroOnSelect` cache bug.

**Action item:** until the duplicated `orbs` useMemo is consolidated (open follow-up #6), add a TODO comment at both sites: `// SCHEMA: when adding a SavedProfile field, mirror the projection in both parent + child orbs useMemos.`

---

## 4. Animation seams (multiple uniforms / target sources)

### 4.1 `goal` prop vs `render.thickRadius` in Tube editor

**Location:** `realtime-states/index.tsx` editor canvas + `GentleOrbThicken.tsx`.

**Two sides:**

- Editor passes `goal={1}` (always — pinned high in editor).
- Editor passes `thickRadius={render.thickRadius}` (animated by JS animator, ranges 0.15..1.0).

**Contract:** goal=1 means the shader interpolates uniforms toward "thick" parameters. With `thickRadius` itself animated 0.15→1.0→0.15, the visible shape morphs through. The shader's internal `thickenRef` is essentially pinned to 1; the animation lives entirely in `thickRadius`.

**Status:** **Implicit.** The `goal={1}` choice is undocumented. If anyone changes it (e.g., `goal={state === 'talking' ? 0 : 1}` to mirror Coral), the entire morph mechanism shifts.

**Risk:** medium. The asymmetry between Tube (animate the value, pin the goal) and Coral (animate the goal, ease the value) is a deep architectural fact that lives in nobody's head documented form.

**Action item:** comment at the `<GentleOrbThicken goal={1}>` site: `// goal pinned to 1 — Tube animation lives in render.thickRadius, not in shader's internal thicken animator. See [comparison] for why this differs from Coral.`

---

### 4.2 NebularrBlob's local intro overlay vs the live-page animator

**Location:** `NebularrBlob.tsx` lines ~85–119.

**Two sides:**

- `useLinkedProfileAnimator(activeProfile, linkedState)` produces `animatorRender` over time.
- Local `introT` ramps 0→1 over `talking.settleSpeed` on mount.
- `display = skipIntro ? animatorOrBase : lerpRender(introTalking, animatorOrBase, introT)`.

**Contract:** with `skipIntro=false`, the local intro lerps over the animator output for the first ~1s after mount. With `skipIntro=true`, the local intro is bypassed.

**Status:** **Documented (post-skip-intro fix).**

**Risk:** the introT effect runs once on mount with empty deps. If activeProfile changes mid-flight, the captured tau (closed over at first mount) doesn't update. ESLint disabled with a comment. This is a known compromise.

---

### 4.3 CoralStoneMorph's internal morph (sphere↔torus) vs Coral eased props

**Location:** `CoralRealtimeBlob.tsx` lines ~344+.

**Two sides:**

- `CoralStoneMorph`'s internal `morphRef` initializes to 0 (sphere) on mount. With `goal={1}` (idle), it animates 0→1 over `morphSpeed` seconds.
- Eased props (scale, waveIntensity, color3) mount at startValue and ease to target.

**Contract:** when both are configured for "talking → idle intro," the geometric morph (0→1 = sphere→torus) and the prop morph (talking values → base values) play simultaneously.

**Status:** **Implicit.** No code comment explains the simultaneity. The `skipIntro` prop suppresses the prop morph but does NOT suppress the geometric morph (because morphRef's init is internal to CoralStoneMorph).

**Violated for `skipIntro=true` on Coral cross-shader mount.** When Coral remounts with `skipIntro=true`, eased props mount at base (no anim) BUT the geometric morph still plays. The orb visibly morphs 0→1 internally. Documented as a known limitation in earlier plan but not in the actual CoralRealtimeBlob code.

**Action item:** comment on `<CoralStoneMorph>` site explaining that `skipIntro` only suppresses prop morph, not geometric morph. Future fix: pass an `initialMorphRef` prop to CoralStoneMorph so we can seed it to 1 when `skipIntro` is true.

---

### 4.4 `thickenRef` (internal to GentleOrbThicken) vs editor's `thickenSpeed={0.05}`

**Location:** `GentleOrbThicken.tsx`.

**Two sides:**

- Component uses internal `thickenRef` to interpolate between thin and thick uniform sets, controlled by `goal` and `thickenSpeed`.
- Editor passes `thickenSpeed={0.05}` (very fast) so the internal animator pins quickly to whatever goal says.

**Contract:** because editor pins `goal=1` and `thickenSpeed=0.05`, the internal `thickenRef` converges to 1 in <100ms and stays there. All visible morphing comes from external `thickRadius` prop changes.

**Status:** **Implicit.** Magic numbers (`0.05`) without a comment.

**Action item:** named constant + comment at the editor canvas site.

---

## 5. Persistence + I/O seams

### 5.1 JSON schema vs typed `SavedProfile` interface

**Two sides:**

- JSON files (`realtime-state-profiles.json`, `realtime-coral-profiles.json`): authoritative storage.
- TypeScript types (`SavedProfile`, `SavedCoralProfile`): expectation of shape.

**Contract:** all fields in JSON are typed; optional fields use `field?: T`; reads default to safe values via `=== true`, `?? fallback`, etc.

**Status:** **Documented.** Reads use defensive patterns.

**Risk:** schema migration. Adding a required field to the type without migrating JSON breaks load. We've avoided this by making all new fields optional.

**Implicit rule:** "all new persisted fields must be optional." Not written down.

**Action item:** add a comment to `SavedProfile` interface: `// SCHEMA RULE: all new fields must be optional unless paired with a JSON migration. Reads use defensive patterns (=== true, ?? fallback) to handle the absent case.`

---

### 5.2 Browser fetch cache vs no-store

**Location:** `api.ts` + `VoiceRealtimeOpenAI.tsx`.

**Contract:** every fetch must use `cache: 'no-store'` because the JSON files mutate at runtime via the persist endpoint, and browser cache lacks invalidation signals from the server.

**Status:** **Documented (post-fix).** Comment at the first fetch site explains.

**Risk:** any new fetch site that forgets `cache: 'no-store'` will silently serve stale data (the bug we hit earlier today).

**Action item:** lint rule or codemod to enforce `cache: 'no-store'` on all fetches under `/api/studio-profiles`. Or: wrap fetches in a typed helper that always sets the option.

---

### 5.3 localStorage keys vs different consumers

**Two sides:**

- Editor: `realtime-states-active-orb-key`, `realtime-states-color-format`.
- Live page: `realtime-active-orb-key` (different prefix).

**Contract (implicit):** editor and live page have INDEPENDENT active-orb selections. Two keys, intentionally.

**Status:** **Implicit.** No code comment explains why the keys differ. A future "consistency" refactor could merge them and silently break the user experience (live page suddenly inherits editor selection).

**Action item:** comment at one of the two key strings: `// distinct from realtime-states-active-orb-key — editor and live page have independent selections by design.`

---

## 6. Duplication / drift hazards

### 6.1 `orbs` useMemo defined in BOTH parent and editor child

**Location:** `realtime-states/index.tsx` lines ~226 and ~1858.

**Contract:** both implementations must produce identical `LoadedOrb[]` shapes. Parent uses for activeOrb resolution; child uses for dropdown rendering.

**Status:** **Implicit.** Two copies, neither references the other. Both must be edited in lockstep.

**Risk:** any new field added to one but not the other causes silent drift. We hit this with `skipIntroOnSelect` (had to remember both).

**Action item:** open follow-up #6 in the handoff. Also: until fixed, add a comment at each: `// DUPLICATE: when editing this projection, update the matching one at line [N] (parent/child).`

---

### 6.2 Talking-exit tau-override pattern duplicated across editor + `useLinkedProfileAnimator`

**Two sites:**

- Editor inline animator + talking-exit effect.
- `useLinkedProfileAnimator` hook (used by NebularrBlob on the live page).

**Contract:** both should produce identical morph timing for the same profile data.

**Status:** **Implicit.** The Nebularr bug existed in the editor copy but NOT in the hook copy (the hook only fires on transitions, never on first mount with prev==='idle' to confuse it — because the hook is mounted by NebularrBlob at component creation, after profile prop is resolved, with the same lifecycle issue but a different overlay mechanism).

**Risk:** the two copies have diverged in subtle ways. A bug in one may not exist in the other. Documenting as "twin animators" doesn't fix the duplication.

**Action item:** medium-term refactor — extract a shared `useTubeAnimator` hook that both consumers use. Until then, comment at one: `// PARALLEL implementation in useLinkedProfileAnimator.ts. Bugs in either should be checked in both.`

---

## 7. Framework-behavior seams (the ones nobody internalizes)

### 7.1 React 18 StrictMode double-mount/double-invoke

Already covered in 2.4. The action item there (audit `isFirstRef` patterns) is the concrete next step.

### 7.2 `useEffect` cleanup vs unmount: cleanup runs on EVERY effect re-run, not just unmount

The Tube animator's cleanup `cancelAnimationFrame(raf)` is correct for both StrictMode re-run and real unmount. Most effects in this file have empty deps `[]` so the cleanup only runs on unmount, but a few have deps. Audit pending.

### 7.3 R3F + suspense + canvas mount timing

`<Canvas>` mounts the WebGL renderer asynchronously. The first render of `<GentleOrbThicken>` may happen before the GL context is ready. Mitigation: shader uniforms are tolerant of missing values.

**Status:** **Implicit.** Nobody on the team has internalized this. Mostly we get away with it because the first frame after canvas-ready is fast.

---

## 8. CSS / layout seams

### 8.1 `<style jsx>` vs Tailwind utility classes vs inline `style`

Mixed styling sources throughout. Specificity is implicit.

**Status:** **Risky.** A future Tailwind utility added to a node also styled by `<style jsx>` may win or lose unpredictably.

**Action item:** establish a convention. E.g., "always use Tailwind for layout, `<style jsx>` only for animations / gradients / things Tailwind can't do."

---

### 8.2 Bottom-bar fixed positioning + z-index stack

The bottom bar is `fixed bottom-0` with `z-40`. The sub-tab popover is `absolute bottom-full` with no explicit z-index.

**Status:** **Risky.** Nothing prevents another fixed-position element from claiming z-50 and overlapping.

**Action item:** define z-index tiers (5–9 for component-internal, 40 for editor chrome, 50 for modal dialogs, 60+ reserved). Document in CLAUDE.md or a styles README.

---

## Top action items (prioritized)

The following are concrete tasks that come out of this audit:

1. **Audit `isFirstRef` patterns under StrictMode** (item 2.4). May find latent bugs.
2. **Document Coral skipIntro caveat** (item 4.3) — geometric morph still plays. Either document or fix by passing `initialMorphRef`.
3. **Add cross-references between Tube and Coral animator implementations** (item 6.2) — comment-level today, refactor medium-term.
4. **Add SCHEMA-rule comment to SavedProfile** (item 5.1) — "new fields must be optional or paired with migration."
5. **Add fetch-cache rule to api.ts** (item 5.2) — comment + codemod or wrapper.
6. **Document state-equality short-circuit dependencies** (item 2.3) — add memory entry; comment at restartIntro.
7. **Strengthen activeOrb non-nullability at child boundary** (item 2.1).
8. **Define z-index tier convention** (item 8.2).

Items 1, 2, 3 are bug-prevention. Items 4–8 are documentation that prevents future drift.

---

## What this audit does NOT cover

- Performance characteristics (bundle size, frame timing distributions).
- Memory leaks (RAF cleanups, audio cleanup paths).
- Accessibility seams (ARIA + state changes).
- Internationalization (none currently — intentional).
- Network failure modes (fetch errors, CORS, etc.).
- Multi-tab synchronization (storage events, leader election).

Each is a category that could have its own seam audit. For the current bug class (Nebularr-style hidden interactions), this audit is the first pass.
