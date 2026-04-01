[HMR] connected
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Migrating IndexedDB from v1 to v2: clearing old audio blobs
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Migration complete: old audio blobs cleared, new recordings will use ArrayBuffer format
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
ClipMasterScreen.tsx:1096 [ProcessChildren] Starting for parent: clip-1767268550310-775d07d6f | Children: 1
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
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Status transition ObjectclipId: "clip-1767268550310-775d07d6f"error: "Server rejected audio"from: "transcribing"to: "failed"trigger: "transcription-error"[[Prototype]]: Object
ClipMasterScreen.tsx:1191 [ProcessChildren] Completed parent: clip-1767268550310-775d07d6f
ClipMasterScreen.tsx:1242 [Auto-retry] Completed all parents
2hot-reloader-pages.js:207 [Fast Refresh] rebuilding
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
flushSyncWork$1 @ react-dom-client.development.js:14641
scheduleRefresh @ react-dom-client.development.js:113
eval @ react-refresh-runtime.development.js:265
performReactRefresh @ react-refresh-runtime.development.js:254
applyUpdate @ helpers.js:139
statusHandler @ helpers.js:156
setStatus @ webpack.js:498
(anonymous) @ webpack.js:667
Promise.then
internalApply @ webpack.js:650
hotApply @ webpack.js:598
eval @ hot-reloader-pages.js:373
Promise.then
tryApplyUpdatesWebpack @ hot-reloader-pages.js:364
handleSuccess @ hot-reloader-pages.js:115
processMessage @ hot-reloader-pages.js:244
eval @ hot-reloader-pages.js:72
handleMessage @ websocket.js:69Understand this error
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Status transition {clipId: 'clip-1767268550310-775d07d6f', from: 'transcribing', to: 'failed', trigger: 'transcription-error', error: 'Server rejected audio'}
report-hmr-latency.js:14 [Fast Refresh] done in 487ms
16hot-reloader-pages.js:207 [Fast Refresh] rebuilding
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) {clearedContext: true}
logger.ts:128 [Clipstream] [AudioStorage] [ERROR] Failed to open IndexedDB VersionError: The requested version (1) is less than the existing version (2).
nextJsHandleConsoleError @ pages-dev-overlay-setup.js:77
error @ logger.ts:128
request.onerror @ audioStorage.ts:30
IndexedDB
eval @ audioStorage.ts:27
initDB @ audioStorage.ts:26
storeAudio @ audioStorage.ts:60
useClipRecording.useCallback[startRecording] @ useClipRecording.ts:178Understand this error
logger.ts:128 [Clipstream] [useClipRecording] [ERROR] Failed to save audio to IndexedDB VersionError: The requested version (1) is less than the existing version (2).
nextJsHandleConsoleError @ pages-dev-overlay-setup.js:77
error @ logger.ts:128
useClipRecording.useCallback[startRecording] @ useClipRecording.ts:186Understand this error
logger.ts:113 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription {size: 43981, attempt: 1, source: 'retry-from-indexeddb'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Transcription successful {textLength: 50, preview: "Let's test an actual recording to see if it works...."}
ClipMasterScreen.tsx:843 [Formatting] Starting formatting for clip: clip-1767272788685-p00zbrsqjwg1qhuo4es6yq | isAppending: false
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Starting background title generation {clipId: 'clip-1767272788685-p00zbrsqjwg1qhuo4es6yq', textLength: 50}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] AI title generated, updating clip {clipId: 'clip-1767272788685-p00zbrsqjwg1qhuo4es6yq', title: 'Testing Voice Recording Functionality'}
ClipMasterScreen.tsx:864 [Formatting] Received formatted text for clip: clip-1767272788685-p00zbrsqjwg1qhuo4es6yq
ClipMasterScreen.tsx:877 [Formatting] Updated clip content in Zustand for clip: clip-1767272788685-p00zbrsqjwg1qhuo4es6yq
ClipMasterScreen.tsx:880 [Formatting] Calling setRecordNavState(complete) for clip: clip-1767272788685-p00zbrsqjwg1qhuo4es6yq
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Starting new recording (cleared pending context) {clearedContext: true}
logger.ts:128 [Clipstream] [AudioStorage] [ERROR] Failed to open IndexedDB VersionError: The requested version (1) is less than the existing version (2).
nextJsHandleConsoleError @ pages-dev-overlay-setup.js:77
error @ logger.ts:128
request.onerror @ audioStorage.ts:30
IndexedDB
eval @ audioStorage.ts:27
initDB @ audioStorage.ts:26
storeAudio @ audioStorage.ts:60
useClipRecording.useCallback[startRecording] @ useClipRecording.ts:178Understand this error
logger.ts:128 [Clipstream] [useClipRecording] [ERROR] Failed to save audio to IndexedDB VersionError: The requested version (1) is less than the existing version (2).
nextJsHandleConsoleError @ pages-dev-overlay-setup.js:77
error @ logger.ts:128
useClipRecording.useCallback[startRecording] @ useClipRecording.ts:186Understand this error
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Handling offline recording {audioId: null, duration: 3, currentClipId: null}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] No currentClipId → creating parent
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Created PARENT container for offline recording {parentId: 'clip-1767272806164-y0pfujcu9', title: 'Recording 02'}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Created FIRST CHILD for offline recording {childId: 'clip-1767272806165-lo81r7pqjpp', parentId: 'clip-1767272806164-y0pfujcu9', parentTitle: 'Recording 02', childTitle: 'Clip 001'}
logger.ts:113 [Clipstream] [useOfflineRecording] [DEBUG] First child created, Zustand selector will auto-update {firstChildId: 'clip-1767272806165-lo81r7pqjpp'}
ClipMasterScreen.tsx:1197 [Auto-retry] Going online, checking for pending clips
ClipMasterScreen.tsx:1207 [Auto-retry] No pending clips to process
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Recording from pending clip (adding successive recording) {clipId: 'clip-1767272806165-lo81r7pqjpp', pendingTitle: 'Clip 001'}
logger.ts:128 [Clipstream] [AudioStorage] [ERROR] Failed to open IndexedDB VersionError: The requested version (1) is less than the existing version (2).
nextJsHandleConsoleError @ pages-dev-overlay-setup.js:77
error @ logger.ts:128
request.onerror @ audioStorage.ts:30
IndexedDB
eval @ audioStorage.ts:27
initDB @ audioStorage.ts:26
storeAudio @ audioStorage.ts:60
useClipRecording.useCallback[startRecording] @ useClipRecording.ts:178Understand this error
logger.ts:128 [Clipstream] [useClipRecording] [ERROR] Failed to save audio to IndexedDB VersionError: The requested version (1) is less than the existing version (2).
nextJsHandleConsoleError @ pages-dev-overlay-setup.js:77
error @ logger.ts:128
useClipRecording.useCallback[startRecording] @ useClipRecording.ts:186Understand this error
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) {clearedContext: true}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Loaded parent with children {parentId: 'clip-1767272806164-y0pfujcu9', childCount: 1}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) {clearedContext: true}
logger.ts:128 [Clipstream] [AudioStorage] [ERROR] Failed to open IndexedDB VersionError: The requested version (1) is less than the existing version (2).
nextJsHandleConsoleError @ pages-dev-overlay-setup.js:77
error @ logger.ts:128
request.onerror @ audioStorage.ts:30
IndexedDB
eval @ audioStorage.ts:27
initDB @ audioStorage.ts:26
storeAudio @ audioStorage.ts:60
useClipRecording.useCallback[startRecording] @ useClipRecording.ts:178Understand this error
logger.ts:128 [Clipstream] [useClipRecording] [ERROR] Failed to save audio to IndexedDB VersionError: The requested version (1) is less than the existing version (2).
nextJsHandleConsoleError @ pages-dev-overlay-setup.js:77
error @ logger.ts:128
useClipRecording.useCallback[startRecording] @ useClipRecording.ts:186Understand this error
logger.ts:113 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription {size: 47877, attempt: 1, source: 'retry-from-indexeddb'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Transcription successful {textLength: 53, preview: "Let's now do a normal recording and see what happe..."}
ClipMasterScreen.tsx:843 [Formatting] Starting formatting for clip: clip-1767272847728-c1fg7d0e7yt163ca8jnh15 | isAppending: false
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Starting background title generation {clipId: 'clip-1767272847728-c1fg7d0e7yt163ca8jnh15', textLength: 53}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] AI title generated, updating clip {clipId: 'clip-1767272847728-c1fg7d0e7yt163ca8jnh15', title: 'Testing Normal Recording Functionality'}
ClipMasterScreen.tsx:864 [Formatting] Received formatted text for clip: clip-1767272847728-c1fg7d0e7yt163ca8jnh15
ClipMasterScreen.tsx:877 [Formatting] Updated clip content in Zustand for clip: clip-1767272847728-c1fg7d0e7yt163ca8jnh15
ClipMasterScreen.tsx:880 [Formatting] Calling setRecordNavState(complete) for clip: clip-1767272847728-c1fg7d0e7yt163ca8jnh15

____

Session storage localhost:3000

{state: {clips: [,…]}, version: 0}
state
: 
{clips: [,…]}
clips
: 
[,…]
0
: 
{id: "clip-1767268550310-775d07d6f", title: "Recording 01", date: "Jan 1, 2026", status: "failed",…}
audioId
: 
"audio-1767268550307-s7zi5aubw"
content
: 
""
createdAt
: 
1767268550310
currentView
: 
"formatted"
date
: 
"Jan 1, 2026"
duration
: 
"0:05"
formattedText
: 
""
id
: 
"clip-1767268550310-775d07d6f"
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
{id: "clip-1767268550310-5zenmoifd73", title: "Recording 01", date: "Jan 1, 2026", status: "failed",…}
audioId
: 
"audio-1767268550307-s7zi5aubw"
content
: 
""
createdAt
: 
1767268550310
currentView
: 
"formatted"
date
: 
"Jan 1, 2026"
duration
: 
"0:05"
formattedText
: 
""
id
: 
"clip-1767268550310-5zenmoifd73"
parentId
: 
"clip-1767268550310-775d07d6f"
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
2
: 
{id: "clip-1767272788685-p00zbrsqjwg1qhuo4es6yq", createdAt: 1767272788685,…}
content
: 
"Let's test an actual recording to see if it works."
createdAt
: 
1767272788685
currentView
: 
"formatted"
date
: 
"Jan 1, 2026"
formattedText
: 
"Let's test an actual recording to see if it works."
id
: 
"clip-1767272788685-p00zbrsqjwg1qhuo4es6yq"
rawText
: 
"Let's test an actual recording to see if it works."
status
: 
null
title
: 
"Testing Voice Recording Functionality"
3
: 
{id: "clip-1767272806164-y0pfujcu9", title: "Recording 02", date: "Jan 1, 2026", status: null,…}
content
: 
""
createdAt
: 
1767272806164
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
"clip-1767272806164-y0pfujcu9"
rawText
: 
""
status
: 
null
title
: 
"Recording 02"
4
: 
{id: "clip-1767272806165-lo81r7pqjpp", title: "Recording 02", date: "Jan 1, 2026",…}
5
: 
{id: "clip-1767272847728-c1fg7d0e7yt163ca8jnh15", createdAt: 1767272847728,…}
content
: 
"Let's now do a normal recording and see what happens."
createdAt
: 
1767272847728
currentView
: 
"formatted"
date
: 
"Jan 1, 2026"
formattedText
: 
"Let's now do a normal recording and see what happens."
id
: 
"clip-1767272847728-c1fg7d0e7yt163ca8jnh15"
rawText
: 
"Let's now do a normal recording and see what happens."
status
: 
null
title
: 
"Testing Normal Recording Functionality"
version
: 
0




____________

I've put down the details you requested from the audio blob which is inside indexDB so you can check the format whether it's ArrayBuffer or the previous.

0	"audio-1767268550307-s7zi5aubw"	
{id: 'audio-1767268550307-s7zi5aubw', data: ArrayBuffer(90733), mimeType: 'audio/webm;codecs=opus', size: 90733, timestamp: 1767268550309}
data
: 
ArrayBuffer(90733)
byteLength
: 
90733
detached
: 
false
maxByteLength
: 
90733
resizable
: 
false
[[Int8Array]]
: 
Int8Array(90733)
[0 … 9999]
[10000 … 19999]
[20000 … 29999]
[30000 … 39999]
[40000 … 49999]
[50000 … 59999]
[60000 … 69999]
[70000 … 79999]
[80000 … 89999]
[90000 … 90732]
buffer
: 
ArrayBuffer(90733)
byteLength
: 
90733
byteOffset
: 
0
length
: 
90733
Symbol(Symbol.toStringTag)
: 
"Int8Array"
[[Prototype]]
: 
TypedArray
[[Uint8Array]]
: 
Uint8Array(90733)
[[ArrayBufferByteLength]]
: 
90733
[[ArrayBufferData]]
: 
14
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
