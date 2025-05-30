import React from 'react';
import { 
  ClearButton, 
  ProcessingButton, 
  DropdownButton, 
  CancelButton,
  RecordButton,
  RecordingButton,
  RecordToggleButton,
  RetryButton,
  DisabledRecordButton,
  LowConfidenceBadge,
  MediumConfidenceBadge,
  HighConfidenceBadge,
  LowConfidenceTooltip,
  MediumConfidenceTooltip
} from '@/projects/ai-confidence-tracker/components/ui/deepButtons';
import { 
  MorphingRightButton,
  MorphingLeftButton
} from '@/projects/ai-confidence-tracker/components/ui/deepMorphingButtons';
import { DeepReader } from '@/projects/ai-confidence-tracker/components/ui/deepReader';
import { StyledText, HighlightedText } from '@/projects/ai-confidence-tracker/components/ui/deepUIcomponents';
import { DeepTextAnimation, DeepTextAnimationHorizontal } from '@/projects/ai-confidence-tracker/components/ui/deepTextAnimation';
import DeepSentence from '@/projects/ai-confidence-tracker/components/ui/DeepSentence';
import { DeepCard } from '@/projects/ai-confidence-tracker/components/ui/deepCard';

const DeepLibrary: React.FC = () => {
  return (
    <>
      <style jsx>{`
        /* Layout & Container Styles */
        .showcase-container {
          padding: 1rem;
          min-height: 100vh;
          background-color: #FFFFFF;
        }
        
        .section {
          margin-bottom: 3rem;
        }
        
        .component-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .component-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-right: 2rem;
        }
        
        /* Typography Styles */
        .page-title {
          font-size: 1.875rem;
          font-weight: 700;
          margin-bottom: 2rem;
          color: #4B5563;
        }
        
        .section-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: #4B5563;
        }
        
        .component-title {
          font-size: 1.125rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
          color: #6B7280;
        }
        
        .description-text {
          font-size: 0.875rem;
          color: #6B7280;
          margin-top: 0.5rem;
          max-width: 250px;
          text-align: center;
        }
        
        .reader-container {
          margin: 2rem 0;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .card-container {
          margin: 2rem 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 800px;
        }
      `}</style>
      
      <div className="showcase-container">
        <h1 className="page-title">AI Confidence Tracker UI Components</h1>
        
        <section className="section">
          <h2 className="section-title">Sentence Animation</h2>
          <div className="component-grid">
            <div className="component-item" style={{ width: '100%', maxWidth: '800px' }}>
              <h3 className="component-title">Left-to-Right Reveal Animation</h3>
              <DeepSentence />
              <p className="description-text">
                Professional-quality reveal animation with blur-to-clear transition
              </p>
            </div>
          </div>
        </section>
        
        <section className="section">
          <h2 className="section-title">Deep Buttons</h2>
          <div className="component-grid">
            <div className="component-item">
              <h3 className="component-title">Clear Button</h3>
              <ClearButton onClick={() => console.log('Clear button clicked')} />
              <p className="description-text">
                Button with trash icon for clearing content or deleting items
              </p>
            </div>
            
            <div className="component-item">
              <h3 className="component-title">Processing Button</h3>
              <ProcessingButton onClick={() => console.log('Processing button clicked')} />
              <p className="description-text">
                Button with processing icon for indicating loading or processing states
              </p>
            </div>
            
            <div className="component-item">
              <h3 className="component-title">Dropdown Button</h3>
              <DropdownButton onClick={() => console.log('Dropdown button clicked')} />
              <p className="description-text">
                Button with arrow icon for dropdown menus or expandable sections
              </p>
            </div>
            
            <div className="component-item">
              <h3 className="component-title">Cancel Button</h3>
              <CancelButton onClick={() => console.log('Cancel button clicked')} />
              <p className="description-text">
                Button with X icon for canceling actions or closing dialogs
              </p>
            </div>
            
            <div className="component-item">
              <h3 className="component-title">Record Button</h3>
              <RecordButton onClick={() => console.log('Record button clicked')} />
              <p className="description-text">
                Button with microphone icon for initiating voice recording
              </p>
            </div>
            
            <div className="component-item">
              <h3 className="component-title">Disabled Record Button</h3>
              <DisabledRecordButton />
              <p className="description-text">
                Disabled record button for browser compatibility issues (50% opacity)
              </p>
            </div>
            
            <div className="component-item">
              <h3 className="component-title">Recording Button</h3>
              <RecordingButton onClick={() => console.log('Recording button clicked')} />
              <p className="description-text">
                Button with animated audio bars indicating active recording
              </p>
            </div>

            <div className="component-item">
              <h3 className="component-title">Retry Button</h3>
              <RetryButton onClick={() => console.log('Retry button clicked')} />
              <p className="description-text">
                Button with retry icon and text for error recovery actions
              </p>
            </div>
          </div>
        </section>
        
        <section className="section">
          <h2 className="section-title">Interactive Buttons</h2>
          <div className="component-grid">
            <div className="component-item">
              <h3 className="component-title">Record Toggle Button</h3>
              <RecordToggleButton onClick={() => console.log('Toggle button clicked')} />
              <p className="description-text">
                Click to toggle between record and recording states with smooth transition
              </p>
            </div>
          </div>
        </section>
        
        <section className="section">
          <h2 className="section-title">Morphing Buttons - Advanced State Management</h2>
          
          <div className="component-grid">
            <div className="component-item">
              <h3 className="component-title">Right Morphing Button - Record State</h3>
              <MorphingRightButton 
                state="record" 
                onRecordClick={() => console.log('Record clicked')} 
              />
              <p className="description-text">
                Initial state with microphone icon
              </p>
            </div>
            
            <div className="component-item">
              <h3 className="component-title">Right Morphing Button - Recording State</h3>
              <MorphingRightButton 
                state="recording" 
                onRecordingClick={() => console.log('Recording clicked')} 
              />
              <p className="description-text">
                Recording state with animated bars and wider pill shape
              </p>
            </div>
            
            <div className="component-item">
              <h3 className="component-title">Right Morphing Button - Processing State</h3>
              <MorphingRightButton 
                state="processing" 
                onProcessingClick={() => console.log('Processing clicked')} 
              />
              <p className="description-text">
                Processing state with spinning loader icon
              </p>
            </div>
            
            <div className="component-item">
              <h3 className="component-title">Right Morphing Button - Clear State</h3>
              <MorphingRightButton 
                state="clear" 
                onClearClick={() => console.log('Clear clicked')} 
              />
              <p className="description-text">
                Clear state with trash icon for resetting
              </p>
            </div>
          </div>
          
          <div className="component-grid" style={{ marginTop: '2rem' }}>
            <div className="component-item">
              <h3 className="component-title">Left Morphing Button - Hidden State</h3>
              <MorphingLeftButton 
                state="hidden" 
              />
              <p className="description-text">
                Hidden state - no visible button (width: 0px)
              </p>
            </div>
            
            <div className="component-item">
              <h3 className="component-title">Left Morphing Button - Cancel State</h3>
              <MorphingLeftButton 
                state="cancel" 
                onCancelClick={() => console.log('Cancel clicked')} 
              />
              <p className="description-text">
                Cancel state with X icon for canceling actions
              </p>
            </div>
            
            <div className="component-item">
              <h3 className="component-title">Left Morphing Button - Dropdown State</h3>
              <MorphingLeftButton 
                state="dropdown" 
                onDropdownClick={() => console.log('Dropdown clicked')} 
              />
              <p className="description-text">
                Dropdown state with arrow icon for menu access
              </p>
            </div>
          </div>
          
          <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#F3F4F6', borderRadius: '8px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
              Technical Features:
            </h4>
            <ul style={{ fontSize: '0.875rem', color: '#6B7280', margin: 0, paddingLeft: '1.5rem' }}>
              <li>Smooth width transitions with cubic-bezier easing</li>
              <li>Right-aligned expansion (right button) and left-aligned expansion (left button)</li>
              <li>Layered content with opacity crossfades</li>
              <li>Fixed container dimensions prevent layout shifts</li>
              <li>GPU-accelerated transforms for smooth performance</li>
              <li>Accessibility support with prefers-reduced-motion</li>
            </ul>
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">Error States & Retry Functionality</h2>
          
          <div className="component-grid">
            <div className="component-item">
              <h3 className="component-title">Retry State - Microphone Permission Error</h3>
              <MorphingRightButton 
                state="retry" 
                onRetryClick={() => console.log('Retry clicked - Microphone Permission')} 
              />
              <p className="description-text">
                Retry state triggered when microphone permission is denied
              </p>
            </div>
            
            <div className="component-item">
              <h3 className="component-title">Retry State - Network Error</h3>
              <MorphingRightButton 
                state="retry" 
                onRetryClick={() => console.log('Retry clicked - Network Error')} 
              />
              <p className="description-text">
                Retry state triggered when network/upload fails during processing
              </p>
            </div>
            
            <div className="component-item">
              <h3 className="component-title">Retry State - Empty Recording</h3>
              <MorphingRightButton 
                state="retry" 
                onRetryClick={() => console.log('Retry clicked - Empty Recording')} 
              />
              <p className="description-text">
                Retry state triggered when no audio is recorded
              </p>
            </div>
          </div>
          
          <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#FEF2F2', borderRadius: '8px', border: '1px solid #FECACA' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#DC2626' }}>
              Error State Transitions:
            </h4>
            <ul style={{ fontSize: '0.875rem', color: '#7F1D1D', margin: 0, paddingLeft: '1.5rem' }}>
              <li><strong>Record → Retry:</strong> Microphone permission denied</li>
              <li><strong>Recording → Retry:</strong> Hardware failure, empty recording</li>
              <li><strong>Processing → Retry:</strong> Network error, upload failure, API error</li>
              <li><strong>Retry → Record:</strong> User clicks retry to start over</li>
            </ul>
          </div>
        </section>
        
        <section className="section">
          <h2 className="section-title">Reading Interface</h2>
          <div className="reader-container">
            <DeepReader initialText="The quick brown fox jumped over the lazy dog" />
            <p className="description-text">
              Interactive reading interface with sentence carousel and reload functionality
            </p>
          </div>
        </section>
        
        <section className="section">
          <h2 className="section-title">Interactive Transcript Card - State Management</h2>
          <div className="component-grid" style={{ flexDirection: 'column', alignItems: 'center', gap: '3rem' }}>
            <div className="card-container">
              <h3 className="component-title">State 1: Initial State</h3>
              <DeepCard 
                initialNavState="initial"
                initialTextState="initial"
                transcriptText=""
                highlights={[]}
              />
              <p className="description-text">
                Initial state with record button and placeholder text
              </p>
            </div>
            
            <div className="card-container">
              <h3 className="component-title">State 2: Recording State</h3>
              <DeepCard 
                initialNavState="recording"
                initialTextState="recording"
                transcriptText=""
                highlights={[]}
              />
              <p className="description-text">
                Recording state with cancel button, recording button, and animated dots
              </p>
            </div>
            
            <div className="card-container">
              <h3 className="component-title">State 3: Processing State</h3>
              <DeepCard 
                initialNavState="processing"
                initialTextState="processing"
                transcriptText=""
                highlights={[]}
              />
              <p className="description-text">
                Processing state with cancel button, processing button, and animated dots
              </p>
            </div>
            
            <div className="card-container">
              <h3 className="component-title">State 4: Results State</h3>
              <DeepCard 
                initialNavState="results"
                initialTextState="results"
              />
              <p className="description-text">
                Results state with dropdown button, clear button, and interactive confidence highlights
              </p>
            </div>

            <div className="card-container">
              <h3 className="component-title">Error State 1: Microphone Permission Denied</h3>
              <DeepCard 
                initialNavState="error"
                initialTextState="error"
                errorType="microphone_permission"
                transcriptText=""
                highlights={[]}
              />
              <p className="description-text">
                Error state when microphone access is denied by user
              </p>
            </div>

            <div className="card-container">
              <h3 className="component-title">Error State 2: Network Error</h3>
              <DeepCard 
                initialNavState="error"
                initialTextState="error"
                errorType="network_error"
                transcriptText=""
                highlights={[]}
              />
              <p className="description-text">
                Error state when network connection fails during processing
              </p>
            </div>

            <div className="card-container">
              <h3 className="component-title">Error State 3: Empty Recording</h3>
              <DeepCard 
                initialNavState="error"
                initialTextState="error"
                errorType="empty_recording"
                transcriptText=""
                highlights={[]}
              />
              <p className="description-text">
                Error state when no audio is detected in the recording
              </p>
            </div>

            <div className="card-container">
              <h3 className="component-title">Error State 4: File Too Large</h3>
              <DeepCard 
                initialNavState="error"
                initialTextState="error"
                errorType="file_too_large"
                transcriptText=""
                highlights={[]}
              />
              <p className="description-text">
                Error state when the recorded file exceeds size limits
              </p>
            </div>

            <div className="card-container">
              <h3 className="component-title">Error State 5: Browser Compatibility</h3>
              <DeepCard 
                initialNavState="error"
                initialTextState="error"
                errorType="browser_compatibility"
                transcriptText=""
                highlights={[]}
              />
              <p className="description-text">
                Error state when browser doesn&apos;t support audio recording
              </p>
            </div>

            <div className="card-container">
              <h3 className="component-title">Error State 6: Recording Hardware Failure</h3>
              <DeepCard 
                initialNavState="error"
                initialTextState="error"
                errorType="recording_hardware_failure"
                transcriptText=""
                highlights={[]}
              />
              <p className="description-text">
                Error state when recording hardware fails or malfunctions
              </p>
            </div>
          </div>
        </section>
        
        <section className="section">
          <h2 className="section-title">Interactive Transcript Card</h2>
          <div className="component-grid">
            <div className="component-item" style={{ width: '100%', maxWidth: '800px' }}>
              <h3 className="component-title">Transcript Interface Card</h3>
              <DeepCard />
              <p className="description-text">
                Complete transcript interface with confidence highlights and interactive hover effects
              </p>
            </div>
          </div>
        </section>
        
        <section className="section">
          <h2 className="section-title">Coming Soon</h2>
          <p>Additional components will be showcased here as they are implemented.</p>
        </section>
        
        <section className="section">
          <h2 className="section-title">Confidence Indicators</h2>
          <div className="component-grid">
            <div className="component-item">
              <h3 className="component-title">Low Confidence</h3>
              <LowConfidenceBadge text="low" />
              <p className="description-text">
                Visual indicator for low confidence AI assessments
              </p>
            </div>
            
            <div className="component-item">
              <h3 className="component-title">Medium Confidence</h3>
              <MediumConfidenceBadge text="medium" />
              <p className="description-text">
                Visual indicator for medium confidence AI assessments
              </p>
            </div>
            
            <div className="component-item">
              <h3 className="component-title">High Confidence</h3>
              <HighConfidenceBadge />
              <p className="description-text">
                Visual indicator showing all words are 100% confident
              </p>
            </div>
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">Confidence Tooltips</h2>
          <div className="component-grid">
            <div className="component-item">
              <h3 className="component-title">Low Confidence Tooltip</h3>
              <LowConfidenceTooltip />
              <p className="description-text">
                Tooltip showing low confidence percentage (55%)
              </p>
            </div>
            
            <div className="component-item">
              <h3 className="component-title">Medium Confidence Tooltip</h3>
              <MediumConfidenceTooltip />
              <p className="description-text">
                Tooltip showing medium confidence percentage (75%)
              </p>
            </div>

            <div className="component-item">
              <h3 className="component-title">Custom Percentage Tooltip</h3>
              <LowConfidenceTooltip percentage="42%" />
              <p className="description-text">
                Tooltip with custom percentage value
              </p>
            </div>
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">Text Components</h2>
          <div className="component-grid">
            <div className="component-item">
              <h3 className="component-title">Styled Text</h3>
              <StyledText text="The quick brown fox jumps over the lazy dog" />
              <p className="description-text">
                Standard text styling with consistent font properties
              </p>
            </div>
            
            <div className="component-item">
              <h3 className="component-title">Highlighted Text</h3>
              <HighlightedText 
                text="The quick brown fox jumps over the lazy dog" 
                highlightWords={["lazy", "dog"]} 
              />
              <p className="description-text">
                Text with underline highlights for specific words
              </p>
            </div>
            
            <div className="component-item">
              <h3 className="component-title">Single Word Highlight</h3>
              <HighlightedText 
                text="The quick brown fox jumps over the lazy fox" 
                highlightWords={["fox"]} 
              />
              <p className="description-text">
                Text with a single highlighted word
              </p>
            </div>
            
            <div className="component-item">
              <h3 className="component-title">Multiple Color Highlights</h3>
              <HighlightedText 
                text="The quick brown fox jumps over the lazy dog" 
                highlights={[
                  { wordId: 1, confidenceLevel: "medium" },
                  { wordId: 6, confidenceLevel: "low" }
                ]}
              />
              <p className="description-text">
                Text with different colored highlights
              </p>
            </div>
          </div>
        </section>
        
        <section className="section">
          <h2 className="section-title">Text Animation</h2>
          <div className="component-grid">
            <div className="component-item">
              <h3 className="component-title">Standard Text Animation</h3>
              <DeepTextAnimation />
              <p className="description-text">
                Animated text with fade-in and upward movement
              </p>
            </div>
          </div>
        </section>
        
        <section className="section">
          <h2 className="section-title">Horizontal Text Animation</h2>
          <div className="component-grid">
            <div className="component-item">
              <h3 className="component-title">Wrapped Text Animation</h3>
              <DeepTextAnimationHorizontal />
              <p className="description-text">
                Multi-line text with horizontal fade-in animation (no vertical movement)
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default DeepLibrary; 