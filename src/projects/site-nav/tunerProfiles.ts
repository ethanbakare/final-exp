/**
 * Navbar tuner profiles: network I/O + shape + naming, modelled on voiceinterface/radial-states/api.ts.
 * Whole-array fetch / persist over the shared /api/studio-profiles route (variant "site-nav" ->
 * site-nav-profiles.json at the project root), exactly how radial-states, realtime-states and
 * circle-voice call it. The active profile id is kept in localStorage, as the voice editors do.
 */
import type { NavTuning } from './SiteNavGlass';

const API = '/api/studio-profiles?variant=site-nav';
export const ACTIVE_ID_STORAGE_KEY = 'site-nav-tuner-active-profile-id';

export type Dock = 'float' | 'docked';

export interface TunerProfile {
  id: string;
  name: string;
  /** Starting style picked in the dropdown (live, rim-a, ...). */
  styleKey: string;
  /** Floating or docked bar. */
  dock: Dock;
  /** Every slider value plus the tint ('' = the live colour of the backdrop's tone). */
  values: Required<NavTuning>;
  lastModified: number;
}

const KEYS: (keyof NavTuning)[] = ['fill', 'rim', 'highlight', 'blur', 'shadow', 'glow', 'hover', 'tint', 'lineWidth', 'lineThick', 'lineGap', 'chipHover', 'menuRow'];

/** Order-independent signature of what a profile stores; used for dirty detection. */
export const profileSig = (p: Pick<TunerProfile, 'styleKey' | 'dock' | 'values'>): string =>
  JSON.stringify([p.styleKey, p.dock, KEYS.map((k) => p.values[k])]);

export const makeNewId = (): string => `sn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function makeDefaultProfile(values: Required<NavTuning>): TunerProfile {
  return { id: 'sn-default', name: 'Default', styleKey: 'live', dock: 'float', values: { ...values }, lastModified: Date.now() };
}

const isProfile = (p: unknown): p is TunerProfile => {
  const o = p as TunerProfile;
  return !!o && typeof o.id === 'string' && typeof o.name === 'string' && typeof o.styleKey === 'string' &&
    (o.dock === 'float' || o.dock === 'docked') && !!o.values && typeof o.values === 'object';
};

// Same curated-name pattern as the voice editors: pick a fresh name, fall back to "<name> 2".
const CURATED_NAMES = [
  'Aether', 'Astra', 'Boreal', 'Bramble', 'Cascade',
  'Caldera', 'Citrine', 'Clarion', 'Cobalt', 'Crescent',
  'Cyan', 'Dynasty', 'Elixir', 'Fathom', 'Flint',
  'Galaxy', 'Garnet', 'Glimmer', 'Hazel', 'Hyacinth',
  'Indigo', 'Kerria', 'Larkspur', 'Lattice', 'Lichen',
  'Lilac', 'Mariner', 'Maven', 'Mosaic', 'Nimbus',
  'Onyx', 'Oracle', 'Pearl', 'Pivot', 'Polaris',
  'Ravine', 'Sable', 'Saffron', 'Sapphire', 'Seraph',
  'Shimmer', 'Solstice', 'Sonata', 'Specter', 'Spire',
  'Tempo', 'Tonic', 'Verdant', 'Voyage', 'Yarrow',
] as const;

export function pickFreshName(profiles: { name: string }[]): string {
  const used = new Set(profiles.map((p) => p.name.toLowerCase()));
  const available = CURATED_NAMES.filter((n) => !used.has(n.toLowerCase()));
  if (available.length > 0) return available[Math.floor(Math.random() * available.length)];
  const base = CURATED_NAMES[Math.floor(Math.random() * CURATED_NAMES.length)];
  let i = 2;
  while (used.has(`${base} ${i}`.toLowerCase())) i++;
  return `${base} ${i}`;
}

export async function fetchTunerProfiles(): Promise<TunerProfile[]> {
  try {
    const r = await fetch(API, { cache: 'no-store' });
    const j = await r.json();
    return Array.isArray(j) ? j.filter(isProfile) : [];
  } catch {
    return [];
  }
}

export async function persistTunerProfiles(arr: TunerProfile[]) {
  try {
    await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(arr),
    });
  } catch (e) {
    console.error('[site-nav tuner] persist failed', e);
  }
}
