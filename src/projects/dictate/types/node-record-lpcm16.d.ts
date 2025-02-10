// From node-record-lpcm16.d.ts
declare module 'node-record-lpcm16' {
    interface RecordOptions {
      sampleRate?: number;
      channels?: number;
      audioType?: string;
      threshold?: number;
      thresholdStart?: number;
      thresholdEnd?: number;
      silence?: number;
      verbose?: boolean;
    }
  
    interface Recording {
      stream(): NodeJS.ReadableStream;
      stop(): void;
    }
  
    export function record(options?: RecordOptions): Recording;
}