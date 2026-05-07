/**
 * Network I/O for the radial-states editor — fetch + persist for the
 * radial-linked profile schema (one profile = idle + thinking + talking
 * each as RadialSettings). Mirrors the realtime-states api.ts pattern.
 */
import type { RadialSettings } from '@/projects/radial-waveform/types';

const API = '/api/studio-profiles?variant=radial-states';

export interface RadialLinkedProfile {
  id: string;
  name: string;
  idle: RadialSettings;
  thinking: RadialSettings;
  talking: RadialSettings;
  lastModified: number;
}

export async function fetchRadialLinkedProfiles(): Promise<RadialLinkedProfile[]> {
  try {
    const r = await fetch(API, { cache: 'no-store' });
    const j = await r.json();
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
}

export async function persistRadialLinkedProfiles(arr: RadialLinkedProfile[]) {
  try {
    await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(arr),
    });
  } catch (e) {
    console.error('[radial-states] persist failed', e);
  }
}
