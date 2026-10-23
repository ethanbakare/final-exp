/**
 * "Apply to site" for the navbar tuner: writes src/projects/site-nav/nav-site.json, the live bar's
 * settings file ({"dock","dark","light"}). Dev only: refused in production builds (403), because
 * a deployed site must not rewrite its own source. The file is a static import in SiteNavGate, so
 * a write hot-reloads the live bar in dev, and a production build bakes whatever is committed.
 *
 *   GET                               -> { text, json }  the current file
 *   POST { dock, tone, values }       -> writes `values` into the slot for `tone` (dark | light; the
 *                                        mid tone has no slot of its own and writes to "dark") and
 *                                        sets "dock". Returns { previous, current, slot, applied }.
 *   POST { restore: <previous text> } -> re-validates it and writes back its cleaned fields in the
 *                                        file's own layout (byte-identical for a file in that layout).
 *
 * Only same-origin JSON requests are accepted: the dev server listens on the LAN, and this route
 * writes a source file, so a cross-site form post (or a page on another origin) must not reach it.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';
import { NAV_SITE_FILE } from '@/projects/site-nav/tunerServerPaths';

const NUM_KEYS = ['fill', 'rim', 'highlight', 'blur', 'shadow', 'glow', 'hover'] as const;
const RANGE: Record<(typeof NUM_KEYS)[number], [number, number]> = {
  fill: [0, 1.1], rim: [0, 2], highlight: [0, 2], blur: [0, 40], shadow: [0, 4], glow: [0, 2], hover: [0, 2],
};
const OPT_KEYS = ['lineWidth', 'lineThick', 'lineGap', 'chipHover', 'menuRow'] as const;
const OPT_RANGE: Record<(typeof OPT_KEYS)[number], [number, number]> = { lineWidth: [20, 100], lineThick: [0.5, 4], lineGap: [0, 14], chipHover: [0, 3], menuRow: [0, 3] };
type Slot = Record<string, number | string>;

const cleanSlot = (v: unknown): Slot | null => {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const out: Slot = {};
  for (const k of NUM_KEYS) {
    const n = o[k];
    if (typeof n !== 'number' || !Number.isFinite(n) || n < RANGE[k][0] || n > RANGE[k][1]) return null;
    out[k] = n;
  }
  // Underline values (added later): optional, so files and profiles written before them stay valid.
  for (const k of OPT_KEYS) {
    const n = o[k];
    if (n === undefined) continue;
    if (typeof n !== 'number' || !Number.isFinite(n) || n < OPT_RANGE[k][0] || n > OPT_RANGE[k][1]) return null;
    out[k] = n;
  }
  if (o.tint !== undefined && o.tint !== '') {
    if (typeof o.tint !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(o.tint)) return null;
    out.tint = o.tint;
  }
  return out;
};

const validFile = (j: unknown): j is { dock: string; dark: Slot; light: Slot } => {
  if (!j || typeof j !== 'object') return false;
  const o = j as Record<string, unknown>;
  return (o.dock === 'float' || o.dock === 'docked') && !!cleanSlot(o.dark) && !!cleanSlot(o.light);
};

/* Same layout as the committed file: one line per tone. */
const slotLine = (s: Slot) => '{ ' + Object.entries(s).map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(', ') + ' }';
const serialize = (dock: string, dark: Slot, light: Slot) =>
  `{\n  "dock": ${JSON.stringify(dock)},\n  "dark": ${slotLine(dark)},\n  "light": ${slotLine(light)}\n}\n`;

/* Write via a temp file in the same folder + rename, so the dev watcher never reads half a file. */
const writeAtomic = async (text: string) => {
  const tmp = path.join(path.dirname(NAV_SITE_FILE), `.nav-site.${process.pid}.tmp`);
  await fs.writeFile(tmp, text);
  await fs.rename(tmp, NAV_SITE_FILE);
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: 'Disabled in production' });

  if (req.method === 'GET') {
    try {
      const text = await fs.readFile(NAV_SITE_FILE, 'utf-8');
      return res.json({ text, json: JSON.parse(text) });
    } catch {
      return res.status(500).json({ error: 'Could not read nav-site.json' });
    }
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end();
  }

  // Same-origin JSON only. A cross-site form can't send application/json without a CORS
  // preflight (which this route never approves), and the Origin must match the Host.
  if (!String(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) {
    return res.status(415).json({ error: 'Send application/json' });
  }
  const origin = req.headers.origin;
  if (origin) {
    let ok = false;
    try {
      ok = new URL(origin).host === req.headers.host;
    } catch {
      ok = false;
    }
    if (!ok) return res.status(403).json({ error: 'Cross-origin request refused' });
  }

  try {
    const body = req.body ?? {};
    if (typeof body.restore === 'string') {
      let parsed: unknown;
      try {
        parsed = JSON.parse(body.restore);
      } catch {
        return res.status(400).json({ error: 'restore is not JSON' });
      }
      if (!validFile(parsed)) return res.status(400).json({ error: 'restore does not match {dock, dark, light}' });
      // Write the validated fields, never the raw text (no extra keys can ride along).
      const text = serialize(parsed.dock, cleanSlot(parsed.dark) as Slot, cleanSlot(parsed.light) as Slot);
      await writeAtomic(text);
      return res.json({ ok: true, restored: true, current: text });
    }

    const { dock, tone, values } = body;
    if (dock !== 'float' && dock !== 'docked') return res.status(400).json({ error: 'dock must be "float" or "docked"' });
    if (tone !== 'dark' && tone !== 'light' && tone !== 'mid') return res.status(400).json({ error: 'tone must be dark, light or mid' });
    const slotValues = cleanSlot(values);
    if (!slotValues) return res.status(400).json({ error: 'values are missing or out of range' });

    const previous = await fs.readFile(NAV_SITE_FILE, 'utf-8');
    const cur = JSON.parse(previous);
    if (!validFile(cur)) return res.status(500).json({ error: 'existing nav-site.json is not {dock, dark, light}' });

    const slot = tone === 'light' ? 'light' : 'dark';
    const next = serialize(
      dock,
      slot === 'dark' ? slotValues : (cleanSlot(cur.dark) as Slot),
      slot === 'light' ? slotValues : (cleanSlot(cur.light) as Slot),
    );
    await writeAtomic(next);
    return res.json({ ok: true, previous, current: next, slot, applied: { dock, ...slotValues } });
  } catch {
    return res.status(500).json({ error: 'Failed to write nav-site.json' });
  }
}
