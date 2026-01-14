Download the React DevTools for a better development experience: https://react.dev/link/react-devtools
websocket.js:46 [HMR] connected
logger.ts:113 [Clipstream] [AudioStorage] [DEBUG] IndexedDB initialized successfully
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB {audioId: 'audio-1767938252705-7lzzj6zt9', size: 45615, mimeType: 'audio/webm;codecs=opus', format: 'v2-ArrayBuffer'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB {audioId: 'audio-1767938252705-7lzzj6zt9', size: 45615, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [TranscriptionRetry] [INFO] Rapid attempt {attempt: 1, max: 3}
logger.ts:119 [Clipstream] [TranscriptionRetry] [INFO] Transcription succeeded {attempt: 1}
ClipMasterScreen.tsx:1166 [Formatting] Starting formatting for clip: clip-1767938254018-7vkrd589n17xwjharb9djo | isAppending: false
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Starting background title generation {clipId: 'clip-1767938254018-7vkrd589n17xwjharb9djo', textLength: 22}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] AI title generated, updating clip {clipId: 'clip-1767938254018-7vkrd589n17xwjharb9djo', title: "Introduction of Ethan's Voice Note"}
ClipMasterScreen.tsx:1187 [Formatting] Received formatted text for clip: clip-1767938254018-7vkrd589n17xwjharb9djo
ClipMasterScreen.tsx:1200 [Formatting] Updated clip content in Zustand for clip: clip-1767938254018-7vkrd589n17xwjharb9djo
ClipMasterScreen.tsx:1203 [Formatting] Calling setRecordNavState(complete) for clip: clip-1767938254018-7vkrd589n17xwjharb9djo
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) {clearedContext: true}
useAutoRetry.ts:50 [Auto-Retry] Went offline, retries will pause
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB {audioId: 'audio-1767938277452-78tmnc3qb', size: 86837, mimeType: 'audio/webm;codecs=opus', format: 'v2-ArrayBuffer'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB {audioId: 'audio-1767938277452-78tmnc3qb', size: 86837, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Handling offline recording {audioId: 'audio-1767938277452-78tmnc3qb', duration: 5, currentClipId: null}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] No currentClipId → creating parent
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Created PARENT container for offline recording {parentId: 'clip-1767938277454-5s682qspc', title: 'Recording 01'}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Created FIRST CHILD for offline recording {childId: 'clip-1767938277455-kkklmel0r59', parentId: 'clip-1767938277454-5s682qspc', parentTitle: 'Recording 01', childTitle: 'Clip 001'}
logger.ts:113 [Clipstream] [useOfflineRecording] [DEBUG] First child created, Zustand selector will auto-update {firstChildId: 'clip-1767938277455-kkklmel0r59'}
useAutoRetry.ts:29 [Auto-Retry] Came online
useAutoRetry.ts:39 [Auto-Retry] Pending clips detected, starting retry
ClipMasterScreen.tsx:469 [ProcessPending] Starting
ClipMasterScreen.tsx:488 [ProcessPending] Found 1 parents
ClipMasterScreen.tsx:510 [ProcessPending] Processing Recording 01 | Clip 001
logger.ts:113 [Clipstream] [AudioStorage] [DEBUG] 🔬 ARRAYBUFFER CONTENT VERIFICATION {audioId: 'audio-1767938277452-78tmnc3qb', isValidWebM: true, first16Bytes: '1a 45 df a3 9f 42 86 81 01 42 f7 81 01 42 f2 81', expectedHeader: '1a 45 df a3 ...', totalBytes: 86837, …}
logger.ts:119 [Clipstream] [AudioStorage] [INFO] ✅ VALID WEBM DATA - ArrayBuffer contains valid WebM magic bytes {audioId: 'audio-1767938277452-78tmnc3qb', first4Bytes: '1a 45 df a3'}
logger.ts:113 [Clipstream] [AudioStorage] [DEBUG] Audio retrieved from IndexedDB {audioId: 'audio-1767938277452-78tmnc3qb', size: 86837, mimeType: 'audio/webm;codecs=opus', format: 'v2-ArrayBuffer', storedSize: 86837, …}
logger.ts:119 [Clipstream] [TranscriptionRetry] [INFO] Rapid attempt {attempt: 1, max: 3}
ClipMasterScreen.tsx:571 [ProcessPending] Attempt 1/3
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) {clearedContext: true}
transcriptionRetry.ts:173  POST http://localhost:3000/api/clipperstream/transcribe 500 (Internal Server Error)
transcribeSingle @ transcriptionRetry.ts:173
attemptTranscription @ transcriptionRetry.ts:58
ClipMasterScreen.useCallback[processAllPendingClips] @ ClipMasterScreen.tsx:567
await in ClipMasterScreen.useCallback[processAllPendingClips]
useAutoRetry.useEffect.handleOnline @ useAutoRetry.ts:40Understand this error
logger.ts:124 [Clipstream] [TranscriptionRetry] [WARN] API down detected {attempt: 1}
warn @ logger.ts:124
attemptTranscription @ transcriptionRetry.ts:75
await in attemptTranscription
ClipMasterScreen.useCallback[processAllPendingClips] @ ClipMasterScreen.tsx:567
await in ClipMasterScreen.useCallback[processAllPendingClips]
useAutoRetry.useEffect.handleOnline @ useAutoRetry.ts:40Understand this warning
logger.ts:119 [Clipstream] [TranscriptionRetry] [INFO] Rapid attempt {attempt: 2, max: 3}
ClipMasterScreen.tsx:571 [ProcessPending] Attempt 2/3
transcriptionRetry.ts:173  POST http://localhost:3000/api/clipperstream/transcribe 500 (Internal Server Error)
transcribeSingle @ transcriptionRetry.ts:173
attemptTranscription @ transcriptionRetry.ts:58
await in attemptTranscription
ClipMasterScreen.useCallback[processAllPendingClips] @ ClipMasterScreen.tsx:567
await in ClipMasterScreen.useCallback[processAllPendingClips]
useAutoRetry.useEffect.handleOnline @ useAutoRetry.ts:40Understand this error
logger.ts:124 [Clipstream] [TranscriptionRetry] [WARN] API down detected {attempt: 2}
warn @ logger.ts:124
attemptTranscription @ transcriptionRetry.ts:75
await in attemptTranscription
ClipMasterScreen.useCallback[processAllPendingClips] @ ClipMasterScreen.tsx:567
await in ClipMasterScreen.useCallback[processAllPendingClips]
useAutoRetry.useEffect.handleOnline @ useAutoRetry.ts:40Understand this warning
logger.ts:119 [Clipstream] [TranscriptionRetry] [INFO] Rapid attempt {attempt: 3, max: 3}
ClipMasterScreen.tsx:571 [ProcessPending] Attempt 3/3
transcriptionRetry.ts:173  POST http://localhost:3000/api/clipperstream/transcribe 500 (Internal Server Error)
transcribeSingle @ transcriptionRetry.ts:173
attemptTranscription @ transcriptionRetry.ts:58
await in attemptTranscription
ClipMasterScreen.useCallback[processAllPendingClips] @ ClipMasterScreen.tsx:567
await in ClipMasterScreen.useCallback[processAllPendingClips]
useAutoRetry.useEffect.handleOnline @ useAutoRetry.ts:40Understand this error
logger.ts:124 [Clipstream] [TranscriptionRetry] [WARN] API down detected {attempt: 3}
warn @ logger.ts:124
attemptTranscription @ transcriptionRetry.ts:75
await in attemptTranscription
ClipMasterScreen.useCallback[processAllPendingClips] @ ClipMasterScreen.tsx:567
await in ClipMasterScreen.useCallback[processAllPendingClips]
useAutoRetry.useEffect.handleOnline @ useAutoRetry.ts:40Understand this warning
logger.ts:124 [Clipstream] [TranscriptionRetry] [WARN] All rapid attempts failed
warn @ logger.ts:124
attemptTranscription @ transcriptionRetry.ts:91
await in attemptTranscription
ClipMasterScreen.useCallback[processAllPendingClips] @ ClipMasterScreen.tsx:567
await in ClipMasterScreen.useCallback[processAllPendingClips]
useAutoRetry.useEffect.handleOnline @ useAutoRetry.ts:40Understand this warning
logger.ts:119 [Clipstream] [TranscriptionRetry] [INFO] Waiting before interval attempt {attempt: 4, waitSeconds: 30}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Loaded parent with children {parentId: 'clip-1767938277454-5s682qspc', childCount: 1}childCount: 1parentId: "clip-1767938277454-5s682qspc"[[Prototype]]: Object
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) {clearedContext: true}
ClipMasterScreen.tsx:571 [ProcessPending] Attempt 4/6
logger.ts:119 [Clipstream] [TranscriptionRetry] [INFO] Interval attempt succeeded {attempt: 4}
ClipMasterScreen.tsx:577 [ProcessPending] Success!
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Starting background title generation {clipId: 'clip-1767938277454-5s682qspc', textLength: 54}
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio deleted from IndexedDB {audioId: 'audio-1767938277452-78tmnc3qb'}
ClipMasterScreen.tsx:673 [ProcessPending] All pending clips processed
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] AI title generated, updating clip {clipId: 'clip-1767938277454-5s682qspc', title: 'The Importance of Dance in My Life'}
hot-reloader-pages.js:207 [Fast Refresh] rebuilding
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) {clearedContext: true}
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB {audioId: 'audio-1767938605958-njv2kfkit', size: 275793, mimeType: 'audio/webm;codecs=opus', format: 'v2-ArrayBuffer'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB {audioId: 'audio-1767938605958-njv2kfkit', size: 275793, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [TranscriptionRetry] [INFO] Rapid attempt {attempt: 1, max: 3}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) {clearedContext: true}
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB {audioId: 'audio-1767938632553-rrmydwtv6', size: 279375, mimeType: 'audio/webm;codecs=opus', format: 'v2-ArrayBuffer'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB {audioId: 'audio-1767938632553-rrmydwtv6', size: 279375, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [TranscriptionRetry] [INFO] Rapid attempt {attempt: 1, max: 3}
logger.ts:119 [Clipstream] [TranscriptionRetry] [INFO] Rapid attempt {attempt: 2, max: 3}
transcriptionRetry.ts:173  POST http://localhost:3000/api/clipperstream/transcribe 500 (Internal Server Error)
transcribeSingle @ transcriptionRetry.ts:173
attemptTranscription @ transcriptionRetry.ts:58
await in attemptTranscription
handleDoneClick @ ClipMasterScreen.tsx:816
await in handleDoneClick
handleClick @ recordNavMorphingButtons.tsx:153
processDispatchQueue @ react-dom-client.development.js:16123
eval @ react-dom-client.development.js:16726
batchedUpdates$1 @ react-dom-client.development.js:3130
dispatchEventForPluginEventSystem @ react-dom-client.development.js:16282
dispatchEvent @ react-dom-client.development.js:20354
dispatchDiscreteEvent @ react-dom-client.development.js:20322Understand this error
logger.ts:124 [Clipstream] [TranscriptionRetry] [WARN] API down detected {attempt: 2}
warn @ logger.ts:124
attemptTranscription @ transcriptionRetry.ts:75
await in attemptTranscription
handleDoneClick @ ClipMasterScreen.tsx:816
await in handleDoneClick
handleClick @ recordNavMorphingButtons.tsx:153
processDispatchQueue @ react-dom-client.development.js:16123
eval @ react-dom-client.development.js:16726
batchedUpdates$1 @ react-dom-client.development.js:3130
dispatchEventForPluginEventSystem @ react-dom-client.development.js:16282
dispatchEvent @ react-dom-client.development.js:20354
dispatchDiscreteEvent @ react-dom-client.development.js:20322Understand this warning
logger.ts:119 [Clipstream] [TranscriptionRetry] [INFO] Rapid attempt {attempt: 3, max: 3}
transcriptionRetry.ts:173  POST http://localhost:3000/api/clipperstream/transcribe 500 (Internal Server Error)
transcribeSingle @ transcriptionRetry.ts:173
attemptTranscription @ transcriptionRetry.ts:58
await in attemptTranscription
handleDoneClick @ ClipMasterScreen.tsx:816
await in handleDoneClick
handleClick @ recordNavMorphingButtons.tsx:153
processDispatchQueue @ react-dom-client.development.js:16123
eval @ react-dom-client.development.js:16726
batchedUpdates$1 @ react-dom-client.development.js:3130
dispatchEventForPluginEventSystem @ react-dom-client.development.js:16282
dispatchEvent @ react-dom-client.development.js:20354
dispatchDiscreteEvent @ react-dom-client.development.js:20322Understand this error
logger.ts:124 [Clipstream] [TranscriptionRetry] [WARN] API down detected {attempt: 3}
warn @ logger.ts:124
attemptTranscription @ transcriptionRetry.ts:75
await in attemptTranscription
handleDoneClick @ ClipMasterScreen.tsx:816
await in handleDoneClick
handleClick @ recordNavMorphingButtons.tsx:153
processDispatchQueue @ react-dom-client.development.js:16123
eval @ react-dom-client.development.js:16726
batchedUpdates$1 @ react-dom-client.development.js:3130
dispatchEventForPluginEventSystem @ react-dom-client.development.js:16282
dispatchEvent @ react-dom-client.development.js:20354
dispatchDiscreteEvent @ react-dom-client.development.js:20322Understand this warning
logger.ts:124 [Clipstream] [TranscriptionRetry] [WARN] All rapid attempts failed
warn @ logger.ts:124
attemptTranscription @ transcriptionRetry.ts:91
await in attemptTranscription
handleDoneClick @ ClipMasterScreen.tsx:816
await in handleDoneClick
handleClick @ recordNavMorphingButtons.tsx:153
processDispatchQueue @ react-dom-client.development.js:16123
eval @ react-dom-client.development.js:16726
batchedUpdates$1 @ react-dom-client.development.js:3130
dispatchEventForPluginEventSystem @ react-dom-client.development.js:16282
dispatchEvent @ react-dom-client.development.js:20354
dispatchDiscreteEvent @ react-dom-client.development.js:20322Understand this warning
logger.ts:119 [Clipstream] [TranscriptionRetry] [INFO] Intervals disabled (live recording), stopping
ClipMasterScreen.tsx:843 [HandleDone] Transcription failed, saving as pending
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Handling offline recording {audioId: 'audio-1767938605958-njv2kfkit', duration: 17, currentClipId: null}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] No currentClipId → creating parent
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Created PARENT container for offline recording {parentId: 'clip-1767938636132-fkcnahhxd', title: 'Recording 01'}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Created FIRST CHILD for offline recording {childId: 'clip-1767938636132-ngwv1kauy2c', parentId: 'clip-1767938636132-fkcnahhxd', parentTitle: 'Recording 01', childTitle: 'Clip 001'}
logger.ts:113 [Clipstream] [useOfflineRecording] [DEBUG] First child created, Zustand selector will auto-update {firstChildId: 'clip-1767938636132-ngwv1kauy2c'}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) {clearedContext: true}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Loaded parent with children {parentId: 'clip-1767938636132-fkcnahhxd', childCount: 1}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) {clearedContext: true}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Loaded parent with children {parentId: 'clip-1767938636132-fkcnahhxd', childCount: 1}
logger.ts:119 [Clipstream] [TranscriptionRetry] [INFO] Rapid attempt {attempt: 2, max: 3}
logger.ts:119 [Clipstream] [TranscriptionRetry] [INFO] Transcription succeeded {attempt: 2}
ClipMasterScreen.tsx:1166 [Formatting] Starting formatting for clip: clip-1767938666710-rd2m47s81jqew9cod4752f | isAppending: false
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Starting background title generation {clipId: 'clip-1767938666710-rd2m47s81jqew9cod4752f', textLength: 251}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] AI title generated, updating clip {clipId: 'clip-1767938666710-rd2m47s81jqew9cod4752f', title: 'Testing VPN Tool for Location Changes'}
ClipMasterScreen.tsx:1187 [Formatting] Received formatted text for clip: clip-1767938666710-rd2m47s81jqew9cod4752f
ClipMasterScreen.tsx:1200 [Formatting] Updated clip content in Zustand for clip: clip-1767938666710-rd2m47s81jqew9cod4752f
ClipMasterScreen.tsx:1203 [Formatting] Calling setRecordNavState(complete) for clip: clip-1767938666710-rd2m47s81jqew9cod4752f
ClipMasterScreen.tsx:1218 Uncaught (in promise) NotAllowedError: Failed to execute 'writeText' on 'Clipboard': Document is not focused.
    at ClipMasterScreen.useCallback[formatTranscriptionInBackground] (ClipMasterScreen.tsx:1218:29)
ClipMasterScreen.useCallback[formatTranscriptionInBackground] @ ClipMasterScreen.tsx:1218
await in ClipMasterScreen.useCallback[formatTranscriptionInBackground]
handleDoneClick @ ClipMasterScreen.tsx:901
await in handleDoneClick
handleClick @ recordNavMorphingButtons.tsx:153
processDispatchQueue @ react-dom-client.development.js:16123
eval @ react-dom-client.development.js:16726
batchedUpdates$1 @ react-dom-client.development.js:3130
dispatchEventForPluginEventSystem @ react-dom-client.development.js:16282
dispatchEvent @ react-dom-client.development.js:20354
dispatchDiscreteEvent @ react-dom-client.development.js:20322Understand this error
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) 

__________________
{state: {clips: [{id: "clip-1767938254018-7vkrd589n17xwjharb9djo", createdAt: 1767938254018,…},…]},…}
state
: 
{clips: [{id: "clip-1767938254018-7vkrd589n17xwjharb9djo", createdAt: 1767938254018,…},…]}
clips
: 
[{id: "clip-1767938254018-7vkrd589n17xwjharb9djo", createdAt: 1767938254018,…},…]
0
: 
{id: "clip-1767938254018-7vkrd589n17xwjharb9djo", createdAt: 1767938254018,…}
content
: 
"Hey. My name is Ethan."
createdAt
: 
1767938254018
currentView
: 
"formatted"
date
: 
"Jan 9, 2026"
formattedText
: 
"Hey. My name is Ethan."
id
: 
"clip-1767938254018-7vkrd589n17xwjharb9djo"
rawText
: 
"Hey. My name is Ethan."
status
: 
null
title
: 
"Introduction of Ethan's Voice Note"
1
: 
{id: "clip-1767938277454-5s682qspc", title: "The Importance of Dance in My Life", date: "Jan 9, 2026",…}
content
: 
"Hello, I like to dance because it matters a lot to me."
createdAt
: 
1767938277454
currentView
: 
"formatted"
date
: 
"Jan 9, 2026"
formattedText
: 
"Hello, I like to dance because it matters a lot to me."
id
: 
"clip-1767938277454-5s682qspc"
rawText
: 
"Hello, I like to dance because it matters a lot to me."
status
: 
null
title
: 
"The Importance of Dance in My Life"
2
: 
{id: "clip-1767938636132-fkcnahhxd", title: "Recording 01", date: "Jan 9, 2026", status: null,…}
content
: 
""
createdAt
: 
1767938636132
currentView
: 
"formatted"
date
: 
"Jan 9, 2026"
formattedText
: 
""
id
: 
"clip-1767938636132-fkcnahhxd"
rawText
: 
""
status
: 
null
title
: 
"Recording 01"
3
: 
{id: "clip-1767938636132-ngwv1kauy2c", title: "Recording 01", date: "Jan 9, 2026",…}
audioId
: 
"audio-1767938605958-njv2kfkit"
content
: 
""
createdAt
: 
1767938636132
currentView
: 
"formatted"
date
: 
"Jan 9, 2026"
duration
: 
"0:17"
formattedText
: 
""
id
: 
"clip-1767938636132-ngwv1kauy2c"
parentId
: 
"clip-1767938636132-fkcnahhxd"
pendingClipTitle
: 
"Clip 001"
rawText
: 
""
status
: 
"pending-child"
title
: 
"Recording 01"
4
: 
{id: "clip-1767938666710-rd2m47s81jqew9cod4752f", createdAt: 1767938666710,…}
content
: 
"Okay. Let me try this once more. \n\nI want to try a few things. I'm basically trying to break the tool I've made because it doesn't seem to be giving me VPN-related issues. I want to see what happens if, for some reason, I'm changing my location online."
createdAt
: 
1767938666710
currentView
: 
"formatted"
date
: 
"Jan 9, 2026"
formattedText
: 
"Okay. Let me try this once more. \n\nI want to try a few things. I'm basically trying to break the tool I've made because it doesn't seem to be giving me VPN-related issues. I want to see what happens if, for some reason, I'm changing my location online."
id
: 
"clip-1767938666710-rd2m47s81jqew9cod4752f"
rawText
: 
"Okay. Let me try this once more. I want to try a few things. I'm basically trying to break the tool I've made, because it doesn't seem to be giving me, VPN related issues. I want to see what happened if for some reason I'm changing my location online."
status
: 
null
title
: 
"Testing VPN Tool for Location Changes"
version
: 
0