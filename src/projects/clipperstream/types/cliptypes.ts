// ClipperStream Type Definitions

export interface Clip {
  id: string;
  title: string;
  text: string;
  duration: number; // in seconds
  createdAt: Date;
  status: 'pending' | 'transcribing' | 'completed' | 'failed';
  audioBlob?: Blob;
}

export interface RecordingState {
  isRecording: boolean;
  duration: number;
  audioBlob: Blob | null;
}

export type ButtonState = 'record' | 'recording' | 'done' | 'transcribing';

export interface TranscriptionResult {
  text: string;
  confidence?: number;
}

export interface OfflineQueueItem {
  clipId: string;
  audioBlob: Blob;
  timestamp: Date;
  retryCount: number;
}

