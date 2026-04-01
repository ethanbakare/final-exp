import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import CoralStoneTorusDamped from './CoralStoneTorusDamped';
import { AudioData } from './types';

/**
 * VelvetOrb - Simplified wrapper around CoralStoneTorusDamped for voice chat
 *
 * Maps voice conversation states to Velvet orb visual properties.
 *
 * States:
 * - idle: Gentle breathing, waiting to start
 * - listening: Responds to user microphone input
 * - ai_thinking: Continuous thin↔thick pulsing loop (goal toggles 0↔1)
 * - ai_speaking: Normal state, responds to AI audio
 */

export type VoiceState = 'idle' | 'listening' | 'ai_thinking' | 'ai_speaking';

export interface VelvetOrbProps {
  audioData: AudioData;
  voiceState: VoiceState;
  width?: number;
  height?: number;
}

// Velvet profile settings (from coralstonedamped-profiles.json)
const VELVET_CONFIG = {
  scale: 1,
  thinRadius: 0.19,
  thickRadius: 0.3,
  thickenSpeed: 0.6, // Faster for ai_thinking pulsing
  color1: '#6e6e6e',  // Peak highlights (grey)
  color2: '#464e48',  // Mid-tone base (dark grey-green)
  color3: '#695522',  // Valley hue shift (warm brown)
};

/**
 * Map voice state to Velvet orb properties (excluding goal which is handled dynamically)
 */
function getVelvetProps(voiceState: VoiceState) {
  switch (voiceState) {
    case 'ai_thinking':
      // Pulsing loop: goal toggles 0↔1 (handled in component)
      return {
        waveIntensity: 0.15,
        breathAmp: 0.02, // Reduced to emphasize goal-based pulsing
        idleAmp: 0.01,
      };

    case 'ai_speaking':
      // Normal state, responds to AI audio
      return {
        waveIntensity: 0.25,
        breathAmp: 0.04,
        idleAmp: 0.03,
      };

    case 'listening':
      // Audio-reactive, responds to user voice
      return {
        waveIntensity: 0.18,
        breathAmp: 0.03,
        idleAmp: 0.02,
      };

    case 'idle':
    default:
      // Gentle breathing
      return {
        waveIntensity: 0.18,
        breathAmp: 0.03,
        idleAmp: 0.02,
      };
  }
}

export const VelvetOrb: React.FC<VelvetOrbProps> = ({
  audioData,
  voiceState,
  width = 400,
  height = 400,
}) => {
  const velvetProps = getVelvetProps(voiceState);

  // AI thinking pulsing: Toggle goal between 0 (thin) and 1 (thick) every second
  const [pulsingGoal, setPulsingGoal] = useState<number>(0);

  useEffect(() => {
    if (voiceState === 'ai_thinking') {
      // Start pulsing immediately
      setPulsingGoal(1); // Start with thick

      // Toggle goal every 1 second
      const interval = setInterval(() => {
        setPulsingGoal(prev => prev === 0 ? 1 : 0);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      // Reset to thin (goal=0) for other states
      setPulsingGoal(0);
    }
  }, [voiceState]);

  // Determine final goal based on state
  const finalGoal = voiceState === 'ai_thinking' ? pulsingGoal : 0;

  return (
    <Canvas style={{ width, height }}>
      {/* Lighting setup */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 4, 4]} intensity={0.8} />

      {/* Velvet orb with state-based props */}
      <CoralStoneTorusDamped
        audioData={audioData}
        goal={finalGoal}
        scale={VELVET_CONFIG.scale}
        thinRadius={VELVET_CONFIG.thinRadius}
        thickRadius={VELVET_CONFIG.thickRadius}
        thickenSpeed={VELVET_CONFIG.thickenSpeed}
        waveIntensity={velvetProps.waveIntensity}
        breathAmp={velvetProps.breathAmp}
        idleAmp={velvetProps.idleAmp}
        color1={VELVET_CONFIG.color1}
        color2={VELVET_CONFIG.color2}
        color3={VELVET_CONFIG.color3}
      />

      {/* Camera positioned to frame the orb nicely */}
      <PerspectiveCamera makeDefault position={[0, 0, 2.5]} />
    </Canvas>
  );
};
