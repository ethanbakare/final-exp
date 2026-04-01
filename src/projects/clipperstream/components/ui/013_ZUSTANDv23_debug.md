Runtime ReferenceError


formatDuration is not defined

src/projects/clipperstream/hooks/useOfflineRecording.ts (141:19) @ useOfflineRecording.useCallback[handleOfflineRecording]


  139 |         pendingClipTitle: 'Clip 001',       // First pending clip
  140 |         audioId: audioId,                   // Link to IndexedDB audio
> 141 |         duration: formatDuration(duration), // Recording duration
      |                   ^
  142 |         parentId: parentClip.id,            // Link to parent
  143 |         currentView: 'formatted',
  144 |         createdAt: Date.now()
Call Stack
2

useOfflineRecording.useCallback[handleOfflineRecording]
src/projects/clipperstream/hooks/useOfflineRecording.ts (141:19)
handleDoneClick
src/projects/clipperstream/components/ui/ClipMasterScreen.tsx (493:7)


useOfflineRecording.ts:141 Uncaught (in promise) ReferenceError: formatDuration is not defined
    at useOfflineRecording.useCallback[handleOfflineRecording] (useOfflineRecording.ts:141:19)
    at handleDoneClick (ClipMasterScreen.tsx:493:7)
useOfflineRecording.useCallback[handleOfflineRecording]	@	useOfflineRecording.ts:141
handleDoneClick	@	ClipMasterScreen.tsx:493
await in handleDoneClick		
handleClick	@	recordNavMorphingButtons.tsx:153
processDispatchQueue	@	react-dom-client.development.js:16123
eval	@	react-dom-client.development.js:16726
batchedUpdates$1	@	react-dom-client.development.js:3130
dispatchEventForPluginEventSystem	@	react-dom-client.development.js:16282
dispatchEvent	@	react-dom-client.development.js:20354
dispatchDiscreteEvent	@	react-dom-client.development.js:20322

﻿
