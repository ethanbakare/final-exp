/**
 * Network I/O for the realtime-states editor.
 *
 * Consumers call these wrappers; nobody calls `fetch` directly.
 *
 * URL constants (`API`, `CORAL_API`) are module-private — only the
 * wrappers below need them. Not exported.
 */
import type { SavedCoralProfile, SavedProfile, SavedRadialProfile } from './types';
import type { RadialLinkedProfile } from '@/projects/voiceinterface/radial-states/api';

const API = '/api/studio-profiles?variant=realtime-state';
const CORAL_API = '/api/studio-profiles?variant=realtime-coral';
const RADIAL_API = '/api/studio-profiles?variant=radial-states';

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

/** Radial profiles share the existing `radial-states` variant served
 *  out of radial-states-profiles.json. The on-disk shape is FLAT
 *  (the RadialLinkedProfile fields sit at the top level — no `settings`
 *  wrapper), unlike Tube/Coral which nest behind `settings`. These
 *  helpers wrap on fetch and unwrap on persist so the editor consumes
 *  a uniform `SavedRadialProfile` shape while the JSON file stays
 *  readable by the radial-states page.
 *
 *  `pinned` and `skipIntroOnSelect` are persisted as extra optional
 *  top-level fields on the JSON entry. The radial-states page ignores
 *  unknown fields, so writes from here don't disturb that page's
 *  reads. */
type FlatRadialEntry = RadialLinkedProfile & {
  pinned?: boolean;
  skipIntroOnSelect?: boolean;
};

export async function fetchRadialProfiles(): Promise<SavedRadialProfile[]> {
  try {
    const r = await fetch(RADIAL_API, { cache: 'no-store' });
    const j = await r.json();
    if (!Array.isArray(j)) return [];
    return (j as FlatRadialEntry[]).map((entry) => ({
      id: entry.id,
      name: entry.name,
      pinned: entry.pinned === true,
      skipIntroOnSelect: entry.skipIntroOnSelect,
      settings: entry,
      lastModified: entry.lastModified ?? Date.now(),
    }));
  } catch {
    return [];
  }
}

export async function persistRadialProfiles(arr: SavedRadialProfile[]) {
  // Flatten back to the radial-states page's on-disk shape (the
  // RadialLinkedProfile already includes id/name/lastModified at top
  // level; we layer pinned/skipIntroOnSelect on top of that).
  const flat: FlatRadialEntry[] = arr.map((p) => ({
    ...p.settings,
    pinned: p.pinned === true ? true : undefined,
    skipIntroOnSelect: p.skipIntroOnSelect,
  }));
  try {
    await fetch(RADIAL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(flat),
    });
  } catch (e) {
    console.error('[realtime-states] persist radial failed', e);
  }
}
