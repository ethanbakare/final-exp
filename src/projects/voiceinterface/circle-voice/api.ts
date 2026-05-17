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
// CIRCLE_FALLBACK is the shipped seed bundle itself (single source of truth
// shared with the on-disk file the API serves) — it carries pinned:true and
// passes the extended integrity gate (it IS the canonical valid bundle).

import seedVoicesets from "../../../../circle-waveform-voicesets.json";
import { type CircleVoiceProfile, VOICE_VARIANT } from "./circleVoice";

const API = `/api/studio-profiles?variant=${VOICE_VARIANT}`;

/** The shipped "Default Voice" bundle — doubles as the in-code fallback
 *  (plan §4-R2). Build-time snapshot of the pristine default: runtime edits
 *  go to disk via the API and never mutate this import, so it stays a
 *  trustworthy fallback. */
export const CIRCLE_FALLBACK: CircleVoiceProfile =
  (seedVoicesets as unknown as CircleVoiceProfile[])[0];

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
