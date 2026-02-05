import React from 'react';
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
 * - ai_thinking: Thickens to show AI processing
 * - ai_speaking: Thins back, responds to AI audio
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
  thickenSpeed: 1.2,
  color1: '#6e6e6e',  // Peak highlights (grey)
  color2: '#464e48',  // Mid-tone base (dark grey-green)
  color3: '#695522',  // Valley hue shift (warm brown)
};

/**
 * Map voice state to Velvet orb properties
 */
function getVelvetProps(voiceState: VoiceState) {
  switch (voiceState) {
    case 'ai_thinking':
      // Thicken orb, reduce wave intensity
      return {
        goal: 1,
        waveIntensity: 0.12,
        breathAmp: 0.03,
        idleAmp: 0.015,
      };

    case 'ai_speaking':
      // Thin back, increase wave intensity for AI audio
      return {
        goal: 0,
        waveIntensity: 0.25,
        breathAmp: 0.05,
        idleAmp: 0.03,
      };

    case 'listening':
    case 'idle':
    default:
      // Gentle breathing, normal wave response
      return {
        goal: 0,
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

  return (
    <Canvas style={{ width, height }}>
      {/* Lighting setup */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 4, 4]} intensity={0.8} />

      {/* Velvet orb with state-based props */}
      <CoralStoneTorusDamped
        audioData={audioData}
        goal={velvetProps.goal}
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
