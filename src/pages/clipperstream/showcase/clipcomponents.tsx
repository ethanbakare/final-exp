import React, { useState } from 'react';
import { 
  RecordButton,
  DoneButton,
  ProcessingButton,
  ProcessingButtonSVG,
  TimerText,
  CopyButton,
  StructureButton,
  CloseButton,
  CheckTickButton,
  TranscribeBig,
  RetryButton
} from '@/projects/clipperstream/components/ui/clipbuttons';
import { 
  NoClipsFrameIcon,
  EmptyClipFrameIcon,
  ReturnToHome,
  NewClipFrame,
  OnlineStatus,
  OfflineStatus,
  ButtonOutline,
  ButtonFull
} from '@/projects/clipperstream/components/ui/midClipButtons';
import { SubCopyIcon, SubDeleteRow, SubRenameIcon, SubTranscribeIcon, SubTranscribeIconSpinning, SubPendingIconSpinning, SubCheckmarkIcon, SubCloseIcon } from '@/projects/clipperstream/components/ui/subclipbuttons';
import { RecordNavBar, RecordNavBarAlt } from '@/projects/clipperstream/components/ui/recordnavbar';
import { RecordMorphingToggle } from '@/projects/clipperstream/components/ui/recordMorphing';
import { ClipDeleteModal, ClipRenameModal, ClipDeleteModalFull, ClipRenameModalFull } from '@/projects/clipperstream/components/ui/clipModal';
import { EntryBox } from '@/projects/clipperstream/components/ui/entrybox';
import { Search } from '@/projects/clipperstream/components/ui/search';
import { OptionsDropDown, TranscribeDropDown } from '@/projects/clipperstream/components/ui/clipmenudropdown';
import { ClipListItem } from '@/projects/clipperstream/components/ui/cliplist';
import { ClipOffline } from '@/projects/clipperstream/components/ui/ClipOffline';
import { ClipHomeHeader } from '@/projects/clipperstream/components/ui/cliphomeheader';
import { ClipRecordHeader } from '@/projects/clipperstream/components/ui/cliprecordheader';
import { CopyToast, AudioToast } from '@/projects/clipperstream/components/ui/ClipToast';
import { ClipModalOverlay } from '@/projects/clipperstream/components/ui/ClipModalOverlay';

// Import for morphing buttons
import { MorphingDoneToProcessingButton, MorphingCopyToCheckButton, MorphingCloseToCopyButton, MorphingProcessingToStructureButton, MorphingTimerProcessingToStructure, MorphingOnlineOfflineStatus } from '@/projects/clipperstream/components/ui/clipmorphingbuttons';

// Import for new modular morphing system
import { RecordNavBarMorphingDemo } from '@/projects/clipperstream/components/ui/mainmorph';

// Import for experimental variant-based morphing system
import { RecordNavBarVarMorphingDemo, RecordNavBarVarMorphingDirectDemo } from '@/projects/clipperstream/components/ui/mainvarmorph';

const ClipComponents: React.FC = () => {
  // State for interactive morphing button demo
  const [morphingButtonState, setMorphingButtonState] = useState<'done' | 'processing'>('done');
  const [closeCopyState, setCloseCopyState] = useState<'close' | 'copy'>('close');
  const [processingStructureState, setProcessingStructureState] = useState<'processing' | 'structure'>('processing');
  const [timerProcessingState, setTimerProcessingState] = useState<'processing' | 'structure'>('processing');
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online');
  
  // State for modal overlay demos
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModalFull, setShowDeleteModalFull] = useState(false);
  const [showRenameModalFull, setShowRenameModalFull] = useState(false);
  const [renameValue, setRenameValue] = useState('Meeting Notes - Q4 Review');
  
  const handleMorphingButtonClick = () => {
    setMorphingButtonState(prev => prev === 'done' ? 'processing' : 'done');
  };
  
  const handleCloseCopyClick = () => {
    setCloseCopyState(prev => prev === 'close' ? 'copy' : 'close');
  };
  
  const handleProcessingStructureClick = () => {
    setProcessingStructureState(prev => prev === 'processing' ? 'structure' : 'processing');
  };
  
  const handleTimerProcessingClick = () => {
    setTimerProcessingState(prev => prev === 'processing' ? 'structure' : 'processing');
  };
  
  const handleNetworkStatusClick = () => {
    setNetworkStatus(prev => prev === 'online' ? 'offline' : 'online');
  };
  
  // State for ClipOffline demo (transcribing ↔ failed toggle)
  const [clipOfflineStatus, setClipOfflineStatus] = useState<'waiting' | 'transcribing' | 'failed'>('transcribing');
  
  const handleClipOfflineToggle = () => {
    setClipOfflineStatus(prev => prev === 'transcribing' ? 'failed' : 'transcribing');
  };
  
  return (
    <>
      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          background-color: #1C1C1C;
        }
        
        .showcase-container {
          padding: 2rem;
          min-height: 100vh;
          background-color: #1C1C1C;
        }
        
        .section {
          margin-bottom: 3rem;
        }
        
        .section-title {
          color: #FFFFFF;
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }
        
        .component-grid {
          display: flex;
          flex-wrap: wrap;
          /* border: 1px solid red; */
          gap: 2rem;
          margin-bottom: 1.5rem;
          align-items: center;
        }
        
        .file-divider {
          border-top: 2px solid rgba(255, 255, 255, 0.1);
          margin: 4rem 0 2rem 0;
          padding-top: 2rem;
        }
        
        .file-label {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 2rem;
        }
      `}</style>
      
      <div className="showcase-container">
        <div className="section">
          <h2 className="section-title">Buttons</h2>
          <div className="component-grid">
            <RecordButton />
            <DoneButton />
            <ProcessingButton />
            <ProcessingButtonSVG />
            <TimerText />
            <CopyButton />
            <StructureButton />
            <CloseButton />
            <CheckTickButton />
            <TranscribeBig />
            <RetryButton />
            <ButtonOutline />
            <ButtonFull />
          </div>
        </div>
        
        <div className="section">
          <h2 className="section-title">Sub Buttons</h2>
          <div className="file-label">📁 subclipbuttons.tsx</div>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            Smaller versions with thinner stroke widths (1.17px vs 2px). Used for compact UI elements and dropdown menus.
          </p>
          <div className="component-grid">
            <SubCopyIcon />
            <SubDeleteRow />
            <SubRenameIcon />
            <SubTranscribeIcon />
            <SubTranscribeIconSpinning />
            <SubPendingIconSpinning />
            <SubCheckmarkIcon />
            <SubCloseIcon />
          </div>
        </div>
        
        <div className="section">
        
          <h2 className="section-title">Morphing Buttons - Opacity Crossfade Pattern</h2>
          <div className="file-label">📁 clipmorphingbuttons.tsx</div>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            Two-button opacity crossfade pattern: Complete buttons stacked absolutely, visibility swaps via opacity (1 ↔ 0). No physical dimension changes.
          </p>
          <div className="component-grid">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
              <MorphingDoneToProcessingButton 
                state={morphingButtonState}
                onDoneClick={handleMorphingButtonClick}
                onProcessingClick={handleMorphingButtonClick}
              />
              <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem' }}>Done ↔ Processing</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
              <MorphingCloseToCopyButton 
                state={closeCopyState}
                onCloseClick={handleCloseCopyClick}
                onCopyClick={handleCloseCopyClick}
              />
              <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem' }}>Close ↔ Copy</span>
            </div>
          </div>
        </div>
        
        <div className="section">
          <h2 className="section-title">Morphing Copy → Check Button</h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            Click the Copy button to see it morph to CheckTick. After 3 seconds, it automatically reverts back to Copy. Perfect for copy-to-clipboard validation feedback.
          </p>
          <div className="component-grid">
            <MorphingCopyToCheckButton 
              onClick={() => console.log('Copy clicked!')}
            />
          </div>
        </div>
        
        <div className="section">
          <h2 className="section-title">Morphing Processing → Structure Button</h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            Click to see ONE button physically morph between states. Processing (76px × 42px white pill) shrinks to Structure (38px × 38px semi-transparent circle). Width, height, background color, and border-radius all transition smoothly (0.2s) while icons crossfade. Right-aligned shrinking with center-aligned vertical positioning prevents upward movement.
          </p>
          <div className="component-grid">
            <MorphingProcessingToStructureButton 
              state={processingStructureState}
              onProcessingClick={handleProcessingStructureClick}
              onStructureClick={handleProcessingStructureClick}
            />
          </div>
        </div>
        
        <div className="section">
          <h2 className="section-title">Morphing Timer + Processing → Structure</h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            Click to see a container div (130px → 48px) that naturally shrinks as its contents morph. Timer fades out first (0.1s), then button finishes morphing (0.2s total). Mimics timer-done-container from recordnavbar.tsx. Container uses width: fit-content with smooth transition.
          </p>
          <div className="component-grid">
            <MorphingTimerProcessingToStructure 
              state={timerProcessingState}
              time="0:26"
              onProcessingClick={handleTimerProcessingClick}
              onStructureClick={handleTimerProcessingClick}
            />
          </div>
        </div>
        
        <div className="section">
          <h2 className="section-title">Morphing Online/Offline Status</h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            Click to toggle between Online (dimmed white) and Offline (orange) status. Uses 0.4s opacity crossfade - slower than buttons since it&apos;s informational, not interactive. Includes proper accessibility (aria-live region).
            <br /><br />
            <strong>Use case:</strong> During recording, network status changes. Recording continues regardless, but user sees visual feedback.
          </p>
          <div 
            className="component-grid" 
            onClick={handleNetworkStatusClick}
            style={{ cursor: 'pointer' }}
          >
            <MorphingOnlineOfflineStatus 
              state={networkStatus}
              onChange={(newState) => console.log(`Network status changed to: ${newState}`)}
            />
          </div>
          <p style={{ color: 'rgba(255, 255, 255, 0.4)', marginTop: '0.5rem', fontSize: '0.75rem', fontStyle: 'italic' }}>
            Click anywhere in this section to toggle status
          </p>
        </div>
        
        <div className="section">
          <h2 className="section-title">Background Icons</h2>
          <div className="file-label">📁 midClipButtons.tsx</div>
          <div className="component-grid">
            <NoClipsFrameIcon />
            <EmptyClipFrameIcon />
          </div>
        </div>
        
        <div className="section">
          <h2 className="section-title">Clip Header</h2>
          <div className="file-label">📁 midClipButtons.tsx</div>
          <div className="component-grid">
            <ReturnToHome />
            <NewClipFrame />
            <OnlineStatus />
            <OfflineStatus />
          </div>
        </div>
        
        {/* File divider - Components from recordnavbar.tsx */}
        <div className="file-divider">
          <div className="file-label">📁 recordnavbar.tsx</div>
          
          <div className="section">
            <h2 className="section-title">RecordNavBar</h2>
            <div className="component-grid">
              <RecordNavBar />
            </div>
          </div>
          
          <div className="section">
            <h2 className="section-title">RecordNavBarAlt</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Alternative layout: CopyButton | RecordButton | StructureButton with transparent background.
            </p>
            <div className="component-grid">
              <RecordNavBarAlt />
            </div>
          </div>
        </div>

        {/* File divider - Components from recordMorphing.tsx */}
        <div className="file-divider">
          <div className="file-label">📁 recordMorphing.tsx</div>
          
          <div className="section">
            <h2 className="section-title">RecordMorphingButton</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Click to toggle between Record button and Recording nav bar. Expands from center (bidirectional).
            </p>
            <div className="component-grid">
              <RecordMorphingToggle />
            </div>
          </div>
        </div>

        {/* File divider - Components from mainmorph.tsx (NEW MODULAR SYSTEM) */}
        <div className="file-divider">
          <div className="file-label">📁 mainmorph.tsx + recordNavMorphingButtons.tsx (NEW MODULAR PATTERN)</div>
          
          <div className="section">
            <h2 className="section-title">RecordNavBarMorphing - 4-State Modular System</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              <strong>Complete modular morphing system</strong> following AI Confidence Tracker pattern (IntegratedDeepCard + TranscriptBoxNav + deepMorphingButtons).
              <br /><br />
              <strong>4 States:</strong>
              <br />
              • <strong>Record</strong> - Small white pill with &quot;RECORD&quot; text (113×42px)
              <br />
              • <strong>Recording</strong> - Full navbar with Close + WaveClipper + Timer + Done (366×50px, dark bg)
              <br />
              • <strong>Processing</strong> - Close + WaveClipper (frozen) + Timer (frozen) + Spinner (366×50px, dark bg)
              <br />
              • <strong>Complete</strong> - Copy + RecordButton + Structure (366×50px, transparent bg) - like RecordNavBarAlt
              <br /><br />
              <strong>Architecture:</strong>
              <br />
              • <strong>recordNavMorphingButtons.tsx</strong> - Pure morphing components (MorphingCloseToCopyButton, MorphingDoneProcessingStructureButton)
              <br />
              • <strong>mainmorph.tsx</strong> - Orchestrator with state mapping (like TranscriptBoxNav)
              <br />
              • <strong>Auto-transitions:</strong> Click RECORD → speak → click DONE → auto-process (3s) → COMPLETE state
              <br /><br />
              <strong>Demo:</strong> Click the RECORD button below, grant mic permission, speak, then click DONE. Watch it auto-transition through processing to complete state.
            </p>
            <div className="component-grid">
              <RecordNavBarMorphingDemo />
            </div>
          </div>
        </div>

        {/* File divider - Components from mainvarmorph.tsx (EXPERIMENTAL VARIANT SYSTEM) */}
        <div className="file-divider">
          <div className="file-label">📁 mainvarmorph.tsx (EXPERIMENTAL - Variant-Based Animation)</div>
          
          <div className="section">
            <h2 className="section-title">RecordNavBarVarMorphing - Variant Prop System</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              <strong>Industry-standard variant prop approach</strong> for controlling animation behavior.
              <br /><br />
              <strong>Variants:</strong>
              <br />
              • <strong>morph</strong> (default) - Full expansion animation: record → recording → processing → complete
              <br />
              • <strong>fade</strong> - Direct to complete: container already expanded, buttons fade in at fixed positions
              <br /><br />
              <strong>Use Cases:</strong>
              <br />
              • <strong>morph</strong>: Normal recording flow via button interactions
              <br />
              • <strong>fade</strong>: Viewing an existing transcribed clip (skip expansion, just show final state with buttons fading in)
              <br /><br />
              <strong>Why this pattern?</strong>
              <br />
              • Same API works on web (CSS transitions) and React Native (Reanimated)
              <br />
              • State machine stays simple (4 states)
              <br />
              • Animation behavior is explicit in the prop
            </p>
            
            <h3 style={{ color: '#FFFFFF', fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem', marginTop: '2rem' }}>Demo 1: Normal Flow (variant=&quot;morph&quot;)</h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Same as mainmorph.tsx - click RECORD, grant mic, speak, click DONE.
            </p>
            <div className="component-grid">
              <RecordNavBarVarMorphingDemo />
            </div>
            
            <h3 style={{ color: '#FFFFFF', fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem', marginTop: '2rem' }}>Demo 2: Direct to Complete (variant=&quot;fade&quot;)</h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1rem', fontSize: '0.875rem' }}>
              <strong>Use the toggle button</strong> to switch between record ↔ complete.
              <br /><br />
              <strong>What should happen:</strong>
              <br />
              • <strong>Instant switch</strong> - Container is already at full size, RecordButton is already visible
              <br />
              • <strong>Copy &amp; Structure fade in</strong> - Only opacity animates (0 → 1), no movement
              <br />
              • <strong>No sliding/clipping</strong> - Buttons are already in their final positions
              <br /><br />
              <em>This simulates clicking on an existing transcribed clip.</em>
            </p>
            <div className="component-grid">
              <RecordNavBarVarMorphingDirectDemo />
            </div>
          </div>
        </div>

        {/* File divider - Components from clipModal.tsx */}
        <div className="file-divider">
          <div className="file-label">📁 clipModal.tsx</div>
          
          <div className="section">
            <h2 className="section-title">ClipDeleteModal</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Delete confirmation modal with Cancel (ButtonOutline) and Delete (ButtonFull) buttons using fullWidth prop.
            </p>
            <div className="component-grid" style={{ position: 'relative', minHeight: '200px', width: '100%' }}>
              <ClipDeleteModal />
            </div>
          </div>
          
          <div className="section">
            <h2 className="section-title">ClipRenameModal</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Rename modal with EntryBox input and Cancel (ButtonOutline) / OK (ButtonFull) buttons using fullWidth prop.
            </p>
            <div className="component-grid" style={{ position: 'relative', minHeight: '250px', width: '100%' }}>
              <ClipRenameModal />
            </div>
          </div>
          
          <div className="section">
            <h2 className="section-title">ClipDeleteModalFull (314px, vertical buttons)</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Full-width variation with vertical button stacking. Width: 314px (80% of container when used in screens). Buttons stretch to fill available width.
            </p>
            <div className="component-grid" style={{ position: 'relative', minHeight: '220px', width: '100%' }}>
              <ClipDeleteModalFull />
            </div>
          </div>
          
          <div className="section">
            <h2 className="section-title">ClipRenameModalFull (314px, vertical buttons)</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Full-width variation with vertical button stacking. Width: 314px (80% of container when used in screens). Buttons and EntryBox stretch to fill available width.
            </p>
            <div className="component-grid" style={{ position: 'relative', minHeight: '280px', width: '100%' }}>
              <ClipRenameModalFull />
            </div>
          </div>
        </div>

        {/* File divider - Components from cliplist.tsx */}
        <div className="file-divider">
          <div className="file-label">📁 cliplist.tsx</div>
          
          <div className="section">
            <h2 className="section-title">Clip List Item - Three Status Variations</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1rem', fontSize: '0.875rem' }}>
              List item component for displaying clips with title, date, and status. Features responsive hover states and three status variations following <strong>DRY principle</strong> (Don&apos;t Repeat Yourself).
              <br /><br />
              <strong>Status Variations:</strong>
              <br />
              • <strong>Completed (null):</strong> No status shown - transcription done
              <br />
              • <strong>Pending:</strong> Shows &quot;Waiting to transcribe&quot; with pending icon
              <br />
              • <strong>Transcribing:</strong> Shows &quot;Transcribing...&quot; with rotating transcribe icon + animated ellipsis
              <br /><br />
              <strong>Desktop:</strong> Hover over the list item to see background color change to #252525 and three-dot menu fade in. Click dots to open options menu.
              <br />
              <strong>Mobile:</strong> Three-dot menu is visible at 20% opacity by default. Click the dots to make them fully visible and open menu.
            </p>
            <div className="component-grid" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
              <ClipListItem 
                title="Morning thoughts on productivity"
                date="May 15, 2025"
                status={null}
              />
              <ClipListItem 
                title="Teach me to love myself today"
                date="May 13, 2025"
                status="pending"
              />
              <ClipListItem 
                title="Ideas for the new project launch"
                date="May 14, 2025"
                status="transcribing"
              />
            </div>
          </div>
        </div>

        {/* File divider - Components from ClipOffline.tsx */}
        <div className="file-divider">
          <div className="file-label">📁 ClipOffline.tsx</div>
          
          <div className="section">
            <h2 className="section-title">Clip Offline (Pending Clip) - 3 States</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Offline/pending clip component with persistent background (#252525). Has three states:
              <br /><br />
              <strong>Waiting State (default):</strong> Shows static TranscribeBig icon at 40% opacity. Indicates clip is queued and waiting for network to transcribe automatically.
              <br /><br />
              <strong>Transcribing State:</strong> Shows spinning TranscribeBig icon at 100% opacity. Indicates active transcription in progress.
              <br /><br />
              <strong>Failed State:</strong> PendingClip shrinks, RetryButton slides in from right (Search.tsx pattern). Timer fades out, TranscribeBig crossfades to Caution icon.
              <br /><br />
              <strong>Animation:</strong> RetryButton uses translateX slide-in (like Cancel in Search). Timer + TranscribeBig fade out while CautionIcon fades in (opacity crossfade like MorphingCloseToCopyButton).
            </p>
            <div className="component-grid">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem', marginBottom: '0.5rem', display: 'block' }}>Waiting (static icon at 40%)</span>
                  <ClipOffline title="Clip 001" time="0:26" />
                </div>
                <div>
                  <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem', marginBottom: '0.5rem', display: 'block' }}>Transcribing (spinning icon at 100%)</span>
                  <ClipOffline title="Clip 002" status="transcribing" time="0:42" />
                </div>
                <div>
                  <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem', marginBottom: '0.5rem', display: 'block' }}>Failed (RetryButton slides in)</span>
                  <ClipOffline 
                    title="Clip 003"
                    time="1:15"
                    status="failed" 
                    onRetryClick={() => console.log('Retry clicked')} 
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Interactive Demo: Transcribing ↔ Failed Toggle */}
          <div className="section" style={{ marginTop: '2rem' }}>
            <h3 style={{ color: '#FFFFFF', fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>Interactive Demo: Transcribing ↔ Failed</h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Click the toggle button to watch the animation between <strong>transcribing</strong> and <strong>failed</strong> states.
              <br /><br />
              <strong>What to watch:</strong>
              <br />
              • Timer fades out (opacity 1 → 0)
              <br />
              • TranscribeBig crossfades to CautionIcon (opacity swap)
              <br />
              • RetryButton slides in from right (translateX)
              <br />
              • PendingClip shrinks to make room
            </p>
            <div className="component-grid" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
              <ClipOffline 
                title="Clip 004"
                status={clipOfflineStatus}
                time="0:42"
                onRetryClick={() => console.log('Retry clicked - would restart transcription')} 
              />
              <button 
                onClick={handleClipOfflineToggle}
                style={{
                  padding: '10px 20px',
                  background: clipOfflineStatus === 'transcribing' ? 'var(--RecRed)' : 'var(--ClipGrey)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  marginTop: '0.5rem'
                }}
              >
                Toggle: {clipOfflineStatus === 'transcribing' ? 'Simulate Failure →' : '← Back to Transcribing'}
              </button>
              <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                Current state: <strong>{clipOfflineStatus}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* File divider - Components from entrybox.tsx */}
        <div className="file-divider">
          <div className="file-label">📁 entrybox.tsx</div>
          
          <div className="section">
            <h2 className="section-title">EntryBox</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Text input field with smooth focus ring animation. Click to see the 3px outer border appear with transition.
            </p>
            <div className="component-grid">
              <EntryBox placeholder="Clip Title" />
              <EntryBox placeholder="Type here..." />
            </div>
          </div>
        </div>

        {/* File divider - Components from search.tsx */}
        <div className="file-divider">
          <div className="file-label">📁 search.tsx</div>
          
          <div className="section">
            <h2 className="section-title">Search - 3-State iPhone-Style Search Bar</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Click to focus → SearchBar shrinks, Cancel slides in. Type text → X button appears. Click Cancel to reset.
            </p>
            <div className="component-grid">
              <Search placeholder="Search" />
            </div>
          </div>
        </div>

        {/* File divider - Components from cliphomeheader.tsx */}
        <div className="file-divider">
          <div className="file-label">📁 cliphomeheader.tsx</div>
          
          <div className="section">
            <h2 className="section-title">Clip Home Header</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Header section for clips home page combining title, account info, and search.
              <br /><br />
              <strong>Components:</strong>
              <br />
              • <strong>TransHeaderMain:</strong> Row layout with &quot;Transcribed Clips&quot; title (Inter Medium 32px) and circular avatar with user initial
              <br />
              • <strong>Search:</strong> Reuses the existing Search component for consistency
              <br /><br />
              <strong>Interactions:</strong> Click avatar for account menu, use search bar for filtering clips.
            </p>
            <div className="component-grid">
              <ClipHomeHeader />
            </div>
          </div>
        </div>

        {/* File divider - Components from cliprecordheader.tsx */}
        <div className="file-divider">
          <div className="file-label">📁 cliprecordheader.tsx</div>
          
          <div className="section">
            <h2 className="section-title">Clip Record Header</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Header section for clip recording/viewing page with navigation and network status.
              <br /><br />
              <strong>Components:</strong>
              <br />
              • <strong>ReturnToHome:</strong> Back button with &quot;Clips&quot; text (LEFT side, z-index: 0)
              <br />
              • <strong>MorphingOnlineOfflineStatus:</strong> Network indicator (CENTER, z-index: 1)
              <br />
              • <strong>NewClipFrame:</strong> Edit/pencil icon button (RIGHT side, z-index: 2)
              <br /><br />
              <strong>Layout:</strong> Responsive width (100%, max 361px) × 70px header using <strong>CSS Grid</strong> (industry best practice). Three-column layout (1fr auto 1fr) ensures perfect centering without absolute positioning. Matches cliphomeheader.tsx responsive pattern.
              <br /><br />
              <strong>Network Detection:</strong> Automatically detects network status using navigator.onLine and window online/offline events. Try turning off your WiFi to see it change to &quot;Offline&quot; (orange).
              <br /><br />
              <strong>Use case:</strong> During clip recording or viewing, provides navigation back to clips list, option to create new clip, and live network status feedback.
            </p>
            <div className="component-grid">
              <ClipRecordHeader 
                onBackClick={() => console.log('Back to clips')}
                onNewClipClick={() => console.log('New clip')}
                onNetworkChange={(status) => console.log(`Network status changed to: ${status}`)}
              />
            </div>
          </div>
        </div>

        {/* File divider - Components from clipmenudropdown.tsx */}
        <div className="file-divider">
          <div className="file-label">📁 clipmenudropdown.tsx</div>
          
          <div className="section">
            <h2 className="section-title">Dropdown Menus</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Context menus triggered by triple-dot icons. Hover over rows to see 5% white overlay. Width dynamically adjusts to content.
            </p>
            
            <div className="section" style={{ marginTop: '2rem' }}>
              <h3 style={{ color: '#FFFFFF', fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>Options DropDown</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                3 rows: Rename, Copy, Delete. Used for clip actions. Dynamic width with 119px minimum.
              </p>
              <div className="component-grid">
                <OptionsDropDown 
                  onRenameClick={() => console.log('Rename clicked')}
                  onCopyClick={() => console.log('Copy clicked')}
                  onDeleteClick={() => console.log('Delete clicked')}
                />
              </div>
            </div>

            <div className="section" style={{ marginTop: '2rem' }}>
              <h3 style={{ color: '#FFFFFF', fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>Transcribe DropDown</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                2 rows: Transcribe, Delete. Used for transcription actions. Dynamic width with 128px minimum.
              </p>
              <div className="component-grid">
                <TranscribeDropDown 
                  onTranscribeClick={() => console.log('Transcribe clicked')}
                  onDeleteClick={() => console.log('Delete clicked')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* File divider - Components from ClipToast.tsx */}
        <div className="file-divider">
          <div className="file-label">📁 ClipToast.tsx</div>
          
          <div className="section">
            <h2 className="section-title">Toast Notifications</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Toast notifications for user feedback. Used for copy confirmation and audio save confirmation.
              <br /><br />
              <strong>Features:</strong>
              <br />
              • <strong>fullWidth prop:</strong> Enables responsive mode - fills parent container up to 341px max (like Search component)
              <br />
              • <strong>Customizable text:</strong> Default text can be overridden via props
              <br />
              • <strong>Close button:</strong> Dismisses the toast (SubCloseIcon with 60% opacity)
              <br /><br />
              <strong>Icons:</strong> Uses SubCopyIcon (copy) and SubCheckmarkIcon (audio) from subclipbuttons.tsx with 1.17px stroke.
            </p>
            
            <div className="section" style={{ marginTop: '2rem' }}>
              <h3 style={{ color: '#FFFFFF', fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>Copy Toast</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                Shows copy confirmation with SubCopyIcon. Click the X to dismiss.
              </p>
              <div className="component-grid" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
                <CopyToast onClose={() => console.log('Copy toast closed')} />
                <CopyToast text="Custom copy message" onClose={() => console.log('Copy toast closed')} />
              </div>
            </div>

            <div className="section" style={{ marginTop: '2rem' }}>
              <h3 style={{ color: '#FFFFFF', fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>Audio Toast</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                Shows audio saved confirmation with SubCheckmarkIcon. Click the X to dismiss.
              </p>
              <div className="component-grid" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
                <AudioToast onClose={() => console.log('Audio toast closed')} />
                <AudioToast text="Recording saved offline" onClose={() => console.log('Audio toast closed')} />
              </div>
            </div>
          </div>
        </div>

        {/* File divider - Components from ClipModalOverlay.tsx */}
        <div className="file-divider">
          <div className="file-label">📁 ClipModalOverlay.tsx</div>
          
          <div className="section">
            <h2 className="section-title">Modal Overlay System</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Reusable modal overlay with dark backdrop, blur effect, and scale animation.
              <br /><br />
              <strong>Features:</strong>
              <br />
              • <strong>Backdrop:</strong> Semi-transparent dark overlay (50% black) with 4px backdrop blur
              <br />
              • <strong>Safari/Firefox Support:</strong> Uses both backdrop-filter and -webkit-backdrop-filter
              <br />
              • <strong>Scale Animation:</strong> Modal content scales from 0.85 → 1 over 150ms with slight overshoot
              <br />
              • <strong>Click Outside:</strong> Optional backdrop click to dismiss (configurable)
              <br />
              • <strong>ESC Key:</strong> Press ESC to close modal
              <br />
              • <strong>Scroll Lock:</strong> Prevents background scrolling when modal is open
              <br />
              • <strong>Accessibility:</strong> role="dialog" and aria-modal="true"
            </p>
            
            {/* Demo container with relative positioning for modal */}
            <div style={{ 
              position: 'relative', 
              width: '393px', 
              height: '300px', 
              background: 'var(--ClipBg)', 
              borderRadius: '8px',
              overflow: 'hidden',
              marginBottom: '1rem',
              border: '.5px solid rgba(255, 255, 255, 0.2)'  /* Subtle border to show container bounds */
            }}>
              {/* Sample content behind modal */}
              <div style={{ padding: '1rem' }}>
                <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>
                  Sample content behind the modal. Click the buttons below to see the overlay effect.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '3rem' }}>
                  <ClipListItem title="Meeting Notes - Q4 Review" date="Dec 1, 2025" />
                  <ClipListItem title="Podcast Episode Summary" date="Nov 28, 2025" />
                </div>
              </div>
              
              {/* Delete Modal Demo */}
              <ClipModalOverlay
                isVisible={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                closeOnBackdropClick={true}
              >
                <ClipDeleteModal
                  onCancel={() => setShowDeleteModal(false)}
                  onDelete={() => {
                    console.log('Delete confirmed');
                    setShowDeleteModal(false);
                  }}
                />
              </ClipModalOverlay>
              
              {/* Rename Modal Demo */}
              <ClipModalOverlay
                isVisible={showRenameModal}
                onClose={() => setShowRenameModal(false)}
                closeOnBackdropClick={true}
              >
                <ClipRenameModal
                  value={renameValue}
                  onChange={setRenameValue}
                  onCancel={() => setShowRenameModal(false)}
                  onOK={() => {
                    console.log('Renamed to:', renameValue);
                    setShowRenameModal(false);
                  }}
                />
              </ClipModalOverlay>
            </div>
            
            {/* Control buttons */}
            <div className="component-grid" style={{ gap: '1rem' }}>
              <button 
                onClick={() => setShowDeleteModal(true)}
                style={{
                  padding: '10px 20px',
                  background: 'var(--ClipGrey)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Show Delete Modal
              </button>
              <button 
                onClick={() => setShowRenameModal(true)}
                style={{
                  padding: '10px 20px',
                  background: 'var(--ClipGrey)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Show Rename Modal
              </button>
            </div>
            <p style={{ color: 'rgba(255, 255, 255, 0.4)', marginTop: '1rem', fontSize: '0.75rem' }}>
              Note: Click outside modal or press ESC to dismiss. Rename modal auto-focuses and selects text.
            </p>
            
            {/* Full-Width Modal Variations */}
            <div className="section" style={{ marginTop: '2rem' }}>
              <h3 style={{ color: '#FFFFFF', fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>Full-Width Modal Variations (314px, vertical buttons)</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                These modals are designed for use in full-screen containers like ClipHomeScreen.
                <br />
                • Width: 314px (will be 80% of container when used in screens)
                <br />
                • Buttons: Stacked vertically
                <br />
                • Elements: Set to fill available space
              </p>
              
              {/* Full-width modal demo container */}
              <div style={{ 
                position: 'relative', 
                width: '393px', 
                height: '350px', 
                background: 'var(--ClipBg)', 
                borderRadius: '8px',
                overflow: 'hidden',
                marginBottom: '1rem',
                border: '0.5px solid var(--RecWhite_20)'
              }}>
                {/* Sample content behind modal */}
                <div style={{ padding: '1rem' }}>
                  <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>
                    Full-width modals with 314px base width.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '3rem' }}>
                    <ClipListItem title="Podcast Episode Summary - AI Trends in 2025" date="Dec 1, 2025" />
                    <ClipListItem title="Weekly Team Standup Notes" date="Nov 30, 2025" />
                  </div>
                </div>
                
                {/* Delete Modal Full Demo */}
                <ClipModalOverlay
                  isVisible={showDeleteModalFull}
                  onClose={() => setShowDeleteModalFull(false)}
                  closeOnBackdropClick={true}
                >
                  <ClipDeleteModalFull
                    onCancel={() => setShowDeleteModalFull(false)}
                    onDelete={() => {
                      console.log('Delete confirmed (full)');
                      setShowDeleteModalFull(false);
                    }}
                  />
                </ClipModalOverlay>
                
                {/* Rename Modal Full Demo */}
                <ClipModalOverlay
                  isVisible={showRenameModalFull}
                  onClose={() => setShowRenameModalFull(false)}
                  closeOnBackdropClick={true}
                >
                  <ClipRenameModalFull
                    value={renameValue}
                    onChange={setRenameValue}
                    onCancel={() => setShowRenameModalFull(false)}
                    onSave={() => {
                      console.log('Renamed to:', renameValue);
                      setShowRenameModalFull(false);
                    }}
                  />
                </ClipModalOverlay>
              </div>
              
              {/* Control buttons for full-width modals */}
              <div className="component-grid" style={{ gap: '1rem' }}>
                <button 
                  onClick={() => setShowDeleteModalFull(true)}
                  style={{
                    padding: '10px 20px',
                    background: 'var(--ClipGrey)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Show Delete Modal (Full)
                </button>
                <button 
                  onClick={() => setShowRenameModalFull(true)}
                  style={{
                    padding: '10px 20px',
                    background: 'var(--ClipGrey)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Show Rename Modal (Full)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClipComponents;
