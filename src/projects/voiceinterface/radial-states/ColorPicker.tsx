/**
 * ColorPicker — visually similar to the realtime-states picker
 * (ColorArea + ColorSlider + value input), with three differences
 * specific to the radial-states UI:
 *   - format selector lives at the BOTTOM (HEX / RGB / HSL / HSB pills)
 *     instead of the top, so format and value live together;
 *   - dark popover surface (#1a1a1e) to match the bottom-bar theme;
 *   - optional title shown at the top of the popover (the swatch's
 *     `title` prop), so the user knows which color slot they're editing
 *     without consulting the trigger.
 *
 * Format-aware value input: hex format shows one text field; rgb / hsl /
 * hsb show three (R G B, H S L, H S B) — same shape as realtime-states'
 * ColorChannelFields. Helpers (colorFieldValues / colorDraftsToHex)
 * are imported from the realtime-states helpers module so the math
 * stays single-sourced.
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
import {
  colorDraftsToHex,
  colorFieldValues,
} from '@/projects/voiceinterface/realtime-states/helpers';
import type { ColorFormat } from '@/projects/voiceinterface/realtime-states/types';

const COLOR_FORMATS: ColorFormat[] = ['hex', 'rgb', 'hsl', 'hsb'];

export interface ColorPickerButtonProps {
  value: string;
  onChange: (v: string) => void;
  /** Visible at top of popover so the user knows which color slot
   *  they're editing. Also used as the swatch button's HTML title. */
  title?: string;
  swatchSize?: number;
}

interface ChannelFieldsProps {
  value: string;
  colorFormat: ColorFormat;
  onChange: (v: string) => void;
}

function ChannelFields({ value, colorFormat, onChange }: ChannelFieldsProps) {
  const fields = colorFieldValues(value, colorFormat);
  const [drafts, setDrafts] = useState<string[]>(() => fields.map((f) => f.value));

  // Keep drafts in sync when value or format changes externally (e.g. user
  // drags the saturation/brightness picker, or switches HEX → RGB).
  useEffect(() => {
    setDrafts(colorFieldValues(value, colorFormat).map((f) => f.value));
  }, [value, colorFormat]);

  const commit = () => {
    const next = colorDraftsToHex(colorFormat, drafts);
    if (next) onChange(next);
    else setDrafts(colorFieldValues(value, colorFormat).map((f) => f.value));
  };

  return (
    <div
      style={{
        marginTop: 12,
        display: 'grid',
        gap: 8,
        gridTemplateColumns: colorFormat === 'hex' ? '1fr' : '1fr 1fr 1fr',
      }}
    >
      {fields.map((field, i) => (
        <label key={field.label} style={{ display: 'block' }}>
          <input
            type="text"
            value={drafts[i] ?? ''}
            onChange={(e) => {
              const next = [...drafts];
              next[i] = e.target.value;
              setDrafts(next);
            }}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commit();
                (e.target as HTMLInputElement).blur();
              }
              if (e.key === 'Escape') {
                setDrafts(colorFieldValues(value, colorFormat).map((f) => f.value));
                (e.target as HTMLInputElement).blur();
              }
            }}
            style={{
              width: '100%',
              padding: '4px 6px',
              fontSize: 12,
              fontVariantNumeric: 'tabular-nums',
              textAlign: 'center',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              color: '#e5e7eb',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
            }}
          />
          <span
            style={{
              marginTop: 4,
              display: 'block',
              fontSize: 9,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: 0.6,
              textAlign: 'center',
              color: '#6b7280',
            }}
          >
            {field.label}
          </span>
        </label>
      ))}
    </div>
  );
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
  // Format is local to the picker — persists per-picker session rather
  // than across all swatches. Swap to a hoisted prop later if a 'unified
  // format' setting is wanted.
  const [colorFormat, setColorFormat] = useState<ColorFormat>('hex');
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
      const popoverHeight = popoverRef.current?.offsetHeight ?? 360;
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
            className="fixed z-[100] w-72 rounded-lg p-3 shadow-xl"
            style={{
              left: position?.left ?? -9999,
              top: position?.top ?? 8,
              visibility: position ? 'visible' : 'hidden',
              background: '#1a1a1e',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {/* Title — which color slot this picker is editing. */}
            <div
              style={{
                marginBottom: 10,
                fontSize: 11,
                fontWeight: 500,
                color: '#d1d5db',
                textTransform: 'uppercase',
                letterSpacing: 0.6,
              }}
            >
              {title}
            </div>
            <ColorArea
              aria-label="Saturation and brightness"
              colorSpace="hsb"
              xChannel="saturation"
              yChannel="brightness"
              value={pickerValue}
              onChange={commitColor}
              className="relative h-36 w-full overflow-hidden rounded-md"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <ColorThumb className="h-4 w-4 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.6)]" />
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
                <ColorThumb className="top-1/2 h-5 w-5 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)]" />
              </SliderTrack>
            </ColorSlider>
            {/* Format-aware value input(s). Channel labels under each
             *  field replace the standalone "HEX" label the realtime-
             *  states picker carries below — when the format selector
             *  is right beneath, that label is redundant. */}
            <ChannelFields value={value} colorFormat={colorFormat} onChange={onChange} />
            {/* Format selector at the bottom — pills sit above a thin
             *  divider separating them from the value field. */}
            <div
              style={{
                marginTop: 12,
                paddingTop: 10,
                borderTop: '1px solid rgba(255,255,255,0.08)',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 4,
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 6,
                padding: 4,
              }}
            >
              {COLOR_FORMATS.map((format) => (
                <button
                  key={format}
                  type="button"
                  onClick={() => setColorFormat(format)}
                  style={{
                    padding: '4px 6px',
                    fontSize: 10,
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: 0.6,
                    borderRadius: 4,
                    border: 'none',
                    cursor: 'pointer',
                    background: colorFormat === format ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: colorFormat === format ? '#fafafa' : '#9ca3af',
                  }}
                >
                  {format}
                </button>
              ))}
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
