import React, { useEffect, useRef, useState } from 'react';
import LinearWaveform from '../../linear-waveform/LinearWaveform';

interface ClipLinearWaveformProps {
  // Live MediaStream from the card's MediaRecorder. When non-null, we
  // build an AudioContext + AnalyserNode tap off it. Setting back to
  // null tears the audio graph down.
  mediaStream: MediaStream | null;
  // True only while the card is in 'recording'. When false the RAF
  // poll stops and scrolling mode naturally freezes — old bars stay,
  // no new pushes happen — which is what 'processing' wants.
  isActive: boolean;
  // Drives opacity. Visible across rec + proc so the frozen frame
  // remains on screen while transcription runs.
  visible: boolean;
}

// Lure profile, copy-pasted from linear-waveform-profiles.json.
// Container styling (bg / padding / radius) is intentionally dropped —
// the nav-pill IS the container. containerWidth / Height are passed as
// "100%" so the canvas fills the flex slot instead of the saved 368×42.
const LURE_PRESET = {
  barWidth: 3.5,
  barHeight: 6,
  barGap: 5,
  barRadius: 10,
  barColor: '#7A7878',
  mode: 'scrolling' as const,
  sensitivity: 1.4,
  updateRate: 96,
  ambientWave: false,
  waveMode: 'add' as const,
  waveSpeed: 2,
  waveAmplitude: 0.15,
  waveHeight: 1.5,
  ghostBarOpacity: 0.35,
  fadeEdges: true,
  fadeWidth: 20,
  smoothing: 0.85,
  intensityOpacity: false,
};

export const ClipLinearWaveform: React.FC<ClipLinearWaveformProps> = ({
  mediaStream,
  isActive,
  visible,
}) => {
  const [freqData, setFreqData] = useState<Uint8Array | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const rafRef = useRef<number | null>(null);

  // Build/tear-down the audio graph on stream identity changes.
  useEffect(() => {
    if (!mediaStream) {
      setFreqData(null);
      return;
    }

    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
    const source = ctx.createMediaStreamSource(mediaStream);
    source.connect(analyser);

    audioContextRef.current = ctx;
    analyserRef.current = analyser;
    sourceRef.current = source;
    dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      source.disconnect();
      analyser.disconnect();
      if (ctx.state !== 'closed') ctx.close();
      audioContextRef.current = null;
      analyserRef.current = null;
      sourceRef.current = null;
      dataArrayRef.current = null;
    };
  }, [mediaStream]);

  // Poll only when active. Flipping to inactive freezes the bars.
  useEffect(() => {
    if (!isActive) return;
    const tick = () => {
      const analyser = analyserRef.current;
      const dataArray = dataArrayRef.current;
      if (analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray);
        // Slice to a fresh Uint8Array each tick so React detects a new
        // reference and LinearWaveform's freqRef updates.
        setFreqData(new Uint8Array(dataArray));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [isActive]);

  return (
    <div className={`clip-waveform ${visible ? 'is-visible' : ''}`}>
      <LinearWaveform
        frequencyData={freqData}
        containerWidth="100%"
        containerHeight="100%"
        {...LURE_PRESET}
      />
      <style jsx>{`
        .clip-waveform {
          width: 100%;
          height: 100%;
          opacity: 0;
          /* Same Emil cubic-bezier used by every other morph so the
             waveform fade matches the nav-pill bg + text fade. */
          transition: opacity 200ms cubic-bezier(0.77, 0, 0.175, 1);
        }
        .clip-waveform.is-visible {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default ClipLinearWaveform;
