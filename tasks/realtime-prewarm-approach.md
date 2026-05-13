# Realtime pre-warm approach — design doc

**Status:** designed, not implemented. Pin this for future use if/when the first-utterance-dropped issue becomes a real UX problem (currently testing-phase only).

**Related:** [`tasks/realtime-first-token-handoff.md`](./realtime-first-token-handoff.md) — diagnostic context, hypotheses, what was tried.

---

## 1 · Problem recap (one paragraph)

On `/voiceinterface/realtime`, the first 2-3 seconds of every fresh-reload utterance are dropped at the network layer, not at the SDK or our code. Confirmed by the "count 1→10, AI heard 3→10" test. Cause: `session.connect()` performs the SDP exchange + ICE + DTLS + data-channel open in 600 ms–2 s on a fresh page, and by design the Agents SDK does NOT transmit audio frames over the RTP track until `connect()` resolves. The Record click flips the UI to `listening` synchronously, but anything spoken in that window is captured by our local `AudioContext` (so the orb visualiser shows activity) and is never uploaded to OpenAI.

OpenAI's canonical UX is "wait for `session.created` → then enable the record button." We rejected the equivalent UX (`014f7af`, holding the orb at idle during connect) because the 1–2 s "Ready, when you are" hang felt wrong. Pre-warming sidesteps that trade-off: do the connect work *before* the user clicks, so click-to-listening is honestly instantaneous.

---

## 2 · The approach

Establish the WebRTC connection ahead of the Record click. By the time the user clicks, `session.connect()` has already resolved, the data channel is open, and the audio sender is negotiated. The synchronous `setAppState('listening')` is then truthful — audio reaches OpenAI within a few ms of click.

The current `handleStartConversation` does ten roughly-sequential things. The split is:

| Step | Currently runs on | After pre-warm runs on |
|---|---|---|
| Create `AudioContext`, resume it | click | warm trigger |
| `getUserMedia` (mic) | click | warm trigger |
| Build mic analyser | click | warm trigger |
| Create `<audio>` element + `playing` listener | click | warm trigger |
| Construct `OpenAIRealtimeWebRTC` + `RealtimeAgent` + `RealtimeSession` | click | warm trigger |
| `setupSessionEventListeners(session)` | click | warm trigger |
| Fetch token | click | warm trigger |
| `await session.connect({ apiKey })` | click | warm trigger |
| `setIsConversationActive(true)` + `setAppState('listening')` | click | **click only** |
| Start `audioPoll` interval | click | **click only** |

Everything except the state flip and the audio polling moves to warm time.

---

## 3 · Warm trigger — two viable variants

### 3a. Warm on hover (Record button mouseenter / pointerenter / focus)

Trigger when the mouse enters the Record button (or it receives keyboard focus). Typical hover-to-click latency is 200–800 ms in real use, which usually covers the WebRTC handshake before the click lands.

**Pros**
- Connection is only open when user has shown intent
- No connection burns on page abandonment
- Mic permission prompt isn't surprise-triggered on page load

**Cons**
- Very fast clickers (touch users, keyboard users hitting Enter, deliberate quick-tap) may still beat the warm
- Touch devices have no hover — fall back to a different trigger (touchstart with delay? first scroll? not great)
- Hover→click on a slow connection (3 G mobile) may still leave a small gap

**When to use:** desktop-first, demo / portfolio context with mostly mouse users.

### 3b. Warm on mount (or on first user gesture after mount)

Trigger immediately on page mount, gated on mic permission already being granted. If mic permission hasn't been granted yet, fall back to the current cold-start path (or wait for first user gesture, then warm).

**Pros**
- Connection ready well before any click — first click is always instant
- Predictable regardless of input device
- Simpler to reason about

**Cons**
- Burns OpenAI session minutes from the second the page loads, every load, whether the user records or not
- Without an idle-teardown timer this gets expensive fast in production
- AudioContext requires a user gesture to start in most browsers — mount-time gesture-less creation will create it in `suspended` state and silently fail until first interaction

**When to use:** testing phase (you're the only user, cost is negligible) or production with strict idle teardown + permission gating.

### Recommendation for our current state

**Warm on hover, idle-teardown after 3 s of no click**, with a quiet visual indicator on the Record button (see §4). For the testing phase this is overkill — but it's the production-shape pattern, so building it once means no migration later.

If we want strictly the simplest thing for testing: **warm on mount**, no visual, 3 s idle teardown. Same code path, different trigger.

---

## 4 · Visual indicator — how the user knows the connection is warm

You raised this concern directly. Three levels, pick one:

### 4a. No indicator (testing only)
Acceptable while you're the only user. The state is internal; you trust it because you wrote it.

### 4b. Subtle Record-button affordance
A faint ring, glow, or 1–2 px color shift on the Record button while warming, removed once `session.connect()` resolves. The button stays clickable throughout (clicking mid-warm queues the state flip; see §6 edge case 1). Read: "ready in a moment" vs "ready now," but never blocking.

### 4c. Explicit "Ready" pill
A small "Ready" or microphone-icon pill near the Record button that appears when warm. More legible, more cluttered. Probably overkill for this UI's aesthetic.

**Recommendation:** **4b**. Reuse one of the existing orb colors or the button's accent so it feels native. The orb itself stays at `idle` regardless of warm state — that was the explicit lesson from `014f7af`'s revert.

---

## 5 · Idle teardown

After warm completes, start a 3-second timer. If `setIsConversationActive(true)` isn't called within those 3 s, tear down:

- `session.close()` (or whatever the Agents SDK exposes for graceful disconnect)
- Close the `RTCPeerConnection`
- Stop the `MediaStreamTrack`s on the mic stream (releases the indicator)
- Close the `AudioContext`
- Remove the `<audio>` element
- Reset all refs

The timer resets on every Record-button hover/focus, so a user who hovers, decides not to click, and hovers again gets a fresh warm.

On hover/re-trigger after teardown, run the warm sequence again. The token endpoint is fast and the WebRTC handshake budget is the same as cold-start — there's no compounding cost.

For production, set the teardown to whatever your cost tolerance demands (30 s? 5 min?). The mechanism is the same.

---

## 6 · Edge cases

### Edge case 1: User clicks Record before warm completes
Two options:

**Option A — queue:** Don't flip `appState` until `session.connect()` resolves. Show a brief "warming" state on the Record button. This is essentially `014f7af` revisited, but only triggered for users faster than ~500 ms after hover, and visible on the button not the orb.

**Option B — fall through:** Honor the click immediately, flip to `listening`, accept that a fast-clicker eats some milliseconds. The window is much shorter than the cold-start case (warm has already been running for 100–500 ms by click time) so the audio loss is usually <500 ms instead of 2-3 s.

**Recommendation:** **A**, because (B) reintroduces the original bug for fast users. But (B) is acceptable for testing and simpler to ship first.

### Edge case 2: Mic permission not yet granted
Pre-warm requires `getUserMedia`. If permission is not yet granted, `getUserMedia` will prompt the user — surprise-prompting on hover is hostile. Fall back to current cold-start behaviour: don't warm, warm on click. After first grant, subsequent navigations can warm freely.

### Edge case 3: Page mounted but user doesn't interact for hours
With the 3 s teardown active and trigger-on-hover, no warm runs unless hovered. Safe by construction. With warm-on-mount, the 3 s teardown closes the connection long before idle becomes expensive.

### Edge case 4: Session times out before user clicks
OpenAI sessions have their own idle/max-duration timeouts. If a warm has been open longer than that, `session.connect()` may have failed/closed before the click. The teardown timer should fire first under normal conditions (3 s ≪ OpenAI's session timeouts), but if longer teardown is configured, listen for `disconnected`/`error` events on the session and re-warm transparently on next hover.

### Edge case 5: Tab backgrounded
Browsers throttle timers and may suspend `AudioContext` in backgrounded tabs. Listen for `document.visibilitychange`: if the tab is backgrounded with a warm open, tear it down. If it's foregrounded, do nothing — wait for the next hover.

### Edge case 6: Multiple realtime profiles pinned on the same page
Currently the page shows three profile thumbnails (Tube, Coral, one radial), each with a Record button. Warming on hover of *which* Record button is the user about to click is hard to predict. Two reasonable answers:
- Warm whichever button gets hovered first; tear down the previous warm if the user hovers a different button (no concurrent warms — one is enough since the underlying API connection is profile-agnostic).
- Warm a single connection shared across all profiles. The profile choice only affects the agent's `instructions` / voice config, which can be sent on the open session before triggering response.

The second is cleaner but requires confirming the SDK lets you update profile/instructions on an open session without dropping the connection. (`session.update` event exists on the API side; the SDK wrapper should expose it.)

For the current implementation that re-creates the session per profile click, the first answer suffices.

---

## 7 · Implementation sketch

In `VoiceRealtimeOpenAI.tsx`:

### Refactor `handleStartConversation` into three functions

```ts
// Pure setup. Idempotent. Safe to call before user intent.
async function warmConnection() {
  if (warmStateRef.current !== 'cold') return;
  warmStateRef.current = 'warming';
  setRecordButtonIndicator('warming'); // §4b

  // Steps 2-11 from current handleStartConversation:
  // AudioContext, getUserMedia, analysers, <audio>, transport,
  // agent, session, listeners, token, connect.
  // …
  await session.connect({ apiKey });

  warmStateRef.current = 'warm';
  setRecordButtonIndicator('warm');
  scheduleIdleTeardown();
}

// Public: called from Record button onPointerEnter / onFocus.
function handleRecordButtonHover() {
  clearIdleTeardown();
  warmConnection().catch(handleWarmFailure);
}

// Public: called from Record button onClick.
function handleStartConversation() {
  clearIdleTeardown();
  if (warmStateRef.current === 'warm') {
    flipToListening(); // synchronous, instant
  } else if (warmStateRef.current === 'warming') {
    queueListeningOnWarm(); // edge case 1, option A
  } else {
    // cold path — warm wasn't triggered (touch user, permission not granted)
    warmConnection().then(flipToListening).catch(handleColdFailure);
  }
}
```

### State refs

```ts
const warmStateRef = useRef<'cold' | 'warming' | 'warm'>('cold');
const teardownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const queuedListeningRef = useRef(false);
```

### Idle teardown

```ts
const IDLE_TEARDOWN_MS = 3000;

function scheduleIdleTeardown() {
  clearIdleTeardown();
  teardownTimerRef.current = setTimeout(teardownWarmConnection, IDLE_TEARDOWN_MS);
}
function clearIdleTeardown() {
  if (teardownTimerRef.current) {
    clearTimeout(teardownTimerRef.current);
    teardownTimerRef.current = null;
  }
}
async function teardownWarmConnection() {
  if (warmStateRef.current !== 'warm') return;
  // session.close() / pc.close() / mic.stop() / ctx.close() / audioEl.remove()
  warmStateRef.current = 'cold';
  setRecordButtonIndicator('cold');
}
```

### Flip-to-listening (formerly the head of `handleStartConversation`)

```ts
function flipToListening() {
  setIsConversationActive(true);
  setAppState('listening');
  startAudioPollInterval();
}
```

### Failure handling
- `warmConnection` failure (token fetch fails, `connect` rejects): clear `warming` state, log, fall back to cold-start on next click.
- During `warming`, if click arrives and `queueListeningOnWarm` is set, the warm's `.then` calls `flipToListening` instead of `scheduleIdleTeardown`.

### Visibility / unmount cleanup
- `useEffect` on mount: `document.addEventListener('visibilitychange', onHide)` → tear down if hidden.
- `useEffect` cleanup on unmount: tear down unconditionally.

---

## 8 · Cost / production considerations

A single warm session that gets torn down after 3 s of no click costs ~3 s of OpenAI session time per Record-button hover. With realistic hover rates (most hovers lead to a click) and the 3 s timeout, the marginal cost is small.

Production guardrails to consider before shipping wider than the demo:
- Per-user-per-page-load warm cap (don't allow infinite re-warm if the user is hovering the button without clicking — debounce, or require a click to re-warm after N attempts)
- Server-side ephemeral token rate-limiting (already gated by `/api/voice-interface/openai-realtime-token` — verify it rate-limits per IP / session)
- Telemetry: warm count vs click-through count, so you can see if hover-to-click conversion is high enough to justify the warm cost

For the current testing scope none of this matters.

---

## 9 · Testing plan

When this is implemented:

1. **Smoke:** load page, hover Record without clicking, wait 4 s — verify mic indicator disappears (teardown fired).
2. **Happy path:** load page, hover Record (200+ ms), click — verify "1, 2, 3" is heard from "1." `[TIMING +N ms]` logs should show `session.connect` resolved *before* click.
3. **Fast click:** load page, click Record without hovering first — verify cold-start path runs, audio still works but first utterance may clip. Acceptable fallback.
4. **Re-record:** complete a conversation, click Record again — verify the connection was re-warmed or kept (depending on chosen flow) and audio is captured from the start.
5. **Permission denied:** revoke mic, load page, hover Record — verify no surprise prompt; click Record — verify normal cold-start prompt flow works.
6. **Tab backgrounded:** warm a connection, switch tabs for 5 s, switch back, click Record — verify warm was torn down and a fresh warm/cold runs.
7. **Multi-profile:** hover one profile's Record, then hover another's without clicking — verify only one warm is open at a time.

---

## 10 · Open decisions to make at implementation time

These are deliberately deferred — note them now so they don't get lost:

- **Variant (§3):** warm on hover, warm on mount, or both with a feature flag?
- **Visual indicator (§4):** which of 4a/4b/4c? If 4b, what's the visual treatment?
- **Edge case 1 (§6):** queue (Option A) or fall through (Option B) for click-before-warm-completes?
- **Multi-profile (§6 edge case 6):** per-profile warm (current model) or single shared session?
- **Teardown timeout:** 3 s for testing; what for production?
- **Re-warm trigger after teardown:** hover only, or also focus / keyboard nav?

---

## 11 · Why we're not doing this now

User is still in testing. The first-utterance drop is annoying but not blocking. The current diagnostic logs (`5ff985e`) are enough to confirm the diagnosis. This doc exists so when we decide to fix it for real (production demo, public link, etc.) we have the plan and don't need to rediscover the architecture.

Implementation entry point when the time comes: this doc + [`realtime-first-token-handoff.md`](./realtime-first-token-handoff.md) + the timing-log output from a fresh-reload conversation.
