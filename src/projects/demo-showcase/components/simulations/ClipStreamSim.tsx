/**
 * ClipStreamSim — scripted "play simulation" wrapper for the
 * ClipStream project, rendered inside the demo-showcase carousel.
 *
 * Built against docs/demo-showcase/CLIPSTREAM-SIM-REBUILD-SPEC.md.
 *
 * Reuses the real product's leaf components (ClipHomeScreen,
 * ClipRecordScreen, ClipOffline via ClipRecordScreen, the morphing
 * RecordNavBar tray, ToastNotification) so visuals match the live
 * product. Does NOT use ClipMasterScreen, useClipRecording,
 * useClipStore, useAutoRetry, IndexedDB, or MediaRecorder. Driven
 * entirely by a scripted SIM_STEPS table.
 *
 * Architecture mirrors ClipMasterScreen:
 *   - outer frame
 *   - .master-screen
 *   - .screen-container (home + record sliding layers)
 *   - persistent .record-bar tray underneath
 *   - toast overlay
 *
 * The tray is ALWAYS mounted and its height/padding/opacity never
 * change between steps within a presentation profile (spec §7.4).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ClipHomeScreen } from '@/projects/clipperstream/components/ui/ClipHomeScreen';
import { ClipRecordScreen, type PendingClip } from '@/projects/clipperstream/components/ui/ClipRecordScreen';
import { RecordNavBarVarMorphing, type RecordNavState } from '@/projects/clipperstream/components/ui/mainvarmorph';
import { ToastNotification } from '@/projects/clipperstream/components/ui/ClipToast';
import type { Clip } from '@/projects/clipperstream/store/clipStore';

// ─── Types ───────────────────────────────────────────────────────────────

type TrayVariant = 'morph' | 'fade';

interface SimSnapshot {
  screen: 'home' | 'record';
  trayState: RecordNavState;
  trayVariant: TrayVariant;
  network: 'online' | 'offline';
  pendingClips: PendingClip[];
  selectedClip?: Clip;
  homeClips: Clip[];
  menuOpenClipId?: string;
  deletingClipId?: string;
  analyserActive: boolean;
}

// Snapshot built lazily at render time (depends on loopId for the mock
// clip identity). The step table holds duration + snapshot factory.
type SnapshotFactory = (clip: Clip) => SimSnapshot;

interface SimStepDef {
  id: string;
  durationMs: number;
  snapshot: SnapshotFactory;
}

// ─── Mock data ───────────────────────────────────────────────────────────

const MOCK_TRANSCRIPT = 'Quick thought before I forget — let me lock that in.';

const formatTodayDate = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = new Date();
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

// `sim-` prefix per spec §10.3 — keeps any accidental
// useClipStore.updateClip(id, ...) calls from ClipRecordScreen's
// internal animation effect from colliding with real-store clips.
const buildCompletedClip = (loopId: number): Clip => ({
  id: `sim-clip-${loopId}`,
  createdAt: Date.now(),
  title: 'Recording 01',
  date: formatTodayDate(),
  rawText: MOCK_TRANSCRIPT,
  formattedText: MOCK_TRANSCRIPT,
  content: MOCK_TRANSCRIPT,
  status: null,
  duration: '0:03',
  currentView: 'formatted',
  hasAnimated: false,
});

const PENDING_WAITING: PendingClip = {
  id: 'sim-pending-001',
  title: 'Clip 001',
  time: '0:03',
  status: 'waiting',
  isActiveRequest: false,
};

const PENDING_TRANSCRIBING: PendingClip = {
  id: 'sim-pending-001',
  title: 'Clip 001',
  time: '0:03',
  status: 'transcribing',
  isActiveRequest: true,
};

// ─── Step table ──────────────────────────────────────────────────────────

const baseEmpty: Omit<SimSnapshot, 'trayState' | 'trayVariant' | 'network' | 'screen'> = {
  pendingClips: [],
  selectedClip: undefined,
  homeClips: [],
  menuOpenClipId: undefined,
  deletingClipId: undefined,
  analyserActive: false,
};

const SIM_STEPS: SimStepDef[] = [
  {
    id: 'idle-home-offline',
    durationMs: 1500,
    snapshot: () => ({
      ...baseEmpty,
      screen: 'home',
      trayState: 'record',
      trayVariant: 'morph',
      network: 'offline',
    }),
  },
  {
    id: 'go-to-record',
    durationMs: 200,
    snapshot: () => ({
      ...baseEmpty,
      screen: 'record',
      trayState: 'recording',
      trayVariant: 'morph',
      network: 'offline',
      analyserActive: true,
    }),
  },
  {
    id: 'recording',
    durationMs: 2800,
    snapshot: () => ({
      ...baseEmpty,
      screen: 'record',
      trayState: 'recording',
      trayVariant: 'morph',
      network: 'offline',
      analyserActive: true,
    }),
  },
  {
    id: 'done-offline-pending',
    durationMs: 1500,
    snapshot: () => ({
      ...baseEmpty,
      screen: 'record',
      trayState: 'record',
      trayVariant: 'morph',
      network: 'offline',
      pendingClips: [PENDING_WAITING],
    }),
  },
  {
    id: 'online-still-waiting',
    durationMs: 350,
    snapshot: () => ({
      ...baseEmpty,
      screen: 'record',
      trayState: 'record',
      trayVariant: 'morph',
      network: 'online',
      pendingClips: [PENDING_WAITING],
    }),
  },
  {
    id: 'online-transcribing',
    durationMs: 1300,
    snapshot: () => ({
      ...baseEmpty,
      screen: 'record',
      trayState: 'record',
      trayVariant: 'morph',
      network: 'online',
      pendingClips: [PENDING_TRANSCRIBING],
    }),
  },
  {
    id: 'transcribed-read',
    durationMs: 2000,
    snapshot: (clip) => ({
      ...baseEmpty,
      screen: 'record',
      trayState: 'complete',
      trayVariant: 'fade',
      network: 'online',
      selectedClip: clip,
    }),
  },
  {
    id: 'back-home',
    durationMs: 200,
    snapshot: (clip) => ({
      ...baseEmpty,
      screen: 'home',
      trayState: 'record',
      trayVariant: 'fade',
      network: 'online',
      homeClips: [clip],
    }),
  },
  {
    id: 'home-settle',
    durationMs: 600,
    snapshot: (clip) => ({
      ...baseEmpty,
      screen: 'home',
      trayState: 'record',
      trayVariant: 'fade',
      network: 'online',
      homeClips: [clip],
    }),
  },
  {
    id: 'menu-open',
    durationMs: 700,
    snapshot: (clip) => ({
      ...baseEmpty,
      screen: 'home',
      trayState: 'record',
      trayVariant: 'fade',
      network: 'online',
      homeClips: [clip],
      menuOpenClipId: clip.id,
    }),
  },
  {
    id: 'delete',
    durationMs: 1100,
    snapshot: (clip) => ({
      ...baseEmpty,
      screen: 'home',
      trayState: 'record',
      trayVariant: 'fade',
      network: 'online',
      homeClips: [clip],
      menuOpenClipId: clip.id,
      deletingClipId: clip.id,
    }),
  },
];

export const CLIPSTREAM_SIM_DURATION = SIM_STEPS.reduce(
  (sum, step) => sum + step.durationMs,
  0,
);

// ─── Fake analyser hook ──────────────────────────────────────────────────

/**
 * AnalyserNode driven by an OscillatorNode + LFO-modulated gain.
 * Output connects ONLY to the analyser — never to ctx.destination —
 * so nothing plays through speakers, but WaveClipper sees real FFT
 * data and animates organically.
 *
 * Phase-bound lifecycle is acceptable per spec §10.12 as long as
 * cleanup is correct on unmount and adjacent steps don't thrash.
 * Steps 2 + 3 keep `enabled` true continuously, so no thrash.
 */
function useFakeAnalyser(enabled: boolean) {
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  useEffect(() => {
    if (!enabled) {
      setAnalyser(null);
      return;
    }
    if (typeof window === 'undefined') return;

    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;

    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 220;

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 4;

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.35;

    const mainGain = ctx.createGain();
    mainGain.gain.value = 0.45;

    const an = ctx.createAnalyser();
    an.fftSize = 256;
    an.smoothingTimeConstant = 0.85;

    lfo.connect(lfoGain);
    lfoGain.connect(mainGain.gain);
    osc.connect(mainGain);
    mainGain.connect(an);

    osc.start();
    lfo.start();

    setAnalyser(an);

    return () => {
      try { osc.stop(); } catch { /* noop */ }
      try { lfo.stop(); } catch { /* noop */ }
      try { osc.disconnect(); } catch { /* noop */ }
      try { lfo.disconnect(); } catch { /* noop */ }
      try { lfoGain.disconnect(); } catch { /* noop */ }
      try { mainGain.disconnect(); } catch { /* noop */ }
      try { an.disconnect(); } catch { /* noop */ }
      void ctx.close();
    };
  }, [enabled]);

  return analyser;
}

// ─── Component ───────────────────────────────────────────────────────────

interface ClipStreamSimProps {
  onLoopRestart?: () => void;
}

export const ClipStreamSim: React.FC<ClipStreamSimProps> = ({ onLoopRestart }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [loopId, setLoopId] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);

  // Keep the latest onLoopRestart in a ref so the timer effect doesn't
  // tear down and rebuild every time the parent reruns.
  const onLoopRestartRef = useRef(onLoopRestart);
  useEffect(() => {
    onLoopRestartRef.current = onLoopRestart;
  }, [onLoopRestart]);

  // Step timer — restarts whenever stepIndex changes. Cleanup clears
  // the timeout on unmount or step transition.
  useEffect(() => {
    const step = SIM_STEPS[stepIndex];
    const timer = setTimeout(() => {
      const isLast = stepIndex === SIM_STEPS.length - 1;
      if (isLast) {
        setLoopId((id) => id + 1);
        setStepIndex(0);
        onLoopRestartRef.current?.();
      } else {
        setStepIndex((i) => i + 1);
      }
    }, step.durationMs);
    return () => clearTimeout(timer);
  }, [stepIndex]);

  // Mock clip — built once per loop iteration so identity stays stable
  // across the steps that use it. New loop → new clip with
  // hasAnimated=false → text intro animation re-fires on transcribed-read.
  const mockClip = useMemo(() => buildCompletedClip(loopId), [loopId]);

  const snapshot = useMemo(
    () => SIM_STEPS[stepIndex].snapshot(mockClip),
    [stepIndex, mockClip],
  );

  // Toast — fire on ENTRY to 'done-offline-pending'. Driven by step
  // transition rather than a snapshot field so the toast's internal
  // auto-dismiss timer doesn't fight a long-lived flag (spec §10.10).
  useEffect(() => {
    if (SIM_STEPS[stepIndex].id === 'done-offline-pending') {
      setToastVisible(true);
    }
  }, [stepIndex]);

  // Fake analyser only spins up while a recording step is active.
  const analyser = useFakeAnalyser(snapshot.analyserActive);

  // Derive ClipRecordScreen.state from data, mirroring the real
  // ClipMasterScreen.getRecordScreenState (spec §10.7).
  const recordScreenState: 'recording' | 'transcribed' | 'offline' = useMemo(() => {
    if (snapshot.selectedClip?.content) return 'transcribed';
    if (snapshot.pendingClips.length > 0) return 'offline';
    return 'recording';
  }, [snapshot.selectedClip, snapshot.pendingClips]);

  const noop = useCallback(() => { /* sim is non-interactive */ }, []);

  const isHome = snapshot.screen === 'home';

  return (
    <div className="clipstream-sim-frame">
      <div className="master-screen">
        {/* Toast overlay — slides in when audio is saved offline. */}
        <ToastNotification
          isVisible={toastVisible}
          onDismiss={() => setToastVisible(false)}
          type="audio"
          duration={1300}
        />

        <div className="screen-container">
          {/* Home layer */}
          <div className={`screen-slide home-screen ${isHome ? 'active' : ''}`}>
            <ClipHomeScreen
              clips={snapshot.homeClips}
              onClipClick={noop}
              onRecordClick={noop}
              simulationOpenMenuForClipId={snapshot.menuOpenClipId}
              simulationDeletingClipId={snapshot.deletingClipId}
            />
          </div>

          {/* Record layer */}
          <div className={`screen-slide record-screen ${!isHome ? 'active' : ''}`}>
            <ClipRecordScreen
              state={recordScreenState}
              selectedClip={snapshot.selectedClip}
              pendingClips={snapshot.pendingClips}
              onBackClick={noop}
              onNewClipClick={noop}
              onTranscribeClick={noop}
              forcedNetworkState={snapshot.network}
            />
          </div>
        </div>

        {/* Persistent tray — ALWAYS mounted; height/padding never
            change between steps within a profile (spec §3.1, §7.4). */}
        <div className="record-bar">
          <RecordNavBarVarMorphing
            navState={snapshot.trayState}
            variant={snapshot.trayVariant}
            onRecordClick={noop}
            onCloseClick={noop}
            onCopyClick={noop}
            onDoneClick={noop}
            onStructureClick={noop}
            audioAnalyser={analyser}
          />
        </div>
      </div>

      <style jsx>{`
        /* Outer frame — scaled to fit the showcase carousel slot. */
        .clipstream-sim-frame {
          transform: scale(0.8);
          transform-origin: center center;
        }
        @media (max-width: 768px) {
          .clipstream-sim-frame {
            transform: scale(0.65);
          }
        }

        /* Phone shell — fixed dimensions per profile. Within a
           profile, these values do not change across sim steps. */
        .master-screen {
          display: flex;
          flex-direction: column;
          position: relative;
          width: 393px;
          height: 652px;
          min-height: 652px;
          max-height: 652px;
          background: var(--ClipBg, #1c1917);
          border-radius: 8px;
          overflow: hidden;
        }
        @media (max-width: 768px) {
          .master-screen {
            height: 572px;
            min-height: 572px;
            max-height: 572px;
            border-radius: 16px;
          }
        }

        /* Screen container — fills the space above the persistent tray
           and hosts the two sliding layers. */
        .screen-container {
          position: relative;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }
        .screen-slide {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform;
        }
        .home-screen {
          transform: translateX(-100%);
        }
        .home-screen.active {
          transform: translateX(0);
        }
        .record-screen {
          transform: translateX(100%);
        }
        .record-screen.active {
          transform: translateX(0);
        }

        /* Persistent tray — height stays constant across every step
           within a profile (spec §7.4). Desktop 160px (matches real
           product), mobile 80px (deliberate sim compaction; profile-
           level override only — never animated step-to-step). */
        .record-bar {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: flex-start;
          padding: 24px 12px 0;
          gap: 10px;
          width: 100%;
          height: 160px;
          background: var(--ClipRecTrayBg);
          border-radius: 16px 16px 0 0;
          flex: none;
          overflow: hidden;
        }
        @media (max-width: 768px) {
          .record-bar {
            height: 80px;
            padding: 0 12px;
            align-items: center;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .screen-slide {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
};
