# Console Log Capture - 00

**Date:** December 27, 2025  
**URL:** http://localhost:3000/clipperstream/showcase/clipscreencomponents

---

## Captured Logs (from browser subagent)

```text
[info] Download the React DevTools for a better development experience: https://react.dev/link/react-devtools
[log] [HMR] connected
[log] [Clipstream] [useClipState] [DEBUG] Clips initialized from storage {count: 0}
[log] [Clipstream] [ClipMasterScreen] [INFO] Network offline
[log] New clip clicked
[log] [Fast Refresh] rebuilding
[log] [Fast Refresh] done in 1869ms
[log] [Fast Refresh] rebuilding
[log] [Fast Refresh] done in 605ms
```

---

## From User Screenshot (manual transcription)

Based on the image the user provided, these are the console messages visible:

```text
● handleOnline FIRED - network is back online                     ClipMasterScreen.tsx:437
[Clipstream] [ClipMasterScreen] [INFO] Network online -           logger.ts:119
  attempting auto-retry of pending clips
● handleOnline - clips found:                                     ClipMasterScreen.tsx:454
  ▸ {total: 2, pendingCount: 1, pendingClips: Array(1)}
[Clipstream] [ClipMasterScreen] [INFO] Found pending clips        logger.ts:119
  for auto-retry ▸ {count: 1}
[Clipstream] [ClipMasterScreen] [INFO] Status transition          logger.ts:119
  ▸ {clipId: 'clip-1766857288354-by5uflnq5', from: 'pending', to: 'transcrib
  ing', trigger: 'auto-retry-online'}
[Clipstream] [useClipState] [INFO] Updating clip                  logger.ts:119
  ▸ {clipId: 'clip-1766857288354-by5uflnq5', updates: {...}}
[Clipstream] [useClipState] [DEBUG] Clips refreshed from          logger.ts:113
  storage ▸ {count: 2}
[Clipstream] [useClipState] [DEBUG] Clips refreshed from          logger.ts:113
  storage ▸ {count: 2}
[Clipstream] [ClipMasterScreen] [INFO] Offline - clip saved       logger.ts:119
  as pending
[Clipstream] [ClipMasterScreen] [INFO] Status transition          logger.ts:119
  ▸ {clipId: 'clip-1766857288354-by5uflnq5', from: null, to: 'pending', trig
  ger: 'offline-save'}
[Clipstream] [useClipState] [INFO] Updating clip                  logger.ts:119
  ▸ {clipId: 'clip-1766857288354-by5uflnq5', updates: {...}}
[Clipstream] [useClipState] [DEBUG] Clips refreshed from          logger.ts:113
  storage ▸ {count: 2}
[Clipstream] [ClipMasterScreen] [INFO] Pending clip created       logger.ts:119
  with stored title
  ▸ {clipId: 'clip-1766857288354-by5uflnq5', title: 'Clip 002', recordingNum
  ber: 1, pendingCount: 1}
[Clipstream] [useClipState] [DEBUG] Clips refreshed from          logger.ts:113
  storage ▸ {count: 2}
[Clipstream] [ClipMasterScreen] [DEBUG] Set                       logger.ts:113
  selectedPendingClips for offline display ▸ {count: 1, titles: Array(1)}
[Clipstream] [AudioStorage] [DEBUG] Audio retrieved from          logger.ts:113
  IndexedDB ▸ {audioId: 'audio-1766857306743-rxqrvkhw2', size: 215405}
[Clipstream] [ClipMasterScreen] [DEBUG] Auto-retrying             logger.ts:113
  transcription
  ▸ {clipId: 'clip-1766857288354-by5uflnq5', audioId: 'audio-1766857306743-r
  xqrvkhw2', size: 215405}
[Clipstream] [useClipRecording] [DEBUG] Sending audio for         logger.ts:113
  transcription ▸ {size: 215405, attempt: 1, source: 'retry-from-indexeddb'}
[Clipstream] [useClipRecording] [INFO] Transcription              logger.ts:119
  successful
  ▸ {textLength: 178, preview: "Let's do our second recording and see what h
  appens..."}
  preview: "Let's do our second recording and see what happens..."
  textLength: 178
  ▸ [[Prototype]]: Object
▲ [Clipstream] [ClipMasterScreen] [WARN] No pending clip          logger.ts:124
  found for background transcription
  warn                                                            @ logger.ts:124
  ClipMasterScreen.useEffect                                      @ ClipMasterScreen.tsx:1059
  Show ignore-listed frames
```

---

## Analysis

The logs show:
1. **handleOnline fires** when coming back online
2. **auto-retry is attempted** for pending clip
3. **A second offline save occurs** (possibly the bug - "Offline - clip saved as pending" happening during online)
4. **Warning at end:** "No pending clip found for background transcription" - this might be related to the bugs described
