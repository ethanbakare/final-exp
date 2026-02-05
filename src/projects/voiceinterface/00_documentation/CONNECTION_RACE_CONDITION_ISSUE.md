---
title: Connection Race Condition Issue
created: 2026-02-05
status: documented
priority: low
related: [REALTIME_EVENT_SYSTEM_FIX.md]
summary: Quick start/stop causes WebRTC setRemoteDescription error. Recommended fix is adding a "connecting" state with loading animation.
---

# Connection Race Condition Issue

**Priority:** Low (rare edge case, not production-critical)

## The Problem

When a user clicks Start and then Stop quickly (within 1-2 seconds), a runtime error occurs:

```
InvalidStateError: Failed to execute 'setRemoteDescription' on 'RTCPeerConnection':
The RTCPeerConnection's signalingState is 'closed'.
```

This happens because `session.connect()` is an async operation that takes time (WebRTC negotiation), and calling `session.close()` mid-negotiation causes the error.

## Root Cause Analysis

### Timeline of Events

```
1. START clicked
   ├─ setIsConversationActive(true)     ← UI immediately shows "recording" state
   ├─ setAppState('listening')
   ├─ Create AudioContext, mic, analysers
   ├─ sessionRef.current = session       ← SESSION STORED BEFORE CONNECT
   ├─ await fetch() token                ← Network call
   └─ await session.connect()            ← WEBRTC NEGOTIATION (takes 1-2 seconds)
       └─ createOffer → setLocalDescription → setRemoteDescription...

2. STOP clicked (while connect() still running)
   ├─ sessionRef.current.close()         ← CLOSES CONNECTION MID-NEGOTIATION
   ├─ UI returns to idle
   └─ Error thrown: signalingState is 'closed'

3. catch block in handleStartConversation runs
   └─ Shows misleading error: "Failed to start conversation. Please check your microphone."
```

### Why It Happens

- The SDK doesn't have a "cancel connection" API
- Once `session.connect()` starts, calling `session.close()` mid-negotiation causes WebRTC to throw
- The session is stored in `sessionRef` BEFORE `connect()` is called, so Stop has something to close
- The error message is misleading because it's a catch-all for any error

## Solutions Considered

### Option A: Suppress the Error (Patch)

Detect cancellation errors and don't show error message.

**Pros:**
- Minimal code change
- Quick to implement

**Cons:**
- WebRTC negotiation still fails in background (wasteful)
- Masking symptom, not fixing cause
- Could mask real errors

### Option B: Disable Button During Connection (Recommended)

Add a `connecting` state with loading animation. Button disabled until connection completes.

```
State flow: IDLE → CONNECTING (dots animation) → LISTENING (stop button)
```

**Pros:**
- Prevents all race conditions
- Clear UX with visual feedback
- Simple state machine
- 1-2 second wait is acceptable with good feedback

**Cons:**
- User can't cancel during connection (acceptable trade-off)

### Option C: Cancellation Flag Pattern

Track connection state with refs, set cancel flag, check after connect completes.

**Pros:**
- User can cancel
- Clean eventual cleanup

**Cons:**
- Complex state management
- Fails on rapid clicking (Start → Stop → Start creates orphaned connections)
- Would need connection attempt IDs to handle properly

### Option D: Don't Store Session Until Connected

Only assign `sessionRef.current` AFTER `connect()` succeeds.

**Pros:**
- Simple logic change

**Cons:**
- Creates orphaned sessions if user cancels
- Memory leak potential

## Recommendation

**Option B** is the cleanest solution. It:
- Eliminates all race conditions
- Has clear, predictable UX
- Is simple to implement and maintain

The 1-2 second wait is acceptable with proper visual feedback (animated dots).

## Implementation Notes (for future)

When implementing Option B:

1. Add new AppState: `'connecting'`
2. Add connecting label: `'Connecting...'` to VoiceStateLabel
3. Create loading animation (three dots or spinner) for button
4. Disable button clicks during `connecting` state
5. Transition: `idle` → `connecting` → `listening`

## Files Affected

- `VoiceRealtimeOpenAI.tsx` - state management, button disabled logic
- `VoiceStateLabel.tsx` - add 'connecting' state
- `voicemorphingbuttons.tsx` - possibly add loading variant or disabled state

## Related Files

- `REALTIME_EVENT_SYSTEM_FIX.md` - WebRTC event system documentation
- SDK source: `node_modules/@openai/agents-realtime/dist/openaiRealtimeWebRtc.mjs`
