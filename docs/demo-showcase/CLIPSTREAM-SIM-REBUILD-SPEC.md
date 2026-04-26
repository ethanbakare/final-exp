# ClipStreamSim Rebuild Spec

Date: 2026-04-26  
Status: Draft implementation spec for rebuilding `ClipStreamSim` from scratch

This document replaces ad-hoc chat guidance with a concrete implementation reference for the `/demo-showcase` ClipStream simulation.

It exists because the current scripted `ClipStreamSim` rewrite drifted away from the real ClipStream orchestration model. The next pass should be built from the actual product contract, not from visual guesswork.

---

## 1. Goal

Build `src/projects/demo-showcase/components/simulations/ClipStreamSim.tsx` as a scripted preview of the real ClipStream flow:

1. Start on home, offline.
2. Trigger record.
3. Move to the record screen while the tray morphs into the recording state immediately.
4. Finish recording.
5. Show the offline pending clip row (`Clip 001`).
6. Come back online.
7. Spinner rotates while transcribing.
8. Transcript appears.
9. Return to home.
10. Open the triple-dot menu on the completed clip.
11. Delete the clip.
12. Reset and loop.

This is a simulation only. It must not run the real recording/transcription pipeline.

---

## 2. Source Of Truth

The rebuild must follow the real ClipStream component split:

- Orchestrator: [ClipMasterScreen.tsx](../../src/projects/clipperstream/components/ui/ClipMasterScreen.tsx)
- Home surface: [ClipHomeScreen.tsx](../../src/projects/clipperstream/components/ui/ClipHomeScreen.tsx)
- Record surface: [ClipRecordScreen.tsx](../../src/projects/clipperstream/components/ui/ClipRecordScreen.tsx)
- Pending row: [ClipOffline.tsx](../../src/projects/clipperstream/components/ui/ClipOffline.tsx)
- Record tray: [mainvarmorph.tsx](../../src/projects/clipperstream/components/ui/mainvarmorph.tsx)
- Product flow notes: [000_COMPLETE_APPLICATION_FLOW.md](../../src/projects/clipperstream/components/ui/000_COMPLETE_APPLICATION_FLOW.md)

The simulation should reuse those product components where practical, but it must preserve their real responsibilities.

---

## 3. Core Product Rules

These are the rules the simulation must respect.

### 3.1 The tray is persistent

In the real product, the bottom record tray is owned by `ClipMasterScreen` and persists across screen transitions.

It does **not** disappear when moving between home and record.

It only hides for search-related behavior.

### 3.2 Screen and tray are different axes of state

The real app has two separate concerns:

- `activeScreen`: whether the upper area is `home` or `record`
- `recordNavState`: the tray state

Those must remain separate in the simulation.

### 3.3 The record screen header already reflects network state

If the simulation starts offline, the record screen should already show offline when the user lands there.

There should not be a fake "switch to offline later" beat after the screen transition.

### 3.4 Record transition and tray morph happen together

When the user triggers recording:

- the app moves to the record screen
- the tray morphs into the recording state
- the waveform/timer begin

Those are one moment, not two separate phases with a lag between them.

### 3.5 Pending/transcribing/transcribed are content states above the tray

The upper record surface changes between:

- empty recording view
- offline pending row
- transcribing pending row
- transcribed text

The tray itself remains present and stable underneath.

---

## 4. What Went Wrong In The Current Rewrite

The current broken `ClipStreamSim` drifted from the product model in a few key ways:

1. It hides the tray when the sim enters home phases.
2. It reduces tray state to only `'record'` and `'recording'`, throwing away the actual tray contract.
3. It uses one broad phase flag to drive screen, tray, network, content, home list, menu, and delete behavior all at once.
4. It treats the tray like a child of the record screen instead of a persistent sibling under the screen container.
5. It mixes sizing changes with animation/state logic.

The rebuild should explicitly avoid all five mistakes.

---

## 5. Simulation State Model

Do not drive the sim from one loose visual phase string alone.

Use a full snapshot model for each scripted step:

```ts
type SimSnapshot = {
  screen: 'home' | 'record';
  trayState: 'record' | 'recording' | 'processing' | 'complete';
  trayVariant: 'morph' | 'fade';
  network: 'offline' | 'online';
  pendingClips: PendingClip[];
  selectedClip?: Clip;
  homeClips: Clip[];
  menuOpenClipId?: string;
  deletingClipId?: string;
  analyserActive: boolean;
};
```

This does not mean every field must always be meaningful. It means every rendered frame should come from a complete, explicit state description.

Do **not** keep a redundant `recordMode` field in the snapshot. `ClipRecordScreen` state should be derived at render time from `selectedClip` and `pendingClips`, mirroring the real `getRecordScreenState()` logic in `ClipMasterScreen`:

```ts
const recordScreenState =
  selectedClip?.content ? 'transcribed' :
  pendingClips.length > 0 ? 'offline' :
  'recording';
```

Do **not** keep toast visibility in the snapshot either. Toast visibility should be driven by a step-transition effect when entering the offline-pending step, not by a long-lived snapshot flag.

---

## 6. Loop Contract

The loop should be rebuilt as these scripted steps.

### Step 1: `idle-home-offline` — 1500ms

- `screen = 'home'`
- `trayState = 'record'`
- `trayVariant = 'morph'`
- `network = 'offline'`
- `homeClips = []`
- `pendingClips = []`
- `selectedClip = undefined`
- `analyserActive = false`

Purpose:
- establish the empty home state
- show offline context from the beginning
- confirm the loop starts from an empty home, not a pre-populated list

### Step 2: `go-to-record` — 200ms

- `screen = 'record'`
- `trayState = 'recording'`
- `trayVariant = 'morph'`
- `network = 'offline'`
- `analyserActive = true`

Purpose:
- record-screen transition and tray morph begin together

Implementation note:
- this step must update the entire snapshot in a single React state set
- do not issue separate sequential state updates for screen and tray
- the tray's own morph animation should overlap naturally with the screen slide transition

### Step 3: `recording` — 2800ms

Same snapshot as step 2, held for the recording duration.

Purpose:
- waveform moves
- timer advances

### Step 4: `done-offline-pending` — 3000ms

- `screen = 'record'`
- `trayState = 'record'`
- `trayVariant = 'morph'`
- `network = 'offline'`
- `pendingClips = [{ title: 'Clip 001', time: '0:03', status: 'waiting' }]`
- `analyserActive = false`

Purpose:
- recording is finished
- pending row appears
- toast is triggered on entry to this step by a small effect, not by a snapshot field

### Step 4.5: `online-still-waiting` — 700ms

- `screen = 'record'`
- `trayState = 'record'`
- `trayVariant = 'morph'`
- `network = 'online'`
- `pendingClips = [{ title: 'Clip 001', time: '0:03', status: 'waiting', isActiveRequest: false }]`
- `analyserActive = false`

Purpose:
- show the header/network indicator flip from offline to online
- keep the pending row in its waiting state very briefly before spinner motion begins

This step exists so the user can actually perceive:

1. offline
2. online
3. then transcribing

If online and spinner-start happen in one step boundary, they render together and the intended visual beat is lost.

### Step 5: `online-transcribing` — 1300ms

- `screen = 'record'`
- `trayState = 'record'`
- `trayVariant = 'morph'`
- `network = 'online'`
- `pendingClips = [{ title: 'Clip 001', time: '0:03', status: 'transcribing', isActiveRequest: true }]`

Purpose:
- spinner rotation begins only after the brief online-but-still-waiting step

### Step 6: `transcribed-read` — 3000ms

- `screen = 'record'`
- `network = 'online'`
- `pendingClips = []`
- `selectedClip = completed mock clip`
- `trayState = 'complete'`
- `trayVariant = 'fade'`

Reason:
- this matches the real product contract more closely than falling back to `'record'`
- once transcript content is present, the tray should present the post-result action layout rather than pretending the user is back at the idle record button

Purpose:
- show the transcript
- hold long enough for it to be read

### Step 7: `back-home` — 200ms

- `screen = 'home'`
- `trayState = 'record'`
- `trayVariant = 'fade'`
- `network = 'online'`
- `homeClips = [completed mock clip]`

Purpose:
- return to home with a completed clip now visible

### Step 7b: `home-settle` — 600ms

- `screen = 'home'`
- `trayState = 'record'`
- `trayVariant = 'fade'`
- `network = 'online'`
- `homeClips = [completed mock clip]`

Purpose:
- allow the home screen to settle briefly before opening the menu
- avoid making the menu-open beat feel glued directly to the slide transition

### Step 8: `menu-open` — 700ms

Same as step 7b, plus:

- `menuOpenClipId = completedClip.id`

Purpose:
- open the triple-dot dropdown

### Step 9: `delete` — 1100ms

Same as step 8, plus:

- `deletingClipId = completedClip.id`

Then clear the clip from the next step.

Purpose:
- run the existing delete fade-out behavior

Important:
- this duration must be at least as long as the home-screen delete fade timing, so the animation is not clipped
- the clip is removed by the reset step, where `homeClips = []` and `deletingClipId = undefined`

### Step 10: `reset`

Return to step 1.

### Total loop length

With the timings above, the loop is approximately 15.1 seconds.

Intentional note:
- step 9 ends online, and step 1 restarts offline
- that reset is deliberate because each loop tells a fresh "user is offline again" story
- do not insert a fake bridge step later just to preserve network continuity across loop boundaries unless the narrative itself changes

---

## 7. Sizing Rules

Behavior and sizing must be separated.

### 7.1 One behavior model

Desktop and mobile should use the same simulation logic.

### 7.2 Two presentation profiles

Desktop and mobile may differ in:

- outer scale
- shell height
- simulation-only tray height
- top/bottom spacing around the embedded card

They must **not** differ in:

- step ordering
- tray visibility rules
- screen switching logic
- network-status transitions

### 7.3 Mobile-specific simulation compaction

Mobile simulation may need:

- smaller shell height
- shorter simulation tray height
- tighter surrounding showcase chrome

That is acceptable, but it must be a presentation override only.

### 7.4 Dimensions must stay constant within a profile

Within a given presentation profile, shell dimensions and tray dimensions must be stable across every step.

That means:

- tray height stays constant within desktop
- tray height stays constant within mobile
- shell width stays constant within desktop
- shell width stays constant within mobile
- shell height stays constant within desktop
- shell height stays constant within mobile

Step transitions may change:

- upper screen content
- screen-slide position
- tray content/state

Step transitions must **not** change:

- tray height
- tray padding
- tray opacity
- shell width
- shell height

This rule exists specifically to make the previous "tray collapses away on home" mistake structurally impossible.

### 7.5 Aspect ratio note

The simulation shell is allowed to be deliberately squatter than a real phone if needed to fit the showcase carousel card.

That is a presentation choice, not a bug, as long as:

- desktop and mobile profiles are internally consistent
- the behavior model stays identical across profiles
- no one "fixes" the sim by changing aspect ratio logic in the middle of rebuilding the state machine

---

## 8. Reuse Policy

The rebuild should prefer reusing the real leaf components, but not blindly.

### Keep reusing

- `ClipHomeScreen`
- `ClipRecordScreen`
- `ClipOffline`
- `RecordNavBarVarMorphing`
- `ToastNotification`

### Keep using simulation-only control props already added

- `simulationOpenMenuForClipId`
- `simulationDeletingClipId`
- `forcedNetworkState`

These props are useful and aligned with the simulation need.

### Do not use

- `ClipMasterScreen`
- `useClipRecording`
- `useClipStore`
- `useAutoRetry`
- real `MediaRecorder`
- IndexedDB
- real transcription

The simulation must stay deterministic and side-effect free.

---

## 9. Acceptance Criteria

The rebuild is correct only if all of these are true.

1. The tray never vanishes during the home/record loop.
2. Record-screen transition and tray morph begin at the same moment.
3. The record screen already shows offline when entered.
4. After `Done`, the pending row appears as `Clip 001`.
5. The network indicator flips to online before the transcribing spinner phase is shown.
6. The transcript appears after the transcribing state, not before.
7. Returning home shows a completed clip before the menu/delete phase.
8. The menu opens on that completed clip.
9. Delete triggers the existing fade-out and removes the clip.
10. Desktop and mobile differ only in presentation size, not in behavior.

---

## 10. Implementation Plan

This is the concrete file-level plan for rebuilding `ClipStreamSim.tsx`.

### 10.1 Reset the current sim mentally

Do not preserve the current "broad phase drives everything" approach just because it already exists.

Keep the useful ideas only:

- scripted timing
- fake analyser
- simulation-only control props

### 10.2 Define explicit step types

Inside `ClipStreamSim.tsx`, define:

```ts
type SimStep = {
  id: string;
  durationMs: number;
  snapshot: SimSnapshot;
};
```

Build a fixed `SIM_STEPS` array.

### 10.3 Build stable mock clip factories

Add helpers for:

- `buildCompletedClip(loopId: number): Clip`
- `buildPendingClip(): PendingClip`
- `buildTranscribingPendingClip(): PendingClip`

The completed clip should have:

- a plausible finished title
- real transcript text
- `status: null`
- `currentView: 'formatted'`
- an ID with a `sim-` prefix to make accidental collisions with real store clips structurally unlikely

Important:
- `ClipRecordScreen` uses `useClipStore.updateClip()` internally to mark transcript animation as played
- the sim is not using Zustand for its own state, so those calls should be harmless no-ops
- the `sim-` prefix exists specifically to reduce any chance of colliding with a real clip ID and causing a phantom write

### 10.4 Replace broad phase derivation with current-step snapshot

Instead of deriving many things from:

- `phase === 'recording'`
- `screenIsHome`
- `dropdownOpen`

derive everything from:

- `const step = SIM_STEPS[currentStepIndex]`
- `const snapshot = step.snapshot`

### 10.5 Keep the tray mounted always

Render structure should follow the real `ClipMasterScreen` shape:

1. outer frame
2. `master-screen`
3. `screen-container`
4. home layer
5. record layer
6. persistent bottom tray
7. toast overlay

The tray should remain mounted below the screen container for every step.

Do not apply `hidden` based on `screen === 'home'`.

### 10.6 Drive only the active layer

The screen container should still slide between:

- home layer
- record layer

But only the upper layers should transition in/out. The tray should not be part of that slide logic.

### 10.7 Map snapshot to record-screen props

For the record screen:

- `state = selectedClip?.content ? 'transcribed' : pendingClips.length > 0 ? 'offline' : 'recording'`

Map:

- `selectedClip`
- `pendingClips`
- `forcedNetworkState`

directly from the snapshot.

### 10.8 Map snapshot to home-screen props

For the home screen:

- pass `homeClips`
- pass `simulationOpenMenuForClipId`
- pass `simulationDeletingClipId`

from the snapshot.

### 10.9 Map snapshot to tray props

For the tray:

- `navState = snapshot.trayState`
- `variant = snapshot.trayVariant`
- `audioAnalyser = fake analyser only when snapshot.analyserActive`

Do not invent separate timing rules outside the step table.

### 10.10 Toast handling

Toast visibility should be driven by a step-transition effect, not by a snapshot field.

Recommended behavior:

- when entering `done-offline-pending`, call `setToastVisible(true)`
- let `ToastNotification` dismiss itself via its existing duration
- when `onDismiss` fires, call `setToastVisible(false)`
- use the audio toast variant, whose default copy is "Audio saved for later", unless there is a deliberate reason to override the text
- make sure the toast duration is strictly less than step 4's `durationMs`; if uncertain, pass an explicit duration of `<= 1300ms`

Do not hold `toastVisible = true` for the full duration of the step in the snapshot. That can fight with `ToastNotification`'s internal auto-dismiss timing and cause a subtle re-show bug at the end of the step.

### 10.11 Timing engine

Use step index advancement:

- `currentStepIndex`
- timeout based on `SIM_STEPS[currentStepIndex].durationMs`
- wrap to step 0
- call `onLoopRestart` on reset

This should be simple and deterministic.

### 10.12 Fake analyser lifecycle

The fake analyser should not be created and destroyed on every small step boundary if that can be avoided.

Preferred direction:

- create it once for the sim lifetime
- drive motion only while the recording step is active
- silence or idle it in non-recording steps

If a simpler phase-bound lifecycle is temporarily kept, it must still clean up correctly on unmount and avoid rapid thrashing across adjacent steps.

### 10.13 Unmount / kill-switch behavior

`ClipStreamSim` does not need an external `cancelSignal`.

The expected behavior is:

- the showcase unmounts the sim when leaving the slot or switching modes
- all loop timers are cleared on unmount
- any local visual-only state is discarded naturally

This is enough for the simulation. Do not invent kill-switch plumbing for the sim side.

### 10.14 Styling pass

After behavior is correct:

1. verify desktop profile
2. verify mobile profile
3. tune simulation-only sizing

Do not do sizing work before behavior is correct.

---

## 11. Things To Avoid

Do not repeat these mistakes:

- hiding the tray on home
- using one `phase` string as the only source of truth
- letting mobile sizing changes alter the state machine
- faking network state transitions at the wrong moment
- making the tray morph happen after the screen switch instead of with it
- inventing visuals that contradict the product files
- introducing snapshot fields that can disagree with the data they are meant to describe

---

## 12. Recommended Order Of Work

1. Read the product files listed in §2.
2. Reconfirm tray behavior from `ClipMasterScreen`.
3. Replace the current sim state model with `SimSnapshot` + `SimStep`.
4. Rebuild the loop with tray always mounted.
5. Verify home ↔ record ↔ pending ↔ transcribed ↔ home.
6. Verify menu and delete.
7. Tune desktop presentation.
8. Tune mobile presentation.

---

## 13. Success Definition

The rebuild is successful when:

- the simulation feels like a simplified version of the real product
- no part of the tray behavior contradicts the real app
- offline → online → transcript → home → delete reads clearly at a glance
- mobile and desktop are both visually controlled without changing the logic
