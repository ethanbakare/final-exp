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


[PROBE] bars=11 ry=23.61 variance=0.00  FROZEN
VM12649:18 [PROBE] bars=11 ry=26.31 variance=1.82  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=11 ry=26.34 variance=1.64  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=11 ry=23.67 variance=1.80  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=11 ry=21.07 variance=3.89  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=19.98 variance=5.72  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=19.77 variance=6.60  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=19.77 variance=6.89  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=19.94 variance=7.40  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=20.93 variance=4.91  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=23.45 variance=2.28  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=11 ry=26.21 variance=4.63  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=26.43 variance=7.34  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=23.84 variance=6.96  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=21.17 variance=6.21  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=20.00 variance=6.05  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=19.78 variance=6.17  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=19.77 variance=6.83  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=19.92 variance=7.43  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=20.85 variance=5.12  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=23.28 variance=2.31  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=11 ry=26.11 variance=4.44  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=26.51 variance=7.30  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=24.01 variance=7.02  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=21.28 variance=6.24  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=20.03 variance=6.05  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=19.78 variance=6.15  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=19.77 variance=6.79  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=19.90 variance=7.46  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=20.76 variance=5.33  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=23.12 variance=2.35  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=11 ry=26.00 variance=4.23  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=26.57 variance=7.23  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=24.16 variance=7.07  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=21.39 variance=6.26  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=20.06 variance=6.05  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=19.78 variance=6.14  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=19.77 variance=6.73  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=19.88 variance=7.46  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=20.68 variance=5.51  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=22.95 variance=2.39  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=11 ry=25.88 variance=4.03  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=26.63 variance=7.15  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=24.33 variance=7.12  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=21.50 variance=6.28  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=20.10 variance=6.05  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=19.79 variance=6.12  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=19.77 variance=6.68  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=19.87 variance=7.46  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=20.61 variance=5.70  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=22.80 variance=2.46  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=11 ry=25.75 variance=3.84  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=26.67 variance=7.06  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=24.49 variance=7.17  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=55.28 variance=121.17  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=75.49 variance=361.39  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=85.52 variance=603.00  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=87.28 variance=731.31  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=83.80 variance=717.23  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=81.14 variance=605.73  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=80.49 variance=407.37  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=81.94 variance=90.54  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=82.48 variance=11.06  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=81.47 variance=4.85  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=80.04 variance=4.70  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=79.31 variance=1.79  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=11 ry=79.24 variance=1.25  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=11 ry=79.34 variance=1.44  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=11 ry=79.29 variance=1.61  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=11 ry=79.42 variance=1.33  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=11 ry=80.41 variance=0.55  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=11 ry=81.88 variance=0.74  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=11 ry=82.50 variance=1.50  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=11 ry=81.55 variance=1.57  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=11 ry=81.81 variance=1.51  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=11 ry=80.46 variance=1.24  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=11 ry=79.85 variance=1.05  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=11 ry=79.64 variance=0.97  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=11 ry=80.93 variance=0.92  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=11 ry=82.76 variance=1.18  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=11 ry=100.57 variance=42.81  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=110.42 variance=120.28  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=107.45 variance=158.56  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=103.39 variance=159.91  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=104.42 variance=144.39  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=104.83 variance=109.53  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=104.42 variance=61.76  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=100.39 variance=9.68  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=92.94 variance=23.52  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=95.77 variance=21.76  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=101.57 variance=17.10  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=92.02 variance=24.35  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=95.28 variance=22.34  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=106.86 variance=26.06  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=111.43 variance=41.53  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=107.89 variance=49.28  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=98.65 variance=42.10  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=93.90 variance=45.01  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=89.22 variance=59.79  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=86.37 variance=73.73  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=83.74 variance=98.15  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=88.36 variance=91.17  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=95.26 variance=53.12  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=97.09 variance=25.48  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=97.35 variance=23.36  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=101.03 variance=33.36  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=92.95 variance=32.00  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=97.42 variance=27.67  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=89.39 variance=16.47  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=82.87 variance=28.67  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=80.47 variance=48.57  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=91.10 variance=45.35  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=86.36 variance=42.70  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=98.28 variance=36.06  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=101.69 variance=51.18  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=102.87 variance=63.24  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=105.12 variance=81.51  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=104.68 variance=75.08  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=96.30 variance=39.75  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=97.22 variance=32.83  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=100.64 variance=9.78  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=100.13 variance=8.96  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=90.86 variance=20.15  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=85.61 variance=39.18  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=91.57 variance=33.69  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=89.86 variance=25.08  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=85.26 variance=32.12  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=81.37 variance=41.47  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=79.97 variance=36.64  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=92.27 variance=19.71  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=99.71 variance=36.60  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=101.76 variance=54.65  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=103.23 variance=73.46  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=101.47 variance=82.92  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=92.24 variance=74.52  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=96.62 variance=51.79  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=101.60 variance=16.78  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=101.34 variance=11.40  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=101.64 variance=11.79  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=99.62 variance=11.34  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=90.47 variance=17.95  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=92.38 variance=19.39  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=99.47 variance=16.53  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=104.08 variance=20.24  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=104.03 variance=22.57  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=106.01 variance=27.54  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=110.36 variance=40.06  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=107.97 variance=45.22  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=91.71 variance=41.86  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=83.91 variance=70.08  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=84.53 variance=100.01  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=102.00 variance=97.88  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=105.03 variance=99.29  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=111.38 variance=111.95  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=108.41 variance=107.11  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=105.30 variance=102.15  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=102.27 variance=95.01  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=100.26 variance=57.04  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=93.79 variance=25.03  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=96.78 variance=30.04  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=92.85 variance=39.79  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=97.50 variance=26.15  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=95.07 variance=16.39  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=86.26 variance=21.20  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=82.59 variance=30.74  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=98.52 variance=27.97  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=98.12 variance=30.97  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=87.86 variance=32.27  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=105.58 variance=51.60  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=111.24 variance=84.48  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=110.88 variance=109.50  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=107.81 variance=99.03  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=104.84 variance=54.51  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=89.49 variance=73.79  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=83.15 variance=112.73  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=96.25 variance=94.75  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=101.81 variance=92.14  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=109.04 variance=86.85  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=108.86 variance=82.03  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=104.49 variance=76.88  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=104.63 variance=76.61  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=101.05 variance=61.67  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=105.28 variance=15.60  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=105.53 variance=7.21  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=97.42 variance=12.91  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=96.00 variance=16.83  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=93.84 variance=19.15  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=89.67 variance=30.36  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=99.17 variance=26.18  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=96.25 variance=25.63  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=87.42 variance=27.54  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=82.52 variance=28.68  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=96.57 variance=27.77  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=103.97 variance=41.33  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=100.95 variance=47.16  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=93.79 variance=43.97  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=87.84 variance=46.44  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=97.74 variance=47.64  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=93.03 variance=42.07  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=96.10 variance=21.41  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=95.08 variance=21.53  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=98.37 variance=13.89  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=103.59 variance=18.33  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=107.74 variance=32.99  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=104.90 variance=23.89  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=107.50 variance=29.84  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=104.25 variance=21.84  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=98.16 variance=19.17  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=100.95 variance=12.13  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=92.16 variance=23.81  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=87.49 variance=47.39  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=91.26 variance=46.84  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=86.03 variance=54.80  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=106.46 variance=51.94  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=117.61 variance=99.50  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=120.19 variance=156.13  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=111.59 variance=170.32  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=111.72 variance=166.02  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=111.99 variance=130.29  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=112.99 variance=95.86  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=112.03 variance=15.15  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=102.81 variance=22.65  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=106.58 variance=22.19  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=109.85 variance=10.74  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=99.91 variance=20.86  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=86.88 variance=68.25  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=82.01 variance=117.03  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=81.69 variance=135.30  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=92.31 variance=107.28  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=90.05 variance=101.00  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=89.89 variance=77.55  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=91.43 variance=30.49  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=103.10 variance=40.08  AUDIO-REACTING
hot-reloader-pages.js:207 [Fast Refresh] rebuilding
VM12649:18 [PROBE] bars=11 ry=82.44 variance=45.32  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=95.08 variance=40.79  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=101.33 variance=38.51  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=105.52 variance=54.65  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=110.58 variance=76.07  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=101.14 variance=68.73  AUDIO-REACTING
VM12646:6 [PROBE] mic track.stop() CALLED
VM12646:4 [PROBE] AudioContext.close() CALLED Error
    at AC.close (<anonymous>:4:122)
    at AudioService.stop (webpack-internal:///(pages-dir-browser)/./src/projects/blob-orb/services/audioService.ts:120:26)
    at RealtimeStatesEditor.useEffect (webpack-internal:///(pages-dir-browser)/./src/projects/voiceinterface/realtime-states/index.tsx:554:138)
    at safelyCallDestroy (webpack-internal:///(pages-dir-browser)/./node_modules/react-dom/cjs/react-dom.development.js:22966:5)
    at commitHookEffectListUnmount (webpack-internal:///(pages-dir-browser)/./node_modules/react-dom/cjs/react-dom.development.js:23134:11)
    at commitPassiveUnmountOnFiber (webpack-internal:///(pages-dir-browser)/./node_modules/react-dom/cjs/react-dom.development.js:25065:11)
    at commitPassiveUnmountEffects_complete (webpack-internal:///(pages-dir-browser)/./node_modules/react-dom/cjs/react-dom.development.js:25041:7)
    at commitPassiveUnmountEffects_begin (webpack-internal:///(pages-dir-browser)/./node_modules/react-dom/cjs/react-dom.development.js:25030:7)
    at commitPassiveUnmountEffects (webpack-internal:///(pages-dir-browser)/./node_modules/react-dom/cjs/react-dom.development.js:24975:3)
    at flushPassiveEffectsImpl (webpack-internal:///(pages-dir-browser)/./node_modules/react-dom/cjs/react-dom.development.js:27072:3)
    at flushPassiveEffects (webpack-internal:///(pages-dir-browser)/./node_modules/react-dom/cjs/react-dom.development.js:27018:14)
    at commitRootImpl (webpack-internal:///(pages-dir-browser)/./node_modules/react-dom/cjs/react-dom.development.js:26969:5)
    at commitRoot (webpack-internal:///(pages-dir-browser)/./node_modules/react-dom/cjs/react-dom.development.js:26716:5)
    at performSyncWorkOnRoot (webpack-internal:///(pages-dir-browser)/./node_modules/react-dom/cjs/react-dom.development.js:26151:3)
    at flushSyncCallbacks (webpack-internal:///(pages-dir-browser)/./node_modules/react-dom/cjs/react-dom.development.js:12042:22)
    at flushSync (webpack-internal:///(pages-dir-browser)/./node_modules/react-dom/cjs/react-dom.development.js:26235:7)
    at Object.scheduleRefresh (webpack-internal:///(pages-dir-browser)/./node_modules/react-dom/cjs/react-dom.development.js:27829:5)
    at eval (webpack-internal:///(pages-dir-browser)/./node_modules/next/dist/compiled/react-refresh/cjs/react-refresh-runtime.development.js:265:17)
    at Set.forEach (<anonymous>)
    at Object.performReactRefresh (webpack-internal:///(pages-dir-browser)/./node_modules/next/dist/compiled/react-refresh/cjs/react-refresh-runtime.development.js:254:26)
    at applyUpdate (webpack-internal:///(pages-dir-browser)/./node_modules/next/dist/compiled/@next/react-refresh-utils/dist/internal/helpers.js:139:31)
    at statusHandler (webpack-internal:///(pages-dir-browser)/./node_modules/next/dist/compiled/@next/react-refresh-utils/dist/internal/helpers.js:156:13)
    at setStatus (http://localhost:3000/_next/static/chunks/webpack.js:486:55)
    at http://localhost:3000/_next/static/chunks/webpack.js:655:21
report-hmr-latency.js:14 [Fast Refresh] done in 1485ms
VM12649:18 [PROBE] bars=11 ry=89.27 variance=73.25  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=82.76 variance=95.43  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=80.55 variance=102.26  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=82.00 variance=123.26  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=82.47 variance=128.28  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=81.41 variance=109.07  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=79.99 variance=44.64  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=79.25 variance=8.41  AUDIO-REACTING
VM12649:18 [PROBE] bars=11 ry=79.08 variance=1.79  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.07 variance=1.60  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.11 variance=1.80  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.44 variance=1.43  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=80.47 variance=0.62  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=81.93 variance=0.87  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=82.48 variance=1.68  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=81.49 variance=1.75  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=80.05 variance=1.53  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.28 variance=1.46  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.08 variance=1.47  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.07 variance=1.59  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.10 variance=1.80  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.41 variance=1.47  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=80.39 variance=0.65  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=81.86 variance=0.83  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=82.50 variance=1.65  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=81.56 variance=1.76  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=80.12 variance=1.54  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.30 variance=1.46  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.09 variance=1.47  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.07 variance=1.58  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.10 variance=1.79  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.38 variance=1.51  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=80.33 variance=0.68  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=81.79 variance=0.79  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=82.51 variance=1.62  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=81.64 variance=1.77  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=80.18 variance=1.55  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.32 variance=1.47  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.09 variance=1.47  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.07 variance=1.57  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.09 variance=1.79  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.35 variance=1.55  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=80.25 variance=0.71  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=81.72 variance=0.75  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=82.51 variance=1.59  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=81.72 variance=1.78  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=80.25 variance=1.56  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.35 variance=1.47  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.09 variance=1.47  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.07 variance=1.56  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.09 variance=1.78  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.32 variance=1.58  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=80.19 variance=0.75  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=81.65 variance=0.71  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=82.51 variance=1.55  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=81.79 variance=1.79  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=80.32 variance=1.57  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.38 variance=1.47  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.10 variance=1.47  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.07 variance=1.55  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.09 variance=1.77  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.30 variance=1.62  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=80.12 variance=0.79  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=81.57 variance=0.68  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=82.50 variance=1.51  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=81.86 variance=1.79  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=80.39 variance=1.58  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.41 variance=1.47  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.10 variance=1.46  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.07 variance=1.54  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.08 variance=1.76  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.28 variance=1.65  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=80.06 variance=0.83  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=81.49 variance=0.65  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=82.48 variance=1.47  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=81.93 variance=1.80  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=80.47 variance=1.59  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.44 variance=1.47  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.11 variance=1.46  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.07 variance=1.53  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.08 variance=1.75  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.25 variance=1.68  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=80.00 variance=0.87  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=81.41 variance=0.63  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=82.47 variance=1.43  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=82.00 variance=1.80  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=80.54 variance=1.60  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.47 variance=1.48  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.12 variance=1.46  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.07 variance=1.53  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.08 variance=1.74  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.24 variance=1.70  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.94 variance=0.92  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=81.33 variance=0.60  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=82.45 variance=1.39  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=82.06 variance=1.80  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=80.62 variance=1.61  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.51 variance=1.48  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.12 variance=1.46  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.07 variance=1.52  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.08 variance=1.72  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.22 variance=1.72  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.88 variance=0.96  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=81.25 variance=0.58  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=82.42 variance=1.34  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=82.12 variance=1.80  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=80.70 variance=1.62  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.55 variance=1.48  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.13 variance=1.46  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.07 variance=1.51  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.07 variance=1.71  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.20 variance=1.74  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.82 variance=1.01  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=81.17 variance=0.57  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=82.39 variance=1.30  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=82.18 variance=1.80  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=80.78 variance=1.64  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.59 variance=1.49  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.14 variance=1.46  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.07 variance=1.51  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.07 variance=1.70  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.19 variance=1.76  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.77 variance=1.06  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=81.09 variance=0.56  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=82.35 variance=1.25  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=82.22 variance=1.80  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=18 ry=32.10 variance=256.68  AUDIO-REACTING
VM12649:18 [PROBE] bars=9 ry=79.63 variance=257.38  AUDIO-REACTING
VM12649:18 [PROBE] bars=9 ry=79.15 variance=257.47  AUDIO-REACTING
VM12649:18 [PROBE] bars=9 ry=79.07 variance=257.33  AUDIO-REACTING
VM12649:18 [PROBE] bars=9 ry=79.07 variance=256.45  AUDIO-REACTING
VM12649:18 [PROBE] bars=9 ry=79.17 variance=253.62  AUDIO-REACTING
VM12649:18 [PROBE] bars=9 ry=79.69 variance=248.90  AUDIO-REACTING
VM12649:18 [PROBE] bars=9 ry=81.01 variance=246.49  AUDIO-REACTING
VM12649:18 [PROBE] bars=9 ry=82.31 variance=1.20  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=82.27 variance=1.79  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=80.94 variance=1.67  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.68 variance=1.50  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.16 variance=1.47  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.07 variance=1.50  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.07 variance=1.67  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.16 variance=1.78  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.67 variance=1.16  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=80.93 variance=0.55  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=82.27 variance=1.15  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=82.32 variance=1.78  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=81.02 variance=1.67  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.73 variance=1.50  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.18 variance=1.46  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.07 variance=1.49  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.07 variance=1.66  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.15 variance=1.79  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.63 variance=1.21  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=80.84 variance=0.55  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=82.22 variance=1.10  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=82.36 variance=1.77  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=81.10 variance=1.69  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.78 variance=1.50  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.19 variance=1.46  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.07 variance=1.49  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.07 variance=1.65  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.14 variance=1.80  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.59 variance=1.26  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=80.77 variance=0.56  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=82.16 variance=1.05  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=82.39 variance=1.76  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=81.18 variance=1.70  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.83 variance=1.51  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.21 variance=1.46  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.08 variance=1.48  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.07 variance=1.63  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.13 variance=1.80  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.54 variance=1.30  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=80.69 variance=0.57  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=82.11 variance=1.00  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=82.42 variance=1.74  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=81.26 variance=1.71  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.89 variance=1.51  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.22 variance=1.46  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.08 variance=1.48  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.07 variance=1.62  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.12 variance=1.80  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.50 variance=1.35  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=80.61 variance=0.59  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=82.05 variance=0.96  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=82.45 variance=1.72  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=81.34 variance=1.73  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.94 variance=1.52  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.24 variance=1.46  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.08 variance=1.48  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.07 variance=1.61  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.12 variance=1.80  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.47 variance=1.39  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=80.53 variance=0.60  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=81.98 variance=0.91  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=82.47 variance=1.69  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=81.43 variance=1.74  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=80.00 variance=1.53  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.26 variance=1.46  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.08 variance=1.47  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.07 variance=1.60  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.11 variance=1.80  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.44 variance=1.44  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=80.45 variance=0.63  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=81.92 variance=0.86  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=82.49 variance=1.67  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=81.50 variance=1.75  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=80.07 variance=1.53  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.28 variance=1.46  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.08 variance=1.47  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.07 variance=1.59  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.10 variance=1.80  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.40 variance=1.48  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=80.38 variance=0.65  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=81.85 variance=0.82  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=82.50 variance=1.64  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=81.58 variance=1.76  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=80.13 variance=1.54  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.30 variance=1.47  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.09 variance=1.47  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.07 variance=1.58  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.10 variance=1.79  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.37 variance=1.52  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=80.31 variance=0.69  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=81.78 variance=0.78  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=82.51 variance=1.61  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=81.66 variance=1.77  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=80.20 variance=1.55  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.33 variance=1.47  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.09 variance=1.47  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.07 variance=1.57  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.09 variance=1.78  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.35 variance=1.56  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=80.24 variance=0.72  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=81.71 variance=0.74  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=82.51 variance=1.58  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=81.73 variance=1.78  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=80.26 variance=1.56  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.35 variance=1.47  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.09 variance=1.47  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.07 variance=1.56  ambient-only (NO audio response)
VM12649:18 [PROBE] bars=9 ry=79.09 variance=1.78  ambient-only (NO audio response)
