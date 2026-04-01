[HMR] connected
logger.ts:113 [Clipstream] [AudioStorage] [DEBUG] IndexedDB initialized successfully
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB {audioId: 'audio-1767235040618-936057n7s', size: 189099, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB {audioId: 'audio-1767235040618-936057n7s', size: 189099, type: 'audio/webm;codecs=opus'}
logger.ts:113 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription {size: 189099, attempt: 1, source: 'retry-from-indexeddb'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Transcription successful {textLength: 160, preview: "The new year has finally begun, and we've got to m..."}
ClipMasterScreen.tsx:843 [Formatting] Starting formatting for clip: clip-1767235044603-d6o22lkjmc6q87fwks1o9 | isAppending: false
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Starting background title generation {clipId: 'clip-1767235044603-d6o22lkjmc6q87fwks1o9', textLength: 160}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] AI title generated, updating clip {clipId: 'clip-1767235044603-d6o22lkjmc6q87fwks1o9', title: 'Embracing Change for the New Year'}
ClipMasterScreen.tsx:864 [Formatting] Received formatted text for clip: clip-1767235044603-d6o22lkjmc6q87fwks1o9
ClipMasterScreen.tsx:877 [Formatting] Updated clip content in Zustand for clip: clip-1767235044603-d6o22lkjmc6q87fwks1o9
ClipMasterScreen.tsx:880 [Formatting] Calling setRecordNavState(complete) for clip: clip-1767235044603-d6o22lkjmc6q87fwks1o9
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Structure toggle clicked {clipId: 'clip-1767235044603-d6o22lkjmc6q87fwks1o9', currentView: 'formatted'}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] View toggled {clipId: 'clip-1767235044603-d6o22lkjmc6q87fwks1o9', newView: 'raw'}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Structure toggle clicked {clipId: 'clip-1767235044603-d6o22lkjmc6q87fwks1o9', currentView: 'raw'}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] View toggled {clipId: 'clip-1767235044603-d6o22lkjmc6q87fwks1o9', newView: 'formatted'}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) {clearedContext: true}
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB {audioId: 'audio-1767235070997-1vl9dr0ag', size: 115075, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB {audioId: 'audio-1767235070997-1vl9dr0ag', size: 115075, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Handling offline recording {audioId: 'audio-1767235070997-1vl9dr0ag', duration: 7, currentClipId: null}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] No currentClipId → creating parent
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Created PARENT container for offline recording {parentId: 'clip-1767235071000-v3nmbeeun', title: 'Recording 01'}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Created FIRST CHILD for offline recording {childId: 'clip-1767235071000-b6r18jsr3ul', parentId: 'clip-1767235071000-v3nmbeeun', parentTitle: 'Recording 01', childTitle: 'Clip 001'}
logger.ts:113 [Clipstream] [useOfflineRecording] [DEBUG] First child created, Zustand selector will auto-update {firstChildId: 'clip-1767235071000-b6r18jsr3ul'}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) {clearedContext: true}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Loaded parent with children {parentId: 'clip-1767235071000-v3nmbeeun', childCount: 1}
ClipMasterScreen.tsx:1197 [Auto-retry] Going online, checking for pending clips
ClipMasterScreen.tsx:1219 [Auto-retry] Processing 1 parents with pending clips
ClipMasterScreen.tsx:1236 [Auto-retry] Processing parent: Recording 01 | Children: 1
ClipMasterScreen.tsx:1096 [ProcessChildren] Starting for parent: clip-1767235071000-v3nmbeeun | Children: 1
ClipMasterScreen.tsx:1108 [ProcessChildren] Processing FIRST child: Clip 001
ClipMasterScreen.tsx:994 [ProcessChild] Starting: Clip 001
logger.ts:113 [Clipstream] [AudioStorage] [DEBUG] Audio retrieved from IndexedDB {audioId: 'audio-1767235070997-1vl9dr0ag', size: 115075}
logger.ts:113 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription {size: 115075, attempt: 1, source: 'retry-from-indexeddb'}
useClipRecording.ts:352  POST http://localhost:3000/api/clipperstream/transcribe 500 (Internal Server Error)
useClipRecording.useCallback[transcribeRecording] @ useClipRecording.ts:352
ClipMasterScreen.useCallback[processChild] @ ClipMasterScreen.tsx:1018
await in ClipMasterScreen.useCallback[processChild]
ClipMasterScreen.useCallback[processParentChildren] @ ClipMasterScreen.tsx:1111
ClipMasterScreen.useEffect.handleOnline @ ClipMasterScreen.tsx:1239Understand this error
logger.ts:128 [Clipstream] [useClipRecording] [ERROR] Transcription failed {error: Error: Server error 500: Transcription failed
    at useClipRecording.useCallback[transcribeRecordi…, attempt: 1}attempt: 1error: Error: Server error 500: Transcription failed
    at useClipRecording.useCallback[transcribeRecording] (webpack-internal:///(pages-dir-browser)/./src/projects/clipperstream/hooks/useClipRecording.ts:312:27)
    at async ClipMasterScreen.useCallback[processChild] (webpack-internal:///(pages-dir-browser)/./src/projects/clipperstream/components/ui/ClipMasterScreen.tsx:1016:45)
    at async ClipMasterScreen.useCallback[processParentChildren] (webpack-internal:///(pages-dir-browser)/./src/projects/clipperstream/components/ui/ClipMasterScreen.tsx:1105:32)
    at async ClipMasterScreen.useEffect.handleOnline (webpack-internal:///(pages-dir-browser)/./src/projects/clipperstream/components/ui/ClipMasterScreen.tsx:1226:25)message: "Server error 500: Transcription failed"stack: "Error: Server error 500: Transcription failed\n    at useClipRecording.useCallback[transcribeRecording] (webpack-internal:///(pages-dir-browser)/./src/projects/clipperstream/hooks/useClipRecording.ts:312:27)\n    at async ClipMasterScreen.useCallback[processChild] (webpack-internal:///(pages-dir-browser)/./src/projects/clipperstream/components/ui/ClipMasterScreen.tsx:1016:45)\n    at async ClipMasterScreen.useCallback[processParentChildren] (webpack-internal:///(pages-dir-browser)/./src/projects/clipperstream/components/ui/ClipMasterScreen.tsx:1105:32)\n    at async ClipMasterScreen.useEffect.handleOnline (webpack-internal:///(pages-dir-browser)/./src/projects/clipperstream/components/ui/ClipMasterScreen.tsx:1226:25)"[[Prototype]]: Objectconstructor: ƒ Error()message: ""name: "Error"toString: ƒ toString()[[Prototype]]: Object[[Prototype]]: Object
nextJsHandleConsoleError @ pages-dev-overlay-setup.js:77
error @ logger.ts:128
useClipRecording.useCallback[transcribeRecording] @ useClipRecording.ts:387
await in useClipRecording.useCallback[transcribeRecording]
ClipMasterScreen.useCallback[processChild] @ ClipMasterScreen.tsx:1018
await in ClipMasterScreen.useCallback[processChild]
ClipMasterScreen.useCallback[processParentChildren] @ ClipMasterScreen.tsx:1111
ClipMasterScreen.useEffect.handleOnline @ ClipMasterScreen.tsx:1239Understand this error
logger.ts:128 [Clipstream] [useClipRecording] [ERROR] Server rejection (definitive failure) {errorMessage: 'Server error 500: Transcription failed', retriesAttempted: 1}errorMessage: "Server error 500: Transcription failed"retriesAttempted: 1[[Prototype]]: Object
nextJsHandleConsoleError @ pages-dev-overlay-setup.js:77
error @ logger.ts:128
useClipRecording.useCallback[transcribeRecording] @ useClipRecording.ts:402
await in useClipRecording.useCallback[transcribeRecording]
ClipMasterScreen.useCallback[processChild] @ ClipMasterScreen.tsx:1018
await in ClipMasterScreen.useCallback[processChild]
ClipMasterScreen.useCallback[processParentChildren] @ ClipMasterScreen.tsx:1111
ClipMasterScreen.useEffect.handleOnline @ ClipMasterScreen.tsx:1239Understand this error
ClipMasterScreen.tsx:1022 [ProcessChild] Transcription failed: Clip 001
ClipMasterScreen.useCallback[processChild] @ ClipMasterScreen.tsx:1022
await in ClipMasterScreen.useCallback[processChild]
ClipMasterScreen.useCallback[processParentChildren] @ ClipMasterScreen.tsx:1111
ClipMasterScreen.useEffect.handleOnline @ ClipMasterScreen.tsx:1239Understand this warning
logger.ts:128 [Clipstream] [ClipMasterScreen] [ERROR] Definitive transcription failure {error: 'Server rejected audio'}
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
eval @ react-dom-client.development.js:15963Understand this error
ClipMasterScreen.tsx:1191 [ProcessChildren] Completed parent: clip-1767235071000-v3nmbeeun
ClipMasterScreen.tsx:1242 [Auto-retry] Completed all parents


_________________

Session storage localhost:3000

{state: {clips: [{id: "clip-1767235044603-d6o22lkjmc6q87fwks1o9", createdAt: 1767235044603,…},…]},…}
state
: 
{clips: [{id: "clip-1767235044603-d6o22lkjmc6q87fwks1o9", createdAt: 1767235044603,…},…]}
clips
: 
[{id: "clip-1767235044603-d6o22lkjmc6q87fwks1o9", createdAt: 1767235044603,…},…]
0
: 
{id: "clip-1767235044603-d6o22lkjmc6q87fwks1o9", createdAt: 1767235044603,…}
content
: 
"The new year has finally begun, and we've got to make a change—something in which you yourself will be surprised at how far you've come by the end of the year."
createdAt
: 
1767235044603
currentView
: 
"formatted"
date
: 
"Jan 1, 2026"
formattedText
: 
"The new year has finally begun, and we've got to make a change—something in which you yourself will be surprised at how far you've come by the end of the year."
id
: 
"clip-1767235044603-d6o22lkjmc6q87fwks1o9"
rawText
: 
"The new year has finally begun, and we've got to make a change, something in which you yourself will be surprised at how far you've come by the end of the year."
status
: 
null
title
: 
"Embracing Change for the New Year"
1
: 
{id: "clip-1767235071000-v3nmbeeun", title: "Recording 01", date: "Jan 1, 2026", status: null,…}
content
: 
""
createdAt
: 
1767235071000
currentView
: 
"formatted"
date
: 
"Jan 1, 2026"
id
: 
"clip-1767235071000-v3nmbeeun"
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
{id: "clip-1767235071000-b6r18jsr3ul", title: "Recording 01", date: "Jan 1, 2026", status: "failed",…}
audioId
: 
"audio-1767235070997-1vl9dr0ag"
content
: 
""
createdAt
: 
1767235071000
currentView
: 
"formatted"
date
: 
"Jan 1, 2026"
duration
: 
"0:07"
id
: 
"clip-1767235071000-b6r18jsr3ul"
parentId
: 
"clip-1767235071000-v3nmbeeun"
pendingClipTitle
: 
"Clip 001"
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

________________________________________________________________________________________________________________________________


Experiment 2: A repeat of experiment 1 to double-check the error is legit.

[HMR] connected
logger.ts:113 [Clipstream] [AudioStorage] [DEBUG] IndexedDB initialized successfully
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB Object
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB Object
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Handling offline recording Object
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] No currentClipId → creating parent
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Created PARENT container for offline recording Object
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Created FIRST CHILD for offline recording Object
logger.ts:113 [Clipstream] [useOfflineRecording] [DEBUG] First child created, Zustand selector will auto-update Object
ClipMasterScreen.tsx:1197 [Auto-retry] Going online, checking for pending clips
ClipMasterScreen.tsx:1219 [Auto-retry] Processing 1 parents with pending clips
ClipMasterScreen.tsx:1236 [Auto-retry] Processing parent: Recording 01 | Children: 1
ClipMasterScreen.tsx:1096 [ProcessChildren] Starting for parent: clip-1767235563088-us66vpomp | Children: 1
ClipMasterScreen.tsx:1108 [ProcessChildren] Processing FIRST child: Clip 001
ClipMasterScreen.tsx:994 [ProcessChild] Starting: Clip 001
logger.ts:113 [Clipstream] [AudioStorage] [DEBUG] Audio retrieved from IndexedDB Object
logger.ts:113 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription Object
:3000/api/clipperstream/transcribe:1  Failed to load resource: the server responded with a status of 500 (Internal Server Error)Understand this error
pages-dev-overlay-setup.js:77 [Clipstream] [useClipRecording] [ERROR] Transcription failed Object
nextJsHandleConsoleError @ pages-dev-overlay-setup.js:77Understand this error
pages-dev-overlay-setup.js:77 [Clipstream] [useClipRecording] [ERROR] Server rejection (definitive failure) Object
nextJsHandleConsoleError @ pages-dev-overlay-setup.js:77Understand this error
ClipMasterScreen.tsx:1022 [ProcessChild] Transcription failed: Clip 001
ClipMasterScreen.useCallback[processChild] @ ClipMasterScreen.tsx:1022Understand this warning
pages-dev-overlay-setup.js:77 [Clipstream] [ClipMasterScreen] [ERROR] Definitive transcription failure Object
nextJsHandleConsoleError @ pages-dev-overlay-setup.js:77Understand this error
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Status transition Object
ClipMasterScreen.tsx:1191 [ProcessChildren] Completed parent: clip-1767235563088-us66vpomp
ClipMasterScreen.tsx:1242 [Auto-retry] Completed all parents
_____
Session storage localhost:3000 for experiment 2

{state: {clips: [,…]}, version: 0}
state
: 
{clips: [,…]}
clips
: 
[,…]
0
: 
{id: "clip-1767235563088-us66vpomp", title: "Recording 01", date: "Jan 1, 2026", status: "failed",…}
audioId
: 
"audio-1767235563087-5kcbocjrf"
content
: 
""
createdAt
: 
1767235563089
currentView
: 
"formatted"
date
: 
"Jan 1, 2026"
duration
: 
"0:07"
id
: 
"clip-1767235563088-us66vpomp"
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
1
: 
{id: "clip-1767235563089-6mfvi0fs3nh", title: "Recording 01", date: "Jan 1, 2026", status: "failed",…}
audioId
: 
"audio-1767235563087-5kcbocjrf"
content
: 
""
createdAt
: 
1767235563089
currentView
: 
"formatted"
date
: 
"Jan 1, 2026"
duration
: 
"0:07"
id
: 
"clip-1767235563089-6mfvi0fs3nh"
parentId
: 
"clip-1767235563088-us66vpomp"
pendingClipTitle
: 
"Clip 001"
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