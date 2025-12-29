[HMR] connected
logger.ts:113 [Clipstream] [AudioStorage] [DEBUG] IndexedDB initialized successfully
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB Object
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB Object
logger.ts:113 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription Object
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Transcription successful Object
logger.ts:113 [Clipstream] [useTranscriptionHandler] [DEBUG] Active recording completed Object
logger.ts:113 [Clipstream] [useTranscriptionHandler] [DEBUG] Creating new clip with transcription
logger.ts:119 [Clipstream] [useTranscriptionHandler] [INFO] Creating new clip Object
logger.ts:113 [Clipstream] [useTranscriptionHandler] [DEBUG] Set currentClipId for active recording Object
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Starting background title generation Object
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Starting background formatting Object
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] AI title generated, updating clip Object
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Text formatted successfully
logger.ts:124 [Clipstream] [useTranscriptionHandler] [WARN] No pending clip found for background transcription
warn @ logger.ts:124Understand this warning
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) Object
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB Object
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB Object
logger.ts:113 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription Object
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Transcription successful Object
logger.ts:113 [Clipstream] [useTranscriptionHandler] [DEBUG] Active recording completed Object
logger.ts:113 [Clipstream] [useTranscriptionHandler] [DEBUG] Creating new clip with transcription
logger.ts:119 [Clipstream] [useTranscriptionHandler] [INFO] Creating new clip Object
logger.ts:113 [Clipstream] [useTranscriptionHandler] [DEBUG] Set currentClipId for active recording Object
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Starting background title generation Object
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Starting background formatting Object
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] AI title generated, updating clip Object
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Text formatted successfully
logger.ts:124 [Clipstream] [useTranscriptionHandler] [WARN] No pending clip found for background transcription
warn @ logger.ts:124Understand this warning


Session storage localhost:3000

{state: {clips: [], selectedClip: null}, version: 1}
state
: 
{clips: [], selectedClip: null}
version
: 
1



TERMINAL

 ✓ Compiled /api/clipperstream/transcribe in 170ms (273 modules)
(node:9977) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
Files received: [ 'audio' ]
Processing audio file: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/rq7gzt0y51f65sf7bkz1phpqm, size: 65409 bytes, type: audio/webm;codecs=opus
 POST /api/clipperstream/transcribe 200 in 1259ms
 ✓ Compiled /api/clipperstream/format-text in 36ms (279 modules)
 ✓ Compiled (282 modules)
[Clipstream] [API/format-text] [DEBUG] Request received { method: 'POST' }
[Clipstream] [API/format-text] [DEBUG] API key check { hasKey: true }
[Clipstream] [API/format-text] [DEBUG] Calling formatter service { rawLength: 70, hasContext: false }
[Clipstream] [TextFormatter] [DEBUG] Starting text formatting { rawLength: 70, hasContext: false }
[Clipstream] [TextFormatter] [DEBUG] Calling OpenAI generateText API
[Clipstream] [API/generate-title] [DEBUG] Request received { method: 'POST' }
[Clipstream] [API/generate-title] [DEBUG] API key check { hasKey: true }
[Clipstream] [API/generate-title] [DEBUG] Processing transcription { length: 70 }
[Clipstream] [API/generate-title] [DEBUG] Calling title generator service
[Clipstream] [TitleGenerator] [DEBUG] Starting title generation { transcriptionLength: 70, hasApiKey: true }
[Clipstream] [TitleGenerator] [DEBUG] Creating OpenAI client
[Clipstream] [TitleGenerator] [DEBUG] Calling OpenAI generateText API
[Clipstream] [TitleGenerator] [INFO] Title generated successfully { title: 'Testing Recording Functionality for Clarity' }
[Clipstream] [API/generate-title] [INFO] Title generated successfully { title: 'Testing Recording Functionality for Clarity' }
 POST /api/clipperstream/generate-title 200 in 1279ms
[Clipstream] [TextFormatter] [INFO] Text formatted successfully { rawLength: 70, formattedLength: 70 }
[Clipstream] [API/format-text] [INFO] Text formatted successfully
 POST /api/clipperstream/format-text 200 in 2428ms
Files received: [ 'audio' ]
Processing audio file: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/j76wemu0b0h0lpw9xp7bcgsm3, size: 100473 bytes, type: audio/webm;codecs=opus
 POST /api/clipperstream/transcribe 200 in 805ms
[Clipstream] [API/generate-title] [DEBUG] Request received { method: 'POST' }
[Clipstream] [API/generate-title] [DEBUG] API key check { hasKey: true }
[Clipstream] [API/generate-title] [DEBUG] Processing transcription { length: 74 }
[Clipstream] [API/generate-title] [DEBUG] Calling title generator service
[Clipstream] [TitleGenerator] [DEBUG] Starting title generation { transcriptionLength: 74, hasApiKey: true }
[Clipstream] [TitleGenerator] [DEBUG] Creating OpenAI client
[Clipstream] [TitleGenerator] [DEBUG] Calling OpenAI generateText API
[Clipstream] [API/format-text] [DEBUG] Request received { method: 'POST' }
[Clipstream] [API/format-text] [DEBUG] API key check { hasKey: true }
[Clipstream] [API/format-text] [DEBUG] Calling formatter service { rawLength: 74, hasContext: false }
[Clipstream] [TextFormatter] [DEBUG] Starting text formatting { rawLength: 74, hasContext: false }
[Clipstream] [TextFormatter] [DEBUG] Calling OpenAI generateText API
[Clipstream] [TitleGenerator] [INFO] Title generated successfully { title: 'Testing Voice Recording Functionality' }
[Clipstream] [API/generate-title] [INFO] Title generated successfully { title: 'Testing Voice Recording Functionality' }
 POST /api/clipperstream/generate-title 200 in 687ms
[Clipstream] [TextFormatter] [INFO] Text formatted successfully { rawLength: 74, formattedLength: 76 }
[Clipstream] [API/format-text] [INFO] Text formatted successfully
 POST /api/clipperstream/format-text 200 in 1162ms
 ✓ Compiled in 372ms (224 modules)
 ✓ Compiled in 117ms (224 modules)
 ✓ Compiled in 124ms (224 modules)
