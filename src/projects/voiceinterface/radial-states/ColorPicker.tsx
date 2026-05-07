/**
 * ColorPicker — visually identical to the realtime-states picker
 * (ColorArea + ColorSlider + hex input). Lives in its own module so
 * the page entry doesn't pull react-aria-components directly into the
 * page-route bundle (which previously triggered a 'getStaticProps
 * with getServerSideProps' error in Next.js dev mode).
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ColorArea,
  ColorSlider,
  ColorThumb,
  SliderTrack,
  parseColor,
  type Color,
} from 'react-aria-components';

export interface ColorPickerButtonProps {
  value: string;
  onChange: (v: string) => void;
  title?: string;
  swatchSize?: number;
}

export function ColorPickerButton({
  value,
  onChange,
  title = 'Open colour picker',
  swatchSize = 18,
}: ColorPickerButtonProps) {
  const [open, setOpen] = useState(false);
  const [pickerValue, setPickerValue] = useState<Color | null>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setPickerValue(parseColor(value).toFormat('hsb'));
    } catch {
      /* invalid hex — keep last good */
    }
  }, [value]);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const btn = buttonRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const popoverWidth = popoverRef.current?.offsetWidth ?? 288;
      const popoverHeight = popoverRef.current?.offsetHeight ?? 320;
      const gap = 8;
      const maxLeft = window.innerWidth - popoverWidth - gap;
      const maxTop = window.innerHeight - popoverHeight - gap;
      const aboveTop = rect.top - popoverHeight - gap;
      const belowTop = rect.bottom + gap;
      const fitsAbove = aboveTop >= gap;
      const fitsBelow = belowTop + popoverHeight <= window.innerHeight - gap;
      const top = fitsAbove
        ? aboveTop
        : fitsBelow
          ? belowTop
          : Math.max(gap, Math.min(maxTop, aboveTop));
      const left = Math.max(gap, Math.min(maxLeft, rect.right - popoverWidth));
      setPosition({ left, top });
    };
    place();
    const frame = requestAnimationFrame(place);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const commitColor = (next: Color) => {
    const hsb = next.toFormat('hsb');
    setPickerValue(hsb);
    onChange(hsb.toString('hex').toLowerCase());
  };

  const popover =
    open && pickerValue && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={popoverRef}
            onMouseDown={(e) => e.stopPropagation()}
            className="fixed z-[100] w-72 rounded-lg border border-gray-200 bg-white p-3 shadow-xl"
            style={{
              left: position?.left ?? -9999,
              top: position?.top ?? 8,
              visibility: position ? 'visible' : 'hidden',
            }}
          >
            <ColorArea
              aria-label="Saturation and brightness"
              colorSpace="hsb"
              xChannel="saturation"
              yChannel="brightness"
              value={pickerValue}
              onChange={commitColor}
              className="relative h-36 w-full overflow-hidden rounded-md border border-gray-200"
            >
              <ColorThumb className="h-4 w-4 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.55)]" />
            </ColorArea>
            <ColorSlider
              aria-label="Hue"
              colorSpace="hsb"
              channel="hue"
              value={pickerValue}
              onChange={commitColor}
              className="mt-3"
            >
              <SliderTrack className="relative h-3 rounded-full bg-[linear-gradient(90deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)]">
                <ColorThumb className="top-1/2 h-5 w-5 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]" />
              </SliderTrack>
            </ColorSlider>
            <div className="mt-3">
              <input
                type="text"
                value={value}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  if (/^#?[0-9a-fA-F]{6}$/.test(v)) {
                    onChange(v.startsWith('#') ? v.toLowerCase() : `#${v.toLowerCase()}`);
                  }
                }}
                className="w-full rounded-md border border-gray-200 px-2 py-1 text-center text-sm tabular-nums text-gray-700 outline-none focus:border-gray-400"
              />
              <span className="mt-1 block text-center text-[10px] font-medium uppercase text-gray-400">
                HEX
              </span>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((p) => !p)}
        title={title}
        style={{
          position: 'relative',
          width: swatchSize,
          height: swatchSize,
          borderRadius: '50%',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.15)',
          padding: 0,
          cursor: 'pointer',
          background: 'transparent',
        }}
      >
        <span style={{ position: 'absolute', inset: 0, backgroundColor: value }} />
      </button>
      {popover}
    </div>
  );
}
