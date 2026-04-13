import React, { useState, useEffect } from 'react';
import styles from '@/projects/trace/styles/trace.module.css';
import {
  UploadButton,
  SpeakButton,
  CloseButton,
  ClearButton,
  SendAudioButton,
  ProcessingAudioButton,
  ProcessingImageButton,
  OldSpinnerReference
} from '@/projects/trace/components/ui/tracebuttons';
import { TRNavbar } from '@/projects/trace/components/ui/tracenavbar';
import { TraceClearExpensesModal } from '@/projects/trace/components/ui/TraceModal';
import {
  Date as TraceDate,
  TotalFrame,
  MerchantFrame,
  MerchantTotalFrame,
  NetPriceFrame,
  Quantity,
  ItemName,
  DiscountFrame,
  TotalAmtSpent,
  MasterTotalPrice,
  DayTotal,
  RowIdentifier,
  QuantityItemName,
  PriceFrame,
  ContentRow,
  MerchantBlock,
  MasterBlockHolder,
  DayBlock,
  FinanceBox,
  TextBox
} from '@/projects/trace/components/ui/tracefinance';
import { AnimatedMasterTotalPrice } from '@/projects/trace/components/ui/tracefinance-animated';
import { EmptyTraceIcon, EmptyTraceIconAnimated } from '@/projects/trace/components/ui/traceIcons';
import { TraceToast } from '@/projects/trace/components/ui/TraceToast';

// Trace UI Component Showcase
// Displays individual UI components in isolation
// Following voicecomponent.tsx pattern with dark theme

// ButtonGrid - Only for showcase display
interface ButtonGridProps {
  children: React.ReactNode;
  label: string;
  showToggle?: boolean;
  toggleState?: boolean;
  onToggle?: () => void;
  isDouble?: boolean; // For 400×200 processing buttons
}

const ButtonGrid: React.FC<ButtonGridProps> = ({
  children,
  label,
  showToggle = false,
  toggleState = false,
  onToggle,
  isDouble = false
}) => {
  return (
    <>
      <div className={`button-grid ${isDouble ? 'box-double' : 'box-single'}`}>
        {/* Toggle switch at top-right corner */}
        {showToggle && (
          <div className="toggle-container" onClick={onToggle}>
            <div className={`toggle-switch ${toggleState ? 'active' : ''}`}>
              <div className="toggle-slider"></div>
            </div>
          </div>
        )}

        {/* Main centered button area */}
        <div className="button-center">
          {children}
        </div>

        {/* Label at bottom inside grid */}
        <div className="button-label">
          {label}
        </div>
      </div>

      <style jsx>{`
        .button-grid {
          /* Layout */
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;

          /* Style - Lighter borders for dark background */
          border: 0.8px solid var(--trace-showcase-border);
          border-radius: 0px;
          background: transparent;

          /* Inside auto layout */
          flex: none;
        }

        .box-single {
          width: 200px;
          height: 200px;
        }

        .box-double {
          width: 400px;
          height: 200px;
          max-width: calc(100vw - 2rem);
        }

        .button-center {
          /* Centered content */
          display: flex;
          justify-content: center;
          align-items: center;
          flex: 1;
        }

        .button-label {
          /* Bottom label text */
          position: absolute;
          bottom: 8px;
          left: 50%;
          transform: translateX(-50%);

          font-family: var(--trace-font-family);
          font-size: 0.375rem;
          font-weight: 400;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          color: var(--trace-text-tertiary);

          white-space: nowrap;
        }

        /* Mobile: Slightly larger labels for readability */
        @media (max-width: 768px) {
          .button-label {
            font-size: 0.4rem;
            bottom: 6px;
          }
        }

        .toggle-container {
          position: absolute;
          top: 8px;
          right: 8px;
          opacity: 0.3;
          cursor: pointer;
          transition: opacity 0.2s ease;
          z-index: 10;
        }

        .toggle-container:hover {
          opacity: 0.6;
        }

        .toggle-switch {
          width: 28px;
          height: 16px;
          background: var(--trace-showcase-toggle-bg);
          border-radius: 8px;
          position: relative;
          transition: background 0.2s ease;
        }

        .toggle-switch.active {
          background: var(--trace-showcase-toggle-active);
        }

        .toggle-slider {
          width: 12px;
          height: 12px;
          background: var(--trace-text-primary);
          border-radius: 50%;
          position: absolute;
          top: 2px;
          left: 2px;
          transition: left 0.2s ease;
          box-shadow: 0 1px 2px var(--trace-showcase-shadow);
        }

        .toggle-switch.active .toggle-slider {
          left: 14px;
        }
      `}</style>
    </>
  );
};

const TraceComponent: React.FC = () => {
  // SendAudio animation control
  const [isSendAudioRecording, setIsSendAudioRecording] = useState(false);

  // Processing button animation control
  const [isProcessingAudio, setIsProcessingAudio] = useState(true);
  const [isProcessingImage, setIsProcessingImage] = useState(true);

  // AnimatedMasterTotalPrice toggle — flips between "0.00" and "120.25"
  const [masterTotalToggle, setMasterTotalToggle] = useState(false);

  // Navbar state control (for demonstration)
  const [navbarState, setNavbarState] = useState<'idle' | 'recording' | 'processing_audio' | 'processing_image'>('idle');

  // Auto-timeout for processing states (3 seconds)
  useEffect(() => {
    if (navbarState === 'processing_audio' || navbarState === 'processing_image') {
      const timeout = setTimeout(() => {
        setNavbarState('idle');
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [navbarState]);

  // TRNavbar button handlers
  const handleUploadClick = () => {
    setNavbarState('processing_image');
  };

  const handleSpeakClick = () => {
    setNavbarState('recording');
  };

  const handleCloseClick = () => {
    setNavbarState('idle');
  };

  const handleSendAudioClick = () => {
    setNavbarState('processing_audio');
  };

  return (
    <>
      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          background-color: var(--trace-bg-showcase);
        }

        .showcase-container {
          padding: 2rem;
          min-height: 100vh;
          background-color: var(--trace-bg-showcase);
        }

        /* Mobile optimization */
        @media (max-width: 768px) {
          .showcase-container {
            padding: 1rem;
          }
        }

        .section {
          margin-bottom: 3rem;
        }

        .section-title {
          color: var(--trace-text-primary);
          font-family: var(--trace-font-family);
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        /* Mobile: Smaller section titles */
        @media (max-width: 768px) {
          .section-title {
            font-size: 1.25rem;
          }
        }

        .section-source {
          font-family: var(--trace-font-family);
          font-size: 12px;
          color: rgba(255, 255, 255, 0.3);
          margin: 0 0 24px;
        }

        .toast-showcase {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .toast-showcase-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .toast-fill-demo {
          width: 300px;
        }

        .seamless-grid {
          display: inline-flex;
          flex-wrap: wrap;
          max-width: 1200px;
          margin-left: -0.8px;
          margin-top: -0.8px;
        }

        /* Mobile: Center grid and allow horizontal scroll if needed */
        @media (max-width: 768px) {
          .seamless-grid {
            display: flex;
            justify-content: center;
            max-width: 100%;
          }
        }

        .file-label {
          color: var(--trace-text-tertiary);
          font-family: var(--trace-font-family);
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 2rem;
        }

        /* Navbar State Showcase Container */
        .navbar-showcase {
          position: relative;
          width: 400px;
          max-width: calc(100vw - 2rem);
          height: 200px;
          border: 0.8px solid var(--trace-showcase-border);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .navbar-state-controls {
          position: absolute;
          top: 8px;
          right: 8px;
          display: flex;
          gap: 0px;
          align-items: center;
          z-index: 10;
        }

        /* State Toggle Buttons */
        .state-toggle-btn {
          padding: 2px 8px;
          font-size: 10px;
          border: 1px solid var(--trace-showcase-button-border);
          cursor: pointer;
          margin-left: -1px;
          position: relative;
          color: var(--trace-text-tertiary);
          transition: background 0.2s, z-index 0s, color 0.15s ease;
          background: var(--trace-showcase-button-bg);
        }

        .state-toggle-btn.active {
          color: var(--trace-text-primary);
          background: var(--trace-showcase-button-active);
        }

        .state-toggle-btn.first {
          border-radius: 6px 0 0 6px;
          margin-left: 0;
        }

        .state-toggle-btn.last {
          border-radius: 0 6px 6px 0;
        }

        .state-toggle-btn:hover {
          z-index: 10;
          color: var(--trace-text-primary);
        }

        /* Mobile: Larger touch targets for state toggle buttons */
        @media (max-width: 768px) {
          .state-toggle-btn {
            padding: 4px 10px;
            font-size: 9px;
          }
        }

        .navbar-label {
          position: absolute;
          bottom: 8px;
          left: 50%;
          transform: translateX(-50%);
          font-family: var(--trace-font-family);
          font-size: 0.375rem;
          font-weight: 400;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          color: var(--trace-text-tertiary);
          white-space: nowrap;
        }

        /* Mobile: Slightly larger navbar labels */
        @media (max-width: 768px) {
          .navbar-label {
            font-size: 0.4rem;
            bottom: 6px;
          }
        }

        /* Finance Component Box Variants */
        .button-grid.box-quad {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          border: 0.8px solid var(--trace-showcase-border);
          border-radius: 0px;
          background: transparent;
          flex: none;
          width: 400px;
          max-width: calc(100vw - 2rem);
          height: 400px;
        }

        .button-grid.box-tall {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          border: 0.8px solid var(--trace-showcase-border);
          border-radius: 0px;
          background: transparent;
          flex: none;
          width: 200px;
          height: 400px;
        }

        .button-grid.box-wide-tall {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          border: 0.8px solid var(--trace-showcase-border);
          border-radius: 0px;
          background: transparent;
          flex: none;
          width: 400px;
          max-width: calc(100vw - 2rem);
          height: 600px;
        }

        .button-grid .button-center {
          display: flex;
          justify-content: center;
          align-items: center;
          flex: 1;
        }

        .button-grid .button-label {
          position: absolute;
          bottom: 8px;
          left: 50%;
          transform: translateX(-50%);
          font-family: var(--trace-font-family);
          font-size: 0.375rem;
          font-weight: 400;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          color: var(--trace-text-tertiary);
          white-space: nowrap;
        }
      `}</style>

      <div className={`showcase-container ${styles.container}`}>
        {/* Atomic Buttons Section */}
        <div className="section">
          <h2 className="section-title">Trace UI Components</h2>
          <div className="file-label">📁 tracebuttons.tsx</div>

          {/* Seamless grid layout - borders touch */}
          <div className="seamless-grid">
            <ButtonGrid label="UPLOAD BUTTON - 97×44PX">
              <UploadButton onClick={() => console.log('Upload clicked')} />
            </ButtonGrid>

            <ButtonGrid label="SPEAK BUTTON - 106×44PX">
              <SpeakButton onClick={() => console.log('Speak clicked')} />
            </ButtonGrid>

            <ButtonGrid label="CLOSE BUTTON - 56×44PX">
              <CloseButton onClick={() => console.log('Close clicked')} />
            </ButtonGrid>

            <ButtonGrid label="CLEAR BUTTON - 56×44PX">
              <ClearButton onClick={() => console.log('Clear clicked')} />
            </ButtonGrid>

            <ButtonGrid label="EMPTY TRACE ICON - 48×48PX">
              <EmptyTraceIcon />
            </ButtonGrid>

            <ButtonGrid label="EMPTY TRACE ICON ANIMATED - 48×48PX">
              <EmptyTraceIconAnimated />
            </ButtonGrid>

            <ButtonGrid
              label="SEND AUDIO BUTTON - 150×44PX (ANIMATED)"
              showToggle={true}
              toggleState={isSendAudioRecording}
              onToggle={() => setIsSendAudioRecording(!isSendAudioRecording)}
            >
              <SendAudioButton
                onClick={() => console.log('Send Audio clicked')}
                isRecording={isSendAudioRecording}
              />
            </ButtonGrid>

            <ButtonGrid
              label="PROCESSING AUDIO BUTTON - 301×44PX (SPINNING)"
              showToggle={true}
              toggleState={isProcessingAudio}
              onToggle={() => setIsProcessingAudio(!isProcessingAudio)}
              isDouble={true}
            >
              <ProcessingAudioButton text="Analysing Audio" />
            </ButtonGrid>

            <ButtonGrid
              label="PROCESSING IMAGE BUTTON - 301×44PX (SPINNING)"
              showToggle={true}
              toggleState={isProcessingImage}
              onToggle={() => setIsProcessingImage(!isProcessingImage)}
              isDouble={true}
            >
              <ProcessingImageButton text="Processing Image" />
            </ButtonGrid>

            <ButtonGrid
              label="[REFERENCE] WOBBLY SVG SPINNER - PRE-FIX (SAFARI BUG)"
              isDouble={true}
            >
              <OldSpinnerReference />
            </ButtonGrid>
          </div>

          {/* Modal Component */}
          <div className="seamless-grid" style={{ marginTop: '2rem' }}>
            <div className="button-grid box-quad">
              <div className="button-center">
                <TraceClearExpensesModal
                  onCancel={() => console.log('Cancel clicked')}
                  onDelete={() => console.log('Delete clicked')}
                />
              </div>
              <div className="button-label">CLEAR EXPENSES MODAL - 247×141PX</div>
            </div>
          </div>
        </div>

        {/* Trace Toast Section */}
        <div className="section">
          <h2 className="section-title">Trace Toasts</h2>
          <p className="section-source">TraceToast.tsx</p>

          <div className="seamless-grid">
            <ButtonGrid label="NOT A RECEIPT" isDouble>
              <TraceToast text="That doesn't look like a receipt" />
            </ButtonGrid>

            <ButtonGrid label="SILENCE / NO SPEECH" isDouble>
              <TraceToast text="Didn't hear anything, try again" />
            </ButtonGrid>

            <ButtonGrid label="TOO SHORT / NO AUDIO" isDouble>
              <TraceToast text="No audio recorded" />
            </ButtonGrid>

            <ButtonGrid label="FULL WIDTH (FILLS PARENT)" isDouble>
              <div style={{ width: '100%' }}>
                <TraceToast text="That doesn't look like a receipt" fullWidth />
              </div>
            </ButtonGrid>
          </div>
        </div>

        {/* TRNavbar States Section */}
        <div className="section">
          <h2 className="section-title">TRNavbar States</h2>
          <div className="file-label">📁 tracenavbar.tsx</div>

          <div className="seamless-grid">
            {/* TRNavbar with state controls */}
            <div className="navbar-showcase">
              <div className="navbar-state-controls">
                <button
                  className={`state-toggle-btn first ${navbarState === 'idle' ? 'active' : ''}`}
                  onClick={() => setNavbarState('idle')}
                >IDLE</button>
                <button
                  className={`state-toggle-btn ${navbarState === 'recording' ? 'active' : ''}`}
                  onClick={() => setNavbarState('recording')}
                >REC</button>
                <button
                  className={`state-toggle-btn ${navbarState === 'processing_audio' ? 'active' : ''}`}
                  onClick={() => setNavbarState('processing_audio')}
                >P-AUD</button>
                <button
                  className={`state-toggle-btn last ${navbarState === 'processing_image' ? 'active' : ''}`}
                  onClick={() => setNavbarState('processing_image')}
                >P-IMG</button>
              </div>

              <TRNavbar
                state={navbarState}
                onUploadClick={handleUploadClick}
                onSpeakClick={handleSpeakClick}
                onCloseClick={handleCloseClick}
                onSendAudioClick={handleSendAudioClick}
              />

              <div className="navbar-label">
                TRNAVBAR - 4 STATES (IDLE → RECORDING → PROCESSING)
              </div>
            </div>
          </div>
        </div>

        {/* Finance Components Section */}
        <div className="section">
          <h2 className="section-title">Finance Display Components</h2>
          <div className="file-label">📁 tracefinance.tsx</div>

          {/* Atoms */}
          <div className="seamless-grid">
            <ButtonGrid label="DATE - 12PX">
              <TraceDate date="14th Jul" />
            </ButtonGrid>

            <ButtonGrid label="TOTAL FRAME - £ BEFORE (GBP)" isDouble={true}>
              <TotalFrame total="928.20" />
            </ButtonGrid>

            <ButtonGrid label="TOTAL FRAME - € AFTER (EUR)" isDouble={true}>
              <TotalFrame total="928.20" currency="EUR" />
            </ButtonGrid>

            <ButtonGrid label="TOTAL FRAME - ₦ BEFORE (NGN)" isDouble={true}>
              <TotalFrame total="6,080.00" currency="NGN" />
            </ButtonGrid>

            <ButtonGrid label="MERCHANT FRAME - 12PX">
              <MerchantFrame merchantName="TESCOS" />
            </ButtonGrid>

            <ButtonGrid label="MERCHANT TOTAL - £ BEFORE (GBP)">
              <MerchantTotalFrame total="628.21" />
            </ButtonGrid>

            <ButtonGrid label="MERCHANT TOTAL - € AFTER (EUR)">
              <MerchantTotalFrame total="628.21" currency="EUR" />
            </ButtonGrid>

            <ButtonGrid label="NET PRICE - £ BEFORE (GBP)">
              <NetPriceFrame price="104.99" />
            </ButtonGrid>

            <ButtonGrid label="NET PRICE - € AFTER (EUR)">
              <NetPriceFrame price="104.99" currency="EUR" />
            </ButtonGrid>

            <ButtonGrid label="QUANTITY - 12PX">
              <Quantity quantity="2x" />
            </ButtonGrid>

            <ButtonGrid label="ITEM NAME - 14PX">
              <ItemName itemName="Headphones" />
            </ButtonGrid>

            <ButtonGrid label="DISCOUNT - £ BEFORE (GBP)">
              <DiscountFrame discount="3.99" />
            </ButtonGrid>

            <ButtonGrid label="DISCOUNT - € AFTER (EUR)">
              <DiscountFrame discount="3.99" currency="EUR" />
            </ButtonGrid>

            <ButtonGrid label="TOTAL AMT SPENT - RED PILL + LABEL">
              <TotalAmtSpent />
            </ButtonGrid>

            <ButtonGrid label="MASTER TOTAL - £ BEFORE (GBP)" isDouble={true}>
              <MasterTotalPrice total="1,556.41" />
            </ButtonGrid>

            <ButtonGrid label="MASTER TOTAL - € AFTER (EUR)" isDouble={true}>
              <MasterTotalPrice total="1,556.41" currency="EUR" />
            </ButtonGrid>

            <ButtonGrid label="MASTER TOTAL - ₦ BEFORE (NGN)" isDouble={true}>
              <MasterTotalPrice total="6,080.00" currency="NGN" />
            </ButtonGrid>

            <ButtonGrid
              label="MASTER TOTAL PRICE - ANIMATED COUNT-UP (TOGGLE)"
              isDouble={true}
              showToggle={true}
              toggleState={masterTotalToggle}
              onToggle={() => setMasterTotalToggle(!masterTotalToggle)}
            >
              {/* Fixed-width right-aligned wrapper pins the right edge so the
                  count-up only grows leftward, never rightward. The reserved
                  width gives the £ + digits room to expand into. */}
              <div
                style={{
                  width: '220px',
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <AnimatedMasterTotalPrice total={masterTotalToggle ? '120.25' : '0.00'} />
              </div>
            </ButtonGrid>
          </div>

          {/* Molecules */}
          <div className="seamless-grid" style={{ marginTop: '2rem' }}>
            <ButtonGrid label="DAY TOTAL - MOLECULE" isDouble={true}>
              <DayTotal date="14th Jul" total="928.20" />
            </ButtonGrid>

            <ButtonGrid label="ROW IDENTIFIER - MOLECULE" isDouble={true}>
              <RowIdentifier merchantName="TESCOS" merchantTotal="628.21" />
            </ButtonGrid>

            <ButtonGrid label="QUANTITY + ITEM NAME - MOLECULE">
              <QuantityItemName quantity="2x" itemName="Headphones" />
            </ButtonGrid>

            <ButtonGrid label="PRICE FRAME (WITH DISCOUNT) - MOLECULE">
              <PriceFrame netPrice="104.99" discount="3.99" />
            </ButtonGrid>

            <ButtonGrid label="PRICE FRAME (NO DISCOUNT) - MOLECULE">
              <PriceFrame netPrice="5000.99" />
            </ButtonGrid>

            <ButtonGrid label="MASTER BLOCK HOLDER - MOLECULE" isDouble={true}>
              <MasterBlockHolder total="1,556.41" />
            </ButtonGrid>
          </div>

          {/* Larger Molecules */}
          <div className="seamless-grid" style={{ marginTop: '2rem' }}>
            <div className="button-grid box-quad">
              <div className="button-center">
                <ContentRow
                  quantity="2x"
                  itemName="Headphones"
                  netPrice="104.99"
                  discount="3.99"
                />
              </div>
              <div className="button-label">CONTENT ROW (WITH DISCOUNT) - MOLECULE</div>
            </div>

            <div className="button-grid box-quad">
              <div className="button-center">
                <ContentRow
                  quantity="1x"
                  itemName="Playstation 5"
                  netPrice="5000.99"
                />
              </div>
              <div className="button-label">CONTENT ROW (NO DISCOUNT) - MOLECULE</div>
            </div>
          </div>

          {/* Merchant Block */}
          <div className="seamless-grid" style={{ marginTop: '2rem' }}>
            <div className="button-grid box-wide-tall">
              <div className="button-center">
                <MerchantBlock
                  merchantName="TESCOS"
                  merchantTotal="628.21"
                  items={[
                    { quantity: "2x", itemName: "Headphones", netPrice: "104.99", discount: "3.99" },
                    { quantity: "1x", itemName: "Playstation 5", netPrice: "5000.99" },
                    { quantity: "1x", itemName: "Chino Trousers", netPrice: "14.99" },
                    { quantity: "3x", itemName: "Organic Milk", netPrice: "2.50", discount: "0.50" },
                    { quantity: "5x", itemName: "Energy Drink", netPrice: "6.25" },
                    { quantity: "2x", itemName: "Kitchen Towels", netPrice: "3.98" }
                  ]}
                />
              </div>
              <div className="button-label">MERCHANT BLOCK - ORGANISM</div>
            </div>
          </div>

          {/* Day Block */}
          <div className="seamless-grid" style={{ marginTop: '2rem' }}>
            <div className="button-grid box-wide-tall">
              <div className="button-center">
                <DayBlock
                  date="14th Jul"
                  total="628.21"
                  merchants={[
                    {
                      merchantName: "TESCOS",
                      merchantTotal: "628.21",
                      items: [
                        { quantity: "2x", itemName: "Headphones", netPrice: "104.99", discount: "3.99" },
                        { quantity: "1x", itemName: "Playstation 5", netPrice: "5000.99" },
                        { quantity: "1x", itemName: "Chino Trousers", netPrice: "14.99" },
                        { quantity: "3x", itemName: "Organic Milk", netPrice: "2.50", discount: "0.50" },
                        { quantity: "5x", itemName: "Energy Drink", netPrice: "6.25" },
                        { quantity: "2x", itemName: "Kitchen Towels", netPrice: "3.98" }
                      ]
                    }
                  ]}
                />
              </div>
              <div className="button-label">DAY BLOCK - ORGANISM (DAY TOTAL + MERCHANT BLOCK)</div>
            </div>
          </div>

          {/* TextBox - Full Container */}
          <div className="seamless-grid" style={{ marginTop: '2rem' }}>
            <div className="button-grid box-wide-tall" style={{ background: '#ffffff' }}>
              <div className="button-center">
                <TextBox
                  days={[
                    {
                      date: "21st Dec",
                      total: "628.21",
                      merchants: [
                        {
                          merchantName: "TESCOS",
                          merchantTotal: "628.21",
                          items: [
                            { quantity: "2x", itemName: "Headphones", netPrice: "104.99", discount: "3.99" },
                            { quantity: "1x", itemName: "Playstation 5", netPrice: "5000.99" },
                            { quantity: "1x", itemName: "Chino Trousers", netPrice: "14.99" },
                            { quantity: "3x", itemName: "Organic Milk", netPrice: "2.50", discount: "0.50" },
                            { quantity: "5x", itemName: "Energy Drink", netPrice: "6.25" },
                            { quantity: "2x", itemName: "Kitchen Towels", netPrice: "3.98" }
                          ]
                        }
                      ]
                    },
                    {
                      date: "25th Jan",
                      total: "2487.63",
                      merchants: [
                        {
                          merchantName: "AMAZON",
                          merchantTotal: "2487.63",
                          items: [
                            { quantity: "1x", itemName: "Laptop Stand", netPrice: "299.99" },
                            { quantity: "2x", itemName: "USB-C Cable", netPrice: "15.99", discount: "2.00" },
                            { quantity: "1x", itemName: "Wireless Mouse", netPrice: "45.50" },
                            { quantity: "3x", itemName: "AA Batteries", netPrice: "8.99" },
                            { quantity: "1x", itemName: "Desk Lamp", netPrice: "89.99", discount: "10.00" },
                            { quantity: "1x", itemName: "Notebook Pack", netPrice: "12.49" },
                            { quantity: "2x", itemName: "Phone Case", netPrice: "24.99" },
                            { quantity: "1x", itemName: "Webcam HD", netPrice: "129.99", discount: "15.00" },
                            { quantity: "4x", itemName: "Pen Set", netPrice: "6.75" },
                            { quantity: "1x", itemName: "Monitor Riser", netPrice: "65.99" },
                            { quantity: "1x", itemName: "Keyboard Cover", netPrice: "18.99", discount: "3.00" },
                            { quantity: "1x", itemName: "External SSD 1TB", netPrice: "149.99", discount: "20.00" },
                            { quantity: "2x", itemName: "HDMI Cable", netPrice: "12.99" },
                            { quantity: "1x", itemName: "USB Hub", netPrice: "34.99" },
                            { quantity: "3x", itemName: "Cable Ties Pack", netPrice: "5.99" },
                            { quantity: "1x", itemName: "Mousepad XL", netPrice: "24.99" },
                            { quantity: "2x", itemName: "Screen Protector", netPrice: "14.99" },
                            { quantity: "1x", itemName: "Laptop Sleeve", netPrice: "29.99" },
                            { quantity: "4x", itemName: "Microfiber Cloth", netPrice: "8.99" },
                            { quantity: "1x", itemName: "Phone Stand", netPrice: "19.99" },
                            { quantity: "2x", itemName: "Charging Cable", netPrice: "11.99" },
                            { quantity: "1x", itemName: "Bluetooth Speaker", netPrice: "79.99", discount: "15.00" },
                            { quantity: "3x", itemName: "SD Card 64GB", netPrice: "18.99" },
                            { quantity: "1x", itemName: "Tablet Case", netPrice: "39.99" },
                            { quantity: "2x", itemName: "Stylus Pen", netPrice: "22.99" },
                            { quantity: "1x", itemName: "Portable Charger", netPrice: "49.99", discount: "8.00" }
                          ]
                        }
                      ]
                    }
                  ]}
                />
              </div>
              <div className="button-label">TEXTBOX - COMPLETE FINANCE DISPLAY (301×421px)</div>
            </div>

            {/* Empty State Display */}
            <div className="button-grid box-wide-tall" style={{ background: '#ffffff' }}>
              <div className="button-center">
                <TextBox days={[]} />
              </div>
              <div className="button-label">TEXTBOX - EMPTY STATE (301×421px)</div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default TraceComponent;
