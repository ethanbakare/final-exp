export interface AudioData {
  bass: number;
  mid: number;
  treble: number;
  rms: number;
  /** Raw byte-frequency data from the AnalyserNode. Optional because
   *  existing Tube/Coral shaders only consume the aggregated bands.
   *  Radial-waveform-based shaders (RadialRealtimeBlob) consume this
   *  directly to map across bars. Producers that don't supply it can
   *  leave it undefined / null without breaking any existing path. */
  frequencyData?: Uint8Array | null;
}
