export interface AudioEntry {
  name: string;
  blob: Blob | null;
}

export class RadialAudioService {
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
    const Ctor = window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.context = new Ctor();
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;
    this.gainNode = this.context.createGain();
    this.gainNode.gain.value = this.muted ? 0 : 1;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
  }

  async startMic() {
    this.stop();
    await this.init();
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    this.stream = stream;
    if (this.context && this.analyser) {
      const src = this.context.createMediaStreamSource(stream);
      src.connect(this.analyser);
      this.source = src;
      this.activeMode = "mic";
      if (this.context.state === "suspended") await this.context.resume();
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
    const src = this.context.createMediaElementSource(this.audioElement);
    src.connect(this.analyser);
    this.analyser.connect(this.gainNode);
    this.gainNode.connect(this.context.destination);
    this.source = src;
    this.activeMode = "file";
    if (this.context.state === "suspended") await this.context.resume();
    await this.audioElement.play();
  }

  pause() { this.audioElement?.pause(); }
  async resume() { await this.audioElement?.play(); }
  setMuted(m: boolean) { this.muted = m; if (this.gainNode) this.gainNode.gain.value = m ? 0 : 1; }
  isMuted() { return this.muted; }
  isPaused() { return this.audioElement ? this.audioElement.paused : true; }

  stop() {
    if (this.audioElement) { this.audioElement.pause(); this.audioElement.src = ""; this.audioElement = null; }
    if (this.stream) { this.stream.getTracks().forEach(t => t.stop()); this.stream = null; }
    if (this.source) { this.source.disconnect(); this.source = null; }
    if (this.analyser) { this.analyser.disconnect(); }
    if (this.gainNode) { this.gainNode.disconnect(); this.gainNode = null; }
    if (this.context && this.context.state !== "closed") { this.context.close(); this.context = null; }
    this.analyser = null;
    this.dataArray = null;
    this.activeMode = null;
  }

  getFrequencyData(): Uint8Array | null {
    if (!this.analyser || !this.dataArray) return null;
    this.analyser.getByteFrequencyData(this.dataArray);
    return this.dataArray;
  }
}

export const audioService = new RadialAudioService();
