// CSW-010 Final-EXP port v1 — circle-voice network layer.
//
// Mirrors radial-states/api.ts: whole-array fetch/persist over the SAME
// studio-profiles variant file the standalone page and the realtime-states
// arm both share (`circle-waveform-voicesets.json`, variant
// `circle-waveform-voiceset`). cache:'no-store' on every GET (stale-schema
// bug 19dc15a — handoff §5).
//
// R2 (load path): load the voiceset → bundles present? use them verbatim
// (the page integrity-gates them and surfaces any R7 error — never silently
// repairs) → none / unreadable? fall back to the shipped CIRCLE_FALLBACK
// default. NEVER fetch loose `circle-waveform` profiles (the otherexp
// loose-seeder is intentionally absent — see circleVoice.ts header).
//
// R3: whole-array only. No single-bundle writer.
//
// CIRCLE_FALLBACK is a SELF-CONTAINED code constant (./circleFallback) —
// it MUST NOT be a JSON import of circle-waveform-voicesets.json. That
// data file is rewritten at runtime by every Save/Update/delete; a
// static import of it would put the live file in the webpack module
// graph, so each write triggers a Next dev Fast Refresh that remounts
// RealtimeStatesEditor, firing its audioService.stop() cleanup and
// killing the mic mid-session (the circle-only "audio stops on Save"
// bug — root-caused via the Fast-Refresh stack in AUDIO-BUG-REPORT.md).

import { type CircleVoiceProfile, VOICE_VARIANT } from "./circleVoice";
import { CIRCLE_FALLBACK } from "./circleFallback";

const API = `/api/studio-profiles?variant=${VOICE_VARIANT}`;

// Re-export so existing consumers (`./api`) keep their import path.
export { CIRCLE_FALLBACK };

/** Whole-array GET. Returns the parsed bundle list, or null when the file is
 *  unreadable / not an array (caller decides fallback vs error). */
export async function fetchCircleProfiles(): Promise<
  CircleVoiceProfile[] | null
> {
  try {
    const r = await fetch(API, { cache: "no-store" });
    if (!r.ok) return null;
    const j = await r.json();
    return Array.isArray(j) ? (j as CircleVoiceProfile[]) : null;
  } catch {
    return null;
  }
}

/** Persist the WHOLE bundle list (Save-as / Update / rename / delete). */
export async function persistCircleProfiles(
  list: CircleVoiceProfile[],
): Promise<void> {
  const r = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(list),
  });
  if (!r.ok) throw new Error(`Save failed: ${r.status}`);
}

/** R2 Final-EXP load path. Bundles present ⇒ return them verbatim (the page
 *  integrity-gates and surfaces any R7 error — a broken-but-present bundle is
 *  NOT silently swapped for the fallback). Empty / unreadable ⇒ the shipped
 *  CIRCLE_FALLBACK. Never fetches loose profiles. */
export async function loadCircleProfiles(): Promise<CircleVoiceProfile[]> {
  const list = await fetchCircleProfiles();
  if (list && list.length > 0) return list;
  return [CIRCLE_FALLBACK];
}
