/**
 * RadialEditorPanel — bridges the shared radial `ControlsPanel` to the
 * realtime-states editor's state shape.
 *
 * Owns NO state of its own. Takes the active `RadialLinkedProfile`, the
 * focused state pill, and a single `onProfileChange` callback. Internally:
 *  - Materialises the focused state into the legacy `RadialSettings`
 *    shape that ControlsPanel consumes.
 *  - Wires each ControlsPanel callback (per-state edits, backdrop
 *    edits, morph edits, link toggling) through `applyPatch` so the
 *    v2 schema's bar-identity / display / per-state slots receive
 *    the correct routing + link propagation.
 *  - Bubbles the new profile to the parent which is responsible for
 *    persistence.
 *
 * Out of scope (deliberate for first cut):
 *  - Per-field reset arrows / dirty highlighting. We pass null
 *    baselines so the ↺ icons never render. Full baseline tracking
 *    can land in a follow-up once realtime-states' baseline machinery
 *    is extended to cover radial.
 */
import React from 'react';
import { ControlsPanel } from '@/projects/voiceinterface/radial-states/ControlsPanel';
import {
  applyPatch,
  materializeState,
} from '@/projects/voiceinterface/radial-states/index';
import type {
  RadialBackdrop,
  RadialLinkedProfile,
} from '@/projects/voiceinterface/radial-states/api';
import { deriveTalkingAnchor } from '@/projects/voiceinterface/radial-states/api';
import type { RadialState } from '@/projects/voiceinterface/radial-states/types';
import type { RadialSettings } from '@/projects/radial-waveform/types';

const DEFAULT_BACKDROP: Required<RadialBackdrop> = {
  enabled: true,
  color: '#262424',
  opacity: 0.03,
  shape: 'circle',
  segments: 7,
  depth: 6,
  outerShape: 'circle',
  outerSegments: 7,
  outerDepth: 6,
};

function resolveBackdrop(b: RadialBackdrop | undefined): Required<RadialBackdrop> {
  return {
    enabled: b?.enabled ?? DEFAULT_BACKDROP.enabled,
    color: b?.color ?? DEFAULT_BACKDROP.color,
    opacity: b?.opacity ?? DEFAULT_BACKDROP.opacity,
    shape: b?.shape ?? DEFAULT_BACKDROP.shape,
    segments: b?.segments ?? DEFAULT_BACKDROP.segments,
    depth: b?.depth ?? DEFAULT_BACKDROP.depth,
    outerShape: b?.outerShape ?? DEFAULT_BACKDROP.outerShape,
    outerSegments: b?.outerSegments ?? DEFAULT_BACKDROP.outerSegments,
    outerDepth: b?.outerDepth ?? DEFAULT_BACKDROP.outerDepth,
  };
}

interface RadialEditorPanelProps {
  profile: RadialLinkedProfile;
  focused: RadialState;
  onProfileChange: (next: RadialLinkedProfile) => void;
}

export const RadialEditorPanel: React.FC<RadialEditorPanelProps> = ({
  profile,
  focused,
  onProfileChange,
}) => {
  const settings = materializeState(profile, focused);
  const backdrop = resolveBackdrop(profile.backdrop);

  // Per-state field edits — dispatched via applyPatch (handles bar
  // identity / display / per-state routing + idle→listening link).
  const handleSettingsChange = (patch: Partial<RadialSettings>) => {
    onProfileChange(applyPatch(profile, focused, patch));
  };

  // Backdrop edits — profile-level, shared across all states.
  const handleBackdropChange = (patch: Partial<RadialBackdrop>) => {
    onProfileChange({
      ...profile,
      backdrop: { ...backdrop, ...patch },
      lastModified: Date.now(),
    });
  };

  // Morph timing edits — profile-level.
  const handleMorphChange = (
    patch: Partial<{ idleToThinking: number; thinkingToTalking: number; reactiveStartAt: number }>,
  ) => {
    onProfileChange({
      ...profile,
      morph: { ...profile.morph, ...patch },
      lastModified: Date.now(),
    });
  };

  // Bar-count lock — profile-level.
  const handleLockBarCountChange = (lockBarCount: boolean) => {
    onProfileChange({
      ...profile,
      lockBarCount,
      lastModified: Date.now(),
    });
  };

  // Talking inner-gap — profile-level (geometry.talkingInnerGap).
  const handleTalkingInnerGapChange = (talkingInnerGap: number) => {
    onProfileChange({
      ...profile,
      geometry: { ...profile.geometry, talkingInnerGap },
      lastModified: Date.now(),
    });
  };

  // Break the idle ↔ listening link — flip the profile flag. Once
  // broken, listening gains its own editable controls.
  const handleBreakLink = () => {
    onProfileChange({
      ...profile,
      idleListeningLinked: false,
      lastModified: Date.now(),
    });
  };

  // Derived talking values shown to the panel.
  const idleCircumference = 2 * Math.PI * profile.geometry.idleRadius;
  const lockedCount = Math.max(
    1,
    Math.floor(idleCircumference / (profile.bars.barWidth + profile.bars.barGap)),
  );
  const talkingAnchor = deriveTalkingAnchor(profile);
  const talkingCircumference = 2 * Math.PI * talkingAnchor;
  const talkingDerivedGap =
    focused === 'talking' && profile.lockBarCount
      ? Math.max(0, talkingCircumference / lockedCount - profile.bars.barWidth)
      : undefined;

  // Donut outer diameter — derived. Matches the formula in radial-states
  // (donutOuter = idleR + DONUT_PADDING; diameter = donutOuter * 2).
  const DONUT_PADDING = 14;
  const donutDiameter = (profile.geometry.idleRadius + DONUT_PADDING) * 2;

  return (
    <ControlsPanel
      settings={settings}
      baselineSettings={null}
      onChange={handleSettingsChange}
      onMaxBarHover={() => {}}
      focused={focused}
      lockBarCount={profile.lockBarCount}
      onLockBarCountChange={handleLockBarCountChange}
      talkingDerivedGap={talkingDerivedGap}
      talkingInnerGap={profile.geometry.talkingInnerGap}
      onTalkingInnerGapChange={handleTalkingInnerGapChange}
      backdrop={backdrop}
      baselineBackdrop={null}
      onBackdropChange={handleBackdropChange}
      showMorphSubsection={focused === 'thinking' || focused === 'talking'}
      morph={profile.morph}
      onMorphChange={handleMorphChange}
      idleListeningLinked={profile.idleListeningLinked}
      onBreakLink={handleBreakLink}
      donutDiameter={donutDiameter}
    />
  );
};
