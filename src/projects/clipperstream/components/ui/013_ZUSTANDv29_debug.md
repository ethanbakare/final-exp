[Clipstream] [AudioStorage] [DEBUG] IndexedDB initialized successfully
VM6:63 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB Object
VM6:63 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB Object
VM6:63 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription Object
VM6:63 [Clipstream] [useClipRecording] [INFO] Transcription successful Object
VM6:63 [Formatting] Starting formatting for clip: clip-1767300084527-0rx8q4icyt5dmgs0g5fwkv | isAppending: false
VM6:63 [Clipstream] [ClipMasterScreen] [DEBUG] Starting background title generation Object
VM6:63 [Clipstream] [ClipMasterScreen] [INFO] AI title generated, updating clip Object
VM6:63 [Formatting] Received formatted text for clip: clip-1767300084527-0rx8q4icyt5dmgs0g5fwkv
VM6:63 [Formatting] Updated clip content in Zustand for clip: clip-1767300084527-0rx8q4icyt5dmgs0g5fwkv
VM6:63 [Formatting] Calling setRecordNavState(complete) for clip: clip-1767300084527-0rx8q4icyt5dmgs0g5fwkv
VM6:63 [Clipstream] [ClipMasterScreen] [INFO] Starting new recording (cleared pending context) Object
VM6:63 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB Object
VM6:63 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB Object
VM6:63 [Clipstream] [useOfflineRecording] [INFO] Handling offline recording Object
VM6:63 [Clipstream] [useOfflineRecording] [INFO] No currentClipId → creating parent
VM6:63 [Clipstream] [useOfflineRecording] [INFO] Created PARENT container for offline recording Object
VM6:63 [Clipstream] [useOfflineRecording] [INFO] Created FIRST CHILD for offline recording Object
VM6:63 [Clipstream] [useOfflineRecording] [DEBUG] First child created, Zustand selector will auto-update Object
VM6:63 [Auto-retry] Going online, checking for pending clips
VM6:63 [Auto-retry] Processing 1 parents with pending clips
VM6:63 [Auto-retry] Processing parent: Recording 01 | Children: 1
VM6:63 [ProcessChildren] Starting for parent: clip-1767300115075-11ijuk6fn | Children: 1
VM6:63 [ProcessChildren] Processing FIRST child: Clip 001
VM6:63 [ProcessChild] Starting: Clip 001
VM6:63 [Clipstream] [AudioStorage] [DEBUG] 🔬 ARRAYBUFFER CONTENT VERIFICATION Object
VM6:63 [Clipstream] [AudioStorage] [INFO] ✅ VALID WEBM DATA - ArrayBuffer contains valid WebM magic bytes Object
VM6:63 [Clipstream] [AudioStorage] [DEBUG] Audio retrieved from IndexedDB Object
VM6:63 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription Object
:3000/api/clipperstream/transcribe:1  Failed to load resource: the server responded with a status of 500 (Internal Server Error)Understand this error
VM6:63 [Clipstream] [useClipRecording] [ERROR] Transcription failed Objectattempt: 1error: Error: Server error 500: Transcription failed
    at useClipRecording.useCallback[transcribeRecording] (webpack-internal:///(pages-dir-browser)/./src/projects/clipperstream/hooks/useClipRecording.ts:312:27)
    at async ClipMasterScreen.useCallback[processChild] (webpack-internal:///(pages-dir-browser)/./src/projects/clipperstream/components/ui/ClipMasterScreen.tsx:1016:45)
    at async ClipMasterScreen.useCallback[processParentChildren] (webpack-internal:///(pages-dir-browser)/./src/projects/clipperstream/components/ui/ClipMasterScreen.tsx:1105:32)
    at async ClipMasterScreen.useEffect.handleOnline (webpack-internal:///(pages-dir-browser)/./src/projects/clipperstream/components/ui/ClipMasterScreen.tsx:1226:25)[[Prototype]]: Object
console.<computed> @ VM6:63
console.<computed> @ VM7:63
nextJsHandleConsoleError @ pages-dev-overlay-setup.js:77
error @ logger.ts:128
useClipRecording.useCallback[transcribeRecording] @ useClipRecording.ts:387
VM6:63 [Clipstream] [useClipRecording] [ERROR] Server rejection (definitive failure) Object
console.<computed> @ VM6:63
console.<computed> @ VM7:63
nextJsHandleConsoleError @ pages-dev-overlay-setup.js:77
error @ logger.ts:128
useClipRecording.useCallback[transcribeRecording] @ useClipRecording.ts:402
VM6:63 [ProcessChild] Transcription failed: Clip 001
console.<computed> @ VM6:63
console.<computed> @ VM7:63
ClipMasterScreen.useCallback[processChild] @ ClipMasterScreen.tsx:1022
VM6:63 [Clipstream] [ClipMasterScreen] [ERROR] Definitive transcription failure Objecterror: "Server rejected audio"[[Prototype]]: Object
console.<computed> @ VM6:63
console.<computed> @ VM7:63
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
VM6:63 [Clipstream] [ClipMasterScreen] [INFO] Status transition Object
VM6:63 [ProcessChildren] Completed parent: clip-1767300115075-11ijuk6fn
VM6:63 [Auto-retry] Completed all parents



_______________

Session storage, local host 3000.

{state: {clips: [{id: "clip-1767300084527-0rx8q4icyt5dmgs0g5fwkv", createdAt: 1767300084527,…},…]},…}
state
: 
{clips: [{id: "clip-1767300084527-0rx8q4icyt5dmgs0g5fwkv", createdAt: 1767300084527,…},…]}
clips
: 
[{id: "clip-1767300084527-0rx8q4icyt5dmgs0g5fwkv", createdAt: 1767300084527,…},…]
0
: 
{id: "clip-1767300084527-0rx8q4icyt5dmgs0g5fwkv", createdAt: 1767300084527,…}
content
: 
"Test one two three. Let's see how it goes."
createdAt
: 
1767300084527
currentView
: 
"formatted"
date
: 
"Jan 1, 2026"
formattedText
: 
"Test one two three. Let's see how it goes."
id
: 
"clip-1767300084527-0rx8q4icyt5dmgs0g5fwkv"
rawText
: 
"Test one two three. Let's see how it goes."
status
: 
null
title
: 
"Voice Test: Initial Sound Check"
1
: 
{id: "clip-1767300115075-11ijuk6fn", title: "Recording 01", date: "Jan 1, 2026", status: "failed",…}
audioId
: 
"audio-1767300115071-etttbkchj"
content
: 
""
createdAt
: 
1767300115075
currentView
: 
"formatted"
date
: 
"Jan 1, 2026"
duration
: 
"0:08"
formattedText
: 
""
id
: 
"clip-1767300115075-11ijuk6fn"
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
{id: "clip-1767300115076-ae4hp78zn2c", title: "Recording 01", date: "Jan 1, 2026", status: "failed",…}
audioId
: 
"audio-1767300115071-etttbkchj"
content
: 
""
createdAt
: 
1767300115076
currentView
: 
"formatted"
date
: 
"Jan 1, 2026"
duration
: 
"0:08"
formattedText
: 
""
id
: 
"clip-1767300115076-ae4hp78zn2c"
parentId
: 
"clip-1767300115075-11ijuk6fn"
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


__________
View from terminal.

[Clipstream] [API/generate-title] [DEBUG] Request received { method: 'POST' }
[Clipstream] [API/generate-title] [DEBUG] API key check { hasKey: true }
[Clipstream] [API/generate-title] [DEBUG] Processing transcription { length: 42 }
[Clipstream] [API/generate-title] [DEBUG] Calling title generator service
[Clipstream] [TitleGenerator] [DEBUG] Starting title generation { transcriptionLength: 42, hasApiKey: true }
[Clipstream] [TitleGenerator] [DEBUG] Creating OpenAI client
[Clipstream] [TitleGenerator] [DEBUG] Calling OpenAI generateText API
[Clipstream] [API/format-text] [DEBUG] Request received { method: 'POST' }
[Clipstream] [API/format-text] [DEBUG] API key check { hasKey: true }
[Clipstream] [API/format-text] [DEBUG] Calling formatter service { rawLength: 42, hasContext: false }
[Clipstream] [TextFormatter] [DEBUG] Starting text formatting { rawLength: 42, hasContext: false }
[Clipstream] [TextFormatter] [DEBUG] Calling OpenAI generateText API
[Clipstream] [TitleGenerator] [INFO] Title generated successfully { title: 'Voice Test: Initial Sound Check' }
[Clipstream] [API/generate-title] [INFO] Title generated successfully { title: 'Voice Test: Initial Sound Check' }
 POST /api/clipperstream/generate-title 200 in 2347ms
[Clipstream] [TextFormatter] [INFO] Text formatted successfully { rawLength: 42, formattedLength: 42 }
[Clipstream] [API/format-text] [INFO] Text formatted successfully
 POST /api/clipperstream/format-text 200 in 2382ms
Files received: [ 'audio' ]
=== 🔬 SERVER AUDIO VERIFICATION ===
File path: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/dn6v9uuz6xg08k1c7l44kousw
Size: 132607 bytes
MIME type: audio/webm;codecs=opus
Is valid WebM: ✅ YES
First 64 bytes (hex): 1a 45 df a3 9f 42 86 81 01 42 f7 81 01 42 f2 81 04 42 f3 81 08 42 82 84 77 65 62 6d 42 87 81 04 42 85 81 02 18 53 80 67 01 ff ff ff ff ff ff ff 15 49 a9 66 99 2a d7 b1 83 0f 42 40 4d 80 86 43
Expected WebM header: 1a 45 df a3
====================================
Processing audio file: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/dn6v9uuz6xg08k1c7l44kousw, size: 132607 bytes, type: audio/webm;codecs=opus
=== 🎯 DEEPGRAM DIRECT REST API CALL ===
Audio size: 132607 bytes
MIME type: audio/webm;codecs=opus
Using direct fetch (bypassing SDK)
=== 🔬 DEEPGRAM API ERROR DETAILS ===
Error object: TypeError: fetch failed
    at async transcribeAudio (src/projects/clipperstream/api/deepgramProvider.ts:100:22)
    at async handler (src/pages/api/clipperstream/transcribe.ts:176:20)
   98 |     // ========================================
   99 |     
> 100 |     const response = await fetch(
      |                      ^
  101 |       'https://api.deepgram.com/v1/listen?model=nova-3&language=en-US&smart_format=true&punctuate=true&diarize=false&utterances=false',
  102 |       {
  103 |         method: 'POST', {
  [cause]: [Error: getaddrinfo ENOTFOUND api.deepgram.com] {
    errno: -3008,
    code: 'ENOTFOUND',
    syscall: 'getaddrinfo',
    hostname: 'api.deepgram.com'
  }
}
Error type: TypeError
Error message: fetch failed
Error properties: {
  name: 'TypeError',
  code: undefined,
  status: undefined,
  statusCode: undefined,
  errno: undefined,
  syscall: undefined,
  cause: [Error: getaddrinfo ENOTFOUND api.deepgram.com] {
    errno: -3008,
    code: 'ENOTFOUND',
    syscall: 'getaddrinfo',
    hostname: 'api.deepgram.com'
  },
  stack: [
    'TypeError: fetch failed',
    '    at node:internal/deps/undici/undici:13185:13',
    '    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)',
    '    at async transcribeAudio (webpack-internal:///(api-node)/./src/projects/clipperstream/api/deepgramProvider.ts:72:26)',
    '    at async handler (webpack-internal:///(api-node)/./src/pages/api/clipperstream/transcribe.ts:134:24)'
  ]
}
⚠️ This is a FETCH-related error
=====================================
Error processing audio: Error: Transcription failed: fetch failed
    at transcribeAudio (src/projects/clipperstream/api/deepgramProvider.ts:284:11)
    at async handler (src/pages/api/clipperstream/transcribe.ts:176:20)
  282 |     
  283 |     // Generic fallback with original error message
> 284 |     throw new Error(`Transcription failed: ${errorMessage}`);
      |           ^
  285 |   }
  286 | }
  287 |
 POST /api/clipperstream/transcribe 500 in 187ms
