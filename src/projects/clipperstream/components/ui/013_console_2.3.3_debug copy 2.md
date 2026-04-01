
EXPERIMENT 1 
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Loaded parent with children Object
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) Object
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Loaded parent with children Object
ClipMasterScreen.tsx:498 🟢 handleOnline FIRED - network is back online
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Network online - attempting auto-retry of pending clips
ClipMasterScreen.tsx:515 🟢 handleOnline - clips found: Object
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Found pending clips for auto-retry Object
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Status transition Object
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip Object
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage Object
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage Object
logger.ts:113 [Clipstream] [AudioStorage] [DEBUG] Audio retrieved from IndexedDB Object
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Auto-retrying transcription Object
logger.ts:113 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription Object
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Transcription successful Object
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Status transition Object
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip Object
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage Object
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage Object
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Background transcription completed Object
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Starting background formatting Object
logger.ts:113 [Clipstream] [AudioStorage] [DEBUG] Audio retrieved from IndexedDB Object
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Auto-retrying transcription Object
logger.ts:113 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription Object
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Transcription successful Object
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Text formatted successfully
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip Object
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage Object
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage Object
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio deleted from IndexedDB Object
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Audio deleted from IndexedDB after successful transcription Object
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Status transition Object
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip Object
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage Object
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage Object
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) Object
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Loaded parent with children Object
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pend

Session Storage Local Host 3000

{id: "clip-1766875942915-cx2y0gs8g", title: "Recording 02", date: "Dec 27, 2025", status: null,…},…]
0
: 
{id: "clip-1766875942915-cx2y0gs8g", title: "Recording 02", date: "Dec 27, 2025", status: null,…}
1
: 
{id: "clip-1766875901602-4tsnh4130", title: "Recording 01", date: "Dec 27, 2025",…}
2
: 
{id: "clip-1766875878323-lrlzpnk96", title: "Mary's Experience with a Lump", date: "Dec 27, 2025",…}
3
: 
{id: "clip-1766875909638-q1e6y17tbpm", title: "Recording 01", date: "Dec 27, 2025",…}
4
: 
{id: "clip-1766875918631-6whyrfcfonl", title: "Recording 01", date: "Dec 27, 2025",…}
5
: 
{id: "clip-1766875930105-1g3udkd9j0b", title: "Recording 01", date: "Dec 27, 2025",…}
6
: 
{id: "clip-1766875958582-6x3e90wenrw", title: "Mary's Experience with a Lump", date: "Dec 27, 2025",…}


View from the terminal.
✓ Compiled /api/clipperstream/format-text in 42ms (342 modules)
 ✓ Compiled (345 modules)
[Clipstream] [API/format-text] [DEBUG] Request received { method: 'POST' }
[Clipstream] [API/format-text] [DEBUG] API key check { hasKey: true }
[Clipstream] [API/format-text] [DEBUG] Calling formatter service { rawLength: 30, hasContext: false }
[Clipstream] [TextFormatter] [DEBUG] Starting text formatting { rawLength: 30, hasContext: false }
[Clipstream] [TextFormatter] [DEBUG] Calling OpenAI generateText API
[Clipstream] [API/generate-title] [DEBUG] Request received { method: 'POST' }
[Clipstream] [API/generate-title] [DEBUG] API key check { hasKey: true }
[Clipstream] [API/generate-title] [DEBUG] Processing transcription { length: 30 }
[Clipstream] [API/generate-title] [DEBUG] Calling title generator service
[Clipstream] [TitleGenerator] [DEBUG] Starting title generation { transcriptionLength: 30, hasApiKey: true }
[Clipstream] [TitleGenerator] [DEBUG] Creating OpenAI client
[Clipstream] [TitleGenerator] [DEBUG] Calling OpenAI generateText API
[Clipstream] [TextFormatter] [INFO] Text formatted successfully { rawLength: 30, formattedLength: 30 }
[Clipstream] [API/format-text] [INFO] Text formatted successfully
 POST /api/clipperstream/format-text 200 in 923ms
[Clipstream] [TitleGenerator] [INFO] Title generated successfully { title: "Mary's Experience with a Lump" }
[Clipstream] [API/generate-title] [INFO] Title generated successfully { title: "Mary's Experience with a Lump" }
 POST /api/clipperstream/generate-title 200 in 994ms
Files received: [ 'audio' ]
Processing audio file: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/vuxsp4vy2awynwb6cyijeksr7, size: 82941 bytes, type: audio/webm;codecs=opus
 POST /api/clipperstream/transcribe 200 in 2467ms
[Clipstream] [API/format-text] [DEBUG] Request received { method: 'POST' }
[Clipstream] [API/format-text] [DEBUG] API key check { hasKey: true }
[Clipstream] [API/format-text] [DEBUG] Calling formatter service { rawLength: 56, hasContext: false }
[Clipstream] [TextFormatter] [DEBUG] Starting text formatting { rawLength: 56, hasContext: false }
[Clipstream] [TextFormatter] [DEBUG] Calling OpenAI generateText API
Files received: [ 'audio' ]
Processing audio file: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/jbb6avap0bwena7ob30yaj414, size: 98525 bytes, type: audio/webm;codecs=opus
 POST /api/clipperstream/transcribe 200 in 380ms
[Clipstream] [TextFormatter] [INFO] Text formatted successfully { rawLength: 56, formattedLength: 58 }
[Clipstream] [API/format-text] [INFO] Text formatted successfully
 POST /api/clipperstream/format-text 200 in 1454ms
 ✓ Compiled in 290ms (2267 modules)
 ✓ Compiled in 124ms (2267 modules)

 _______________________________________________________________________________________________________________________________________________________________________________


 EXPERIMENT 2 TAKE 2

 [Clipstream] [useClipState] [DEBUG] Clips initialized from storage Object
logger.ts:113 [Clipstream] [AudioStorage] [DEBUG] IndexedDB initialized successfully
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB Object
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB Object
logger.ts:113 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription Object
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Transcription successful Object
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Active recording completed Object
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Creating new clip with transcription
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Creating new clip Object
logger.ts:119 [Clipstream] [useClipState] [INFO] Creating new clip Object
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage Object
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip Object
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage Object
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage Object
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Starting background title generation Object
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Starting background formatting Object
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Text formatted successfully
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip Object
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage Object
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage Object
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio deleted from IndexedDB Object
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Audio deleted from IndexedDB after successful transcription Object
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Status transition Object
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip Object
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage Object
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage Object
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] AI title generated, updating clip Object
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip Object
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage Object
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage Object
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) Object
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Network offline
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB Object
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB Object
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Offline - transcription will retry when online
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Offline - clip saved as pending
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] No currentClipId → creating parent
logger.ts:119 [Clipstream] [useClipState] [INFO] Creating new clip Object
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage Object
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Created PARENT for offline recording Object
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip Object
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage Object
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage Object
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Set selectedPendingClips to parent Object
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Recording from pending clip (adding successive recording) Object
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB Object
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB Object
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Offline - transcription will retry when online
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Offline - clip saved as pending
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Appending to pending file Object
logger.ts:119 [Clipstream] [useClipState] [INFO] Creating new clip Object
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage Object
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Created CHILD for offline recording Object
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip Object
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage Object
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage Object
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Added child to selectedPendingClips Object
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Recording from pending clip (adding successive recording) Object
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB Object
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB Object
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Offline - transcription will retry when online
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Offline - clip saved as pending
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Appending to pending file Object
logger.ts:119 [Clipstream] [useClipState] [INFO] Creating new clip Object
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage Object
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Created CHILD for offline recording Object
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip Object
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage Object
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage Object
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Added child to selectedPendingClips Object
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Recording from pending clip (adding successive recording) Object
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB Object
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB Object
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Offline - transcription will retry when online
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Offline - clip saved as pending
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Appending to pending file Object
logger.ts:119 [Clipstream] [useClipState] [INFO] Creating new clip Object
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage Object
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Created CHILD for offline recording Object
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip Object
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage Object
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage Object
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Added child to selectedPendingClips Object
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) Object
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB Object
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB Object
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Offline - transcription will retry when online
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Offline - clip saved as pending
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Appending to transcribed/completed file Object
logger.ts:119 [Clipstream] [useClipState] [INFO] Creating new clip Object
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage Object
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Created CHILD for offline recording Object
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip Object
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage Object
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage Object
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Added child to selectedPendingClips Object
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Offline append - staying in complete state to preserve existing content access
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) Object
ClipMasterScreen.tsx:498 🟢 handleOnline FIRED - network is back online
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Network online - attempting auto-retry of pending clips
ClipMasterScreen.tsx:515 🟢 handleOnline - clips found: Object
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Found pending clips for auto-retry Object
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Status transition Object
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip Object
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage Object
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage Object
logger.ts:113 [Clipstream] [AudioStorage] [DEBUG] Audio retrieved from IndexedDB Object
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Auto-retrying transcription Object
logger.ts:113 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription Object
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Transcription successful Object
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Background transcription completed Object
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Starting background formatting Object
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Text formatted successfully
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip Object
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage Object
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage Object
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio deleted from IndexedDB Object
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Audio deleted from IndexedDB after successful transcription Object
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Status transition Object
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip Object
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage Object
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage Object
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) Object
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Loaded parent with children Object
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) Object


Session Storage Local HERS 3000

[{id: "clip-1766876515079-e7ffw6qk4", title: "Recording 02", date: "Dec 27, 2025",…},…]
0
: 
{id: "clip-1766876515079-e7ffw6qk4", title: "Recording 02", date: "Dec 27, 2025",…}
audioId
: 
"audio-1766876515076-3xkon55e9"
content
: 
""
createdAt
: 
1766876515079
currentView
: 
"formatted"
date
: 
"Dec 27, 2025"
duration
: 
"0:06"
id
: 
"clip-1766876515079-e7ffw6qk4"
parentId
: 
"clip-1766876463346-1o7e1l9zv"
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
"Recording 02"
1
: 
{id: "clip-1766876499909-vjzhdgmuy", title: "Recording 02", date: "Dec 27, 2025",…}
audioId
: 
"audio-1766876499902-imzyp8q4h"
content
: 
""
createdAt
: 
1766876499909
currentView
: 
"formatted"
date
: 
"Dec 27, 2025"
duration
: 
"0:04"
id
: 
"clip-1766876499909-vjzhdgmuy"
parentId
: 
"clip-1766876478739-rlnx5i6te"
pendingClipTitle
: 
"Clip 004"
rawText
: 
""
status
: 
"pending-child"
title
: 
"Recording 02"
2
: 
{id: "clip-1766876491697-8x26jauh5", title: "Recording 02", date: "Dec 27, 2025",…}
audioId
: 
"audio-1766876491693-tizookdin"
content
: 
""
createdAt
: 
1766876491697
currentView
: 
"formatted"
date
: 
"Dec 27, 2025"
duration
: 
"0:04"
id
: 
"clip-1766876491697-8x26jauh5"
parentId
: 
"clip-1766876478739-rlnx5i6te"
pendingClipTitle
: 
"Clip 003"
rawText
: 
""
status
: 
"pending-child"
title
: 
"Recording 02"
3
: 
{id: "clip-1766876485104-s1y2rcqmp", title: "Recording 02", date: "Dec 27, 2025",…}
audioId
: 
"audio-1766876485098-gh6eohso7"
content
: 
""
createdAt
: 
1766876485104
currentView
: 
"formatted"
date
: 
"Dec 27, 2025"
duration
: 
"0:04"
id
: 
"clip-1766876485104-s1y2rcqmp"
parentId
: 
"clip-1766876478739-rlnx5i6te"
pendingClipTitle
: 
"Clip 002"
rawText
: 
""
status
: 
"pending-child"
title
: 
"Recording 02"
4
: 
{id: "clip-1766876478739-rlnx5i6te", title: "Recording 01", date: "Dec 27, 2025", status: null,…}
content
: 
""
createdAt
: 
1766876478739
currentView
: 
"formatted"
date
: 
"Dec 27, 2025"
duration
: 
"0:04"
formattedText
: 
"Clip zero one: I like to dance."
id
: 
"clip-1766876478739-rlnx5i6te"
pendingClipTitle
: 
"Clip 001"
rawText
: 
""
status
: 
null
title
: 
"Recording 01"
5
: 
{id: "clip-1766876463346-1o7e1l9zv", title: "Donald’s Adventures with a Little Tiger",…}
content
: 
"Donald had a little tiger."
createdAt
: 
1766876463346
currentView
: 
"formatted"
date
: 
"Dec 27, 2025"
formattedText
: 
"Donald had a little tiger."
id
: 
"clip-1766876463346-1o7e1l9zv"
rawText
: 
"Donald had a little tiger."
status
: 
null
title
: 
"Donald’s Adventures with a Little Tiger"