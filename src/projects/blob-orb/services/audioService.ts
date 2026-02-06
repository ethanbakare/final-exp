import { AudioData } from "../types";
import { AUDIO_BANDS } from "../constants";

export class AudioService {
  private context: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private activeMode: "mic" | "file" | null = null;
  private muted = false;
  private gainNode: GainNode | null = null;

  async init() {
    if (this.context) return;

    const AudioContextConstructor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    this.context = new AudioContextConstructor();
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;
    this.gainNode = this.context.createGain();
    this.gainNode.gain.value = this.muted ? 0 : 1;

    const bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);
  }

  async startMic() {
    this.stop();
    await this.init();
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      if (this.context && this.analyser) {
        const micSource = this.context.createMediaStreamSource(this.stream);
        micSource.connect(this.analyser);
        this.source = micSource;
        this.activeMode = "mic";
        if (this.context.state === "suspended") {
          await this.context.resume();
        }
      }
    } catch (err) {
      console.error("Error accessing microphone:", err);
      throw err;
    }
  }

  async startAudioFile(file: File) {
    this.stop();
    await this.init();
    if (!this.context || !this.analyser || !this.gainNode) return;

    const url = URL.createObjectURL(file);
    this.audioElement = new Audio(url);
    this.audioElement.crossOrigin = "anonymous";
    this.audioElement.loop = true;

    const elementSource = this.context.createMediaElementSource(this.audioElement);
    elementSource.connect(this.analyser);
    this.analyser.connect(this.gainNode);
    this.gainNode.connect(this.context.destination);
    this.source = elementSource;
    this.activeMode = "file";

    if (this.context.state === "suspended") {
      await this.context.resume();
    }

    await this.audioElement.play();
  }

  /** Play audio from a URL (e.g. file in public/audio/) */
  async startAudioUrl(url: string) {
    // Fetch the file and create a blob URL — same pipeline as startAudioFile
    const resp = await fetch(url);
    const blob = await resp.blob();
    const file = new File([blob], "audio", { type: blob.type });
    await this.startAudioFile(file);
  }

  /** Pause file playback (retains position). Orbs will idle. */
  pause() {
    if (this.audioElement && this.activeMode === "file") {
      this.audioElement.pause();
    }
  }

  /** Resume file playback from paused position. */
  async resume() {
    if (this.audioElement && this.activeMode === "file") {
      await this.audioElement.play();
    }
  }

  /** Mute/unmute audio output. Orbs still react when muted. */
  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.gainNode) {
      this.gainNode.gain.value = muted ? 0 : 1;
    }
  }

  isMuted() {
    return this.muted;
  }

  isPaused() {
    return this.audioElement ? this.audioElement.paused : true;
  }

  stop() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = "";
      this.audioElement = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.analyser) {
      this.analyser.disconnect();
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    if (this.context && this.context.state !== "closed") {
      this.context.close();
      this.context = null;
    }
    this.analyser = null;
    this.dataArray = null;
    this.activeMode = null;
  }

  getActiveMode() {
    return this.activeMode;
  }

  getAudioData(): AudioData {
    if (!this.analyser || !this.dataArray || !this.context) {
      return { bass: 0, mid: 0, treble: 0, rms: 0 };
    }

    this.analyser.getByteFrequencyData(this.dataArray);
    const sampleRate = this.context.sampleRate;
    const binCount = this.analyser.frequencyBinCount;

    const getAverage = (minFreq: number, maxFreq: number) => {
      const minBin = Math.floor((minFreq * binCount) / (sampleRate / 2));
      const maxBin = Math.floor((maxFreq * binCount) / (sampleRate / 2));

      let sum = 0;
      let count = 0;
      for (let i = minBin; i <= maxBin; i++) {
        sum += this.dataArray![i];
        count++;
      }
      return count > 0 ? sum / count / 255 : 0;
    };

    const bass = getAverage(AUDIO_BANDS.BASS.min, AUDIO_BANDS.BASS.max);
    const mid = getAverage(AUDIO_BANDS.MID.min, AUDIO_BANDS.MID.max);
    const treble = getAverage(AUDIO_BANDS.TREBLE.min, AUDIO_BANDS.TREBLE.max);

    let rms = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      rms += (this.dataArray[i] / 255) ** 2;
    }
    rms = Math.sqrt(rms / this.dataArray.length);

    return { bass, mid, treble, rms };
  }
}

export const audioService = new AudioService();
