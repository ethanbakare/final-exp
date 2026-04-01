[HMR] connected
VM57:63 [Clipstream] [AudioStorage] [DEBUG] IndexedDB initialized successfully
VM57:63 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB {audioId: 'audio-1767290148353-sfd7ewm7j', size: 81959, mimeType: 'audio/webm;codecs=opus', format: 'v2-ArrayBuffer'}
VM57:63 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB {audioId: 'audio-1767290148353-sfd7ewm7j', size: 81959, type: 'audio/webm;codecs=opus'}
VM57:63 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription {size: 81959, attempt: 1, source: 'retry-from-indexeddb'}
VM57:63 [Clipstream] [useClipRecording] [INFO] Transcription successful {textLength: 49, preview: "Let's conduct my first test to see how things go...."}
VM57:63 [Formatting] Starting formatting for clip: clip-1767290151599-1zm9geevfyu0h64ur423tl | isAppending: false
VM57:63 [Clipstream] [ClipMasterScreen] [DEBUG] Starting background title generation {clipId: 'clip-1767290151599-1zm9geevfyu0h64ur423tl', textLength: 49}
VM57:63 [Clipstream] [ClipMasterScreen] [INFO] AI title generated, updating clip {clipId: 'clip-1767290151599-1zm9geevfyu0h64ur423tl', title: 'First Test Evaluation Discussion'}
VM57:63 [Formatting] Received formatted text for clip: clip-1767290151599-1zm9geevfyu0h64ur423tl
VM57:63 [Formatting] Updated clip content in Zustand for clip: clip-1767290151599-1zm9geevfyu0h64ur423tl
VM57:63 [Formatting] Calling setRecordNavState(complete) for clip: clip-1767290151599-1zm9geevfyu0h64ur423tl
VM57:63 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) {clearedContext: true}
VM57:63 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB {audioId: 'audio-1767290171510-eevycu3f0', size: 71253, mimeType: 'audio/webm;codecs=opus', format: 'v2-ArrayBuffer'}
VM57:63 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB {audioId: 'audio-1767290171510-eevycu3f0', size: 71253, type: 'audio/webm;codecs=opus'}
VM57:63 [Clipstream] [useOfflineRecording] [INFO] Handling offline recording {audioId: 'audio-1767290171510-eevycu3f0', duration: 4, currentClipId: null}
VM57:63 [Clipstream] [useOfflineRecording] [INFO] No currentClipId → creating parent
VM57:63 [Clipstream] [useOfflineRecording] [INFO] Created PARENT container for offline recording {parentId: 'clip-1767290171513-diellhelf', title: 'Recording 01'}
VM57:63 [Clipstream] [useOfflineRecording] [INFO] Created FIRST CHILD for offline recording {childId: 'clip-1767290171513-6d17thj3fve', parentId: 'clip-1767290171513-diellhelf', parentTitle: 'Recording 01', childTitle: 'Clip 001'}
VM57:63 [Clipstream] [useOfflineRecording] [DEBUG] First child created, Zustand selector will auto-update {firstChildId: 'clip-1767290171513-6d17thj3fve'}
VM57:63 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) {clearedContext: true}
VM57:63 [Clipstream] [ClipMasterScreen] [INFO] Loaded parent with children {parentId: 'clip-1767290171513-diellhelf', childCount: 1}
VM57:63 [Auto-retry] Going online, checking for pending clips
VM57:63 [Auto-retry] Processing 1 parents with pending clips
VM57:63 [Auto-retry] Processing parent: Recording 01 | Children: 1
VM57:63 [ProcessChildren] Starting for parent: clip-1767290171513-diellhelf | Children: 1
VM57:63 [ProcessChildren] Processing FIRST child: Clip 001
VM57:63 [ProcessChild] Starting: Clip 001
VM57:63 [Clipstream] [AudioStorage] [DEBUG] Audio retrieved from IndexedDB {audioId: 'audio-1767290171510-eevycu3f0', size: 71253, mimeType: 'audio/webm;codecs=opus', format: 'v2-ArrayBuffer', storedSize: 71253, …}
VM57:63 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription {size: 71253, attempt: 1, source: 'retry-from-indexeddb'}
useClipRecording.ts:352  POST http://localhost:3000/api/clipperstream/transcribe 500 (Internal Server Error)
useClipRecording.useCallback[transcribeRecording] @ useClipRecording.ts:352
ClipMasterScreen.useCallback[processChild] @ ClipMasterScreen.tsx:1018
await in ClipMasterScreen.useCallback[processChild]
ClipMasterScreen.useCallback[processParentChildren] @ ClipMasterScreen.tsx:1111
ClipMasterScreen.useEffect.handleOnline @ ClipMasterScreen.tsx:1239Understand this error
VM57:63 [Clipstream] [useClipRecording] [ERROR] Transcription failed {error: Error: Server error 500: Transcription failed
    at useClipRecording.useCallback[transcribeRecordi…, attempt: 1}
console.<computed> @ VM57:63
nextJsHandleConsoleError @ pages-dev-overlay-setup.js:77
error @ logger.ts:128
useClipRecording.useCallback[transcribeRecording] @ useClipRecording.ts:387
await in useClipRecording.useCallback[transcribeRecording]
ClipMasterScreen.useCallback[processChild] @ ClipMasterScreen.tsx:1018
await in ClipMasterScreen.useCallback[processChild]
ClipMasterScreen.useCallback[processParentChildren] @ ClipMasterScreen.tsx:1111
ClipMasterScreen.useEffect.handleOnline @ ClipMasterScreen.tsx:1239
VM57:63 [Clipstream] [useClipRecording] [ERROR] Server rejection (definitive failure) {errorMessage: 'Server error 500: Transcription failed', retriesAttempted: 1}
console.<computed> @ VM57:63
nextJsHandleConsoleError @ pages-dev-overlay-setup.js:77
error @ logger.ts:128
useClipRecording.useCallback[transcribeRecording] @ useClipRecording.ts:402
await in useClipRecording.useCallback[transcribeRecording]
ClipMasterScreen.useCallback[processChild] @ ClipMasterScreen.tsx:1018
await in ClipMasterScreen.useCallback[processChild]
ClipMasterScreen.useCallback[processParentChildren] @ ClipMasterScreen.tsx:1111
ClipMasterScreen.useEffect.handleOnline @ ClipMasterScreen.tsx:1239
VM57:63 [ProcessChild] Transcription failed: Clip 001
console.<computed> @ VM57:63
ClipMasterScreen.useCallback[processChild] @ ClipMasterScreen.tsx:1022
await in ClipMasterScreen.useCallback[processChild]
ClipMasterScreen.useCallback[processParentChildren] @ ClipMasterScreen.tsx:1111
ClipMasterScreen.useEffect.handleOnline @ ClipMasterScreen.tsx:1239
VM57:63 [Clipstream] [ClipMasterScreen] [ERROR] Definitive transcription failure {error: 'Server rejected audio'}
console.<computed> @ VM57:63
nextJsHandleConsoleError @ pages-dev-overlay-setup.js:77
error @ logger.ts:128
ClipMasterScreen.useEffect @ ClipMasterScreen.tsx:1270
react-stack-bottom-frame @ react-dom-client.development.js:22510
runWithFiberInDEV @ react-dom-client.development.js:544
commitHookEffectListMount @ react-dom-client.development.js:10759
commitHookPassiveMountEffects @ react-dom-client.development.js:10879
commitPassiveMountOnFiber @ react-dom-client.development.js:12654
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12628
commitPassiveMountOnFiber @ react-dom-client.development.js:12756
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12628
commitPassiveMountOnFiber @ react-dom-client.development.js:12756
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12628
commitPassiveMountOnFiber @ react-dom-client.development.js:12647
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12628
commitPassiveMountOnFiber @ react-dom-client.development.js:12756
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12628
commitPassiveMountOnFiber @ react-dom-client.development.js:12647
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12628
commitPassiveMountOnFiber @ react-dom-client.development.js:12647
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12628
commitPassiveMountOnFiber @ react-dom-client.development.js:12756
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12628
commitPassiveMountOnFiber @ react-dom-client.development.js:12756
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12628
commitPassiveMountOnFiber @ react-dom-client.development.js:12756
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12628
commitPassiveMountOnFiber @ react-dom-client.development.js:12756
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12628
commitPassiveMountOnFiber @ react-dom-client.development.js:12756
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12628
commitPassiveMountOnFiber @ react-dom-client.development.js:12647
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12628
commitPassiveMountOnFiber @ react-dom-client.development.js:12756
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12628
commitPassiveMountOnFiber @ react-dom-client.development.js:12756
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12628
commitPassiveMountOnFiber @ react-dom-client.development.js:12756
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12628
commitPassiveMountOnFiber @ react-dom-client.development.js:12647
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12628
commitPassiveMountOnFiber @ react-dom-client.development.js:12756
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12628
commitPassiveMountOnFiber @ react-dom-client.development.js:12647
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12628
commitPassiveMountOnFiber @ react-dom-client.development.js:12756
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12628
commitPassiveMountOnFiber @ react-dom-client.development.js:12647
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12628
commitPassiveMountOnFiber @ react-dom-client.development.js:12658
flushPassiveEffects @ react-dom-client.development.js:15461
commitRootImpl @ react-dom-client.development.js:15391
commitRoot @ react-dom-client.development.js:15252
commitRootWhenReady @ react-dom-client.development.js:14571
performWorkOnRoot @ react-dom-client.development.js:14495
performSyncWorkOnRoot @ react-dom-client.development.js:15947
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:15808
processRootScheduleInMicrotask @ react-dom-client.development.js:15842
eval @ react-dom-client.development.js:15963
VM57:63 [ProcessChildren] Completed parent: clip-1767290171513-diellhelf
VM57:63 [Auto-retry] Completed all parents



________

Session storage localhost:3000

{state: {clips: [{id: "clip-1767290151599-1zm9geevfyu0h64ur423tl", createdAt: 1767290151599,…},…]},…}
state
: 
{clips: [{id: "clip-1767290151599-1zm9geevfyu0h64ur423tl", createdAt: 1767290151599,…},…]}
clips
: 
[{id: "clip-1767290151599-1zm9geevfyu0h64ur423tl", createdAt: 1767290151599,…},…]
0
: 
{id: "clip-1767290151599-1zm9geevfyu0h64ur423tl", createdAt: 1767290151599,…}
content
: 
"Let's conduct my first test to see how things go."
createdAt
: 
1767290151599
currentView
: 
"formatted"
date
: 
"Jan 1, 2026"
formattedText
: 
"Let's conduct my first test to see how things go."
id
: 
"clip-1767290151599-1zm9geevfyu0h64ur423tl"
rawText
: 
"Let's conduct my first test to see how things go."
status
: 
null
title
: 
"First Test Evaluation Discussion"
1
: 
{id: "clip-1767290171513-diellhelf", title: "Recording 01", date: "Jan 1, 2026", status: null,…}
content
: 
""
createdAt
: 
1767290171513
currentView
: 
"formatted"
date
: 
"Jan 1, 2026"
formattedText
: 
""
id
: 
"clip-1767290171513-diellhelf"
rawText
: 
""
status
: 
null
title
: 
"Recording 01"
2
: 
{id: "clip-1767290171513-6d17thj3fve", title: "Recording 01", date: "Jan 1, 2026", status: "failed",…}
audioId
: 
"audio-1767290171510-eevycu3f0"
content
: 
""
createdAt
: 
1767290171513
currentView
: 
"formatted"
date
: 
"Jan 1, 2026"
duration
: 
"0:04"
formattedText
: 
""
id
: 
"clip-1767290171513-6d17thj3fve"
parentId
: 
"clip-1767290171513-diellhelf"
pendingClipTitle
: 
"Clip 001"
rawText
: 
""
status
: 
"failed"
title
: 
"Recording 01"
transcriptionError
: 
"Transcription failed"
version
: 
0



____________

View from the terminal.

 ✓ Compiled /api/clipperstream/transcribe in 151ms (181 modules)
(node:92929) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
Files received: [ 'audio' ]
Processing audio file: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/juo84kae1p6a5vux6d5uj96vk, size: 81959 bytes, type: audio/webm;codecs=opus
 POST /api/clipperstream/transcribe 200 in 3241ms
 ✓ Compiled /api/clipperstream/generate-title in 37ms (187 modules)
 ✓ Compiled (190 modules)
[Clipstream] [API/generate-title] [DEBUG] Request received { method: 'POST' }
[Clipstream] [API/generate-title] [DEBUG] API key check { hasKey: true }
[Clipstream] [API/generate-title] [DEBUG] Processing transcription { length: 49 }
[Clipstream] [API/generate-title] [DEBUG] Calling title generator service
[Clipstream] [TitleGenerator] [DEBUG] Starting title generation { transcriptionLength: 49, hasApiKey: true }
[Clipstream] [TitleGenerator] [DEBUG] Creating OpenAI client
[Clipstream] [TitleGenerator] [DEBUG] Calling OpenAI generateText API
[Clipstream] [API/format-text] [DEBUG] Request received { method: 'POST' }
[Clipstream] [API/format-text] [DEBUG] API key check { hasKey: true }
[Clipstream] [API/format-text] [DEBUG] Calling formatter service { rawLength: 49, hasContext: false }
[Clipstream] [TextFormatter] [DEBUG] Starting text formatting { rawLength: 49, hasContext: false }
[Clipstream] [TextFormatter] [DEBUG] Calling OpenAI generateText API
[Clipstream] [TitleGenerator] [INFO] Title generated successfully { title: 'First Test Evaluation Discussion' }
[Clipstream] [API/generate-title] [INFO] Title generated successfully { title: 'First Test Evaluation Discussion' }
 POST /api/clipperstream/generate-title 200 in 2555ms
[Clipstream] [TextFormatter] [INFO] Text formatted successfully { rawLength: 49, formattedLength: 49 }
[Clipstream] [API/format-text] [INFO] Text formatted successfully
 POST /api/clipperstream/format-text 200 in 2930ms
Files received: [ 'audio' ]
Processing audio file: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/de0ziwgfd0j82i9navn3z5p8q, size: 71253 bytes, type: audio/webm;codecs=opus
Error processing audio: Error: Transcription failed: Deepgram API error: fetch failed
    at transcribeAudio (src/projects/clipperstream/api/deepgramProvider.ts:101:11)
    at async handler (src/pages/api/clipperstream/transcribe.ts:140:20)
   99 |     
  100 |     // Generic fallback
> 101 |     throw new Error(`Transcription failed: ${errorMessage}`);
      |           ^
  102 |   }
  103 | }
  104 |
 POST /api/clipperstream/transcribe 500 in 109ms


__________

Audio blobs(Please note that audio blogs can persist across screen refreshing or revisiting the same link, so this is just given you context. I'm not too sure if the first one is from a previous session, but I think the last two are relevant. You can push back if you feel the need to do so.)


0	"audio-1767268550307-s7zi5aubw"	
{id: 'audio-1767268550307-s7zi5aubw', data: ArrayBuffer(90733), mimeType: 'audio/webm;codecs=opus', size: 90733, timestamp: 1767268550309}
data
: 
ArrayBuffer(90733)
id
: 
"audio-1767268550307-s7zi5aubw"
mimeType
: 
"audio/webm;codecs=opus"
size
: 
90733
timestamp
: 
1767268550309
1	"audio-1767290148353-sfd7ewm7j"	
{id: 'audio-1767290148353-sfd7ewm7j', data: ArrayBuffer(81959), mimeType: 'audio/webm;codecs=opus', size: 81959, timestamp: 1767290148354}
data
: 
ArrayBuffer(81959)
id
: 
"audio-1767290148353-sfd7ewm7j"
mimeType
: 
"audio/webm;codecs=opus"
size
: 
81959
timestamp
: 
1767290148354
2	"audio-1767290171510-eevycu3f0"	
{id: 'audio-1767290171510-eevycu3f0', data: ArrayBuffer(71253), mimeType: 'audio/webm;codecs=opus', size: 71253, timestamp: 1767290171511}
data
: 
ArrayBuffer(71253)
id
: 
"audio-1767290171510-eevycu3f0"
mimeType
: 
"audio/webm;codecs=opus"
size
: 
71253
timestamp
: 
1767290171511
