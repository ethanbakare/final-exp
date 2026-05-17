/**
 * CircleEditorPanel — CSW-010. Bridges the shared circle
 * `CircleControlsPanel` to the realtime-states editor's state shape.
 * Mirrors `RadialEditorPanel`.
 *
 * Owns NO persistent state. Takes the active `CircleVoiceProfile`, the
 * focused voice-state pill, and a single `onProfileChange` callback.
 * Internally it materialises the focused state's snapshot, then routes
 * every CircleControlsPanel callback through an immutable producer that
 * replicates the standalone circle-voice page's per-state / identity /
 * idle→listening-link write rules — bubbling a NEW CircleVoiceProfile
 * to the parent (which owns persistence + dirty detection).
 *
 * The only local state is the editor-only eye-ghost overlay UI the
 * panel requires as props. These don't drive any visible ghost in the
 * aggregator (the editor canvas renders the bare orb, no ghosts —
 * exactly like RadialEditorPanel passes a no-op hover), they just
 * satisfy CircleControlsPanel's interface.
 */
import React, { useState } from 'react';
import { CircleControlsPanel } from '@/projects/voiceinterface/circle-voice/CircleControlsPanel';
import type {
  CircleSawSettings,
} from '@/projects/voiceinterface/circle-voice/circleWaveformCore';
import type {
  CircleTransitions,
  CircleVoiceProfile,
  VoiceState,
} from '@/projects/voiceinterface/circle-voice/circleVoice';

/** Per-state keys (the eased set + invert + circle vis/opacity +
 *  waveDirection). Everything else is shared identity and mirrors to
 *  all four snapshots. EXACT copy of the standalone page's
 *  PER_STATE_KEYS so editing through the aggregator matches the
 *  standalone page byte-for-byte. */
const PER_STATE_KEYS = new Set<keyof CircleSawSettings>([
  'apexCircleHeight',
  'arcCircleHeight',
  'waveAmplitude',
  'pulseWidth',
  'spectralMix',
  'waveSpeed',
  'waveHeight',
  'sensitivity',
  'noiseFloor',
  'smoothing',
  'audioInvert',
  'circleVisible',
  'circleOpacity',
  'waveDirection',
]);

const ALL_STATES: VoiceState[] = ['idle', 'listening', 'thinking', 'talking'];

interface CircleEditorPanelProps {
  profile: CircleVoiceProfile;
  focused: VoiceState;
  onProfileChange: (next: CircleVoiceProfile) => void;
}

export const CircleEditorPanel: React.FC<CircleEditorPanelProps> = ({
  profile,
  focused,
  onProfileChange,
}) => {
  // Editor-only eye-ghost overlay UI state. CircleControlsPanel
  // requires the setters as props; the VALUES are only read by the
  // standalone CircleVoiceOrb's ghosts (not rendered in the aggregator,
  // exactly like RadialEditorPanel passes a no-op hover), so only the
  // setters are kept.
  const [, setPreviewEnvelope] = useState<'max' | 'min' | null>(null);
  const [waveReachVisible, setWaveReachVisible] = useState(false);
  const [, setWaveReachHovered] = useState(false);

  const linked = profile.idleListeningLinked !== false;
  const s = profile.settings[focused];

  // Per-state / identity / link write — immutable. Replicates the
  // standalone page's updateStateSetting against a structuredClone so
  // dirty detection (JSON.stringify(activeOrb.settings) vs baseline)
  // and React state updates work correctly in the aggregator.
  const handleSetting = <K extends keyof CircleSawSettings>(
    key: K,
    value: CircleSawSettings[K],
  ) => {
    const next: CircleVoiceProfile = structuredClone(profile);
    if (PER_STATE_KEYS.has(key)) {
      next.settings[focused][key] = value;
      if (focused === 'idle' && linked) {
        next.settings.listening[key] = value;
      }
    } else {
      // shared identity → mirror to all four snapshots
      for (const st of ALL_STATES) {
        next.settings[st][key] = value;
      }
    }
    next.lastModified = Date.now();
    onProfileChange(next);
  };

  const handleTransition = (key: keyof CircleTransitions, value: number) => {
    const next: CircleVoiceProfile = structuredClone(profile);
    next.settings.transitions[key] = value;
    next.lastModified = Date.now();
    onProfileChange(next);
  };

  const handleBreakLink = () => {
    onProfileChange({
      ...profile,
      idleListeningLinked: false,
      lastModified: Date.now(),
    });
  };

  return (
    <div className="bg-[#1a1a1e]">
      <CircleControlsPanel
        voiceState={focused}
        linked={linked}
        s={s}
        transitions={profile.settings.transitions}
        waveReachVisible={waveReachVisible}
        onBreakLink={handleBreakLink}
        onSetting={handleSetting}
        onTransition={handleTransition}
        setPreviewEnvelope={setPreviewEnvelope}
        setWaveReachVisible={setWaveReachVisible}
        setWaveReachHovered={setWaveReachHovered}
      />
    </div>
  );
};
