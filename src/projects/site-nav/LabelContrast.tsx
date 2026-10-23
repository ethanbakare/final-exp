/**
 * Worst-case label contrast for the navbar tuner (/showcase/site-nav).
 *
 * Content of any colour can scroll under the bar, so the honest number is the
 * worst case over that content, not a reading of one frame. For each content
 * colour in UNDER (a grey ramp plus saturated colours) it composites the bar's
 * own fill stops (read from the rendered bar), then the current-page chip where
 * there is one, then the label in its rendered colour and opacity, and keeps the
 * lowest WCAG ratio across every visible label. Blur only mixes colours that are
 * already in that range, so it cannot make the worst case worse. Contact is a
 * solid chip and does not depend on the glass, so it is left out.
 */
import React, { useEffect, useState } from 'react';

type RGBA = [number, number, number, number];

const parse = (s: string): RGBA[] =>
  [...s.matchAll(/rgba?\(([^)]+)\)/g)].map((m) => {
    const v = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return [v[0], v[1], v[2], v[3] ?? 1];
  });
const lin = (c: number) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const lum = (c: number[]) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
const over = (top: RGBA, under: number[], alpha = top[3]) => [0, 1, 2].map((i) => top[i] * alpha + under[i] * (1 - alpha));
const ratio = (a: number[], b: number[]) => {
  const x = lum(a);
  const y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

const UNDER: number[][] = [
  ...Array.from({ length: 16 }, (_, i) => [i * 17, i * 17, i * 17]),
  [255, 0, 0], [0, 255, 0], [0, 0, 255], [255, 255, 0], [0, 255, 255], [255, 0, 255],
  [43, 95, 217], [228, 87, 46], [150, 89, 53],
];

/** Product of opacities from el up to (and including) root. */
const chainOpacity = (el: Element, root: Element) => {
  let o = 1;
  for (let n: Element | null = el; n; n = n.parentElement) {
    o *= parseFloat(getComputedStyle(n).opacity) || 0;
    if (n === root) break;
  }
  return o;
};

export function worstLabelContrast(gnav: Element): number | null {
  const bar = gnav.querySelector('.bar');
  if (!bar) return null;
  const barCs = getComputedStyle(bar);
  const fills = [...parse(barCs.backgroundColor), ...parse(barCs.backgroundImage)];
  const stops: RGBA[] = parse(barCs.backgroundImage);
  const base = parse(barCs.backgroundColor)[0];
  const chipEl = gnav.querySelector('.list .lens');
  const chip = chipEl && getComputedStyle(chipEl).opacity !== '0' ? parse(getComputedStyle(chipEl).backgroundColor)[0] : undefined;
  const labels = [...gnav.querySelectorAll('.item .label, .pagename')].filter((l) => (l as HTMLElement).offsetParent !== null);
  if (!labels.length || !fills.length) return null;
  let worst = Infinity;
  for (const l of labels) {
    const col = parse(getComputedStyle(l).color)[0];
    const op = chainOpacity(l, gnav) * col[3];
    const onChip = !!chip && !!l.closest('.item.active');
    for (const u of UNDER) {
      for (const s of stops.length ? stops : [[0, 0, 0, 0] as RGBA]) {
        let bg = base ? over(base, u) : u;
        bg = over(s, bg);
        if (onChip && chip) bg = over(chip, bg);
        const text = over(col, bg, op);
        worst = Math.min(worst, ratio(text, bg));
      }
    }
  }
  return Number.isFinite(worst) ? worst : null;
}

/** Small readout under the sliders; recomputes after every render of the inputs in `deps`. */
export const LabelContrast: React.FC<{ stageSelector: string; deps: unknown[] }> = ({ stageSelector, deps }) => {
  const [value, setValue] = useState<number | null>(null);
  useEffect(() => {
    const g = document.querySelector(`${stageSelector} .gnav`);
    const measure = () => setValue(g ? worstLabelContrast(g) : null);
    // Label colour and fill animate (about 0.2s) after a tone or backdrop change, so a
    // reading taken right away is mid-transition. Measure after two frames, again when
    // the bar's transitions end, and once more after they must have ended.
    let id2 = 0;
    const id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(measure);
    });
    const late = setTimeout(measure, 600);
    g?.addEventListener('transitionend', measure);
    return () => {
      cancelAnimationFrame(id1);
      cancelAnimationFrame(id2);
      clearTimeout(late);
      g?.removeEventListener('transitionend', measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  if (value === null) return null;
  const ok = value >= 4.5;
  return (
    <div className="mt-3 flex items-start justify-between gap-3 text-xs" data-testid="label-contrast" aria-live="polite">
      <span className="text-gray-500">
        Label contrast, strictest case (any colour under the bar)
        {!ok && <span className="mt-0.5 block text-amber-700">Below 4.5:1 over some colours. The real pages may still pass; check one after Apply.</span>}
      </span>
      <span className={`shrink-0 tabular-nums ${ok ? 'text-gray-500' : 'font-medium text-amber-700'}`}>
        <span aria-hidden="true" className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle ${ok ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        {value.toFixed(1)}:1
      </span>
    </div>
  );
};
