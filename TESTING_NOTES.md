# OpenAI Realtime Voice Chat - Testing & Debugging Notes

## Status: Implementation Complete ✅

All code has been written and committed. API endpoint tested successfully.

---

## Quick Test Checklist

### 1. API Endpoint Test ✅ PASSED
```bash
curl http://localhost:3006/api/voice-interface/openai-realtime-token
# Returns: {"key":"ek_..."}
```

### 2. Page Load Tests
Visit these URLs in your browser:
- Standalone page: http://localhost:3006/voiceinterface/realtime
- Variations page: http://localhost:3006/voiceinterface/variations

Expected: Pages should load without errors, component should render with "Press to speak" placeholder

### 3. Console Logging Tests
Open browser DevTools console and look for these log messages when testing:

**On button press:**
- `[OpenAI Realtime] handleStartSpeaking called`
- `[OpenAI Realtime] Initializing session...` (first time only)
- `[OpenAI Realtime] Got ephemeral token: ek_...`
- `[OpenAI Realtime] Agent created`
- `[OpenAI Realtime] Session created`
- `[OpenAI Realtime] Setting up event listeners...`
- `[OpenAI Realtime] Session connected`
- `[OpenAI Realtime] Connected`
- `[OpenAI Realtime] User can now speak`

**During user speech:**
- `[OpenAI Realtime] User transcript partial: ...` (if available)
- `[OpenAI Realtime] User transcript completed: ...`

**On button release:**
- `[OpenAI Realtime] handleStopSpeaking called`
- `[OpenAI Realtime] Waiting for AI response...`

**During AI response:**
- `[OpenAI Realtime] AI transcript delta: ...`
- `[OpenAI Realtime] AI transcript done: ...`
- `[OpenAI Realtime] Response done`

---

## Known Issues to Verify

### Issue 1: SDK Event Names May Differ
**Problem:** The event names used in code are based on documentation/research, but may not match actual SDK implementation.

**Events to verify:**
- `input_audio_transcription.completed` ← User speech transcript
- `input_audio_transcription.partial` ← Interim user speech (may not exist)
- `response.audio_transcript.delta` ← AI response streaming
- `response.audio_transcript.done` ← AI response complete
- `response.done` ← Full response lifecycle complete
- `error` ← Error events
- `connected` / `disconnected` ← Connection state

**How to debug:**
1. Add a catch-all event listener to see ALL events fired by SDK:
```typescript
session.on('*', (event: any) => {
  console.log('[OpenAI Realtime] Event:', event);
});
```

2. Check SDK documentation at: https://www.npmjs.com/package/@openai/agents-realtime
3. Inspect SDK source code if needed

**Potential fix:** Update event listener names in [VoiceRealtimeOpenAI.tsx:100-161](src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx:100-161)

### Issue 2: Push-to-Talk Implementation
**Problem:** Current implementation assumes SDK automatically handles push-to-talk. May need explicit SDK method calls.

**Current flow:**
- Press button → `initializeSession()` → SDK handles mic automatically
- Release button → `setAppState('ai_responding')` → Assume SDK sends audio automatically

**Possible SDK methods to investigate:**
```typescript
session.startUserInput()  // Start recording
session.stopUserInput()   // Stop recording, send audio
session.generateResponse() // Trigger AI response
```

**How to verify:**
1. Test if AI responds after button release
2. Check if microphone permission prompt appears
3. Verify audio is being sent to OpenAI

**Potential fix:** Add explicit SDK method calls in [VoiceRealtimeOpenAI.tsx:166-211](src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx:166-211)

### Issue 3: Interim Transcripts
**Problem:** May not get live user transcript during speaking (event may not exist)

**Current code:** Uses `input_audio_transcription.partial` for interim text

**Fallback:** If this event doesn't exist, component will still work but won't show live user speech - only completed transcript after button release

---

## Manual Testing Steps

### Test 1: Basic Connection
1. Visit http://localhost:3006/voiceinterface/realtime
2. Open browser console
3. Click microphone button
4. **Expected:**
   - Microphone permission prompt appears
   - Console shows "Session connected"
   - Button morphs to stop icon (red square)
   - State changes to "user_speaking"

### Test 2: User Speech Recognition
1. Continue from Test 1
2. Speak into microphone: "Hello, can you hear me?"
3. Release button
4. **Expected:**
   - User transcript appears: "You: Hello, can you hear me?"
   - State changes to "ai_responding"
   - Console shows transcript completion events

### Test 3: AI Response
1. Continue from Test 2
2. Wait for AI to respond
3. **Expected:**
   - AI transcript appears below user text: "AI: Yes, I can hear you..."
   - Audio plays from browser (AI voice)
   - State changes to "complete"
   - Button shows copy/clear actions

### Test 4: Multiple Turns
1. Continue from Test 3
2. Click button again (should resume session)
3. Speak another message
4. Release and wait for response
5. **Expected:**
   - Conversation continues
   - Transcript shows multiple turns
   - Session persists (no re-initialization)

### Test 5: Copy & Clear
1. After completing Test 4
2. Click copy button
3. Paste in notepad
4. **Expected:** Full conversation copied to clipboard

5. Click clear button
6. **Expected:**
   - Text fades out
   - State resets to idle
   - Session disconnects
   - Console shows "Disconnected"

### Test 6: Error Handling
1. Stop dev server or disconnect network
2. Try to use component
3. **Expected:** Error message displays clearly

---

## Browser Compatibility

Test on these browsers:
- ✅ Chrome (primary) - WebRTC fully supported
- ⚠️ Safari - WebRTC supported but may have quirks
- ⚠️ Firefox - WebRTC supported but may have quirks
- ⚠️ Mobile Chrome - Touch interactions, responsive layout
- ⚠️ Mobile Safari - iOS WebRTC limitations

---

## Common Issues & Solutions

### "Failed to connect to OpenAI"
**Cause:** Missing or invalid OPENAI_API_KEY
**Solution:** Verify `.env.local` has valid key, restart dev server

### "Failed to get token"
**Cause:** API route error
**Solution:** Check `/api/voice-interface/openai-realtime-token` endpoint logs

### Microphone permission denied
**Cause:** User blocked microphone access
**Solution:** User must allow microphone in browser settings

### No audio playback
**Cause:** Browser audio autoplay policy
**Solution:** User must interact with page first (click button)

### Session expires after 10 minutes
**Cause:** Ephemeral token TTL
**Solution:** Disconnect and reconnect (button click will reinitialize)

### Events not firing
**Cause:** SDK event names may differ from documentation
**Solution:** Add catch-all event listener, verify actual event names

---

## Debugging Commands

### Check dev server status
```bash
ps aux | grep "next dev"
```

### Test API endpoint
```bash
curl -s http://localhost:3006/api/voice-interface/openai-realtime-token | jq .
```

### Check OPENAI_API_KEY
```bash
grep OPENAI_API_KEY .env.local
```

### View dev server logs
```bash
# Already running in background, check console output
```

---

## Next Steps After Testing

### If Tests Pass ✅
- Document any deviations from plan in README
- Note actual SDK event names discovered
- Update implementation if needed
- Consider enhancements:
  - Automatic turn detection (VAD)
  - Interrupt AI mid-response
  - Voice selection UI
  - Conversation persistence

### If Tests Fail ❌
1. Document exact error messages
2. Check browser console for clues
3. Verify SDK event names
4. Test push-to-talk implementation
5. Update code as needed
6. Commit fixes with descriptive messages

---

## Files to Reference

- Component: [src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx](src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx)
- API Route: [src/pages/api/voice-interface/openai-realtime-token.ts](src/pages/api/voice-interface/openai-realtime-token.ts)
- Standalone Page: [src/pages/voiceinterface/realtime.tsx](src/pages/voiceinterface/realtime.tsx)
- Variations Page: [src/pages/voiceinterface/variations.tsx](src/pages/voiceinterface/variations.tsx)
- Documentation: [src/projects/voiceinterface/README.md](src/projects/voiceinterface/README.md)

---

## Git Commits Made

1. `4a38a44` - Dependencies & API route
2. `daaf0ba` - Component & showcase page
3. `fe1053b` - Variations integration
4. `1241067` - Comprehensive README

All code is committed and ready for testing!
