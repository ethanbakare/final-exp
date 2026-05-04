import React, { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Repeat } from 'lucide-react';
import GentleOrbThicken from '@/projects/blob-orb/variants/GentleOrbThicken';
import GalleryAudioControls from '@/projects/blob-orb/components/GalleryAudioControls';
import { audioService } from '@/projects/blob-orb/services/audioService';
import type { AudioData } from '@/projects/voiceinterface/types';

type PreviewState = 'idle' | 'listening' | 'thinking' | 'talking';

const KYOTO = {
  scale: 0.5,
  thinRadius: 0.15,
  // Two different "thick" targets per state. Thinking pulses subtly
  // (gallery's saved 0.25 — torus stays a torus, just slightly fatter).
  // Talking closes fully (1.0 collapses to a sphere). The shader
  // interpolates per-frame so changing this prop is smooth.
  thinkingThickRadius: 0.25,
  talkingThickRadius: 1.0,
  thickenSpeed: 1.2,
  waveIntensity: 0.18,
  breathAmp: 0.015,
  idleAmp: 0.04,
  color1: '#080602',
  color2: '#efff08',
  color3: '#693a22',
  bgColor: '#fffafa',
};

const SILENT: AudioData = { bass: 0, mid: 0, treble: 0, rms: 0 };
const STATES: PreviewState[] = ['idle', 'listening', 'thinking', 'talking'];

export default function RealtimeStates() {
  const [state, setState] = useState<PreviewState>('idle');
  const [autoLoop, setAutoLoop] = useState(false);
  const [audioActive, setAudioActive] = useState(false);
  const [audioData, setAudioData] = useState<AudioData>(SILENT);
  const [thinkingGoal, setThinkingGoal] = useState(0);
  const rafRef = useRef(0);

  // Thinking pulses thin↔thick continuously — same pattern the production
  // realtime page uses. goal toggles 0↔1 every thickenSpeed*1000ms; the
  // shader's uThicken animates smoothly between the two.
  useEffect(() => {
    if (state !== 'thinking') {
      setThinkingGoal(0);
      return;
    }
    setThinkingGoal(1);
    const ms = KYOTO.thickenSpeed * 1000;
    const id = setInterval(() => setThinkingGoal((p) => (p === 0 ? 1 : 0)), ms);
    return () => clearInterval(id);
  }, [state]);

  // Poll live audio data while a source is active
  useEffect(() => {
    const tick = () => {
      setAudioData(audioActive ? audioService.getAudioData() : SILENT);
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(rafRef.current);
  }, [audioActive]);

  // Auto-cycle for "everything moving" view
  useEffect(() => {
    if (!autoLoop) return;
    const id = setInterval(() => {
      setState((p) => STATES[(STATES.indexOf(p) + 1) % STATES.length]);
    }, 2500);
    return () => clearInterval(id);
  }, [autoLoop]);

  // When a song starts playing, jump to "talking" once so you see the
  // morph as confirmation. After that, manual state clicks win — picking
  // "thinking" while audio is still playing must keep the blob on
  // thinking, never flip back to talking.
  useEffect(() => {
    if (audioActive) setState('talking');
  }, [audioActive]);

  const goal =
    state === 'talking' ? 1 : state === 'thinking' ? thinkingGoal : 0;
  const thickRadius =
    state === 'thinking' ? KYOTO.thinkingThickRadius : KYOTO.talkingThickRadius;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: KYOTO.bgColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
        padding: '48px 16px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <GalleryAudioControls onAudioActive={setAudioActive} />

      <div style={{ width: 400, height: 400 }}>
        <Canvas
          camera={{ position: [0, 0, 3.5], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true }}
        >
          <color attach="background" args={[KYOTO.bgColor]} />
          <ambientLight intensity={0.5} />
          <GentleOrbThicken
            audioData={audioData}
            goal={goal}
            scale={KYOTO.scale}
            thinRadius={KYOTO.thinRadius}
            thickRadius={thickRadius}
            thickenSpeed={KYOTO.thickenSpeed}
            waveIntensity={KYOTO.waveIntensity}
            breathAmp={KYOTO.breathAmp}
            idleAmp={KYOTO.idleAmp}
            color1={KYOTO.color1}
            color2={KYOTO.color2}
            color3={KYOTO.color3}
          />
        </Canvas>
      </div>

      {/* State buttons */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {STATES.map((s) => (
          <button
            key={s}
            onClick={() => {
              setAutoLoop(false);
              setState(s);
            }}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              border: state === s ? '1px solid #333' : '1px solid #ddd',
              background: state === s ? '#333' : '#fff',
              color: state === s ? '#fff' : '#333',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      <button
        onClick={() => setAutoLoop((p) => !p)}
        title="Cycle states"
        style={{
          padding: 10,
          borderRadius: 999,
          border: 'none',
          background: autoLoop ? '#FFC4C4' : '#FFE4D6',
          cursor: 'pointer',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Repeat size={18} color={autoLoop ? '#111' : '#888'} />
      </button>
    </div>
  );
}
