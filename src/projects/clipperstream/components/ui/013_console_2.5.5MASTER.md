Formal Technical Specification: Multi-Clip Offline Transcription Queue with Accurate Spinner State
System Context
ClipperStream is an offline-capable voice transcription application with the following architecture: Data Model:
Parent Clips (containers): Metadata-only entities with id, title, date, status, no audio
Child Clips: Audio-bearing entities with parentId, audioId, duration, status, content, formattedText
Relationship: One parent → Many children (1:N)
Storage:
Clips metadata: localStorage (JSON array)
Audio blobs: IndexedDB (keyed by audioId)
Network States:
Online: Audio → HTTP transcription → formatting → save
Offline: Audio → IndexedDB → pending state → auto-retry when online
The Core Requirement
Objective: Implement a robust auto-retry queue system that processes multiple pending clips (across multiple parent containers) with accurate, per-clip HTTP activity indication in the UI.
Technical Constraints
Sequential HTTP Processing:
OpenAI Whisper API calls must be sequential (no parallel HTTP)
Implementation: for await loop over pending clips
Each clip waits for previous clip's HTTP to complete before starting
Parallel Background Processing:
Formatting (OpenAI text formatting) happens asynchronously after HTTP
Title generation (OpenAI) happens asynchronously after all children complete
Audio deletion happens after successful save
State Synchronization Across Two Screens:
Home Screen (ClipHomeScreen): Shows list of parent clips with derived status
Record Screen (ClipRecordScreen): Shows individual clip content
Both must show consistent state at all times
Parent-Child Status Derivation:
Parent's status = derived from children's statuses
Parent's isActiveRequest = derived from children's HTTP activity
Children have individual status: 'pending-child' → 'transcribing' → null
Spinner State Specification
The spinner next to each parent clip must accurately reflect which specific child is currently doing HTTP: States:
Visual State	Meaning	Trigger	Duration
Waiting to transcribe (static icon)	Children exist but none doing HTTP yet	Parent has children with status='pending-child'	Until first child starts HTTP
Transcribing... (spinning icon)	At least one child is actively doing HTTP RIGHT NOW	activeHttpClipId matches one of parent's children	Only during HTTP call
Transcribing... (static icon)	HTTP complete, formatting in progress	HTTP done, but status='transcribing' still set	During formatting
(no status)	All complete	All children have status=null, audio deleted	Permanent
Critical Rule: The spinner must be immune to resetRecording() calls from other clips finishing their formatting in parallel.
The Queue Processing Flow
Scenario: User goes offline, creates:
Recording 01: 4 child clips (clip-001, clip-002, clip-003, clip-004)
Mary's Lamb: 1 child clip (clip-001)
Recording 02: 1 child clip (clip-001)
Total: 3 parents, 6 children pending Expected Sequence When Online:

Time 0ms:    Auto-retry loop starts
             Filter: 6 clips with status='pending-child' or 'failed'

Time 10ms:   Recording 01 - Clip 001 HTTP starts
             setActiveHttpClipId("clip-1766943291223-nyjs5ek3jy")
             setActiveTranscriptionParentId("clip-1766943291223-2ic5fao8b")
             Parent Recording 01: status='transcribing', isActiveRequest=true (SPINNING ✓)

Time 500ms:  Recording 01 - Clip 001 HTTP completes
             setActiveHttpClipId(null)
             useTranscriptionHandler: isFirstPending=true → format immediately
             Formatting starts (async, non-blocking)

Time 501ms:  Recording 01 - Clip 002 HTTP starts
             setActiveHttpClipId("clip-1766943302801-6ktafp6kwwk")
             Parent Recording 01: STILL status='transcribing', isActiveRequest=true (SPINNING ✓)

Time 1000ms: Recording 01 - Clip 001 formatting completes
             resetRecording() called → global isActiveRequest=false
             ⚠️ BUT activeHttpClipId still = "clip-002" (unaffected!)
             Parent Recording 01: status='transcribing', isActiveRequest=true (SPINNING ✓)

Time 1500ms: Recording 01 - Clip 002 HTTP completes
             setActiveHttpClipId(null)
             useTranscriptionHandler: isFirstPending=false → add to batch
             countRemaining: 2 (clips 003, 004 still pending)

Time 1501ms: Recording 01 - Clip 003 HTTP starts
             setActiveHttpClipId("clip-1766943314467-mwxsbhpodf")
             Parent Recording 01: STILL SPINNING ✓

Time 2000ms: Recording 01 - Clip 003 HTTP completes
             setActiveHttpClipId(null)
             useTranscriptionHandler: batch (remaining=1)

Time 2001ms: Recording 01 - Clip 004 HTTP starts
             setActiveHttpClipId("clip-1766943320921-vy0f64d2aek")

Time 2500ms: Recording 01 - Clip 004 HTTP completes
             setActiveHttpClipId(null)
             useTranscriptionHandler: remaining=0 → format all batched (002, 003, 004)
             
Time 3000ms: All batched formatting completes
             Clear status for all children
             Delete all audioIds
             Generate title for Recording 01 parent
             Parent Recording 01: status=null, title="AI Generated Title" (COMPLETE ✓)

Time 3001ms: Mary's Lamb - Clip 001 HTTP starts
             setActiveTranscriptionParentId("clip-1766943254852-w3nbxt7vq")
             setActiveHttpClipId("clip-1766943345132-85r374n41nw")
             Parent Mary's: SPINNING ✓

... continues for remaining clips
The Bugs Being Fixed
v2.5.4 Fixed: Per-clip HTTP tracking with activeHttpClipId
Problem: Global isActiveRequest flag was reset by any clip calling resetRecording()
Solution: Track which specific child is doing HTTP in separate state variable
v2.5.5 Fixing: Batching logic in useTranscriptionHandler
Bug #1: isFirstPendingForClip checks c.id === clipId instead of c.parentId === parentId
Bug #2: countRemainingPending checks c.id === clipId instead of parent's children
Bug #3: Batch doesn't store clipId, so can't format to correct clip later
Bug #4: Formatting loop uses last clip's ID for all batches instead of each batch's own ID
Success Criteria
After fixes, the system must:
✅ Process all clips sequentially (one HTTP at a time)
✅ Show spinner ONLY during active HTTP for each parent
✅ Save all transcriptions correctly to their respective child clips
✅ Clear all child statuses after successful save
✅ Delete all audioIds after successful save
✅ Update parent title with AI-generated content based on combined children's transcriptions
✅ Handle multiple parents in queue correctly (Recording 01 → Mary's → Recording 02)
✅ Batch clips 2, 3, 4+ for instant display after last one completes
✅ Not affected by resetRecording() calls from other clips
Key Architectural Insight
The fundamental challenge is coordinating sequential HTTP with parallel async processing while maintaining accurate UI state per parent across multiple simultaneous operations. Solution Pattern:
Auto-retry loop: Owns activeHttpClipId, sets/clears around HTTP
useTranscriptionHandler: Owns batching logic, formats asynchronously
ClipHomeScreen: Derives spinner from activeHttpClipId (not global isActiveRequest)
This creates a separation of concerns where HTTP tracking is decoupled from recording session state.