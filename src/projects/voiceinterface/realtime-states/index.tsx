/**
 * Realtime-states editor — preview surface for the realtime page's blob states (Tube + Coral shaders).
 *
 * Linked-profile model: idle, listening, thinking-rest, and talking-rest
 * share `profile.base`. Thinking and talking each carry their own peak
 * overrides that diverge only at peak. JS animator owns all motion so
 * state changes (and thinking pulses) glide smoothly with no shader
 * snap. Persists via /api/studio-profiles?variant=realtime-state, with
 * realtime-state-profiles.json at repo root pre-seeded with Kyoto Realtime.
 *
 * Plan: REALTIME_STATES_PLAN.md (v2.4 + patches)
 * File-split refactor: tasks/realtime-states-file-split-plan.md (v7).
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Menu, X, Repeat, ChevronDown, Save, Check, Pause, Play, RotateCcw, RefreshCwOff, Pencil, Bookmark, Disc, Circle } from 'lucide-react';
import GentleOrbThicken from '@/projects/blob-orb/variants/GentleOrbThicken';
import CoralStoneMorph from '@/projects/blob-orb/variants/CoralStoneMorph';
import GalleryAudioControls from '@/projects/blob-orb/components/GalleryAudioControls';
import { audioService } from '@/projects/blob-orb/services/audioService';
import { CURATED_NAMES, GALLERY_API_KEYS } from '@/projects/blob-orb/galleryTypes';
import {
  CORAL_FALLBACK_PROFILE,
  useCoralThinkingPulse,
  useEasedColor,
  useEasedNumber,
} from '@/projects/voiceinterface/components/CoralRealtimeBlob';
import {
  COLOR_FORMATS,
  TUBE_SEED,
  TUBE_INTERNAL_THICKEN_SPEED,
  REALTIME_SEED_NAME,
  SILENT,
  STATES,
} from './constants';
import {
  baseRender,
  compositeKey,
  lerpRender,
  normalizeProfileName,
  pickPeak,
  talkingRenderForProfile,
} from './helpers';
import {
  fetchCoralProfiles,
  fetchProfileNames,
  fetchProfiles,
  persistCoralProfiles,
  persistProfiles,
} from './api';
import {
  ColorPickerButton,
  CoralTabPanel,
  TubeTabPanel,
  type CoralController,
  type TubeController,
} from './controls';
import type {
  AudioData,
  BaselineSnapshot,
  BaseSettings,
  ColorFormat,
  ControlTab,
  CoralRealtimeSettings,
  LinkedProfile,
  LoadedOrb,
  PeakOverrides,
  PeakScope,
  PreviewState,
  RenderValues,
  SavedCoralProfile,
  SavedProfile,
} from './types';

// ── Page ─────────────────────────────────────────────────────────

/**
 * Plan v8 first-paint flash fix (v2.2) — Editor-page skeleton.
 *
 * Rendered by the parent <RealtimeStates> while the cascade is
 * resolving the persisted active orb. Honest "loading" state: a
 * neutral page background + an empty canvas-sized slot. No bottom
 * bar (the real one is position: fixed, so its absence/presence
 * doesn't reflow other content). No profile-dependent content,
 * which means no Tube-vs-Coral flash before cascade applies.
 *
 * Once cascadeReady flips true, parent unmounts the skeleton and
 * mounts <RealtimeStatesEditor> with the resolved activeOrb +
 * activeBaseline as props. The child's useState hooks initialize
 * from real data (no stale-fallback first frame).
 */
const RealtimeStatesSkeleton: React.FC = () => (
  <div
    style={{
      minHeight: '100vh',
      background: '#fafafa',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 24,
      padding: '48px 16px 200px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}
  >
    <div style={{ width: 328, height: 328 }} />
  </div>
);

/**
 * Props passed from <RealtimeStates> (parent — owns the data layer)
 * to <RealtimeStatesEditor> (child — owns visual + animator + JSX).
 *
 * The parent guarantees activeOrb is non-null before mounting the
 * child. activeBaseline is null on initial mount only when fallback
 * resolution failed (degenerate state — shouldn't happen because
 * the seed handler creates a Tube entry on empty fetch).
 */
interface EditorProps {
  activeOrb: LoadedOrb;
  activeBaseline: BaselineSnapshot | null;
  setActiveBaseline: React.Dispatch<React.SetStateAction<BaselineSnapshot | null>>;
  setActiveOrbKey: React.Dispatch<React.SetStateAction<string | null>>;
  tubeProfiles: SavedProfile[];
  setTubeProfiles: React.Dispatch<React.SetStateAction<SavedProfile[]>>;
  coralProfiles: SavedCoralProfile[];
  setCoralProfiles: React.Dispatch<React.SetStateAction<SavedCoralProfile[]>>;
  externalProfileNames: Set<string>;
  colorFormat: ColorFormat;
  setColorFormat: React.Dispatch<React.SetStateAction<ColorFormat>>;
}

function RealtimeStatesEditor({
  activeOrb,
  activeBaseline,
  setActiveBaseline,
  setActiveOrbKey,
  tubeProfiles,
  setTubeProfiles,
  coralProfiles,
  setCoralProfiles,
  externalProfileNames,
  colorFormat,
  setColorFormat,
}: EditorProps) {
  // Replay counter for Coral (forces canvas remount → morphRef resets
  // to 0 → sphere → torus intro replays).
  const [replayCounter, setReplayCounter] = useState(0);
  const [state, setState] = useState<PreviewState>('idle');
  const [autoLoop, setAutoLoop] = useState(false);
  const [audioActive, setAudioActive] = useState(false);
  const [audioData, setAudioData] = useState<AudioData>(SILENT);
  // Plan v2.2 first-paint fix — render lazy-init seeds from the
  // RESOLVED active profile (passed in as a prop). Tube path: render
  // starts at talking values for the active Tube profile so the
  // first paint matches the morph that follows. Coral path: render
  // isn't read by the Coral canvas, but the lazy-init still resolves
  // a sensible value from TUBE_SEED.
  // Skip-intro plan — when activeOrb.skipIntroOnSelect === true, seed
  // render from BASE values rather than talking values so the animator
  // mounts at idle directly (no talking → idle morph). For Coral
  // activeOrb this branch isn't observed (Tube renderer is gated to
  // Tube activeOrb), but we still respect the flag for consistency.
  const [render, setRender] = useState<RenderValues>(() => {
    if (activeOrb.shader === 'tube') {
      return activeOrb.skipIntroOnSelect === true
        ? baseRender(activeOrb.settings.base)
        : talkingRenderForProfile(activeOrb.settings);
    }
    return activeOrb.skipIntroOnSelect === true
      ? baseRender(TUBE_SEED.base)
      : talkingRenderForProfile(TUBE_SEED);
  });
  const [activeTab, setActiveTab] = useState<ControlTab | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  // Phase 3F — two-step Save-as-new-profile dialog. saveStep gates
  // which sub-UI is visible; saveShader is the chosen target shader
  // for the new entry (defaults to the active shader on dialog open).
  const [saveStep, setSaveStep] = useState<'shader' | 'name'>('shader');
  const [saveShader, setSaveShader] = useState<'tube' | 'coral'>('tube');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [thinkingPaused, setThinkingPaused] = useState(false);

  // profileRef initialized to TUBE_SEED; the per-render assignment
  // below syncs it to the derived `profile` value. Step 5 — `profile`
  // moved from useState to useMemo, so the ref initializer + sync had
  // to move below the useMemo declaration.
  const profileRef = useRef<LinkedProfile>(TUBE_SEED);
  const stateRef = useRef(state);
  const renderRef = useRef(render);
  const pulseRef = useRef({ phase: 0, dir: 1 });
  const lastTsRef = useRef(performance.now());
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(thinkingPaused);
  pausedRef.current = thinkingPaused;
  // Talking-exit tau override (mirrors useLinkedProfileAnimator). Set
  // when the previous state was 'talking' and the new state isn't —
  // lets talking → idle settle on talking.settleSpeed instead of the
  // target's own thickenSpeed (which for Nebularr is 0 → instant snap).
  // Init must equal state's default ('idle'). The talking-exit
  // useEffect short-circuits when prev === state (so first-mount and
  // StrictMode double-invocation don't disturb activeTauOverrideRef);
  // that short-circuit relies on this init matching state's default.
  // If state's default changes, this init must follow.
  const previousStateRef = useRef<PreviewState>(state);
  // Plan v2.2 first-paint fix — initialize the talking-exit tau
  // override from the RESOLVED Tube profile so the first morph back
  // to idle uses the correct settle speed. For Coral activeOrb this
  // is null (Coral has its own native morph; this ref isn't read).
  //
  // Skip-intro plan — when the active profile has skipIntroOnSelect on,
  // there's no talking → idle morph to settle, so leave the override
  // null and let the animator use the target's natural thickenSpeed.
  const activeTauOverrideRef = useRef<number | null>(
    activeOrb.shader === 'tube' && activeOrb.skipIntroOnSelect !== true
      ? activeOrb.settings.talking.settleSpeed ?? activeOrb.settings.base.thickenSpeed
      : null,
  );

  stateRef.current = state;
  renderRef.current = render;

  // ── Plan v8 (3D-0 step 1) — derived canonical projections ─────────
  //
  // `orbs` is the unified read-side projection of both source arrays
  // into the LoadedOrb discriminated union. activeOrb is passed in as
  // a prop by the parent (already resolved before this child mounts —
  // see RealtimeStates parent and the cascadeReady gate).
  //
  // DUPLICATE PROJECTION: mirrored in the parent (RealtimeStates). When
  // adding a SavedProfile field, edit BOTH projections. See seam audit
  // §6.1.
  const orbs = useMemo<LoadedOrb[]>(() => {
    const tubeOrbs: LoadedOrb[] = tubeProfiles.map((p) => ({
      shader: 'tube' as const,
      sourceVariant: 'realtime-state' as const,
      id: p.id,
      name: p.name,
      pinned: p.pinned === true,
      // Optional pass-through — undefined / true / false flow through
      // unchanged. Reads use `=== true` defensively.
      skipIntroOnSelect: p.skipIntroOnSelect,
      settings: p.settings,
      lastModified: p.lastModified,
    }));
    const coralOrbs: LoadedOrb[] = coralProfiles.map((p) => ({
      shader: 'coral' as const,
      sourceVariant: 'realtime-coral' as const,
      id: p.id,
      name: p.name,
      pinned: p.pinned === true,
      skipIntroOnSelect: p.skipIntroOnSelect,
      settings: p.settings,
      lastModified: p.lastModified,
    }));
    return [...tubeOrbs, ...coralOrbs];
  }, [tubeProfiles, coralProfiles]);

  // `profile` derives from activeOrb; for Coral activeOrb the Tube
  // tab renderer's `profile.X` bindings fall back to TUBE_SEED (Tube
  // renderer is gated to Tube activeOrb anyway — fallback just
  // prevents crashes).
  const profile = useMemo<LinkedProfile>(() => {
    return activeOrb.shader === 'tube' ? activeOrb.settings : TUBE_SEED;
  }, [activeOrb]);

  // Sync profileRef to the derived `profile` each render so the
  // animator + restartIntro callers see the latest Tube settings.
  profileRef.current = profile;

  const setRenderNow = (next: RenderValues) => {
    renderRef.current = next;
    setRender(next);
  };

  /**
   * Restart the talking → idle intro for the active Tube profile.
   *
   * Side effects (deliberate):
   *   - lastTsRef reset: avoids a stale-mount-time dt on the next RAF
   *     tick. Without this, the first frame after Replay would see
   *     `dt = (now - mountTime)` clamped to 1/30s, producing a visible
   *     jump in render values.
   *   - pulseRef reset: thinking pulse re-enters from rest.
   *   - autoLoop / thinkingPaused: cancelled — Replay is an explicit
   *     manual action, treat as a fresh start.
   *   - activeTauOverrideRef set: ensures animator settles via
   *     talking.settleSpeed even when state is already 'idle' (in which
   *     case setState('idle') is a no-op and the talking-exit effect
   *     never re-fires to set the override).
   *   - previousStateRef = 'talking' (only when state IS changing): if
   *     setState('idle') triggers a re-render, the talking-exit effect
   *     will see prev='talking' and re-arm the override. When state is
   *     already idle, setState is a no-op so this fixup isn't needed.
   *   - setState('idle'): may be a no-op. RELIES on React's state-
   *     equality short-circuit. Don't refactor this to setState((p) =>
   *     'idle') or similar — the no-op behavior is load-bearing.
   *   - setRenderNow(talking): seeds render to talking values; animator
   *     morphs back to base from there.
   */
  const restartIntro = (nextProfile = profileRef.current) => {
    lastTsRef.current = performance.now();
    pulseRef.current = { phase: 0, dir: 1 };
    setAutoLoop(false);
    setThinkingPaused(false);
    activeTauOverrideRef.current =
      nextProfile.talking.settleSpeed ?? nextProfile.base.thickenSpeed;
    if (stateRef.current !== 'idle') {
      previousStateRef.current = 'talking';
    }
    setState('idle');
    setRenderNow(talkingRenderForProfile(nextProfile));
  };

  // First-load fetch, gallery names, color-format localStorage, the
  // cascade-once effect, and the persist-on-change effect all live
  // in the parent <RealtimeStates> component. By the time this child
  // mounts, activeOrbKey + activeBaseline have already been resolved
  // and source arrays are loaded.

  const chooseColorFormat = (format: ColorFormat) => {
    setColorFormat(format);
    window.localStorage.setItem('realtime-states-color-format', format);
  };

  // Plan v2.2 first-paint fix — post-mount restartIntro for Tube
  // activeOrb identity changes. First mount is handled by lazy
  // useState init above (render seeds from activeOrb.settings,
  // activeTauOverrideRef seeds from talking.settleSpeed). Subsequent
  // changes (selectProfile / handleSave / etc. mutate parent state →
  // activeOrb prop changes) trigger restartIntro for Tube only.
  // Coral keeps its existing replayCounter mechanism for explicit
  // Replay; same-shader Coral switching stays prop-only per F1.
  //
  // Skip-intro plan — when the new active profile has the flag on,
  // skip the restartIntro call so the orb settles into the new
  // settings without a talking-shape flash.
  const isFirstEditorRenderRef = useRef(true);
  useEffect(() => {
    if (isFirstEditorRenderRef.current) {
      isFirstEditorRenderRef.current = false;
      return;
    }
    if (activeOrb.shader === 'tube' && activeOrb.skipIntroOnSelect !== true) {
      restartIntro(activeOrb.settings);
    }
  }, [activeOrb.id, activeOrb.shader, activeOrb.skipIntroOnSelect]);

  // Audio data polling
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setAudioData(audioActive ? audioService.getAudioData() : SILENT);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [audioActive]);

  // Auto-loop
  useEffect(() => {
    if (!autoLoop) return;
    const id = setInterval(() => {
      setState((p) => STATES[(STATES.indexOf(p) + 1) % STATES.length]);
    }, 2500);
    return () => clearInterval(id);
  }, [autoLoop]);

  // Audio start: cancel auto-loop, then jump to talking once (§4.4)
  useEffect(() => {
    if (audioActive) {
      setAutoLoop(false);
      setState('talking');
    }
  }, [audioActive]);

  // Leaving thinking clears the paused flag so re-entering resumes pulsing.
  useEffect(() => {
    if (state !== 'thinking') setThinkingPaused(false);
  }, [state]);

  // Talking-exit tau override (mirrors useLinkedProfileAnimator).
  // Only mutates the override on actual state transitions (prev !==
  // state). On first mount and StrictMode double-invocation, prev ===
  // state, so the override stays at its useRef init value — which for
  // Tube + skip-intro off is talking.settleSpeed, used by the cascade
  // morph from talking to idle. Without this guard, profiles with
  // base.thickenSpeed=0 (e.g. Nebularr) collapsed the cascade morph
  // into ~25ms because the override was nulled and the animator fell
  // back to base.thickenSpeed=0.
  useEffect(() => {
    const prev = previousStateRef.current;
    if (prev === state) return;
    const p = profileRef.current;
    if (prev === 'talking' && state !== 'talking') {
      activeTauOverrideRef.current =
        p.talking.settleSpeed ?? p.base.thickenSpeed;
    } else {
      activeTauOverrideRef.current = null;
    }
    previousStateRef.current = state;
  }, [state]);

  // Profile dropdown outside-click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Animator — JS owns all motion (§3).
  //
  // PARALLEL IMPLEMENTATION: this inline animator is functionally
  // equivalent to `useLinkedProfileAnimator` (live page Tube). They
  // diverged for editor-specific needs (replayCounter, talking-exit
  // override, thinking pulse pause). Bugs in either should be checked
  // in both — the Nebularr morph-collapse (commit adc9208) existed
  // here but not in the hook because the hook is mounted with a
  // resolved profile, no first-paint-cascade-with-talking-seed step.
  // See seam audit §6.2.
  useEffect(() => {
    let raf = 0;
    const animate = (ts: number) => {
      const dt = Math.min((ts - lastTsRef.current) / 1000, 1 / 30);
      lastTsRef.current = ts;
      const p = profileRef.current;
      const s = stateRef.current;
      const cur = renderRef.current;

      const baseR = baseRender(p.base);
      const thinkingR = pickPeak(p.thinking, p.base);
      const talkingR = talkingRenderForProfile(p);

      let target: RenderValues;
      if (s === 'idle' || s === 'listening') {
        target = baseR;
      } else if (s === 'talking') {
        target = talkingR;
      } else {
        // Thinking pulse — clock uses effective thinking peak speed (§3.1),
        // not cur.thickenSpeed. When paused, phase doesn't advance.
        if (!pausedRef.current) {
          const pulseSpeed = 1 / Math.max(0.05, thinkingR.thickenSpeed);
          pulseRef.current.phase += dt * pulseSpeed * pulseRef.current.dir;
          if (pulseRef.current.phase >= 1) {
            pulseRef.current.phase = 1;
            pulseRef.current.dir = -1;
          } else if (pulseRef.current.phase <= 0) {
            pulseRef.current.phase = 0;
            pulseRef.current.dir = 1;
          }
        }
        const t = pulseRef.current.phase;
        const eased = t * t * (3 - 2 * t);
        target = lerpRender(baseR, thinkingR, eased);
      }

      // Reset pulse phase whenever state isn't thinking, so re-entering
      // thinking starts cleanly from the rest side. Also clears any
      // paused state so re-entering doesn't start frozen.
      if (s !== 'thinking') {
        pulseRef.current.phase = 0;
        pulseRef.current.dir = 1;
      }

      // Override (when armed) wins over target.thickenSpeed so the
      // talking → idle settle uses talking.settleSpeed instead of
      // base.thickenSpeed (which on Nebularr is 0 → instant snap).
      const tauSpeed = activeTauOverrideRef.current ?? target.thickenSpeed;
      const tau = Math.max(0.05, tauSpeed) * 0.5;
      const alpha = 1 - Math.exp(-dt / tau);
      const next = lerpRender(cur, target, alpha);

      setRender(next);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Cleanup audio on unmount
  useEffect(() => () => audioService.stop(), []);

  // ── Mutators ────────────────────────────────────────────────
  // Plan v8 (3D-0 step 4 + round-7 F4) — slider write paths dual-write
  // to BOTH the Tube profile mirror AND the tubeProfiles source
  // array. Without the source-array write, isDirty's settings
  // comparison runs against stale activeOrb.settings (still equal to
  // baseline) so slider edits would not register as dirty. Spread
  // updates only — no nested in-place mutation.
  const updateActiveTubeSettings = (mutate: (s: LinkedProfile) => LinkedProfile) => {
    if (activeOrb?.shader !== 'tube') return;
    // Step 5 — profile is derived; only the source array needs an
    // immutable update. profile useMemo will recompute from the new
    // tubeProfiles[i].settings on the next render.
    setTubeProfiles((arr) =>
      arr.map((pr) => (pr.id === activeOrb.id ? { ...pr, settings: mutate(pr.settings) } : pr)),
    );
  };

  const setBase = (patch: Partial<BaseSettings>) =>
    updateActiveTubeSettings((p) => ({ ...p, base: { ...p.base, ...patch } }));

  const setPeak = (scope: PeakScope, patch: Partial<PeakOverrides>) =>
    updateActiveTubeSettings((p) => ({ ...p, [scope]: { ...p[scope], ...patch } }));

  const clearPeak = <K extends keyof PeakOverrides>(scope: PeakScope, field: K) =>
    updateActiveTubeSettings((p) => {
      const next = { ...p[scope] };
      delete next[field];
      return { ...p, [scope]: next };
    });

  // Effective getters
  const peakEff = (scope: PeakScope, field: keyof PeakOverrides & keyof BaseSettings): number | string => {
    const ovr = profile[scope][field];
    if (ovr !== undefined) return ovr as number | string;
    return profile.base[field] as number | string;
  };
  const peakHas = (scope: PeakScope, field: keyof PeakOverrides) =>
    profile[scope][field] !== undefined;

  // ── Plan v8 Phase 3D-1 — Coral mutators + peak helpers ────────────
  //
  // Parallel set of write helpers for the Coral D shader. Coral has a
  // single peak slot (`talking`) with its own narrow shape — there's
  // no `thinking` peak (Coral's idle/listening/thinking all render
  // identically). Helpers operate on `coralProfiles[i].settings`
  // immutably (round-7 F4 rule) so dirty detection works against
  // canonical settings, not a stale mirror.
  type CoralBase = CoralRealtimeSettings['base'];
  type CoralTalking = NonNullable<CoralRealtimeSettings['talking']>;

  const updateActiveCoralSettings = (
    mutate: (s: CoralRealtimeSettings) => CoralRealtimeSettings,
  ) => {
    if (activeOrb?.shader !== 'coral') return;
    setCoralProfiles((arr) =>
      arr.map((pr) => (pr.id === activeOrb.id ? { ...pr, settings: mutate(pr.settings) } : pr)),
    );
  };

  const coralSetBase = (patch: Partial<CoralBase>) =>
    updateActiveCoralSettings((s) => ({ ...s, base: { ...s.base, ...patch } }));

  const coralSetPeak = (patch: Partial<CoralTalking>) =>
    updateActiveCoralSettings((s) => ({
      ...s,
      talking: { ...(s.talking ?? {}), ...patch },
    }));

  const coralClearPeak = <K extends keyof CoralTalking>(field: K) =>
    updateActiveCoralSettings((s) => {
      const next: CoralTalking = { ...(s.talking ?? {}) };
      delete next[field];
      return { ...s, talking: next };
    });

  const coralPeakHas = <K extends keyof CoralTalking>(field: K) =>
    activeCoralSettings?.talking?.[field] !== undefined;

  const coralPeakEff = <K extends keyof CoralTalking>(
    field: K,
  ): CoralTalking[K] | CoralBase[K extends keyof CoralBase ? K : never] | undefined => {
    if (!activeCoralSettings) return undefined;
    const ovr = activeCoralSettings.talking?.[field];
    if (ovr !== undefined) return ovr;
    // All Coral talking-peak fields exist on base; safe lookup.
    return (activeCoralSettings.base as Record<string, unknown>)[field as string] as CoralBase[
      K extends keyof CoralBase ? K : never
    ];
  };

  // ── Profile actions ─────────────────────────────────────────
  // Plan v8 round-7 F1 — dirty comparator inspects ONLY settings.
  // Returns false on key/shader mismatch (during cross-shader switch
  // in flight) rather than throwing. Bookmark/rename/Save's
  // lastModified bump cannot mark the editor dirty by construction
  // because they don't touch settings.
  const isDirty = (() => {
    if (!activeOrb || !activeBaseline) return false;
    if (compositeKey(activeOrb) !== activeBaseline.key) return false;
    if (activeOrb.shader !== activeBaseline.shader) return false;
    return JSON.stringify(activeOrb.settings) !== JSON.stringify(activeBaseline.settings);
  })();
  // Plan v8 (3D-0 step 3) — read from canonical `activeOrb`. Mirror
  // reads like `tubeProfiles.find((p) => p.id === activeId)` are no
  // longer needed for these fields; activeOrb already carries name +
  // pinned. Settings-shaped reads still use mirrors below until step 3
  // gets to them.
  const activeName =
    activeOrb?.name ??
    (activeOrb?.shader === 'coral' ? 'Coral Realtime' : REALTIME_SEED_NAME);
  const activePinned = activeOrb?.pinned === true;
  const toggleActivePinned = () => {
    if (!activeOrb) return;
    if (activeOrb.shader === 'coral') {
      togglePinnedCoral(activeOrb.id);
    } else {
      togglePinned(activeOrb.id);
    }
  };

  const profileNameExists = (name: string, exceptId?: string) => {
    const normalized = normalizeProfileName(name);
    if (!normalized) return false;
    if (externalProfileNames.has(normalized)) return true;
    if (tubeProfiles.some((p) => p.id !== exceptId && normalizeProfileName(p.name) === normalized)) {
      return true;
    }
    // Plan v8 (F3): Coral entries must collide with Tube + gallery
    // names AND with each other. Without this check, two Coral
    // entries could be renamed to the same name. id space is shared
    // across Coral + Tube source arrays in practice (uuid-based), so
    // exceptId disambiguation is safe.
    return coralProfiles.some(
      (p) => p.id !== exceptId && normalizeProfileName(p.name) === normalized,
    );
  };

  const pickRealtimeUnusedName = () => {
    // Plan v8 round-6 (F2): suggestion pool must mirror profileNameExists
    // — gallery names + Tube profiles + Coral profiles. Otherwise the
    // helper can hand back a name that already exists in coralProfiles,
    // and the rename-validation flow flips it red the moment the user
    // accepts the suggestion.
    const used = new Set([
      ...Array.from(externalProfileNames),
      ...tubeProfiles.map((p) => normalizeProfileName(p.name)),
      ...coralProfiles.map((p) => normalizeProfileName(p.name)),
    ]);
    const available = CURATED_NAMES.filter((name) => !used.has(normalizeProfileName(name)));
    if (available.length > 0) {
      return available[Math.floor(Math.random() * available.length)];
    }
    const base = 'Realtime Profile';
    let i = tubeProfiles.length + 1;
    while (used.has(normalizeProfileName(`${base} ${i}`))) i += 1;
    return `${base} ${i}`;
  };

  const saveNameInvalid = !saveName.trim() || profileNameExists(saveName);

  const selectProfile = (id: string) => {
    const found = tubeProfiles.find((p) => p.id === id);
    if (!found) return;
    // Step 5 — single canonical write. activeOrb / profile / etc. all
    // derive from activeOrbKey + source arrays. BaselineSnapshot
    // captured via structuredClone (round-7 F1 + F4).
    setActiveOrbKey(`realtime-state:${id}`);
    setActiveBaseline({
      key: `realtime-state:${id}`,
      shader: 'tube',
      settings: structuredClone(found.settings),
    });
    // Skip-intro plan — Tube's selectProfile historically called
    // restartIntro unconditionally, replaying the talking → idle
    // animation on every same-shader select. Skip-intro suppresses
    // that. When the target profile opts in, just settle the active
    // baseline; the post-mount effect that watches activeOrb.id is
    // also gated, so the orb sits at its current state values without
    // a replay flash.
    if (found.skipIntroOnSelect !== true) {
      restartIntro(found.settings);
    }
    setShowProfileDropdown(false);
  };

  const selectCoralProfile = (id: string) => {
    const found = coralProfiles.find((p) => p.id === id);
    if (!found) return;
    setActiveOrbKey(`realtime-coral:${id}`);
    setActiveBaseline({
      key: `realtime-coral:${id}`,
      shader: 'coral',
      settings: structuredClone(found.settings),
    });
    // Plan v8 (F1): same-shader Coral switch is prop-only — no remount,
    // no intro replay. The new profile's settings flow into the
    // already-mounted CoralStoneMorph and the orb smoothly transitions
    // to the new values. Replay button is the only same-shader remount
    // path. Cross-shader switching (Coral ↔ Tube) still remounts
    // naturally because the canvas branches between two component
    // types.
    //
    // Skip-intro is honoured via the eased-hooks `startValue` (see
    // coralStartScale/Wave/Color3 below) — at mount/cross-shader the
    // eased values seed at base instead of talking values, so no
    // sphere → torus animation plays. Same-shader switches don't
    // re-trigger mount, so skip-intro is N/A on that path.
    setShowProfileDropdown(false);
  };

  // Plan v8 (3D-0 step 3) — derive from canonical activeOrb.
  const activeCoralSettings: CoralRealtimeSettings | null =
    activeOrb?.shader === 'coral' ? activeOrb.settings : null;

  // Phase 4B — Coral thinking-pulse RAF, sourced from the same hook
  // that CoralRealtimeBlob uses on the live page. Returns a number
  // while previewState === 'thinking', null otherwise. The editor
  // canvas's Coral branch overrides its static torusRadius prop with
  // this pulse value during thinking. Hook is gated on `isThinking`
  // internally — when activeCoralSettings is null (Tube active), the
  // RAF doesn't run (no allocation, no work).
  const coralPulse = useCoralThinkingPulse({
    isThinking: activeOrb?.shader === 'coral' && state === 'thinking',
    thinRadius: activeCoralSettings?.base.torusRadius ?? 0.275,
    thickRadius: activeCoralSettings?.base.thickRadius,
    pulseSpeed: activeCoralSettings?.base.pulseSpeed,
  });

  // Coral state-prop easing — same pattern as the live page. Targets
  // are computed from activeCoralSettings + state; eased values flow
  // into the canvas's Coral branch. When Tube is active, the targets
  // are coral-fallback values and the eased values are unused — RAFs
  // still run but the work is negligible (one frame per render until
  // they settle).
  const coralIsTalking = state === 'talking';
  const coralTargetScale = coralIsTalking
    ? (activeCoralSettings?.talking?.scale ?? activeCoralSettings?.base.scale ?? CORAL_FALLBACK_PROFILE.base.scale)
    : (activeCoralSettings?.base.scale ?? CORAL_FALLBACK_PROFILE.base.scale);
  const coralTargetWave = coralIsTalking
    ? (activeCoralSettings?.talking?.waveIntensity ?? activeCoralSettings?.base.waveIntensity ?? CORAL_FALLBACK_PROFILE.base.waveIntensity)
    : (activeCoralSettings?.base.waveIntensity ?? CORAL_FALLBACK_PROFILE.base.waveIntensity);
  const coralTargetColor3 = coralIsTalking
    ? (activeCoralSettings?.talking?.color3 ?? activeCoralSettings?.base.color3 ?? CORAL_FALLBACK_PROFILE.base.color3)
    : (activeCoralSettings?.base.color3 ?? CORAL_FALLBACK_PROFILE.base.color3);
  // morphSpeed is direction-aware — mirrors the live page's
  // activeMorphSpeed pattern. Track previous editor state so that
  // when the user clicks the Idle pill from the Talking pill, the
  // morph back to torus uses talking.settleSpeed if set (parity with
  // Tube's settle override pattern).
  const prevCoralStateRef = useRef(state);
  const [coralActiveMorphSpeed, setCoralActiveMorphSpeed] = useState<number>(
    () => activeCoralSettings?.base.morphSpeed ?? CORAL_FALLBACK_PROFILE.base.morphSpeed,
  );
  useEffect(() => {
    if (activeOrb?.shader !== 'coral') {
      // Tube active — morphSpeed isn't used. Don't update.
      prevCoralStateRef.current = state;
      return;
    }
    const wasTalking = prevCoralStateRef.current === 'talking';
    const isCurrentlyTalking = state === 'talking';
    const baseSpeed = activeCoralSettings?.base.morphSpeed ?? CORAL_FALLBACK_PROFILE.base.morphSpeed;
    if (isCurrentlyTalking) {
      setCoralActiveMorphSpeed(activeCoralSettings?.talking?.morphSpeed ?? baseSpeed);
    } else if (wasTalking) {
      setCoralActiveMorphSpeed(activeCoralSettings?.talking?.settleSpeed ?? baseSpeed);
    }
    prevCoralStateRef.current = state;
  }, [
    state,
    activeOrb?.shader,
    activeCoralSettings?.talking?.morphSpeed,
    activeCoralSettings?.talking?.settleSpeed,
    activeCoralSettings?.base.morphSpeed,
  ]);
  const coralTransitionDuration = coralActiveMorphSpeed;

  // startValue mounts the eased values at the TALKING profile's
  // values so the editor's Coral intro shows the same talking →
  // base ease as the live page. resetKey re-runs the intro on:
  //   (a) shader change (tube → coral or fresh mount), and
  //   (b) Replay button click (replayCounter bump).
  // Same-shader profile switch (Coral A → Coral B) does NOT change
  // resetKey — eases smoothly from current to new target instead
  // of replaying the intro, matching the round-7 F1 contract.
  //
  // Skip-intro plan — when the active Coral profile has the flag on,
  // mount the eased values at BASE values rather than talking values,
  // so cross-shader / cascade mounts settle directly at idle (no
  // sphere → torus animation). Replay button still bumps replayCounter
  // unconditionally → resetKey changes → eased values snap back to
  // startValue. The skip-intro flag governs the *startValue*: when on,
  // even a Replay would mount at base — but the Replay button is the
  // user's explicit "play intro" action, so it short-circuits the
  // skip flag inline (see the Replay button onClick handler).
  const skipCoralIntro = activeOrb?.skipIntroOnSelect === true;
  const coralStartScale = skipCoralIntro
    ? (activeCoralSettings?.base.scale ?? CORAL_FALLBACK_PROFILE.base.scale)
    : (activeCoralSettings?.talking?.scale ?? activeCoralSettings?.base.scale ?? CORAL_FALLBACK_PROFILE.base.scale);
  const coralStartWave = skipCoralIntro
    ? (activeCoralSettings?.base.waveIntensity ?? CORAL_FALLBACK_PROFILE.base.waveIntensity)
    : (activeCoralSettings?.talking?.waveIntensity ?? activeCoralSettings?.base.waveIntensity ?? CORAL_FALLBACK_PROFILE.base.waveIntensity);
  const coralStartColor3 = skipCoralIntro
    ? (activeCoralSettings?.base.color3 ?? CORAL_FALLBACK_PROFILE.base.color3)
    : (activeCoralSettings?.talking?.color3 ?? activeCoralSettings?.base.color3 ?? CORAL_FALLBACK_PROFILE.base.color3);
  const coralResetKey = `${activeOrb?.shader ?? 'none'}-${replayCounter}`;

  const coralEasedScale = useEasedNumber(coralTargetScale, coralTransitionDuration, {
    startValue: coralStartScale,
    resetKey: coralResetKey,
  });
  const coralEasedWave = useEasedNumber(coralTargetWave, coralTransitionDuration, {
    startValue: coralStartWave,
    resetKey: coralResetKey,
  });
  const coralEasedColor3 = useEasedColor(coralTargetColor3, coralTransitionDuration, {
    startValue: coralStartColor3,
    resetKey: coralResetKey,
  });

  const handleSave = async () => {
    const name = saveName.trim();
    if (!name || profileNameExists(name)) return;

    // Phase 3F — route by saveShader, not by activeOrb.shader. Same-
    // shader new = clone active settings; cross-shader new = start
    // from the target shader's fallback default.
    const sameShader = saveShader === activeOrb?.shader;

    if (saveShader === 'tube') {
      const settings: LinkedProfile = sameShader
        ? structuredClone(profile)
        : structuredClone(TUBE_SEED);
      const entry: SavedProfile = {
        id: `rt-${crypto.randomUUID()}`,
        name,
        pinned: false,
        settings,
        lastModified: Date.now(),
      };
      const next = [...tubeProfiles, entry];
      setTubeProfiles(next);
      setActiveOrbKey(`realtime-state:${entry.id}`);
      setActiveBaseline({
        key: `realtime-state:${entry.id}`,
        shader: 'tube',
        settings: structuredClone(settings),
      });
      restartIntro(settings);
      closeSaveDialog();
      await persistProfiles(next);
      return;
    }

    // saveShader === 'coral'
    const coralSettings: CoralRealtimeSettings = sameShader
      ? structuredClone(activeCoralSettings ?? CORAL_FALLBACK_PROFILE)
      : structuredClone(CORAL_FALLBACK_PROFILE);
    const coralEntry: SavedCoralProfile = {
      id: `rt-coral-${crypto.randomUUID()}`,
      name,
      pinned: false,
      settings: coralSettings,
      lastModified: Date.now(),
    };
    const nextCoral = [...coralProfiles, coralEntry];
    setCoralProfiles(nextCoral);
    setActiveOrbKey(`realtime-coral:${coralEntry.id}`);
    setActiveBaseline({
      key: `realtime-coral:${coralEntry.id}`,
      shader: 'coral',
      settings: structuredClone(coralSettings),
    });
    closeSaveDialog();
    await persistCoralProfiles(nextCoral);
  };

  const closeSaveDialog = () => {
    setShowSaveDialog(false);
    setSaveName('');
    setSaveStep('shader');
  };

  const beginRename = (entry: SavedProfile) => {
    setRenamingId(entry.id);
    setRenameDraft(entry.name);
  };

  const togglePinned = async (id: string) => {
    // Flip the `pinned` flag on the named Tube profile and
    // persist. Live page picks up the change on next refresh.
    const next = tubeProfiles.map((pr) =>
      pr.id === id ? { ...pr, pinned: !pr.pinned, lastModified: Date.now() } : pr,
    );
    setTubeProfiles(next);
    await persistProfiles(next);
  };

  const togglePinnedCoral = async (id: string) => {
    // Same as togglePinned but routes to the Coral profile file.
    const next = coralProfiles.map((pr) =>
      pr.id === id ? { ...pr, pinned: !pr.pinned, lastModified: Date.now() } : pr,
    );
    setCoralProfiles(next);
    await persistCoralProfiles(next);
  };

  // Skip-intro plan — flip the optional `skipIntroOnSelect` field on
  // the active profile (Tube or Coral). Three runtime states cycle
  // correctly because reads compare with `=== true`:
  //   undefined → true (first toggle on)
  //   true      → false (toggle off)
  //   false     → true (toggle on again)
  // Toggle path writes both directions explicitly; Save-as-new omits
  // the field. Mirrors `toggleActivePinned` — single bottom-bar
  // button that routes to the right shader's source array.
  const toggleActiveSkipIntro = async () => {
    if (!activeOrb) return;
    if (activeOrb.shader === 'coral') {
      const next = coralProfiles.map((pr) =>
        pr.id === activeOrb.id
          ? {
              ...pr,
              skipIntroOnSelect: !(pr.skipIntroOnSelect === true),
              lastModified: Date.now(),
            }
          : pr,
      );
      setCoralProfiles(next);
      await persistCoralProfiles(next);
    } else {
      const next = tubeProfiles.map((pr) =>
        pr.id === activeOrb.id
          ? {
              ...pr,
              skipIntroOnSelect: !(pr.skipIntroOnSelect === true),
              lastModified: Date.now(),
            }
          : pr,
      );
      setTubeProfiles(next);
      await persistProfiles(next);
    }
  };

  const activeSkipIntro = activeOrb?.skipIntroOnSelect === true;

  // Per-id skip-intro toggle for dropdown rows. Same shape as the
  // togglePinned / togglePinnedCoral pair — so the dropdown can show
  // and toggle the flag for every profile (not just the active one).
  // Mirrors how bookmark works: visible per-row + on the bottom bar.
  const toggleSkipIntroOnSelect = async (id: string) => {
    const next = tubeProfiles.map((pr) =>
      pr.id === id
        ? {
            ...pr,
            skipIntroOnSelect: !(pr.skipIntroOnSelect === true),
            lastModified: Date.now(),
          }
        : pr,
    );
    setTubeProfiles(next);
    await persistProfiles(next);
  };

  const toggleSkipIntroOnSelectCoral = async (id: string) => {
    const next = coralProfiles.map((pr) =>
      pr.id === id
        ? {
            ...pr,
            skipIntroOnSelect: !(pr.skipIntroOnSelect === true),
            lastModified: Date.now(),
          }
        : pr,
    );
    setCoralProfiles(next);
    await persistCoralProfiles(next);
  };

  const commitRenameCoral = async (id: string, draft: string) => {
    const name = draft.trim();
    if (!name || profileNameExists(name, id)) return;
    const next = coralProfiles.map((pr) =>
      pr.id === id ? { ...pr, name, lastModified: Date.now() } : pr,
    );
    setCoralProfiles(next);
    cancelRename();
    await persistCoralProfiles(next);
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameDraft('');
  };

  const commitRename = async (id: string, draft: string) => {
    const name = draft.trim();
    if (!name || profileNameExists(name, id)) return;
    const next = tubeProfiles.map((pr) =>
      pr.id === id ? { ...pr, name, lastModified: Date.now() } : pr
    );
    setTubeProfiles(next);
    cancelRename();
    await persistProfiles(next);
  };

  const handleUpdate = async () => {
    if (!isDirty || !activeOrb) return;
    // Phase 3E — route by activeOrb.shader. Tube persists to the
    // realtime-state file; Coral persists to realtime-coral. Same
    // BaselineSnapshot re-snapshot pattern in both branches.
    if (activeOrb.shader === 'tube') {
      const next = tubeProfiles.map((pr) =>
        pr.id === activeOrb.id
          ? { ...pr, settings: profile, lastModified: Date.now() }
          : pr,
      );
      setTubeProfiles(next);
      setActiveBaseline({
        key: `realtime-state:${activeOrb.id}`,
        shader: 'tube',
        settings: structuredClone(profile),
      });
      await persistProfiles(next);
      return;
    }
    // Coral path — slider edits already wrote through to coralProfiles
    // via updateActiveCoralSettings, so the source array is the truth.
    // Just re-snapshot baseline + persist.
    if (activeOrb.shader === 'coral') {
      const currentCoralEntry = coralProfiles.find((p) => p.id === activeOrb.id);
      if (!currentCoralEntry) return;
      const next = coralProfiles.map((pr) =>
        pr.id === activeOrb.id ? { ...pr, lastModified: Date.now() } : pr,
      );
      setCoralProfiles(next);
      setActiveBaseline({
        key: `realtime-coral:${activeOrb.id}`,
        shader: 'coral',
        settings: structuredClone(currentCoralEntry.settings),
      });
      await persistCoralProfiles(next);
    }
  };

  // ── Tab definitions ─────────────────────────────────────────
  const tabs: { key: ControlTab; label: string }[] = [
    { key: 'size', label: 'Size' },
    { key: 'thickness', label: 'Thickness' },
    { key: 'motion', label: 'Motion' },
    { key: 'colours', label: 'Colours' },
  ];

  // ── Controllers (plain object literals; see plan v7 §13) ────
  // No useMemo — `setBase`, `setPeak`, `clearPeak`, `peakHas`, `peakEff`
  // are arrow expressions that get fresh identity every render today,
  // so a useMemo with those as deps would invalidate every render
  // anyway. Adding useMemo would also add hooks at editor scope, which
  // the plan §10 contract forbids. Future tightening (useCallback +
  // useMemo + React.memo) is a separate optimization plan.
  const tubeController: TubeController = {
    profile,
    state,
    setBase,
    setPeak,
    clearPeak,
    peakHas,
    peakEff,
  };
  const coralController: CoralController | null = activeCoralSettings
    ? {
        settings: activeCoralSettings,
        state,
        coralSetBase,
        coralSetPeak,
        coralClearPeak,
        coralPeakHas,
        coralPeakEff,
      }
    : null;

  // Bottom swatch behavior: Rest on idle/listening, Peak on thinking/talking
  const swatchValue = (i: 0 | 1 | 2): string => {
    const key = (['color1', 'color2', 'color3'] as const)[i];
    if (state === 'idle' || state === 'listening') return profile.base[key];
    const scope: PeakScope = state === 'thinking' ? 'thinking' : 'talking';
    return (profile[scope][key] ?? profile.base[key]) as string;
  };
  const swatchSet = (i: 0 | 1 | 2, v: string) => {
    const key = (['color1', 'color2', 'color3'] as const)[i];
    if (state === 'idle' || state === 'listening') {
      setBase({ [key]: v });
      return;
    }
    const scope: PeakScope = state === 'thinking' ? 'thinking' : 'talking';
    setPeak(scope, { [key]: v });
  };

  const toggleTab = (tab: ControlTab) => {
    if (expanded) return;
    setActiveTab((p) => (p === tab ? null : tab));
  };

  const blobAudioData = audioActive && state !== 'idle' ? audioData : SILENT;

  // Page bg sources from the active shader's profile so swapping a
  // Coral entry tints the whole editor with its bgColor.
  // Plan v8 (3D-0 step 3) — read from activeOrb. The path is uniform
  // since both shader settings types expose `base.bgColor` at the same
  // path (deliberate design from v4).
  // Radial profiles store bgColor at `display.bgColor`; Tube/Coral
  // store it at `base.bgColor`. Narrow before access.
  const activeBgColor =
    activeOrb?.shader === 'radial'
      ? activeOrb.settings.display.bgColor
      : (activeOrb?.settings.base.bgColor ?? profile.base.bgColor);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: activeBgColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
        padding: '48px 16px 200px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <GalleryAudioControls onAudioActive={setAudioActive} />

      {/* Canvas size matches production /voiceinterface/realtime (RealtimeBlob.tsx:53).
          Dispatches by activeOrb.shader: GentleOrbThicken for Tube
          (driven by the existing JS animator's `render` state), or
          CoralStoneMorph for Coral D (driven by its native morph
          animator with state-aware effective values). */}
      <div style={{ width: 328, height: 328 }}>
        <Canvas
          camera={{ position: [0, 0, 3.5], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true }}
        >
          <color
            attach="background"
            args={[activeBgColor]}
          />
          <ambientLight intensity={0.5} />
          {activeOrb?.shader === 'coral' && activeCoralSettings ? (
            (() => {
              const isTalking = state === 'talking';
              const baseS = activeCoralSettings.base;
              // effMorphSpeed comes from coralActiveMorphSpeed at top
              // of component scope — direction-aware (talking.morphSpeed
              // entering, talking.settleSpeed exiting, base.morphSpeed
              // otherwise). Mirrors CoralRealtimeBlob's logic on the
              // live page so editor preview matches production
              // behavior.
              const effMorphSpeed = coralActiveMorphSpeed;
              return (
                <CoralStoneMorph
                  // Plan v8 (F1): key is replayCounter only — NOT
                  // activeCoralId. Same-shader Coral A → Coral B is
                  // prop-only (no remount, no intro). Replay button
                  // bumps replayCounter and is the sole same-shader
                  // remount path.
                  key={`coral-${replayCounter}`}
                  audioData={blobAudioData}
                  goal={isTalking ? 0 : 1}
                  scale={coralEasedScale}
                  morphSpeed={Math.max(0.001, effMorphSpeed)}
                  torusRadius={coralPulse ?? baseS.torusRadius}
                  waveIntensity={coralEasedWave}
                  breathAmp={baseS.breathAmp}
                  idleAmp={baseS.idleAmp}
                  color1={baseS.color1}
                  color2={baseS.color2}
                  color3={coralEasedColor3}
                  // Skip-intro: mount at torus when the active profile
                  // opts out of the intro. Replay always re-renders with
                  // skipCoralIntro=false (button is disabled when on),
                  // so this branch only fires on cascade / cross-shader.
                  initialMorph={skipCoralIntro ? 1 : 0}
                />
              );
            })()
          ) : (
            // Tube morph architecture: visible animation lives in
            // `render.thickRadius` (driven by the JS animator at
            // ~L380), not in GentleOrbThicken's internal thicken
            // animator. We pin `goal={1}` and use a near-instant
            // thickenSpeed so the internal animator converges
            // immediately and stops contributing. Don't change without
            // understanding the asymmetry vs Coral (which animates
            // goal=0/1 internally). See seam audit §4.1.
            <GentleOrbThicken
              audioData={blobAudioData}
              goal={1}
              scale={render.scale}
              thinRadius={profile.base.thinRadius}
              thickRadius={render.thickRadius}
              thickenSpeed={TUBE_INTERNAL_THICKEN_SPEED}
              waveIntensity={render.waveIntensity}
              waveCount={render.waveCount}
              breathAmp={render.breathAmp}
              idleAmp={render.idleAmp}
              color1={render.color1}
              color2={render.color2}
              color3={render.color3}
            />
          )}
        </Canvas>
      </div>

      {/* Bottom bar (mirrors GalleryNavBar) */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        {/* Single-tab popover — shader-aware (round-7 F5 gate flip).
            Dispatches to the appropriate per-shader tab panel based
            on activeOrb.shader. Hidden when no orb is selected. */}
        {activeOrb && !expanded && activeTab && (
          <div className="absolute bottom-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg max-h-[50vh] overflow-y-auto">
            <div className="max-w-3xl mx-auto p-4">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                {tabs.find((t) => t.key === activeTab)?.label} — {state}
              </h3>
              {activeOrb.shader === 'coral' && coralController ? (
                <CoralTabPanel
                  tab={activeTab}
                  controller={coralController}
                  colorFormat={colorFormat}
                  onColorFormatChange={chooseColorFormat}
                />
              ) : (
                <TubeTabPanel
                  tab={activeTab}
                  controller={tubeController}
                  colorFormat={colorFormat}
                  onColorFormatChange={chooseColorFormat}
                />
              )}
            </div>
          </div>
        )}

        {/* Expanded 4-column drawer — shader-aware. */}
        {activeOrb && expanded && (
          <div className="absolute bottom-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg max-h-[60vh] overflow-y-auto">
            <div className="max-w-6xl mx-auto p-4">
              <div className="text-[11px] uppercase tracking-wider text-gray-400 mb-2">
                Editing: {state}
              </div>
              <div className="flex gap-6 flex-wrap">
                {tabs.map((tab) => (
                  <div key={tab.key} className="flex-1 min-w-[220px]">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                      {tab.label}
                    </h3>
                    {activeOrb.shader === 'coral' && coralController ? (
                      <CoralTabPanel
                        tab={tab.key}
                        controller={coralController}
                        colorFormat={colorFormat}
                        onColorFormatChange={chooseColorFormat}
                      />
                    ) : (
                      <TubeTabPanel
                        tab={tab.key}
                        controller={tubeController}
                        colorFormat={colorFormat}
                        onColorFormatChange={chooseColorFormat}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main bar */}
        <div className="bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setExpanded((p) => !p);
                setActiveTab(null);
              }}
              className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              {expanded ? <X size={14} /> : <Menu size={14} />}
            </button>

            <div className="w-px h-6 bg-gray-200" />

            {/* State pills */}
            <div className="flex items-center gap-1">
              {STATES.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setAutoLoop(false);
                    setState(s);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                    state === s
                      ? 'bg-gray-800 text-white border-gray-800'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="w-px h-6 bg-gray-200" />

            {/* Profile dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileDropdown((p) => !p)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer min-w-[100px]"
              >
                {activeOrb?.shader === 'coral' ? (
                  <Circle size={11} className="shrink-0 text-[#ffa279]" aria-label="Coral D profile" />
                ) : (
                  <Disc size={11} className="shrink-0 text-[#949e05]" aria-label="Tube profile" />
                )}
                <span className="truncate text-gray-600 max-w-[120px]">{activeName}</span>
                <ChevronDown size={12} className="text-gray-400 shrink-0" />
              </button>
              {showProfileDropdown && (
                <div className="absolute bottom-full left-0 mb-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {tubeProfiles.map((p) => {
                    const isRenaming = renamingId === p.id;
                    const renameInvalid = !renameDraft.trim() || profileNameExists(renameDraft, p.id);

                    return (
                      <div
                        key={p.id}
                        className={`min-h-[32px] px-3 py-1.5 text-xs hover:bg-gray-50 ${
                          activeOrb?.shader === 'tube' && p.id === activeOrb.id
                            ? 'font-medium text-gray-700'
                            : 'text-gray-600'
                        } ${isRenaming ? '' : 'cursor-pointer'}`}
                        onClick={() => {
                          if (!isRenaming) selectProfile(p.id);
                        }}
                      >
                        {isRenaming ? (
                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={renameDraft}
                              onChange={(e) => setRenameDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitRename(p.id, renameDraft);
                                if (e.key === 'Escape') cancelRename();
                              }}
                              className={`min-w-0 flex-1 px-2 py-1 text-xs border rounded-md outline-none focus:border-gray-400 ${
                                renameInvalid ? 'border-red-200' : 'border-gray-200'
                              }`}
                              autoFocus
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                commitRename(p.id, renameDraft);
                              }}
                              disabled={renameInvalid}
                              className={`transition-colors ${
                                renameInvalid
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-gray-500 hover:text-green-600 cursor-pointer'
                              }`}
                              title="Save name"
                            >
                              <Check size={13} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                cancelRename();
                              }}
                              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                              title="Cancel rename"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Disc
                              size={11}
                              className="shrink-0 text-[#949e05]"
                              aria-label="Tube profile"
                            />
                            <span className="min-w-0 flex-1 truncate">{p.name}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePinned(p.id);
                              }}
                              className={`shrink-0 transition-colors cursor-pointer ${
                                p.pinned
                                  ? 'text-amber-500 hover:text-amber-600'
                                  : 'text-gray-300 hover:text-gray-600'
                              }`}
                              title={p.pinned ? 'Pinned to live page (click to unpin)' : 'Pin to live page'}
                            >
                              <Bookmark
                                size={12}
                                fill={p.pinned ? 'currentColor' : 'none'}
                              />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSkipIntroOnSelect(p.id);
                              }}
                              className={`shrink-0 transition-colors cursor-pointer ${
                                p.skipIntroOnSelect === true
                                  ? 'text-amber-500 hover:text-amber-600'
                                  : 'text-gray-300 hover:text-gray-600'
                              }`}
                              title={
                                p.skipIntroOnSelect === true
                                  ? 'Skip-intro on (click to enable intro)'
                                  : 'Skip the talking-to-idle intro for this profile'
                              }
                            >
                              <RefreshCwOff size={12} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                beginRename(p);
                              }}
                              className="shrink-0 text-gray-300 hover:text-gray-600 transition-colors cursor-pointer"
                              title="Rename profile"
                            >
                              <Pencil size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {/* Coral D entries from realtime-coral-profiles.json.
                      Selecting a Coral row currently shows a no-op
                      placeholder — full Coral preview + controls
                      arrive in a later phase. Bookmark + rename work
                      end-to-end and route to the Coral file. */}
                  {coralProfiles.map((p) => {
                    const isRenaming = renamingId === p.id;
                    const renameInvalid = !renameDraft.trim() || profileNameExists(renameDraft, p.id);
                    return (
                      <div
                        key={p.id}
                        className={`min-h-[32px] px-3 py-1.5 text-xs hover:bg-gray-50 ${
                          activeOrb?.shader === 'coral' && p.id === activeOrb.id
                            ? 'font-medium text-gray-700'
                            : 'text-gray-600'
                        } ${isRenaming ? '' : 'cursor-pointer'}`}
                        onClick={() => {
                          if (!isRenaming) selectCoralProfile(p.id);
                        }}
                      >
                        {isRenaming ? (
                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={renameDraft}
                              onChange={(e) => setRenameDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitRenameCoral(p.id, renameDraft);
                                if (e.key === 'Escape') cancelRename();
                              }}
                              className={`min-w-0 flex-1 px-2 py-1 text-xs border rounded-md outline-none focus:border-gray-400 ${
                                renameInvalid ? 'border-red-200' : 'border-gray-200'
                              }`}
                              autoFocus
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                commitRenameCoral(p.id, renameDraft);
                              }}
                              disabled={renameInvalid}
                              className={`transition-colors ${
                                renameInvalid
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-gray-500 hover:text-green-600 cursor-pointer'
                              }`}
                              title="Save name"
                            >
                              <Check size={13} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                cancelRename();
                              }}
                              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                              title="Cancel rename"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Circle
                              size={11}
                              className="shrink-0 text-[#ffa279]"
                              aria-label="Coral D profile"
                            />
                            <span className="min-w-0 flex-1 truncate">{p.name}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePinnedCoral(p.id);
                              }}
                              className={`shrink-0 transition-colors cursor-pointer ${
                                p.pinned
                                  ? 'text-amber-500 hover:text-amber-600'
                                  : 'text-gray-300 hover:text-gray-600'
                              }`}
                              title={p.pinned ? 'Pinned to live page (click to unpin)' : 'Pin to live page'}
                            >
                              <Bookmark
                                size={12}
                                fill={p.pinned ? 'currentColor' : 'none'}
                              />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSkipIntroOnSelectCoral(p.id);
                              }}
                              className={`shrink-0 transition-colors cursor-pointer ${
                                p.skipIntroOnSelect === true
                                  ? 'text-amber-500 hover:text-amber-600'
                                  : 'text-gray-300 hover:text-gray-600'
                              }`}
                              title={
                                p.skipIntroOnSelect === true
                                  ? 'Skip-intro on (click to enable intro)'
                                  : 'Skip the talking-to-idle intro for this profile'
                              }
                            >
                              <RefreshCwOff size={12} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                beginRename(p as unknown as SavedProfile);
                              }}
                              className="shrink-0 text-gray-300 hover:text-gray-600 transition-colors cursor-pointer"
                              title="Rename profile"
                            >
                              <Pencil size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="w-px h-6 bg-gray-200" />

            {/* Tab buttons — shader-aware. Both Tube and Coral show
                tabs; the Coral renderer (CoralTabPanel) handles its
                own slider set per state pill. */}
            <div className="flex items-center gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => toggleTab(tab.key)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    activeTab === tab.key
                      ? 'bg-gray-100 text-gray-800'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Bottom swatches — Tube-only per round-7 F8. Coral users
                edit colours from the Colours tab. */}
            {activeOrb?.shader === 'tube' && (
              <div className="flex items-center gap-1 ml-2">
                {([0, 1, 2] as const).map((i) => (
                  <ColorPickerButton
                    key={i}
                    value={swatchValue(i)}
                    colorFormat={colorFormat}
                    onChange={(v) => swatchSet(i, v)}
                    onColorFormatChange={chooseColorFormat}
                    title={state === 'idle' || state === 'listening' ? 'Rest' : 'Peak'}
                    swatchClassName="h-6 w-6 rounded-full"
                  />
                ))}
              </div>
            )}

            {/* Pause / resume thinking pulse — only visible while thinking */}
            {state === 'thinking' && (
              <button
                onClick={() => setThinkingPaused((p) => !p)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ml-2 ${
                  thinkingPaused
                    ? 'bg-amber-50 text-amber-600 border border-amber-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
                title={thinkingPaused ? 'Resume pulse' : 'Pause pulse'}
              >
                {thinkingPaused ? <Play size={14} /> : <Pause size={14} />}
              </button>
            )}

            {/* Pin / unpin the active profile to the live realtime page.
                Mirrors the bookmark inside the dropdown row but is
                always reachable without opening the dropdown. */}
            <button
              onClick={toggleActivePinned}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ml-2 ${
                activePinned
                  ? 'bg-amber-50 text-amber-500 hover:text-amber-600'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
              }`}
              title={activePinned ? 'Pinned to live page (click to unpin)' : 'Pin active profile to live page'}
            >
              <Bookmark size={14} fill={activePinned ? 'currentColor' : 'none'} />
            </button>

            {/* Skip-intro toggle — when on, the talking → idle intro
                animation is suppressed every time this profile mounts
                (cascade-on-load, cross-shader switch, Tube selectProfile).
                Replay button is unaffected — explicit user action still
                plays the intro. Per-profile, both shaders. Mirrors the
                Pin button pattern: bottom-bar UI acts on the active
                profile, persists immediately. */}
            <button
              onClick={toggleActiveSkipIntro}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ml-2 ${
                activeSkipIntro
                  ? 'bg-amber-50 text-amber-500 hover:text-amber-600'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
              }`}
              title={
                activeSkipIntro
                  ? 'Skip-intro on — talking-to-idle intro is suppressed when this profile mounts (click to enable intro)'
                  : 'Skip the talking-to-idle intro for this profile'
              }
            >
              <RefreshCwOff size={14} />
            </button>

            {/* Replay first-load talking → idle intro for the active
                profile. Branches by shader: Tube uses the existing JS
                animator's seed-render trick; Coral forces previewState
                to idle (so goal=1) and bumps replayCounter to remount
                the canvas → morphRef resets to 0 → sphere → torus
                intro plays via Coral's native animator.
                Skip-intro gate: when the active profile has
                skipIntroOnSelect on, the intro animation is
                conceptually disabled — Replay is greyed out + disabled
                so it can't fire the morph that the user just opted
                out of. To re-enable Replay, toggle skip-intro off. */}
            <button
              onClick={() => {
                if (activeOrb?.shader === 'coral') {
                  setState('idle');
                  setReplayCounter((c) => c + 1);
                } else {
                  restartIntro();
                }
              }}
              disabled={activeSkipIntro}
              className={`p-1.5 rounded-lg transition-colors ml-2 ${
                activeSkipIntro
                  ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 cursor-pointer'
              }`}
              title={
                activeSkipIntro
                  ? 'Replay disabled — skip-intro is on for this profile (toggle off to re-enable)'
                  : 'Replay talking-to-idle intro'
              }
            >
              <RotateCcw size={14} />
            </button>

            {/* Auto-loop through states (idle → listening → thinking → talking, every 2.5s) */}
            <button
              onClick={() => setAutoLoop((p) => !p)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ml-2 ${
                autoLoop
                  ? 'bg-amber-50 text-amber-600 border border-amber-200'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
              title="Cycle through states (2.5s each)"
            >
              <Repeat size={14} />
            </button>

            <div className="flex-1" />

            {/* Discard + Update — shader-aware (Phase 3E). Both shaders
                use the same BaselineSnapshot dirty contract; routing
                differs only in which source array + persist endpoint
                gets the write. */}
            {isDirty && (
              <>
                <button
                  onClick={() => {
                    // Plan v8 round-7 F1 — Discard runs the inverse of
                    // a baseline capture: clone baseline.settings back
                    // into active source array, leaving baseline
                    // untouched. Active becomes equal to baseline by
                    // clone, isDirty returns false.
                    if (!activeOrb || !activeBaseline) return;
                    if (activeOrb.shader !== activeBaseline.shader) return;
                    if (activeOrb.shader === 'tube' && activeBaseline.shader === 'tube') {
                      const reverted = structuredClone(activeBaseline.settings);
                      // profile is derived; only the source array
                      // needs to be updated. profile useMemo will
                      // recompute on next render.
                      setTubeProfiles((arr) =>
                        arr.map((pr) => (pr.id === activeOrb.id ? { ...pr, settings: reverted } : pr)),
                      );
                    } else if (activeOrb.shader === 'coral' && activeBaseline.shader === 'coral') {
                      const reverted = structuredClone(activeBaseline.settings);
                      setCoralProfiles((arr) =>
                        arr.map((pr) => (pr.id === activeOrb.id ? { ...pr, settings: reverted } : pr)),
                      );
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer flex items-center gap-1"
                  title="Discard unsaved edits and reset to last saved"
                >
                  <RotateCcw size={12} />
                  Discard
                </button>
                <button
                  onClick={handleUpdate}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  Update
                </button>
              </>
            )}

            {/* Save — Phase 3F two-step shader-choice modal. */}
            {showSaveDialog ? (
              saveStep === 'shader' ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-gray-500 uppercase tracking-wider">Shader:</span>
                  <button
                    onClick={() => {
                      setSaveShader('tube');
                      setSaveName(pickRealtimeUnusedName());
                      setSaveStep('name');
                    }}
                    className="px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5 border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  >
                    <Disc size={11} className="text-[#949e05]" />
                    Tube
                  </button>
                  <button
                    onClick={() => {
                      setSaveShader('coral');
                      setSaveName(pickRealtimeUnusedName());
                      setSaveStep('name');
                    }}
                    className="px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5 border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  >
                    <Circle size={11} className="text-[#ffa279]" />
                    Coral
                  </button>
                  <button
                    onClick={closeSaveDialog}
                    className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  {saveShader === 'coral' ? (
                    <Circle size={11} className="text-[#ffa279]" />
                  ) : (
                    <Disc size={11} className="text-[#949e05]" />
                  )}
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSave();
                      if (e.key === 'Escape') closeSaveDialog();
                    }}
                    placeholder="Profile name"
                    className={`w-28 px-2 py-1 text-xs border rounded-lg outline-none focus:border-gray-400 ${
                      saveNameInvalid ? 'border-red-200' : 'border-gray-200'
                    }`}
                    autoFocus
                  />
                  <button
                    onClick={handleSave}
                    disabled={saveNameInvalid}
                    className={`transition-colors ${
                      saveNameInvalid
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-500 hover:text-green-600 cursor-pointer'
                    }`}
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={closeSaveDialog}
                    className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              )
            ) : (
              <button
                onClick={() => {
                  // Save dialog currently offers Tube and Coral only.
                  // Radial save support lands in a follow-up; default to
                  // tube when activeOrb is radial.
                  setSaveShader(activeOrb?.shader === 'coral' ? 'coral' : 'tube');
                  setSaveStep('shader');
                  setShowSaveDialog(true);
                }}
                className="p-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                title="Save as new profile"
              >
                <Save size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Parent component (default export). Owns the data layer + cascade
 * + cascadeReady gate. Renders <RealtimeStatesSkeleton /> until the
 * cascade resolves the persisted active orb, then mounts
 * <RealtimeStatesEditor> with the resolved data as props.
 *
 * Plan v8 first-paint flash fix v2.2 — child only mounts when
 * `activeOrb` is non-null and `cascadeReady === true`. The child's
 * eased hooks therefore initialize from real data on first render
 * (no stale-fallback frame).
 */
export default function RealtimeStates() {
  const [tubeProfiles, setTubeProfiles] = useState<SavedProfile[]>([]);
  const [coralProfiles, setCoralProfiles] = useState<SavedCoralProfile[]>([]);
  // Per-source loaded flags. Cascade waits for BOTH so a persisted
  // key in either file resolves regardless of which fetch wins the
  // race. (Round-7 round-3 fix.)
  const [tubeLoaded, setTubeLoaded] = useState(false);
  const [coralLoaded, setCoralLoaded] = useState(false);
  // activeOrbKey starts null. Cascade fills it. The child mounts
  // only after activeOrb resolves to non-null AND cascadeReady is
  // true.
  const [activeOrbKey, setActiveOrbKey] = useState<string | null>(null);
  const [activeBaseline, setActiveBaseline] = useState<BaselineSnapshot | null>(null);
  const [cascadeReady, setCascadeReady] = useState(false);
  const [externalProfileNames, setExternalProfileNames] = useState<Set<string>>(new Set());
  // Plan v2.2 round-3 F4 — colorFormat lazy-init reads localStorage
  // synchronously so first paint matches the persisted format. The
  // old useEffect that read localStorage post-mount caused a brief
  // HEX-flash for HSL/HSB users.
  const [colorFormat, setColorFormat] = useState<ColorFormat>(() => {
    if (typeof window === 'undefined') return 'hex';
    const stored = window.localStorage.getItem('realtime-states-color-format');
    return stored && COLOR_FORMATS.includes(stored as ColorFormat)
      ? (stored as ColorFormat)
      : 'hex';
  });

  // First-load: fetch both source files in parallel. The cascade
  // useEffect below waits until BOTH flip true.
  useEffect(() => {
    fetchProfiles().then(async (arr) => {
      if (arr.length === 0) {
        const seedEntry: SavedProfile = {
          id: 'rt-kyoto',
          name: REALTIME_SEED_NAME,
          settings: TUBE_SEED,
          lastModified: Date.now(),
        };
        const next = [seedEntry];
        await persistProfiles(next);
        setTubeProfiles(next);
      } else {
        setTubeProfiles(arr);
      }
      setTubeLoaded(true);
    });
    fetchCoralProfiles().then((arr) => {
      setCoralProfiles(arr);
      setCoralLoaded(true);
    });
  }, []);

  // Gallery names for cross-source name-collision validation.
  useEffect(() => {
    Promise.all(Object.values(GALLERY_API_KEYS).map(fetchProfileNames)).then((groups) => {
      setExternalProfileNames(new Set(groups.flat().map(normalizeProfileName)));
    });
  }, []);

  // Derived orbs list (passed to child as activeOrb prop after
  // resolution; child also re-derives orbs internally for the
  // dropdown).
  //
  // DUPLICATE PROJECTION: this useMemo is mirrored in the editor child
  // (search for the other `orbs = useMemo<LoadedOrb[]>` in this file).
  // When adding a SavedProfile field, edit BOTH projections. Until the
  // duplication is consolidated (handoff open follow-up #6), forgetting
  // one causes silent field-loss between source array and runtime
  // LoadedOrb. See tasks/realtime-states-seam-audit.md §6.1.
  const orbs = useMemo<LoadedOrb[]>(() => {
    const tubeOrbs: LoadedOrb[] = tubeProfiles.map((p) => ({
      shader: 'tube' as const,
      sourceVariant: 'realtime-state' as const,
      id: p.id,
      name: p.name,
      pinned: p.pinned === true,
      // Optional pass-through — undefined / true / false flow through
      // unchanged. Reads use `=== true` defensively.
      skipIntroOnSelect: p.skipIntroOnSelect,
      settings: p.settings,
      lastModified: p.lastModified,
    }));
    const coralOrbs: LoadedOrb[] = coralProfiles.map((p) => ({
      shader: 'coral' as const,
      sourceVariant: 'realtime-coral' as const,
      id: p.id,
      name: p.name,
      pinned: p.pinned === true,
      skipIntroOnSelect: p.skipIntroOnSelect,
      settings: p.settings,
      lastModified: p.lastModified,
    }));
    return [...tubeOrbs, ...coralOrbs];
  }, [tubeProfiles, coralProfiles]);

  const activeOrb = useMemo<LoadedOrb | null>(() => {
    if (!activeOrbKey) return null;
    return orbs.find((o) => compositeKey(o) === activeOrbKey) ?? null;
  }, [orbs, activeOrbKey]);

  // Cascade-once: resolves localStorage → "Kyoto Realtime" →
  // first available, applies via setActiveOrbKey + setActiveBaseline,
  // and flips cascadeReady at the END of the success path (round-2
  // F1 / round-3 F1 timing).
  const cascadeAppliedRef = useRef(false);
  useEffect(() => {
    if (cascadeAppliedRef.current) return;
    if (!tubeLoaded || !coralLoaded) return; // wait for BOTH sources

    // Editor's active-orb key is INTENTIONALLY DISTINCT from the live
    // page's `realtime-active-orb-key`. Editor and live page have
    // independent active-orb selections by design (designer can edit
    // a profile in the editor without changing what shows on the live
    // page). Don't merge these keys without product input.
    const persisted = window.localStorage.getItem('realtime-states-active-orb-key');
    const persistedOrb = persisted
      ? orbs.find((o) => compositeKey(o) === persisted)
      : null;
    const tubeDefault = orbs.find(
      (o) => o.shader === 'tube' && o.name === REALTIME_SEED_NAME,
    );
    const fallback = persistedOrb ?? tubeDefault ?? orbs[0];
    if (!fallback) return; // degenerate state — skeleton persists

    cascadeAppliedRef.current = true;
    const targetKey = compositeKey(fallback);

    setActiveOrbKey(targetKey);
    setActiveBaseline({
      key: targetKey,
      shader: fallback.shader,
      settings: structuredClone(fallback.settings),
    } as BaselineSnapshot);

    // Flip cascadeReady LAST, after activeOrbKey + baseline have
    // been scheduled. Triggers child mount on next render.
    setCascadeReady(true);
  }, [tubeLoaded, coralLoaded, orbs]);

  // Persist activeOrbKey on change. Gated on cascadeReady so the
  // initial null doesn't blow away the user's saved selection.
  useEffect(() => {
    if (!cascadeReady) return;
    if (!activeOrbKey) return;
    window.localStorage.setItem('realtime-states-active-orb-key', activeOrbKey);
  }, [activeOrbKey, cascadeReady]);

  // Cascade gate — child mounts only when cascadeReady is true AND
  // activeOrb is non-null. The early return narrows activeOrb's type
  // from `LoadedOrb | null` to `LoadedOrb` for the JSX below, which is
  // what the child's prop type expects. Don't refactor this gate to a
  // ternary or remove either condition without considering the child's
  // lazy-init dependency on a resolved activeOrb (seam audit §2.1).
  if (!cascadeReady || !activeOrb) {
    return <RealtimeStatesSkeleton />;
  }

  return (
    <RealtimeStatesEditor
      activeOrb={activeOrb}
      activeBaseline={activeBaseline}
      setActiveBaseline={setActiveBaseline}
      setActiveOrbKey={setActiveOrbKey}
      tubeProfiles={tubeProfiles}
      setTubeProfiles={setTubeProfiles}
      coralProfiles={coralProfiles}
      setCoralProfiles={setCoralProfiles}
      externalProfileNames={externalProfileNames}
      colorFormat={colorFormat}
      setColorFormat={setColorFormat}
    />
  );
}
