[HMR] connected
logger.ts:113 [Clipstream] [AudioStorage] [DEBUG] IndexedDB initialized successfully
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB Object
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB Object
useClipRecording.ts:342 🧪 VPN TEST: Forcing Whisper provider
logger.ts:113 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription Object
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Transcription successful Object
ClipMasterScreen.tsx:843 [Formatting] Starting formatting for clip: clip-1767475269808-zhdjzrh9qcip7ga7a01qrk | isAppending: false
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Starting background title generation Object
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] AI title generated, updating clip Object
ClipMasterScreen.tsx:864 [Formatting] Received formatted text for clip: clip-1767475269808-zhdjzrh9qcip7ga7a01qrk
ClipMasterScreen.tsx:877 [Formatting] Updated clip content in Zustand for clip: clip-1767475269808-zhdjzrh9qcip7ga7a01qrk
ClipMasterScreen.tsx:880 [Formatting] Calling setRecordNavState(complete) for clip: clip-1767475269808-zhdjzrh9qcip7ga7a01qrk
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) Object
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
ClipMasterScreen.tsx:1096 [ProcessChildren] Starting for parent: clip-1767475292067-k075udn6j | Children: 1
ClipMasterScreen.tsx:1108 [ProcessChildren] Processing FIRST child: Clip 001
ClipMasterScreen.tsx:994 [ProcessChild] Starting: Clip 001
logger.ts:113 [Clipstream] [AudioStorage] [DEBUG] 🔬 ARRAYBUFFER CONTENT VERIFICATION Object
logger.ts:119 [Clipstream] [AudioStorage] [INFO] ✅ VALID WEBM DATA - ArrayBuffer contains valid WebM magic bytes Object
logger.ts:113 [Clipstream] [AudioStorage] [DEBUG] Audio retrieved from IndexedDB Object
useClipRecording.ts:342 🧪 VPN TEST: Forcing Whisper provider
logger.ts:113 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription Object
:3000/api/clipperstream/transcribe:1  Failed to load resource: the server responded with a status of 500 (Internal Server Error)Understand this error
pages-dev-overlay-setup.js:77 [Clipstream] [useClipRecording] [ERROR] Transcription failed Objectattempt: 1error: Error: Server error 500: Transcription failed
    at useClipRecording.useCallback[transcribeRecording] (webpack-internal:///(pages-dir-browser)/./src/projects/clipperstream/hooks/useClipRecording.ts:316:27)
    at async ClipMasterScreen.useCallback[processChild] (webpack-internal:///(pages-dir-browser)/./src/projects/clipperstream/components/ui/ClipMasterScreen.tsx:1016:45)
    at async ClipMasterScreen.useCallback[processParentChildren] (webpack-internal:///(pages-dir-browser)/./src/projects/clipperstream/components/ui/ClipMasterScreen.tsx:1105:32)
    at async ClipMasterScreen.useEffect.handleOnline (webpack-internal:///(pages-dir-browser)/./src/projects/clipperstream/components/ui/ClipMasterScreen.tsx:1226:25)[[Prototype]]: Object
nextJsHandleConsoleError @ pages-dev-overlay-setup.js:77Understand this error
pages-dev-overlay-setup.js:77 [Clipstream] [useClipRecording] [ERROR] Server rejection (definitive failure) Object
nextJsHandleConsoleError @ pages-dev-overlay-setup.js:77Understand this error
ClipMasterScreen.tsx:1022 [ProcessChild] Transcription failed: Clip 001
ClipMasterScreen.useCallback[processChild] @ ClipMasterScreen.tsx:1022Understand this warning
pages-dev-overlay-setup.js:77 [Clipstream] [ClipMasterScreen] [ERROR] Definitive transcription failure Object
nextJsHandleConsoleError @ pages-dev-overlay-setup.js:77Understand this error
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Status transition Object
ClipMasterScreen.tsx:1191 [ProcessChildren] Completed parent: clip-1767475292067-k075udn6j
ClipMasterScreen.tsx:1242 [Auto-retry] Completed all parents
30hot-reloader-pages.js:207 [Fast Refresh] rebuilding

_______________
Session Storage Local Host 3000

state: {clips: [{id: "clip-1767475269808-zhdjzrh9qcip7ga7a01qrk", createdAt: 1767475269808,…},…]},…}
state
: 
{clips: [{id: "clip-1767475269808-zhdjzrh9qcip7ga7a01qrk", createdAt: 1767475269808,…},…]}
clips
: 
[{id: "clip-1767475269808-zhdjzrh9qcip7ga7a01qrk", createdAt: 1767475269808,…},…]
0
: 
{id: "clip-1767475269808-zhdjzrh9qcip7ga7a01qrk", createdAt: 1767475269808,…}
content
: 
"Okay, now I'm using OpenAI Whisper. Let's see what happens."
createdAt
: 
1767475269808
currentView
: 
"formatted"
date
: 
"Jan 3, 2026"
formattedText
: 
"Okay, now I'm using OpenAI Whisper. Let's see what happens."
id
: 
"clip-1767475269808-zhdjzrh9qcip7ga7a01qrk"
rawText
: 
"Okay, now I'm using OpenAI Whisper, let's see what happens."
status
: 
null
title
: 
"Testing OpenAI Whisper Voice Recognition"
1
: 
{id: "clip-1767475292067-k075udn6j", title: "Recording 01", date: "Jan 3, 2026", status: "failed",…}
audioId
: 
"audio-1767475292064-pnw1vd8dk"
content
: 
""
createdAt
: 
1767475292067
currentView
: 
"formatted"
date
: 
"Jan 3, 2026"
duration
: 
"0:05"
formattedText
: 
""
id
: 
"clip-1767475292067-k075udn6j"
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
{id: "clip-1767475292067-cqqpu0760a", title: "Recording 01", date: "Jan 3, 2026", status: "failed",…}
audioId
: 
"audio-1767475292064-pnw1vd8dk"
content
: 
""
createdAt
: 
1767475292068
currentView
: 
"formatted"
date
: 
"Jan 3, 2026"
duration
: 
"0:05"
formattedText
: 
""
id
: 
"clip-1767475292067-cqqpu0760a"
parentId
: 
"clip-1767475292067-k075udn6j"
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


________________________

Compiled in 49ms (414 modules)
 ✓ Compiled in 45ms (414 modules)
 ✓ Compiled in 58ms (414 modules)
 GET /clipperstream/showcase/clipscreencomponents 200 in 348ms
 ✓ Compiled /api/clipperstream/transcribe in 139ms (280 modules)
Transcription request { provider: 'whisper', providerField: [ 'whisper' ] }
Files received: [ 'audio' ]
=== 🔬 SERVER AUDIO VERIFICATION ===
File path: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/oz3irgil7p0k8tqb8nlcaav35
Size: 82941 bytes
MIME type: audio/webm;codecs=opus
Is valid WebM: ✅ YES
First 64 bytes (hex): 1a 45 df a3 9f 42 86 81 01 42 f7 81 01 42 f2 81 04 42 f3 81 08 42 82 84 77 65 62 6d 42 87 81 04 42 85 81 02 18 53 80 67 01 ff ff ff ff ff ff ff 15 49 a9 66 99 2a d7 b1 83 0f 42 40 4d 80 86 43
Expected WebM header: 1a 45 df a3
====================================
Processing audio file: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/oz3irgil7p0k8tqb8nlcaav35, size: 82941 bytes, type: audio/webm;codecs=opus
[API] Using Whisper provider (VPN test)
[Whisper] Starting transcription { size: 82941, mimeType: 'audio/webm;codecs=opus' }
[Whisper] Transcription completed {
  transcriptLength: 59,
  preview: "Okay, now I'm using OpenAI Whisper, let's see what happens."
}
 POST /api/clipperstream/transcribe 200 in 4201ms
 ✓ Compiled /api/clipperstream/generate-title in 36ms (286 modules)
 ✓ Compiled (289 modules)
[Clipstream] [API/generate-title] [DEBUG] Request received { method: 'POST' }
[Clipstream] [API/generate-title] [DEBUG] API key check { hasKey: true }
[Clipstream] [API/generate-title] [DEBUG] Processing transcription { length: 59 }
[Clipstream] [API/generate-title] [DEBUG] Calling title generator service
[Clipstream] [TitleGenerator] [DEBUG] Starting title generation { transcriptionLength: 59, hasApiKey: true }
[Clipstream] [TitleGenerator] [DEBUG] Creating OpenAI client
[Clipstream] [TitleGenerator] [DEBUG] Calling OpenAI generateText API
[Clipstream] [API/format-text] [DEBUG] Request received { method: 'POST' }
[Clipstream] [API/format-text] [DEBUG] API key check { hasKey: true }
[Clipstream] [API/format-text] [DEBUG] Calling formatter service { rawLength: 59, hasContext: false }
[Clipstream] [TextFormatter] [DEBUG] Starting text formatting { rawLength: 59, hasContext: false }
[Clipstream] [TextFormatter] [DEBUG] Calling OpenAI generateText API
[Clipstream] [TitleGenerator] [INFO] Title generated successfully { title: 'Testing OpenAI Whisper Voice Recognition' }
[Clipstream] [API/generate-title] [INFO] Title generated successfully { title: 'Testing OpenAI Whisper Voice Recognition' }
 POST /api/clipperstream/generate-title 200 in 1585ms
[Clipstream] [TextFormatter] [INFO] Text formatted successfully { rawLength: 59, formattedLength: 59 }
[Clipstream] [API/format-text] [INFO] Text formatted successfully
 POST /api/clipperstream/format-text 200 in 1639ms
Transcription request { provider: 'whisper', providerField: [ 'whisper' ] }
Files received: [ 'audio' ]
=== 🔬 SERVER AUDIO VERIFICATION ===
File path: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/utgna3ejbihhzd9lend8hched
Size: 96577 bytes
MIME type: audio/webm;codecs=opus
Is valid WebM: ✅ YES
First 64 bytes (hex): 1a 45 df a3 9f 42 86 81 01 42 f7 81 01 42 f2 81 04 42 f3 81 08 42 82 84 77 65 62 6d 42 87 81 04 42 85 81 02 18 53 80 67 01 ff ff ff ff ff ff ff 15 49 a9 66 99 2a d7 b1 83 0f 42 40 4d 80 86 43
Expected WebM header: 1a 45 df a3
====================================
Processing audio file: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/utgna3ejbihhzd9lend8hched, size: 96577 bytes, type: audio/webm;codecs=opus
[API] Using Whisper provider (VPN test)
[Whisper] Starting transcription { size: 96577, mimeType: 'audio/webm;codecs=opus' }
[Whisper] Transcription failed {
  error: 'request to https://api.openai.com/v1/audio/transcriptions failed, reason: getaddrinfo ENOTFOUND api.openai.com',
  audioSize: 96577
}
Error processing audio: Error: Cannot reach OpenAI API. Please check your internet connection.
    at transcribeWithWhisper (src/projects/clipperstream/api/whisperProvider.ts:134:13)
    at async handler (src/pages/api/clipperstream/transcribe.ts:197:16)
  132 |     // Check for network errors
  133 |     if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('ECONNREFUSED')) {
> 134 |       throw new Error('Cannot reach OpenAI API. Please check your internet connection.');
      |             ^
  135 |     }
  136 |
  137 |     throw new Error(`Whisper transcription failed: ${errorMessage}`);
 POST /api/clipperstream/transcribe 500 in 105ms
 ✓ Compiled in 149ms (414 modules)
 ✓ Compiled in 45ms (414 modules)
 ✓ Compiled in 50ms (414 modules)
 ✓ Compiled in 45ms (414 modules)
 ✓ Compiled in 224ms (414 modules)
 ✓ Compiled in 49ms (414 modules)
 ✓ Compiled in 123ms (414 modules)
 ✓ Compiled in 46ms (414 modules)
 ✓ Compiled in 48ms (414 modules)
 ✓ Compiled in 122ms (414 modules)
 ✓ Compiled in 45ms (414 modules)
 ✓ Compiled in 47ms (414 modules)
 ✓ Compiled in 120ms (414 modules)
 ✓ Compiled in 44ms (414 modules)
 ✓ Compiled in 45ms (414 modules)
 ✓ Compiled in 42ms (414 modules)
 ✓ Compiled in 119ms (414 modules)
 ✓ Compiled in 53ms (414 modules)
 ✓ Compiled in 43ms (414 modules)
 ✓ Compiled in 121ms (414 modules)
 ✓ Compiled in 75ms (414 modules)
 ✓ Compiled in 128ms (414 modules)
 ✓ Compiled in 45ms (414 modules)
 ✓ Compiled in 139ms (414 modules)
 ✓ Compiled in 115ms (414 modules)
 ✓ Compiled in 48ms (414 modules)
 ✓ Compiled in 228ms (414 modules)
 ✓ Compiled in 45ms (414 modules)
 ✓ Compiled in 133ms (414 modules)
 ✓ Compiled in 124ms (414 modules)
 ✓ Compiled in 134ms (414 modules)
