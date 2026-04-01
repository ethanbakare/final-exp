/** Reusable color picker row (extracted from StudioScene) */
import React, { useState } from "react";

export interface ColorRowProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

const ColorRow: React.FC<ColorRowProps> = ({ label, value, onChange }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const commit = () => {
    setEditing(false);
    let hex = draft.trim();
    if (!hex) return;
    if (!hex.startsWith("#")) hex = "#" + hex;
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      onChange(hex.toLowerCase());
    } else if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
      const r = hex[1], g = hex[2], b = hex[3];
      onChange(`#${r}${r}${g}${g}${b}${b}`.toLowerCase());
    }
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        {editing ? (
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setEditing(false);
            }}
            className="w-20 text-right text-xs text-gray-600 tabular-nums bg-gray-100 rounded px-1 outline-none"
            autoFocus
          />
        ) : (
          <span
            className="text-xs text-gray-400 tabular-nums cursor-pointer hover:text-gray-600 transition-colors"
            onClick={() => { setDraft(value); setEditing(true); }}
          >
            {value}
          </span>
        )}
        <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-md border border-gray-200 shadow-sm">
          <div className="absolute inset-0" style={{ backgroundColor: value }} />
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

export default ColorRow;
