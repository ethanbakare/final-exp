/**
 * ClipStreamSim — scripted-loop "play simulation" wrapper for the
 * ClipStream project, rendered inside the demo-showcase carousel.
 *
 * What this is (and isn't):
 *   - It REUSES the real product's leaf components (ClipHomeScreen,
 *     ClipRecordScreen, ClipOffline, RecordNavBarVarMorphing,
 *     ToastNotification, MorphingOnlineOfflineStatus, etc.) so the
 *     visual matches /clipperstream pixel-for-pixel.
 *   - It does NOT use ClipMasterScreen, useClipRecording,
 *     useClipStore, useAutoRetry, IndexedDB, or MediaRecorder. None
 *     of the real recording/transcription pipeline runs. The whole
 *     thing is driven by a setTimeout-chained state machine.
 *   - The waveform animates via a synthetic OscillatorNode chain
 *     (oscillator → gain → analyser, never connected to
 *     ctx.destination) so WaveClipper sees a real AnalyserNode but
 *     no audio plays through speakers.
 *
 * Loop (~12s total):
 *   1. idle-record-screen     1.0s — RECORD button visible, status 'Offline'
 *   2. recording              3.0s — wave animates, timer 0:00 → 0:03
 *   3. offline-pending        2.0s — DONE morph back to RECORD; ClipOffline
 *                                    block shows "Clip 001 0:03" (waiting,
 *                                    muted spinner); AudioToast pops in
 *                                    "Audio saved for later" then dismisses
 *   4. transcribing           1.2s — status flips to 'Online'; ClipOffline
 *                                    spinner starts spinning (transcribing)
 *   5. transcribed-reading    1.7s — text content slides in inside record
 *                                    screen's transcribed state
 *   6. navigating-home        0.4s — slide transition to home screen
 *   7. home-with-clip         0.9s — new clip appears in list
 *   8. menu-opening           0.4s — triple-dot dropdown opens
 *   9. menu-visible           0.6s — pause for visual read
 *  10. deleting               0.6s — clip fades out via existing isDeleting
 *                                    fade-out animation, dropdown closes
 *  11. returning-to-record    0.4s — slide back to record screen
 *  12. (loop)                          → phase 1
 *
 * Loop reset notifies the showcase parent via onLoopRestart so the
 * progress bar resets in sync — same contract as TraceSim and
 * AIConfidenceSim.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ClipHomeScreen } from '@/projects/clipperstream/components/ui/ClipHomeScreen';
import { ClipRecordScreen, type PendingClip } from '@/projects/clipperstream/components/ui/ClipRecordScreen';
import { RecordNavBarVarMorphing, type RecordNavState } from '@/projects/clipperstream/components/ui/mainvarmorph';
import { ToastNotification } from '@/projects/clipperstream/components/ui/ClipToast';
import type { Clip } from '@/projects/clipperstream/store/clipStore';

// ─── Phase timeline ──────────────────────────────────────────────────────

type SimPhase =
  | 'idle-record-screen'
  | 'recording'
  | 'offline-pending'
  | 'transcribing'
  | 'transcribed-reading'
  | 'navigating-home'
  | 'home-with-clip'
  | 'menu-opening'
  | 'menu-visible'
  | 'deleting'
  | 'returning-to-record';

const PHASE_DURATIONS_MS: Record<SimPhase, number> = {
  'idle-record-screen': 1000,
  'recording': 3000,
  'offline-pending': 2000,
  'transcribing': 1200,
  'transcribed-reading': 1700,
  'navigating-home': 400,
  'home-with-clip': 900,
  'menu-opening': 400,
  'menu-visible': 600,
  'deleting': 600,
  'returning-to-record': 400,
};

const PHASE_ORDER: SimPhase[] = [
  'idle-record-screen',
  'recording',
  'offline-pending',
  'transcribing',
  'transcribed-reading',
  'navigating-home',
  'home-with-clip',
  'menu-opening',
  'menu-visible',
  'deleting',
  'returning-to-record',
];

export const CLIPSTREAM_SIM_DURATION = PHASE_ORDER.reduce(
  (sum, phase) => sum + PHASE_DURATIONS_MS[phase],
  0,
);

// ─── Mock data ───────────────────────────────────────────────────────────

const formatTodayDate = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = new Date();
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

// Short, natural-sounding transcription. Per user direction: keep it brief.
const MOCK_TRANSCRIPT = 'Quick thought before I forget — let me lock that in.';

// Builds the mock clip used during the home phase. Generated fresh per loop
// iteration so React sees a stable object reference within a single phase
// chain and a new reference when the loop restarts (matters for the fade-
// out animation which keys off identity).
const buildMockClip = (loopId: number): Clip => ({
  id: `sim-clip-${loopId}`,
  createdAt: Date.now(),
  title: 'Clip 001',
  date: formatTodayDate(),
  rawText: MOCK_TRANSCRIPT,
  formattedText: MOCK_TRANSCRIPT,
  content: MOCK_TRANSCRIPT,
  status: null, // null = completed
  duration: '0:03',
  currentView: 'formatted',
  hasAnimated: false, // allow text slide-in animation on transcribed-reading
});

// ─── Fake analyser hook ──────────────────────────────────────────────────

/**
 * Builds a real AnalyserNode driven by a synthetic OscillatorNode +
 * LFO-modulated gain. Output is connected ONLY to the analyser — never
 * to ctx.destination — so nothing plays through the speakers, but
 * WaveClipper sees authentic frequency data and animates organically.
 *
 * Active only while `enabled` is true; everything tears down on disable.
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
    // Source oscillator — sawtooth gives a richer harmonic profile than sine,
    // so the analyser gets non-trivial energy across the FFT bins.
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 220;

    // LFO that modulates the gain — gives the bars a breathing/wobble feel
    // instead of a flat, lifeless level.
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

    // LFO modulates the main gain
    lfo.connect(lfoGain);
    lfoGain.connect(mainGain.gain);

    // Source path: osc → gain → analyser (NOT to ctx.destination — silent)
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
  const [phase, setPhase] = useState<SimPhase>('idle-record-screen');
  const [loopId, setLoopId] = useState(0);

  // Start phase timer chain. Cancellable on unmount; resets when loopId
  // changes (used for the loop-back at the end).
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const advance = (current: SimPhase) => {
      timer = setTimeout(() => {
        if (cancelled) return;
        const idx = PHASE_ORDER.indexOf(current);
        const isLast = idx === PHASE_ORDER.length - 1;
        if (isLast) {
          // Loop reset
          setLoopId((id) => id + 1);
          setPhase(PHASE_ORDER[0]);
          onLoopRestart?.();
          return;
        }
        const nextPhase = PHASE_ORDER[idx + 1];
        setPhase(nextPhase);
        advance(nextPhase);
      }, PHASE_DURATIONS_MS[current]);
    };

    advance(phase);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
    // We intentionally only re-run when loopId changes; phase changes are
    // driven from inside this effect's setTimeout chain.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loopId]);

  // ─── Derived state ───────────────────────────────────────────────────

  const screenIsHome = useMemo(
    () =>
      phase === 'navigating-home' ||
      phase === 'home-with-clip' ||
      phase === 'menu-opening' ||
      phase === 'menu-visible' ||
      phase === 'deleting',
    [phase],
  );

  // Network status: offline through recording + offline-pending; online
  // from transcribing onward (and stays online while the loop reaches
  // home / delete / return).
  const networkStatus: 'online' | 'offline' =
    phase === 'idle-record-screen' ||
    phase === 'recording' ||
    phase === 'offline-pending'
      ? 'offline'
      : 'online';

  // Record bar nav state: only 'recording' during the actual record phase.
  const recordNavState: RecordNavState = phase === 'recording' ? 'recording' : 'record';

  // Pending clip block — shown post-DONE while offline and during the
  // transcribing spinner. Disappears when the transcribed text appears.
  const pendingClips: PendingClip[] = useMemo(() => {
    if (phase === 'offline-pending') {
      return [{ id: 'sim-pending-001', title: 'Clip 001', time: '0:03', status: 'waiting', isActiveRequest: false }];
    }
    if (phase === 'transcribing') {
      return [{ id: 'sim-pending-001', title: 'Clip 001', time: '0:03', status: 'transcribing', isActiveRequest: true }];
    }
    return [];
  }, [phase]);

  // Selected clip — shown only during the transcribed-reading phase, drives
  // ClipRecordScreen's 'transcribed' state to render the transcript text.
  const transcribedClip: Clip | undefined = useMemo(() => {
    if (phase !== 'transcribed-reading') return undefined;
    return buildMockClip(loopId);
  }, [phase, loopId]);

  const recordScreenState: 'recording' | 'transcribed' | 'offline' = useMemo(() => {
    if (phase === 'recording') return 'recording';
    if (phase === 'transcribed-reading') return 'transcribed';
    if (phase === 'offline-pending' || phase === 'transcribing') return 'offline';
    // idle-record-screen, navigating-home, etc.: keep at 'offline' so the
    // ClipOffline list area renders empty (pendingClips=[]) and the screen
    // shows the empty placeholder body.
    return 'offline';
  }, [phase]);

  // Home clips — only visible during the home phases. Builds fresh per loop
  // so identity changes when the loop restarts (good for animation keys).
  const homeClips: Clip[] = useMemo(() => {
    if (
      phase === 'home-with-clip' ||
      phase === 'menu-opening' ||
      phase === 'menu-visible' ||
      phase === 'deleting'
    ) {
      return [buildMockClip(loopId)];
    }
    return [];
  }, [phase, loopId]);

  // Toast: "Audio saved for later" — shown briefly during offline-pending.
  // Auto-dismisses; we drive it via a separate boolean so the existing
  // ToastNotification slide-in/out animation runs cleanly.
  const [toastVisible, setToastVisible] = useState(false);
  useEffect(() => {
    setToastVisible(phase === 'offline-pending');
  }, [phase]);

  // Dropdown open during menu-opening / menu-visible, closes for deleting.
  const dropdownOpen = phase === 'menu-opening' || phase === 'menu-visible';

  // Clip is fading out during deleting phase — drives ClipListItem's existing
  // `isDeleting` fade-out animation.
  const clipDeleting = phase === 'deleting';

  // ─── Wave analyser ───────────────────────────────────────────────────

  const analyser = useFakeAnalyser(phase === 'recording');

  // ─── Refs ────────────────────────────────────────────────────────────

  // We pass simulationOpenMenu / isDeleting into the ClipHomeScreen via the
  // mock clip array — but ClipHomeScreen consumes a Clip[] and renders
  // ClipListItem internally without exposing those props. We wrap a tiny
  // subset of ClipHomeScreen's behaviour by overriding the rendered list
  // via portal? No — simpler: we render ClipHomeScreen but lay our own
  // ClipListItem on top during the home phases, with the simulation
  // override props set. See SimHomeOverlay component below.
  //
  // (Doing it this way avoids forking ClipHomeScreen entirely. The base
  // ClipHomeScreen renders the header + scroll container + (empty / list)
  // with NO clips during the home phases — we hide its body via CSS while
  // our overlay paints the actual list with sim controls.)

  const noop = useCallback(() => { /* sim is non-interactive */ }, []);

  return (
    <div className="clipstream-sim-frame">
      <div className="master-screen">
        {/* Screen container — slides between home and record */}
        <div className="screen-container">
          {/* Home screen layer */}
          <div className={`screen-slide home-screen ${screenIsHome ? 'active' : ''}`}>
            <ClipHomeScreen
              clips={homeClips}
              onClipClick={noop}
              onRecordClick={noop}
              simulationOpenMenuForClipId={dropdownOpen ? `sim-clip-${loopId}` : undefined}
              simulationDeletingClipId={clipDeleting ? `sim-clip-${loopId}` : undefined}
            />
          </div>

          {/* Record screen layer — uses ClipRecordScreen's own internal
              ClipRecordHeader; we drive its network state via the
              forcedNetworkState [DEMO-SHOWCASE] prop. */}
          <div className={`screen-slide record-screen ${!screenIsHome ? 'active' : ''}`}>
            <ClipRecordScreen
              state={recordScreenState}
              selectedClip={transcribedClip}
              pendingClips={pendingClips}
              onBackClick={noop}
              onNewClipClick={noop}
              onTranscribeClick={noop}
              forcedNetworkState={networkStatus}
            />
          </div>
        </div>

        {/* Record bar — fixed at bottom across screen transitions */}
        <div className={`record-bar ${screenIsHome ? 'hidden' : ''}`}>
          <RecordNavBarVarMorphing
            navState={recordNavState}
            onRecordClick={noop}
            onCloseClick={noop}
            onCopyClick={noop}
            onDoneClick={noop}
            onStructureClick={noop}
            audioAnalyser={analyser}
          />
        </div>

        {/* Toast notification overlay */}
        <ToastNotification
          isVisible={toastVisible}
          onDismiss={() => setToastVisible(false)}
          type="audio"
          text="Audio saved for later"
          duration={1200}
        />
      </div>

      <style jsx>{`
        /* ─── Outer frame: same dimensions as before ──────────────── */
        .clipstream-sim-frame {
          transform: scale(0.8);
          transform-origin: center center;
        }
        @media (max-width: 768px) {
          .clipstream-sim-frame {
            transform: scale(0.65);
          }
        }

        /* ─── Master screen: phone frame ─────────────────────────── */
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

        /* ─── Screen container with sliding layers ───────────────── */
        .screen-container {
          position: relative;
          flex: 1;
          overflow: hidden;
        }
        .screen-slide {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
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

        /* ─── Record bar tray at bottom — mirrors ClipMasterScreen's
               .record-bar: 160px tall, padded tray with rounded top
               corners and the tray-tinted background. The screen
               container above takes the remaining flex:1 space. ─── */
        .record-bar {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: flex-start;
          padding: 24px 12px 0px;
          gap: 10px;
          width: 100%;
          height: 160px;
          background: var(--ClipRecTrayBg);
          border-radius: 16px 16px 0px 0px;
          flex: none;
          overflow: hidden;
          opacity: 1;
          transition:
            height 0.3s cubic-bezier(0.4, 0, 0.2, 1),
            padding 0.3s cubic-bezier(0.4, 0, 0.2, 1),
            opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .record-bar.hidden {
          height: 0;
          padding: 0;
          opacity: 0;
          pointer-events: none;
        }
        @media (max-width: 768px) {
          .record-bar {
            height: 80px;
            padding: 0 12px;
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
};
