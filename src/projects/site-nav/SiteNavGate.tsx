/**
 * Decides, per route, whether the site-wide navbar renders.
 * Mounted once in src/pages/_app.tsx.
 *
 * ALLOW-LIST: the bar shows only on the public portfolio pages, "/" and
 * "/projects", plus every internal route those two pages link to. Every other
 * route (demo-showcase, which has its own top bar and Home chip, and all lab
 * or dev routes) renders no bar. Exact paths only.
 */
import React from 'react';
import { useRouter } from 'next/router';
import SiteNavGlass, { GlassVariant, Dock, NavTuning, NAV_TUNING_LIVE_DARK, NAV_TUNING_LIVE_LIGHT } from './SiteNavGlass';
import navSite from './nav-site.json';

/* Allowed range per value (same as the tuner and the Apply route). */
const RANGE: Record<string, [number, number]> = {
  fill: [0, 1.1], rim: [0, 2], highlight: [0, 2], blur: [0, 40], shadow: [0, 4], glow: [0, 2], hover: [0, 2],
  lineWidth: [20, 100], lineThick: [0.5, 4], lineGap: [0, 14], chipHover: [0, 3], menuRow: [0, 3],
};
/** Per field: the file's value if it is a number in range (or a #rrggbb tint), else the built-in
 *  live default. A hand-edited or badly merged nav-site.json can't break the live bar. */
const sanitize = (raw: unknown, fallback: Required<NavTuning>): NavTuning => {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const out: Record<string, number | string> = {};
  for (const [k, [lo, hi]] of Object.entries(RANGE)) {
    const v = o[k];
    out[k] = typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi ? v : (fallback[k as keyof NavTuning] as number);
  }
  out.tint = typeof o.tint === 'string' && /^#[0-9a-fA-F]{6}$/.test(o.tint) ? o.tint : '';
  return out as NavTuning;
};

/** The live bar's settings file (dock mode + per-tone tuning), read at build time, checked per
 *  field. (A missing file fails the build loudly; it is a static import.) */
const RAW = navSite as Record<string, unknown>;
const SITE: { dock: Dock; dark: NavTuning; light: NavTuning } = {
  dock: RAW.dock === 'docked' ? 'docked' : 'float',
  dark: sanitize(RAW.dark, NAV_TUNING_LIVE_DARK),
  light: sanitize(RAW.light, NAV_TUNING_LIVE_LIGHT),
};

/** Which glass direction is mounted site-wide: set when the operator picks. */
export const GATE_VARIANT: GlassVariant = 'clay';

export const NAV_ALLOWED_PATHS = [
  '/', '/projects',
  // linked from HeroBanner / CarouselDemos / ProjectsPage
  '/ai-confidence-tracker', '/ollama', '/trace', '/clipperstream', '/voiceinterface/realtime',
  // linked from CarouselBrand / ProjectsPage
  '/portfolio2025/eldugo', '/portfolio2025/logo', '/portfolio2025/activeledger',
  '/portfolio2025/magmadeck', '/portfolio2025/actdeck', '/madeforhumans',
];

export const isNavHidden = (pathname: string) => !NAV_ALLOWED_PATHS.includes(pathname);

const SiteNavGate: React.FC = () => {
  const { pathname } = useRouter();
  if (isNavHidden(pathname)) return null;
  return <SiteNavGlass variant={GATE_VARIANT} dock={SITE.dock} site={{ dark: SITE.dark, light: SITE.light }} />;
};

export default SiteNavGate;
