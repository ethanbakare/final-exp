
State 5: Online + Bad Network (REQUEST FAILS)
User online → Starts transcription → Network timeout/error → Request definitively fails
What happens:

User shows as "online"
But transcription request failed (timeout, 500 error, rate limit, etc.)
System won't auto-retry because user is "online"

Retry needed? YES. This is the ONLY case where manual retry makes sense.
Why: User is online, but request failed. Won't auto-retry via offline→online mechanism.

The Key Question: Can You Detect State 5?
When does a transcription definitively FAIL (not just "waiting")?
Failed = One of these:

Network timeout (request took too long, gave up)
Server error (500, 503, API down)
Rate limit (too many requests)
Invalid audio (file corrupted, format rejected)
Auth failure (API key expired, etc.)

Waiting ≠ Failed:

If user is offline, it's "waiting" (not failed)
Auto-retry happens when online
No manual retry needed


When to Show Retry Button
ONLY show retry button when:

User is currently ONLINE (not offline)
Transcription request was attempted
Request definitively failed (timeout, error response, etc.)

Example failure detection:
javascriptasync function transcribeAudio(audioFile) {
  try {
    const response = await fetch('/api/transcribe', {
      method: 'POST',
      body: audioFile,
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });
    
    if (!response.ok) {
      // Server error (4xx, 5xx)
      return { status: 'failed', error: response.status };
    }
    
    const result = await response.json();
    return { status: 'success', text: result.text };
    
  } catch (error) {
    if (error.name === 'TimeoutError') {
      // Network timeout
      return { status: 'failed', error: 'timeout' };
    }
    // Network error, server unreachable, etc.
    return { status: 'failed', error: error.message };
  }
}
```

**If status = 'failed' AND user is online → Show retry button**

---

## Recommended UI States

### **While Offline (Recording Saved):**
```
Recording 1               0:26  ⟳
                              (gray, not spinning)
```
**No retry button.** Just waiting indicator. Auto-retries when online.

---

### **When Online (Auto-Retry in Progress):**
```
Recording 1               0:26  ⟳
                              (white, spinning)
```
**No retry button.** Transcription actively happening.

---

### **When Online + Failed:**
```
Recording 2          ⚠ Failed   [⟳ Retry]
                                (red button)
```
**Show retry button.** User is online, but request failed. Won't auto-retry.

---

## Your Specific Question: Do You Need Retry at All?

**Answer: Only if you can distinguish between "waiting" and "failed."**

**If you CAN'T reliably detect failures:**
- Skip retry button entirely
- Just show spinning icon (user is online = keep trying in background)
- Simpler, less UI states

**If you CAN detect failures:**
- Show retry button for definitive failures
- Prevents user waiting forever for something that already failed
- Better UX (user knows it failed, can take action)

---

## My Recommendation

### **For MVP: Skip explicit "failed" state unless you have clear failure detection.**

**Why:**
- Most "failures" are actually "waiting for online" (already handled)
- True failures (timeout, server error) are rare
- If they happen, spinning icon will keep trying in background
- Adding retry button adds complexity for edge case

**Simpler approach:**
```
Offline: Gray spinning icon + "Will transcribe when online"
Online attempting: White spinning icon
Success: Text appears
No explicit "failed" state. If transcription hangs, user can:

Wait (system keeps trying)
Delete recording and re-record
Check network and wait


Post-MVP: Add retry if users report stuck transcriptions
If you see logs showing:

Frequent timeout errors
Server errors
Users with recordings that never transcribe

Then add explicit failure detection + retry button.

Direct Answer
Q: Do we need a retry button?
A: Only if you can reliably detect when transcription has definitively FAILED (not just waiting).
If you CAN detect failures:

Show retry button when: User online + transcription failed
Don't show for: Offline recordings (they auto-retry)
