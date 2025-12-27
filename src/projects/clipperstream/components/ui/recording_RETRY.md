# ClipStream: Final Retry Behavior & Icon States

---

## Retry Pattern

### **3 Immediate Attempts, Then Interval-Based Retries**

**Attempts 1-3: Rapid fire (no waits between)**
```
Attempt 1 → 60s timeout → Fails
Attempt 2 → 60s timeout → Fails
Attempt 3 → 60s timeout → Fails

Total: ~3 minutes of continuous attempts
```

**Attempts 4+: Wait intervals (cycle repeats)**
```
Wait 1 minute → Attempt 4 (60s timeout)
Wait 2 minutes → Attempt 5 (60s timeout)
Wait 4 minutes → Attempt 6 (60s timeout)
Wait 5 minutes → Attempt 7 (60s timeout)

Cycle repeats:
Wait 1 minute → Attempt 8
Wait 2 minutes → Attempt 9
Wait 4 minutes → Attempt 10
Wait 5 minutes → Attempt 11
...continues indefinitely
```

---

## Icon States

### **Single Icon Color: Gray Throughout**

**No white icon. Always gray icon. Only spinning state changes.**

**Two icon states:**
1. **Gray spinning** - Actively making HTTP request
2. **Gray not spinning** - Waiting between attempts (or offline)

---

## Detail View (Inside Clip)

### **States**

**Offline / Not attempted yet:**
```
Recording 1               0:26  ⟳
                              (gray, not spinning)
```

**Actively attempting (HTTP request in progress):**
```
Recording 1               0:26  ⟳
                              (gray, spinning)
```

**Waiting between attempts:**
```
Recording 1               0:26  ⟳
                              (gray, not spinning)
```

**Success:**
```
Text appears
Recording indicator disappears
```

### **User Interaction**

**Tap anywhere on recording row:**
- If not spinning (waiting) → Skip wait, force immediate retry
- Icon starts spinning (new attempt)
- If spinning (active attempt) → No action needed, already trying

---

## List View (Home Screen)

### **Three States**

**1. Waiting to transcribe (not started):**
```
┌────────────────────────────────────┐
│ Clip Title                         │
│ Date          ⟳ Waiting to transcribe│
└────────────────────────────────────┘
Icon: Gray, not spinning
Shows when: Recording saved, no transcription attempts yet
```

**2. Transcribing (in progress):**
```
┌────────────────────────────────────┐
│ Clip Title                         │
│ Date          ⟳ Transcribing...    │
└────────────────────────────────────┘
Icon: Gray, can be spinning OR not spinning
Shows when: At least 1 attempt has been made (hasn't succeeded yet)
```

**Icon behavior within "Transcribing" state:**
- Gray spinning = Actively making HTTP request (attempts 1-3, or any active attempt)
- Gray not spinning = Waiting between attempts (1min, 2min, 4min, 5min waits)

**3. Transcribed (success):**
```
┌────────────────────────────────────┐
│ Clip Title                         │
│ Date                               │
│ Preview of transcribed text...     │
└────────────────────────────────────┘
No icon, no status text
Shows when: Transcription completed successfully
```

---

## State Transitions

### **From "Waiting to transcribe" to "Transcribing"**

**Trigger:** First transcription attempt starts (attempt 1)

```
Before:
Clip Title        ⟳ Waiting to transcribe
                  (gray, not spinning)

After:
Clip Title        ⟳ Transcribing...
                  (gray, spinning - attempt 1 active)
```

**This transition happens ONCE per recording. Once it shows "Transcribing", it never goes back to "Waiting to transcribe".**

---

### **Icon Changes Within "Transcribing" State**

**Text stays "Transcribing..." but icon changes:**

**During attempts 1-3 (continuous spinning):**
```
Clip Title        ⟳ Transcribing...
                  (gray, spinning for ~3 minutes)
```

**After 3 failures, during 1-minute wait:**
```
Clip Title        ⟳ Transcribing...
                  (gray, NOT spinning)
```

**During attempt 4:**
```
Clip Title        ⟳ Transcribing...
                  (gray, spinning)
```

**During 2-minute wait:**
```
Clip Title        ⟳ Transcribing...
                  (gray, NOT spinning)
```

**Pattern continues...**

---

## Implementation Requirements

### **New State for ClipList.tsx**

**Current states:**
1. `waiting` - "Waiting to transcribe" (gray, not spinning)
2. `transcribing` - "Transcribing..." (gray, spinning)
3. `success` - Show transcribed text

**Need to add:**
4. `transcribing_paused` - "Transcribing..." (gray, NOT spinning)

**Or simpler approach:**

**State structure:**
```javascript
{
  status: 'waiting' | 'transcribing' | 'transcribed',
  isActiveRequest: boolean  // true = spinning, false = not spinning
}
```

**Rendering logic:**
```javascript
if (status === 'waiting') {
  text = "Waiting to transcribe"
  icon = gray, not spinning
}

if (status === 'transcribing') {
  text = "Transcribing..."
  icon = gray, isActiveRequest ? spinning : not spinning
}

if (status === 'transcribed') {
  // Show transcribed text
}
```

---

## Summary

### **Key Points:**

1. **3 immediate attempts** (no waits), then **interval-based retries** (1min, 2min, 4min, 5min cycle)

2. **Detail view (inside clip):**
   - Icon spins when actively making HTTP request
   - Icon stops spinning during wait periods
   - User can tap to skip wait and force immediate retry

3. **List view (home screen):**
   - Shows "Transcribing..." once attempt 1 starts
   - Never switches back to "Waiting to transcribe"
   - Icon can spin or not spin within "Transcribing" state
   - Spinning = active request, not spinning = waiting between attempts

4. **Icon color:**
   - Always gray (no white)
   - Only spinning state changes (spinning vs not spinning)

5. **ClipList.tsx needs:**
   - New state or flag to distinguish "transcribing with active request" vs "transcribing but waiting"
   - This controls icon animation (spinning vs not spinning)

---

**End of Document**