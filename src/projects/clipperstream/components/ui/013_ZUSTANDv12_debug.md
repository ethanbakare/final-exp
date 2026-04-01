Error as seen from console.

websocket.js:46 [HMR] connected
logger.ts:113 [Clipstream] [AudioStorage] [DEBUG] IndexedDB initialized successfully
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB Object
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB Object
logger.ts:113 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription Object
:3000/api/clipperstream/transcribe:1  Failed to load resource: the server responded with a status of 500 (Internal Server Error)Understand this error
pages-dev-overlay-setup.js:77 [Clipstream] [useClipRecording] [ERROR] Transcription failed Objectattempt: 1error: Error: Server error 500: No speech detected
    at useClipRecording.useCallback[transcribeRecording] (webpack-internal:///(pages-dir-browser)/./src/projects/clipperstream/hooks/useClipRecording.ts:312:27)
    at async handleDoneClick (webpack-internal:///(pages-dir-browser)/./src/projects/clipperstream/components/ui/ClipMasterScreen.tsx:485:35)[[Prototype]]: Object
nextJsHandleConsoleError @ pages-dev-overlay-setup.js:77Understand this error
pages-dev-overlay-setup.js:77 [Clipstream] [useClipRecording] [ERROR] Server rejection (definitive failure) ObjecterrorMessage: "Server error 500: No speech detected"retriesAttempted: 1[[Prototype]]: Object
nextJsHandleConsoleError @ pages-dev-overlay-setup.js:77Understand this error
pages-dev-overlay-setup.js:77 [Clipstream] [ClipMasterScreen] [ERROR] Definitive transcription failure Objecterror: "Server rejected audio"[[Prototype]]: Object
nextJsHandleConsoleError @ pages-dev-overlay-setup.js:77Understand this error
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) Object
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB Object
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB Object
logger.ts:113 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription Object
:3000/api/clipperstream/transcribe:1  Failed to load resource: the server responded with a status of 500 (Internal Server Error)Understand this error
pages-dev-overlay-setup.js:77 [Clipstream] [useClipRecording] [ERROR] Transcription failed Objectattempt: 1error: Error: Server error 500: No speech detected
    at useClipRecording.useCallback[transcribeRecording] (webpack-internal:///(pages-dir-browser)/./src/projects/clipperstream/hooks/useClipRecording.ts:312:27)
    at async handleDoneClick (webpack-internal:///(pages-dir-browser)/./src/projects/clipperstream/components/ui/ClipMasterScreen.tsx:485:35)[[Prototype]]: Object
nextJsHandleConsoleError @ pages-dev-overlay-setup.js:77Understand this error
pages-dev-overlay-setup.js:77 [Clipstream] [useClipRecording] [ERROR] Server rejection (definitive failure) ObjecterrorMessage: "Server error 500: No speech detected"retriesAttempted: 1[[Prototype]]: Object
nextJsHandleConsoleError @ pages-dev-overlay-setup.js:77Understand this error
pages-dev-overlay-setup.js:77 [Clipstream] [ClipMasterScreen] [ERROR] Definitive transcription failure Objecterror: "Server rejected audio"[[Prototype]]: Object
nextJsHandleConsoleError @ pages-dev-overlay-setup.js:77Understand this error
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB Object
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB Object
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB Object
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB Object
logger.ts:113 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription Object
:3000/api/clipperstream/transcribe:1  Failed to load resource: the server responded with a status of 500 (Internal Server Error)Understand this error
pages-dev-overlay-setup.js:77 [Clipstream] [useClipRecording] [ERROR] Transcription failed Objectattempt: 1error: Error: Server error 500: No speech detected
    at useClipRecording.useCallback[transcribeRecording] (webpack-internal:///(pages-dir-browser)/./src/projects/clipperstream/hooks/useClipRecording.ts:312:27)
    at async handleDoneClick (webpack-internal:///(pages-dir-browser)/./src/projects/clipperstream/components/ui/ClipMasterScreen.tsx:485:35)[[Prototype]]: Object
nextJsHandleConsoleError @ pages-dev-overlay-setup.js:77Understand this error
pages-dev-overlay-setup.js:77 [Clipstream] [useClipRecording] [ERROR] Server rejection (definitive failure) ObjecterrorMessage: "Server error 500: No speech detected"retriesAttempted: 1[[Prototype]]: Object
nextJsHandleConsoleError @ pages-dev-overlay-setup.js:77Understand this error
pages-dev-overlay-setup.js:77 [Clipstream] [ClipMasterScreen] [ERROR] Definitive transcription failure Objecterror: "Server rejected audio"[[Prototype]]: Objectconstructor: ƒ Object()hasOwnProperty: ƒ hasOwnProperty()isPrototypeOf: ƒ isPrototypeOf()propertyIsEnumerable: ƒ propertyIsEnumerable()toLocaleString: ƒ toLocaleString()toString: ƒ toString()valueOf: ƒ valueOf()__defineGetter__: ƒ __defineGetter__()__defineSetter__: ƒ __defineSetter__()__lookupGetter__: ƒ __lookupGetter__()__lookupSetter__: ƒ __lookupSetter__()__proto__: (...)get __proto__: ƒ __proto__()set __proto__: ƒ __proto__()
nextJsHandleConsoleError @ pages-dev-overlay-setup.js:77Understand this error
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) ObjectclearedContext: true[[Prototype]]: Objectconstructor: ƒ Object()hasOwnProperty: ƒ hasOwnProperty()isPrototypeOf: ƒ isPrototypeOf()propertyIsEnumerable: ƒ propertyIsEnumerable()toLocaleString: ƒ toLocaleString()toString: ƒ toString()valueOf: ƒ valueOf()__defineGetter__: ƒ __defineGetter__()__defineSetter__: ƒ __defineSetter__()__lookupGetter__: ƒ __lookupGetter__()__lookupSetter__: ƒ __lookupSetter__()__proto__: (...)get __proto__: ƒ __proto__()set __proto__: ƒ __proto__()



_________________

Error as seen from terminal.


 ✓ Compiled in 141ms (232 modules)
 ✓ Compiled in 328ms (232 modules)
Files received: [ 'audio' ]
Processing audio file: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/fmb77r6vvkku6uppdp3wv4fkf, size: 12813 bytes, type: audio/webm;codecs=opus
Error processing audio: Error: No speech detected in recording. Please try again and speak clearly.
    at transcribeAudio (src/projects/clipperstream/api/deepgramProvider.ts:70:13)
    at async handler (src/pages/api/clipperstream/transcribe.ts:140:20)
  68 |     // Check if transcript is empty (no speech detected)
  69 |     if (!transcript || transcript.trim() === '') {
> 70 |       throw new Error('No speech detected in recording. Please try again and speak clearly.');
     |             ^
  71 |     }
  72 |     
  73 |     return {
 POST /api/clipperstream/transcribe 500 in 964ms
Files received: [ 'audio' ]
Processing audio file: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/xrb3t45sz0bwon352onbyuvpz, size: 26449 bytes, type: audio/webm;codecs=opus
Files received: [ 'audio' ]
Processing audio file: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/y3krii58af70gyut5dm2rzhgr, size: 18657 bytes, type: audio/webm;codecs=opus
 POST /api/clipperstream/transcribe 200 in 1197ms
[Clipstream] [API/format-text] [DEBUG] Request received { method: 'POST' }
[Clipstream] [API/format-text] [DEBUG] API key check { hasKey: true }
[Clipstream] [API/format-text] [DEBUG] Calling formatter service { rawLength: 3, hasContext: true }
[Clipstream] [TextFormatter] [DEBUG] Starting text formatting { rawLength: 3, hasContext: true }
[Clipstream] [TextFormatter] [DEBUG] Calling OpenAI generateText API
[Clipstream] [TextFormatter] [INFO] Text formatted successfully { rawLength: 3, formattedLength: 3 }
[Clipstream] [API/format-text] [INFO] Text formatted successfully
 POST /api/clipperstream/format-text 200 in 1252ms
Error processing audio: Error: No speech detected in recording. Please try again and speak clearly.
    at transcribeAudio (src/projects/clipperstream/api/deepgramProvider.ts:70:13)
    at async handler (src/pages/api/clipperstream/transcribe.ts:140:20)
  68 |     // Check if transcript is empty (no speech detected)
  69 |     if (!transcript || transcript.trim() === '') {
> 70 |       throw new Error('No speech detected in recording. Please try again and speak clearly.');
     |             ^
  71 |     }
  72 |     
  73 |     return {
 POST /api/clipperstream/transcribe 500 in 9542ms
 ✓ Compiled in 216ms (232 modules)
 ✓ Compiled in 236ms (232 modules)
 ✓ Compiled in 372ms (438 modules)
 ✓ Compiled in 150ms (232 modules)
 ✓ Compiled /api/clipperstream/transcribe in 117ms (281 modules)
Files received: [ 'audio' ]
Processing audio file: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/wc4rxs7ya82gwyhfwwjcxae4g, size: 95595 bytes, type: audio/webm;codecs=opus
Error processing audio: Error: No speech detected in recording. Please try again and speak clearly.
    at transcribeAudio (src/projects/clipperstream/api/deepgramProvider.ts:70:13)
    at async handler (src/pages/api/clipperstream/transcribe.ts:140:20)
  68 |     // Check if transcript is empty (no speech detected)
  69 |     if (!transcript || transcript.trim() === '') {
> 70 |       throw new Error('No speech detected in recording. Please try again and speak clearly.');
     |             ^
  71 |     }
  72 |     
  73 |     return {
 POST /api/clipperstream/transcribe 500 in 6988ms
 ✓ Compiled in 189ms (232 modules)
 ✓ Compiled in 46ms (232 modules)
 ✓ Compiled in 132ms (232 modules)
 ✓ Compiled in 390ms (438 modules)
 ✓ Compiled in 265ms (438 modules)
 ✓ Compiled in 93ms (438 modules)
 ✓ Compiled in 146ms (438 modules)
 ✓ Compiled in 67ms (438 modules)
 ✓ Compiled in 65ms (438 modules)
 ✓ Compiled in 74ms (438 modules)
 ✓ Compiled in 149ms (438 modules)
 ✓ Compiled in 135ms (438 modules)
 ✓ Compiled in 89ms (438 modules)
 ✓ Compiled in 205ms (438 modules)
 ✓ Compiled in 88ms (438 modules)
 GET /clipperstream/showcase/clipscreencomponents 200 in 359ms
 ✓ Compiled /api/clipperstream/transcribe in 168ms (281 modules)
Files received: [ 'audio' ]
Processing audio file: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/gvb6st5a714012cda3p4ssgup, size: 26449 bytes, type: audio/webm;codecs=opus
Error processing audio: Error: No speech detected in recording. Please try again and speak clearly.
    at transcribeAudio (src/projects/clipperstream/api/deepgramProvider.ts:70:13)
    at async handler (src/pages/api/clipperstream/transcribe.ts:140:20)
  68 |     // Check if transcript is empty (no speech detected)
  69 |     if (!transcript || transcript.trim() === '') {
> 70 |       throw new Error('No speech detected in recording. Please try again and speak clearly.');
     |             ^
  71 |     }
  72 |     
  73 |     return {
 POST /api/clipperstream/transcribe 500 in 11129ms
Files received: [ 'audio' ]
Processing audio file: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/dzxwpt4zmms3tcmq3qgjlh1vd, size: 78063 bytes, type: audio/webm;codecs=opus
Error processing audio: Error: No speech detected in recording. Please try again and speak clearly.
    at transcribeAudio (src/projects/clipperstream/api/deepgramProvider.ts:70:13)
    at async handler (src/pages/api/clipperstream/transcribe.ts:140:20)
  68 |     // Check if transcript is empty (no speech detected)
  69 |     if (!transcript || transcript.trim() === '') {
> 70 |       throw new Error('No speech detected in recording. Please try again and speak clearly.');
     |             ^
  71 |     }
  72 |     
  73 |     return {
 POST /api/clipperstream/transcribe 500 in 11021ms
Files received: [ 'audio' ]
Processing audio file: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/wyjircvxtkxl93xe347xy0y50, size: 23519 bytes, type: audio/webm;codecs=opus
Error processing audio: Error: No speech detected in recording. Please try again and speak clearly.
    at transcribeAudio (src/projects/clipperstream/api/deepgramProvider.ts:70:13)
    at async handler (src/pages/api/clipperstream/transcribe.ts:140:20)
  68 |     // Check if transcript is empty (no speech detected)
  69 |     if (!transcript || transcript.trim() === '') {
> 70 |       throw new Error('No speech detected in recording. Please try again and speak clearly.');
     |             ^
  71 |     }
  72 |     
  73 |     return {
 POST /api/clipperstream/transcribe 500 in 834ms
 ✓ Compiled in 130ms (232 modules)
 ✓ Compiled in 58ms (232 modules)
 ✓ Compiled in 49ms (232 modules)
 ✓ Compiled in 51ms (232 modules)
 ✓ Compiled in 61ms (232 modules)
 ✓ Compiled in 51ms (232 modules)
 ✓ Compiled in 93ms (232 modules)
 ✓ Compiled in 113ms (232 modules)
 ✓ Compiled in 46ms (232 modules)


 ______________________