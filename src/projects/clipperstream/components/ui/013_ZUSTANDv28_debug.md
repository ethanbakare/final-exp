[HMR] connected
VM6:63 [Fast Refresh] rebuilding
VM6:63 [Clipstream] [AudioStorage] [DEBUG] IndexedDB initialized successfully
VM6:63 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB {audioId: 'audio-1767293016268-qgzdnufvu', size: 45929, mimeType: 'audio/webm;codecs=opus', format: 'v2-ArrayBuffer'}
VM6:63 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB {audioId: 'audio-1767293016268-qgzdnufvu', size: 45929, type: 'audio/webm;codecs=opus'}
VM6:63 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription {size: 45929, attempt: 1, source: 'retry-from-indexeddb'}
VM6:63 [Clipstream] [useClipRecording] [INFO] Transcription successful {textLength: 49, preview: 'Conducting my first recording without any issues....'}
VM6:63 [Formatting] Starting formatting for clip: clip-1767293020350-jpsdbgs3b9cimz44hs19xc | isAppending: false
VM6:63 [Clipstream] [ClipMasterScreen] [DEBUG] Starting background title generation {clipId: 'clip-1767293020350-jpsdbgs3b9cimz44hs19xc', textLength: 49}
VM6:63 [Clipstream] [ClipMasterScreen] [INFO] AI title generated, updating clip {clipId: 'clip-1767293020350-jpsdbgs3b9cimz44hs19xc', title: 'Successful First Recording Experience'}
VM6:63 [Formatting] Received formatted text for clip: clip-1767293020350-jpsdbgs3b9cimz44hs19xc
VM6:63 [Formatting] Updated clip content in Zustand for clip: clip-1767293020350-jpsdbgs3b9cimz44hs19xc
VM6:63 [Formatting] Calling setRecordNavState(complete) for clip: clip-1767293020350-jpsdbgs3b9cimz44hs19xc
VM6:63 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) {clearedContext: true}
VM6:63 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB {audioId: 'audio-1767293045289-y69qx27vt', size: 106317, mimeType: 'audio/webm;codecs=opus', format: 'v2-ArrayBuffer'}
VM6:63 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB {audioId: 'audio-1767293045289-y69qx27vt', size: 106317, type: 'audio/webm;codecs=opus'}
VM6:63 [Clipstream] [useOfflineRecording] [INFO] Handling offline recording {audioId: 'audio-1767293045289-y69qx27vt', duration: 6, currentClipId: null}
VM6:63 [Clipstream] [useOfflineRecording] [INFO] No currentClipId → creating parent
VM6:63 [Clipstream] [useOfflineRecording] [INFO] Created PARENT container for offline recording {parentId: 'clip-1767293045296-jmb98fj25', title: 'Recording 01'}
VM6:63 [Clipstream] [useOfflineRecording] [INFO] Created FIRST CHILD for offline recording {childId: 'clip-1767293045297-7gl1uwpe3y9', parentId: 'clip-1767293045296-jmb98fj25', parentTitle: 'Recording 01', childTitle: 'Clip 001'}
VM6:63 [Clipstream] [useOfflineRecording] [DEBUG] First child created, Zustand selector will auto-update {firstChildId: 'clip-1767293045297-7gl1uwpe3y9'}
VM6:63 [Auto-retry] Going online, checking for pending clips
VM6:63 [Auto-retry] Processing 1 parents with pending clips
VM6:63 [Auto-retry] Processing parent: Recording 01 | Children: 1
VM6:63 [ProcessChildren] Starting for parent: clip-1767293045296-jmb98fj25 | Children: 1
VM6:63 [ProcessChildren] Processing FIRST child: Clip 001
VM6:63 [ProcessChild] Starting: Clip 001
VM6:63 [Clipstream] [AudioStorage] [DEBUG] 🔬 ARRAYBUFFER CONTENT VERIFICATION {audioId: 'audio-1767293045289-y69qx27vt', isValidWebM: true, first16Bytes: '1a 45 df a3 9f 42 86 81 01 42 f7 81 01 42 f2 81', expectedHeader: '1a 45 df a3 ...', totalBytes: 106317, …}
VM6:63 [Clipstream] [AudioStorage] [INFO] ✅ VALID WEBM DATA - ArrayBuffer contains valid WebM magic bytes {audioId: 'audio-1767293045289-y69qx27vt', first4Bytes: '1a 45 df a3'}
VM6:63 [Clipstream] [AudioStorage] [DEBUG] Audio retrieved from IndexedDB {audioId: 'audio-1767293045289-y69qx27vt', size: 106317, mimeType: 'audio/webm;codecs=opus', format: 'v2-ArrayBuffer', storedSize: 106317, …}
VM6:63 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription {size: 106317, attempt: 1, source: 'retry-from-indexeddb'}
useClipRecording.ts:352  POST http://localhost:3000/api/clipperstream/transcribe 500 (Internal Server Error)
useClipRecording.useCallback[transcribeRecording] @ useClipRecording.ts:352
ClipMasterScreen.useCallback[processChild] @ ClipMasterScreen.tsx:1018
await in ClipMasterScreen.useCallback[processChild]
ClipMasterScreen.useCallback[processParentChildren] @ ClipMasterScreen.tsx:1111
ClipMasterScreen.useEffect.handleOnline @ ClipMasterScreen.tsx:1239Understand this error
VM6:63 [Clipstream] [useClipRecording] [ERROR] Transcription failed {error: Error: Server error 500: Transcription failed
    at useClipRecording.useCallback[transcribeRecordi…, attempt: 1}attempt: 1error: Error: Server error 500: Transcription failed
    at useClipRecording.useCallback[transcribeRecording] (webpack-internal:///(pages-dir-browser)/./src/projects/clipperstream/hooks/useClipRecording.ts:312:27)
    at async ClipMasterScreen.useCallback[processChild] (webpack-internal:///(pages-dir-browser)/./src/projects/clipperstream/components/ui/ClipMasterScreen.tsx:1016:45)
    at async ClipMasterScreen.useCallback[processParentChildren] (webpack-internal:///(pages-dir-browser)/./src/projects/clipperstream/components/ui/ClipMasterScreen.tsx:1105:32)
    at async ClipMasterScreen.useEffect.handleOnline (webpack-internal:///(pages-dir-browser)/./src/projects/clipperstream/components/ui/ClipMasterScreen.tsx:1226:25)message: "Server error 500: Transcription failed"stack: "Error: Server error 500: Transcription failed\n    at useClipRecording.useCallback[transcribeRecording] (webpack-internal:///(pages-dir-browser)/./src/projects/clipperstream/hooks/useClipRecording.ts:312:27)\n    at async ClipMasterScreen.useCallback[processChild] (webpack-internal:///(pages-dir-browser)/./src/projects/clipperstream/components/ui/ClipMasterScreen.tsx:1016:45)\n    at async ClipMasterScreen.useCallback[processParentChildren] (webpack-internal:///(pages-dir-browser)/./src/projects/clipperstream/components/ui/ClipMasterScreen.tsx:1105:32)\n    at async ClipMasterScreen.useEffect.handleOnline (webpack-internal:///(pages-dir-browser)/./src/projects/clipperstream/components/ui/ClipMasterScreen.tsx:1226:25)"[[Prototype]]: Objectconstructor: ƒ Error()message: ""name: "Error"toString: ƒ toString()[[Prototype]]: Object[[Prototype]]: Objectconstructor: ƒ Object()hasOwnProperty: ƒ hasOwnProperty()isPrototypeOf: ƒ isPrototypeOf()propertyIsEnumerable: ƒ propertyIsEnumerable()toLocaleString: ƒ toLocaleString()toString: ƒ toString()valueOf: ƒ valueOf()__defineGetter__: ƒ __defineGetter__()__defineSetter__: ƒ __defineSetter__()__lookupGetter__: ƒ __lookupGetter__()__lookupSetter__: ƒ __lookupSetter__()__proto__: (...)get __proto__: ƒ __proto__()set __proto__: ƒ __proto__()
console.<computed> @ VM6:63
nextJsHandleConsoleError @ pages-dev-overlay-setup.js:77
error @ logger.ts:128
useClipRecording.useCallback[transcribeRecording] @ useClipRecording.ts:387
await in useClipRecording.useCallback[transcribeRecording]
ClipMasterScreen.useCallback[processChild] @ ClipMasterScreen.tsx:1018
await in ClipMasterScreen.useCallback[processChild]
ClipMasterScreen.useCallback[processParentChildren] @ ClipMasterScreen.tsx:1111
ClipMasterScreen.useEffect.handleOnline @ ClipMasterScreen.tsx:1239
VM6:63 [Clipstream] [useClipRecording] [ERROR] Server rejection (definitive failure) {errorMessage: 'Server error 500: Transcription failed', retriesAttempted: 1}
console.<computed> @ VM6:63
nextJsHandleConsoleError @ pages-dev-overlay-setup.js:77
error @ logger.ts:128
useClipRecording.useCallback[transcribeRecording] @ useClipRecording.ts:402
await in useClipRecording.useCallback[transcribeRecording]
ClipMasterScreen.useCallback[processChild] @ ClipMasterScreen.tsx:1018
await in ClipMasterScreen.useCallback[processChild]
ClipMasterScreen.useCallback[processParentChildren] @ ClipMasterScreen.tsx:1111
ClipMasterScreen.useEffect.handleOnline @ ClipMasterScreen.tsx:1239
VM6:63 [ProcessChild] Transcription failed: Clip 001
console.<computed> @ VM6:63
ClipMasterScreen.useCallback[processChild] @ ClipMasterScreen.tsx:1022
await in ClipMasterScreen.useCallback[processChild]
ClipMasterScreen.useCallback[processParentChildren] @ ClipMasterScreen.tsx:1111
ClipMasterScreen.useEffect.handleOnline @ ClipMasterScreen.tsx:1239
VM6:63 [Clipstream] [ClipMasterScreen] [ERROR] Definitive transcription failure {error: 'Server rejected audio'}error: "Server rejected audio"[[Prototype]]: Object
console.<computed> @ VM6:63
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
VM6:63 [Clipstream] [ClipMasterScreen] [INFO] Status transition {clipId: 'clip-1767293045296-jmb98fj25', from: 'transcribing', to: 'failed', trigger: 'transcription-error', error: 'Server rejected audio'}clipId: "clip-1767293045296-jmb98fj25"error: "Server rejected audio"from: "transcribing"to: "failed"trigger: "transcription-error"[[Prototype]]: Objectconstructor: ƒ Object()hasOwnProperty: ƒ hasOwnProperty()isPrototypeOf: ƒ isPrototypeOf()propertyIsEnumerable: ƒ propertyIsEnumerable()toLocaleString: ƒ toLocaleString()toString: ƒ toString()valueOf: ƒ valueOf()__defineGetter__: ƒ __defineGetter__()__defineSetter__: ƒ __defineSetter__()__lookupGetter__: ƒ __lookupGetter__()__lookupSetter__: ƒ __lookupSetter__()__proto__: (...)get __proto__: ƒ __proto__()set __proto__: ƒ __proto__()
VM6:63 [ProcessChildren] Completed parent: clip-1767293045296-jmb98fj25
VM6:63 [Auto-retry] Completed all parents



_________
Message from TERMINAL


 Compiled /api/clipperstream/transcribe in 125ms (278 modules)
(node:19650) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
Files received: [ 'audio' ]
=== 🔬 SERVER AUDIO VERIFICATION ===
File path: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/g6gva5vh64i51oqczdlao2e9w
Size: 45929 bytes
MIME type: audio/webm;codecs=opus
Is valid WebM: ✅ YES
First 64 bytes (hex): 1a 45 df a3 9f 42 86 81 01 42 f7 81 01 42 f2 81 04 42 f3 81 08 42 82 84 77 65 62 6d 42 87 81 04 42 85 81 02 18 53 80 67 01 ff ff ff ff ff ff ff 15 49 a9 66 99 2a d7 b1 83 0f 42 40 4d 80 86 43
Expected WebM header: 1a 45 df a3
====================================
Processing audio file: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/g6gva5vh64i51oqczdlao2e9w, size: 45929 bytes, type: audio/webm;codecs=opus
 POST /api/clipperstream/transcribe 200 in 4067ms
 ✓ Compiled /api/clipperstream/generate-title in 41ms (284 modules)
 ✓ Compiled (287 modules)
[Clipstream] [API/format-text] [DEBUG] Request received { method: 'POST' }
[Clipstream] [API/format-text] [DEBUG] API key check { hasKey: true }
[Clipstream] [API/format-text] [DEBUG] Calling formatter service { rawLength: 49, hasContext: false }
[Clipstream] [TextFormatter] [DEBUG] Starting text formatting { rawLength: 49, hasContext: false }
[Clipstream] [TextFormatter] [DEBUG] Calling OpenAI generateText API
[Clipstream] [API/generate-title] [DEBUG] Request received { method: 'POST' }
[Clipstream] [API/generate-title] [DEBUG] API key check { hasKey: true }
[Clipstream] [API/generate-title] [DEBUG] Processing transcription { length: 49 }
[Clipstream] [API/generate-title] [DEBUG] Calling title generator service
[Clipstream] [TitleGenerator] [DEBUG] Starting title generation { transcriptionLength: 49, hasApiKey: true }
[Clipstream] [TitleGenerator] [DEBUG] Creating OpenAI client
[Clipstream] [TitleGenerator] [DEBUG] Calling OpenAI generateText API
[Clipstream] [TitleGenerator] [INFO] Title generated successfully { title: 'Successful First Recording Experience' }
[Clipstream] [API/generate-title] [INFO] Title generated successfully { title: 'Successful First Recording Experience' }
 POST /api/clipperstream/generate-title 200 in 3012ms
[Clipstream] [TextFormatter] [INFO] Text formatted successfully { rawLength: 49, formattedLength: 49 }
[Clipstream] [API/format-text] [INFO] Text formatted successfully
 POST /api/clipperstream/format-text 200 in 3238ms
Files received: [ 'audio' ]
=== 🔬 SERVER AUDIO VERIFICATION ===
File path: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/bscj65adshhtbn3c94mv8mn86
Size: 106317 bytes
MIME type: audio/webm;codecs=opus
Is valid WebM: ✅ YES
First 64 bytes (hex): 1a 45 df a3 9f 42 86 81 01 42 f7 81 01 42 f2 81 04 42 f3 81 08 42 82 84 77 65 62 6d 42 87 81 04 42 85 81 02 18 53 80 67 01 ff ff ff ff ff ff ff 15 49 a9 66 99 2a d7 b1 83 0f 42 40 4d 80 86 43
Expected WebM header: 1a 45 df a3
====================================
Processing audio file: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/bscj65adshhtbn3c94mv8mn86, size: 106317 bytes, type: audio/webm;codecs=opus
=== 🔬 DEEPGRAM API ERROR DETAILS ===
Error object: Error: Deepgram API error: fetch failed
    at transcribeAudio (src/projects/clipperstream/api/deepgramProvider.ts:61:13)
    at async handler (src/pages/api/clipperstream/transcribe.ts:176:20)
  59 |     // Handle Deepgram API errors
  60 |     if (error) {
> 61 |       throw new Error(`Deepgram API error: ${error.message || 'Unknown error'}`);
     |             ^
  62 |     }
  63 |     
  64 |     // Extract transcript from response
Error type: Error
Error message: Deepgram API error: fetch failed
Error properties: {
  code: undefined,
  status: undefined,
  statusCode: undefined,
  errno: undefined,
  syscall: undefined,
  cause: undefined
}
This is a FETCH error - network or request failed
Possible causes:
  1. Network connectivity issue
  2. Invalid audio format rejected by Deepgram
  3. CORS or request configuration issue
  4. Deepgram API endpoint unreachable
=====================================
Error processing audio: Error: Transcription failed: Deepgram API error: fetch failed
    at transcribeAudio (src/projects/clipperstream/api/deepgramProvider.ts:149:11)
    at async handler (src/pages/api/clipperstream/transcribe.ts:176:20)
  147 |     
  148 |     // Generic fallback
> 149 |     throw new Error(`Transcription failed: ${errorMessage}`);
      |           ^
  150 |   }
  151 | }
  152 |
 POST /api/clipperstream/transcribe 500 in 248ms
 ✓ Compiled in 226ms (414 modules)


___________
Session Storage Local Host 3000

state: {clips: [{id: "clip-1767293020350-jpsdbgs3b9cimz44hs19xc", createdAt: 1767293020350,…},…]},…}
state
: 
{clips: [{id: "clip-1767293020350-jpsdbgs3b9cimz44hs19xc", createdAt: 1767293020350,…},…]}
clips
: 
[{id: "clip-1767293020350-jpsdbgs3b9cimz44hs19xc", createdAt: 1767293020350,…},…]
0
: 
{id: "clip-1767293020350-jpsdbgs3b9cimz44hs19xc", createdAt: 1767293020350,…}
content
: 
"Conducting my first recording without any issues."
createdAt
: 
1767293020350
currentView
: 
"formatted"
date
: 
"Jan 1, 2026"
formattedText
: 
"Conducting my first recording without any issues."
id
: 
"clip-1767293020350-jpsdbgs3b9cimz44hs19xc"
rawText
: 
"Conducting my first recording without any issues."
status
: 
null
title
: 
"Successful First Recording Experience"
1
: 
{id: "clip-1767293045296-jmb98fj25", title: "Recording 01", date: "Jan 1, 2026", status: "failed",…}
audioId
: 
"audio-1767293045289-y69qx27vt"
content
: 
""
createdAt
: 
1767293045297
currentView
: 
"formatted"
date
: 
"Jan 1, 2026"
duration
: 
"0:06"
formattedText
: 
""
id
: 
"clip-1767293045296-jmb98fj25"
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
"Server rejected audio"
2
: 
{id: "clip-1767293045297-7gl1uwpe3y9", title: "Recording 01", date: "Jan 1, 2026", status: "failed",…}
audioId
: 
"audio-1767293045289-y69qx27vt"
content
: 
""
createdAt
: 
1767293045297
currentView
: 
"formatted"
date
: 
"Jan 1, 2026"
duration
: 
"0:06"
formattedText
: 
""
id
: 
"clip-1767293045297-7gl1uwpe3y9"
parentId
: 
"clip-1767293045296-jmb98fj25"
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

___________
All audio blobs from the past and current. Okay, not every single one of them may be relevant.

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
3	"audio-1767293016268-qgzdnufvu"	
{id: 'audio-1767293016268-qgzdnufvu', data: ArrayBuffer(45929), mimeType: 'audio/webm;codecs=opus', size: 45929, timestamp: 1767293016269}
data
: 
ArrayBuffer(45929)
id
: 
"audio-1767293016268-qgzdnufvu"
mimeType
: 
"audio/webm;codecs=opus"
size
: 
45929
timestamp
: 
1767293016269
4	"audio-1767293045289-y69qx27vt"	
{id: 'audio-1767293045289-y69qx27vt', data: ArrayBuffer(106317), mimeType: 'audio/webm;codecs=opus', size: 106317, timestamp: 1767293045291}
data
: 
ArrayBuffer(106317)
id
: 
"audio-1767293045289-y69qx27vt"
mimeType
: 
"audio/webm;codecs=opus"
size
: 
106317
timestamp
: 
1767293045291