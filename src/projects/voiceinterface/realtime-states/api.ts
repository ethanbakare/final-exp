/**
 * Network I/O for the realtime-states editor.
 *
 * Consumers call these wrappers; nobody calls `fetch` directly.
 *
 * URL constants (`API`, `CORAL_API`) are module-private — only the
 * wrappers below need them. Not exported.
 */
import type { SavedCoralProfile, SavedProfile } from './types';

const API = '/api/studio-profiles?variant=realtime-state';
const CORAL_API = '/api/studio-profiles?variant=realtime-coral';

export async function fetchProfiles(): Promise<SavedProfile[]> {
  try {
    // cache:'no-store' so a stale browser-cached response (lacking
    // newer schema fields like skipIntroOnSelect) doesn't propagate
    // through setTubeProfiles → orbs → activeOrb. This was a real bug:
    // the API returned the field, but the cached fetch did not.
    const r = await fetch(API, { cache: 'no-store' });
    const j = await r.json();
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
}

export async function fetchProfileNames(variant: string): Promise<string[]> {
  try {
    const r = await fetch(`/api/studio-profiles?variant=${variant}`, { cache: 'no-store' });
    const j = await r.json();
    return Array.isArray(j)
      ? j.map((p) => (typeof p?.name === 'string' ? p.name : '')).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

export async function persistProfiles(arr: SavedProfile[]) {
  try {
    await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(arr),
    });
  } catch (e) {
    console.error('[realtime-states] persist failed', e);
  }
}

export async function fetchCoralProfiles(): Promise<SavedCoralProfile[]> {
  try {
    const r = await fetch(CORAL_API, { cache: 'no-store' });
    const j = await r.json();
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
}

export async function persistCoralProfiles(arr: SavedCoralProfile[]) {
  try {
    await fetch(CORAL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(arr),
    });
  } catch (e) {
    console.error('[realtime-states] persist coral failed', e);
  }
}
