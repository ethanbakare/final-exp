import React, { useState } from 'react';
import { ClipHomeScreen, Clip } from '@/projects/clipperstream/components/ui/ClipHomeScreen';
import { ClipRecordScreen, PendingClip } from '@/projects/clipperstream/components/ui/ClipRecordScreen';
import { ClipMasterScreen } from '@/projects/clipperstream/components/ui/ClipMasterScreen';
import { ClipOfflineScreen } from './ClipOfflineScreen';

// ClipScreenComponents Showcase
// Displays full-screen component compositions with toggle controls
// Shows: ClipHomeScreen, ClipRecordScreen, ClipMasterScreen (orchestrator), ClipOfflineScreen (retry states)

/* ============================================
   SAMPLE DATA
   ============================================ */

const sampleClips: Clip[] = [
  { id: '1', title: 'Morning thoughts on productivity', date: 'May 29, 2025', status: null, content: 'Today I want to focus on deep work. The key is to eliminate distractions and create blocks of uninterrupted time. I\'ve been reading about the Pomodoro technique and think it could help me stay focused. Maybe I should try 25-minute work sessions with 5-minute breaks.' },
  { id: '2', title: 'Ideas for the new project launch', date: 'May 28, 2025', status: null, content: 'Key features we need to build: user authentication, dashboard, real-time notifications, and data export. We should prioritize the MVP features first and iterate based on user feedback.' },
  { id: '3', title: 'Meeting notes with the design team', date: 'May 27, 2025', status: 'pending' },
  { id: '4', title: 'Quick reminder about groceries', date: 'May 26, 2025', status: null, content: 'Milk, eggs, bread, cheese, vegetables, and fruit. Also need to pick up some cleaning supplies.' },
  { id: '5', title: 'Podcast episode summary - AI trends', date: 'May 25, 2025', status: 'transcribing' },
  { id: '6', title: 'Birthday gift ideas for Sarah', date: 'May 24, 2025', status: null, content: 'Maybe a nice book or some art supplies. She mentioned wanting to try watercolor painting.' },
  { id: '7', title: 'Book recommendations from John', date: 'May 23, 2025', status: null, content: 'Atomic Habits by James Clear, Deep Work by Cal Newport, and The Psychology of Money.' },
  { id: '8', title: 'Workout routine adjustments', date: 'May 22, 2025', status: null, content: 'Add more cardio on Mondays and Wednesdays. Focus on core strength on Fridays.' },
  { id: '9', title: 'Travel plans for summer vacation', date: 'May 21, 2025', status: null, content: 'Looking at Portugal or Greece. Need to book flights by end of month for better prices.' },
  { id: '10', title: 'Recipe notes - pasta carbonara', date: 'May 20, 2025', status: null, content: 'The secret is using guanciale instead of bacon, and mixing the eggs off the heat to avoid scrambling.' },
  { id: '11', title: 'Client call recap - Project Alpha', date: 'May 19, 2025', status: null, content: 'They want to launch by Q3. Main concerns are timeline and budget.' },
  { id: '12', title: 'Ideas for the team offsite', date: 'May 18, 2025', status: null, content: 'Maybe a cooking class or escape room activity. Team building is important.' },
  { id: '13', title: 'Feedback from user testing session', date: 'May 17, 2025', status: 'pending' },
  { id: '14', title: 'Budget planning for next quarter', date: 'May 16, 2025', status: null, content: 'We need to allocate more to marketing and R&D.' },
  { id: '15', title: 'Notes from the conference keynote', date: 'May 15, 2025', status: null, content: 'The future of AI is about collaboration, not replacement.' },
  { id: '16', title: 'Brainstorm session - new features', date: 'May 14, 2025', status: null, content: 'Dark mode, offline support, collaborative editing.' },
  { id: '17', title: 'Weekly review and planning', date: 'May 13, 2025', status: null, content: 'Completed 8 tasks, 3 pending. Focus on high-priority items next week.' },
  { id: '18', title: 'Quick voice memo about the bug fix', date: 'May 12, 2025', status: 'transcribing' },
  { id: '19', title: 'Dinner reservation confirmation', date: 'May 11, 2025', status: null, content: 'Table for 4 at 7pm at the Italian place downtown.' },
  { id: '20', title: 'Thoughts on the new design system', date: 'May 10, 2025', status: null, content: 'The spacing feels off in the mobile views. Need to review with the team.' },
];

const samplePendingClips: PendingClip[] = [
  { id: 'p1', title: 'Untitled Recording 1', time: '2:34', status: 'waiting' },
  { id: 'p2', title: 'Meeting Notes Draft', time: '5:12', status: 'transcribing' },
  { id: 'p3', title: 'Quick Thought', time: '0:45', status: 'waiting' },
];

const sampleTranscription = `Today I want to share my thoughts on building better products. The key insight I've had recently is that simplicity wins every time.

When we overcomplicate things, we lose the essence of what made the idea compelling in the first place. Users don't want a hundred features - they want the one feature that solves their problem perfectly.

I've been thinking about how to apply this to our current project. Here are the main takeaways:

1. Start with the core use case and nail it before expanding
2. Remove features that don't directly serve the user's primary goal  
3. Test with real users early and often
4. Don't be afraid to say "no" to feature requests that dilute focus

The best products feel inevitable - like they couldn't have been designed any other way. That's the bar we should be aiming for.`;

type HomeScreenState = 'empty' | 'with-clips';
type RecordScreenState = 'recording' | 'transcribed' | 'offline';

const ClipScreenComponents: React.FC = () => {
  // State toggles for showcases
  const [homeScreenState, setHomeScreenState] = useState<HomeScreenState>('with-clips');
  const [recordScreenState, setRecordScreenState] = useState<RecordScreenState>('transcribed');

  // Get clips based on current state
  const getClipsForHomeState = (): Clip[] => {
    switch (homeScreenState) {
      case 'empty':
        return [];
      case 'with-clips':
      default:
        return sampleClips;
    }
  };

  return (
    <>
      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          background-color: #FFFFFF;
        }
        
        .showcase-container {
          min-height: 100vh;
          background-color: #FFFFFF;
        }
        
        .showcase-content {
          padding: 2rem;
        }
        
        @media (max-width: 768px) {
          .showcase-content {
            padding: 1rem;
          }
        }
        
        .section {
          margin-bottom: 3rem;
        }
        
        .section-title {
          color: #1C1C1C;
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }
        
        .component-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 2rem;
          margin-bottom: 1.5rem;
          align-items: flex-start;
          padding: 0 2rem;
        }
        
        @media (max-width: 768px) {
          .component-grid {
            padding: 0;
            gap: 0;
          }
        }
        
        .file-divider {
          border-top: 2px solid rgba(0, 0, 0, 0.1);
          margin: 4rem 0 2rem 0;
          padding-top: 2rem;
        }
        
        .file-label {
          color: rgba(0, 0, 0, 0.5);
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 2rem;
        }
        
        .toggle-controls {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }
        
        .toggle-btn {
          padding: 0.5rem 1rem;
          border: 2px solid #1C1C1C;
          border-radius: 8px;
          background: transparent;
          color: #1C1C1C;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .toggle-btn:hover {
          background: rgba(28, 28, 28, 0.1);
        }
        
        .toggle-btn.active {
          background: #1C1C1C;
          color: #FFFFFF;
        }
        
        .state-description {
          color: rgba(0, 0, 0, 0.6);
          font-size: 0.875rem;
          margin-bottom: 1rem;
          padding: 0.75rem 1rem;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 8px;
          border-left: 4px solid #1C1C1C;
        }
        
        /* Screen wrapper for standalone screens (without RecordBar) */
        .screen-wrapper {
          width: 393px;
          height: 692px;  /* 852 - 160 (RecordBar height) */
          border-radius: 8px;
          overflow: hidden;
          background: #1C1C1C;
        }
        
        @media (max-width: 768px) {
          .screen-wrapper {
            width: 100%;
            height: calc(100vh - 160px);
            border-radius: 0;
          }
        }
      `}</style>

      <div className="showcase-container">
        {/* ============================================
           SECTION 1: ClipHomeScreen (Standalone)
           ============================================ */}
        <div className="showcase-content">
          <div className="file-divider" style={{ marginTop: 0 }}>
            <div className="file-label">📁 ClipHomeScreen.tsx</div>

            <div className="section">
              <h2 className="section-title">Clip Home Screen - iOS-Style Collapsing Header</h2>

              <div className="toggle-controls">
                <button
                  className={`toggle-btn ${homeScreenState === 'empty' ? 'active' : ''}`}
                  onClick={() => setHomeScreenState('empty')}
                >
                  A1: Empty (No Clips)
                </button>
                <button
                  className={`toggle-btn ${homeScreenState === 'with-clips' ? 'active' : ''}`}
                  onClick={() => setHomeScreenState('with-clips')}
                >
                  Default: With Clips
                </button>
              </div>

              <div className="state-description">
                {homeScreenState === 'empty' && (
                  <>
                    <strong>A1 - Empty State:</strong> First-time user with no recording. Shows NoClipsFrameIcon and &quot;Tap the record button to get started.&quot;
                  </>
                )}
                {homeScreenState === 'with-clips' && (
                  <>
                    <strong>Default State:</strong> User has clips. Try the search bar to test:<br />
                    • <strong>B1 (Search Results):</strong> Type a matching term like &quot;Morning&quot; or &quot;Ideas&quot;<br />
                    • <strong>B2 (No Results):</strong> Type a non-matching term like &quot;xyz&quot;<br />
                    • <strong>Scroll collapse:</strong> Scroll to see iOS-style search bar collapse<br />
                    • <strong>Click a clip:</strong> See pointer cursor (navigation ready)
                  </>
                )}
              </div>

              <p style={{ color: 'rgba(0, 0, 0, 0.6)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                <strong>Note:</strong> This standalone view doesn&apos;t include RecordBar (which lives in ClipMasterScreen).
                The screen fills available height and is designed to work within the orchestrator.
              </p>
            </div>
          </div>
        </div>

        <div className="component-grid">
          <div className="screen-wrapper">
            <ClipHomeScreen clips={getClipsForHomeState()} />
          </div>
        </div>

        {/* ============================================
           SECTION 2: ClipRecordScreen (Standalone)
           ============================================ */}
        <div className="showcase-content">
          <div className="file-divider">
            <div className="file-label">📁 ClipRecordScreen.tsx</div>

            <div className="section">
              <h2 className="section-title">Clip Record Screen - Recording & Transcription View</h2>

              <div className="toggle-controls">
                <button
                  className={`toggle-btn ${recordScreenState === 'recording' ? 'active' : ''}`}
                  onClick={() => setRecordScreenState('recording')}
                >
                  D1: Recording
                </button>
                <button
                  className={`toggle-btn ${recordScreenState === 'transcribed' ? 'active' : ''}`}
                  onClick={() => setRecordScreenState('transcribed')}
                >
                  D3: Transcribed
                </button>
                <button
                  className={`toggle-btn ${recordScreenState === 'offline' ? 'active' : ''}`}
                  onClick={() => setRecordScreenState('offline')}
                >
                  D4: Offline
                </button>
              </div>

              <div className="state-description">
                {recordScreenState === 'recording' && (
                  <>
                    <strong>D1 - Recording:</strong> User is actively recording. Content area is empty.
                    Transcription text appears after processing completes.
                  </>
                )}
                {recordScreenState === 'transcribed' && (
                  <>
                    <strong>D3 - Transcribed:</strong> Recording complete, showing transcription text.
                    User can scroll to read the full content. RecordBar shows Copy + Record + Structure.
                  </>
                )}
                {recordScreenState === 'offline' && (
                  <>
                    <strong>D4 - Offline:</strong> User is offline with pending recordings.
                    Shows offline notice and list of ClipOffline items waiting to be transcribed.
                  </>
                )}
              </div>

              <p style={{ color: 'rgba(0, 0, 0, 0.6)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                <strong>Structure:</strong> ClipRecordHeader (static) + TranscriptionContent (scrollable).
                Header doesn&apos;t need fixed positioning since it&apos;s above the scroll area.
              </p>
            </div>
          </div>
        </div>

        <div className="component-grid">
          <div className="screen-wrapper">
            <ClipRecordScreen
              state={recordScreenState}
              contentBlocks={recordScreenState === 'transcribed' ? [{
                id: 'demo-transcription',
                text: sampleTranscription,
                animate: false
              }] : []}
              pendingClips={recordScreenState === 'offline' ? samplePendingClips : []}
              onBackClick={() => console.log('Back clicked')}
              onNewClipClick={() => console.log('New clip clicked')}
            />
          </div>
        </div>

        {/* ============================================
           SECTION 3: ClipMasterScreen (Full Orchestrator)
           ============================================ */}
        <div className="showcase-content">
          <div className="file-divider">
            <div className="file-label">📁 ClipMasterScreen.tsx (Orchestrator)</div>

            <div className="section">
              <h2 className="section-title">Clip Master Screen - Full App Demo with Transitions</h2>

              <div className="state-description">
                <strong>Orchestrator Component:</strong> Manages screen transitions and shared RecordBar.<br />
                <br />
                <strong>Navigation:</strong><br />
                • <strong>Click a clip:</strong> Slides to ClipRecordScreen showing transcription<br />
                • <strong>Click RECORD:</strong> Slides to ClipRecordScreen, then start recording<br />
                • <strong>Click &quot;Clips&quot; (back button):</strong> ONLY way back to ClipHomeScreen<br />
                • <strong>Click Close (X):</strong> Cancels recording but stays on ClipRecordScreen<br />
                • <strong>Click NewClip (pencil):</strong> Resets to fresh recording state (stays on ClipRecordScreen)<br />
                <br />
                <strong>RecordBar States:</strong> record → recording → processing → complete<br />
                Try the full flow: RECORD → speak → DONE → auto-process → COMPLETE
              </div>

              <p style={{ color: 'rgba(0, 0, 0, 0.6)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                <strong>Architecture:</strong> ClipMasterScreen wraps ClipHomeScreen and ClipRecordScreen.
                RecordBar (RecordNavBarMorphing) persists across transitions - screens slide while bar stays fixed.
              </p>
            </div>
          </div>
        </div>

        <div className="component-grid">
          <ClipMasterScreen
            pendingClips={samplePendingClips}
          />
        </div>

        {/* ============================================
           SECTION 4: ClipOfflineScreen (Retry States)
           ============================================ */}
        <div className="showcase-content">
          <div className="file-divider">
            <div className="file-label">📁 ClipOfflineScreen.tsx (Retry States)</div>

            <div className="section">
              <h2 className="section-title">Offline Recording States</h2>

              <p className="section-description">
                Interactive demo of offline recording retry behavior. Toggle between states 
                to see how the UI responds during different phases of the retry cycle.
              </p>

              <div className="state-description">
                <strong>Retry Pattern:</strong><br />
                • <strong>3 rapid attempts</strong> (no waits between) → ~3 min of continuous spinning<br />
                • <strong>Interval-based retries:</strong> 1 min → 2 min → 4 min → 5 min (cycle repeats)<br />
                <br />
                <strong>Icon States:</strong><br />
                • <strong>Gray spinning:</strong> HTTP request actively in progress<br />
                • <strong>Gray static:</strong> Waiting between attempts OR offline<br />
                <br />
                <strong>Toggle Controls:</strong> Same 4 buttons control both Home Screen and Detail View simultaneously
              </div>
            </div>
          </div>
        </div>

        <div className="component-grid">
          <ClipOfflineScreen />
        </div>
      </div>
    </>
  );
};

export default ClipScreenComponents;
