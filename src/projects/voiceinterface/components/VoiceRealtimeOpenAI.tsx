import React, { useState, useRef, useEffect, useMemo } from 'react';
import { RealtimeAgent, RealtimeSession, OpenAIRealtimeWebRTC } from '@openai/agents-realtime';
// VelvetOrb is shelved — kept in tree at ./orb/VelvetOrb for revert.
// Active orb is RealtimeBlob — a shader-aware dispatcher between
// CoralRealtimeBlob (Coral D shader) and NebularrBlob (Tube shader).
import {
  RealtimeBlob,
  RealtimeVoiceState as VoiceState,
  type RealtimeOrb,
} from './RealtimeBlob';
import { NEBULARR_FALLBACK_PROFILE } from './NebularrBlob';
import { CORAL_FALLBACK_PROFILE, type CoralRealtimeSettings } from './CoralRealtimeBlob';
import type { LinkedProfile } from './useLinkedProfileAnimator';
import type { RadialLinkedProfile } from '@/projects/voiceinterface/radial-states/api';
import type { CircleVoiceProfile } from '@/projects/voiceinterface/circle-voice/circleVoice';
import { CIRCLE_FALLBACK } from '@/projects/voiceinterface/circle-voice/api';

/**
 * Discriminated union for orbs loaded from the studio-profiles API.
 * Carries enough metadata for both the live thumbnail strip (id, name,
 * shader for dispatch) and any future editor surface (sourceVariant
 * for save routing, lastModified for sort).
 */
type LoadedOrb =
  | {
      shader: 'coral';
      sourceVariant: 'realtime-coral';
      id: string;
      name: string;
      pinned: boolean;
      /** When true on the active profile, the talking-to-idle intro
       *  animation is suppressed — eased props mount at base values
       *  rather than talking values, no sphere → torus morph plays
       *  on first mount. Reads use `=== true` defensively so
       *  absent / true / false all behave correctly. */
      skipIntroOnSelect?: boolean;
      settings: CoralRealtimeSettings;
      lastModified: number;
    }
  | {
      shader: 'tube';
      sourceVariant: 'realtime-state';
      id: string;
      name: string;
      pinned: boolean;
      skipIntroOnSelect?: boolean;
      settings: LinkedProfile;
      lastModified: number;
    }
  | {
      shader: 'radial';
      sourceVariant: 'radial-states';
      id: string;
      name: string;
      pinned: boolean;
      skipIntroOnSelect?: boolean;
      settings: RadialLinkedProfile;
      lastModified: number;
    }
  | {
      shader: 'circle';
      sourceVariant: 'circle-waveform-voiceset';
      id: string;
      name: string;
      pinned: boolean;
      skipIntroOnSelect?: boolean;
      settings: CircleVoiceProfile;
      lastModified: number;
    };

/** `${sourceVariant}:${id}` — used as React key, dropdown selection,
 *  and localStorage value. Composite because ids are scoped per file
 *  and could collide across files. */
const orbKey = (o: LoadedOrb) => `${o.sourceVariant}:${o.id}`;

/** Slugify a profile name for thumbnail path lookup. "Coral Realtime"
 *  → "coral-realtime". Matches the on-disk convention. */
const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const PLACEHOLDER_THUMB = '/thumbnails/realtime-states/_placeholder.png';
const thumbSrcFor = (orb: LoadedOrb) =>
  `/thumbnails/realtime-states/${slug(orb.name)}.png`;

// Fallback orbs intentionally omit `skipIntroOnSelect` — the field is
// optional on LoadedOrb, and all read sites use `=== true` so the
// missing field reads as off (= intro plays). Don't add the field here
// without also considering the per-shader fallback semantics.
const CORAL_FALLBACK_ORB: LoadedOrb = {
  shader: 'coral',
  sourceVariant: 'realtime-coral',
  id: 'rt-coral-fallback',
  name: 'Coral Realtime',
  pinned: true, // fallbacks are always shown when their file fails
  settings: CORAL_FALLBACK_PROFILE,
  lastModified: 0,
};

const NEBULARR_FALLBACK_ORB: LoadedOrb = {
  shader: 'tube',
  sourceVariant: 'realtime-state',
  id: 'rt-nebularr-fallback',
  name: 'Nebularr',
  pinned: true,
  settings: NEBULARR_FALLBACK_PROFILE,
  lastModified: 0,
};

// CSW-010 (plan §7 #12) — inserted ONLY when there are NO valid circle
// bundles at all (fetch rejected / variant unregistered / unreadable /
// zero entries). NOT inserted merely because valid bundles exist but
// are all un-bookmarked — that would defeat the bookmark-hides-circle
// contract. pinned:true so the fallback shows when its file fails
// (matches CORAL/NEBULARR). The shipped CIRCLE_FALLBACK passes the
// extended integrity gate.
const CIRCLE_FALLBACK_ORB: LoadedOrb = {
  shader: 'circle',
  sourceVariant: 'circle-waveform-voiceset',
  id: 'cv-circle-fallback',
  name: 'Circle Voice',
  pinned: true,
  settings: CIRCLE_FALLBACK,
  lastModified: 0,
};
import { VoiceStateLabel, VoiceStateLabelState } from './ui/VoiceStateLabel';
import { MorphingRecordWideSimple } from './ui/voicemorphingbuttons';
import { ProcessingButtonDark } from './ui/voicebuttons';
import { AudioData } from '../types';
import { AUDIO_BANDS } from '../constants';

/**
 * Variation 4: OpenAI Realtime Voice Chat with Velvet Orb
 *
 * Architecture:
 * - Landscape card: Responsive (max-width: 1000px)
 * - Coral orb: Audio-reactive CoralStoneMorph via RealtimeBlob adapter (252×252px)
 * - State label: Text below orb showing conversation state
 * - Record button: MorphingRecordWideSimple (76×44px pill, white mic/stop icons)
 *
 * Implementation:
 * - Automatic turn-taking: Click once → continuous listening → VAD detects turns
 * - OpenAI Agents SDK (@openai/agents-realtime) with custom WebRTC transport
 * - Shared mic stream (single getUserMedia) for both SDK and visualization
 * - Dual Web Audio API AnalyserNodes: mic input + AI audio output
 * - Ephemeral token authentication
 *
 * Event System (WebRTC mode):
 * - transport_event passthrough gives access to raw API events via data channel
 * - output_audio_buffer.started/stopped: AI speaking state (WebRTC-specific, reliable)
 * - input_audio_buffer.speech_stopped: VAD detects user finished speaking
 * - NOTE: session-level audio_start/audio_stopped do NOT fire in WebRTC mode
 * - See REALTIME_EVENT_SYSTEM_FIX.md for full documentation
 *
 * State Flow:
 * IDLE → LISTENING (mic active) → AI_THINKING (VAD detects silence) → AI_SPEAKING → LISTENING (cycle)
 */

type AppState = 'idle' | 'listening' | 'ai_thinking' | 'ai_speaking';

/** Artificial delay (ms) between user finishing their turn and the AI being
 *  asked to respond. VAD is configured with createResponse: false, so we
 *  manually send response.create after this gate elapses.
 *
 *  Default: 0 — trust the API's real latency. The shader's morphSpeed-based
 *  interpolation in CoralStoneMorph absorbs any timing variance smoothly
 *  (~540ms torus→sphere morph when ai_speaking begins).
 *
 *  Set >0 only if you need a forced minimum thinking phase (e.g. for visual
 *  testing or to mask a slow downstream model). */
const THINKING_GATE_MS = 0;

/**
 * Extract frequency band data from a Web Audio API AnalyserNode.
 */
function getAudioDataFromAnalyser(analyser: AnalyserNode, dataArray: Uint8Array<ArrayBuffer>, sampleRate: number): AudioData {
  analyser.getByteFrequencyData(dataArray);
  const binCount = analyser.frequencyBinCount;

  const getAverage = (minFreq: number, maxFreq: number) => {
    const minBin = Math.floor((minFreq * binCount) / (sampleRate / 2));
    const maxBin = Math.floor((maxFreq * binCount) / (sampleRate / 2));
    let sum = 0, count = 0;
    for (let i = minBin; i <= maxBin; i++) { sum += dataArray[i]; count++; }
    return count > 0 ? sum / count / 255 : 0;
  };

  const bass = getAverage(AUDIO_BANDS.BASS.min, AUDIO_BANDS.BASS.max);
  const mid = getAverage(AUDIO_BANDS.MID.min, AUDIO_BANDS.MID.max);
  const treble = getAverage(AUDIO_BANDS.TREBLE.min, AUDIO_BANDS.TREBLE.max);

  let rms = 0;
  for (let i = 0; i < dataArray.length; i++) { rms += (dataArray[i] / 255) ** 2; }
  rms = Math.sqrt(rms / dataArray.length);

  // Pass the raw frequency array through for shaders that consume it
  // directly (RadialRealtimeBlob). Tube/Coral ignore it. The array
  // reference is shared with the caller's pooled buffer, which is
  // safe because every shader reads from props each frame.
  return { bass, mid, treble, rms, frequencyData: dataArray };
}

export const VoiceRealtimeOpenAI: React.FC = () => {
  // State management
  const [appState, setAppState] = useState<AppState>('idle');
  const [error, setError] = useState<string>('');
  const [isConversationActive, setIsConversationActive] = useState<boolean>(false);
  // v4.2 — orthogonal warming flag. True from Record click until session.connect()
  // resolves (or timeout/error). Controls label ('connecting') + button component
  // swap (ProcessingButtonDark ↔ MorphingRecordWideSimple).
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [orbs, setOrbs] = useState<LoadedOrb[]>([]);
  const [activeOrbKey, setActiveOrbKey] = useState<string | null>(null);

  // v4.2 §2.1 — per-Start run identifier for late-callback race safety.
  // Incremented synchronously at Start entry AND Stop entry. Every post-await
  // checkpoint captures myRunId at call time and compares runIdRef.current
  // before mutating state or firing side-effects. Imperative (not useEffect-
  // derived) so Stop's increment is visible to any in-flight await continuation.
  const runIdRef = useRef<number>(0);

  // Parallel fetch of both shader profile files via Promise.allSettled
  // so a single failure on one variant doesn't erase the other shader's
  // entries. Each shader gets an independent fallback if its list is
  // empty or the request rejects.
  useEffect(() => {
    let cancelled = false;

    const fetchVariant = async (
      variant: 'realtime-coral' | 'realtime-state' | 'radial-states' | 'circle-waveform-voiceset',
      shader: 'coral' | 'tube' | 'radial' | 'circle',
    ): Promise<LoadedOrb[]> => {
      try {
        const r = await fetch(`/api/studio-profiles?variant=${variant}`, { cache: 'no-store' });
        const arr = await r.json();
        if (!Array.isArray(arr)) return [];
        if (shader === 'coral') {
          return arr.map((p) => ({
            shader: 'coral' as const,
            sourceVariant: 'realtime-coral' as const,
            id: p.id,
            name: p.name,
            pinned: p.pinned === true,
            // Pass-through of optional schema field — undefined / true /
            // false all flow through unchanged. Reads use `=== true`.
            skipIntroOnSelect: p.skipIntroOnSelect,
            settings: p.settings as CoralRealtimeSettings,
            lastModified: p.lastModified ?? 0,
          }));
        }
        if (shader === 'radial') {
          // Radial JSON is FLAT — the RadialLinkedProfile sits at the
          // top level (no `settings` wrapper). Project the whole entry
          // into LoadedOrb.settings.
          return arr.map((p) => ({
            shader: 'radial' as const,
            sourceVariant: 'radial-states' as const,
            id: p.id,
            name: p.name,
            pinned: p.pinned === true,
            skipIntroOnSelect: p.skipIntroOnSelect,
            settings: p as RadialLinkedProfile,
            lastModified: p.lastModified ?? 0,
          }));
        }
        if (shader === 'circle') {
          // CSW-010 — circle JSON is FLAT (the CircleVoiceProfile,
          // incl. its own nested 4-state `settings`, sits at the entry
          // top level). Project the whole entry into LoadedOrb.settings.
          return arr.map((p) => ({
            shader: 'circle' as const,
            sourceVariant: 'circle-waveform-voiceset' as const,
            id: p.id,
            name: p.name,
            // The single realtime-states-owned bookmark (plan §0b).
            pinned: p.pinned === true,
            skipIntroOnSelect: p.skipIntroOnSelect,
            settings: p as CircleVoiceProfile,
            lastModified: p.lastModified ?? 0,
          }));
        }
        return arr.map((p) => ({
          shader: 'tube' as const,
          sourceVariant: 'realtime-state' as const,
          id: p.id,
          name: p.name,
          pinned: p.pinned === true,
          skipIntroOnSelect: p.skipIntroOnSelect,
          settings: p.settings as LinkedProfile,
          lastModified: p.lastModified ?? 0,
        }));
      } catch {
        return [];
      }
    };

    Promise.allSettled([
      fetchVariant('realtime-coral', 'coral'),
      fetchVariant('realtime-state', 'tube'),
      fetchVariant('radial-states', 'radial'),
      fetchVariant('circle-waveform-voiceset', 'circle'),
    ]).then(([coralRes, tubeRes, radialRes, circleRes]) => {
      if (cancelled) return;
      const coralOrbs =
        coralRes.status === 'fulfilled' && coralRes.value.length > 0
          ? coralRes.value
          : [CORAL_FALLBACK_ORB];
      const tubeOrbs =
        tubeRes.status === 'fulfilled' && tubeRes.value.length > 0
          ? tubeRes.value
          : [NEBULARR_FALLBACK_ORB];
      const radialOrbs =
        radialRes.status === 'fulfilled' ? radialRes.value : [];
      // CSW-010 (plan §7 #12): the CIRCLE_FALLBACK_ORB is inserted ONLY
      // when there are NO valid circle bundles at all (rejected OR zero
      // entries) — mirrors the coral/tube pattern. When bundles exist
      // (even if ALL un-bookmarked) they're loaded as-is regardless of
      // `pinned`; the global `merged.filter(o => o.pinned)` below + the
      // thumbnail strip then correctly show NONE when all are unpinned,
      // so un-bookmarking the only circle bundle makes circle disappear
      // (no fallback resurrection).
      const circleOrbs =
        circleRes.status === 'fulfilled' && circleRes.value.length > 0
          ? circleRes.value
          : [CIRCLE_FALLBACK_ORB];
      const merged = [...coralOrbs, ...tubeOrbs, ...radialOrbs, ...circleOrbs];
      setOrbs(merged);

      // Live page only shows pinned orbs (explicit opt-in). The default
      // selection considers only pinned candidates.
      const visible = merged.filter((o) => o.pinned);
      const persisted =
        typeof window !== 'undefined'
          ? window.localStorage.getItem('realtime-active-orb-key')
          : null;
      const persistedExists = persisted && visible.find((o) => orbKey(o) === persisted);
      const coralDefault = visible.find((o) => o.name === 'Coral Realtime');
      const fallbackKey = coralDefault
        ? orbKey(coralDefault)
        : visible[0]
        ? orbKey(visible[0])
        : null;
      setActiveOrbKey(persistedExists ? persisted! : fallbackKey);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Persist active orb composite key on change.
  useEffect(() => {
    if (typeof window === 'undefined' || !activeOrbKey) return;
    window.localStorage.setItem('realtime-active-orb-key', activeOrbKey);
  }, [activeOrbKey]);

  // Derive the active orb + the props passed to RealtimeBlob. The
  // RealtimeOrb shape (used by the dispatcher) is a one-line projection
  // of LoadedOrb; this useMemo is the single conversion point between
  // the two unions.
  const activeOrb = useMemo(
    () => orbs.find((o) => orbKey(o) === activeOrbKey) ?? null,
    [orbs, activeOrbKey],
  );
  const realtimeOrb: RealtimeOrb | null = useMemo(() => {
    // Pre-fetch boot: don't render an orb yet. Previously this returned
    // a Coral fallback "so the orb area doesn't blank out for one
    // render," but that caused CoralRealtimeBlob to mount with the
    // fallback profile (which has no talking.scale), so the eased
    // hooks' useState initialized at base values. When the real
    // profile arrived later, useState had already committed; the
    // intro animation never played.
    //
    // Returning null means RealtimeBlob doesn't render until the real
    // activeOrb resolves. The momentary blank (~80–150ms in dev)
    // is a smaller cost than a permanently broken intro.
    if (!activeOrb) return null;
    if (activeOrb.shader === 'coral') {
      return { shader: 'coral', profile: activeOrb.settings };
    }
    if (activeOrb.shader === 'radial') {
      return { shader: 'radial', profile: activeOrb.settings };
    }
    if (activeOrb.shader === 'circle') {
      return { shader: 'circle', profile: activeOrb.settings };
    }
    return { shader: 'tube', profile: activeOrb.settings };
  }, [activeOrb]);

  // Audio visualization state
  const [audioData, setAudioData] = useState<AudioData>({ bass: 0, mid: 0, treble: 0, rms: 0 });
  const audioIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Ref to track appState inside intervals (closures capture stale state)
  const appStateRef = useRef<AppState>('idle');
  useEffect(() => { appStateRef.current = appState; }, [appState]);

  // Refs for OpenAI Realtime session
  const sessionRef = useRef<RealtimeSession | null>(null);
  const agentRef = useRef<RealtimeAgent | null>(null);

  // Refs for Web Audio API (dual analysers)
  const audioContextRef = useRef<AudioContext | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const aiAnalyserRef = useRef<AnalyserNode | null>(null);
  const micDataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const aiDataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Ref for delayed response.create timer
  const thinkingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Diagnostic — baseline performance.now() for the current
  // conversation session. Reset on every handleStartConversation call.
  // Every [TIMING +N ms] log subtracts this baseline so we can see
  // exactly how much wall-clock time each phase of the first round
  // trip takes (click → mic → token → connect → first VAD → response
  // → first audio). Remove once first-time-to-token diagnosis is done.
  const sessionT0Ref = useRef<number>(0);
  const dtNow = () => (performance.now() - sessionT0Ref.current).toFixed(0);

  /**
   * Setup Event Listeners for Session (Automatic Turn-Taking)
   *
   * Uses correct event names for the @openai/agents-realtime SDK:
   * - transport_event: passthrough of ALL raw Realtime API events (for VAD, transcripts)
   * - audio_start: AI starts generating audio (session-level event)
   * - audio_stopped: AI stops generating audio (session-level event)
   * - agent_start / agent_end: response lifecycle (session-level events)
   * - error: connection/session errors
   */
  // v4.2.1 IMR Site 2 — event listeners now accept a captured runId so
  // callbacks bail out if the run has been superseded by Stop or a new Start.
  // Prevents stale SDK events (error, output_audio_buffer.stopped, VAD frames)
  // from mutating UI state that belongs to a different run.
  const setupSessionEventListeners = (session: RealtimeSession, myRunId: number) => {
    const isCurrentRun = () => runIdRef.current === myRunId;
    console.log('[OpenAI Realtime] Setting up event listeners...');

    // --- Raw API events via transport_event passthrough ---
    session.on('transport_event', (event: any) => {
      // v4.2.1 IMR Site 2 — bail out if this event belongs to a superseded run.
      if (!isCurrentRun()) return;
      switch (event.type) {
        case 'input_audio_buffer.speech_started':
          console.log(`[TIMING +${dtNow()}ms] VAD: speech_started`);
          // Cancel pending response.create if user interrupts during thinking
          if (thinkingTimerRef.current) {
            clearTimeout(thinkingTimerRef.current);
            thinkingTimerRef.current = null;
            console.log('[OpenAI Realtime] Thinking cancelled — user interrupted');
          }
          setAppState('listening');
          break;

        case 'input_audio_buffer.speech_stopped':
          console.log(`[TIMING +${dtNow()}ms] VAD: speech_stopped → sending response.create`);
          setAppState('ai_thinking');

          // Clear any existing timer (safety)
          if (thinkingTimerRef.current) clearTimeout(thinkingTimerRef.current);

          // Schedule response.create after minimum thinking duration.
          // VAD is configured with createResponse: false, so the AI won't
          // respond until we explicitly send this event.
          thinkingTimerRef.current = setTimeout(() => {
            thinkingTimerRef.current = null;
            console.log('[OpenAI Realtime] Thinking complete, triggering response...');
            if (sessionRef.current) {
              sessionRef.current.transport.sendEvent({ type: 'response.create' });
            }
          }, THINKING_GATE_MS);
          break;

        case 'output_audio_buffer.started':
          // Fallback for the ai_speaking transition. The primary signal
          // is now the <audio> element's `playing` event (set up in
          // handleStartConversation), which fires when decoded media is
          // audible — earlier and more reliable on the first response
          // of a session (no SCTP cold-start latency). This data-channel
          // event still fires reliably on 2nd+ responses; we keep it as
          // a defensive fallback in case <audio> 'playing' is delayed
          // for any reason. The promotion is idempotent: if we're
          // already in ai_speaking the setState is a no-op.
          console.log(`[TIMING +${dtNow()}ms] output_audio_buffer.started (data-channel signal)`);
          if (appStateRef.current === 'ai_thinking') {
            setAppState('ai_speaking');
          }
          break;

        case 'output_audio_buffer.stopped':
          // Primary state trigger for end of AI speaking in WebRTC mode.
          console.log('[OpenAI Realtime] AI audio playback stopped');
          setAppState('listening');
          break;

        case 'conversation.item.input_audio_transcription.completed':
          console.log('[OpenAI Realtime] User transcript:', event.transcript);
          break;

        case 'response.output_audio_transcript.done':
          console.log('[OpenAI Realtime] AI transcript:', event.transcript);
          break;

        case 'session.created':
          console.log('[OpenAI Realtime] Session created on server');
          break;

        case 'error':
          console.error('[OpenAI Realtime] Raw API error:', event);
          break;
      }
    });

    // --- High-level session events ---

    // NOTE: audio_start / audio_stopped do NOT fire in WebRTC mode.
    // Audio flows through the media track, not data channel chunks.
    // State transitions are handled by output_audio_buffer.started/stopped above.
    // Keeping these as fallback logging in case of future SDK changes.
    session.on('audio_start', () => {
      console.log('[OpenAI Realtime] audio_start (session event, WebSocket-only fallback)');
    });

    session.on('audio_stopped', () => {
      console.log('[OpenAI Realtime] audio_stopped (session event, WebSocket-only fallback)');
    });

    session.on('agent_start', () => {
      console.log('[OpenAI Realtime] Agent started processing');
    });

    session.on('agent_end', () => {
      console.log('[OpenAI Realtime] Agent finished processing');
    });

    session.on('error', (error: any) => {
      console.error('[OpenAI Realtime] Session error:', error);
      // v4.2.1 IMR Site 2 — stale-session error events must NOT clobber
      // a fresh run's UI. Log unconditionally (useful for postmortem);
      // mutate state only if this run is still current.
      if (!isCurrentRun()) return;
      setError('Connection error. Please try again.');
      setAppState('idle');
      setIsConversationActive(false);
    });
  };

  /**
   * Clean up all audio resources (mic stream, analysers, AudioContext, audio element)
   */
  const cleanupAudio = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('[Audio] Mic track stopped:', track.label);
      });
      micStreamRef.current = null;
    }

    if (micAnalyserRef.current) {
      try { micAnalyserRef.current.disconnect(); } catch (_) {}
      micAnalyserRef.current = null;
    }
    if (aiAnalyserRef.current) {
      try { aiAnalyserRef.current.disconnect(); } catch (_) {}
      aiAnalyserRef.current = null;
    }

    micDataArrayRef.current = null;
    aiDataArrayRef.current = null;

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.srcObject = null;
      audioElementRef.current = null;
    }
  };

  /**
   * Start Conversation (Click Once)
   *
   * Sets up: mic capture → dual analysers → custom WebRTC transport → session → connect
   */
  const handleStartConversation = async () => {
    // Diagnostic — reset session timing baseline so every [TIMING +N ms]
    // log below subtracts the click moment. Phases visible: click,
    // mic permission, token fetch, WebRTC handshake, first VAD event,
    // response.create sent, output_audio_buffer.started,
    // <audio> playing event.
    sessionT0Ref.current = performance.now();
    console.log(`[TIMING +${dtNow()}ms] Click Record → starting conversation`);
    // v4.2 §2.1 — imperative per-Start ID. Must be synchronous inside the
    // click handler so Stop's increment is visible to any in-flight await
    // continuation. NO useEffect indirection.
    runIdRef.current += 1;
    const myRunId = runIdRef.current;
    // v4.2.1 IMR Site 2 Minor — helper that wraps a promise in a 6s timeout,
    // captures the timer handle, and clears it on either resolution OR
    // rejection so no timer keeps ticking after the operation settles.
    // The rejection tag ('mic-timeout' / 'connect-timeout') is surfaced in
    // the catch block so the user-facing error message can be specific.
    const withConnectTimeout = <T,>(promise: Promise<T>, tag: string): Promise<T> => {
      let timeoutId: ReturnType<typeof setTimeout>;
      const timeoutPromise = new Promise<never>((_, rej) => {
        timeoutId = setTimeout(() => rej(new Error(tag)), 6000);
      });
      return Promise.race([promise, timeoutPromise]).finally(() => {
        clearTimeout(timeoutId);
      });
    };
    // v4.2 — captured for late-resolve force-close of a Promise.race-
    // abandoned SDK connect (F-10). Not the same as sessionRef.current
    // because Stop may null sessionRef during the await window.
    let localSession: RealtimeSession | null = null;
    try {
      setIsConversationActive(true);
      // v4.2 — was setAppState('listening'); moved to AFTER connect resolves.
      setIsConnecting(true);
      setError('');

      // 1. Create AudioContext
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      if (ctx.state === 'suspended') await ctx.resume();
      // v4.2 guard site #1 — post-ctx.resume()
      if (runIdRef.current !== myRunId) {
        console.log('[OpenAI Realtime] F-8 guard #1 fired (post-ctx.resume) — run superseded');
        return;
      }

      // 2. Capture mic ONCE — shared with SDK and our mic analyser
      // v4.2 (Codex Pass-3 Major) — capture into local binding FIRST, then
      // check runIdRef BEFORE assigning to the ref. If Stop fired during
      // permission-prompt, cleanupAudio ran on a null ref (no-op); a late
      // resolve here would leak the fresh mic stream.
      //
      // v4.2.1 IMR Site 4 — wrap getUserMedia in a 6s timeout too. Plan's
      // §7.4 only covered session.connect, but a hung permission prompt or
      // device-selection stall could park warming indefinitely, violating
      // the UVO NNF "warming lingers >3s with no chime" bound.
      const micStream = await withConnectTimeout(
        navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        }),
        'mic-timeout'
      );
      // v4.2 guard site #2 — post-getUserMedia (with sync track-stop on mismatch)
      if (runIdRef.current !== myRunId) {
        console.log('[OpenAI Realtime] F-8 guard #2 fired (post-getUserMedia) — run superseded');
        micStream.getTracks().forEach(t => t.stop());
        return;
      }
      micStreamRef.current = micStream;
      console.log(`[TIMING +${dtNow()}ms] Microphone captured`);

      // 3. Create mic analyser
      const micSource = ctx.createMediaStreamSource(micStream);
      const micAnalyser = ctx.createAnalyser();
      micAnalyser.fftSize = 2048;
      micAnalyser.smoothingTimeConstant = 0.8;
      micSource.connect(micAnalyser);
      micAnalyserRef.current = micAnalyser;
      micDataArrayRef.current = new Uint8Array(micAnalyser.frequencyBinCount);

      // 4. Create audio element for AI output (SDK's ontrack will set srcObject)
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      audioElementRef.current = audioEl;

      // 5. Set up AI analyser + drive 'ai_speaking' state from media
      //    pipeline (NOT from data-channel events).
      //
      // Bug history: we previously transitioned to 'ai_speaking' only on
      // the data-channel `output_audio_buffer.started` event from
      // transport_event. That signal works fine for the 2nd+ response in
      // a session but lags ~2s behind audible audio on the FIRST response,
      // because WebRTC delivers media (the actual sound) and data-channel
      // events (JSON) over independently-warmed pipelines and the
      // data-channel SCTP stream + OpenAI's first-response server init
      // both pay cold-start cost. The <audio> element's `playing` event
      // fires the instant decoded media is audible, which is the
      // user-perceptible truth on first AND subsequent responses.
      //
      // We still keep `output_audio_buffer.started` as a fallback inside
      // transport_event (no-op if the playing event already promoted),
      // and `output_audio_buffer.stopped` continues to drive the
      // 'ai_speaking' → 'listening' transition because that direction
      // hasn't shown the same first-cycle lag.
      audioEl.addEventListener('playing', () => {
        console.log(`[TIMING +${dtNow()}ms] <audio> element 'playing' event fired`);
        // Promote to ai_speaking the moment audio is audible. Guarded by
        // appStateRef.current so this listener never accidentally drives
        // a transition out of idle/listening for non-AI playback (defence
        // in depth — the <audio> element is only ever used for AI output
        // on this page, but the guard keeps the contract explicit).
        if (appStateRef.current === 'ai_thinking') {
          console.log('[OpenAI Realtime] <audio> playing → ai_speaking (media-pipeline signal)');
          setAppState('ai_speaking');
        }
        if (!aiAnalyserRef.current && audioEl.srcObject && audioContextRef.current) {
          try {
            const aiSource = audioContextRef.current.createMediaStreamSource(audioEl.srcObject as MediaStream);
            const aiAnalyser = audioContextRef.current.createAnalyser();
            aiAnalyser.fftSize = 2048;
            aiAnalyser.smoothingTimeConstant = 0.8;
            aiSource.connect(aiAnalyser);
            // Do NOT connect to destination — the <audio> element already plays
            // the AI audio via autoplay. Connecting here too causes echo/double playback.
            aiAnalyserRef.current = aiAnalyser;
            aiDataArrayRef.current = new Uint8Array(aiAnalyser.frequencyBinCount);
            console.log('[Audio] AI analyser connected');
          } catch (err) {
            console.error('[Audio] Error setting up AI analyser:', err);
          }
        }
      });

      // 6. Start polling audio data at 60fps
      audioIntervalRef.current = setInterval(() => {
        const currentCtx = audioContextRef.current;
        if (!currentCtx) return;

        let data: AudioData = { bass: 0, mid: 0, treble: 0, rms: 0 };

        if (appStateRef.current === 'ai_speaking' && aiAnalyserRef.current && aiDataArrayRef.current) {
          data = getAudioDataFromAnalyser(aiAnalyserRef.current, aiDataArrayRef.current, currentCtx.sampleRate);
        } else if (appStateRef.current === 'listening' && micAnalyserRef.current && micDataArrayRef.current) {
          data = getAudioDataFromAnalyser(micAnalyserRef.current, micDataArrayRef.current, currentCtx.sampleRate);
        }

        setAudioData(data);
      }, 16);

      // 7. Create custom transport with our audioElement and micStream
      const transport = new OpenAIRealtimeWebRTC({
        audioElement: audioEl,
        mediaStream: micStream,
      });

      // 8. Create agent and session with custom transport
      const agent = new RealtimeAgent({
        name: "VoiceAssistant",
        instructions: "You are a friendly, conversational assistant. Keep responses concise and natural, as this is a voice conversation.",
      });
      agentRef.current = agent;

      const session = new RealtimeSession(agent, {
        transport,
        config: {
          audio: {
            input: {
              turnDetection: {
                type: 'semantic_vad',
                createResponse: false, // We manually send response.create after thinking delay
              },
            },
          },
        },
      });
      sessionRef.current = session;
      // v4.2 — capture into local binding so catch's force-close can reach
      // the session even if Stop has nulled sessionRef during the await window.
      localSession = session;

      // 9. Set up event listeners BEFORE connecting
      // v4.2.1 IMR Site 2 — thread myRunId so listeners can bail out on
      // superseded runs.
      setupSessionEventListeners(session, myRunId);

      // 10. Get ephemeral token and connect
      console.log(`[TIMING +${dtNow()}ms] Fetching ephemeral token...`);
      const response = await fetch('/api/voice-interface/openai-realtime-token');
      // v4.2 guard site #3 — post-fetch(token)
      if (runIdRef.current !== myRunId) {
        console.log('[OpenAI Realtime] F-8 guard #3 fired (post-fetch) — run superseded');
        return;
      }
      if (!response.ok) throw new Error(`Failed to get token: ${response.statusText}`);
      const tokenData = await response.json();
      // v4.2 guard site #4 — post-response.json() (async parse)
      if (runIdRef.current !== myRunId) {
        console.log('[OpenAI Realtime] F-8 guard #4 fired (post-response.json) — run superseded');
        return;
      }
      const ephemeralKey = tokenData.key;
      if (!ephemeralKey) throw new Error('No ephemeral token received');
      console.log(`[TIMING +${dtNow()}ms] Got ephemeral token`);

      // v4.2 §7.4 — Promise.race gives us a UI-timeout, NOT a connect-abort.
      // The SDK connect has no cancellation (verified: realtimeSession.d.ts:79-97).
      // On timeout, the race returns to catch; the SDK's connect is still in-
      // flight. The catch's localSession.close() + runIdRef invalidation handle
      // the orphan.
      // v4.2.1 IMR Site 2 Minor — use withConnectTimeout helper so the timer
      // is captured and cleared on success (no idle setTimeout ticking after
      // fast resolve).
      await withConnectTimeout(session.connect({ apiKey: ephemeralKey }), 'connect-timeout');
      console.log(`[TIMING +${dtNow()}ms] session.connect() resolved — WebRTC ready, OpenAI VAD active`);

      // v4.2 guard site #5 — post-Promise.race(session.connect, timeout)
      // F-8 guard: if Stop fired during the connect window OR timeout won
      // and this is a late resolve, myRunId no longer matches. Force-close
      // the SDK session to prevent orphan peer connection.
      if (runIdRef.current !== myRunId) {
        console.log('[OpenAI Realtime] F-8 guard #5 fired (post-connect) — run superseded, force-closing SDK session');
        try { session.close(); } catch { /* SDK may throw on double-close */ }
        return;
      }
      setAppState('listening');
      setIsConnecting(false);
      // Chime is async (await ctx.resume() if suspended). Fire and forget —
      // the visual transition already fired above; chime is defence-in-depth.
      void playConnectChime(ctx);

    } catch (err) {
      // v4.2.1 patch — distinguish EXPECTED failures (mic-timeout /
      // connect-timeout — designed flow, user-visible via setError) from
      // UNEXPECTED failures (real bugs). Only real bugs get console.error;
      // expected timeouts get console.warn. Rationale: Next 15's dev
      // overlay elevates console.error to "Runtime Error" dialogs, which
      // fires on every user-initiated timeout even though the flow is
      // handled correctly. The overlay is prod-clean but dev-noisy;
      // console.warn keeps the audit trail without the false-positive UX.
      const errMsg = err instanceof Error ? err.message : '';
      const isMicTimeout = errMsg === 'mic-timeout';
      const isConnectTimeout = errMsg === 'connect-timeout';
      const isExpectedTimeout = isMicTimeout || isConnectTimeout;
      if (isExpectedTimeout) {
        console.warn('[OpenAI Realtime] Expected timeout:', errMsg);
      } else {
        console.error('[OpenAI Realtime] Error starting conversation:', err);
      }

      // v4.2.1 IMR Site 1 CRITICAL — the catch block itself must be run-id
      // guarded. Otherwise a late timeout (mic-timeout or connect-timeout)
      // or a mid-warming rejection can clobber a NEW Start's state after
      // the user already clicked Stop and re-started.
      //
      // The state mutations are guarded; the resource cleanup runs
      // unconditionally because those resources belong to THIS run
      // regardless of whether it's still current.
      const isCurrentRun = runIdRef.current === myRunId;
      if (isCurrentRun) {
        setError(
          isMicTimeout
            ? 'Microphone timed out — please check your permissions.'
            : isConnectTimeout
              ? 'Connection timed out — please try again.'
              : 'Failed to start conversation. Please check your microphone.'
        );
        setAppState('idle');
        setIsConnecting(false);
        setIsConversationActive(false);
      } else {
        console.log('[OpenAI Realtime] catch fired on superseded run — state mutations skipped');
      }

      // v4.2 F-10 — force-close any SDK session that may still be in-flight
      // after the timeout branch or a mid-connect throw. Runs unconditionally
      // because localSession is scoped to THIS run's closure and must be
      // torn down regardless of whether the run is still current.
      if (localSession) {
        try { localSession.close(); } catch { /* best-effort */ }
      }
      // Invalidate the run only if it's still current — otherwise Stop or
      // Start #2 already invalidated it and we shouldn't stomp their runId.
      if (isCurrentRun) {
        runIdRef.current += 1;
      }

      // Resource cleanup runs unconditionally — this run's interval and
      // audio resources must be released regardless of run-current-ness.
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = null;
      }
      cleanupAudio();
    }
  };

  /**
   * Stop/Clear Conversation (Click Again)
   */
  const handleStopConversation = () => {
    // v4.2 §2.1 — invalidate any in-flight Start synchronously as the FIRST
    // line, before any await, so post-await guards see the mismatch.
    runIdRef.current += 1;
    setIsConnecting(false);
    console.log('[OpenAI Realtime] Stopping conversation...');

    // 1. Stop audio polling and pending thinking timer
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }
    if (thinkingTimerRef.current) {
      clearTimeout(thinkingTimerRef.current);
      thinkingTimerRef.current = null;
    }

    // 2. Close OpenAI session (synchronous — calls transport.close() internally)
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
        console.log('[OpenAI Realtime] Session closed');
      } catch (err) {
        console.error('[OpenAI Realtime] Error closing session:', err);
      }
      sessionRef.current = null;
      agentRef.current = null;
    }

    // 3. Clean up all audio resources
    cleanupAudio();

    // 4. Update UI state LAST
    setIsConversationActive(false);
    setAppState('idle');
    setAudioData({ bass: 0, mid: 0, treble: 0, rms: 0 });
    setError('');
    console.log('[OpenAI Realtime] Cleanup complete, ready for new conversation');
  };

  /**
   * Map app state to VoiceState for Velvet orb
   */
  const getVoiceState = (): VoiceState => {
    if (appState === 'listening') return 'listening';
    if (appState === 'ai_thinking') return 'ai_thinking';
    if (appState === 'ai_speaking') return 'ai_speaking';
    return 'idle';
  };

  /**
   * Map app state to VoiceStateLabelState for text label
   */
  const getLabelState = (): VoiceStateLabelState => {
    // v4.2 — during warming, label shows 'Connecting' regardless of appState
    // (which stays 'idle' during warming per Variant 02 UVO — orb calm).
    if (isConnecting) return 'connecting';
    return appState;
  };

  /**
   * v4.2 §5 — Web Audio synthesised chime played the moment
   * session.connect() resolves. Short ascending sine (440 → 660 Hz),
   * 100ms envelope, peak amplitude 0.24. Uses the same AudioContext
   * created inside handleStartConversation (post-user-gesture — no
   * autoplay-policy issue).
   *
   * Awaits ctx.resume() if suspended (per Codex Pass-2 Major-2: fire-
   * and-forget resume with immediate scheduling on frozen currentTime
   * would replay the envelope as a click when the tab returns).
   */
  const playConnectChime = async (ctx: AudioContext): Promise<void> => {
    try {
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.1);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.24, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    } catch (err) {
      // Silent failure — chime is defence-in-depth; visual signal
      // (setAppState + text swap) is the load-bearing ready cue.
      console.warn('[OpenAI Realtime] Chime playback failed:', err);
    }
  };

  // v4.2 Round B — dev-only handle to test the F-8 late-callback race by
  // force-invoking Stop during warming. Gated behind NODE_ENV so it's
  // dead-code-eliminated in production builds. AC-15: grep the built
  // bundle for __DEBUG_STOP__ to confirm absence.
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      (window as unknown as { __DEBUG_STOP__?: () => void }).__DEBUG_STOP__ = handleStopConversation;
      return () => {
        delete (window as unknown as { __DEBUG_STOP__?: () => void }).__DEBUG_STOP__;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      if (thinkingTimerRef.current) clearTimeout(thinkingTimerRef.current);
      if (sessionRef.current) {
        try { sessionRef.current.close(); } catch (_) {}
      }
      cleanupAudio();
    };
  }, []);

  // Card bg stays at its original --VoiceBoxBg (#F7F6F4) for all
  // profiles — only the page bg behind the card swaps to white.

  return (
    <>
      <div className="voice-realtime-container">
        <div className="voice-realtime-card">
          {/* Orb + Label Group */}
          <div className="orb-label-group">
            {/* Velvet Orb - Audio-reactive visualization */}
            <div className="orb-container">
              {realtimeOrb && (
                <RealtimeBlob
                  audioData={audioData}
                  voiceState={getVoiceState()}
                  orb={realtimeOrb}
                  // Skip-intro flag from the active orb's persisted
                  // schema — when true, the inner blob mounts at base
                  // values rather than talking values (no sphere → torus
                  // morph). Threaded down through RealtimeBlob.
                  skipIntro={activeOrb?.skipIntroOnSelect === true}
                />
              )}
            </div>

            {/* State Label - Text below orb */}
            <div className="state-label-container">
              <VoiceStateLabel state={getLabelState()} />
            </div>
          </div>

          {/* Button Container - Record/Stop button at bottom inside card.
              v4.2 — during warming, swap to ProcessingButtonDark (spinner-
              only pill, 64×38). No `disabled` prop (would freeze the spinner
              per voicebuttons.tsx:1489-1491). No onClick (clicks during
              warming are structurally no-op via handler omission). */}
          <div className="button-container">
            {isConnecting ? (
              // v4.2.1 IMR Site 4 Minor — pass warming-affordance className so
              // the pill's cursor is `default` instead of `pointer` (the
              // component doesn't accept an onClick during warming; the
              // pointer cursor would falsely suggest clickability).
              <ProcessingButtonDark
                isProcessing={true}
                className="warming-affordance"
              />
            ) : (
              <MorphingRecordWideSimple
                state={isConversationActive ? 'recording' : 'idle'}
                onRecordClick={handleStartConversation}
                onStopClick={handleStopConversation}
              />
            )}
          </div>

          {/* Error display */}
          {error && (
            <div className="error-message">{error}</div>
          )}
        </div>

        {/* Profile strip — data-driven from `orbs`, filtered to only
            pinned entries (explicit opt-in via the editor's bookmark
            toggle). Click a thumb to swap the orb. */}
        <div className="profile-strip" aria-label="Orb profiles">
          {orbs.filter((o) => o.pinned).map((thumb) => {
            const key = orbKey(thumb);
            const isActive = activeOrbKey === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveOrbKey(key)}
                className={`profile-thumb ${isActive ? 'is-active' : ''}`}
                aria-label={`Switch to ${thumb.name} orb`}
                aria-pressed={isActive}
              >
                <img
                  src={thumbSrcFor(thumb)}
                  alt=""
                  draggable={false}
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (img.src.endsWith(PLACEHOLDER_THUMB)) return;
                    img.src = PLACEHOLDER_THUMB;
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        /* Container - Centers card on page, stacks card + profile strip */
        .voice-realtime-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 16px;
          width: 100%;
          padding: 20px;
        }

        /* Profile strip — sits below the card. Mirrors the trace
           demo's showcase-sample-strip styling so the two demos
           feel consistent. */
        .profile-strip {
          display: flex;
          flex-direction: row;
          gap: 10px;
          align-items: center;
        }

        .profile-thumb {
          width: 44px;
          height: 44px;
          padding: 0;
          border: 2px solid transparent;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          background: transparent;
          /* No drop shadow — flat by request. */
          opacity: 0.5;
          transition:
            border-color 200ms cubic-bezier(0.23, 1, 0.32, 1),
            box-shadow 200ms cubic-bezier(0.23, 1, 0.32, 1),
            opacity 200ms cubic-bezier(0.23, 1, 0.32, 1),
            transform 100ms cubic-bezier(0.23, 1, 0.32, 1);
        }

        /* Active thumb: a 2px white inner ring (border) + a soft dark
           outer ring (box-shadow as a stroke). The two rings sit
           outside the image so the thumbnail itself isn't touched. */
        .profile-thumb.is-active {
          opacity: 1;
          border-color: #ffffff;
          box-shadow: 0 0 0 2px var(--VoiceDarkGrey_30, rgba(38, 36, 36, 0.3));
        }

        @media (hover: hover) and (pointer: fine) {
          .profile-thumb:not(.is-active):hover {
            opacity: 0.8;
            box-shadow: 0 0 0 2px var(--VoiceDarkGrey_10, rgba(38, 36, 36, 0.1));
          }
        }

        .profile-thumb:active {
          transform: scale(0.97);
        }

        .profile-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          user-select: none;
          -webkit-user-drag: none;
        }

        @media (max-width: 768px) {
          .profile-thumb {
            width: 38px;
            height: 38px;
          }
        }

        /* Card - Landscape layout with orb, label, button */
        .voice-realtime-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          gap: 20px;

          width: 100%;
          max-width: 901px;
          min-height: 566px;
          padding: 60px 20px 30px;

          background: var(--VoiceBoxBg, #F7F6F4);
          border: 1px solid var(--VoiceBoxOutline, #F2F2F2);
          box-shadow: 0px 4px 12px var(--VoiceBoxShadow, rgba(0, 0, 0, 0.06));
          border-radius: 16px;
        }

        /* Orb + Label Group */
        .orb-label-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          /* border: 0.5px solid orange; */ /* DEBUG */
        }

        /* Orb Container — sized 30% larger than the visible blob so
           the Speaking-state morph (larger sphere) doesn't clip at the
           canvas edges. RealtimeBlob compensates via base.scale to keep
           the visible blob the same diameter as the Figma 252px spec. */
        .orb-container {
          flex-shrink: 0;
          width: 328px;
          height: 328px;
          /* border: 0.5px solid red; */ /* DEBUG */
        }

        /* State Label Container */
        .state-label-container {
          flex-shrink: 0;
          width: 100%;
          text-align: center;
          padding: 0 20px;
          /* border: 0.5px solid blue; */ /* DEBUG */
        }

        /* Button Container */
        .button-container {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 44px;
          padding: 0 12px;
          margin-top: 10px;
          /* border: 0.5px solid green; */ /* DEBUG */
        }

        /* v4.2.1 IMR Site 4 Minor — warming-state affordance override.
           Global selector because ProcessingButtonDark's own style block
           sets cursor:pointer inside styled-jsx scope; this deeper
           :global rule wins on cascade. Applied only when the pill
           renders during warming and no onClick is wired. */
        .button-container :global(.processing-button-dark.warming-affordance) {
          cursor: default;
        }

        /* Error Message */
        .error-message {
          margin-top: 8px;
          padding: 12px 20px;
          background: rgba(239, 68, 68, 0.1);
          border-radius: 8px;
          color: var(--VoiceRed, #ef4444);
          font-size: 14px;
          text-align: center;
          width: 100%;
        }

        /* Responsive - Mobile */
        @media (max-width: 768px) {
          .voice-realtime-card {
            padding: 30px 15px 15px;
          }

          .orb-container {
            width: 328px;
            height: 328px;
          }

          .state-label-container {
            padding: 0 15px;
          }
        }
      `}</style>
    </>
  );
};
