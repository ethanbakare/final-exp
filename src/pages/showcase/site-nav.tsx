/**
 * Navbar tuner — route: /showcase/site-nav
 *
 * One navbar preview over a switchable backdrop. The preview is its own scroll box with real
 * content (text, cards, photographs, the project colours) that passes under the bar, so glass,
 * blur and rim can be judged over things that move. Pick a starting style in the dropdown,
 * then drag the sliders to adjust that style on the bar. The sliders feed the same
 * `tuning` prop (CSS custom properties) the bar already supports, so what you see here is
 * exactly what the snippet from "Copy values" gives the real bar.
 *
 * Sliders reuse the shared SliderRow used by the other tuning panels in the repo. Readouts are
 * multipliers of the live look (1.00× = live) with the range printed under each slider.
 *
 * Backgrounds are copied from the real pages — keep in sync:
 *   black      → home page (#0a0a09)
 *   white      → the white margin around the framed project pages
 *   clipstream → /clipperstream (#F0EBEB + 16px dots, rgba(0,0,0,.08))
 *   watercolour→ /ai-confidence-tracker (wt1.webp, rotated -90deg)
 *   orange     → /trace (#965935)
 *   ollama     → the real /ollama page, in an iframe (dark tone, as the live site uses on /ollama)
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import SiteNavGlass, { GlassVariant, NAV_TUNING_LIVE_DARK, NAV_TUNING_LIVE_LIGHT, NavTuning, navTintVars } from '@/projects/site-nav/SiteNavGlass';
import SliderRow from '@/projects/blob-orb/components/shared/SliderRow';
import { LabelContrast } from '@/projects/site-nav/LabelContrast';
import { ColorPickerButton } from '@/projects/voiceinterface/radial-states/ColorPicker';
import { Check, ChevronDown, Pencil, RotateCcw, Save, Trash2, X } from 'lucide-react';
import {
  ACTIVE_ID_STORAGE_KEY, Dock, TunerProfile, fetchTunerProfiles, makeDefaultProfile, makeNewId, persistTunerProfiles, pickFreshName, profileSig,
} from '@/projects/site-nav/tunerProfiles';

type Backdrop = {
  key: 'dark' | 'white' | 'clipstream' | 'pink' | 'orange' | 'ollama';
  label: string;
  ink: string;
  tone: 'dark' | 'light' | 'mid';
};
const BACKDROPS: Backdrop[] = [
  { key: 'dark', label: 'Black', ink: '#f4f4f4', tone: 'dark' },
  { key: 'white', label: 'White', ink: '#1c1c1c', tone: 'light' },
  { key: 'clipstream', label: 'ClipStream dots', ink: '#1c1c1c', tone: 'light' },
  { key: 'pink', label: 'Watercolour', ink: '#3a3a3a', tone: 'light' },
  { key: 'orange', label: 'Orange', ink: '#fff6ee', tone: 'mid' },
  { key: 'ollama', label: 'Ollama', ink: '#f4f4f4', tone: 'dark' },
];

type Rim = 'a' | 'b' | 'c';
type StyleDef = { key: string; label: string; variant: GlassVariant; rim?: Rim; archived?: boolean; values: Required<NavTuning> };
/* Live = the bar's own tuned values (dark tone; the light tone swaps in NAV_TUNING_LIVE_LIGHT). */
const LIVE: Required<NavTuning> = { ...NAV_TUNING_LIVE_DARK };
/* Rim A/B/C values equal the fallbacks of the .rim-a/b/c CSS in SiteNavGlass, so a style
   picked here looks the same as `rim="a|b|c"` with no tuning. */
const STYLES: StyleDef[] = [
  { key: 'live', label: 'Live', variant: 'clay', values: LIVE },
  { key: 'rim-a', label: 'Rim A subtle', variant: 'clay', rim: 'a', values: { ...LIVE, rim: 0.5, highlight: 0.5, glow: 0.75 } },
  { key: 'rim-b', label: 'Rim B hairline', variant: 'clay', rim: 'b', values: { ...LIVE, rim: 0.55, highlight: 0.4, glow: 0 } },
  { key: 'rim-c', label: 'Rim C none', variant: 'clay', rim: 'c', values: { ...LIVE, rim: 0, highlight: 0, glow: 0, shadow: 3.5 } },
  { key: 'opacity', label: 'Opacity variant', variant: 'clay', values: { ...LIVE, fill: 0.6, rim: 0.6, highlight: 0.6 } },
  { key: 'lens', label: 'Frosted lens', variant: 'lens', archived: true, values: LIVE },
  { key: 'quiet', label: 'Quiet', variant: 'quiet', archived: true, values: LIVE },
];

const fmt = (n: number) => String(Math.round(n * 100) / 100);
const r2 = (n: number) => Math.round(n * 100) / 100;

/* Tint defaults of the live bar: smoked dark on the dark/mid tones, warm frost on the light tone. */
const TINT_DARK = '#121212'; // neutral grey, no blue cast (matches the bar's own default)
const TINT_LIGHT = '#fbf9f8';

/* Real site assets and project colours for the scroll-under content. */
const SHOTS = [
  '/images/new-home/brand/act.webp',
  '/images/new-home/brand/activeledger.webp',
  '/images/new-home/brand/eldugo.webp',
  '/images/new-home/brand/logofolio.webp',
  '/images/new-home/brand/made-for-humans.webp',
  '/images/new-home/brand/magma.webp',
];
const SWATCHES = ['#965935', '#2b5fd9', '#e4572e', '#1f9d6b', '#f2c14e', '#7b5cff'];

/* Slider plus its honest range underneath: readouts are multipliers of the live look
   (1.00× = live), so the thumb position and the number can be checked against the printed
   min and max. */
function TunerRow(p: { label: string; value: number; min: number; max: number; step: number; unit: string; decimals: number; disabled: boolean; onChange: (v: number) => void }) {
  return (
    <div>
      <SliderRow label={p.label} value={p.value} min={p.min} max={p.max} step={p.step} unit={p.unit} decimals={p.decimals} disabled={p.disabled} onChange={p.onChange} />
      <div className="mt-0.5 flex justify-between text-[10px] tabular-nums text-gray-300" aria-hidden="true">
        <span>{p.min}{p.unit}</span>
        <span>{p.max}{p.unit}</span>
      </div>
    </div>
  );
}

/* Content that passes under the bar while the stage scrolls. Same structure on every backdrop,
   coloured per backdrop so the glass sits over something genuinely different each time. */
function ScrollContent({ bd }: { bd: Backdrop }) {
  const soft = bd.key === 'dark' ? 'rgba(255,255,255,0.08)' : bd.key === 'orange' ? 'rgba(255,246,238,0.16)' : 'rgba(28,28,28,0.07)';
  return (
    <div className="sc" style={{ color: bd.ink }}>
      <div className="eyebrow">Scroll this preview</div>
      <h2 className="h">Things that move under the glass</h2>
      <p className="p">
        Frosted glass is only as good as what passes beneath it. Scroll slowly and watch the headline, the cards and the
        photographs slide under the bar: blur softens them, the tint calms them, the rim keeps the edge readable.
      </p>
      <div className="swatches">
        {SWATCHES.map((c) => (
          <div key={c} className="sw" style={{ background: c }} />
        ))}
      </div>
      <p className="p">
        Read the lettering that crosses the top edge. If it stays legible without turning into a grey smear, the bar is doing its
        job. If you can still make out the letterforms through the glass, there is not enough blur or tint.
      </p>
      <div className="shots">
        {SHOTS.map((src) => (
          <img key={src} src={src} alt="" draggable={false} />
        ))}
      </div>
      <div className="card" style={{ background: SWATCHES[1], color: '#fff' }}>
        Dense colour, white type. A strong block like this shows the blur radius and the tint most clearly.
      </div>
      <h3 className="h3">A second block of text</h3>
      <p className="p">
        The quick brown fox jumped over the lazy dog, then thought better of it and walked around. Long lines, short lines, and a
        few numbers: 0123456789. The shape of the text matters more than what it says.
      </p>
      <div className="row">
        <div className="tile" style={{ background: soft }}>
          <b>Calm</b>
          <span>Soft fills, quiet edges.</span>
        </div>
        <div className="tile" style={{ background: SWATCHES[2], color: '#fff' }}>
          <b>Loud</b>
          <span>Saturated block.</span>
        </div>
        <div className="tile" style={{ background: SWATCHES[4], color: '#1c1c1c' }}>
          <b>Bright</b>
          <span>High luminance.</span>
        </div>
      </div>
      <div className="wide">
        <img src="/images/voice-interface/wt6.webp" alt="" draggable={false} />
      </div>
      <div className="card" style={{ background: SWATCHES[3], color: '#fff' }}>
        Green block, then more photography.
      </div>
      <div className="wide">
        <img src="/images/voice-interface/wt7.webp" alt="" draggable={false} />
      </div>
      <div className="shots">
        <img src="/images/new-home/voice-ui-blob.webp" alt="" draggable={false} />
        <img src="/images/madeforhumans/b-main.webp" alt="" draggable={false} />
      </div>
      <p className="p">End of the page. Scroll back up and the first block slides out from under the bar again.</p>
      <div className="tail" />
    </div>
  );
}

/* Operator: the tuner is a dev tool, not a public page. 404 in production builds; works in dev. */
export async function getStaticProps() {
  if (process.env.NODE_ENV === 'production') return { notFound: true };
  return { props: {} };
}

export default function SiteNavTunerPage() {
  const [styleKey, setStyleKey] = useState('live');
  const [bdKey, setBdKey] = useState<Backdrop['key']>('dark');
  const [phone, setPhone] = useState(false);
  /* One value set per tone: edits on a light backdrop never reach the dark set or vice versa,
     and Apply writes the previewed tone's own set into its own slot. Mid uses the dark set,
     as the site does. */
  type ToneSlot = 'dark' | 'light';
  const [valsBy, setValsBy] = useState<Record<ToneSlot, Required<NavTuning>>>({ dark: NAV_TUNING_LIVE_DARK, light: NAV_TUNING_LIVE_LIGHT });
  const [copied, setCopied] = useState(false);
  /* Floating (default) or docked: the preview's dock prop, and what Apply sets for the site. */
  const [dock, setDock] = useState<Dock>('float');

  /* ---- profiles: named, saved to site-nav-profiles.json through /api/studio-profiles, same
     model as the voice editors (whole-array persist, active id in localStorage, Update / Save as /
     Rename / Discard, two-step delete) ---- */
  const [profiles, setProfiles] = useState<TunerProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [profilesLoaded, setProfilesLoaded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [renameDraft, setRenameDraft] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  /* ---- Apply to site ---- */
  type Applied = { slot: 'dark' | 'light'; dock: Dock; values: Record<string, number | string>; previous: string; reverted: boolean; same?: boolean };
  const [applied, setApplied] = useState<Applied | null>(null);
  const [applyMsg, setApplyMsg] = useState<string | null>(null);
  const [applyBusy, setApplyBusy] = useState(false);
  /* The site's current settings (nav-site.json), so Apply is only live when the controls differ. */
  type LiveSite = { dock?: unknown; dark?: Record<string, unknown>; light?: Record<string, unknown> };
  const [liveSite, setLiveSite] = useState<LiveSite | null>(null);
  const refreshLive = () =>
    fetch('/api/site-nav-apply')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j?.json && setLiveSite(j.json as LiveSite))
      .catch(() => undefined);
  useEffect(() => {
    refreshLive();
    // the file can change from another tab or a builder: re-read when the tab comes back
    const onVis = () => document.visibilityState === 'visible' && refreshLive();
    window.addEventListener('focus', refreshLive);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('focus', refreshLive);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const style = STYLES.find((s) => s.key === styleKey)!;
  const bd = BACKDROPS.find((b) => b.key === bdKey)!;
  const toneSlot: ToneSlot = bd.tone === 'light' ? 'light' : 'dark';
  const vals = valsBy[toneSlot];
  /* Changes the previewed tone's set only. */
  const setVals = (u: Required<NavTuning> | ((v: Required<NavTuning>) => Required<NavTuning>)) =>
    setValsBy((by) => ({ ...by, [toneSlot]: typeof u === 'function' ? u(by[toneSlot]) : u }));
  const locked = style.variant !== 'clay';
  /* Tint: '' = the live colour for the backdrop's tone. A picked colour also sets the bar's
     text tone so the labels stay legible against it. */
  const liveTint = bd.tone === 'light' ? TINT_LIGHT : TINT_DARK;
  const tint = vals.tint || liveTint;
  const tintInfo = navTintVars(tint);
  const tintLum = tintInfo?.lum ?? 0;
  const barTone: Backdrop['tone'] = locked || !vals.tint ? bd.tone : tintLum > 0.5 ? 'light' : bd.tone === 'light' ? 'dark' : bd.tone;

  /* Live on a light backdrop starts from the light tone's own values. */
  /* Live = what the site actually uses for that tone: its own slot in nav-site.json (light for the
     light tone, dark for dark and mid), over the built-in defaults for that tone. */
  const liveValsFor = (tone: Backdrop['tone']): Required<NavTuning> =>
    ({
      ...(tone === 'light' ? NAV_TUNING_LIVE_LIGHT : NAV_TUNING_LIVE_DARK),
      ...((tone === 'light' ? liveSite?.light : liveSite?.dark) ?? {}),
    }) as Required<NavTuning>;
  const presetFor = (k: string, tone: Backdrop['tone']) =>
    k === 'live' ? liveValsFor(tone) : STYLES.find((s) => s.key === k)!.values;
  /* Picking (or resetting) a style sets both tones, each from its own values. */
  const pick = (k: string) => {
    setStyleKey(k);
    setValsBy({ dark: presetFor(k, 'dark'), light: presetFor(k, 'light') });
  };
  /* When the site's settings arrive or change, a tone the operator hasn't edited picks up its
     own live values; an edited tone keeps its edits. */
  const lastLive = useRef<Record<ToneSlot, Required<NavTuning>> | null>(null);
  useEffect(() => {
    if (styleKey !== 'live' || !liveSite) return;
    const same = (a: NavTuning, b: NavTuning) => (Object.keys(b) as (keyof NavTuning)[]).every((key) => a[key] === b[key]);
    const next = { dark: liveValsFor('dark'), light: liveValsFor('light') };
    setValsBy((by) => {
      const keep = (t: ToneSlot) =>
        same(by[t], t === 'light' ? NAV_TUNING_LIVE_LIGHT : NAV_TUNING_LIVE_DARK) || (lastLive.current && same(by[t], lastLive.current[t])) ? next[t] : by[t];
      return { dark: keep('dark'), light: keep('light') };
    });
    lastLive.current = next;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveSite]);
  const set = (patch: Partial<NavTuning>) => setVals((v) => ({ ...v, ...patch }));

  const loadProfile = (p: TunerProfile) => {
    setStyleKey(p.styleKey);
    // a profile fills the tone being previewed (it was saved from one tone's set)
    setVals({ ...(toneSlot === 'light' ? NAV_TUNING_LIVE_LIGHT : NAV_TUNING_LIVE_DARK), ...p.values } as Required<NavTuning>);
    setDock(p.dock);
  };
  const current = () => ({ styleKey, dock, values: { ...NAV_TUNING_LIVE_DARK, ...vals } as Required<NavTuning> });

  /* Load from disk on mount; seed a Default profile when the file is empty; restore the last active one. */
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchTunerProfiles(),
      // The live site's own settings, so "Default" always shows what is live (it was seeded
      // with the values of the day it was created and went stale as the defaults moved).
      fetch('/api/site-nav-apply').then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([arr, live]) => {
      if (cancelled) return;
      const liveVals = { ...NAV_TUNING_LIVE_DARK, ...(live?.json?.dark ?? {}) } as Required<NavTuning>;
      const liveDock: Dock = live?.json?.dock === 'docked' ? 'docked' : 'float';
      let list = arr;
      if (list.length === 0) {
        list = [{ ...makeDefaultProfile(liveVals), dock: liveDock }];
        persistTunerProfiles(list);
      } else {
        const d = list.find((x) => x.id === 'sn-default');
        if (d && profileSig(d) !== profileSig({ styleKey: 'live', dock: liveDock, values: liveVals })) {
          list = list.map((x) => (x.id === 'sn-default' ? { ...x, styleKey: 'live', dock: liveDock, values: liveVals, lastModified: Date.now() } : x));
          persistTunerProfiles(list);
        }
      }
      setProfiles(list);
      let savedId: string | null = null;
      try { savedId = window.localStorage.getItem(ACTIVE_ID_STORAGE_KEY); } catch { /* storage unavailable */ }
      const initial = list.find((p) => p.id === savedId) ?? list[0];
      setActiveProfileId(initial.id);
      loadProfile(initial);
      setProfilesLoaded(true);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!profilesLoaded || !activeProfileId) return;
    try { window.localStorage.setItem(ACTIVE_ID_STORAGE_KEY, activeProfileId); } catch { /* storage unavailable */ }
  }, [activeProfileId, profilesLoaded]);
  useEffect(() => {
    if (!showMenu) return;
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) { setShowMenu(false); setConfirmDeleteId(null); }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showMenu]);

  const activeProfile = useMemo(() => profiles.find((p) => p.id === activeProfileId) ?? null, [profiles, activeProfileId]);
  const isDirty = !!activeProfile && profileSig(activeProfile) !== profileSig(current());

  const selectProfile = (id: string) => {
    const p = profiles.find((x) => x.id === id);
    if (!p) return;
    setActiveProfileId(id);
    loadProfile(p);
    setShowMenu(false);
    setConfirmDeleteId(null);
  };
  const updateProfile = async () => {
    if (!activeProfile) return;
    const updated: TunerProfile = { ...activeProfile, ...current(), lastModified: Date.now() };
    const next = profiles.map((p) => (p.id === updated.id ? updated : p));
    setProfiles(next);
    await persistTunerProfiles(next);
  };
  const discardEdits = () => { if (activeProfile) loadProfile(activeProfile); };
  const saveAs = async () => {
    const name = saveName.trim();
    if (!name) return;
    const created: TunerProfile = { id: makeNewId(), name, ...current(), lastModified: Date.now() };
    const next = [...profiles, created];
    setProfiles(next);
    setActiveProfileId(created.id);
    setShowSave(false);
    setSaveName('');
    await persistTunerProfiles(next);
  };
  const commitRename = async () => {
    const name = (renameDraft ?? '').trim();
    if (!name || !activeProfile || name === activeProfile.name) { setRenameDraft(null); return; }
    const next = profiles.map((p) => (p.id === activeProfile.id ? { ...p, name, lastModified: Date.now() } : p));
    setProfiles(next);
    setRenameDraft(null);
    await persistTunerProfiles(next);
  };
  const deleteProfile = async (id: string) => {
    const next = profiles.filter((p) => p.id !== id);
    setConfirmDeleteId(null);
    setProfiles(next);
    if (id === activeProfileId) {
      /* the deleted one was loaded: keep the bar as it is, but no profile is active until one is picked */
      setActiveProfileId(next[0]?.id ?? null);
      if (next[0]) loadProfile(next[0]);
    }
    await persistTunerProfiles(next);
  };

  /* Apply to site: tone being previewed picks the slot (mid has no slot of its own and uses "dark"). */
  const slotOf = bd.tone === 'light' ? 'light' : 'dark';
  /* Do the controls (dock + every value of the previewed tone's slot) equal what the site uses? */
  const matchesSite = (() => {
    if (!liveSite) return false;
    if ((liveSite.dock === 'docked' ? 'docked' : 'float') !== dock) return false;
    const live = { ...(slotOf === 'light' ? NAV_TUNING_LIVE_LIGHT : NAV_TUNING_LIVE_DARK), ...(liveSite[slotOf] ?? {}) } as Record<string, unknown>;
    return (Object.keys(vals) as (keyof NavTuning)[]).every((k) =>
      k === 'tint' ? (String(live.tint ?? '') || '') === (vals.tint || '') : live[k] === vals[k],
    );
  })();
  const applyToSite = async () => {
    setApplyBusy(true);
    setApplyMsg(null);
    try {
      const values = { ...vals } as Record<string, number | string>;
      if (!values.tint) delete values.tint;
      const r = await fetch('/api/site-nav-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dock, tone: bd.tone, values }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setApplyMsg(`Apply failed (${r.status}): ${j.error || 'no details'}. Nothing was written.`); return; }
      setApplied({ slot: j.slot, dock, values: j.applied, previous: j.previous, reverted: false, same: j.previous === j.current });
      try { setLiveSite(JSON.parse(j.current)); } catch { refreshLive(); }
    } catch {
      setApplyMsg('Apply failed: no answer from this server (is the dev server running?). Nothing was written.');
    } finally {
      setApplyBusy(false);
    }
  };
  const revertApply = async () => {
    if (!applied) return;
    setApplyBusy(true);
    try {
      const r = await fetch('/api/site-nav-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restore: applied.previous }),
      });
      if (!r.ok) { setApplyMsg((await r.json()).error || 'Revert failed'); return; }
      setApplied({ ...applied, reverted: true });
      refreshLive();
    } catch {
      setApplyMsg('Revert failed');
    } finally {
      setApplyBusy(false);
    }
  };

  const snippet = `/* ${style.label}, text tone: ${barTone} (the tuner's look needs this tone; pass tone="${barTone}" or add it to the route's tone map) */
.gnav {
  --nav-fill-k: ${fmt(vals.fill)};
  --nav-rim-k: ${fmt(vals.rim)};
  --nav-hl-k: ${fmt(vals.highlight)};
  --nav-blur: ${fmt(vals.blur)}px;${vals.blur <= 0 ? '\n  --nav-bdf: none; /* blur 0 = no backdrop filter at all */' : ''}
  --nav-shadow-k: ${fmt(vals.shadow)};
  --nav-glow-k: ${fmt(vals.glow)};
  --nav-hover-k: ${fmt(vals.hover)};
  --nav-line-w: ${fmt(vals.lineWidth)}%;
  --nav-line-h: ${fmt(vals.lineThick)}px;
  --nav-line-gap: ${fmt(vals.lineGap)}px;
  --nav-chip-hover-k: ${fmt(vals.chipHover)};
  --nav-menu-row-k: ${fmt(vals.menuRow)};
  --nav-tint-rgb: ${tintInfo?.rgb}; /* ${tint} */
  --nav-tint-rgb2: ${tintInfo?.rgb2};
}
/* or */
<SiteNavGlass variant="${style.variant}" tone="${barTone}"${style.rim ? ` rim="${style.rim}"` : ''} tuning={{ fill: ${fmt(vals.fill)}, rim: ${fmt(vals.rim)}, highlight: ${fmt(vals.highlight)}, blur: ${fmt(vals.blur)}, shadow: ${fmt(vals.shadow)}, glow: ${fmt(vals.glow)}, hover: ${fmt(vals.hover)}, lineWidth: ${fmt(vals.lineWidth)}, lineThick: ${fmt(vals.lineThick)}, lineGap: ${fmt(vals.lineGap)}, chipHover: ${fmt(vals.chipHover)}, menuRow: ${fmt(vals.menuRow)}, tint: '${tint}' }} />`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = snippet;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  const seg = (on: boolean) =>
    `px-3 py-1 rounded-md text-xs font-medium transition-colors ${on ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`;

  return (
    <>
      <Head>
        <title>Navbar tuner</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="min-h-screen bg-[#f6f6f5] px-4 pb-28 pt-0 text-gray-800 md:px-6 lg:py-4">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-3 lg:flex-row lg:items-start lg:gap-4">
          {/* ---- preview ---- */}
          {/* On narrow screens the preview sticks to the top so the bar stays in view while the panel below scrolls. */}
          <section className="sticky top-0 z-20 -mx-4 min-w-0 bg-[#f6f6f5] px-4 pb-1 pt-3 md:-mx-6 md:px-6 lg:static lg:top-4 lg:z-auto lg:mx-0 lg:flex-1 lg:bg-transparent lg:p-0">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-1 rounded-lg bg-gray-200/70 p-0.5" role="group" aria-label="Device">
                <button type="button" data-testid="dev-desktop" className={seg(!phone)} onClick={() => setPhone(false)}>Desktop</button>
                <button type="button" data-testid="dev-phone" className={seg(phone)} onClick={() => setPhone(true)}>Phone</button>
              </div>
              <div className="flex flex-wrap gap-1 rounded-lg bg-gray-200/70 p-0.5" role="group" aria-label="Background">
                {BACKDROPS.map((b) => (
                  <button key={b.key} type="button" data-testid={`bd-${b.key}`} className={seg(bdKey === b.key)} onClick={() => setBdKey(b.key)}>
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-center rounded-2xl bg-gray-200/50 p-2 lg:p-5">
              <div className={`stage stage-${bd.key}${phone ? ' phone' : ''}`} data-testid="stage">
                {bd.key === 'pink' && <img className="pink-img" src="/images/voice-interface/wt1.webp" alt="" draggable={false} />}
                {bd.key === 'ollama' ? (
                  /* The real /ollama page, so the bar is judged over what the live site shows. The page's own
                     bar is hidden on load (it is the site-wide one); this stage has the tuned bar on top. */
                  <iframe
                    className="ollama-frame"
                    data-testid="ollama-frame"
                    src="/ollama"
                    title="Ollama page, scrolls under the bar"
                    onLoad={(e) => {
                      const doc = e.currentTarget.contentDocument;
                      if (!doc) return;
                      const st = doc.createElement('style');
                      st.textContent = '.gnav{display:none !important}';
                      doc.head.appendChild(st);
                    }}
                  />
                ) : (
                  <div className="scroller" data-testid="scroller" tabIndex={0} aria-label="Preview content, scrolls under the bar">
                    <ScrollContent bd={bd} />
                  </div>
                )}
                <SiteNavGlass
                  variant={style.variant}
                  embedded
                  forceMobile={phone}
                  initialActive="projects"
                  tone={barTone}
                  rim={style.rim}
                  tuning={locked ? undefined : vals}
                  dock={dock}
                />
              </div>
            </div>
          </section>

          {/* ---- control panel (sticky on wide screens, scrolls inside itself if taller than the window) ---- */}
          <aside className="w-full shrink-0 box-border rounded-2xl bg-white p-4 shadow-sm lg:sticky lg:top-4 lg:max-h-[calc(100vh-6rem)] lg:w-[440px] lg:overflow-y-auto" data-testid="panel">
            <div className="grid grid-cols-2 items-start gap-x-4 gap-y-2">
            <div className="min-w-0">
              <label htmlFor="nav-style" className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Style</label>
              <select
                id="nav-style"
                data-testid="style-select"
                value={styleKey}
                onChange={(e) => pick(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-400"
              >
                {STYLES.filter((s) => !s.archived).map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
                <optgroup label="Archived">
                  {STYLES.filter((s) => s.archived).map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className={`min-w-0 text-sm ${locked ? 'pointer-events-none opacity-40' : ''}`}>
              <span id="tint-label" className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Tint colour</span>
              <span className="flex items-center gap-2">
                <span className="flex gap-0.5 rounded-md bg-gray-100 p-0.5" role="group" aria-labelledby="tint-label">
                  <button type="button" data-testid="tint-dark" disabled={locked} aria-pressed={tintLum <= 0.5} className={seg(tintLum <= 0.5)} onClick={() => set({ tint: TINT_DARK })}>Dark</button>
                  <button type="button" data-testid="tint-light" disabled={locked} aria-pressed={tintLum > 0.5} className={seg(tintLum > 0.5)} onClick={() => set({ tint: TINT_LIGHT })}>Light</button>
                </span>
                {/* The colour picker from the voice tuning panels, reused as is. */}
                <span data-testid="tint-picker" className={locked ? 'pointer-events-none opacity-40' : ''} aria-disabled={locked || undefined}>
                  <ColorPickerButton value={tint} onChange={(v) => set({ tint: v })} title="Tint colour" placement="below" clearAbove={() => {
                      // only when the preview bar sits above the swatch (stacked layout on narrow screens);
                      // beside it (desktop side panel) the picker just opens under its swatch
                      const bar = document.querySelector('[data-testid=stage] .gnav .bar')?.getBoundingClientRect();
                      const sw = document.querySelector('[data-testid=tint-picker]')?.getBoundingClientRect();
                      return bar && sw && bar.bottom <= sw.top ? bar.bottom : 0;
                    }} />
                </span>
              </span>
            </div>
            <div className="min-w-0">
              <span id="dock-label" className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Bar position</span>
              <span className="flex gap-0.5 rounded-md bg-gray-100 p-0.5" role="group" aria-labelledby="dock-label" data-testid="dock-switch" data-dock={dock}>
                <button type="button" data-testid="dock-float" aria-pressed={dock === 'float'} className={seg(dock === 'float')} onClick={() => setDock('float')}>Floating</button>
                <button type="button" data-testid="dock-docked" aria-pressed={dock === 'docked'} className={seg(dock === 'docked')} onClick={() => setDock('docked')}>Docked</button>
              </span>
            </div>

            {/* Profiles: named, saved to site-nav-profiles.json (same model as the voice editors) */}
            <div className="min-w-0" ref={menuRef} data-testid="profiles">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Profile</span>
              <div className="relative flex items-center gap-1">
                {showSave ? (
                  <>
                    <input
                      data-testid="profile-save-input"
                      type="text"
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveAs();
                        if (e.key === 'Escape') { setShowSave(false); setSaveName(''); }
                      }}
                      placeholder="Profile name"
                      autoFocus
                      className="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs outline-none focus:border-gray-500"
                    />
                    <button type="button" data-testid="profile-save-confirm" onClick={saveAs} disabled={!saveName.trim()} aria-label="Confirm save" className="p-1 text-green-600 disabled:text-gray-300"><Check size={14} /></button>
                    <button type="button" onClick={() => { setShowSave(false); setSaveName(''); }} aria-label="Cancel save" className="p-1 text-red-500"><X size={14} /></button>
                  </>
                ) : renameDraft !== null ? (
                  <input
                    data-testid="profile-rename-input"
                    type="text"
                    value={renameDraft}
                    onChange={(e) => setRenameDraft(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename();
                      if (e.key === 'Escape') setRenameDraft(null);
                    }}
                    placeholder="Rename profile"
                    autoFocus
                    className="min-w-0 flex-1 rounded-md border border-amber-400 bg-amber-50 px-2 py-1 text-xs outline-none"
                  />
                ) : (
                  <>
                    <button
                      type="button"
                      data-testid="profile-menu"
                      onClick={() => setShowMenu((o) => !o)}
                      className="flex min-w-0 flex-1 items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700"
                    >
                      <span className="min-w-0 flex-1 truncate text-left" data-testid="profile-name">{activeProfile?.name ?? 'None'}</span>
                      <ChevronDown size={12} className="shrink-0 text-gray-400" />
                    </button>
                    <button type="button" data-testid="profile-rename" disabled={!activeProfile} onClick={() => activeProfile && setRenameDraft(activeProfile.name)} aria-label="Rename current profile" title="Rename current profile" className="rounded-md bg-gray-100 p-1.5 text-gray-500 hover:text-gray-800 disabled:opacity-40"><Pencil size={12} /></button>
                    <button type="button" data-testid="profile-save" onClick={() => { setSaveName(pickFreshName(profiles)); setShowSave(true); setShowMenu(false); }} aria-label="Save as new profile" title="Save as new profile" className="rounded-md bg-gray-100 p-1.5 text-gray-500 hover:text-gray-800"><Save size={12} /></button>
                  </>
                )}
                {showMenu && !showSave && renameDraft === null && (
                  <div className="absolute left-0 top-full z-30 mt-1 max-h-48 w-56 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg" data-testid="profile-list">
                    {profiles.length === 0 && <div className="px-3 py-1.5 text-xs text-gray-400">No profiles yet</div>}
                    {profiles.map((p) => (
                      <div
                        key={p.id}
                        data-testid="profile-item"
                        onClick={() => selectProfile(p.id)}
                        className={`flex cursor-pointer items-center gap-1 px-3 py-1.5 text-xs hover:bg-gray-50 ${p.id === activeProfileId ? 'font-medium text-gray-800' : 'text-gray-500'}`}
                      >
                        <span className="min-w-0 flex-1 truncate">{p.name}</span>
                        <span className="text-[10px] text-gray-300">{p.dock === 'docked' ? 'docked' : 'floating'}</span>
                        {confirmDeleteId === p.id ? (
                          <>
                            <button type="button" data-testid="profile-delete-confirm" title="Confirm delete" onClick={(e) => { e.stopPropagation(); deleteProfile(p.id); }} className="text-red-500"><Check size={12} /></button>
                            <button type="button" title="Cancel delete" onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }} className="text-gray-400"><X size={12} /></button>
                          </>
                        ) : (
                          <button type="button" data-testid="profile-delete" title="Delete profile" onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(p.id); }} className="text-gray-300 hover:text-red-500"><Trash2 size={12} /></button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 min-[480px]:grid-cols-2" data-testid="sliders">
              <TunerRow label="Tint opacity" value={vals.fill} min={0} max={1.1} step={0.01} unit="×" decimals={2} disabled={locked} onChange={(v) => set({ fill: r2(v) })} />
              <TunerRow label="Blur" value={vals.blur} min={0} max={40} step={1} unit="px" decimals={0} disabled={locked} onChange={(v) => set({ blur: v })} />
              <TunerRow label="Rim" value={vals.rim} min={0} max={2} step={0.01} unit="×" decimals={2} disabled={locked} onChange={(v) => set({ rim: r2(v) })} />
              <TunerRow label="Top highlight" value={vals.highlight} min={0} max={2} step={0.01} unit="×" decimals={2} disabled={locked} onChange={(v) => set({ highlight: r2(v) })} />
              <TunerRow label="Bottom glow" value={vals.glow} min={0} max={2} step={0.01} unit="×" decimals={2} disabled={locked} onChange={(v) => set({ glow: r2(v) })} />
              <TunerRow label="Shadow" value={vals.shadow} min={0} max={4} step={0.01} unit="×" decimals={2} disabled={locked} onChange={(v) => set({ shadow: r2(v) })} />
              <TunerRow label="Underline opacity" value={vals.hover} min={0} max={2} step={0.01} unit="×" decimals={2} disabled={locked} onChange={(v) => set({ hover: r2(v) })} />
              <TunerRow label="Underline width" value={vals.lineWidth} min={20} max={100} step={1} unit="%" decimals={0} disabled={locked} onChange={(v) => set({ lineWidth: v })} />
              <TunerRow label="Underline thickness" value={vals.lineThick} min={0.5} max={4} step={0.1} unit="px" decimals={1} disabled={locked} onChange={(v) => set({ lineThick: r2(v) })} />
              <TunerRow label="Underline gap" value={vals.lineGap} min={0} max={14} step={0.5} unit="px" decimals={1} disabled={locked} onChange={(v) => set({ lineGap: r2(v) })} />
              <TunerRow label="Current-item hover" value={vals.chipHover} min={0} max={3} step={0.05} unit="×" decimals={2} disabled={locked} onChange={(v) => set({ chipHover: r2(v) })} />
              <TunerRow label="Menu current row" value={vals.menuRow} min={0} max={3} step={0.05} unit="×" decimals={2} disabled={locked} onChange={(v) => set({ menuRow: r2(v) })} />
            </div>
            {!locked && <LabelContrast stageSelector="[data-testid=stage]" deps={[vals, bdKey, styleKey, phone, barTone]} />}
            <p className="mt-2 text-[11px] leading-snug text-gray-400">
              {locked ? 'Archived style, shown as authored. Sliders apply to the Live family.' : '1.00× is the live look. With every slider at 0 only the contents remain. Visual preview: links, Contact and the phone page lock are inert here.'}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 border-t border-gray-100 pt-3">
              <button type="button" data-testid="copy" onClick={copy} disabled={locked} className="rounded-lg bg-gray-800 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-40">
                {copied ? 'Copied' : 'Copy values'}
              </button>
              <button type="button" data-testid="reset" onClick={() => pick(styleKey)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-800">
                Reset
              </button>
              {isDirty && (
                <>
                  <button type="button" data-testid="profile-update" onClick={updateProfile} className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-200">Update</button>
                  <button type="button" data-testid="profile-discard" onClick={discardEdits} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-800" title="Discard unsaved edits"><RotateCcw size={12} />Discard</button>
                </>
              )}
              <button
                type="button"
                data-testid="apply"
                data-matches={matchesSite || undefined}
                onClick={applyToSite}
                disabled={locked || applyBusy || matchesSite}
                className={`ml-auto rounded-lg px-3.5 py-1.5 text-xs font-medium ${matchesSite ? 'cursor-default bg-gray-100 text-gray-400' : 'bg-emerald-700 text-white hover:bg-emerald-600 disabled:opacity-40'}`}
                title={matchesSite ? `These controls already match the site (${slotOf} tone, ${dock === 'docked' ? 'docked' : 'floating'}). Change something to apply it.` : `Writes the values and the ${dock === 'docked' ? 'docked' : 'floating'} choice into nav-site.json (${slotOf} slot)`}
              >
                {applyBusy ? 'Applying…' : matchesSite ? 'Matches the site ✓' : 'Apply to site'}
              </button>
            </div>
            {applied && (
              <p className="mt-2 text-[11px] leading-snug text-gray-600" data-testid="apply-result" role="status">
                {applied.reverted ? (
                  <>Reverted: nav-site.json is back to what it was before the apply.</>
                ) : (
                  <>
                    {applied.same ? (
                      <><b>Nothing changed:</b> these are already the live values for the {applied.slot} tone.{' '}</>
                    ) : (
                      <><b>Applied.</b> The live bar on this server now uses them: <a href="/" target="_blank" rel="noopener" className="font-medium text-emerald-700 underline">open the home page</a> to see it (a light-tone page for light values).{' '}</>
                    )}
                    Set for the <b>{applied.slot}</b> tone, <b>{applied.dock === 'docked' ? 'docked' : 'floating'}</b>: fill {fmt(Number(applied.values.fill))}, rim {fmt(Number(applied.values.rim))}, highlight {fmt(Number(applied.values.highlight))}, blur {fmt(Number(applied.values.blur))}, shadow {fmt(Number(applied.values.shadow))}, glow {fmt(Number(applied.values.glow))}, hover {fmt(Number(applied.values.hover))}{applied.values.lineWidth !== undefined ? `, underline ${fmt(Number(applied.values.lineWidth))}% × ${fmt(Number(applied.values.lineThick))}px, gap ${fmt(Number(applied.values.lineGap))}px` : ''}{applied.values.menuRow !== undefined ? `, menu current row ${fmt(Number(applied.values.menuRow))}×` : ''}{applied.values.tint ? `, tint ${applied.values.tint}` : ''}.{' '}
                    <button type="button" data-testid="apply-revert" onClick={revertApply} disabled={applyBusy} className="font-medium text-emerald-700 underline">Revert</button> <span className="text-gray-400">(until you reload this page)</span>
                  </>
                )}
              </p>
            )}
            {applyMsg && <p className="mt-2 text-[11px] text-red-600" data-testid="apply-error" role="alert">{applyMsg}</p>}
            {locked && <p className="mt-2 text-[11px] text-gray-500" data-testid="apply-locked">Apply is off for archived styles: pick Live or a Rim/Opacity style to apply.</p>}
            <p className="mt-1.5 text-[11px] leading-snug text-gray-400">Dev only. Your builder must commit nav-site.json for it to reach the deployed site.</p>
          </aside>
        </div>
      </main>
      <style jsx>{`
        .stage {
          position: relative;
          overflow: hidden;
          isolation: isolate;
          container-type: size;
          border-radius: 12px;
          border: 1px solid rgba(0, 0, 0, 0.15);
          width: 100%;
          height: 170px;
        }
        .stage.phone {
          width: 390px;
          max-width: 100%;
        }
        @media (min-width: 1024px) {
          /* leaves the bottom-left corner (dev badge) clear and keeps the panel beside the bar */
          .stage {
            height: min(calc(100vh - 220px), 600px);
          }
        }
        .scroller {
          position: absolute;
          inset: 0;
          overflow-y: auto;
          overflow-x: hidden;
          overscroll-behavior: contain;
          z-index: 1;
          outline: none;
        }
        .stage-dark {
          background: #0a0a09;
        }
        .stage-white {
          background: #ffffff;
        }
        .stage-clipstream {
          background-color: #f0ebeb;
          background-image: radial-gradient(circle, rgba(0, 0, 0, 0.08) 1px, transparent 1px);
          background-size: 16px 16px;
        }
        .stage-orange {
          background: #965935;
        }
        .stage-ollama {
          background: #0a0a09;
        }
        .ollama-frame {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: 0;
          z-index: 1;
          background: #0a0a09;
        }
        .pink-img {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100cqh;
          height: 100cqw;
          max-width: none;
          max-height: none;
          object-fit: cover;
          transform: translate(-50%, -50%) rotate(-90deg);
          z-index: -1;
        }
      `}</style>
      {/* The tint picker opens just under its swatch (placement="below"), so it never covers the preview bar above
          the panel and stays next to the control that opened it. */}
      {/* the scroll-under content is its own component, so its rules are global (scoped under .sc) */}
      <style jsx global>{`
        .sc {
          max-width: 620px;
          margin: 0 auto;
          padding: 96px 24px 0;
        }
        .sc .eyebrow {
          font-size: 12px;
          opacity: 0.55;
          margin-bottom: 8px;
        }
        .sc .h {
          font-size: 30px;
          line-height: 1.12;
          font-weight: 600;
          margin: 0 0 14px;
        }
        .sc .h3 {
          font-size: 20px;
          font-weight: 600;
          margin: 28px 0 8px;
        }
        .sc .p {
          font-size: 15px;
          line-height: 1.6;
          margin: 0 0 18px;
          opacity: 0.85;
        }
        .sc .swatches {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 8px;
          margin: 4px 0 20px;
        }
        .sc .sw {
          height: 56px;
          border-radius: 10px;
        }
        .sc .shots {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin: 4px 0 20px;
        }
        .sc .shots img,
        .sc .wide img {
          width: 100%;
          display: block;
          border-radius: 12px;
          object-fit: cover;
        }
        .sc .wide {
          margin: 4px 0 20px;
        }
        .sc .card {
          border-radius: 12px;
          padding: 22px 20px;
          font-size: 17px;
          line-height: 1.4;
          margin: 4px 0 20px;
        }
        .sc .row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin: 4px 0 20px;
        }
        .sc .tile {
          border-radius: 12px;
          padding: 16px 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 13px;
          min-height: 110px;
        }
        .sc .tile b {
          font-size: 17px;
        }
        .sc .tail {
          height: 120px;
        }
      `}</style>
    </>
  );
}
