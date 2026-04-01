# 🧪 VPN + Whisper Compatibility Test

**Date**: January 3, 2026  
**Status**: ⚠️ READY TO TEST - MANUAL STEPS REQUIRED

---

## ✅ Test Setup Complete

The following files have been temporarily modified for VPN testing:

1. ✅ **Created**: `/src/projects/clipperstream/api/whisperProvider.ts`
   - Full Whisper API implementation
   - Server-side only (secure)

2. ✅ **Modified**: `/src/pages/api/clipperstream/transcribe.ts`
   - Added Whisper provider import
   - Added provider parameter parsing
   - Routes to Whisper when `provider === 'whisper'`

3. ✅ **Modified**: `/src/projects/clipperstream/hooks/useClipRecording.ts`
   - Forces `provider: 'whisper'` in FormData
   - Logs test indicator: "🧪 VPN TEST: Forcing Whisper provider"

---

## 📋 TEST PROCEDURE (30 minutes)

### Prerequisites

1. **Ensure VPN is installed and configured**
2. **Ensure OpenAI API key is set** in `.env.local`:
   ```bash
   OPENAI_API_KEY=sk-...your-key...
   ```
3. **Start dev server**:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

---

### Step 1: Go Offline

1. **Enable airplane mode** on your device
2. Verify you're offline (try loading a website)

---

### Step 2: Record Audio Clip

1. Navigate to the ClipperStream app in your browser
2. Click the **Record** button
3. **Speak for 5 seconds**: "Testing Whisper with VPN enabled"
4. Click **Done**
5. **Expected**: Audio is saved to IndexedDB as pending clip

---

### Step 3: Go Online with VPN

1. **Disable airplane mode**
2. **Keep VPN ON** (this is critical!)
3. Verify internet is working (but through VPN)

---

### Step 4: Wait for Auto-Retry

1. **Watch the terminal** where dev server is running
2. Auto-retry should trigger within a few seconds
3. **Look for these logs**:

```bash
🧪 VPN TEST: Forcing Whisper provider
[API] Using Whisper provider (VPN test)
[Whisper] Starting transcription
```

---

### Step 5: Observe Results

**Watch for one of two outcomes:**

#### ✅ Scenario A: Whisper Succeeds (GOOD NEWS)

**Terminal logs will show:**
```bash
[Whisper] Starting transcription
[Whisper] Transcription completed
Transcription successful
```

**In the UI:**
- Pending clip should update with transcript
- Text should appear: "Testing Whisper with VPN enabled"

**ACTION**: 
- ✅ **PROCEED with full v1.40 implementation**
- Whisper fallback strategy is viable
- Continue to Phase 1 (Circuit Breaker)

---

#### ❌ Scenario B: Whisper Fails (BAD NEWS)

**Terminal logs will show:**
```bash
[Whisper] Starting transcription
[Whisper] Transcription failed
Error: Cannot reach OpenAI API
```

**Or:**
```bash
ENOTFOUND api.openai.com
DNS resolution failed
```

**ACTION**:
- ❌ **STOP implementation** - Fallback strategy won't work
- **Inform user**: "Both Deepgram and Whisper fail with VPN. Please disable VPN for transcription to work."
- **DO NOT** implement circuit breaker (waste of 3 hours)
- **Consider alternative**: Show VPN warning toast instead

---

## 🔄 After Test: Cleanup

**Once you've determined the outcome, you MUST revert the temporary changes:**

### If Test Passed (Scenario A) ✅

**Do NOT clean up yet** - these files will be replaced during full implementation:
- whisperProvider.ts will be kept (already correct)
- transcribe.ts will be replaced in Phase 3
- useClipRecording.ts will be replaced in Phase 2

**Proceed to Phase 1** of v1.40 implementation.

---

### If Test Failed (Scenario B) ❌

**Clean up immediately**:

1. **Delete** `/src/projects/clipperstream/api/whisperProvider.ts`
   ```bash
   git rm src/projects/clipperstream/api/whisperProvider.ts
   ```

2. **Revert** `/src/pages/api/clipperstream/transcribe.ts`
   ```bash
   git checkout src/pages/api/clipperstream/transcribe.ts
   ```

3. **Revert** `/src/projects/clipperstream/hooks/useClipRecording.ts`
   ```bash
   git checkout src/projects/clipperstream/hooks/useClipRecording.ts
   ```

4. **Inform user** of VPN limitation
5. **Do NOT proceed** with circuit breaker implementation

---

## 🎯 Decision Point

**STOP HERE** and wait for test results.

- ✅ **If Whisper succeeds** → Continue to Phase 1 of v1.40
- ❌ **If Whisper fails** → Stop, clean up, inform user

---

## 📝 Expected Outcome

We **expect** Whisper to succeed because:
- OpenAI has robust global DNS infrastructure
- OpenAI CDN is less affected by VPN routing than Deepgram
- OpenAI's API is designed for global access

But if it doesn't, we need to know **NOW** before investing 3 hours in circuit breaker implementation.

---

**END OF TEST INSTRUCTIONS**

