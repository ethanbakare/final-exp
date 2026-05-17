# Circle Voice — audio-stops-on-SAVE bug report

> Paste your console `[PROBE]` output and any notes into the blank
> sections below, then share this file back. Everything above the
> sections is context I already have — don't edit it.

---

## Confirmed trigger (updated by user)

- It is **SAVE-AS (creating a new profile)** that severs the audio —
  **not** Update. The user: mic on → talking → bars reacting → pressed
  **Save** to create a new profile → audio stopped responding
  immediately (never even reached an Update).
- Only **Circle Voice** in `/voiceinterface/realtime-states`.
- **Coral** (new profile "Cascade") and **Radial** (new profile
  "Thorn") do **not** exhibit this on save.
- After it breaks: orb keeps doing the ambient-wave pulse; mic UI still
  shows "on"; no response to voice.

## Leading hypothesis (to be confirmed by the PROBE data below)

On Save-As, `activeOrbKey` switches to the new profile's id. In
`CircleRealtimeBlob` the inner engine is `<CircleRealtimeInner
key={profile.id}>` → a new id **remounts** it (its RAF + audio refs are
torn down and rebuilt). Coral's orb is keyed by a replay counter (not
the profile id) and Radial's has no key → neither remounts on save.
So Save-As uniquely remounts circle's audio engine. The PROBE output
will confirm whether, after that remount, the audio frame is severed
(`ambient-only`), the loop dies (`FROZEN`), or the mic/context is torn
down (red `CALLED` line).

## Environment

- Browser: Brave (Chromium-based)
- Dev server: http://localhost:3000  (`/voiceinterface/realtime-states`)
- Branch: csw-010-circle-voice-port

---

# >>> PASTE YOUR FINDINGS BELOW <<<

## 1. Exact steps you did (in order)

<!-- e.g. "Selected Cypress; pressed mic; talked ~3s, bars reacted;
clicked Save; typed name 'Foo'; pressed Enter/✓; kept talking" -->

```
(your steps here)
```

## 2. `[PROBE]` console lines — BEFORE you pressed Save

<!-- a few lines; should say AUDIO-REACTING with high variance -->

```
(paste here)
```

## 3. `[PROBE]` console lines — the moment of / right AFTER Save

<!-- the lines around when audio died; note the label:
AUDIO-REACTING / ambient-only (NO audio response) / FROZEN -->

```
(paste here)
```

## 4. Any RED bold `[PROBE] … CALLED` lines (mic/context teardown)

<!-- if present, paste the WHOLE thing including the stack trace -->

```
(paste here, or write "none")
```

## 5. Any other console errors / warnings (red/yellow), if any

```
(paste here, or write "none")
```

## 6. Anything else you noticed

```
(notes here)
```
