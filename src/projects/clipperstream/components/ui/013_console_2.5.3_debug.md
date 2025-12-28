[Clipstream] [useClipState] [DEBUG] Clips initialized from storage Object
logger.ts:113 [Clipstream] [AudioStorage] [DEBUG] IndexedDB initialized successfully
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB {audioId: 'audio-1766938222729-neyfkuk5w', size: 127745, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB {audioId: 'audio-1766938222729-neyfkuk5w', size: 127745, type: 'audio/webm;codecs=opus'}
logger.ts:113 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription {size: 127745, attempt: 1, source: 'fresh-recording'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Transcription successful {textLength: 53, preview: 'Mary had a little lamb, a bloody little lamb at th...'}
logger.ts:113 [Clipstream] [useTranscriptionHandler] [DEBUG] Active recording completed {clipId: null}
logger.ts:113 [Clipstream] [useTranscriptionHandler] [DEBUG] Creating new clip with transcription
logger.ts:119 [Clipstream] [useTranscriptionHandler] [INFO] Creating new clip {title: 'Recording 01'}
logger.ts:119 [Clipstream] [useClipState] [INFO] Creating new clip {title: 'Recording 01', hasContent: true}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 1}
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip {clipId: 'clip-1766938224093-n1tv160le', updates: {…}}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 1}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 1}
logger.ts:113 [Clipstream] [useTranscriptionHandler] [DEBUG] Set currentClipId for active recording {clipId: 'clip-1766938224093-n1tv160le'}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Starting background title generation {clipId: 'clip-1766938224093-n1tv160le', textLength: 53}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Starting background formatting {rawLength: 53}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] AI title generated, updating clip {clipId: 'clip-1766938224093-n1tv160le', title: "Mary's Unusual Encounter with a Lamb"}
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip {clipId: 'clip-1766938224093-n1tv160le', updates: {…}}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 1}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 1}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Text formatted successfully
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip {clipId: 'clip-1766938224093-n1tv160le', updates: {…}}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 1}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 1}
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio deleted from IndexedDB {audioId: 'audio-1766938222729-neyfkuk5w'}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Audio deleted from IndexedDB after successful transcription {audioId: 'audio-1766938222729-neyfkuk5w', clipId: 'clip-1766938224093-n1tv160le'}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Status transition {clipId: 'clip-1766938224093-n1tv160le', from: 'transcribing', to: null, trigger: 'transcription-complete'}
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip {clipId: 'clip-1766938224093-n1tv160le', updates: {…}}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 1}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 1}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) {clearedContext: true}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Network offline
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB {audioId: 'audio-1766938250717-h5hiw8bl7', size: 68323, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB {audioId: 'audio-1766938250717-h5hiw8bl7', size: 68323, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Offline - transcription will retry when online
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Offline - clip saved as pending
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Handling offline recording {audioId: 'audio-1766938250717-h5hiw8bl7', duration: 4, currentClipId: null}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] No currentClipId → creating parent
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Created PARENT container for offline recording {parentId: 'clip-1766938250719-q2mkhtz2q', title: 'Recording 01'}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Created FIRST CHILD for offline recording {childId: 'clip-1766938250719-4k36tu151v', parentId: 'clip-1766938250719-q2mkhtz2q', parentTitle: 'Recording 01', childTitle: 'Clip 001'}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 3}
logger.ts:113 [Clipstream] [useOfflineRecording] [DEBUG] Set selectedPendingClips to first child {pendingClip: {…}}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Recording from pending clip (adding successive recording) {clipId: 'clip-1766938250719-4k36tu151v', pendingTitle: 'Clip 001'}
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB {audioId: 'audio-1766938258310-494dizzxz', size: 95595, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB {audioId: 'audio-1766938258310-494dizzxz', size: 95595, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Offline - transcription will retry when online
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Offline - clip saved as pending
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Handling offline recording {audioId: 'audio-1766938258310-494dizzxz', duration: 5, currentClipId: 'clip-1766938250719-4k36tu151v'}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Appending to pending file {parentId: 'clip-1766938250719-q2mkhtz2q', parentStatus: null}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Created CHILD for offline recording {childId: 'clip-1766938258314-qd6yd76tw07', parentId: 'clip-1766938250719-q2mkhtz2q', parentTitle: 'Recording 01', parentStatus: null, childTitle: 'Clip 002'}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 4}
logger.ts:113 [Clipstream] [useOfflineRecording] [DEBUG] Added child to selectedPendingClips {pendingClip: {…}}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Recording from pending clip (adding successive recording) {clipId: 'clip-1766938250719-4k36tu151v', pendingTitle: 'Clip 001'}
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB {audioId: 'audio-1766938263709-rkii28484', size: 55669, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB {audioId: 'audio-1766938263709-rkii28484', size: 55669, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Offline - transcription will retry when online
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Offline - clip saved as pending
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Handling offline recording {audioId: 'audio-1766938263709-rkii28484', duration: 3, currentClipId: 'clip-1766938250719-4k36tu151v'}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Appending to pending file {parentId: 'clip-1766938250719-q2mkhtz2q', parentStatus: null}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Created CHILD for offline recording {childId: 'clip-1766938263714-j3wwxrqf3x8', parentId: 'clip-1766938250719-q2mkhtz2q', parentTitle: 'Recording 01', parentStatus: null, childTitle: 'Clip 003'}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 5}
logger.ts:113 [Clipstream] [useOfflineRecording] [DEBUG] Added child to selectedPendingClips {pendingClip: {…}}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Recording from pending clip (adding successive recording) {clipId: 'clip-1766938250719-4k36tu151v', pendingTitle: 'Clip 001'}
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB {audioId: 'audio-1766938272243-f1uk2ftbs', size: 112161, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB {audioId: 'audio-1766938272243-f1uk2ftbs', size: 112161, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Offline - transcription will retry when online
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Offline - clip saved as pending
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Handling offline recording {audioId: 'audio-1766938272243-f1uk2ftbs', duration: 6, currentClipId: 'clip-1766938250719-4k36tu151v'}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Appending to pending file {parentId: 'clip-1766938250719-q2mkhtz2q', parentStatus: null}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Created CHILD for offline recording {childId: 'clip-1766938272247-x1fvn7d627r', parentId: 'clip-1766938250719-q2mkhtz2q', parentTitle: 'Recording 01', parentStatus: null, childTitle: 'Clip 004'}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 6}
logger.ts:113 [Clipstream] [useOfflineRecording] [DEBUG] Added child to selectedPendingClips {pendingClip: {…}}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) {clearedContext: true}
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB {audioId: 'audio-1766938281717-i9x5p9q36', size: 64427, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB {audioId: 'audio-1766938281717-i9x5p9q36', size: 64427, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Offline - transcription will retry when online
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Offline - clip saved as pending
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Handling offline recording {audioId: 'audio-1766938281717-i9x5p9q36', duration: 3, currentClipId: 'clip-1766938224093-n1tv160le'}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Appending to transcribed/completed file {parentId: 'clip-1766938224093-n1tv160le', parentStatus: null}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Created CHILD for offline recording {childId: 'clip-1766938281720-z9tknbvbuk', parentId: 'clip-1766938224093-n1tv160le', parentTitle: "Mary's Unusual Encounter with a Lamb", parentStatus: null, childTitle: 'Clip 001'}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 7}
logger.ts:113 [Clipstream] [useOfflineRecording] [DEBUG] Added child to selectedPendingClips {pendingClip: {…}}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Offline append - staying in complete state to preserve existing content access
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) {clearedContext: true}
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB {audioId: 'audio-1766938292167-vclm8j1x8', size: 98525, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB {audioId: 'audio-1766938292167-vclm8j1x8', size: 98525, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Offline - transcription will retry when online
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Offline - clip saved as pending
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Handling offline recording {audioId: 'audio-1766938292167-vclm8j1x8', duration: 6, currentClipId: null}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] No currentClipId → creating parent
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Created PARENT container for offline recording {parentId: 'clip-1766938292170-nuuq4d149', title: 'Recording 02'}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Created FIRST CHILD for offline recording {childId: 'clip-1766938292170-pkxs43hoet', parentId: 'clip-1766938292170-nuuq4d149', parentTitle: 'Recording 02', childTitle: 'Clip 001'}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}
logger.ts:113 [Clipstream] [useOfflineRecording] [DEBUG] Set selectedPendingClips to first child {pendingClip: {…}}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) {clearedContext: true}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Loaded parent with children {parentId: 'clip-1766938224093-n1tv160le', childCount: 1, childOrder: Array(1)}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) {clearedContext: true}
ClipMasterScreen.tsx:459 🟢 handleOnline FIRED - network is back online
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Network online - attempting auto-retry of pending clips
ClipMasterScreen.tsx:483 🟢 handleOnline - clips found: {total: 9, pendingCount: 6, pendingClips: Array(6)}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Found pending clips for auto-retry {count: 6}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Status transition {clipId: 'clip-1766938250719-4k36tu151v', from: 'pending-child', to: 'transcribing', trigger: 'auto-retry-online'}
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip {clipId: 'clip-1766938250719-4k36tu151v', updates: {…}}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}
logger.ts:113 [Clipstream] [AudioStorage] [DEBUG] Audio retrieved from IndexedDB {audioId: 'audio-1766938250717-h5hiw8bl7', size: 68323}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Auto-retrying transcription {clipId: 'clip-1766938250719-4k36tu151v', audioId: 'audio-1766938250717-h5hiw8bl7', size: 68323}
logger.ts:113 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription {size: 68323, attempt: 1, source: 'retry-from-indexeddb'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Transcription successful {textLength: 27, preview: 'This is clip zero zero one....'}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Status transition {clipId: 'clip-1766938258314-qd6yd76tw07', from: 'pending-child', to: 'transcribing', trigger: 'auto-retry-online'}
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip {clipId: 'clip-1766938258314-qd6yd76tw07', updates: {…}}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}
logger.ts:113 [Clipstream] [useTranscriptionHandler] [DEBUG] Background transcription completed {clipId: 'clip-1766938250719-4k36tu151v'}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Starting background formatting {rawLength: 27}
logger.ts:113 [Clipstream] [AudioStorage] [DEBUG] Audio retrieved from IndexedDB {audioId: 'audio-1766938258310-494dizzxz', size: 95595}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Auto-retrying transcription {clipId: 'clip-1766938258314-qd6yd76tw07', audioId: 'audio-1766938258310-494dizzxz', size: 95595}
logger.ts:113 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription {size: 95595, attempt: 1, source: 'retry-from-indexeddb'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Transcription successful {textLength: 46, preview: 'Clip zero zero two is now recording yes I know...'}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Status transition {clipId: 'clip-1766938263714-j3wwxrqf3x8', from: 'pending-child', to: 'transcribing', trigger: 'auto-retry-online'}
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip {clipId: 'clip-1766938263714-j3wwxrqf3x8', updates: {…}}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}
logger.ts:113 [Clipstream] [AudioStorage] [DEBUG] Audio retrieved from IndexedDB {audioId: 'audio-1766938263709-rkii28484', size: 55669}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Auto-retrying transcription {clipId: 'clip-1766938263714-j3wwxrqf3x8', audioId: 'audio-1766938263709-rkii28484', size: 55669}
logger.ts:113 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription {size: 55669, attempt: 1, source: 'retry-from-indexeddb'}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Text formatted successfully
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip {clipId: 'clip-1766938250719-4k36tu151v', updates: {…}}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio deleted from IndexedDB {audioId: 'audio-1766938250717-h5hiw8bl7'}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Audio deleted from IndexedDB after successful transcription {audioId: 'audio-1766938250717-h5hiw8bl7', clipId: 'clip-1766938250719-4k36tu151v'}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Status transition {clipId: 'clip-1766938250719-4k36tu151v', from: 'transcribing', to: null, trigger: 'transcription-complete'}
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip {clipId: 'clip-1766938250719-4k36tu151v', updates: {…}}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Transcription successful {textLength: 33, preview: 'Clip zero zero three without fail...'}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Status transition {clipId: 'clip-1766938272247-x1fvn7d627r', from: 'pending-child', to: 'transcribing', trigger: 'auto-retry-online'}
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip {clipId: 'clip-1766938272247-x1fvn7d627r', updates: {…}}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}
logger.ts:113 [Clipstream] [useTranscriptionHandler] [DEBUG] Background transcription completed {clipId: 'clip-1766938258314-qd6yd76tw07'}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Starting background formatting {rawLength: 33}
logger.ts:113 [Clipstream] [AudioStorage] [DEBUG] Audio retrieved from IndexedDB {audioId: 'audio-1766938272243-f1uk2ftbs', size: 112161}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Auto-retrying transcription {clipId: 'clip-1766938272247-x1fvn7d627r', audioId: 'audio-1766938272243-f1uk2ftbs', size: 112161}
logger.ts:113 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription {size: 112161, attempt: 1, source: 'retry-from-indexeddb'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Transcription successful {textLength: 72, preview: 'Clip zero zero four now in bloody session, baby bo...'}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Status transition {clipId: 'clip-1766938281720-z9tknbvbuk', from: 'pending-child', to: 'transcribing', trigger: 'auto-retry-online'}
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip {clipId: 'clip-1766938281720-z9tknbvbuk', updates: {…}}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}
logger.ts:113 [Clipstream] [AudioStorage] [DEBUG] Audio retrieved from IndexedDB {audioId: 'audio-1766938281717-i9x5p9q36', size: 64427}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Auto-retrying transcription {clipId: 'clip-1766938281720-z9tknbvbuk', audioId: 'audio-1766938281717-i9x5p9q36', size: 64427}
logger.ts:113 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription {size: 64427, attempt: 1, source: 'retry-from-indexeddb'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Transcription successful {textLength: 36, preview: 'Clip zero zero five has now started....'}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Status transition {clipId: 'clip-1766938292170-pkxs43hoet', from: 'pending-child', to: 'transcribing', trigger: 'auto-retry-online'}
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip {clipId: 'clip-1766938292170-pkxs43hoet', updates: {…}}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}
logger.ts:113 [Clipstream] [AudioStorage] [DEBUG] Audio retrieved from IndexedDB {audioId: 'audio-1766938292167-vclm8j1x8', size: 98525}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Auto-retrying transcription {clipId: 'clip-1766938292170-pkxs43hoet', audioId: 'audio-1766938292167-vclm8j1x8', size: 98525}
logger.ts:113 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription {size: 98525, attempt: 1, source: 'retry-from-indexeddb'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Transcription successful {textLength: 55, preview: 'Clip zero zero six recording zero two is now in se...'}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Text formatted successfully
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip {clipId: 'clip-1766938258314-qd6yd76tw07', updates: {…}}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio deleted from IndexedDB {audioId: 'audio-1766938258310-494dizzxz'}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Audio deleted from IndexedDB after successful transcription {audioId: 'audio-1766938258310-494dizzxz', clipId: 'clip-1766938258314-qd6yd76tw07'}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Status transition {clipId: 'clip-1766938258314-qd6yd76tw07', from: 'transcribing', to: null, trigger: 'transcription-complete'}
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip {clipId: 'clip-1766938258314-qd6yd76tw07', updates: {…}}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Loaded parent with children {parentId: 'clip-1766938250719-q2mkhtz2q', childCount: 4, childOrder: Array(4)}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) {clearedContext: true}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Loaded parent with children {parentId: 'clip-1766938224093-n1tv160le', childCount: 1, childOrder: Array(1)}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) {clearedContext: true}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Loaded parent with children {parentId: 'clip-1766938250719-q2mkhtz2q', childCount: 4, childOrder: Array(4)}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) {clearedContext: true}
3hot-reloader-pages.js:207 [Fast Refresh] rebuilding


Session Storage: localhost:3000

[{id: "clip-1766938292170-nuuq4d149", title: "Recording 02", date: "Dec 28, 2025", status: null,…},…]
0
: 
{id: "clip-1766938292170-nuuq4d149", title: "Recording 02", date: "Dec 28, 2025", status: null,…}
content
: 
""
createdAt
: 
1766938292170
currentView
: 
"formatted"
date
: 
"Dec 28, 2025"
id
: 
"clip-1766938292170-nuuq4d149"
rawText
: 
""
status
: 
null
title
: 
"Recording 02"
1
: 
{id: "clip-1766938250719-q2mkhtz2q", title: "Recording 01", date: "Dec 28, 2025", status: null,…}
content
: 
""
createdAt
: 
1766938250719
currentView
: 
"formatted"
date
: 
"Dec 28, 2025"
id
: 
"clip-1766938250719-q2mkhtz2q"
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
{id: "clip-1766938224093-n1tv160le", title: "Mary's Unusual Encounter with a Lamb",…}
content
: 
"Mary had a little lamb, a bloody little lamb at that."
createdAt
: 
1766938224093
currentView
: 
"formatted"
date
: 
"Dec 28, 2025"
formattedText
: 
"Mary had a little lamb,  \na bloody little lamb at that."
id
: 
"clip-1766938224093-n1tv160le"
rawText
: 
"Mary had a little lamb, a bloody little lamb at that."
status
: 
null
title
: 
"Mary's Unusual Encounter with a Lamb"
3
: 
{id: "clip-1766938250719-4k36tu151v", title: "Recording 01", date: "Dec 28, 2025", status: null,…}
content
: 
""
createdAt
: 
1766938250719
currentView
: 
"formatted"
date
: 
"Dec 28, 2025"
duration
: 
"0:04"
formattedText
: 
"This is clip zero zero one."
id
: 
"clip-1766938250719-4k36tu151v"
parentId
: 
"clip-1766938250719-q2mkhtz2q"
pendingClipTitle
: 
"Clip 001"
status
: 
null
title
: 
"Recording 01"
4
: 
{id: "clip-1766938258314-qd6yd76tw07", title: "Recording 01", date: "Dec 28, 2025", status: null,…}
content
: 
""
createdAt
: 
1766938258314
currentView
: 
"formatted"
date
: 
"Dec 28, 2025"
duration
: 
"0:05"
formattedText
: 
"Clip zero zero three, without fail."
id
: 
"clip-1766938258314-qd6yd76tw07"
parentId
: 
"clip-1766938250719-q2mkhtz2q"
pendingClipTitle
: 
"Clip 002"
status
: 
null
title
: 
"Recording 01"
5
: 
{id: "clip-1766938263714-j3wwxrqf3x8", title: "Recording 01", date: "Dec 28, 2025",…}
audioId
: 
"audio-1766938263709-rkii28484"
content
: 
""
createdAt
: 
1766938263714
currentView
: 
"formatted"
date
: 
"Dec 28, 2025"
duration
: 
"0:03"
id
: 
"clip-1766938263714-j3wwxrqf3x8"
parentId
: 
"clip-1766938250719-q2mkhtz2q"
pendingClipTitle
: 
"Clip 003"
status
: 
"transcribing"
title
: 
"Recording 01"
6
: 
{id: "clip-1766938272247-x1fvn7d627r", title: "Recording 01", date: "Dec 28, 2025",…}
audioId
: 
"audio-1766938272243-f1uk2ftbs"
content
: 
""
createdAt
: 
1766938272247
currentView
: 
"formatted"
date
: 
"Dec 28, 2025"
duration
: 
"0:06"
id
: 
"clip-1766938272247-x1fvn7d627r"
parentId
: 
"clip-1766938250719-q2mkhtz2q"
pendingClipTitle
: 
"Clip 004"
status
: 
"transcribing"
title
: 
"Recording 01"
7
: 
{id: "clip-1766938281720-z9tknbvbuk", title: "Mary's Unusual Encounter with a Lamb",…}
audioId
: 
"audio-1766938281717-i9x5p9q36"
content
: 
""
createdAt
: 
1766938281720
currentView
: 
"formatted"
date
: 
"Dec 28, 2025"
duration
: 
"0:03"
id
: 
"clip-1766938281720-z9tknbvbuk"
parentId
: 
"clip-1766938224093-n1tv160le"
pendingClipTitle
: 
"Clip 001"
status
: 
"transcribing"
title
: 
"Mary's Unusual Encounter with a Lamb"
8
: 
{id: "clip-1766938292170-pkxs43hoet", title: "Recording 02", date: "Dec 28, 2025",…}
audioId
: 
"audio-1766938292167-vclm8j1x8"
content
: 
""
createdAt
: 
1766938292170
currentView
: 
"formatted"
date
: 
"Dec 28, 2025"
duration
: 
"0:06"
id
: 
"clip-1766938292170-pkxs43hoet"
parentId
: 
"clip-1766938292170-nuuq4d149"
pendingClipTitle
: 
"Clip 001"
status
: 
"transcribing"
title
: 
"Recording 02"

Data from terminal.
 ✓ Compiled in 353ms (2097 modules)
 ✓ Compiled in 378ms (2097 modules)
 ✓ Compiled in 422ms (2097 modules)
 GET /clipperstream/showcase/clipscreencomponents 200 in 301ms
 ✓ Compiled /api/clipperstream/transcribe in 158ms (289 modules)
Files received: [ 'audio' ]
Processing audio file: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/bjlgdnzewzg99bwwa2xxyxlbw, size: 127745 bytes, type: audio/webm;codecs=opus
 POST /api/clipperstream/transcribe 200 in 1354ms
 ✓ Compiled /api/clipperstream/format-text in 215ms (295 modules)
 ✓ Compiled (298 modules)
[Clipstream] [API/format-text] [DEBUG] Request received { method: 'POST' }
[Clipstream] [API/format-text] [DEBUG] API key check { hasKey: true }
[Clipstream] [API/format-text] [DEBUG] Calling formatter service { rawLength: 53, hasContext: false }
[Clipstream] [TextFormatter] [DEBUG] Starting text formatting { rawLength: 53, hasContext: false }
[Clipstream] [TextFormatter] [DEBUG] Calling OpenAI generateText API
[Clipstream] [API/generate-title] [DEBUG] Request received { method: 'POST' }
[Clipstream] [API/generate-title] [DEBUG] API key check { hasKey: true }
[Clipstream] [API/generate-title] [DEBUG] Processing transcription { length: 53 }
[Clipstream] [API/generate-title] [DEBUG] Calling title generator service
[Clipstream] [TitleGenerator] [DEBUG] Starting title generation { transcriptionLength: 53, hasApiKey: true }
[Clipstream] [TitleGenerator] [DEBUG] Creating OpenAI client
[Clipstream] [TitleGenerator] [DEBUG] Calling OpenAI generateText API
[Clipstream] [TitleGenerator] [INFO] Title generated successfully { title: "Mary's Unusual Encounter with a Lamb" }
[Clipstream] [API/generate-title] [INFO] Title generated successfully { title: "Mary's Unusual Encounter with a Lamb" }
 POST /api/clipperstream/generate-title 200 in 1196ms
[Clipstream] [TextFormatter] [INFO] Text formatted successfully { rawLength: 53, formattedLength: 55 }
[Clipstream] [API/format-text] [INFO] Text formatted successfully
 POST /api/clipperstream/format-text 200 in 1763ms
Files received: [ 'audio' ]
Processing audio file: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/kfpf7z49tal9dpmczb3xx4fsr, size: 68323 bytes, type: audio/webm;codecs=opus
 POST /api/clipperstream/transcribe 200 in 1626ms
[Clipstream] [API/format-text] [DEBUG] Request received { method: 'POST' }
[Clipstream] [API/format-text] [DEBUG] API key check { hasKey: true }
[Clipstream] [API/format-text] [DEBUG] Calling formatter service { rawLength: 27, hasContext: false }
[Clipstream] [TextFormatter] [DEBUG] Starting text formatting { rawLength: 27, hasContext: false }
[Clipstream] [TextFormatter] [DEBUG] Calling OpenAI generateText API
Files received: [ 'audio' ]
Processing audio file: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/xmakx3qjtxis98qq0kgvsrels, size: 95595 bytes, type: audio/webm;codecs=opus
 POST /api/clipperstream/transcribe 200 in 833ms
Files received: [ 'audio' ]
Processing audio file: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/t2i85dr9gu0pa7hzsfk7h4tc5, size: 55669 bytes, type: audio/webm;codecs=opus
[Clipstream] [TextFormatter] [INFO] Text formatted successfully { rawLength: 27, formattedLength: 27 }
[Clipstream] [API/format-text] [INFO] Text formatted successfully
 POST /api/clipperstream/format-text 200 in 975ms
 POST /api/clipperstream/transcribe 200 in 519ms
[Clipstream] [API/format-text] [DEBUG] Request received { method: 'POST' }
[Clipstream] [API/format-text] [DEBUG] API key check { hasKey: true }
[Clipstream] [API/format-text] [DEBUG] Calling formatter service { rawLength: 33, hasContext: false }
[Clipstream] [TextFormatter] [DEBUG] Starting text formatting { rawLength: 33, hasContext: false }
[Clipstream] [TextFormatter] [DEBUG] Calling OpenAI generateText API
Files received: [ 'audio' ]
Processing audio file: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/nzcvez2e1a1uqlizdem9undob, size: 112161 bytes, type: audio/webm;codecs=opus
 POST /api/clipperstream/transcribe 200 in 444ms
Files received: [ 'audio' ]
Processing audio file: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/bwq8dtz0imhucqpeynl3opfv8, size: 64427 bytes, type: audio/webm;codecs=opus
 POST /api/clipperstream/transcribe 200 in 389ms
Files received: [ 'audio' ]
Processing audio file: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/z7a5j8rpzu3fchrl665k585ft, size: 98525 bytes, type: audio/webm;codecs=opus
 POST /api/clipperstream/transcribe 200 in 263ms
[Clipstream] [TextFormatter] [INFO] Text formatted successfully { rawLength: 33, formattedLength: 35 }
[Clipstream] [API/format-text] [INFO] Text formatted successfully
 POST /api/clipperstream/format-text 200 in 1366ms
 ✓ Compiled in 360ms (1883 modules)
 ✓ Compiled in 206ms (1883 modules)
 ✓ Compiled in 116ms (1883 modules)
