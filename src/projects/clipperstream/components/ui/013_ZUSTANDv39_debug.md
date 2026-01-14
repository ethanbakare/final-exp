[HMR] connected
useAutoRetry.ts:50 [Auto-Retry] Went offline, retries will pause
logger.ts:113 [Clipstream] [AudioStorage] [DEBUG] IndexedDB initialized successfully
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB Object
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB Object
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Handling offline recording Object
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] No currentClipId → creating parent
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Created PARENT container for offline recording Object
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Created FIRST CHILD for offline recording Object
logger.ts:113 [Clipstream] [useOfflineRecording] [DEBUG] First child created, Zustand selector will auto-update Object
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Recording from pending clip (adding successive recording) Object
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB Object
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB Object
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Handling offline recording Object
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Appending to pending file Object
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Created CHILD for offline recording Object
logger.ts:113 [Clipstream] [useOfflineRecording] [DEBUG] Child clip added, Zustand selector will auto-update Object
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) Object
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Loaded parent with children Object
useAutoRetry.ts:29 [Auto-Retry] Came online
useAutoRetry.ts:39 [Auto-Retry] Pending clips detected, starting retry
ClipMasterScreen.tsx:469 [ProcessPending] Starting
ClipMasterScreen.tsx:488 [ProcessPending] Found 1 parents
ClipMasterScreen.tsx:510 [ProcessPending] Processing Recording 01 | Clip 001
logger.ts:113 [Clipstream] [AudioStorage] [DEBUG] 🔬 ARRAYBUFFER CONTENT VERIFICATION Object
logger.ts:119 [Clipstream] [AudioStorage] [INFO] ✅ VALID WEBM DATA - ArrayBuffer contains valid WebM magic bytes Object
logger.ts:113 [Clipstream] [AudioStorage] [DEBUG] Audio retrieved from IndexedDB Object
logger.ts:119 [Clipstream] [TranscriptionRetry] [INFO] Rapid attempt Object
ClipMasterScreen.tsx:571 [ProcessPending] Attempt 1/3
logger.ts:119 [Clipstream] [TranscriptionRetry] [INFO] Transcription succeeded {attempt: 1}
ClipMasterScreen.tsx:577 [ProcessPending] Success!
ClipMasterScreen.tsx:617 [ProcessPending] Current clip finished transcribing, updating nav bar
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Starting background title generation {clipId: 'clip-1768050175182-y8nptd3n3', textLength: 54}clipId: "clip-1768050175182-y8nptd3n3"textLength: 54[[Prototype]]: Object
useAutoRetry.ts:66 [Auto-Retry] Already online with pending clips, starting retry
ClipMasterScreen.tsx:462 [ProcessPending] Already processing, skipping duplicate call
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio deleted from IndexedDB {audioId: 'audio-1768050175180-6aspcgcf5'}
ClipMasterScreen.tsx:510 [ProcessPending] Processing Recording 01 | Clip 002
logger.ts:113 [Clipstream] [AudioStorage] [DEBUG] 🔬 ARRAYBUFFER CONTENT VERIFICATION {audioId: 'audio-1768050184181-y4uht5nxy', isValidWebM: true, first16Bytes: '1a 45 df a3 9f 42 86 81 01 42 f7 81 01 42 f2 81', expectedHeader: '1a 45 df a3 ...', totalBytes: 110865, …}
logger.ts:119 [Clipstream] [AudioStorage] [INFO] ✅ VALID WEBM DATA - ArrayBuffer contains valid WebM magic bytes {audioId: 'audio-1768050184181-y4uht5nxy', first4Bytes: '1a 45 df a3'}
logger.ts:113 [Clipstream] [AudioStorage] [DEBUG] Audio retrieved from IndexedDB {audioId: 'audio-1768050184181-y4uht5nxy', size: 110865, mimeType: 'audio/webm;codecs=opus', format: 'v2-ArrayBuffer', storedSize: 110865, …}
logger.ts:119 [Clipstream] [TranscriptionRetry] [INFO] Rapid attempt {attempt: 1, max: 3}
ClipMasterScreen.tsx:571 [ProcessPending] Attempt 1/3
logger.ts:119 [Clipstream] [TranscriptionRetry] [INFO] Transcription succeeded {attempt: 1}
ClipMasterScreen.tsx:577 [ProcessPending] Success!
ClipMasterScreen.tsx:617 [ProcessPending] Current clip finished transcribing, updating nav bar
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] AI title generated, updating clip {clipId: 'clip-1768050175182-y8nptd3n3', title: 'Initial Recording Overview and Identification'}
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio deleted from IndexedDB {audioId: 'audio-1768050184181-y4uht5nxy'}
ClipMasterScreen.tsx:682 [ProcessPending] All pending clips processed
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) {clearedContext: true}


___________________________

Session storage localhost:3000

state: {,…}, version: 0}
state
: 
{,…}
clips
: 
[{id: "clip-1768050175182-y8nptd3n3", title: "Initial Recording Overview and Identification",…}]
0
: 
{id: "clip-1768050175182-y8nptd3n3", title: "Initial Recording Overview and Identification",…}
content
: 
"This is clip zero zero two inside file recording zero zero one."
createdAt
: 
1768050175182
currentView
: 
"formatted"
date
: 
"Jan 10, 2026"
formattedText
: 
"This is clip zero zero two inside file recording zero zero one."
id
: 
"clip-1768050175182-y8nptd3n3"
rawText
: 
"This is clip zero zero two inside file recording zero zero one"
status
: 
null
title
: 
"Initial Recording Overview and Identification"
version
: 
0