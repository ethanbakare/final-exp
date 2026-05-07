/**
 * Network I/O for the radial-states editor — fetch + persist for the
 * radial-linked profile schema (one profile = idle + thinking + talking
 * each as RadialSettings). Mirrors the realtime-states api.ts pattern.
 */
import type { RadialSettings } from '@/projects/radial-waveform/types';

const API = '/api/studio-profiles?variant=radial-states';

/** Static backdrop ring shared across all three cells in a profile.
 *  Optional — older profiles read defaults at the consumer site.
 *
 *  Inner ring fields (shape / segments / depth) and outer ring fields
 *  (outerShape / outerSegments / outerDepth) are independent — both
 *  edges can be circle or segments; both can have their own lobe
 *  count and depth. Flat naming kept (rather than nested inner/outer
 *  objects) for backward compatibility with profiles persisted before
 *  the outer-ring feature shipped. */
export interface RadialBackdrop {
  /** Inner edge shape. */
  shape?: 'circle' | 'segments';
  /** Inner edge lobe count when shape === 'segments'. */
  segments?: number;
  /** Inner edge lobe depth in px (peak-to-trough deviation from the
   *  base inner radius). 0 collapses to a circle regardless of shape. */
  depth?: number;
  /** Outer edge shape. */
  outerShape?: 'circle' | 'segments';
  /** Outer edge lobe count when outerShape === 'segments'. */
  outerSegments?: number;
  /** Outer edge lobe depth in px. 0 collapses to a circle. */
  outerDepth?: number;
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
