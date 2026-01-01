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

____
Sasson Storage Localhost 3000

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
version
: 
0