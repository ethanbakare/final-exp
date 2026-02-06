/** Reusable slider row (extracted from StudioScene) */
import React, { useState, useRef } from "react";
import { Slider } from "@/components/ui/slider";

export interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  disabled?: boolean;
  onChange: (v: number) => void;
}

const SliderRow: React.FC<SliderRowProps> = ({
  label, value, min, max, step, unit = "", disabled, onChange,
}) => {
  const decimals = step < 0.1 ? 3 : step < 1 ? 2 : 1;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = () => {
    setEditing(false);
    const n = parseFloat(draft);
    if (isNaN(n)) return;
    onChange(Math.round(Math.min(max, Math.max(min, n)) / step) * step);
  };

  return (
    <div className={`space-y-1.5 ${disabled ? "opacity-40 pointer-events-none" : ""}`}>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setEditing(false);
            }}
            className="w-20 text-right text-gray-600 tabular-nums bg-gray-100 rounded px-1 outline-none text-sm"
            autoFocus
          />
        ) : (
          <span
            className="text-gray-400 tabular-nums cursor-pointer hover:text-gray-600 transition-colors"
            onClick={() => {
              if (!disabled) {
                setDraft(value.toFixed(decimals));
                setEditing(true);
              }
            }}
          >
            {value.toFixed(decimals)}{unit}
          </span>
        )}
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  );
};

export default SliderRow;
