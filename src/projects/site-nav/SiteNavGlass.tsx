/**
 * Glass site navbar, round 2 — two directions, no outlines or borders.
 *
 *   variant="lens"  Floating glass pill. The selected page is a glass
 *                   "lens" that glides between items with a slight
 *                   spring; a fainter ghost lens follows the pointer.
 *   variant="quiet" No panel. Text-only items over a blurred, masked
 *                   scrim that fades out (the reference sites' restraint);
 *                   the selected page is a short bar that slides under it.
 *
 * Both: hover is a quick ease-out, press is a small scale, focus is a ring
 * drawn on the item (keyboard only), reduced-motion removes the slides.
 * 'clay' on phones (<= 520px, or a preview frame marked `forceMobile`) swaps
 * the link row for the portrait, the current page name and a Menu button
 * that opens a glass panel under the bar (Home / Projects / Demos, Contact
 * at the bottom). Contact opens the visitor's mail app (see openMail).
 *
 * Used on the preview page (/showcase/site-nav) with `embedded` (renders
 * inside a box, links inert, active item held in local state so clicking
 * switches it). Not mounted site-wide; when it is, active = current route.
 */
import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { openMail } from './openMail';
import { navInter } from './navFont';

/** clay  = the operator's Figma glass: transparent fill, light on the edges (default)
 *  lens  = frosted lens pill (kept as a variation)
 *  quiet = text over a masked scrim (kept as a variation) */
export type GlassVariant = 'clay' | 'lens' | 'quiet';
export type Dock = 'float' | 'docked';

type Item = { key: string; label: string; href: string };

/** Optional tuning of the 'clay' glass. Every field is a CSS custom property on the bar;
 *  omitted fields (or no `tuning` at all) leave the live look exactly as authored.
 *    fill      x the fill alphas of the glass gradient (1 = live; 0 = clear glass)
 *    rim       x the 1px edge-light alphas (border + masked rim)
 *    highlight x the inset top-highlight alpha
 *    blur      backdrop blur radius in px (live = 5)
 *    shadow    x the two soft drop-shadow alphas
 *    glow      x the two inset lower-edge glows (the upward fade inside the bar)
 *    hover     x the alpha of the hover underline on non-current items (0 = no line)
 *    tint      glass colour as '#rrggbb' ('' = live: smoked dark, or warm frost on the light tone).
 *              The second gradient stop is derived from it (a luminance-scaled darker shade).
 *  With all of the multipliers at 0 no container is drawn at all: only the contents remain.
 *  Contents (text, chips, portrait) are never touched: only these alphas move. */
export type NavTuning = {
  fill?: number; rim?: number; highlight?: number; blur?: number; shadow?: number; glow?: number; hover?: number; tint?: string;
  /** Hover underline (clay): width as % of the label, thickness in px, gap below the text in px. */
  lineWidth?: number; lineThick?: number; lineGap?: number;
  /** Current item on hover (clay): x the pill's lighten step (0 = no change). */
  chipHover?: number;
  /** Phone menu: the current page's row highlight, x the original strength (alpha 0.1). */
  menuRow?: number;
};
/** Multipliers of the authored recipe. The live bar's own values (the operator's tuning,
 *  set as CSS defaults on .lens.clay) are NAV_TUNING_LIVE_DARK / _LIGHT. */
export const NAV_TUNING_DEFAULT: Required<NavTuning> = { fill: 1, rim: 1, highlight: 1, blur: 5, shadow: 1, glow: 1, hover: 1, tint: '', lineWidth: 80, lineThick: 1.3, lineGap: 4, chipHover: 1, menuRow: 0.5 };
/* Underline: half the earlier opacity (hover 0.5) and 2px further below the text (operator). */
export const NAV_TUNING_LIVE_DARK: Required<NavTuning> = { ...NAV_TUNING_DEFAULT, rim: 0.37, glow: 0.99, hover: 0.5, lineGap: 6 };
export const NAV_TUNING_LIVE_LIGHT: Required<NavTuning> = { ...NAV_TUNING_LIVE_DARK, fill: 0.8 };
/** '#rrggbb' -> the two gradient-stop colours as "r, g, b" (null if not a hex colour). */
export const navTintVars = (hex: string): { rgb: string; rgb2: string; lum: number } | null => {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return null;
  const c = [m[1], m[2], m[3]].map((h) => parseInt(h, 16));
  const lum = (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
  const f = 0.72 + 0.24 * Math.min(1, lum * 2); // dark tints deepen toward the second stop, pale ones barely
  return { rgb: c.join(', '), rgb2: c.map((v) => Math.round(v * f)).join(', '), lum };
};
const tuningCss = (t?: NavTuning): string =>
  Object.entries((tuningStyle(t) ?? {}) as Record<string, string>)
    .map(([k, v]) => `${k}:${v}`)
    .join(';');
const tuningStyle = (t?: NavTuning): React.CSSProperties | undefined => {
  if (!t) return undefined;
  const o: Record<string, string> = {};
  if (t.fill !== undefined) o['--nav-fill-k'] = String(t.fill);
  if (t.rim !== undefined) o['--nav-rim-k'] = String(t.rim);
  if (t.highlight !== undefined) o['--nav-hl-k'] = String(t.highlight);
  if (t.blur !== undefined) {
    o['--nav-blur'] = `${t.blur}px`;
    if (t.blur <= 0) o['--nav-bdf'] = 'none'; // blur(0px) still rounds edge pixels by 1 level; no filter at all = no layer
  }
  if (t.shadow !== undefined) o['--nav-shadow-k'] = String(t.shadow);
  if (t.glow !== undefined) o['--nav-glow-k'] = String(t.glow);
  if (t.hover !== undefined) o['--nav-hover-k'] = String(t.hover);
  if (t.lineWidth !== undefined) o['--nav-line-w'] = `${t.lineWidth}%`;
  if (t.lineThick !== undefined) o['--nav-line-h'] = `${t.lineThick}px`;
  if (t.lineGap !== undefined) o['--nav-line-gap'] = `${t.lineGap}px`;
  if (t.chipHover !== undefined) o['--nav-chip-hover-k'] = String(t.chipHover);
  if (t.menuRow !== undefined) o['--nav-menu-row-k'] = String(t.menuRow);
  const tv = t.tint ? navTintVars(t.tint) : null;
  if (tv) {
    o['--nav-tint-rgb'] = tv.rgb;
    o['--nav-tint-rgb2'] = tv.rgb2;
  }
  return o as React.CSSProperties;
};

export const GLASS_NAV_ITEMS: Item[] = [
  { key: 'home', label: 'Home', href: '/' },
  { key: 'projects', label: 'Projects', href: '/projects' },
  { key: 'demos', label: 'Demos', href: '/demo-showcase' },
];


/** Links to "/" are plain anchors (a full document load). On a client-side
 *  transition to "/" Next does not apply the home page's next/font CSS, so the
 *  hero headline fell back to sans; a full load is the path that has always
 *  rendered correctly, and it changes no fonts anywhere. Other routes use Link. */
/** Left-hand mark in the bar. To switch back to the portrait photo, set NAV_MARK to 'portrait'
 *  (public/images/portrait.png is kept for this). The M is the logo's own path, unaltered. */
const NAV_MARK: 'm' | 'portrait' = 'm';
const M_PATH =
  'M35.9628 13.4115C34.9915 13.4659 34.0535 13.7849 33.2505 14.3341C32.4475 14.8833 31.81 15.6416 31.407 16.5271L31.2929 16.7767L21.0549 39.2276L12.1501 19.9778L10.2394 15.8498C9.93308 15.1845 9.44263 14.6208 8.82608 14.2253C8.20953 13.8299 7.49266 13.6192 6.76019 13.6183H1.44153C1.06336 13.6183 0.700695 13.7685 0.433285 14.0359C0.165875 14.3033 0.015625 14.666 0.015625 15.0442V55.4188C0.015625 55.797 0.165875 56.1596 0.433285 56.427C0.700695 56.6945 1.06336 56.8447 1.44153 56.8447H3.20965C3.58782 56.8447 3.95053 56.6945 4.21794 56.427C4.48535 56.1596 4.63556 55.797 4.63556 55.4188V23.6424L14.4957 44.9455C15.3798 46.9204 16.0001 47.9542 16.8342 48.4675C17.5178 48.8493 18.2998 49.0181 19.08 48.9523C21.2617 48.9523 22.0673 48.1966 23.6358 44.8385C23.7 44.6817 23.7641 44.5319 23.8426 44.3751L33.8952 22.1737V55.1978C33.8971 55.634 34.0712 56.0518 34.3797 56.3603C34.6881 56.6687 35.1059 56.8428 35.5422 56.8447H41.6522C42.089 56.8447 42.5079 56.6712 42.8167 56.3623C43.1256 56.0534 43.2991 55.6346 43.2991 55.1978V18.4806H53.0523C53.5061 18.4806 53.9413 18.3004 54.2622 17.9795C54.5831 17.6586 54.7634 17.2233 54.7634 16.7695V14.1815C54.7628 13.9487 54.7148 13.7185 54.6222 13.505C54.5296 13.2915 54.3944 13.0991 54.2249 12.9396C54.0554 12.7801 53.8551 12.6568 53.6363 12.5774C53.4176 12.4979 53.1849 12.4639 52.9525 12.4775L35.9628 13.4115Z';

/** Already on the home page, Home (and the portrait) scroll back to the top instead of reloading it. */
const toTopIfHome = (e: React.MouseEvent<HTMLAnchorElement>) => {
  if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
  if (window.location.pathname !== '/') return;
  e.preventDefault();
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
};
const NavAnchor = React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }>(
  ({ href, onClick, ...rest }, ref) =>
    href === '/' ? (
      <a
        ref={ref}
        href={href}
        {...rest}
        onClick={(e) => {
          onClick?.(e);
          toTopIfHome(e);
        }}
      />
    ) : (
      <Link ref={ref} href={href} onClick={onClick} {...rest} />
    )
);
NavAnchor.displayName = 'NavAnchor';

/** Standalone project pages count as "Projects" for the current-page state. */
/** Only /projects marks Projects. On a standalone project page (/trace,
 *  /clipperstream, /ai-confidence-tracker) no item is current (operator). */
const PROJECT_ROUTES = ['/projects'];
const underRoute = (pathname: string, route: string) => pathname === route || pathname.startsWith(route + '/');

const keyForPath = (pathname: string) => {
  if (pathname === '/') return 'home';
  if (PROJECT_ROUTES.some((r) => underRoute(pathname, r))) return 'projects';
  return GLASS_NAV_ITEMS.find((i) => i.href !== '/' && underRoute(pathname, i.href))?.key ?? '';
};

/** Phone bar label when no nav item is current: the page's own name, so it
 *  never repeats "Menu" next to the menu button. Names match the project cards. */
const PAGE_NAMES: [string, string][] = [
  ['/trace', 'Trace'],
  ['/clipperstream', 'ClipStream'],
  ['/ai-confidence-tracker', 'AI Confidence Tracker'],
  ['/ollama', 'Ollama'],
  ['/voiceinterface/realtime', 'Voice UI Library'],
  ['/portfolio2025/eldugo', 'Eldugo'],
  ['/portfolio2025/logo', 'Logofolio'],
  ['/portfolio2025/activeledger', 'ActiveLedger'],
  ['/portfolio2025/magmadeck', 'Magma'],
  ['/portfolio2025/actdeck', 'ACT'],
  ['/madeforhumans', 'Made for Humans'],
];
const pageNameFor = (pathname: string) => PAGE_NAMES.find(([r]) => underRoute(pathname, r))?.[1] ?? 'Menu';

/** Browser tab title for a public page: the same plain names as the phone bar,
 *  plus Home and Projects. Exact routes only; other pages keep their own title. */
export const pageTitleFor = (pathname: string): string | undefined =>
  pathname === '/' ? 'Home' : pathname === '/projects' ? 'Projects' : PAGE_NAMES.find(([r]) => r === pathname)?.[1];

type Rect = { x: number; w: number };
type Tone = 'dark' | 'light' | 'mid';

/* ---- Section-aware tone: what is behind the bar right now? ----
   Samples the elements under the bar. Priority per element: an explicit
   [data-nav-tone] ancestor, then an <img>'s average luminance (same-origin,
   cached), then an opaque-enough background colour. Gradients and
   background-image-only surfaces are skipped (the next element down decides).
   Nine samples across the bar feed toneScore(), which predicts text contrast
   per tone; the tone with the best worst-case wins. */
const channel = (c: number) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};
const lumaRgb = (r: number, g: number, b: number) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

const imgLumaCache = new WeakMap<HTMLImageElement, number | null>();
const imgLuma = (img: HTMLImageElement): number | null => {
  if (imgLumaCache.has(img)) return imgLumaCache.get(img) ?? null;
  let out: number | null = null;
  try {
    const c = document.createElement('canvas');
    c.width = 16;
    c.height = 16;
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0, 16, 16);
      const d = ctx.getImageData(0, 0, 16, 16).data;
      let sum = 0;
      for (let i = 0; i < d.length; i += 4) sum += lumaRgb(d[i], d[i + 1], d[i + 2]);
      out = sum / (d.length / 4);
    }
  } catch {
    out = null; // cross-origin image: cannot read, let the next element decide
  }
  imgLumaCache.set(img, out);
  return out;
};

const MARKED_LUMA: Record<Tone, number> = { dark: 0.03, mid: 0.15, light: 0.7 };

/** Luminance of whatever is painted behind (x, y), or null if it cannot be read. */
const lumaAt = (x: number, y: number): number | null => {
  // 1. explicit markers matched by GEOMETRY (previews are often not hit-testable);
  //    the smallest marked box containing the point is the innermost surface
  let best: { area: number; tone: Tone } | null = null;
  document.querySelectorAll<HTMLElement>('[data-nav-tone]').forEach((m) => {
    const t = m.dataset.navTone;
    if (t !== 'dark' && t !== 'light' && t !== 'mid') return;
    const r = m.getBoundingClientRect();
    if (x < r.left || x > r.right || y < r.top || y > r.bottom) return;
    const area = r.width * r.height;
    if (!best || area < best.area) best = { area, tone: t };
  });
  if (best) return MARKED_LUMA[(best as { area: number; tone: Tone }).tone];
  // 2. hit-test fallback: what is painted and reachable at the point
  for (const e of document.elementsFromPoint(x, y)) {
    if (e.closest('.gnav')) continue;
    const marked = e.closest<HTMLElement>('[data-nav-tone]')?.dataset.navTone;
    if (marked === 'dark' || marked === 'light' || marked === 'mid') return MARKED_LUMA[marked];
    if (e instanceof HTMLImageElement && e.complete && e.naturalWidth) {
      const l = imgLuma(e);
      if (l !== null) return l;
      continue;
    }
    const m = getComputedStyle(e).backgroundColor.match(/[\d.]+/g);
    if (m && m.length >= 3 && (m.length > 3 ? Number(m[3]) : 1) >= 0.85) {
      return lumaRgb(Number(m[0]), Number(m[1]), Number(m[2]));
    }
  }
  return null;
};

/** Predicted text contrast for each tone over a backdrop of luminance l
 *  (frost fills and text colours as defined in the style block). */
const toneScore = (tone: Tone, l: number, clay: boolean): number => {
  if (clay) {
    // transparent fill: the text sits on the page itself
    return tone === 'light' ? (l + 0.05) / 0.09 : 1.05 / (l + 0.05);
  }
  if (tone === 'light') return (0.9 * l + 0.01 + 0.05) / (0.04 + 0.05); // dark text, toned frost
  const bg = tone === 'mid' ? 0.76 * l : 0.93 * l + 0.07; // white text; mid frost darkens, dark frost lightens
  return 1.05 / (bg + 0.05);
};

type Props = {
  variant: GlassVariant;
  /** Preview mode: positioned inside a box, inert links, local active state. */
  embedded?: boolean;
  /** Force the narrow-phone sizing regardless of viewport (preview frames). */
  forceMobile?: boolean;
  /** Initial active item in embedded mode. */
  initialActive?: string;
  /** 'dark' = smoked glass, white text (dark/saturated pages);
   *  'light' = lightly toned frost, dark text (pale pages).
   *  'mid'   = darker frost, white text (mid-tone backdrops such as orange,
   *            where a light frost would drop white text below 4.5:1).
   *  Omitted: chosen from the route (LIGHT_ROUTES). */
  tone?: Tone;
  /** Follow the section under the bar. Default: on when mounted site-wide, off in
   *  embedded previews (which pass an explicit tone) unless set. */
  autoTone?: boolean;
  /** Preview only: render the phone menu already open. */
  initialMenuOpen?: boolean;
  /** Dark-tone rim variation for the operator to pick from (preview); omitted = live rim. */
  rim?: 'a' | 'b' | 'c';
  /** Glass tuning (clay only); omitted = live look. See NavTuning. */
  tuning?: NavTuning;
  /** 'float' (default) = the rounded bar with a gap around it; 'docked' = flush to the top,
   *  full width, no radius (clay only). Contents keep the floating bar's content width. */
  dock?: Dock;
  /** The site's settings (nav-site.json): per-tone tuning, applied as `tuning` for the resolved
   *  tone (light -> light, dark/mid -> dark) when no explicit `tuning` prop is given. */
  site?: { dark: NavTuning; light: NavTuning };
};

/** Routes whose backdrop BEHIND THE BAR is pale, so the bar uses the light tone.
 *  The three framed project pages sit their frame below the bar, so the bar
 *  is over the white page margin there, whatever colour the card is. The rest
 *  were measured with the bar hidden: pale behind the bar at the top of the page.
 *  /portfolio2025/activeledger and /logo open on a dark hero, so they stay dark. */
const LIGHT_ROUTES = [
  '/clipperstream',
  '/ai-confidence-tracker',
  '/trace',
  '/ollama',
  '/madeforhumans',
  '/voiceinterface/realtime',
  '/portfolio2025/eldugo',
  '/portfolio2025/actdeck',
  '/portfolio2025/magmadeck',
];

/** Docked bar: 53px of bar (desktop and phone alike, see the .dk rules) + 8px of air, plus the
 *  top safe-area inset (added in the :root rule). */
const DOCKED_NAV_H = 61;

/** Routes whose LIGHT tone is for the desktop white margin, but whose page is edge to edge
 *  (a coloured backdrop right behind the bar) at <= PHONE_MQ: there the bar uses 'mid'.
 *  /trace: ProjectPageBackground drops its white margin at max-width 768px, leaving #965935
 *  behind the bar. */
const PHONE_MID_ROUTES = ['/trace', '/ollama'];
const PHONE_MQ = '(max-width: 768px)';

const SiteNavGlass: React.FC<Props> = ({ variant, embedded = false, forceMobile = false, initialActive = 'projects', tone, autoTone: autoToneProp, initialMenuOpen = false, rim, tuning, dock = 'float', site }) => {
  const router = useRouter();
  const [localActive, setLocalActive] = useState(initialActive);
  const active = embedded ? localActive : keyForPath(router.pathname);
  const routeTone: Tone = LIGHT_ROUTES.some((r) => underRoute(router.pathname, r)) ? 'light' : 'dark';
  // Mounted site-wide (no explicit tone): follow what is behind the bar as the page
  // scrolls; the route tone is the first-paint / fallback value.
  const [autoTone, setAutoTone] = useState<Tone | null>(null);
  // Phone + an edge-to-edge coloured page: 'mid' instead of 'light' (see PHONE_MID_ROUTES).
  // `phone` is false on the server and the first client render (so hydration matches); the
  // inline script rendered below flips the server HTML before first paint, this state then
  // agrees with it right after hydration. After mount it is always current (no flash on
  // client-side route changes either: it is set before the first paint of the new route).
  const [phone, setPhone] = useState(false);
  useLayoutEffect(() => {
    const mq = window.matchMedia(PHONE_MQ);
    const on = () => setPhone(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const phoneMid = !embedded && PHONE_MID_ROUTES.some((r) => underRoute(router.pathname, r));
  const resolvedTone: Tone = tone ?? autoTone ?? (phoneMid && phone ? 'mid' : routeTone);
  const siteTuning = site ? (resolvedTone === 'light' ? site.light : site.dark) : undefined;
  const barRef = useRef<HTMLDivElement>(null);
  const docked = dock === 'docked' && variant === 'clay';


  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [lens, setLens] = useState<Rect | null>(null);
  const [ghost, setGhost] = useState<Rect | null>(null);
  const lastGhost = useRef<Rect | null>(null); // where the hover line last was, so it fades out in place and slides in from there
  if (ghost) lastGhost.current = ghost;
  const [ready, setReady] = useState(false); // first measurement done → enable slide transitions

  const measure = useCallback((key: string): Rect | null => {
    const el = itemRefs.current[key];
    if (!el) return null;
    // quiet: the bar sits under the text only; lens: under the whole item
    if (variant === 'quiet') {
      const label = el.querySelector<HTMLElement>('.label');
      if (label) return { x: el.offsetLeft + label.offsetLeft, w: label.offsetWidth };
    }
    return { x: el.offsetLeft, w: el.offsetWidth };
  }, [variant]);

  useEffect(() => {
    // Tone is fixed per page (operator: one colour on the page, black on home);
    // following the section under the bar is opt-in (preview scroll demo only).
    const follow = autoToneProp ?? false;
    if (tone || !follow) return;
    let raf = 0;
    const run = () => {
      raf = 0;
      const bar = barRef.current;
      if (!bar) return;
      const r = bar.getBoundingClientRect();
      const y = r.top + r.height / 2;
      // nine samples across the bar (labels sit at different x than the centre)
      const lumas = [0.08, 0.18, 0.28, 0.38, 0.5, 0.62, 0.72, 0.82, 0.92]
        .map((f) => lumaAt(r.left + r.width * f, y))
        .filter((l): l is number => l !== null);
      if (!lumas.length) return;
      // pick the tone whose WORST sample is best (a boundary may suit neither tone fully)
      const clay = variant === 'clay';
      if (clay) {
        // dense glass: text is readable on either tone, so the tone follows the look
        // of the section (light glass over light sections), with a dead band
        const avg = lumas.reduce((a, l) => a + l, 0) / lumas.length;
        setAutoTone((prev) => (prev && Math.abs(avg - 0.35) < 0.07 ? prev : avg > 0.35 ? 'light' : 'dark'));
        return;
      }
      const tones: Tone[] = ['dark', 'mid', 'light'];
      const worst = (t: Tone) => Math.min(...lumas.map((l) => toneScore(t, l, clay)));
      const scored = tones.map((t) => ({ t, s: worst(t) })).sort((a, b) => b.s - a.s);
      // within 5% keeps the current tone (no flicker at a boundary)
      setAutoTone((prev) => (prev && worst(prev) >= scored[0].s * 0.95 ? prev : scored[0].t));

    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(run);
    };
    schedule();
    const t1 = setTimeout(schedule, 300);
    const t2 = setTimeout(schedule, 1200);
    window.addEventListener('scroll', schedule, { passive: true, capture: true }); // capture: also scrolling containers
    window.addEventListener('resize', schedule);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
    };
  }, [tone, embedded, autoToneProp, variant, router.pathname]);

  useLayoutEffect(() => {
    const update = () => setLens(measure(active));
    update();
    const ro = new ResizeObserver(update);
    if (listRef.current) ro.observe(listRef.current);
    document.fonts?.ready.then(update).catch(() => {});
    return () => ro.disconnect();
  }, [active, measure, forceMobile]);

  useEffect(() => {
    if (lens && !ready) {
      // let the first position paint without animating from 0
      const id = requestAnimationFrame(() => setReady(true));
      return () => cancelAnimationFrame(id);
    }
  }, [lens, ready]);

  /* ---- Phone menu + Contact popover ----
     Both are disclosure widgets: a button with aria-expanded/aria-controls opens a
     panel. They close on outside press, Escape (focus returns to the button),
     focus leaving the bar, selecting an item and route change. */
  const uid = useId();
  const panelId = `${uid}-menu`;
  const [menuOpen, setMenuOpen] = useState(initialMenuOpen);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const wantFocus = useRef(false); // set by the opening click, so focus only moves for user-initiated opens
  // preview frames rendered open stay open until their own button/Escape closes them
  const [touched, setTouched] = useState(false);
  const sticky = embedded && initialMenuOpen && !touched;

  /* Phone panel motion: the panel stays mounted (visible) while its close animation
     plays. `closing` is set in a layout effect so there is no unanimated frame. It
     ends on animationend, with a timer as the fallback (reduced motion, or the panel
     not rendered at this width, never fires animationend). */
  const [closing, setClosing] = useState(false);
  const prevMenuOpen = useRef(menuOpen);
  useLayoutEffect(() => {
    if (menuOpen) {
      setClosing(false);
    } else if (prevMenuOpen.current) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reduce) setClosing(true);
    }
    prevMenuOpen.current = menuOpen;
  }, [menuOpen]);
  useEffect(() => {
    if (!closing) return;
    const id = setTimeout(() => setClosing(false), 700);
    return () => clearTimeout(id);
  }, [closing]);
  const panelHidden = !menuOpen && !closing;

  const closeAll = useCallback((returnFocus: boolean) => {
    const wasMenu = menuOpen;
    setMenuOpen(false);
    if (returnFocus && wasMenu) menuBtnRef.current?.focus();
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: Event) => {
      if (sticky) return;
      if (barRef.current && !barRef.current.contains(e.target as Node)) closeAll(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (sticky) return;
        e.preventDefault();
        closeAll(true);
      }
    };
    const onFocusIn = (e: FocusEvent) => {
      if (sticky) return;
      if (barRef.current && !barRef.current.contains(e.target as Node)) closeAll(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('focusin', onFocusIn);
    };
  }, [menuOpen, closeAll, sticky]);

  // The open phone menu holds the page still; scrolling resumes where it was on close.
  // The lock blocks the scroll inputs rather than setting overflow: hidden on html and
  // body, because releasing that overflow made the browser lay the whole page out
  // again (a 100 to 700ms freeze on close on the long pages, / and /projects). Nothing
  // in the bar scrolls, so every wheel and touch drag is blocked while the menu is open;
  // the scroll listener puts the page back for anything else (a scrollbar drag, say).
  useEffect(() => {
    if (!menuOpen || embedded) return;
    const x = window.scrollX;
    const y = window.scrollY;
    const block = (e: Event) => e.preventDefault();
    const SCROLL_KEYS = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      // Space on a button or link presses it; only block it where it would scroll.
      if (e.key === ' ' && t?.closest('button, a, input, textarea, select, [contenteditable]')) return;
      if (SCROLL_KEYS.includes(e.key)) e.preventDefault();
    };
    const hold = () => {
      if (window.scrollX !== x || window.scrollY !== y) window.scrollTo(x, y);
    };
    const opts = { passive: false } as const;
    window.addEventListener('wheel', block, opts);
    window.addEventListener('touchmove', block, opts);
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', hold);
    return () => {
      window.removeEventListener('wheel', block);
      window.removeEventListener('touchmove', block);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', hold);
    };
  }, [menuOpen, embedded]);

  // focus moves into the panel when the user opens it
  useEffect(() => {
    if (!wantFocus.current || !menuOpen) return;
    wantFocus.current = false;
    const target = panelRef.current?.querySelector<HTMLElement>('[aria-current="page"]') ?? panelRef.current?.querySelector<HTMLElement>('a, button');
    target?.focus();
  }, [menuOpen]);

  // route change closes everything (the site-wide bar persists across pages)
  useEffect(() => {
    const close = () => setMenuOpen(false);
    router.events.on('routeChangeStart', close);
    return () => router.events.off('routeChangeStart', close);
  }, [router.events]);

  const onItemClick = (e: React.MouseEvent, key: string) => {
    if (embedded) {
      e.preventDefault();
      setLocalActive(key);
    }
    setMenuOpen(false);
  };

  const activeLabel = GLASS_NAV_ITEMS.find((i) => i.key === active)?.label ?? (embedded ? 'Menu' : pageNameFor(router.pathname));

  const flip = phoneMid && !tone && routeTone === 'light';
  return (
    <>
    <div
      style={tuningStyle(tuning ?? siteTuning)}
      suppressHydrationWarning
      className={`gnav ${navInter.variable} ${variant === 'clay' ? 'lens clay' : variant} ${resolvedTone === 'light' ? 'tl' : resolvedTone === 'mid' ? 'tm' : 'td'}${docked ? ' dk' : ''}${embedded ? ' embedded' : ''}${forceMobile ? ' narrow' : ''}${ready ? ' ready' : ''}${rim ? ' rim-' + rim : ''}`}
    >
      <div className="bar" ref={barRef}>
        <NavAnchor
          href="/"
          className="portrait"
          aria-label="Home"
          onClick={(e) => embedded && e.preventDefault()}
        >
          {NAV_MARK === 'm' ? (
            <svg className="mark" viewBox="0 12.4 54.8 44.5" aria-hidden="true" focusable="false">
              <path d={M_PATH} fill="currentColor" />
            </svg>
          ) : (
            <Image src="/images/portrait.png" alt="" width={32} height={32} />
          )}
        </NavAnchor>

        <nav className="list" aria-label="Main" ref={listRef} onMouseLeave={() => setGhost(null)}>
          {variant !== 'quiet' && (
            <>
              <span
                className="ghost"
                aria-hidden="true"
                style={ghost ? { transform: `translateX(${ghost.x}px)`, width: ghost.w, opacity: 1 } : lastGhost.current ? { transform: `translateX(${lastGhost.current.x}px)`, width: lastGhost.current.w, opacity: 0 } : { opacity: 0 }}
              />
              <span
                className="lens"
                aria-hidden="true"
                style={lens ? { transform: `translateX(${lens.x}px)`, width: lens.w, opacity: 1 } : { opacity: 0 }}
              />
            </>
          )}
          {variant === 'quiet' && (
            <span
              className="bar-ind"
              aria-hidden="true"
              style={lens ? { transform: `translateX(${lens.x}px)`, width: lens.w, opacity: 1 } : { opacity: 0 }}
            />
          )}
          {GLASS_NAV_ITEMS.map((item) => (
            <NavAnchor
              key={item.key}
              href={item.href}
              ref={(el) => {
                itemRefs.current[item.key] = el;
              }}
              className={`item${active === item.key ? ' active' : ''}`}
              aria-current={active === item.key ? 'page' : undefined}
              onClick={(e) => onItemClick(e, item.key)}
              onMouseEnter={() => {
                // hover ghost only for real pointers (touch browsers fire synthetic mouseenter)
                // (clay draws its hover line per label in CSS, so it needs no ghost)
                if (variant !== 'quiet' && variant !== 'clay' && window.matchMedia('(hover: hover) and (pointer: fine)').matches) setGhost(measure(item.key));
              }}
            >
              <span className="label">{item.label}</span>
            </NavAnchor>
          ))}
        </nav>

        {/* ---- Phone pattern (<= 520px / 'narrow' frames): page name + menu button ---- */}
        <span className="pagename">{activeLabel}</span>
        <button
          ref={menuBtnRef}
          type="button"
          className="menubtn"
          aria-expanded={menuOpen}
          aria-controls={panelId}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => {
            wantFocus.current = !menuOpen;
            setTouched(true);
            setMenuOpen((o) => !o);
          }}
        >
          <span className="hb-line" aria-hidden="true" />
          <span className="hb-line" aria-hidden="true" />
        </button>

        <div className="contactwrap">
          <button type="button" className="contact" aria-label="Contact: email Ethan" onClick={() => !embedded && openMail()}>
            Contact
          </button>
        </div>

        <div
          className={`panel${menuOpen ? '' : ' closing'}`}
          id={panelId}
          ref={panelRef}
          hidden={panelHidden}
          onAnimationEnd={(e) => {
            if (e.target === e.currentTarget && /gnav-panel-(dk-)?out/.test(e.animationName)) setClosing(false);
          }}
        >
          <nav className="pnav" aria-label="Main menu">
            {GLASS_NAV_ITEMS.map((item) => (
              <NavAnchor
                key={item.key}
                href={item.href}
                className={`pitem${active === item.key ? ' active' : ''}`}
                aria-current={active === item.key ? 'page' : undefined}
                onClick={(e) => onItemClick(e, item.key)}
              >
                {item.label}
              </NavAnchor>
            ))}
          </nav>
          <div className="psep" />
          <button
            type="button"
            className="pchip"
            aria-label="Contact: email Ethan"
            onClick={() => {
              setMenuOpen(false);
              if (!embedded) openMail();
            }}
          >
            Contact
          </button>
        </div>
      </div>

      {/* Height pages must clear (bar + ~8px of air), published only when mounted
          site-wide, never by the preview tiles. Pages read it as
          var(--site-nav-h, 0px). Values checked against the rendered bar. */}
      <style jsx global>{`
        ${embedded ? '' : docked ? `:root { --site-nav-h: calc(${DOCKED_NAV_H}px + env(safe-area-inset-top, 0px)); }` : `:root { --site-nav-h: calc(${variant === 'clay' ? 78 : 68}px + env(safe-area-inset-top, 0px)); } @media (max-width: 520px) { :root { --site-nav-h: calc(${variant === 'quiet' ? 64 : variant === 'clay' ? 70 : 62}px + env(safe-area-inset-top, 0px)); } }`}
      `}</style>

      <style jsx>{`
        .gnav {
          position: ${embedded ? 'absolute' : 'fixed'};
          top: 0;
          left: 0;
          right: 0;
          /* Above everything in page content (operator rule: nothing in a page may
             draw over the bar). Highest page layer found: ClipStream portal 9999.
             Consequence: page modals sit under the bar. */
          z-index: 10000;
          display: flex;
          justify-content: center;
          padding-left: env(safe-area-inset-left, 0px);
          padding-right: env(safe-area-inset-right, 0px);
          pointer-events: none; /* only the bar itself takes clicks */
          font-family: var(--gnav-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          font-weight: 400; /* labels regular; only the current page is heavier */
          line-height: 1;
          -webkit-tap-highlight-color: transparent;
        }
        /* Glass is TRANSPARENT: the page shows through, blurred. Fills are
           only as strong as the text needs; legibility comes mainly from
           the text colour switching with the tone. Alphas live here only. */
        .td {
          --fill: rgba(255, 255, 255, 0.07);
          --scrim-top: rgba(255, 255, 255, 0.08);
          --scrim-mid: rgba(255, 255, 255, 0.05);
          --blur: 12px;
          --blur-q: 10px;
        }
        .tm {
          --fill: rgba(12, 12, 14, 0.24);
          --scrim-top: rgba(10, 10, 12, 0.26);
          --scrim-mid: rgba(10, 10, 12, 0.18);
          --blur: 12px;
          --blur-q: 10px;
        }
        .tl {
          --fill: rgba(96, 86, 86, 0.1);
          --scrim-top: rgba(96, 86, 86, 0.12);
          --scrim-mid: rgba(96, 86, 86, 0.07);
          /* lighter blur on pale pages so fine texture (the dotted grid) survives */
          --blur: 6px;
          --blur-q: 6px;
        }
        .bar {
          pointer-events: auto;
          position: relative;
          display: flex;
          align-items: center;
        }
        .list {
          position: relative;
          display: flex;
          align-items: center;
        }
        .gnav :global(.portrait) {
          display: block;
          width: 28.8px; /* 90% of the former 32px */
          height: 28.8px;
          border-radius: 6px; /* the M is wider than a circle; a rounded rect keeps the focus ring clear of it */
          flex: none;
          transition: transform 0.18s ease-out;
        }
        .gnav :global(.portrait) :global(img) {
          border-radius: 50%;
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .gnav :global(.portrait) {
          color: #fff;
        }
        .gnav.tl :global(.portrait) {
          color: #1b1b1d;
        }
        .gnav :global(.portrait) :global(.mark) {
          width: 100%;
          height: 100%;
          display: block;
        }
        .gnav :global(.portrait):active {
          transform: scale(0.94);
        }
        .gnav :global(.portrait) {
          outline: none;
        }
        .gnav :global(.portrait):focus-visible {
          outline: 2px solid rgba(255, 255, 255, 0.85);
          outline-offset: 3px;
        }
        .gnav.tl :global(.portrait):focus-visible {
          outline-color: rgba(27, 27, 29, 0.7);
        }
        .gnav :global(.item) {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          text-decoration: none;
          outline: none;
          border-radius: 999px;
        }
        .label {
          display: block;
          opacity: 0.9; /* rest: high enough that mid-luminance backdrops still clear 4.5:1 */
          transition: opacity 0.16s ease-out, transform 0.12s ease-out;
        }
        .gnav :global(.item):hover .label {
          opacity: 1; /* rest + 0.10 (draft was 0.68 -> 0.95 = +0.27; operator asked for half) */
        }
        .gnav :global(.item.active) .label {
          font-weight: 500;
          opacity: 1;
        }
        .gnav :global(.item)::after,
        .contact::after,
        .gnav :global(.portrait)::after {
          /* touch target >= 44px tall without enlarging the visual item */
          content: '';
          position: absolute;
          inset: -6px 0;
        }
        .gnav :global(.portrait)::after {
          inset: -8px; /* 28.8px mark -> 44.8px square */
        }
        .contact,
        .gnav :global(.portrait) {
          position: relative;
        }
        .gnav :global(.item):active .label {
          transform: scale(0.95);
        }
        .gnav :global(.item):focus-visible {
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.85);
        }
        .contact {
          flex: none;
          text-decoration: none;
          outline: none;
          transition: transform 0.12s ease-out, background-color 0.22s ease, opacity 0.16s ease-out, color 0.22s ease;
        }
        .contact:active {
          transform: scale(0.96);
        }
        .contact:focus-visible {
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.85);
        }

        /* ===================== LENS ===================== */
        .lens .bar,
        .quiet .bar::before {
          transition: background-color 0.22s ease;
        }
        .gnav :global(.item) {
          transition: color 0.22s ease;
        }
        .lens .bar {
          margin-top: calc(12px + env(safe-area-inset-top, 0px));
          gap: 6px;
          padding: 6px 6px 6px 7px;
          border-radius: 999px;
          /* Glass without an outline: tint + blur + saturation, edge
             defined only by a soft drop shadow and a faint inner glow. */
          background: var(--fill);
          backdrop-filter: blur(var(--blur)) saturate(170%);
          -webkit-backdrop-filter: blur(var(--blur)) saturate(170%);
          /* one wide, soft shadow only: a tight one reads as an outline on light pages */
          box-shadow: 0 16px 36px -14px rgba(0, 0, 0, 0.4);
        }
        .lens .list {
          gap: 2px;
          margin: 0 4px 0 6px;
        }
        .lens :global(.item) {
          height: 36px;
          padding: 0 15px;
        }
        .lens .list :global(.lens),
        .lens .list :global(.ghost) {
          position: absolute;
        }
        .lens .list :global(.lens),
        .lens .list :global(.ghost) {
          top: 0;
          left: 0;
          height: 36px;
          border-radius: 999px;
          pointer-events: none;
          z-index: 1;
        }
        .lens .list :global(.lens) {
          /* same flat, soft chip as the light tone's rgba(27,27,29,.1): one visual language */
          background: rgba(255, 255, 255, 0.1);
          box-shadow: none;
        }
        .lens .list :global(.ghost) {
          background: rgba(255, 255, 255, 0.04); /* was 0.08 */
          transition: transform 0.2s cubic-bezier(0.2, 0.7, 0.2, 1), width 0.2s cubic-bezier(0.2, 0.7, 0.2, 1),
            opacity 0.16s ease-out;
        }
        .lens.ready .list :global(.lens) {
          transition: transform 0.46s cubic-bezier(0.34, 1.32, 0.5, 1), width 0.46s cubic-bezier(0.34, 1.32, 0.5, 1),
            opacity 0.2s ease-out;
        }
        .lens .contact {
          height: 36px;
          display: flex;
          align-items: center;
          padding: 0 16px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.11);
          color: #fff;
        }
        .lens .contact:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        /* ===================== CLAY (default) =====================
           The operator's chosen feel: Raycast's floating glass bar (board, computed
           style: 137deg gradient rgba(17,18,20,.75) -> rgba(12,13,15,.9), blur 5px; our tint
           is the neutral grey 18,18,18 -> 14,14,14 instead, so it carries no blue cast,
           1px rgba(255,255,255,.06) rim, inset top highlight, radius 16) combined
           with the edge light of the operator's Figma card (node 54:235: soft drop
           shadows, inner glow along the lower edge, a 1px rim masked by a 123deg
           gradient: strong top-left, gone mid, half bottom-right). The fill is dense
           enough that the text sits on the glass, so it is readable over anything;
           the 5px blur still lets shapes and colour show through. Light tone = the
           same glass as a toned warm frost with dark text. */
        /* The operator's tuned live values (picked in /showcase/site-nav): rim 0.37x
           and bottom glow 0.99x on every tone; the light tone's tint at 0.80x.
           A tuning prop (inline on this element) still overrides them. */
        .lens.clay {
          --nav-rim-k: 0.37;
          --nav-glow-k: 0.99;
          --nav-hover-k: 0.5;
        }
        .tl.lens.clay {
          --nav-fill-k: 0.8;
        }
        .lens.clay .bar {
          box-sizing: border-box;
          width: calc(100% - 32px);
          max-width: 1160px;
          margin-top: calc(16px + env(safe-area-inset-top, 0px));
          padding: 7px 8px 7px 9px;
          border-radius: 16px;
          /* Tuning hooks (--nav-*): every fallback is the authored value, so the live look
             is unchanged unless a tuning prop / custom property is set. Only alphas and the
             blur radius move; the contents are never faded. */
          border: 1px solid rgba(255, 255, 255, calc(0.06 * var(--nav-rim-k, 1)));
          background: linear-gradient(137deg, rgba(var(--nav-tint-rgb, 18, 18, 18), calc(0.75 * var(--nav-fill-k, 1))) 4.87%, rgba(var(--nav-tint-rgb2, 14, 14, 14), calc(0.9 * var(--nav-fill-k, 1))) 75.88%);
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, calc(0.15 * var(--nav-hl-k, 1))), inset 0 -5px 6px rgba(255, 255, 255, calc(0.04 * var(--nav-glow-k, 1))),
            inset 0 -8px 24px rgba(255, 255, 255, calc(0.03 * var(--nav-glow-k, 1))), 0 7px 10px rgba(0, 0, 0, calc(0.06 * var(--nav-shadow-k, 1))), 0 39px 79px rgba(0, 0, 0, calc(0.03 * var(--nav-shadow-k, 1)));
        }
        .lens.clay .bar::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: -1;
          border-radius: inherit;
          pointer-events: none;
          backdrop-filter: var(--nav-bdf, blur(var(--nav-blur, 5px)));
          -webkit-backdrop-filter: var(--nav-bdf, blur(var(--nav-blur, 5px)));
        }
        .lens.clay .bar::after {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          pointer-events: none;
          border: 1px solid rgba(255, 255, 255, calc(0.22 * var(--nav-rim-k, 1)));
          -webkit-mask-image: linear-gradient(123deg, #000 0%, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.5) 100%);
          mask-image: linear-gradient(123deg, #000 0%, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.5) 100%);
        }
        /* Desktop: the portrait is alone on the left; Home / Projects / Demos are grouped on the
           right, clear of Contact by this 16px margin plus the bar's 6px gap (22px box to
           box, about 37px text to Contact with the items' 15px padding). */
        .lens.clay .list {
          margin-left: auto;
          margin-right: 16px;
        }
        /* Contact is the call to action, so it is a SOLID chip (as Raycast's
           "Download" is), while the current page is shown by the translucent
           glass lens. Two different materials, so they never read as the same
           kind of chip. */
        .lens.clay .contact {
          border-radius: 10px;
          background: transparent;
          color: #fff;
          /* outline only, at the current-page highlight's alpha (0.1) */
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
        }
        .lens.clay .contact:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .tl.lens.clay .contact {
          background: transparent;
          color: #1b1b1d;
          box-shadow: inset 0 0 0 1px rgba(27, 27, 29, 0.1);
        }
        .tl.lens.clay .contact:hover {
          background: rgba(27, 27, 29, 0.1);
        }
        /* Focus ring: .lens.clay .contact's own shadow outranks the base ring, so restate it
           with the chip's shadow kept (visible on every tone). */
        .lens.clay .contact:focus-visible {
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.85), inset 0 0 0 1px rgba(255, 255, 255, 0.1);
        }
        .tl.lens.clay .contact:focus-visible {
          box-shadow: 0 0 0 2px rgba(27, 27, 29, 0.7), inset 0 0 0 1px rgba(27, 27, 29, 0.1);
        }
        .lens.clay .list :global(.lens),
        .lens.clay .list :global(.ghost) {
          border-radius: 10px;
        }
        .lens.clay :global(.item) {
          border-radius: 10px;
        }
        .tl.lens.clay .bar {
          border-color: rgba(60, 44, 44, calc(0.08 * var(--nav-rim-k, 1)));
          background: linear-gradient(137deg, rgba(var(--nav-tint-rgb, 251, 249, 248), calc(0.74 * var(--nav-fill-k, 1))) 4.87%, rgba(var(--nav-tint-rgb2, 241, 237, 236), calc(0.88 * var(--nav-fill-k, 1))) 75.88%);
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, calc(0.9 * var(--nav-hl-k, 1))), inset 0 -5px 6px rgba(255, 255, 255, calc(0.5 * var(--nav-glow-k, 1))),
            inset 0 -8px 24px rgba(255, 255, 255, calc(0.24 * var(--nav-glow-k, 1))), 0 7px 10px rgba(40, 28, 28, calc(0.07 * var(--nav-shadow-k, 1))), 0 39px 79px rgba(40, 28, 28, calc(0.05 * var(--nav-shadow-k, 1)));
        }
        .tl.lens.clay .bar::after {
          border-color: rgba(255, 255, 255, calc(0.95 * var(--nav-rim-k, 1)));
        }
        @media (max-width: 520px) {
          .lens.clay .bar {
            width: calc(100% - 20px);
            margin-top: calc(10px + env(safe-area-inset-top, 0px));
            padding: 5px 5px 5px 6px;
          }
        }
        .narrow.lens.clay .bar {
          width: calc(100% - 20px);
          margin-top: calc(10px + env(safe-area-inset-top, 0px));
          padding: 5px 5px 5px 6px;
        }


        /* ---- CLAY hover (operator: a thin line, no glass sheen) ----
           Each label draws its own underline, so the line appears under the item
           being hovered and never travels in from another item; the current item
           gets none (its pill lightens instead, below). Width (% of the text, centred), thickness and gap below the
           text are --nav-line-w / -h / -gap (80%, 1.3px, 6px); --nav-hover-k scales
           its alpha (live 0.5; 0 = no line). Pointer devices only; the
           sliding ghost span is not used by this variant. */
        .lens.clay .list :global(.ghost) {
          display: none;
        }
        .lens.clay .label {
          position: relative;
        }
        .lens.clay .label::after {
          content: '';
          position: absolute;
          left: calc((100% - var(--nav-line-w, 80%)) / 2);
          width: var(--nav-line-w, 80%);
          bottom: calc(-1 * var(--nav-line-gap, 6px));
          height: var(--nav-line-h, 1.3px);
          border-radius: 1px;
          background: rgba(255, 255, 255, calc(0.8 * var(--nav-hover-k, 1)));
          opacity: 0;
          transition: opacity 0.16s ease-out;
          pointer-events: none;
        }
        .tl.lens.clay .label::after {
          background: rgba(27, 27, 29, calc(0.7 * var(--nav-hover-k, 1)));
        }
        @media (hover: hover) and (pointer: fine) {
          .lens.clay :global(.item):not(.active):hover .label::after {
            opacity: 1;
          }
          /* The current item gets no line (operator); hovering it lightens its pill a
             touch instead, so it still reads as clickable. --nav-chip-hover-k scales it. */
          :global(.gnav.lens.clay .list:has(.item.active:hover) .lens) {
            background: rgba(255, 255, 255, calc(0.1 + 0.05 * var(--nav-chip-hover-k, 1)));
          }
          :global(.gnav.tl.lens.clay .list:has(.item.active:hover) .lens) {
            background: rgba(27, 27, 29, calc(0.1 - 0.03 * var(--nav-chip-hover-k, 1)));
          }
        }
        .lens.clay.ready .list :global(.lens) {
          transition: transform 0.46s cubic-bezier(0.34, 1.32, 0.5, 1), width 0.46s cubic-bezier(0.34, 1.32, 0.5, 1),
            opacity 0.2s ease-out, background-color 0.16s ease-out;
        }
        @media (prefers-reduced-motion: reduce) {
          .lens.clay .label::after {
            transition: none;
          }
        }

        /* ---- CLAY phone menu + Contact popover ---- */
        .pagename,
        .menubtn,
        .panel {
          display: none;
        }
        .pagename {
          color: #fff;
          line-height: 1;
        }
        .tl .pagename {
          color: #1b1b1d;
        }
        .menubtn {
          flex: none;
          box-sizing: border-box;
          width: 44px;
          height: 44px;
          padding: 0;
          border: 0;
          border-radius: 10px;
          background: transparent;
          color: #fff;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          outline: none;
          transition: background-color 0.18s ease, transform 0.12s ease-out;
        }
        /* Hamburger carried over from the original home page navbar: two 18x2 lines,
           6px apart, that rotate into an X (+/-4px translate meets at the centre).
           Colour follows the tone through currentColor. */
        .hb-line {
          display: block;
          width: 18px;
          height: 2px;
          border-radius: 4px;
          background-color: currentColor;
          /* Two clean steps instead of one blended tween (which passes through a '>' shape):
             closing -> open: the lines slide together, THEN turn into the X; open -> closed:
             turn flat, THEN slide apart. translate/rotate are separate properties so each
             gets its own timing and delay. */
          transition: translate 0.14s ease 0.14s, rotate 0.14s ease 0s;
        }
        .menubtn[aria-expanded='true'] .hb-line {
          transition: translate 0.14s ease 0s, rotate 0.14s ease 0.14s;
        }
        .menubtn[aria-expanded='true'] .hb-line:first-child {
          translate: 0 4px;
          rotate: 45deg;
        }
        .menubtn[aria-expanded='true'] .hb-line:last-child {
          translate: 0 -4px;
          rotate: -45deg;
        }
        .tl .menubtn {
          color: #1b1b1d;
        }
        .menubtn:active {
          transform: scale(0.95);
        }
        .menubtn:focus-visible {
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.85);
        }
        .tl .menubtn:focus-visible {
          box-shadow: 0 0 0 2px rgba(27, 27, 29, 0.7);
        }
        .contactwrap {
          position: relative;
          display: flex;
          flex: none;
        }
        button.contact,
        button.pchip {
          border: 0;
          font: inherit;
          cursor: pointer;
          line-height: 1;
        }

        /* glass material for the phone panel: the SAME recipe and --nav-* variables as the bar
           (fill + tint, blur, rim, top highlight, bottom glow, shadow), so a tuned or applied
           value shows on both. The panel keeps its own geometry (below) and no underline. */
        .lens.clay .panel {
          position: absolute;
          z-index: 5;
          box-sizing: border-box;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, calc(0.06 * var(--nav-rim-k, 1)));
          /* phone menu (operator): same recipe as the bar, but never thinner than about the old solid panel, so far less of the page shows through */
          background: linear-gradient(137deg, rgba(var(--nav-tint-rgb, 18, 18, 18), max(0.86, calc(0.75 * var(--nav-fill-k, 1)))) 4.87%, rgba(var(--nav-tint-rgb2, 14, 14, 14), max(0.92, calc(0.9 * var(--nav-fill-k, 1)))) 75.88%);
          backdrop-filter: var(--nav-bdf, blur(var(--nav-blur, 5px)));
          -webkit-backdrop-filter: var(--nav-bdf, blur(var(--nav-blur, 5px)));
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, calc(0.15 * var(--nav-hl-k, 1))), inset 0 -5px 6px rgba(255, 255, 255, calc(0.04 * var(--nav-glow-k, 1))),
            inset 0 -8px 24px rgba(255, 255, 255, calc(0.03 * var(--nav-glow-k, 1))), 0 7px 10px rgba(0, 0, 0, calc(0.06 * var(--nav-shadow-k, 1))), 0 39px 79px rgba(0, 0, 0, calc(0.03 * var(--nav-shadow-k, 1)));
          color: #fff;
          animation: gnav-pop 0.16s ease-out;
        }
        .lens.clay .panel::after {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          pointer-events: none;
          border: 1px solid rgba(255, 255, 255, calc(0.22 * var(--nav-rim-k, 1)));
          -webkit-mask-image: linear-gradient(123deg, #000 0%, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.5) 100%);
          mask-image: linear-gradient(123deg, #000 0%, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.5) 100%);
        }
        .tl.lens.clay .panel {
          border-color: rgba(60, 44, 44, calc(0.08 * var(--nav-rim-k, 1)));
          background: linear-gradient(137deg, rgba(var(--nav-tint-rgb, 251, 249, 248), max(0.86, calc(0.74 * var(--nav-fill-k, 1)))) 4.87%, rgba(var(--nav-tint-rgb2, 241, 237, 236), max(0.92, calc(0.88 * var(--nav-fill-k, 1)))) 75.88%);
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, calc(0.9 * var(--nav-hl-k, 1))), inset 0 -5px 6px rgba(255, 255, 255, calc(0.5 * var(--nav-glow-k, 1))),
            inset 0 -8px 24px rgba(255, 255, 255, calc(0.24 * var(--nav-glow-k, 1))), 0 7px 10px rgba(40, 28, 28, calc(0.07 * var(--nav-shadow-k, 1))), 0 39px 79px rgba(40, 28, 28, calc(0.05 * var(--nav-shadow-k, 1)));
          color: #1b1b1d;
        }
        .tl.lens.clay .panel::after {
          border-color: rgba(255, 255, 255, calc(0.95 * var(--nav-rim-k, 1)));
        }
        @keyframes gnav-pop {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }

        /* Contact popover (desktop) */
        /* filled chip: the ring sits 3px off it (outline + offset), so a band of panel colour
           separates ring and chip on both tones (a flush ring merged into the chip) */
        .pchip:focus-visible {
          outline: 2px solid rgba(255, 255, 255, 0.85);
          outline-offset: 3px;
        }
        .tl .pchip:focus-visible {
          outline-color: rgba(27, 27, 29, 0.7);
        }

        /* Phone menu panel: attached under the bar, overlays the page (absolute, no push) */
        .lens.clay .panel {
          top: calc(100% + 7px); /* 1px bar border + 6px gap */
          left: -1px;
          right: -1px;
          padding: 6px;
          /* eased open: fade + small drop and scale from the top edge */
          transform-origin: 50% 0;
          animation: gnav-panel-in 0.24s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .lens.clay .panel.closing {
          /* matching close, runs before unmount (animationend / fallback timer) */
          animation: gnav-panel-out 0.18s cubic-bezier(0.4, 0, 1, 1) both;
          pointer-events: none;
        }
        @keyframes gnav-panel-in {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        @keyframes gnav-panel-out {
          from {
            opacity: 1;
            transform: none;
          }
          to {
            opacity: 0;
            transform: translateY(-6px) scale(0.98);
          }
        }
        .panel :global(.pitem) {
          position: relative;
          /* single line ending in an ellipsis (a flex box can't ellipsise its bare text) */
          display: block;
          line-height: 44px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          box-sizing: border-box;
          height: 44px;
          padding: 0 14px;
          border-radius: 10px;
          font-size: 15px;
          color: inherit;
          text-decoration: none;
          outline: none;
          transition: background-color 0.18s ease;
        }
        .panel :global(.pitem.active) {
          /* same flat, soft chip as the light tone (operator: one visual language) */
          background: rgba(255, 255, 255, calc(0.1 * var(--nav-menu-row-k, 0.5))); /* x the original 0.1 */
          box-shadow: none;
          font-weight: 500;
        }
        .tl .panel :global(.pitem.active) {
          background: rgba(27, 27, 29, calc(0.1 * var(--nav-menu-row-k, 0.5)));
          box-shadow: none;
        }
        .panel :global(.pitem:focus-visible) {
          box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.85);
        }
        .tl .panel :global(.pitem:focus-visible) {
          box-shadow: inset 0 0 0 2px rgba(27, 27, 29, 0.7);
        }
        .psep {
          height: 1px;
          margin: 6px 8px;
          background: rgba(255, 255, 255, 0.1);
        }
        .tl .psep {
          background: rgba(60, 44, 44, 0.12);
        }
        .pchip {
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          width: 100%;
          height: 44px;
          border-radius: 10px;
          font-size: 15px;
          text-decoration: none;
          outline: none;
          background: rgba(255, 255, 255, 0.94);
          color: #141416;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7), 0 1px 2px rgba(0, 0, 0, 0.35);
        }
        .tl .pchip {
          background: #1b1b1d;
          color: #fff;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 1px 2px rgba(0, 0, 0, 0.25);
        }

        /* PHONE: <= 520px, or a preview frame marked 'narrow'. Desktop is untouched. */
        @media (max-width: 520px) {
          .lens.clay .bar {
            width: calc(100% - 20px);
            margin-top: calc(10px + env(safe-area-inset-top, 0px));
            padding: 4px 4px 4px 6px;
            gap: 8px;
          }
          .lens.clay .list,
          .lens.clay .contactwrap {
            display: none;
          }
          .lens.clay :global(.portrait) {
            display: block;
            margin-left: 5px; /* visible M and visible menu icon sit the same 12px from the bar's edges */
          }
          .lens.clay .bar {
            position: relative;
          }
          .lens.clay .pagename {
            display: block;
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            max-width: calc(100% - 120px); /* symmetric: clears the mark (left) and the menu button (right) */
            pointer-events: none;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 15px;
            font-weight: 500; /* current page, as on desktop */
          }
          .lens.clay .menubtn {
            display: flex;
            margin-left: auto;
            margin-right: -6px; /* the 18px icon sits 13px inside its 44px box; pull the box out so the drawn icon mirrors the M */
          }
          .lens.clay .panel:not([hidden]) {
            display: block;
          }
        }
        .narrow.lens.clay .bar {
          width: calc(100% - 20px);
          margin-top: calc(10px + env(safe-area-inset-top, 0px));
          padding: 4px 4px 4px 6px;
          gap: 8px;
        }
        .narrow.lens.clay .list,
        .narrow.lens.clay .contactwrap {
          display: none;
        }
        .narrow.lens.clay :global(.portrait) {
          display: block;
          margin-left: 5px;
        }
        .narrow.lens.clay .bar {
          position: relative;
        }
        .narrow.lens.clay .pagename {
          display: block;
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          max-width: calc(100% - 120px);
          pointer-events: none;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 15px;
        }
        .narrow.lens.clay .menubtn {
          display: flex;
          margin-left: auto;
          margin-right: -6px;
        }
        .narrow.lens.clay .panel:not([hidden]) {
          display: block;
        }

        /* ---- CLAY, DOCKED (dock="docked"): flush to the top, full width, no radius ----
           The glass recipe, tones and tuning variables are the floating bar's. Only the
           geometry changes: the bar spans the viewport (safe-area insets included), its
           contents sit at the floating bar's 1160px content width (or 16px + safe-area
           from the edges, whichever is larger), the rim becomes a bottom hairline (the
           masked all-round rim would be cut off by the screen edges), and the phone
           panel is an inset card under the bar. Bar height is 53px on every viewport
           (36px items + 2 x 8px, or the 44px menu button + 2 x 4px, + 1px hairline) plus
           the top safe-area inset; DOCKED_NAV_H adds 8px of air for pages. */
        .dk {
          padding-left: 0;
          padding-right: 0;
        }
        .dk.lens.clay .bar {
          width: 100%;
          max-width: none;
          margin-top: 0;
          padding: calc(8px + env(safe-area-inset-top, 0px)) max(calc(16px + env(safe-area-inset-right, 0px)), calc((100% - 1160px) / 2 + 9px)) 8px max(calc(16px + env(safe-area-inset-left, 0px)), calc((100% - 1160px) / 2 + 10px));
          border-width: 0 0 1px;
          border-radius: 0;
        }
        .dk.lens.clay .bar::before {
          border-radius: 0;
        }
        .dk.lens.clay .bar::after {
          display: none;
        }
        .dk.lens.clay .bar {
          border-color: rgba(255, 255, 255, calc(0.16 * var(--nav-rim-k, 1)));
        }
        .dk.tl.lens.clay .bar {
          border-color: rgba(60, 44, 44, calc(0.12 * var(--nav-rim-k, 1)));
        }
        /* Docked: the menu is a flush, square continuation of the bar (full width, directly
           under its hairline, no outer radius, no separate all-round border or rim). */
        /* Docked phone: the drawn M sits 16px from the screen edge; the menu icon mirrors it. */
        .dk.lens.clay :global(.portrait) {
          margin-left: 0;
        }
        .dk.lens.clay .menubtn {
          margin-right: -13px;
        }
        .dk.lens.clay .panel {
          top: calc(100% + 1px);
          left: 0;
          right: 0;
          padding: 6px 8px 8px;
          border-width: 0 0 1px;
          border-radius: 0;
          border-color: rgba(255, 255, 255, calc(0.16 * var(--nav-rim-k, 1)));
        }
        .dk.tl.lens.clay .panel {
          border-color: rgba(60, 44, 44, calc(0.12 * var(--nav-rim-k, 1)));
        }
        .dk.lens.clay .panel::after {
          display: none;
        }
        /* Docked: slides down out of the bar (no scale; it is as wide as the bar) */
        .dk.lens.clay .panel {
          animation: gnav-panel-dk-in 0.24s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .dk.lens.clay .panel.closing {
          animation: gnav-panel-dk-out 0.18s cubic-bezier(0.4, 0, 1, 1) both;
        }
        @keyframes gnav-panel-dk-in {
          from {
            opacity: 0;
            transform: translateY(-14px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        @keyframes gnav-panel-dk-out {
          from {
            opacity: 1;
            transform: none;
          }
          to {
            opacity: 0;
            transform: translateY(-14px);
          }
        }
        @media (max-width: 520px) {
          .dk.lens.clay .bar {
            padding: calc(4px + env(safe-area-inset-top, 0px)) calc(16px + env(safe-area-inset-right, 0px)) 4px calc(16px + env(safe-area-inset-left, 0px));
          }
        }
        .dk.narrow.lens.clay .bar {
          padding: calc(4px + env(safe-area-inset-top, 0px)) 16px 4px 16px;
        }
        /* Docked: the content sits 16px in, so the symmetric label allowance is larger and the
           label centres on the content box rather than the safe-area padding. */
        @media (max-width: 520px) {
          .dk.lens.clay .pagename {
            top: calc(50% + env(safe-area-inset-top, 0px) / 2);
            max-width: calc(100% - 152px);
          }
        }
        .dk.narrow.lens.clay .pagename {
          top: calc(50% + env(safe-area-inset-top, 0px) / 2);
          max-width: calc(100% - 152px);
        }

        /* ===================== DARK RIM VARIATIONS (preview, pick one) =====================
           The live dark rim reads "a bit too much" on black (operator). On a white page the
           edge just looks normal; these aim for that on black. Dark tone only.
           Each variant is the live recipe with different structure and different FALLBACKS of
           the same tuning variables, so a tuning prop (or the tuner sliders) still moves the
           rim, highlight and shadow of whichever variant is picked:
             A subtle   rim 0.5, highlight 0.5, no wide inner glow
             B hairline rim 0.55, highlight 0.4, border-less, top line only
             C none     rim 0, highlight 0, shadow x3.5 (edge carried by shadow alone) */
        .td.rim-a.lens.clay .bar {
          border-color: rgba(255, 255, 255, calc(0.06 * var(--nav-rim-k, 0.5)));
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, calc(0.15 * var(--nav-hl-k, 0.5))), inset 0 -5px 6px rgba(255, 255, 255, calc(0.04 * var(--nav-glow-k, 0.75))),
            0 7px 10px rgba(0, 0, 0, calc(0.06 * var(--nav-shadow-k, 1))), 0 39px 79px rgba(0, 0, 0, calc(0.03 * var(--nav-shadow-k, 1)));
        }
        .td.rim-a.lens.clay .bar::after {
          border-color: rgba(255, 255, 255, calc(0.22 * var(--nav-rim-k, 0.5)));
        }
        .td.rim-b.lens.clay .bar {
          border-color: transparent;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, calc(0.15 * var(--nav-hl-k, 0.4))),
            inset 0 -5px 6px rgba(255, 255, 255, calc(0.04 * var(--nav-glow-k, 0))), inset 0 -8px 24px rgba(255, 255, 255, calc(0.03 * var(--nav-glow-k, 0))), 0 7px 10px rgba(0, 0, 0, calc(0.06 * var(--nav-shadow-k, 1))),
            0 39px 79px rgba(0, 0, 0, calc(0.03 * var(--nav-shadow-k, 1)));
        }
        .td.rim-b.lens.clay .bar::after {
          border-color: rgba(255, 255, 255, calc(0.22 * var(--nav-rim-k, 0.55)));
        }
        .td.rim-c.lens.clay .bar {
          border-color: transparent;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, calc(0.15 * var(--nav-hl-k, 0))),
            inset 0 -5px 6px rgba(255, 255, 255, calc(0.04 * var(--nav-glow-k, 0))), inset 0 -8px 24px rgba(255, 255, 255, calc(0.03 * var(--nav-glow-k, 0))), 0 7px 10px rgba(0, 0, 0, calc(0.06 * var(--nav-shadow-k, 3.5))),
            0 39px 79px rgba(0, 0, 0, calc(0.03 * var(--nav-shadow-k, 3.5)));
        }
        .td.rim-c.lens.clay .bar::after {
          border-color: rgba(255, 255, 255, calc(0.22 * var(--nav-rim-k, 0)));
        }

        /* ===================== QUIET ===================== */
        .quiet .bar {
          width: 100%;
          max-width: 1160px;
          box-sizing: border-box;
          padding: calc(14px + env(safe-area-inset-top, 0px)) 24px 22px;
          gap: 8px;
        }
        /* The glass: a blurred band that fades to nothing at its lower
           edge — no panel edge to draw an outline around. */
        .quiet .bar::before {
          content: '';
          position: absolute;
          z-index: -1;
          top: 0;
          bottom: 0;
          left: calc(50% - 50vw);
          right: calc(50% - 50vw);
          background: linear-gradient(to bottom, var(--scrim-top) 0%, var(--scrim-mid) 55%, transparent 100%);
          backdrop-filter: blur(var(--blur-q)) saturate(160%);
          -webkit-backdrop-filter: blur(var(--blur-q)) saturate(160%);
          mask-image: linear-gradient(to bottom, #000 0%, #000 52%, transparent 100%);
          -webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 52%, transparent 100%);
        }
        .quiet .list {
          gap: 4px;
          margin-left: 18px;
          flex: 1;
        }
        .quiet :global(.item) {
          height: 32px;
          padding: 0 12px;
        }
        .quiet .list :global(.bar-ind) {
          position: absolute;
          left: 0;
          bottom: 1px;
          height: 2px;
          border-radius: 2px;
          background: #fff;
          pointer-events: none;
          z-index: 1;
        }
        .quiet.ready .list :global(.bar-ind) {
          transition: transform 0.42s cubic-bezier(0.34, 1.25, 0.5, 1), width 0.42s cubic-bezier(0.34, 1.25, 0.5, 1),
            opacity 0.2s ease-out;
        }
        .quiet .contact {
          margin-left: auto;
          height: 32px;
          display: flex;
          align-items: center;
          padding: 0 14px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }
        .quiet .contact:hover {
          background: rgba(255, 255, 255, 0.18);
        }

        /* ===================== LIGHT TONE (pale pages) =====================
           Frosted white glass, dark text, dark active marker. Same
           geometry and motion as the dark tone. */
        .tl .label {
          opacity: 0.9;
        }
        .gnav.tl :global(.item) {
          color: #1b1b1d;
        }
        .gnav.tl :global(.item):hover .label {
          opacity: 1; /* rest + 0.10 */
        }
        .gnav.tl :global(.item.active) .label {
          opacity: 1;
        }
        .gnav.tl :global(.item):focus-visible,
        .tl .contact:focus-visible {
          box-shadow: 0 0 0 2px rgba(27, 27, 29, 0.7);
        }
        .tl.lens .bar {
          box-shadow: 0 16px 34px -16px rgba(40, 24, 24, 0.32);
        }
        .tl.lens .list :global(.lens) {
          background: rgba(27, 27, 29, 0.1);
          box-shadow: none;
        }
        .tl.lens .list :global(.ghost) {
          background: rgba(27, 27, 29, 0.04);
        }
        .tl.lens .contact {
          background: rgba(27, 27, 29, 0.1);
          color: #141416;
        }
        .tl.lens .contact:hover {
          background: rgba(27, 27, 29, 0.18);
        }
        .tl.quiet .list :global(.bar-ind) {
          background: #1b1b1d;
        }
        .tl.quiet .contact {
          background: rgba(27, 27, 29, 0.08);
          color: #1b1b1d;
        }
        .tl.quiet .contact:hover {
          background: rgba(27, 27, 29, 0.15);
        }

        /* ===================== PHONE ===================== */
        @media (max-width: 520px) {
          .lens .bar {
            margin-top: calc(10px + env(safe-area-inset-top, 0px));
            gap: 2px;
            padding: 5px 5px 5px 6px;
          }
          .lens .list {
            margin: 0 2px 0 4px;
          }
          .lens :global(.item) {
            height: 34px;
            padding: 0 11px;
          }
          .lens .list :global(.lens),
          .lens .list :global(.ghost) {
            height: 34px;
          }
          .lens .contact {
            height: 34px;
            padding: 0 12px;
          }
          .quiet .bar {
            padding: calc(12px + env(safe-area-inset-top, 0px)) 14px 20px;
            gap: 4px;
          }
          .quiet .list {
            margin-left: 8px;
          }
          .quiet :global(.item) {
            padding: 0 9px;
          }
          .quiet .contact {
            padding: 0 11px;
          }
        }
        /* Very narrow phones: drop the portrait before anything crowds */
        @media (max-width: 380px) {
          .gnav :global(.portrait) {
            display: none;
          }
        }
        .narrow.lens .bar {
          margin-top: calc(10px + env(safe-area-inset-top, 0px));
          gap: 2px;
          padding: 5px 5px 5px 6px;
        }
        .narrow.lens .list {
          margin: 0 2px 0 4px;
        }
        .narrow.lens :global(.item) {
          height: 34px;
          padding: 0 11px;
        }
        .narrow.lens .list :global(.lens),
        .narrow.lens .list :global(.ghost) {
          height: 34px;
        }
        .narrow.lens .contact {
          height: 34px;
          padding: 0 12px;
        }
        .narrow.quiet .bar {
          padding: calc(12px + env(safe-area-inset-top, 0px)) 14px 20px;
          gap: 4px;
        }
        .narrow.quiet .list {
          margin-left: 8px;
        }
        .narrow.quiet :global(.item) {
          padding: 0 9px;
        }
        .narrow.quiet .contact {
          padding: 0 11px;
        }

        /* ===================== PREFERENCES / FALLBACKS ===================== */
        @media (prefers-reduced-motion: reduce) {
          .label,
          .contact,
          .gnav :global(.portrait),
          .gnav :global(.lens),
          .gnav :global(.ghost),
          .gnav :global(.bar-ind),
          .menubtn,
          .hb-line,
          .panel :global(.pitem) {
            transition: none !important;
          }
          .lens.clay .panel {
            animation: none !important;
          }
        }
        @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
          .lens .bar {
            background: rgba(22, 22, 24, 0.92);
          }
          .quiet .bar::before {
            background: linear-gradient(to bottom, rgba(14, 14, 16, 0.92), rgba(14, 14, 16, 0));
          }
        }
        @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
          .tl.lens .bar {
            background: rgba(255, 255, 255, 0.94);
          }
          .tl.quiet .bar::before {
            background: linear-gradient(to bottom, rgba(255, 255, 255, 0.94), rgba(255, 255, 255, 0));
          }
        }
        @media (prefers-contrast: more) {
          .lens .bar {
            background: rgba(12, 12, 14, 0.9);
          }
          .tl.lens .bar {
            background: rgba(255, 255, 255, 0.94);
          }
        }
        @media (forced-colors: active) {
          .lens .bar,
          .quiet .bar::before {
            background: Canvas;
            border: 1px solid CanvasText;
          }
          .gnav :global(.item),
          .contact {
            color: LinkText;
            forced-color-adjust: auto;
          }
        }
        @media (prefers-reduced-transparency: reduce) {
          .tl.lens .bar {
            background: rgba(255, 255, 255, 0.97);
          }
          .tl.quiet .bar::before {
            background: linear-gradient(to bottom, rgba(255, 255, 255, 0.97), rgba(255, 255, 255, 0));
          }
          .lens .bar {
            background: rgba(22, 22, 24, 0.96);
          }
          .quiet .bar::before {
            background: linear-gradient(to bottom, rgba(14, 14, 16, 0.96), rgba(14, 14, 16, 0));
          }
        }
      `}</style>
    </div>
    {flip && (
      // Server-rendered HTML only: runs while the page is parsed, before first paint, so a phone
      // never shows the light frost for a frame. React then agrees (phone state above).
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){var s=document.currentScript,g=s&&s.previousElementSibling;if(g&&window.matchMedia(${JSON.stringify(PHONE_MQ)}).matches){g.className=g.className.replace(/(^| )tl( |$)/,'$1tm$2');${tuning ? '' : `g.setAttribute('style',${JSON.stringify(tuningCss(site?.dark))});`}}})();`,
        }}
      />
    )}
    </>
  );
};

export default SiteNavGlass;
