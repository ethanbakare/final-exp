[HMR] connected
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips initialized from storage Object
logger.ts:113 [Clipstream] [AudioStorage] [DEBUG] IndexedDB initialized successfully
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB {audioId: 'audio-1766952745432-quq8jf1m3', size: 79045, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB {audioId: 'audio-1766952745432-quq8jf1m3', size: 79045, type: 'audio/webm;codecs=opus'}
logger.ts:113 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription {size: 79045, attempt: 1, source: 'fresh-recording'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Transcription successful {textLength: 49, preview: 'Mary had a little lamp that was as white as snow....'}
logger.ts:113 [Clipstream] [useTranscriptionHandler] [DEBUG] Active recording completed {clipId: null}
logger.ts:113 [Clipstream] [useTranscriptionHandler] [DEBUG] Creating new clip with transcription
logger.ts:119 [Clipstream] [useTranscriptionHandler] [INFO] Creating new clip {title: 'Recording 01'}
logger.ts:119 [Clipstream] [useClipState] [INFO] Creating new clip {title: 'Recording 01', hasContent: true}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 1}
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip {clipId: 'clip-1766952746931-unlt8l1zd', updates: {…}}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 1}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 1}
logger.ts:113 [Clipstream] [useTranscriptionHandler] [DEBUG] Set currentClipId for active recording {clipId: 'clip-1766952746931-unlt8l1zd'}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Starting background title generation {clipId: 'clip-1766952746931-unlt8l1zd', textLength: 49}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Starting background formatting {rawLength: 49}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Text formatted successfully
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip {clipId: 'clip-1766952746931-unlt8l1zd', updates: {…}}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 1}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 1}
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio deleted from IndexedDB {audioId: 'audio-1766952745432-quq8jf1m3'}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Audio deleted from IndexedDB after successful transcription {audioId: 'audio-1766952745432-quq8jf1m3', clipId: 'clip-1766952746931-unlt8l1zd'}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Status transition {clipId: 'clip-1766952746931-unlt8l1zd', from: 'transcribing', to: null, trigger: 'transcription-complete'}
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip {clipId: 'clip-1766952746931-unlt8l1zd', updates: {…}}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 1}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 1}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] AI title generated, updating clip {clipId: 'clip-1766952746931-unlt8l1zd', title: "Mary's Little Lamp: A Snowy Tale"}
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip {clipId: 'clip-1766952746931-unlt8l1zd', updates: {…}}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 1}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 1}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) {clearedContext: true}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Network offline
ClipMasterScreen.tsx:464 🟢 handleOnline FIRED - network is back online
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Network online - attempting auto-retry of pending clips
ClipMasterScreen.tsx:488 🟢 handleOnline - clips found: {total: 1, pendingCount: 0, pendingClips: Array(0)}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] No pending clips to retry
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Network offline
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB {audioId: 'audio-1766952810163-aq38sjcii', size: 135537, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB {audioId: 'audio-1766952810163-aq38sjcii', size: 135537, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Offline - transcription will retry when online
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Offline - clip saved as pending
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Handling offline recording {audioId: 'audio-1766952810163-aq38sjcii', duration: 8, currentClipId: null}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] No currentClipId → creating parent
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Created PARENT container for offline recording {parentId: 'clip-1766952810167-w45c2aggc', title: 'Recording 01'}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Created FIRST CHILD for offline recording {childId: 'clip-1766952810167-mg9pwxhecx', parentId: 'clip-1766952810167-w45c2aggc', parentTitle: 'Recording 01', childTitle: 'Clip 001'}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 3}
logger.ts:113 [Clipstream] [useOfflineRecording] [DEBUG] Set selectedPendingClips to first child {pendingClip: {…}}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Recording from pending clip (adding successive recording) {clipId: 'clip-1766952810167-mg9pwxhecx', pendingTitle: 'Clip 001'}
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB {audioId: 'audio-1766952819160-ldbaifkfd', size: 120919, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB {audioId: 'audio-1766952819160-ldbaifkfd', size: 120919, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Offline - transcription will retry when online
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Offline - clip saved as pending
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Handling offline recording {audioId: 'audio-1766952819160-ldbaifkfd', duration: 7, currentClipId: 'clip-1766952810167-mg9pwxhecx'}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Appending to pending file {parentId: 'clip-1766952810167-w45c2aggc', parentStatus: null}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Created CHILD for offline recording {childId: 'clip-1766952819164-exikz9jo2e', parentId: 'clip-1766952810167-w45c2aggc', parentTitle: 'Recording 01', parentStatus: null, childTitle: 'Clip 002'}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 4}
logger.ts:113 [Clipstream] [useOfflineRecording] [DEBUG] Added child to selectedPendingClips {pendingClip: {…}}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Recording from pending clip (adding successive recording) {clipId: 'clip-1766952810167-mg9pwxhecx', pendingTitle: 'Clip 001'}
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB {audioId: 'audio-1766952826761-k1qoogzjg', size: 97543, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB {audioId: 'audio-1766952826761-k1qoogzjg', size: 97543, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Offline - transcription will retry when online
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Offline - clip saved as pending
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Handling offline recording {audioId: 'audio-1766952826761-k1qoogzjg', duration: 6, currentClipId: 'clip-1766952810167-mg9pwxhecx'}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Appending to pending file {parentId: 'clip-1766952810167-w45c2aggc', parentStatus: null}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Created CHILD for offline recording {childId: 'clip-1766952826764-41my9ykjpfa', parentId: 'clip-1766952810167-w45c2aggc', parentTitle: 'Recording 01', parentStatus: null, childTitle: 'Clip 003'}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 5}
logger.ts:113 [Clipstream] [useOfflineRecording] [DEBUG] Added child to selectedPendingClips {pendingClip: {…}}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Recording from pending clip (adding successive recording) {clipId: 'clip-1766952810167-mg9pwxhecx', pendingTitle: 'Clip 001'}
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB {audioId: 'audio-1766952832654-ww82idxy8', size: 66375, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB {audioId: 'audio-1766952832654-ww82idxy8', size: 66375, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Offline - transcription will retry when online
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Offline - clip saved as pending
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Handling offline recording {audioId: 'audio-1766952832654-ww82idxy8', duration: 4, currentClipId: 'clip-1766952810167-mg9pwxhecx'}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Appending to pending file {parentId: 'clip-1766952810167-w45c2aggc', parentStatus: null}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Created CHILD for offline recording {childId: 'clip-1766952832659-ghie1v0ng7', parentId: 'clip-1766952810167-w45c2aggc', parentTitle: 'Recording 01', parentStatus: null, childTitle: 'Clip 004'}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 6}
logger.ts:113 [Clipstream] [useOfflineRecording] [DEBUG] Added child to selectedPendingClips {pendingClip: {…}}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) {clearedContext: true}
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB {audioId: 'audio-1766952845187-sjxntwbob', size: 106317, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB {audioId: 'audio-1766952845187-sjxntwbob', size: 106317, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Offline - transcription will retry when online
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Offline - clip saved as pending
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Handling offline recording {audioId: 'audio-1766952845187-sjxntwbob', duration: 6, currentClipId: 'clip-1766952746931-unlt8l1zd'}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Appending to transcribed/completed file {parentId: 'clip-1766952746931-unlt8l1zd', parentStatus: null}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Created CHILD for offline recording {childId: 'clip-1766952845193-unn9wr1hw1', parentId: 'clip-1766952746931-unlt8l1zd', parentTitle: "Mary's Little Lamp: A Snowy Tale", parentStatus: null, childTitle: 'Clip 001'}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 7}
logger.ts:113 [Clipstream] [useOfflineRecording] [DEBUG] Added child to selectedPendingClips {pendingClip: {…}}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Offline append - staying in complete state to preserve existing content access
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) {clearedContext: true}
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio stored in IndexedDB {audioId: 'audio-1766952854829-bxbsexeya', size: 85855, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Audio saved to IndexedDB {audioId: 'audio-1766952854829-bxbsexeya', size: 85855, type: 'audio/webm;codecs=opus'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Offline - transcription will retry when online
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Offline - clip saved as pending
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Handling offline recording {audioId: 'audio-1766952854829-bxbsexeya', duration: 5, currentClipId: null}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] No currentClipId → creating parent
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Created PARENT container for offline recording {parentId: 'clip-1766952854835-88rebp42u', title: 'Recording 02'}
logger.ts:119 [Clipstream] [useOfflineRecording] [INFO] Created FIRST CHILD for offline recording {childId: 'clip-1766952854835-vq6ooe7eei8', parentId: 'clip-1766952854835-88rebp42u', parentTitle: 'Recording 02', childTitle: 'Clip 001'}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}
logger.ts:113 [Clipstream] [useOfflineRecording] [DEBUG] Set selectedPendingClips to first child {pendingClip: {…}}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Navigated to home screen (cleared pending context) {clearedContext: true}
hot-reloader-pages.js:207 [Fast Refresh] rebuilding
report-hmr-latency.js:14 [Fast Refresh] done in 422ms
2hot-reloader-pages.js:207 [Fast Refresh] rebuilding
report-hmr-latency.js:14 [Fast Refresh] done in 15ms
report-hmr-latency.js:14 [Fast Refresh] done in 148ms
ClipMasterScreen.tsx:464 🟢 handleOnline FIRED - network is back online
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Network online - attempting auto-retry of pending clips
ClipMasterScreen.tsx:488 🟢 handleOnline - clips found: {total: 9, pendingCount: 6, pendingClips: Array(6)}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Found pending clips for auto-retry {count: 6}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Status transition {clipId: 'clip-1766952810167-mg9pwxhecx', from: 'pending-child', to: 'transcribing', trigger: 'auto-retry-online'}
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip {clipId: 'clip-1766952810167-mg9pwxhecx', updates: {…}}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}
logger.ts:113 [Clipstream] [AudioStorage] [DEBUG] Audio retrieved from IndexedDB {audioId: 'audio-1766952810163-aq38sjcii', size: 135537}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Auto-retrying transcription {clipId: 'clip-1766952810167-mg9pwxhecx', audioId: 'audio-1766952810163-aq38sjcii', size: 135537}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Setting activeHttpClipId for auto-retry {clipId: 'clip-1766952810167-mg9pwxhecx', parentId: 'clip-1766952810167-w45c2aggc'}
logger.ts:113 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription {size: 135537, attempt: 1, source: 'retry-from-indexeddb'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Transcription successful {textLength: 74, preview: 'Clip zero zero one first recording now active. I r...'}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Clearing activeHttpClipId {clipId: 'clip-1766952810167-mg9pwxhecx', reason: 'HTTP complete'}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Status transition {clipId: 'clip-1766952819164-exikz9jo2e', from: 'pending-child', to: 'transcribing', trigger: 'auto-retry-online'}
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip {clipId: 'clip-1766952819164-exikz9jo2e', updates: {…}}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}
logger.ts:113 [Clipstream] [useTranscriptionHandler] [DEBUG] Background transcription completed {clipId: 'clip-1766952810167-mg9pwxhecx'}
logger.ts:113 [Clipstream] [useTranscriptionHandler] [DEBUG] Checking isFirstPending {clipId: 'clip-1766952810167-mg9pwxhecx', parentId: 'clip-1766952810167-w45c2aggc', totalChildren: 5, hasCompleted: false, isFirst: true}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Starting background formatting {rawLength: 74}
logger.ts:113 [Clipstream] [AudioStorage] [DEBUG] Audio retrieved from IndexedDB {audioId: 'audio-1766952819160-ldbaifkfd', size: 120919}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Auto-retrying transcription {clipId: 'clip-1766952819164-exikz9jo2e', audioId: 'audio-1766952819160-ldbaifkfd', size: 120919}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Setting activeHttpClipId for auto-retry {clipId: 'clip-1766952819164-exikz9jo2e', parentId: 'clip-1766952810167-w45c2aggc'}
logger.ts:113 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription {size: 120919, attempt: 1, source: 'retry-from-indexeddb'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Transcription successful {textLength: 88, preview: 'Clip zero zero two recording now on the way. Not a...'}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Clearing activeHttpClipId {clipId: 'clip-1766952819164-exikz9jo2e', reason: 'HTTP complete'}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Status transition {clipId: 'clip-1766952826764-41my9ykjpfa', from: 'pending-child', to: 'transcribing', trigger: 'auto-retry-online'}
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip {clipId: 'clip-1766952826764-41my9ykjpfa', updates: {…}}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}
logger.ts:113 [Clipstream] [AudioStorage] [DEBUG] Audio retrieved from IndexedDB {audioId: 'audio-1766952826761-k1qoogzjg', size: 97543}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Auto-retrying transcription {clipId: 'clip-1766952826764-41my9ykjpfa', audioId: 'audio-1766952826761-k1qoogzjg', size: 97543}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Setting activeHttpClipId for auto-retry {clipId: 'clip-1766952826764-41my9ykjpfa', parentId: 'clip-1766952810167-w45c2aggc'}
logger.ts:113 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription {size: 97543, attempt: 1, source: 'retry-from-indexeddb'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Transcription successful {textLength: 77, preview: 'Clip zero zero three recording now on the way as w...'}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Clearing activeHttpClipId {clipId: 'clip-1766952826764-41my9ykjpfa', reason: 'HTTP complete'}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Status transition {clipId: 'clip-1766952832659-ghie1v0ng7', from: 'pending-child', to: 'transcribing', trigger: 'auto-retry-online'}
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip {clipId: 'clip-1766952832659-ghie1v0ng7', updates: {…}}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}
logger.ts:113 [Clipstream] [AudioStorage] [DEBUG] Audio retrieved from IndexedDB {audioId: 'audio-1766952832654-ww82idxy8', size: 66375}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Auto-retrying transcription {clipId: 'clip-1766952832659-ghie1v0ng7', audioId: 'audio-1766952832654-ww82idxy8', size: 66375}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Setting activeHttpClipId for auto-retry {clipId: 'clip-1766952832659-ghie1v0ng7', parentId: 'clip-1766952810167-w45c2aggc'}
logger.ts:113 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription {size: 66375, attempt: 1, source: 'retry-from-indexeddb'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Transcription successful {textLength: 52, preview: 'Clip zero zero four recording has now been finishe...'}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Clearing activeHttpClipId {clipId: 'clip-1766952832659-ghie1v0ng7', reason: 'HTTP complete'}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Status transition {clipId: 'clip-1766952845193-unn9wr1hw1', from: 'pending-child', to: 'transcribing', trigger: 'auto-retry-online'}
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip {clipId: 'clip-1766952845193-unn9wr1hw1', updates: {…}}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}
logger.ts:113 [Clipstream] [AudioStorage] [DEBUG] Audio retrieved from IndexedDB {audioId: 'audio-1766952845187-sjxntwbob', size: 106317}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Auto-retrying transcription {clipId: 'clip-1766952845193-unn9wr1hw1', audioId: 'audio-1766952845187-sjxntwbob', size: 106317}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Setting activeHttpClipId for auto-retry {clipId: 'clip-1766952845193-unn9wr1hw1', parentId: 'clip-1766952746931-unlt8l1zd'}
logger.ts:113 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription {size: 106317, attempt: 1, source: 'retry-from-indexeddb'}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Transcription successful {textLength: 50, preview: 'Clip zero zero five recording has now been sorted....'}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Clearing activeHttpClipId {clipId: 'clip-1766952845193-unn9wr1hw1', reason: 'HTTP complete'}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Status transition {clipId: 'clip-1766952854835-vq6ooe7eei8', from: 'pending-child', to: 'transcribing', trigger: 'auto-retry-online'}
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip {clipId: 'clip-1766952854835-vq6ooe7eei8', updates: {…}}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}
logger.ts:113 [Clipstream] [AudioStorage] [DEBUG] Audio retrieved from IndexedDB {audioId: 'audio-1766952854829-bxbsexeya', size: 85855}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Auto-retrying transcription {clipId: 'clip-1766952854835-vq6ooe7eei8', audioId: 'audio-1766952854829-bxbsexeya', size: 85855}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Setting activeHttpClipId for auto-retry {clipId: 'clip-1766952854835-vq6ooe7eei8', parentId: 'clip-1766952854835-88rebp42u'}
logger.ts:113 [Clipstream] [useClipRecording] [DEBUG] Sending audio for transcription {size: 85855, attempt: 1, source: 'retry-from-indexeddb'}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Text formatted successfully
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip {clipId: 'clip-1766952810167-mg9pwxhecx', updates: {…}}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio deleted from IndexedDB {audioId: 'audio-1766952810163-aq38sjcii'}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Audio deleted from IndexedDB after successful transcription {audioId: 'audio-1766952810163-aq38sjcii', clipId: 'clip-1766952810167-mg9pwxhecx'}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Status transition {clipId: 'clip-1766952810167-mg9pwxhecx', from: 'transcribing', to: null, trigger: 'transcription-complete'}
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip {clipId: 'clip-1766952810167-mg9pwxhecx', updates: {…}}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}
logger.ts:119 [Clipstream] [useClipRecording] [INFO] Transcription successful {textLength: 65, preview: 'Clip zero zero six recording in recording zero two...'}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Clearing activeHttpClipId {clipId: 'clip-1766952854835-vq6ooe7eei8', reason: 'HTTP complete'}
logger.ts:113 [Clipstream] [useTranscriptionHandler] [DEBUG] Background transcription completed {clipId: 'clip-1766952819164-exikz9jo2e'}
logger.ts:113 [Clipstream] [useTranscriptionHandler] [DEBUG] Checking isFirstPending {clipId: 'clip-1766952819164-exikz9jo2e', parentId: 'clip-1766952810167-w45c2aggc', totalChildren: 5, hasCompleted: false, isFirst: true}
logger.ts:113 [Clipstream] [ClipMasterScreen] [DEBUG] Starting background formatting {rawLength: 65}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Text formatted successfully
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip {clipId: 'clip-1766952819164-exikz9jo2e', updates: {…}}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}
logger.ts:119 [Clipstream] [AudioStorage] [INFO] Audio deleted from IndexedDB {audioId: 'audio-1766952819160-ldbaifkfd'}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Audio deleted from IndexedDB after successful transcription {audioId: 'audio-1766952819160-ldbaifkfd', clipId: 'clip-1766952819164-exikz9jo2e'}
logger.ts:119 [Clipstream] [ClipMasterScreen] [INFO] Status transition {clipId: 'clip-1766952819164-exikz9jo2e', from: 'transcribing', to: null, trigger: 'transcription-complete'}
logger.ts:119 [Clipstream] [useClipState] [INFO] Updating clip {clipId: 'clip-1766952819164-exikz9jo2e', updates: {…}}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}
logger.ts:113 [Clipstream] [useClipState] [DEBUG] Clips refreshed from storage {count: 9}

Session Storage Localhost:3000

[{id: "clip-1766952854835-88rebp42u", title: "Recording 02", date: "Dec 28, 2025", status: null,…},…]
0
: 
{id: "clip-1766952854835-88rebp42u", title: "Recording 02", date: "Dec 28, 2025", status: null,…}
content
: 
""
createdAt
: 
1766952854835
currentView
: 
"formatted"
date
: 
"Dec 28, 2025"
id
: 
"clip-1766952854835-88rebp42u"
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
{id: "clip-1766952810167-w45c2aggc", title: "Recording 01", date: "Dec 28, 2025", status: null,…}
content
: 
""
createdAt
: 
1766952810167
currentView
: 
"formatted"
date
: 
"Dec 28, 2025"
id
: 
"clip-1766952810167-w45c2aggc"
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
{id: "clip-1766952746931-unlt8l1zd", title: "Mary's Little Lamp: A Snowy Tale", date: "Dec 28, 2025",…}
content
: 
"Mary had a little lamp that was as white as snow."
createdAt
: 
1766952746931
currentView
: 
"formatted"
date
: 
"Dec 28, 2025"
formattedText
: 
"Mary had a little lamp that was as white as snow."
id
: 
"clip-1766952746931-unlt8l1zd"
rawText
: 
"Mary had a little lamp that was as white as snow."
status
: 
null
title
: 
"Mary's Little Lamp: A Snowy Tale"
3
: 
{id: "clip-1766952810167-mg9pwxhecx", title: "Recording 01", date: "Dec 28, 2025", status: null,…}
content
: 
""
createdAt
: 
1766952810167
currentView
: 
"formatted"
date
: 
"Dec 28, 2025"
duration
: 
"0:08"
formattedText
: 
"Clip zero zero one, first recording now active. I repeat, it is now active."
id
: 
"clip-1766952810167-mg9pwxhecx"
parentId
: 
"clip-1766952810167-w45c2aggc"
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
{id: "clip-1766952819164-exikz9jo2e", title: "Recording 01", date: "Dec 28, 2025", status: null,…}
content
: 
""
createdAt
: 
1766952819164
currentView
: 
"formatted"
date
: 
"Dec 28, 2025"
duration
: 
"0:07"
formattedText
: 
"Clip zero zero six recording in recording zero two is now sorted."
id
: 
"clip-1766952819164-exikz9jo2e"
parentId
: 
"clip-1766952810167-w45c2aggc"
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
{id: "clip-1766952826764-41my9ykjpfa", title: "Recording 01", date: "Dec 28, 2025",…}
audioId
: 
"audio-1766952826761-k1qoogzjg"
content
: 
""
createdAt
: 
1766952826764
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
"clip-1766952826764-41my9ykjpfa"
parentId
: 
"clip-1766952810167-w45c2aggc"
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
{id: "clip-1766952832659-ghie1v0ng7", title: "Recording 01", date: "Dec 28, 2025",…}
audioId
: 
"audio-1766952832654-ww82idxy8"
content
: 
""
createdAt
: 
1766952832660
currentView
: 
"formatted"
date
: 
"Dec 28, 2025"
duration
: 
"0:04"
id
: 
"clip-1766952832659-ghie1v0ng7"
parentId
: 
"clip-1766952810167-w45c2aggc"
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
{id: "clip-1766952845193-unn9wr1hw1", title: "Mary's Little Lamp: A Snowy Tale", date: "Dec 28, 2025",…}
audioId
: 
"audio-1766952845187-sjxntwbob"
content
: 
""
createdAt
: 
1766952845193
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
"clip-1766952845193-unn9wr1hw1"
parentId
: 
"clip-1766952746931-unlt8l1zd"
pendingClipTitle
: 
"Clip 001"
status
: 
"transcribing"
title
: 
"Mary's Little Lamp: A Snowy Tale"
8
: 
{id: "clip-1766952854835-vq6ooe7eei8", title: "Recording 02", date: "Dec 28, 2025",…}
audioId
: 
"audio-1766952854829-bxbsexeya"
content
: 
""
createdAt
: 
1766952854835
currentView
: 
"formatted"
date
: 
"Dec 28, 2025"
duration
: 
"0:05"
id
: 
"clip-1766952854835-vq6ooe7eei8"
parentId
: 
"clip-1766952854835-88rebp42u"
pendingClipTitle
: 
"Clip 001"
status
: 
"transcribing"
title
: 
"Recording 02"



Audio blobs saved in Clipperstream Audio which is saved in indexed db.

0	"audio-1766952826761-k1qoogzjg"	
{id: 'audio-1766952826761-k1qoogzjg', blob: Blob, timestamp: 1766952826761}
blob
: 
Blob {size: 97543, type: 'audio/webm;codecs=opus'}
id
: 
"audio-1766952826761-k1qoogzjg"
timestamp
: 
1766952826761
1	"audio-1766952832654-ww82idxy8"	
{id: 'audio-1766952832654-ww82idxy8', blob: Blob, timestamp: 1766952832654}
blob
: 
Blob {size: 66375, type: 'audio/webm;codecs=opus'}
id
: 
"audio-1766952832654-ww82idxy8"
timestamp
: 
1766952832654
2	"audio-1766952845187-sjxntwbob"	
{id: 'audio-1766952845187-sjxntwbob', blob: Blob, timestamp: 1766952845187}
blob
: 
Blob {size: 106317, type: 'audio/webm;codecs=opus'}
id
: 
"audio-1766952845187-sjxntwbob"
timestamp
: 
1766952845187
3	"audio-1766952854829-bxbsexeya"	
{id: 'audio-1766952854829-bxbsexeya', blob: Blob, timestamp: 1766952854829}
blob
: 
Blob {size: 85855, type: 'audio/webm;codecs=opus'}
id
: 
"audio-1766952854829-bxbsexeya"
timestamp
: 
1766952854829


View from terminal

T /clipperstream/showcase/clipscreencomponents 200 in 444ms
 GET /ai-confidence-tracker/deepshowcase/deepLibrary 200 in 439ms
 GET /clipperstream/showcase/clipcomponent 200 in 442ms
 GET /clipperstream/showcase/clipscreencomponents 200 in 393ms
 ✓ Compiled /api/clipperstream/transcribe in 185ms (289 modules)
(node:34531) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
Files received: [ 'audio' ]
Processing audio file: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/w5pcyxi4ptiil34cyb3gclpoy, size: 79045 bytes, type: audio/webm;codecs=opus
 POST /api/clipperstream/transcribe 200 in 1490ms
 ✓ Compiled /api/clipperstream/generate-title in 42ms (295 modules)
 ✓ Compiled (298 modules)
[Clipstream] [API/generate-title] [DEBUG] Request received { method: 'POST' }
[Clipstream] [API/generate-title] [DEBUG] API key check { hasKey: true }
[Clipstream] [API/generate-title] [DEBUG] Processing transcription { length: 49 }
[Clipstream] [API/generate-title] [DEBUG] Calling title generator service
[Clipstream] [TitleGenerator] [DEBUG] Starting title generation { transcriptionLength: 49, hasApiKey: true }
[Clipstream] [TitleGenerator] [DEBUG] Creating OpenAI client
[Clipstream] [TitleGenerator] [DEBUG] Calling OpenAI generateText API
[Clipstream] [API/format-text] [DEBUG] Request received { method: 'POST' }
[Clipstream] [API/format-text] [DEBUG] API key check { hasKey: true }
[Clipstream] [API/format-text] [DEBUG] Calling formatter service { rawLength: 49, hasContext: false }
[Clipstream] [TextFormatter] [DEBUG] Starting text formatting { rawLength: 49, hasContext: false }
[Clipstream] [TextFormatter] [DEBUG] Calling OpenAI generateText API
[Clipstream] [TextFormatter] [INFO] Text formatted successfully { rawLength: 49, formattedLength: 49 }
[Clipstream] [API/format-text] [INFO] Text formatted successfully
 POST /api/clipperstream/format-text 200 in 1338ms
[Clipstream] [TitleGenerator] [INFO] Title generated successfully { title: "Mary's Little Lamp: A Snowy Tale" }
[Clipstream] [API/generate-title] [INFO] Title generated successfully { title: "Mary's Little Lamp: A Snowy Tale" }
 POST /api/clipperstream/generate-title 200 in 1416ms
 ✓ Compiled in 413ms (219 modules)
 ✓ Compiled /clipperstream/showcase/clipcomponent in 199ms (454 modules)
 GET /clipperstream/showcase/clipcomponent 200 in 517ms
 GET /ai-confidence-tracker/deepshowcase/deepLibrary 200 in 519ms
 ✓ Compiled /api/clipperstream/transcribe in 119ms (289 modules)
Files received: [ 'audio' ]
Processing audio file: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/dp7hrry4xfiekmd4gz6k91sm5, size: 135537 bytes, type: audio/webm;codecs=opus
 POST /api/clipperstream/transcribe 200 in 2234ms
Files received: [ 'audio' ]
Processing audio file: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/b8k8727zcrl6kmcd7poce019k, size: 120919 bytes, type: audio/webm;codecs=opus
 ✓ Compiled /api/clipperstream/format-text in 44ms (275 modules)
[Clipstream] [API/format-text] [DEBUG] Request received { method: 'POST' }
[Clipstream] [API/format-text] [DEBUG] API key check { hasKey: true }
[Clipstream] [API/format-text] [DEBUG] Calling formatter service { rawLength: 74, hasContext: false }
[Clipstream] [TextFormatter] [DEBUG] Starting text formatting { rawLength: 74, hasContext: false }
[Clipstream] [TextFormatter] [DEBUG] Calling OpenAI generateText API
 POST /api/clipperstream/transcribe 200 in 568ms
Files received: [ 'audio' ]
Processing audio file: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/yks3kfz4i8ephumhvihlaa1wu, size: 97543 bytes, type: audio/webm;codecs=opus
 POST /api/clipperstream/transcribe 200 in 354ms
Files received: [ 'audio' ]
Processing audio file: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/m54cetg4gjm18u6k84qgqmyth, size: 66375 bytes, type: audio/webm;codecs=opus
 POST /api/clipperstream/transcribe 200 in 499ms
Files received: [ 'audio' ]
Processing audio file: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/jddd0p189f0odbi9tsbzrkl9q, size: 106317 bytes, type: audio/webm;codecs=opus
 POST /api/clipperstream/transcribe 200 in 258ms
Files received: [ 'audio' ]
Processing audio file: /var/folders/tz/t7q8djb5009gs3hd7jg8td200000gn/T/jmt964qis873fzr7dgesol7cb, size: 85855 bytes, type: audio/webm;codecs=opus
[Clipstream] [TextFormatter] [INFO] Text formatted successfully { rawLength: 74, formattedLength: 75 }
[Clipstream] [API/format-text] [INFO] Text formatted successfully
 POST /api/clipperstream/format-text 200 in 1792ms
 POST /api/clipperstream/transcribe 200 in 432ms
[Clipstream] [API/format-text] [DEBUG] Request received { method: 'POST' }
[Clipstream] [API/format-text] [DEBUG] API key check { hasKey: true }
[Clipstream] [API/format-text] [DEBUG] Calling formatter service { rawLength: 65, hasContext: false }
[Clipstream] [TextFormatter] [DEBUG] Starting text formatting { rawLength: 65, hasContext: false }
[Clipstream] [TextFormatter] [DEBUG] Calling OpenAI generateText API
[Clipstream] [TextFormatter] [INFO] Text formatted successfully { rawLength: 65, formattedLength: 65 }
[Clipstream] [API/format-text] [INFO] Text formatted successfully
 POST /api/clipperstream/format-text 200 in 1095ms
 ✓ Compiled in 143ms (219 modules)
 ✓ Compiled /clipperstream/showcase/clipcomponent in 207ms (454 modules)
 GET /clipperstream/showcase/clipcomponent 200 in 533ms
 GET /ai-confidence-tracker/deepshowcase/deepLibrary 200 in 534ms
