import React, { useEffect, useRef, useState } from 'react';
import LinearWaveform from '../../linear-waveform/LinearWaveform';
import type { LinearWaveformProps } from '../../linear-waveform/types';

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
  // Name of the linear-waveform profile (in linear-waveform-profiles.json
  // / served by /api/studio-profiles?variant=linear-waveform) to source
  // bar styling from. Defaults to "Clip" — a profile dedicated to this
  // card so it can be tuned in the playground without touching shared
  // ones like "Lure". If the profile can't be found / fetched, falls
  // back to the LURE_FALLBACK constant below.
  profileName?: string;
}

// Lure-derived fallback used when the named profile can't be fetched
// (offline, API error, profile renamed). Container styling fields
// (bg / padding / radius / containerWidth / containerHeight) are
// intentionally absent — the nav-pill IS the container, and width/
// height are forced to "100%" via the LinearWaveform props.
type WaveformProps = Pick<
  LinearWaveformProps,
  | 'barWidth'
  | 'barHeight'
  | 'barGap'
  | 'barRadius'
  | 'barColor'
  | 'mode'
  | 'sensitivity'
  | 'updateRate'
  | 'ambientWave'
  | 'waveMode'
  | 'waveSpeed'
  | 'waveAmplitude'
  | 'waveHeight'
  | 'ghostBarOpacity'
  | 'fadeEdges'
  | 'fadeWidth'
  | 'smoothing'
  | 'intensityOpacity'
>;

const LURE_FALLBACK: WaveformProps = {
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

// Pluck the LinearWaveform-relevant fields out of a saved profile's
// settings blob. The profile schema also stores container styling /
// preview bg / outline — none of which apply here because the nav-pill
// owns the container.
const profileToWaveformProps = (
  s: Record<string, unknown>
): WaveformProps => ({
  barWidth: s.barWidth as number,
  barHeight: s.barHeight as number,
  barGap: s.barGap as number,
  barRadius: s.barRadius as number,
  barColor: s.barColor as string,
  mode: s.mode as 'scrolling' | 'static',
  sensitivity: s.sensitivity as number,
  updateRate: s.updateRate as number,
  ambientWave: s.ambientWave as boolean,
  waveMode: s.waveMode as 'add' | 'mul',
  waveSpeed: s.waveSpeed as number,
  waveAmplitude: s.waveAmplitude as number,
  waveHeight: s.waveHeight as number,
  ghostBarOpacity: s.ghostBarOpacity as number,
  fadeEdges: s.fadeEdges as boolean,
  fadeWidth: s.fadeWidth as number,
  smoothing: s.smoothing as number,
  intensityOpacity: s.intensityOpacity as boolean,
});

export const ClipLinearWaveform: React.FC<ClipLinearWaveformProps> = ({
  mediaStream,
  isActive,
  visible,
  profileName = 'Clip',
}) => {
  const [freqData, setFreqData] = useState<Uint8Array<ArrayBuffer> | null>(null);
  const [waveformProps, setWaveformProps] = useState<WaveformProps>(LURE_FALLBACK);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const rafRef = useRef<number | null>(null);

  // Load + watch the named profile from the studio-profiles API.
  // Refetches on tab focus (covers playground-tab -> showcase-tab
  // workflow) and polls every 2s while visible (covers live edits in
  // a side-by-side window). JSON-equality short-circuit avoids any
  // re-renders when nothing changed.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(
          `/api/studio-profiles?variant=linear-waveform`
        );
        if (!res.ok || cancelled) return;
        const list = await res.json();
        if (!Array.isArray(list) || cancelled) return;
        const found = list.find(
          (p: { name?: string }) => p.name === profileName
        );
        if (!found?.settings) return;
        const next = profileToWaveformProps(found.settings);
        setWaveformProps((prev) =>
          JSON.stringify(prev) === JSON.stringify(next) ? prev : next
        );
      } catch {
        // keep current props (or fallback) — never let a fetch blip
        // tear the demo
      }
    };
    load();
    const onVisible = () => {
      if (document.visibilityState === 'visible') load();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', load);
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 2000);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', load);
      clearInterval(intervalId);
    };
  }, [profileName]);

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

    // Lifecycle-aware resume (same pattern as createFakeStream). iOS
    // Safari / Brave iOS create every AudioContext in 'suspended' state.
    // If this context stays suspended, the AnalyserNode never processes
    // incoming audio frames and getByteFrequencyData() returns zeros,
    // so the waveform bars render flat even when the upstream
    // MediaStream is producing real audio. Fire-and-forget — never
    // await (WebKit's resume() can hang indefinitely before a gesture).
    const tryResume = () => {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => { /* retry on gesture / visibility */ });
      }
    };
    tryResume();
    const onGesture = () => {
      tryResume();
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('touchstart', onGesture);
    };
    window.addEventListener('pointerdown', onGesture, { once: true, passive: true });
    window.addEventListener('touchstart', onGesture, { once: true, passive: true });
    const onVisibility = () => {
      if (document.visibilityState === 'visible') tryResume();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('touchstart', onGesture);
      document.removeEventListener('visibilitychange', onVisibility);
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
  // Critical: we also clear freqData here. Without this, the last
  // Uint8Array we passed stays in state and LinearWaveform keeps
  // pushing that same stale frame to its history every updateRate ms,
  // making the bars appear to keep scrolling. Setting freqData=null
  // turns hasData off in the renderer; historyRef retains the prior
  // bars so they remain visible, frozen at their last positions.
  useEffect(() => {
    if (!isActive) {
      setFreqData(null);
      return;
    }
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
        {...waveformProps}
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
