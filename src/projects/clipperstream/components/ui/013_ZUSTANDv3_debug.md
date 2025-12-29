CONSOLE

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
logger.ts:124 [Clipstream] [useTranscriptionHandler] [WARN] No target clip found for transcription
warn @ logger.ts:124Understand this warning
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] AI title generated, updating clip Object
logger.ts:124 [Clipstream] [useTranscriptionHandler] [WARN] No pending clip found for background transcription
warn @ logger.ts:124
useTranscriptionHandler.useEffect @ useTranscriptionHandler.ts:248
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
eval @ react-dom-client.development.js:15963Understand this warning
2hot-reloader-pages.js:207 [Fast Refresh] rebuilding

_________________



Session storage localhost:3000 doesn't seem to have as much information as it usually did back in the past.


{state: {clips: [], selectedClip: null}, version: 1}
state
: 
{clips: [], selectedClip: null}
clips
: 
[]
selectedClip
: 
null
version
: 
1









____________

TERMINAL RESULTS

GET /clipperstream/showcase/clipscreencomponents 200 in 233ms
 ✓ Compiled /api/clipperstream/transcribe in 195ms (273 modules)
(node:72765) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
Files received: [ 'audio' ]
Processing audio file: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/qaxnizpkj6a4l8wwm333z152x, size: 72219 bytes, type: audio/webm;codecs=opus
 POST /api/clipperstream/transcribe 200 in 1223ms
 ✓ Compiled /api/clipperstream/generate-title in 41ms (279 modules)
[Clipstream] [API/generate-title] [DEBUG] Request received { method: 'POST' }
[Clipstream] [API/generate-title] [DEBUG] API key check { hasKey: true }
[Clipstream] [API/generate-title] [DEBUG] Processing transcription { length: 76 }
[Clipstream] [API/generate-title] [DEBUG] Calling title generator service
[Clipstream] [TitleGenerator] [DEBUG] Starting title generation { transcriptionLength: 76, hasApiKey: true }
[Clipstream] [TitleGenerator] [DEBUG] Creating OpenAI client
[Clipstream] [TitleGenerator] [DEBUG] Calling OpenAI generateText API
[Clipstream] [TitleGenerator] [INFO] Title generated successfully { title: 'Final Experiment: Testing the Last Hypothesis' }
[Clipstream] [API/generate-title] [INFO] Title generated successfully { title: 'Final Experiment: Testing the Last Hypothesis' }
 POST /api/clipperstream/generate-title 200 in 1127ms
 ✓ Compiled in 354ms (224 modules)
 ✓ Compiled in 115ms (224 modules)