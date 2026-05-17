import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { clamp } from "./circleWaveformCore";

export function decimalsForStep(step: number | undefined): number {
  if (step === undefined || !Number.isFinite(step) || step >= 1) return 0;
  const s = step.toString();
  const idx = s.indexOf(".");
  return idx === -1 ? 0 : s.length - idx - 1;
}

export function formatNumber(value: number, step?: number) {
  if (step !== undefined) return value.toFixed(decimalsForStep(step));
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(1)));
}

export type HsbColor = {
  hue: number;
  saturation: number;
  brightness: number;
};

export type RgbColor = {
  red: number;
  green: number;
  blue: number;
};

export type HslColor = {
  hue: number;
  saturation: number;
  lightness: number;
};

export type ColorFormat = "hex" | "rgb" | "hsl" | "hsb";

export function hexToHsb(hex: string): HsbColor {
  const safeHex = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#000000";
  const r = parseInt(safeHex.slice(1, 3), 16) / 255;
  const g = parseInt(safeHex.slice(3, 5), 16) / 255;
  const b = parseInt(safeHex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let hue = 0;
  if (delta !== 0) {
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
  }

  hue = Math.round((hue * 60 + 360) % 360);
  const saturation = max === 0 ? 0 : delta / max;
  const brightness = max;

  return {
    hue,
    saturation: saturation * 100,
    brightness: brightness * 100,
  };
}

export function hsbToHex({ hue, saturation, brightness }: HsbColor) {
  const normalizedHue = ((hue % 360) + 360) % 360;
  const s = clamp(saturation, 0, 100) / 100;
  const v = clamp(brightness, 0, 100) / 100;
  const chroma = v * s;
  const x = chroma * (1 - Math.abs(((normalizedHue / 60) % 2) - 1));
  const m = v - chroma;

  let rPrime = 0;
  let gPrime = 0;
  let bPrime = 0;

  if (normalizedHue < 60) [rPrime, gPrime, bPrime] = [chroma, x, 0];
  else if (normalizedHue < 120) [rPrime, gPrime, bPrime] = [x, chroma, 0];
  else if (normalizedHue < 180) [rPrime, gPrime, bPrime] = [0, chroma, x];
  else if (normalizedHue < 240) [rPrime, gPrime, bPrime] = [0, x, chroma];
  else if (normalizedHue < 300) [rPrime, gPrime, bPrime] = [x, 0, chroma];
  else [rPrime, gPrime, bPrime] = [chroma, 0, x];

  const toHex = (channel: number) =>
    Math.round((channel + m) * 255)
      .toString(16)
      .padStart(2, "0")
      .toUpperCase();

  return `#${toHex(rPrime)}${toHex(gPrime)}${toHex(bPrime)}`;
}

export function hexToRgb(hex: string): RgbColor {
  const safeHex = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#000000";
  return {
    red: parseInt(safeHex.slice(1, 3), 16),
    green: parseInt(safeHex.slice(3, 5), 16),
    blue: parseInt(safeHex.slice(5, 7), 16),
  };
}

export function rgbToHex({ red, green, blue }: RgbColor) {
  const toHex = (value: number) =>
    clamp(Math.round(value), 0, 255)
      .toString(16)
      .padStart(2, "0")
      .toUpperCase();

  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

export function hexToHsl(hex: string): HslColor {
  const { red, green, blue } = hexToRgb(hex);
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;

  let hue = 0;
  let saturation = 0;

  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
  }

  return {
    hue: Math.round((hue * 60 + 360) % 360),
    saturation: Math.round(saturation * 100),
    lightness: Math.round(lightness * 100),
  };
}

export function hslToHex({ hue, saturation, lightness }: HslColor) {
  const normalizedHue = ((hue % 360) + 360) % 360;
  const s = clamp(saturation, 0, 100) / 100;
  const l = clamp(lightness, 0, 100) / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const x = chroma * (1 - Math.abs(((normalizedHue / 60) % 2) - 1));
  const m = l - chroma / 2;

  let rPrime = 0;
  let gPrime = 0;
  let bPrime = 0;

  if (normalizedHue < 60) [rPrime, gPrime, bPrime] = [chroma, x, 0];
  else if (normalizedHue < 120) [rPrime, gPrime, bPrime] = [x, chroma, 0];
  else if (normalizedHue < 180) [rPrime, gPrime, bPrime] = [0, chroma, x];
  else if (normalizedHue < 240) [rPrime, gPrime, bPrime] = [0, x, chroma];
  else if (normalizedHue < 300) [rPrime, gPrime, bPrime] = [x, 0, chroma];
  else [rPrime, gPrime, bPrime] = [chroma, 0, x];

  return rgbToHex({
    red: (rPrime + m) * 255,
    green: (gPrime + m) * 255,
    blue: (bPrime + m) * 255,
  });
}

export function colorFieldValues(value: string, colorFormat: ColorFormat) {
  if (colorFormat === "hex") {
    return [{ label: "Hex", value }];
  }

  if (colorFormat === "rgb") {
    const rgb = hexToRgb(value);
    return [
      { label: "R", value: String(rgb.red) },
      { label: "G", value: String(rgb.green) },
      { label: "B", value: String(rgb.blue) },
    ];
  }

  if (colorFormat === "hsl") {
    const hsl = hexToHsl(value);
    return [
      { label: "H", value: String(hsl.hue) },
      { label: "S", value: String(hsl.saturation) },
      { label: "L", value: String(hsl.lightness) },
    ];
  }

  const hsbValue = hexToHsb(value);
  return [
    { label: "H", value: String(hsbValue.hue) },
    { label: "S", value: String(Math.round(hsbValue.saturation)) },
    { label: "B", value: String(Math.round(hsbValue.brightness)) },
  ];
}

export function colorDraftsToHex(colorFormat: ColorFormat, drafts: string[]) {
  if (colorFormat === "hex") {
    const [hex] = drafts;
    return /^#[0-9a-fA-F]{6}$/.test(hex ?? "") ? (hex ?? "").toUpperCase() : null;
  }

  const numbers = drafts.map((draft) => Number(draft));
  if (numbers.some((value) => !Number.isFinite(value))) return null;

  if (colorFormat === "rgb") {
    return rgbToHex({
      red: numbers[0],
      green: numbers[1],
      blue: numbers[2],
    });
  }

  if (colorFormat === "hsl") {
    return hslToHex({
      hue: numbers[0],
      saturation: numbers[1],
      lightness: numbers[2],
    });
  }

  return hsbToHex({
    hue: numbers[0],
    saturation: numbers[1],
    brightness: numbers[2],
  });
}

export function EditableNumber({
  value,
  min,
  max,
  step,
  unit,
  onChange,
  disabled,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState(() => formatNumber(value, step));

  useEffect(() => {
    setDraft(formatNumber(value, step));
  }, [value, step]);

  const commit = () => {
    if (disabled) return;
    const next = Number(draft);
    if (Number.isFinite(next)) {
      onChange(Math.min(max, Math.max(min, next)));
      return;
    }

    setDraft(formatNumber(value, step));
  };

  return (
    <div className="flex items-center gap-1">
      <input
        type="text"
        inputMode="decimal"
        disabled={disabled}
        value={draft}
        onChange={(event) => !disabled && setDraft(event.target.value)}
        onBlur={commit}
        onFocus={(event) => event.currentTarget.select()}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
            event.currentTarget.blur();
          }
          if (event.key === "Escape") {
            setDraft(formatNumber(value, step));
            event.currentTarget.blur();
          }
        }}
        className={`w-12 rounded border border-transparent bg-transparent px-1 py-0 text-right text-[11px] tabular-nums outline-none transition-colors ${
          disabled
            ? "cursor-not-allowed text-gray-500 opacity-70"
            : "cursor-text text-gray-300 hover:border-white/10 hover:bg-white/[0.03] focus:border-white/30 focus:bg-white/[0.03]"
        }`}
      />
      <span className="text-[10px] text-gray-500">{unit ?? ""}</span>
    </div>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  disabled,
  disabledTitle,
  hint,
  hintTitle,
  eyeTitle,
  eyeActive,
  eyeColor,
  onEyeToggle,
  onEyeHoverChange,
  eyeIcon,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
  disabled?: boolean;
  disabledTitle?: string;
  /** Inline grey suffix next to the label (e.g. "no effect"). Slider stays interactive. */
  hint?: string;
  /** Tooltip shown on hover when `hint` is set. */
  hintTitle?: string;
  /** When set, shows a clickable eye icon next to the label. Tooltip on hover. */
  eyeTitle?: string;
  /** Whether the eye is currently "open" (true) or "closed" (false). */
  eyeActive?: boolean;
  /** CSS color for the eye when active. Defaults to red. */
  eyeColor?: string;
  /** Click handler for the eye toggle. */
  onEyeToggle?: () => void;
  /** Called when the cursor enters (true) / leaves (false) the eye button. */
  onEyeHoverChange?: (hovered: boolean) => void;
  /** Render a non-interactive eye icon next to the label as a visual cue
   *  that hovering the row triggers a preview. Use this when the slider's
   *  parent already wires its own hover preview (e.g. Max Height /
   *  Min Height) and no click-to-pin is wanted. Ignored when onEyeToggle
   *  is also provided (the clickable eye takes precedence). */
  eyeIcon?: boolean;
}) {
  const showHint = !!hint && !disabled;
  const showEye = !!onEyeToggle;
  const showEyeIcon = !!eyeIcon && !showEye;
  const tooltip = disabled ? disabledTitle : showHint ? hintTitle : undefined;
  return (
    <div
      className="group space-y-0.5"
      title={tooltip}
      onMouseEnter={onEyeHoverChange ? () => onEyeHoverChange(true) : undefined}
      onMouseLeave={onEyeHoverChange ? () => onEyeHoverChange(false) : undefined}
    >
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className={`flex min-w-0 items-center gap-1 ${disabled ? "text-gray-600" : "text-gray-400"}`}>
          <span className="truncate">{label}</span>
          {showEye && (
            <button
              type="button"
              onClick={onEyeToggle}
              title={eyeTitle}
              aria-label={eyeTitle}
              aria-pressed={!!eyeActive}
              onMouseEnter={(e) => {
                if (eyeColor) e.currentTarget.style.color = eyeColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "";
              }}
              className={`inline-flex shrink-0 cursor-pointer items-center transition-colors ${
                eyeActive ? "text-gray-500" : "text-gray-700"
              }`}
            >
              {eyeActive ? (
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8s-2.5 4.5-6.5 4.5S1.5 8 1.5 8z" />
                  <circle cx="8" cy="8" r="2" />
                </svg>
              ) : (
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M2 4l12 8" />
                  <path d="M1.5 8s2.5-4.5 6.5-4.5c1 0 1.9.2 2.7.5" />
                  <path d="M14.5 8s-1 1.8-3 3.3" />
                  <path d="M8 5.5a2.5 2.5 0 0 1 2.5 2.5" />
                </svg>
              )}
            </button>
          )}
          {showEyeIcon && (
            <span
              className="inline-flex shrink-0 items-center text-gray-700 transition-colors group-hover:text-gray-300"
              style={eyeColor ? { ["--eye-hover-color" as never]: eyeColor } : undefined}
              aria-hidden="true"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8s-2.5 4.5-6.5 4.5S1.5 8 1.5 8z" />
                <circle cx="8" cy="8" r="2" />
              </svg>
            </span>
          )}
          {showHint && (
            <span className="inline-flex shrink-0 items-center rounded-sm bg-gray-600 px-0.5 text-[8px] font-semibold uppercase leading-[14px] text-gray-900 transition-colors group-hover:bg-white">
              {hint}
            </span>
          )}
        </span>
        <EditableNumber
          value={value}
          min={min}
          max={max}
          step={step}
          unit={unit}
          onChange={onChange}
          disabled={disabled}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={clamp(value, min, max)}
        disabled={disabled}
        onChange={(event) => onChange(parseFloat(event.target.value))}
        className={`h-1 w-full appearance-none rounded-full accent-white ${disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer bg-white/10"} `}
      />
    </div>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-2 text-[11px]">
      <span className="truncate text-gray-400">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-3.5 w-3.5 cursor-pointer accent-white"
      />
    </label>
  );
}

export function ControlSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="text-[9px] font-medium uppercase tracking-[0.1em] text-gray-500">
        {title}
      </div>
      {children}
    </section>
  );
}

export function ColorControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [hsb, setHsb] = useState<HsbColor>(() => hexToHsb(value));
  const [colorFormat, setColorFormat] = useState<ColorFormat>("hex");
  const [channelDrafts, setChannelDrafts] = useState<string[]>(() =>
    colorFieldValues(value, "hex").map((field) => field.value),
  );
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const validHex = /^#[0-9a-fA-F]{6}$/;

  useEffect(() => {
    setDraft(value);
    setHsb(hexToHsb(value));
  }, [value]);

  useEffect(() => {
    setChannelDrafts(colorFieldValues(value, colorFormat).map((field) => field.value));
  }, [colorFormat, value]);

  useLayoutEffect(() => {
    if (!open) return;

    const place = () => {
      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const popoverWidth = popoverRef.current?.offsetWidth ?? 288;
      const popoverHeight = popoverRef.current?.offsetHeight ?? 248;
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
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const commit = () => {
    if (validHex.test(draft)) {
      onChange(draft.toUpperCase());
      return;
    }

    setDraft(value);
  };

  const commitChannels = () => {
    const nextHex = colorDraftsToHex(colorFormat, channelDrafts);
    if (!nextHex) {
      setChannelDrafts(colorFieldValues(value, colorFormat).map((field) => field.value));
      return;
    }

    const normalized = nextHex.toUpperCase();
    setDraft(normalized);
    setHsb(hexToHsb(normalized));
    onChange(normalized);
  };

  const updateColor = (next: HsbColor) => {
    const normalized = {
      hue: clamp(next.hue, 0, 360),
      saturation: clamp(next.saturation, 0, 100),
      brightness: clamp(next.brightness, 0, 100),
    };
    const nextHex = hsbToHex(normalized);
    setHsb(normalized);
    setDraft(nextHex);
    onChange(nextHex);
  };

  const updateAreaFromPointer = (clientX: number, clientY: number) => {
    const area = areaRef.current;
    if (!area) return;
    const rect = area.getBoundingClientRect();
    const saturation = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
    const brightness = clamp(100 - ((clientY - rect.top) / rect.height) * 100, 0, 100);
    updateColor({ ...hsb, saturation, brightness });
  };

  const handleAreaPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    updateAreaFromPointer(event.clientX, event.clientY);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleAreaPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    updateAreaFromPointer(event.clientX, event.clientY);
  };

  const popover =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={popoverRef}
            onMouseDown={(event) => event.stopPropagation()}
            className="fixed z-[100] w-72 rounded-lg border border-white/10 bg-[#1a1a1e] p-3 shadow-xl"
            style={{
              left: position?.left ?? -9999,
              top: position?.top ?? 8,
              visibility: position ? "visible" : "hidden",
            }}
          >
            <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-gray-300">
              {label}
            </div>
            <div
              ref={areaRef}
              onPointerDown={handleAreaPointerDown}
              onPointerMove={handleAreaPointerMove}
              className="relative h-36 w-full cursor-crosshair rounded-md border border-white/10"
              style={{
                backgroundColor: hsbToHex({ hue: hsb.hue, saturation: 100, brightness: 100 }),
                backgroundImage:
                  "linear-gradient(to top, #000 0%, transparent 100%), linear-gradient(to right, #fff 0%, transparent 100%)",
              }}
            >
              <span
                className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.6)]"
                style={{
                  left: `${hsb.saturation}%`,
                  top: `${100 - hsb.brightness}%`,
                }}
              />
            </div>
            <div className="mt-3 space-y-2">
              <div className="relative">
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={1}
                  value={hsb.hue}
                  onChange={(event) =>
                    updateColor({ ...hsb, hue: parseFloat(event.target.value) })
                  }
                  className="h-3 w-full cursor-pointer appearance-none rounded-full bg-transparent"
                  style={{
                    background:
                      "linear-gradient(90deg, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)",
                  }}
                />
                <span
                  className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.6)]"
                  style={{ left: `${(hsb.hue / 360) * 100}%` }}
                />
              </div>
              <div
                className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.03] px-2 py-1.5"
              >
                <span className="text-[10px] uppercase tracking-[0.06em] text-gray-500">Preview</span>
                <span
                  className="h-5 w-10 rounded-md border border-white/10"
                  style={{ backgroundColor: hsbToHex(hsb) }}
                />
              </div>
            </div>
            <div
              className="mt-3 grid gap-2"
              style={{
                gridTemplateColumns:
                  colorFormat === "hex" ? "1fr" : "repeat(3, minmax(0, 1fr))",
              }}
            >
              {colorFieldValues(value, colorFormat).map((field, index) => (
                <label key={`${colorFormat}-${field.label}`} className="block">
                  <input
                    type="text"
                    value={channelDrafts[index] ?? ""}
                    onChange={(event) => {
                      const next = [...channelDrafts];
                      next[index] = event.target.value;
                      setChannelDrafts(next);
                      if (colorFormat === "hex") setDraft(event.target.value);
                    }}
                    onBlur={colorFormat === "hex" ? commit : commitChannels}
                    onFocus={(event) => event.currentTarget.select()}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        if (colorFormat === "hex") commit();
                        else commitChannels();
                        event.currentTarget.blur();
                      }
                      if (event.key === "Escape") {
                        setChannelDrafts(
                          colorFieldValues(value, colorFormat).map((channel) => channel.value),
                        );
                        if (colorFormat === "hex") setDraft(value);
                        event.currentTarget.blur();
                      }
                    }}
                    className="w-full rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-center font-mono text-xs uppercase text-gray-200 outline-none transition-colors focus:border-white/30"
                    maxLength={colorFormat === "hex" ? 7 : undefined}
                  />
                  <span className="mt-1 block text-center text-[9px] font-medium uppercase tracking-[0.08em] text-gray-500">
                    {field.label}
                  </span>
                </label>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-4 gap-1 rounded-md border border-white/10 bg-white/[0.03] p-1">
              {(["hex", "rgb", "hsl", "hsb"] as ColorFormat[]).map((format) => (
                <button
                  key={format}
                  type="button"
                  onClick={() => setColorFormat(format)}
                  className={`rounded px-2 py-1 text-[10px] font-medium uppercase tracking-[0.08em] transition-colors ${
                    colorFormat === format
                      ? "bg-white/10 text-white"
                      : "text-gray-500 hover:bg-white/[0.04] hover:text-gray-300"
                  }`}
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
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="relative h-6 w-6 overflow-hidden rounded-full border border-white/15 bg-transparent"
          title={`Edit ${label}`}
        >
          <span className="absolute inset-0" style={{ backgroundColor: value }} />
        </button>
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onFocus={(event) => event.currentTarget.select()}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit();
              event.currentTarget.blur();
            }
            if (event.key === "Escape") {
              setDraft(value);
              event.currentTarget.blur();
            }
          }}
          className="w-20 rounded-md border border-white/10 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[11px] uppercase text-gray-300 outline-none transition-colors focus:border-white/30"
          maxLength={7}
        />
      </div>
      {popover}
    </div>
  );
}
