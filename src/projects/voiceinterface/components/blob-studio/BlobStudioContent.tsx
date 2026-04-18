/**
 * BlobStudioContent — main content for the Blob Studio page.
 * Gallery cells at top, sequential demo below, fixed bottom nav bar
 * with tab-based controls (matching GalleryNavBar pattern).
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { BlobStateCell } from './BlobStateCell';
import { BlobSequentialDemo } from './BlobSequentialDemo';
import SliderRow from '@/projects/blob-orb/components/shared/SliderRow';
import {
  type BlobVoiceState,
  type BlobStateSettings,
  type BlobStudioSettings,
  WHIMSY_BASE,
  DEFAULT_STATE_SETTINGS,
  BLOB_STATE_LABELS,
} from './blobStudioTypes';

const STATES: BlobVoiceState[] = ['idle', 'listening', 'thinking', 'talking'];

type ControlTab = 'motion' | 'speed';

const BlobStudioContent: React.FC = () => {
  const [studioSettings, setStudioSettings] = useState<BlobStudioSettings>({
    base: WHIMSY_BASE,
    states: DEFAULT_STATE_SETTINGS,
  });
  const [activeState, setActiveState] = useState<BlobVoiceState | null>(null);
  const [activeTab, setActiveTab] = useState<ControlTab | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest('[data-tab-button]')
      ) {
        setActiveTab(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleStateSettingsChange = useCallback(
    (state: BlobVoiceState, newSettings: BlobStateSettings) => {
      setStudioSettings((prev) => ({
        ...prev,
        states: { ...prev.states, [state]: newSettings },
      }));
    },
    []
  );

  const set = useCallback(
    (key: keyof BlobStateSettings, value: number) => {
      if (!activeState) return;
      setStudioSettings((prev) => ({
        ...prev,
        states: {
          ...prev.states,
          [activeState]: { ...prev.states[activeState], [key]: value },
        },
      }));
    },
    [activeState]
  );

  const activeSettings = activeState ? studioSettings.states[activeState] : null;

  const toggleTab = (tab: ControlTab) => {
    setActiveTab((prev) => (prev === tab ? null : tab));
  };

  const renderTabControls = (tab: ControlTab) => {
    if (!activeState || !activeSettings) return null;
    switch (tab) {
      case 'motion':
        return (
          <div className="space-y-3">
            <SliderRow label="Wave Intensity" value={activeSettings.waveIntensity} min={0.02} max={0.5} step={0.01} onChange={(v) => set('waveIntensity', v)} />
            <SliderRow label="Breath Amplitude" value={activeSettings.breathAmp} min={0} max={0.1} step={0.005} onChange={(v) => set('breathAmp', v)} />
            <SliderRow label="Idle Amplitude" value={activeSettings.idleAmp} min={0} max={0.1} step={0.005} onChange={(v) => set('idleAmp', v)} />
          </div>
        );
      case 'speed':
        return (
          <SliderRow
            label={activeState === 'thinking' ? 'Pulse Speed' : activeState === 'talking' ? 'Morph Speed' : 'Thicken Speed'}
            value={activeSettings.thickenSpeed}
            min={0.3}
            max={4.0}
            step={0.1}
            unit="s"
            onChange={(v) => set('thickenSpeed', v)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="blob-studio">
      {/* Header */}
      <div className="studio-header">
        <h1 className="studio-title">Blob Studio</h1>
        <p className="studio-subtitle">
          Craft voice interface blob states for the home page
        </p>
      </div>

      {/* Section A: State Gallery */}
      <div className="gallery-section">
        <div className="gallery-grid">
          {STATES.map((state) => (
            <BlobStateCell
              key={state}
              state={state}
              base={studioSettings.base}
              settings={studioSettings.states[state]}
              isActive={activeState === state}
              onSelect={() => setActiveState((prev) => prev === state ? null : state)}
              onSettingsChange={(s) => handleStateSettingsChange(state, s)}
            />
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="divider" />

      {/* Section B: Sequential Demo */}
      <div className="demo-section">
        <BlobSequentialDemo studioSettings={studioSettings} />
      </div>

      {/* Bottom spacer for fixed nav */}
      <div style={{ height: 52 }} />

      {/* ── Fixed Bottom Nav Bar (GalleryNavBar pattern) ── */}
      <div className="nav-fixed">
        {/* Popover for active tab */}
        {activeTab && activeState && (
          <div ref={popoverRef} className="nav-popover">
            <div className="nav-popover-inner">
              <h3 className="nav-popover-title">
                {activeTab === 'motion' ? 'Motion' : 'Speed'} — {BLOB_STATE_LABELS[activeState]}
              </h3>
              {renderTabControls(activeTab)}
            </div>
          </div>
        )}

        {/* Main bar */}
        <div className="nav-bar">
          <div className="nav-bar-inner">
            {/* State pills */}
            <div className="nav-pills">
              {STATES.map((state) => (
                <button
                  key={state}
                  onClick={() => setActiveState((prev) => prev === state ? null : state)}
                  className={`nav-pill ${activeState === state ? 'nav-pill-active' : ''}`}
                >
                  {BLOB_STATE_LABELS[state]}
                </button>
              ))}
            </div>

            <div className="nav-sep" />

            {/* Control tab buttons — only when a state is selected */}
            {activeState && (
              <>
                <div className="nav-tabs">
                  <button
                    data-tab-button
                    onClick={() => toggleTab('motion')}
                    className={`nav-tab ${activeTab === 'motion' ? 'nav-tab-active' : ''}`}
                  >
                    Motion
                  </button>
                  <button
                    data-tab-button
                    onClick={() => toggleTab('speed')}
                    className={`nav-tab ${activeTab === 'speed' ? 'nav-tab-active' : ''}`}
                  >
                    Speed
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .blob-studio {
          min-height: 100vh;
          padding: 40px 20px 80px;
          background: #fafafa;
          font-family: 'Open Runde', 'Inter', sans-serif;
        }
        .studio-header {
          max-width: 1800px;
          margin: 0 auto 32px;
          text-align: center;
        }
        .studio-title {
          font-size: 32px;
          font-weight: 700;
          color: #262424;
          margin: 0 0 8px;
        }
        .studio-subtitle {
          font-size: 16px;
          font-weight: 500;
          color: rgba(38, 36, 36, 0.5);
          margin: 0;
        }
        .gallery-section {
          max-width: 1800px;
          margin: 0 auto;
        }
        .gallery-grid {
          display: flex;
          gap: 0;
          justify-content: center;
          flex-wrap: wrap;
        }
        .divider {
          max-width: 1800px;
          margin: 40px auto;
          height: 1px;
          background: rgba(0, 0, 0, 0.08);
        }
        .demo-section {
          max-width: 1800px;
          margin: 0 auto;
        }

        /* ── Fixed bottom nav ── */
        .nav-fixed {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 50;
        }
        .nav-popover {
          position: absolute;
          bottom: 100%;
          left: 0;
          right: 0;
          background: #fff;
          border-top: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.06);
          max-height: 50vh;
          overflow-y: auto;
          animation: slideUp 200ms ease-out;
        }
        .nav-popover-inner {
          max-width: 600px;
          margin: 0 auto;
          padding: 16px 20px;
        }
        .nav-popover-title {
          font-size: 11px;
          font-weight: 600;
          color: rgba(38, 36, 36, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 12px;
        }
        .nav-bar {
          background: #fff;
          border-top: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.04);
        }
        .nav-bar-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 8px 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .nav-pills {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .nav-pill {
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 500;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: #fff;
          color: rgba(38, 36, 36, 0.5);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .nav-pill:hover {
          border-color: rgba(0, 0, 0, 0.2);
          color: rgba(38, 36, 36, 0.7);
        }
        .nav-pill-active {
          background: #1f2937;
          color: #fff;
          border-color: #1f2937;
        }
        .nav-sep {
          width: 1px;
          height: 24px;
          background: rgba(0, 0, 0, 0.1);
          flex-shrink: 0;
        }
        .nav-tabs {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .nav-tab {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          background: none;
          border: none;
          color: rgba(38, 36, 36, 0.5);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .nav-tab:hover {
          color: rgba(38, 36, 36, 0.7);
          background: rgba(0, 0, 0, 0.04);
        }
        .nav-tab-active {
          background: rgba(0, 0, 0, 0.06);
          color: #262424;
        }
        @keyframes slideUp {
          from { transform: translateY(8px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default BlobStudioContent;
