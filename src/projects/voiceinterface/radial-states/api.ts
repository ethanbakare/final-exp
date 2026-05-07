/**
 * Network I/O for the radial-states editor — fetch + persist for the
 * radial-linked profile schema (one profile = idle + thinking + talking
 * each as RadialSettings). Mirrors the realtime-states api.ts pattern.
 */
import type { RadialSettings } from '@/projects/radial-waveform/types';

const API = '/api/studio-profiles?variant=radial-states';

/** Static backdrop ring shared across all three cells in a profile.
 *  Optional — older profiles read defaults at the consumer site. */
export interface RadialBackdrop {
  /** 'circle' = perfect inner circle (the original donut).
   *  'segments' = parametric wavy inner edge with N lobes. */
  shape?: 'circle' | 'segments';
  /** Number of lobes when shape === 'segments'. Independent of the
   *  per-state audio segments (which control mapFrequencyToBars
   *  symmetry); the user can dial these separately. */
  segments?: number;
  /** Lobe depth in px — peak-to-trough deviation from the base inner
   *  radius. 0 collapses to a circle regardless of shape. */
  depth?: number;
}

export interface RadialLinkedProfile {
  id: string;
  name: string;
  idle: RadialSettings;
  thinking: RadialSettings;
  talking: RadialSettings;
  backdrop?: RadialBackdrop;
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
