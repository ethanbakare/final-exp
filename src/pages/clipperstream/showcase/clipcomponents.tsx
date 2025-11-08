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
  CheckTickButton
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
import { SubCopyIcon, SubDeleteRow, SubRenameIcon } from '@/projects/clipperstream/components/ui/subclipbuttons';
import { RecordNavBar, RecordNavBarAlt } from '@/projects/clipperstream/components/ui/recordnavbar';
import { RecordMorphingToggle } from '@/projects/clipperstream/components/ui/recordMorphing';
import { ClipDeleteModal, ClipRenameModal } from '@/projects/clipperstream/components/ui/clipModal';
import { EntryBox } from '@/projects/clipperstream/components/ui/entrybox';

// Import for morphing buttons
import { MorphingDoneToProcessingButton, MorphingCopyToCheckButton, MorphingCloseToCopyButton, MorphingProcessingToStructureButton, MorphingTimerProcessingToStructure } from '@/projects/clipperstream/components/ui/clipmorphingbuttons';

// Import for new modular morphing system
import { RecordNavBarMorphingDemo } from '@/projects/clipperstream/components/ui/mainmorph';

const ClipComponents: React.FC = () => {
  // State for interactive morphing button demo
  const [morphingButtonState, setMorphingButtonState] = useState<'done' | 'processing'>('done');
  const [closeCopyState, setCloseCopyState] = useState<'close' | 'copy'>('close');
  const [processingStructureState, setProcessingStructureState] = useState<'processing' | 'structure'>('processing');
  const [timerProcessingState, setTimerProcessingState] = useState<'processing' | 'structure'>('processing');
  
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
      </div>
    </>
  );
};

export default ClipComponents;
