[HMR] connected
logger.ts:113 [Clipstream] [AudioStorage] [DEBUG] IndexedDB initialized successfully
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB {audioId: 'audio-1767021046656-n0s7agyi9', size: 76115, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB {audioId: 'audio-1767021046656-n0s7agyi9', size: 76115, type: 'audio/webm;codecs=opus'}
logger.ts:113 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription {size: 76115, attempt: 1, source: 'fresh-recording'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Transcription successful {textLength: 30, preview: 'Mary had a little bloody lamb....'}
logger.ts:113 [Clipstream] [useTranscriptionHandler] [DEBUG] Active recording completed {clipId: null}
logger.ts:113 [Clipstream] [useTranscriptionHandler] [DEBUG] Creating new clip with transcription
logger.ts:119 [Clipstream] [useTranscriptionHandler] [INFO] Creating new clip {title: 'Recording 01'}
logger.ts:113 [Clipstream] [useTranscriptionHandler] [DEBUG] Set currentClipId for active recording {clipId: 'clip-1767021065700-ugad3twcm'}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Starting background title generation {clipId: 'clip-1767021065700-ugad3twcm', textLength: 30}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Starting background formatting {rawLength: 30}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Text formatted successfully
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Skipped contentBlocks update (not active clip) {clipId: 'clip-1767021065700-ugad3twcm', selectedClipId: undefined, currentClipId: null}
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio deleted from IndexedDB {audioId: 'audio-1767021046656-n0s7agyi9'}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Audio deleted from IndexedDB after successful transcription {audioId: 'audio-1767021046656-n0s7agyi9', clipId: 'clip-1767021065700-ugad3twcm'}
logger.ts:124 [Clipstream] [useTranscriptionHandler] [WARN] No pending clip found for background transcription
warn @ logger.ts:124
useTranscriptionHandler.useEffect @ useTranscriptionHandler.ts:246
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
IndexedDB
eval @ audioStorage.ts:132
deleteAudio @ audioStorage.ts:129
await in deleteAudio
ClipMasterScreen.useCallback[formatTranscriptionInBackground] @ ClipMasterScreen.tsx:1083
await in ClipMasterScreen.useCallback[formatTranscriptionInBackground]
useTranscriptionHandler.useEffect @ useTranscriptionHandler.ts:348
useTranscriptionHandler.useEffect @ useTranscriptionHandler.ts:376
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
eval @ react-dom-client.development.js:15325
performWorkUntilDeadline @ scheduler.development.js:44Understand this warning
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] AI title generated, updating clip {clipId: 'clip-1767021065700-ugad3twcm', title: "Mary's Unusual Tale of a Lamb"}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) {clearedContext: true}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Network offline
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB {audioId: 'audio-1767021108316-64gwxhept', size: 144295, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB {audioId: 'audio-1767021108316-64gwxhept', size: 144295, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Offline - transcription will retry when online
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Offline - clip saved as pending
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Handling offline recording {audioId: 'audio-1767021108316-64gwxhept', duration: 8, currentClipId: null}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] No currentClipId → creating parent
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Created PARENT container for offline recording {parentId: 'clip-1767021108321-si32pbf6u', title: 'Recording 01'}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Created FIRST CHILD for offline recording {childId: 'clip-1767021108321-6348ncvko0d', parentId: 'clip-1767021108321-si32pbf6u', parentTitle: 'Recording 01', childTitle: 'Clip 001'}
logger.ts:113 [Clipstream] [useOfflineRecording] [DEBUG] Set selectedPendingClips to first child {pendingClip: {…}}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Recording from pending clip (adding successive recording) {clipId: 'clip-1767021108321-6348ncvko0d', pendingTitle: 'Clip 001'}
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB {audioId: 'audio-1767021125359-wly0zrwj3', size: 178393, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB {audioId: 'audio-1767021125359-wly0zrwj3', size: 178393, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Offline - transcription will retry when online
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Offline - clip saved as pending
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Handling offline recording {audioId: 'audio-1767021125359-wly0zrwj3', duration: 11, currentClipId: 'clip-1767021108321-6348ncvko0d'}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Appending to pending file {parentId: 'clip-1767021108321-si32pbf6u', parentStatus: null}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Created CHILD for offline recording {childId: 'clip-1767021125364-ygkp1100lj', parentId: 'clip-1767021108321-si32pbf6u', parentTitle: 'Recording 01', parentStatus: null, childTitle: 'Clip 002'}
logger.ts:113 [Clipstream] [useOfflineRecording] [DEBUG] Added child to selectedPendingClips {pendingClip: {…}}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Recording from pending clip (adding successive recording) {clipId: 'clip-1767021108321-6348ncvko0d', pendingTitle: 'Clip 001'}
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB {audioId: 'audio-1767021138033-6l9v9zgmq', size: 109231, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB {audioId: 'audio-1767021138033-6l9v9zgmq', size: 109231, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Offline - transcription will retry when online
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Offline - clip saved as pending
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Handling offline recording {audioId: 'audio-1767021138033-6l9v9zgmq', duration: 6, currentClipId: 'clip-1767021108321-6348ncvko0d'}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Appending to pending file {parentId: 'clip-1767021108321-si32pbf6u', parentStatus: null}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Created CHILD for offline recording {childId: 'clip-1767021138037-62iked0c4y5', parentId: 'clip-1767021108321-si32pbf6u', parentTitle: 'Recording 01', parentStatus: null, childTitle: 'Clip 003'}
logger.ts:113 [Clipstream] [useOfflineRecording] [DEBUG] Added child to selectedPendingClips {pendingClip: {…}}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Recording from pending clip (adding successive recording) {clipId: 'clip-1767021108321-6348ncvko0d', pendingTitle: 'Clip 001'}
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB {audioId: 'audio-1767021149469-4hwmvtc49', size: 92681, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB {audioId: 'audio-1767021149469-4hwmvtc49', size: 92681, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Offline - transcription will retry when online
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Offline - clip saved as pending
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Handling offline recording {audioId: 'audio-1767021149469-4hwmvtc49', duration: 5, currentClipId: 'clip-1767021108321-6348ncvko0d'}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Appending to pending file {parentId: 'clip-1767021108321-si32pbf6u', parentStatus: null}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Created CHILD for offline recording {childId: 'clip-1767021149475-aca79wkv4ue', parentId: 'clip-1767021108321-si32pbf6u', parentTitle: 'Recording 01', parentStatus: null, childTitle: 'Clip 004'}
logger.ts:113 [Clipstream] [useOfflineRecording] [DEBUG] Added child to selectedPendingClips {pendingClip: {…}}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) {clearedContext: true}
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB {audioId: 'audio-1767021186718-g9svpof0a', size: 91699, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB {audioId: 'audio-1767021186718-g9svpof0a', size: 91699, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Offline - transcription will retry when online
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Offline - clip saved as pending
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Handling offline recording {audioId: 'audio-1767021186718-g9svpof0a', duration: 5, currentClipId: null}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] No currentClipId → creating parent
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Created PARENT container for offline recording {parentId: 'clip-1767021186723-hqx6kzuoq', title: 'Recording 02'}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Created FIRST CHILD for offline recording {childId: 'clip-1767021186724-094tyly6wghr', parentId: 'clip-1767021186723-hqx6kzuoq', parentTitle: 'Recording 02', childTitle: 'Clip 001'}
logger.ts:113 [Clipstream] [useOfflineRecording] [DEBUG] Set selectedPendingClips to first child {pendingClip: {…}}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) {clearedContext: true}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Loaded parent with children {parentId: 'clip-1767021108321-si32pbf6u', childCount: 4, childOrder: Array(4)}
ClipMasterScreen.tsx:545 🟢 handleOnline FIRED - network is back online
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Network online - attempting auto-retry of pending clips
ClipMasterScreen.tsx:570 🟢 handleOnline - clips found: {total: 8, pendingCount: 5, pendingClips: Array(5)}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Found pending clips for auto-retry {count: 5}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Status transition {clipId: 'clip-1767021108321-6348ncvko0d', from: 'pending-child', to: 'transcribing', trigger: 'auto-retry-online'}
logger.ts:113 [Clipstream] [AudioStorage] [DEBUG] Audio retrieved from IndexedDB {audioId: 'audio-1767021108316-64gwxhept', size: 144295}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Auto-retrying transcription {clipId: 'clip-1767021108321-6348ncvko0d', audioId: 'audio-1767021108316-64gwxhept', size: 144295}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Setting activeHttpClipId for auto-retry {clipId: 'clip-1767021108321-6348ncvko0d', parentId: 'clip-1767021108321-si32pbf6u'}
logger.ts:113 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription {size: 144295, attempt: 1, source: 'retry-from-indexeddb'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Transcription successful {textLength: 67, preview: 'This is record zero one clip file. Clip zero zero ...'}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Stored rawText for clip {clipId: 'clip-1767021108321-6348ncvko0d', rawTextLength: 0}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Waiting for clip formatting to complete {clipId: 'clip-1767021108321-6348ncvko0d'}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Waiting for clip to complete formatting {clipId: 'clip-1767021108321-6348ncvko0d'}
logger.ts:113 [Clipstream] [useTranscriptionHandler] [DEBUG] Background transcription completed {clipId: 'clip-1767021108321-6348ncvko0d'}
logger.ts:113 [Clipstream] [useTranscriptionHandler] [DEBUG] Checking isFirstPending {clipId: 'clip-1767021108321-6348ncvko0d', parentId: 'clip-1767021108321-si32pbf6u', totalChildren: 5, hasCompleted: false, isFirst: true}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Starting background formatting {rawLength: 67}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Text formatted successfully
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Skipped contentBlocks update (not active clip) {clipId: 'clip-1767021108321-6348ncvko0d', selectedClipId: undefined, currentClipId: null}
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio deleted from IndexedDB {audioId: 'audio-1767021108316-64gwxhept'}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Audio deleted from IndexedDB after successful transcription {audioId: 'audio-1767021108316-64gwxhept', clipId: 'clip-1767021108321-6348ncvko0d'}
logger.ts:124 [Clipstream] [useTranscriptionHandler] [WARN] No pending clip found for background transcription
warn @ logger.ts:124
useTranscriptionHandler.useEffect @ useTranscriptionHandler.ts:246
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
IndexedDB
eval @ audioStorage.ts:132
deleteAudio @ audioStorage.ts:129
await in deleteAudio
ClipMasterScreen.useCallback[formatTranscriptionInBackground] @ ClipMasterScreen.tsx:1083
await in ClipMasterScreen.useCallback[formatTranscriptionInBackground]
useTranscriptionHandler.useEffect @ useTranscriptionHandler.ts:348
useTranscriptionHandler.useEffect @ useTranscriptionHandler.ts:376
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
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Clip completed successfully {clipId: 'clip-1767021108321-6348ncvko0d', waitedMs: 1600}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Clip completed successfully {clipId: 'clip-1767021108321-6348ncvko0d'}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Clearing activeHttpClipId {clipId: 'clip-1767021108321-6348ncvko0d', reason: 'HTTP complete'}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Status transition {clipId: 'clip-1767021125364-ygkp1100lj', from: 'pending-child', to: 'transcribing', trigger: 'auto-retry-online'}
logger.ts:113 [Clipstream] [AudioStorage] [DEBUG] Audio retrieved from IndexedDB {audioId: 'audio-1767021125359-wly0zrwj3', size: 178393}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Auto-retrying transcription {clipId: 'clip-1767021125364-ygkp1100lj', audioId: 'audio-1767021125359-wly0zrwj3', size: 178393}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Setting activeHttpClipId for auto-retry {clipId: 'clip-1767021125364-ygkp1100lj', parentId: 'clip-1767021108321-si32pbf6u'}
logger.ts:113 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription {size: 178393, attempt: 1, source: 'retry-from-indexeddb'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Transcription successful {textLength: 39, preview: 'File record 01. Pending clip. Clip 002....'}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Stored rawText for clip {clipId: 'clip-1767021125364-ygkp1100lj', rawTextLength: 0}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Waiting for clip formatting to complete {clipId: 'clip-1767021125364-ygkp1100lj'}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Waiting for clip to complete formatting {clipId: 'clip-1767021125364-ygkp1100lj'}
logger.ts:113 [Clipstream] [useTranscriptionHandler] [DEBUG] Background transcription completed {clipId: 'clip-1767021125364-ygkp1100lj'}
logger.ts:113 [Clipstream] [useTranscriptionHandler] [DEBUG] Checking isFirstPending {clipId: 'clip-1767021125364-ygkp1100lj', parentId: 'clip-1767021108321-si32pbf6u', totalChildren: 5, hasCompleted: true, isFirst: false}
logger.ts:113 [Clipstream] [useTranscriptionHandler] [DEBUG] Counting remaining pending {clipId: 'clip-1767021125364-ygkp1100lj', parentId: 'clip-1767021108321-si32pbf6u', remaining: 0}
logger.ts:119 [Clipstream] [useTranscriptionHandler] [INFO] Batching remaining clip {clipId: 'clip-1767021125364-ygkp1100lj', remaining: 0, batchSize: 1}
logger.ts:119 [Clipstream] [useTranscriptionHandler] [INFO] All remaining complete - displaying batch {totalBatched: 1}
logger.ts:113 [Clipstream] [useTranscriptionHandler] [DEBUG] Formatting batched transcription {clipId: 'clip-1767021125364-ygkp1100lj', textLength: 39}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Starting background formatting {rawLength: 39}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Text formatted successfully
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Skipped contentBlocks update (not active clip) {clipId: 'clip-1767021125364-ygkp1100lj', selectedClipId: 'clip-1767021108321-6348ncvko0d', currentClipId: 'clip-1767021108321-si32pbf6u'}
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio deleted from IndexedDB {audioId: 'audio-1767021125359-wly0zrwj3'}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Audio deleted from IndexedDB after successful transcription {audioId: 'audio-1767021125359-wly0zrwj3', clipId: 'clip-1767021125364-ygkp1100lj'}
logger.ts:124 [Clipstream] [useTranscriptionHandler] [WARN] No pending clip found for background transcription
warn @ logger.ts:124
useTranscriptionHandler.useEffect @ useTranscriptionHandler.ts:246
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
IndexedDB
eval @ audioStorage.ts:132
deleteAudio @ audioStorage.ts:129
await in deleteAudio
ClipMasterScreen.useCallback[formatTranscriptionInBackground] @ ClipMasterScreen.tsx:1083
await in ClipMasterScreen.useCallback[formatTranscriptionInBackground]
useTranscriptionHandler.useEffect @ useTranscriptionHandler.ts:303
useTranscriptionHandler.useEffect @ useTranscriptionHandler.ts:332
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
logger.ts:113 [Clipstream] [useTranscriptionHandler] [DEBUG] Batched transcription formatted {clipId: 'clip-1767021125364-ygkp1100lj'}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Clip completed successfully {clipId: 'clip-1767021125364-ygkp1100lj', waitedMs: 2300}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Clip completed successfully {clipId: 'clip-1767021125364-ygkp1100lj'}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Clearing activeHttpClipId {clipId: 'clip-1767021125364-ygkp1100lj', reason: 'HTTP complete'}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Status transition {clipId: 'clip-1767021138037-62iked0c4y5', from: 'pending-child', to: 'transcribing', trigger: 'auto-retry-online'}
logger.ts:113 [Clipstream] [AudioStorage] [DEBUG] Audio retrieved from IndexedDB {audioId: 'audio-1767021138033-6l9v9zgmq', size: 109231}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Auto-retrying transcription {clipId: 'clip-1767021138037-62iked0c4y5', audioId: 'audio-1767021138033-6l9v9zgmq', size: 109231}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Setting activeHttpClipId for auto-retry {clipId: 'clip-1767021138037-62iked0c4y5', parentId: 'clip-1767021108321-si32pbf6u'}
logger.ts:113 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription {size: 109231, attempt: 1, source: 'retry-from-indexeddb'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Transcription successful {textLength: 67, preview: 'This is recording zero one file. Clip zero zero th...'}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Stored rawText for clip {clipId: 'clip-1767021138037-62iked0c4y5', rawTextLength: 0}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Waiting for clip formatting to complete {clipId: 'clip-1767021138037-62iked0c4y5'}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Waiting for clip to complete formatting {clipId: 'clip-1767021138037-62iked0c4y5'}
logger.ts:113 [Clipstream] [useTranscriptionHandler] [DEBUG] Background transcription completed {clipId: 'clip-1767021138037-62iked0c4y5'}
logger.ts:113 [Clipstream] [useTranscriptionHandler] [DEBUG] Checking isFirstPending {clipId: 'clip-1767021138037-62iked0c4y5', parentId: 'clip-1767021108321-si32pbf6u', totalChildren: 5, hasCompleted: true, isFirst: false}
logger.ts:113 [Clipstream] [useTranscriptionHandler] [DEBUG] Counting remaining pending {clipId: 'clip-1767021138037-62iked0c4y5', parentId: 'clip-1767021108321-si32pbf6u', remaining: 0}
logger.ts:119 [Clipstream] [useTranscriptionHandler] [INFO] Batching remaining clip {clipId: 'clip-1767021138037-62iked0c4y5', remaining: 0, batchSize: 1}
logger.ts:119 [Clipstream] [useTranscriptionHandler] [INFO] All remaining complete - displaying batch {totalBatched: 1}
logger.ts:113 [Clipstream] [useTranscriptionHandler] [DEBUG] Formatting batched transcription {clipId: 'clip-1767021138037-62iked0c4y5', textLength: 67}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Starting background formatting {rawLength: 67}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Text formatted successfully
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Skipped contentBlocks update (not active clip) {clipId: 'clip-1767021138037-62iked0c4y5', selectedClipId: 'clip-1767021125364-ygkp1100lj', currentClipId: 'clip-1767021108321-si32pbf6u'}
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio deleted from IndexedDB {audioId: 'audio-1767021138033-6l9v9zgmq'}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Audio deleted from IndexedDB after successful transcription {audioId: 'audio-1767021138033-6l9v9zgmq', clipId: 'clip-1767021138037-62iked0c4y5'}
logger.ts:124 [Clipstream] [useTranscriptionHandler] [WARN] No pending clip found for background transcription
warn @ logger.ts:124
useTranscriptionHandler.useEffect @ useTranscriptionHandler.ts:246
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
IndexedDB
eval @ audioStorage.ts:132
deleteAudio @ audioStorage.ts:129
await in deleteAudio
ClipMasterScreen.useCallback[formatTranscriptionInBackground] @ ClipMasterScreen.tsx:1083
await in ClipMasterScreen.useCallback[formatTranscriptionInBackground]
useTranscriptionHandler.useEffect @ useTranscriptionHandler.ts:303
useTranscriptionHandler.useEffect @ useTranscriptionHandler.ts:332
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
logger.ts:113 [Clipstream] [useTranscriptionHandler] [DEBUG] Batched transcription formatted {clipId: 'clip-1767021138037-62iked0c4y5'}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Clip completed successfully {clipId: 'clip-1767021138037-62iked0c4y5', waitedMs: 1700}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Clip completed successfully {clipId: 'clip-1767021138037-62iked0c4y5'}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Clearing activeHttpClipId {clipId: 'clip-1767021138037-62iked0c4y5', reason: 'HTTP complete'}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Status transition {clipId: 'clip-1767021149475-aca79wkv4ue', from: 'pending-child', to: 'transcribing', trigger: 'auto-retry-online'}
logger.ts:113 [Clipstream] [AudioStorage] [DEBUG] Audio retrieved from IndexedDB {audioId: 'audio-1767021149469-4hwmvtc49', size: 92681}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Auto-retrying transcription {clipId: 'clip-1767021149475-aca79wkv4ue', audioId: 'audio-1767021149469-4hwmvtc49', size: 92681}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Setting activeHttpClipId for auto-retry {clipId: 'clip-1767021149475-aca79wkv4ue', parentId: 'clip-1767021108321-si32pbf6u'}
logger.ts:113 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription {size: 92681, attempt: 1, source: 'retry-from-indexeddb'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Transcription successful {textLength: 51, preview: 'This is recording zero one file clip zero zero fou...'}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Stored rawText for clip {clipId: 'clip-1767021149475-aca79wkv4ue', rawTextLength: 0}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Waiting for clip formatting to complete {clipId: 'clip-1767021149475-aca79wkv4ue'}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Waiting for clip to complete formatting {clipId: 'clip-1767021149475-aca79wkv4ue'}
logger.ts:113 [Clipstream] [useTranscriptionHandler] [DEBUG] Background transcription completed {clipId: 'clip-1767021149475-aca79wkv4ue'}
logger.ts:113 [Clipstream] [useTranscriptionHandler] [DEBUG] Checking isFirstPending {clipId: 'clip-1767021149475-aca79wkv4ue', parentId: 'clip-1767021108321-si32pbf6u', totalChildren: 5, hasCompleted: true, isFirst: false}
logger.ts:113 [Clipstream] [useTranscriptionHandler] [DEBUG] Counting remaining pending {clipId: 'clip-1767021149475-aca79wkv4ue', parentId: 'clip-1767021108321-si32pbf6u', remaining: 0}
logger.ts:119 [Clipstream] [useTranscriptionHandler] [INFO] Batching remaining clip {clipId: 'clip-1767021149475-aca79wkv4ue', remaining: 0, batchSize: 1}
logger.ts:119 [Clipstream] [useTranscriptionHandler] [INFO] All remaining complete - displaying batch {totalBatched: 1}
logger.ts:113 [Clipstream] [useTranscriptionHandler] [DEBUG] Formatting batched transcription {clipId: 'clip-1767021149475-aca79wkv4ue', textLength: 51}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Starting background formatting {rawLength: 51}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Text formatted successfully
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Skipped contentBlocks update (not active clip) {clipId: 'clip-1767021149475-aca79wkv4ue', selectedClipId: 'clip-1767021138037-62iked0c4y5', currentClipId: 'clip-1767021108321-si32pbf6u'}
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio deleted from IndexedDB {audioId: 'audio-1767021149469-4hwmvtc49'}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Audio deleted from IndexedDB after successful transcription {audioId: 'audio-1767021149469-4hwmvtc49', clipId: 'clip-1767021149475-aca79wkv4ue'}
logger.ts:124 [Clipstream] [useTranscriptionHandler] [WARN] No pending clip found for background transcription
warn @ logger.ts:124
useTranscriptionHandler.useEffect @ useTranscriptionHandler.ts:246
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
IndexedDB
eval @ audioStorage.ts:132
deleteAudio @ audioStorage.ts:129
await in deleteAudio
ClipMasterScreen.useCallback[formatTranscriptionInBackground] @ ClipMasterScreen.tsx:1083
await in ClipMasterScreen.useCallback[formatTranscriptionInBackground]
useTranscriptionHandler.useEffect @ useTranscriptionHandler.ts:303
useTranscriptionHandler.useEffect @ useTranscriptionHandler.ts:332
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
logger.ts:113 [Clipstream] [useTranscriptionHandler] [DEBUG] Batched transcription formatted {clipId: 'clip-1767021149475-aca79wkv4ue'}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Clip completed successfully {clipId: 'clip-1767021149475-aca79wkv4ue', waitedMs: 700}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Clip completed successfully {clipId: 'clip-1767021149475-aca79wkv4ue'}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Clearing activeHttpClipId {clipId: 'clip-1767021149475-aca79wkv4ue', reason: 'HTTP complete'}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Status transition {clipId: 'clip-1767021186724-094tyly6wghr', from: 'pending-child', to: 'transcribing', trigger: 'auto-retry-online'}
logger.ts:113 [Clipstream] [AudioStorage] [DEBUG] Audio retrieved from IndexedDB {audioId: 'audio-1767021186718-g9svpof0a', size: 91699}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Auto-retrying transcription {clipId: 'clip-1767021186724-094tyly6wghr', audioId: 'audio-1767021186718-g9svpof0a', size: 91699}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Setting activeHttpClipId for auto-retry {clipId: 'clip-1767021186724-094tyly6wghr', parentId: 'clip-1767021186723-hqx6kzuoq'}
logger.ts:113 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription {size: 91699, attempt: 1, source: 'retry-from-indexeddb'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Transcription successful {textLength: 36, preview: 'This is record 0 two clip zero 0 one...'}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Stored rawText for clip {clipId: 'clip-1767021186724-094tyly6wghr', rawTextLength: 0}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Waiting for clip formatting to complete {clipId: 'clip-1767021186724-094tyly6wghr'}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Waiting for clip to complete formatting {clipId: 'clip-1767021186724-094tyly6wghr'}
logger.ts:113 [Clipstream] [useTranscriptionHandler] [DEBUG] Background transcription completed {clipId: 'clip-1767021186724-094tyly6wghr'}
logger.ts:113 [Clipstream] [useTranscriptionHandler] [DEBUG] Checking isFirstPending {clipId: 'clip-1767021186724-094tyly6wghr', parentId: 'clip-1767021186723-hqx6kzuoq', totalChildren: 2, hasCompleted: false, isFirst: true}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Starting background formatting {rawLength: 36}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Text formatted successfully
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Skipped contentBlocks update (not active clip) {clipId: 'clip-1767021186724-094tyly6wghr', selectedClipId: 'clip-1767021149475-aca79wkv4ue', currentClipId: 'clip-1767021108321-si32pbf6u'}
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio deleted from IndexedDB {audioId: 'audio-1767021186718-g9svpof0a'}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Audio deleted from IndexedDB after successful transcription {audioId: 'audio-1767021186718-g9svpof0a', clipId: 'clip-1767021186724-094tyly6wghr'}
logger.ts:124 [Clipstream] [useTranscriptionHandler] [WARN] No pending clip found for background transcription
warn @ logger.ts:124
useTranscriptionHandler.useEffect @ useTranscriptionHandler.ts:246
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
IndexedDB
eval @ audioStorage.ts:132
deleteAudio @ audioStorage.ts:129
await in deleteAudio
ClipMasterScreen.useCallback[formatTranscriptionInBackground] @ ClipMasterScreen.tsx:1083
await in ClipMasterScreen.useCallback[formatTranscriptionInBackground]
useTranscriptionHandler.useEffect @ useTranscriptionHandler.ts:348
useTranscriptionHandler.useEffect @ useTranscriptionHandler.ts:376
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
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Clip completed successfully {clipId: 'clip-1767021186724-094tyly6wghr', waitedMs: 1600}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Clip completed successfully {clipId: 'clip-1767021186724-094tyly6wghr'}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Clearing activeHttpClipId {clipId: 'clip-1767021186724-094tyly6wghr', reason: 'HTTP complete'}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) {clearedContext: true}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Loaded parent with children {parentId: 'clip-1767021108321-si32pbf6u', childCount: 4, childOrder: Array(4)}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) {clearedContext: true}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Loaded parent with children {parentId: 'clip-1767021186723-hqx6kzuoq', childCount: 1, childOrder: Array(1)}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) {clearedContext: true}
hot-reloader-pages.js:207 [Fast Refresh] rebuilding
report-hmr-latency.js:14 [Fast Refresh] done in 390ms
hot-reloader-pages.js:207 [Fast Refresh] rebuilding
report-hmr-latency.js:14 [Fast Refresh] done in 42ms
hot-reloader-pages.js:207 [Fast Refresh] rebuilding


SessionStorage localhost:3000

{state: {clips: [,…], selectedClip: null}, version: 1}
state
: 
{clips: [,…], selectedClip: null}
clips
: 
[,…]
0
: 
{id: "clip-1767021065700-ugad3twcm", title: "Mary's Unusual Tale of a Lamb", date: "Dec 29, 2025",…}
content
: 
"Mary had a little bloody lamb."
createdAt
: 
1767021065700
currentView
: 
"formatted"
date
: 
"Dec 29, 2025"
formattedText
: 
"Mary had a little bloody lamb.Mary had a little bloody lamb."
id
: 
"clip-1767021065700-ugad3twcm"
rawText
: 
"Mary had a little bloody lamb."
status
: 
null
title
: 
"Mary's Unusual Tale of a Lamb"
1
: 
{id: "clip-1767021108321-si32pbf6u", title: "Recording 01", date: "Dec 29, 2025", status: null,…}
content
: 
""
createdAt
: 
1767021108321
currentView
: 
"formatted"
date
: 
"Dec 29, 2025"
id
: 
"clip-1767021108321-si32pbf6u"
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
{id: "clip-1767021108321-6348ncvko0d", title: "Recording 01", date: "Dec 29, 2025", status: null,…}
content
: 
""
createdAt
: 
1767021108321
currentView
: 
"formatted"
date
: 
"Dec 29, 2025"
duration
: 
"0:08"
formattedText
: 
"This is record zero one clip file.  \nClip zero zero one pending clip."
id
: 
"clip-1767021108321-6348ncvko0d"
parentId
: 
"clip-1767021108321-si32pbf6u"
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
3
: 
{id: "clip-1767021125364-ygkp1100lj", title: "Recording 01", date: "Dec 29, 2025", status: null,…}
content
: 
""
createdAt
: 
1767021125364
currentView
: 
"formatted"
date
: 
"Dec 29, 2025"
duration
: 
"0:11"
formattedText
: 
"File record 01.  \nPending clip.  \nClip 002."
id
: 
"clip-1767021125364-ygkp1100lj"
parentId
: 
"clip-1767021108321-si32pbf6u"
pendingClipTitle
: 
"Clip 002"
rawText
: 
""
status
: 
null
title
: 
"Recording 01"
4
: 
{id: "clip-1767021138037-62iked0c4y5", title: "Recording 01", date: "Dec 29, 2025", status: null,…}
content
: 
""
createdAt
: 
1767021138037
currentView
: 
"formatted"
date
: 
"Dec 29, 2025"
duration
: 
"0:06"
formattedText
: 
"This is recording zero one file.  \nClip zero zero three pending clip."
id
: 
"clip-1767021138037-62iked0c4y5"
parentId
: 
"clip-1767021108321-si32pbf6u"
pendingClipTitle
: 
"Clip 003"
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
{id: "clip-1767021149475-aca79wkv4ue", title: "Recording 01", date: "Dec 29, 2025", status: null,…}
content
: 
""
createdAt
: 
1767021149475
currentView
: 
"formatted"
date
: 
"Dec 29, 2025"
duration
: 
"0:05"
formattedText
: 
"This is recording zero one, file clip zero zero four."
id
: 
"clip-1767021149475-aca79wkv4ue"
parentId
: 
"clip-1767021108321-si32pbf6u"
pendingClipTitle
: 
"Clip 004"
rawText
: 
""
status
: 
null
title
: 
"Recording 01"
6
: 
{id: "clip-1767021186723-hqx6kzuoq", title: "Recording 02", date: "Dec 29, 2025", status: null,…}
content
: 
""
createdAt
: 
1767021186724
currentView
: 
"formatted"
date
: 
"Dec 29, 2025"
id
: 
"clip-1767021186723-hqx6kzuoq"
rawText
: 
""
status
: 
null
title
: 
"Recording 02"
7
: 
{id: "clip-1767021186724-094tyly6wghr", title: "Recording 02", date: "Dec 29, 2025", status: null,…}
content
: 
""
createdAt
: 
1767021186724
currentView
: 
"formatted"
date
: 
"Dec 29, 2025"
duration
: 
"0:05"
formattedText
: 
"This is record 0, two, clip zero, 0, one."
id
: 
"clip-1767021186724-094tyly6wghr"
parentId
: 
"clip-1767021186723-hqx6kzuoq"
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
"Recording 02"
selectedClip
: 
null
version
: 
1


terminal

ET /ai-confidence-tracker/deepshowcase/deepLibrary 200 in 358ms
 GET /clipperstream/showcase/clipscreencomponents 200 in 411ms
 GET /clipperstream/showcase/clipscreencomponents 200 in 403ms
 GET /clipperstream/showcase/clipscreencomponents 200 in 245ms
 ✓ Compiled /api/clipperstream/transcribe in 193ms (273 modules)
(node:6153) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
Files received: [ 'audio' ]
Processing audio file: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/ek10uzv3odnz9yxq7rm0kgs3b, size: 76115 bytes, type: audio/webm;codecs=opus
 POST /api/clipperstream/transcribe 200 in 19035ms
 ✓ Compiled /api/clipperstream/format-text in 147ms (279 modules)
 ✓ Compiled (282 modules)
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
 POST /api/clipperstream/format-text 200 in 1402ms
[Clipstream] [TitleGenerator] [INFO] Title generated successfully { title: "Mary's Unusual Tale of a Lamb" }
[Clipstream] [API/generate-title] [INFO] Title generated successfully { title: "Mary's Unusual Tale of a Lamb" }
 POST /api/clipperstream/generate-title 200 in 1421ms
Files received: [ 'audio' ]
Processing audio file: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/qfzg9z9vn8orim8f16vk0ww5m, size: 144295 bytes, type: audio/webm;codecs=opus
 POST /api/clipperstream/transcribe 200 in 4890ms
[Clipstream] [API/format-text] [DEBUG] Request received { method: 'POST' }
[Clipstream] [API/format-text] [DEBUG] API key check { hasKey: true }
[Clipstream] [API/format-text] [DEBUG] Calling formatter service { rawLength: 67, hasContext: false }
[Clipstream] [TextFormatter] [DEBUG] Starting text formatting { rawLength: 67, hasContext: false }
[Clipstream] [TextFormatter] [DEBUG] Calling OpenAI generateText API
[Clipstream] [TextFormatter] [INFO] Text formatted successfully { rawLength: 67, formattedLength: 69 }
[Clipstream] [API/format-text] [INFO] Text formatted successfully
 POST /api/clipperstream/format-text 200 in 1503ms
Files received: [ 'audio' ]
Processing audio file: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/lj8zx5nmdacmqpdt4e77247ss, size: 178393 bytes, type: audio/webm;codecs=opus
 POST /api/clipperstream/transcribe 200 in 683ms
[Clipstream] [API/format-text] [DEBUG] Request received { method: 'POST' }
[Clipstream] [API/format-text] [DEBUG] API key check { hasKey: true }
[Clipstream] [API/format-text] [DEBUG] Calling formatter service { rawLength: 39, hasContext: false }
[Clipstream] [TextFormatter] [DEBUG] Starting text formatting { rawLength: 39, hasContext: false }
[Clipstream] [TextFormatter] [DEBUG] Calling OpenAI generateText API
[Clipstream] [TextFormatter] [INFO] Text formatted successfully { rawLength: 39, formattedLength: 43 }
[Clipstream] [API/format-text] [INFO] Text formatted successfully
 POST /api/clipperstream/format-text 200 in 2213ms
Files received: [ 'audio' ]
Processing audio file: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/wt4tz0aggb0ph75cmizo3us9s, size: 109231 bytes, type: audio/webm;codecs=opus
 POST /api/clipperstream/transcribe 200 in 288ms
[Clipstream] [API/format-text] [DEBUG] Request received { method: 'POST' }
[Clipstream] [API/format-text] [DEBUG] API key check { hasKey: true }
[Clipstream] [API/format-text] [DEBUG] Calling formatter service { rawLength: 67, hasContext: false }
[Clipstream] [TextFormatter] [DEBUG] Starting text formatting { rawLength: 67, hasContext: false }
[Clipstream] [TextFormatter] [DEBUG] Calling OpenAI generateText API
[Clipstream] [TextFormatter] [INFO] Text formatted successfully { rawLength: 67, formattedLength: 69 }
[Clipstream] [API/format-text] [INFO] Text formatted successfully
 POST /api/clipperstream/format-text 200 in 1633ms
Files received: [ 'audio' ]
Processing audio file: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/mzk6fim04uzhubb2die7xmvhs, size: 92681 bytes, type: audio/webm;codecs=opus
 POST /api/clipperstream/transcribe 200 in 888ms
[Clipstream] [API/format-text] [DEBUG] Request received { method: 'POST' }
[Clipstream] [API/format-text] [DEBUG] API key check { hasKey: true }
[Clipstream] [API/format-text] [DEBUG] Calling formatter service { rawLength: 51, hasContext: false }
[Clipstream] [TextFormatter] [DEBUG] Starting text formatting { rawLength: 51, hasContext: false }
[Clipstream] [TextFormatter] [DEBUG] Calling OpenAI generateText API
[Clipstream] [TextFormatter] [INFO] Text formatted successfully { rawLength: 51, formattedLength: 53 }
[Clipstream] [API/format-text] [INFO] Text formatted successfully
 POST /api/clipperstream/format-text 200 in 665ms
Files received: [ 'audio' ]
Processing audio file: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/tbjqr8hro7cfsrwxe2jylcygi, size: 91699 bytes, type: audio/webm;codecs=opus
 POST /api/clipperstream/transcribe 200 in 366ms
[Clipstream] [API/format-text] [DEBUG] Request received { method: 'POST' }
[Clipstream] [API/format-text] [DEBUG] API key check { hasKey: true }
[Clipstream] [API/format-text] [DEBUG] Calling formatter service { rawLength: 36, hasContext: false }
[Clipstream] [TextFormatter] [DEBUG] Starting text formatting { rawLength: 36, hasContext: false }
[Clipstream] [TextFormatter] [DEBUG] Calling OpenAI generateText API
[Clipstream] [TextFormatter] [INFO] Text formatted successfully { rawLength: 36, formattedLength: 41 }
[Clipstream] [API/format-text] [INFO] Text formatted successfully
 POST /api/clipperstream/format-text 200 in 1567ms
 ✓ Compiled in 377ms (224 modules)
 ✓ Compiled /ai-confidence-tracker/deepshowcase/deepLibrary in 71ms (530 modules)
 GET /ai-confidence-tracker/deepshowcase/deepLibrary 200 in 349ms
 ✓ Compiled in 125ms (238 modules)
 ✓ Compiled in 215ms (224 modules)
 ✓ Compiled /ai-confidence-tracker/deepshowcase/deepLibrary in 216ms (449 modules)
 GET /ai-confidence-tracker/deepshowcase/deepLibrary 200 in 490ms
