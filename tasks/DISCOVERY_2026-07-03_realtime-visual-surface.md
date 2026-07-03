---
kind: discovery
title: Realtime voice interface — visual-surface discovery
created: 2026-07-03T12:45+01:00
scope: Every file that renders on /voiceinterface/realtime + verified live measurements + sibling stylization survey
purpose: Anchor for Feature-PIS elicitation. Without this, any plan/implementation for the connect-window fix (or any wider visualization work) misses visual composition surfaces and creates counter-friction.
verification_method: End-to-end reads (no grep-only), live Playwright screenshots on prod, computed-style dumps from real browser
prior_head: 8107fbd
---

## §1. Composition tree at HEAD 8107fbd

Every file that produces pixels on `/voiceinterface/realtime`, top-down:

```
src/pages/voiceinterface/realtime.tsx        (page shell, 45 lines)
  → renders <VoiceRealtimeOpenAI />
     src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx  (container, 1041 lines)
       DOM tree at render:
         .voice-realtime-container
           .voice-realtime-card                    ← 901×566, #F7F6F4, radius 16, shadow soft
             .orb-label-group
               .orb-container                      ← 328×328 sized
                 <RealtimeBlob>                     ← shader dispatcher
                   ├ shader='coral' → <CoralRealtimeBlob>   (r3f Canvas + CoralStoneMorph)
                   ├ shader='tube'  → <NebularrBlob>        (r3f Canvas + GentleOrbThicken)
                   ├ shader='radial'→ <RadialRealtimeBlob>
                   └ shader='circle'→ <CircleRealtimeBlob>
               .state-label-container
                 <VoiceStateLabel state={appState} />  (52 lines, opacity-fade on state change)
             .button-container                     ← 44px tall
               <MorphingRecordWideSimple           ← from voicemorphingbuttons.tsx:2380
                 state={isConversationActive ? 'recording' : 'idle'}
                 onRecordClick={handleStartConversation}
                 onStopClick={handleStopConversation}
               />
             {error && <div .error-message>}      ← red pill, only when error !== ''
           .profile-strip                          ← BELOW the card, thumbnails
             {orbs.filter(pinned).map(thumb → <button.profile-thumb><img/></button>)}
```

**Page shell CSS** (`realtime.tsx:19-42`):
- Body background: `#ffffff` (page bg is white)
- Font family: `'Open Runde', 'Inter', sans-serif`
- Layout: `flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px`
- Mobile: `padding: 10px`

**Card CSS** (`VoiceRealtimeOpenAI.tsx:953-969`):
- Size: `max-width: 901px`, `min-height: 566px`, `padding: 60px 20px 30px`
- Background: `var(--VoiceBoxBg, #F7F6F4)`
- Border: `1px solid var(--VoiceBoxOutline, #F2F2F2)`
- Shadow: `0px 4px 12px var(--VoiceBoxShadow, rgba(0,0,0,0.06))`
- Radius: `16px`
- Layout: flex column, `align-items: center`, `justify-content: space-between`, `gap: 20px`

## §2. Component contracts

### VoiceStateLabel (`ui/VoiceStateLabel.tsx`, 52 lines)

Type contract:
```ts
export type VoiceStateLabelState = 'idle' | 'listening' | 'ai_thinking' | 'ai_speaking';
```

String map:
```ts
{ idle: 'Ready when you are',
  listening: 'Listening...',
  ai_thinking: 'Thinking...',
  ai_speaking: 'Speaking...' }
```

Visual:
- Font `Open Runde` 16/500, letter-spacing default, line-height default, `color: rgba(38,36,36,0.3)` (soft grey)
- Fade-in animation `150ms ease-out` on every state change (triggered by `key={state}` remount)

Consumers: only `VoiceRealtimeOpenAI.tsx:825`.

### MorphingRecordWideSimple (`ui/voicemorphingbuttons.tsx:2380-2532`)

Type contract:
```ts
export type RecordWideSimpleState = 'idle' | 'recording';
interface Props {
  state: RecordWideSimpleState;
  onRecordClick?: () => void;
  onStopClick?: () => void;
  className?: string;
  disabled?: boolean;
}
```

Visual (verified from live computed styles):
- Size: **76×44px**
- Background: `var(--VoiceDarkGrey_95)` = `rgba(38,36,36,0.95)` — near-black pill
- Border-radius: `23.1579px` — full pill
- Padding: `0px 25px`
- Icons crossfade at `opacity 0.2s ease` — 200ms; mic ↔ stop-square
- Mic icon: 26×26 white SVG (microphone)
- Stop icon: 10×10 white square, radius 2px
- Hover: `transform: scale(1.02)`, subtle shadow
- Active: `transform: scale(0.98)`
- **Disabled:** `opacity: 0.5; cursor: not-allowed`

**IMPORTANT — dispatch logic in `handleClick` (line 2387):**
```js
if (disabled) return;
if (state === 'idle') onRecordClick?.();
else onStopClick?.();
```
So during warming (if we passed `state='idle'` + `disabled={isConnecting}`), the button visually shows mic AND is disabled. But `MorphingRecordWideSimple.state` is currently wired to `isConversationActive ? 'recording' : 'idle'` — during warming, `isConversationActive === true` so state is `'recording'` (shows STOP icon) even though the pipeline isn't ready. This is the v3 plan's implicit assumption we haven't tested visually.

Consumers: only `VoiceRealtimeOpenAI.tsx:831`.

### RealtimeBlob (`RealtimeBlob.tsx`, 104 lines) — the orb dispatcher

Type contract:
```ts
export type RealtimeVoiceState = 'idle' | 'listening' | 'ai_thinking' | 'ai_speaking';
export type RealtimeOrb =
  | { shader: 'coral';  profile: CoralRealtimeSettings | null }
  | { shader: 'tube';   profile: LinkedProfile | null }
  | { shader: 'radial'; profile: RadialLinkedProfile | null }
  | { shader: 'circle'; profile: CircleVoiceProfile | null };

interface Props {
  audioData: AudioData;
  voiceState: RealtimeVoiceState;
  orb: RealtimeOrb;
  width?: number;   // default 328
  height?: number;  // default 328
  skipIntro?: boolean;
}
```

**Component-type SWAP triggers the talking→idle intro** (per file comment §1-11). Same-shader profile change is prop-only, no intro.

Consumers: `VoiceRealtimeOpenAI.tsx:810`.

### CoralRealtimeBlob (`CoralRealtimeBlob.tsx`, 517 lines) — the DEFAULT active orb on prod

Type contract: `CoralRealtimeSettings` with `base` fields (scale, torusRadius, waveIntensity, breathAmp, idleAmp, morphSpeed, color1/2/3, bgColor, thickRadius, pulseSpeed) + optional `talking` fields (morphSpeed, settleSpeed, scale, waveIntensity, color3).

**Coral state→visual mapping:**
- `idle` — torus (goal=1), base scale, base wave/color, base morphSpeed
- `listening` — **VISUALLY IDENTICAL to idle**. Coral only differentiates `ai_speaking`.
- `ai_thinking` — torus + pulsing torusRadius (triangle wave thin↔thick via `useCoralThinkingPulse`, `pulseSpeed=0.6s` half-cycle default)
- `ai_speaking` — sphere (goal=0), `talking.scale`, `talking.color3`, `talking.waveIntensity`, morphed over `talking.morphSpeed` (0.54s default), settle back over `talking.settleSpeed` (fallback `base.morphSpeed=1.296s`)

**Critical visual invariant this reveals:** the transition from "warming" (whatever we design) → "listening" produces **NO visible orb change** on Coral (idle and listening render identically). The chime + label swap must carry the "pipeline live" signal alone — the orb cannot help.

**Fallback profile** (CORAL_FALLBACK_PROFILE, line 98-121): terracotta reddish-orange (color1 `#944b2e`, color2 `#ffa279`, color3 `#ffc4c4`, bg `#f7f6f4`). This is what shows on prod — the big orange torus visible in the idle screenshot.

Consumers: `RealtimeBlob.tsx:60`.

### NebularrBlob (`NebularrBlob.tsx`, ~200+ lines) — Tube shader alternative

Type contract via `LinkedProfile` (from `useLinkedProfileAnimator.ts`) — base, thinking, talking sub-shapes.

**State-map** (line 42-47):
```
idle → 'idle', listening → 'listening', ai_thinking → 'thinking', ai_speaking → 'talking'
```

Unlike Coral, Nebularr's `useLinkedProfileAnimator` **DOES** differentiate `idle` vs `listening` internally (per LinkedState union). Also has a mount-time talking→idle intro crossfade over `talking.settleSpeed ?? base.thickenSpeed` seconds.

Fallback: dark near-black (`#080602`), yellow-green accents (`#efff08`, `#4f5715`), bg near-white (`#fefffa`).

### Sibling orbs
- `RadialRealtimeBlob.tsx` — radial waveform bars driven by `frequencyData`. Not currently pinned in the profile strip on prod.
- `CircleRealtimeBlob.tsx` — the third pinned option (from live snapshot).

## §3. Audio & session lifecycle (verified from `services/audioService.ts` + `VoiceRealtimeOpenAI.tsx`)

**Audio pipeline** (`audioService.ts`):
- AnalyserNode `fftSize=2048`, `smoothingTimeConstant=0.8`
- Splits FFT into bass (20-150Hz), mid (150-2000Hz), treble (2000-8000Hz) via `AUDIO_BANDS` in `constants.ts`
- `getAudioData()` returns `{bass, mid, treble, rms, frequencyData?}` normalized to 0..1

**Session lifecycle** (already analysed in v3 plan §1):
- Click → `setIsConversationActive(true)` → `setAppState('listening')` (BUG: fires before pipeline ready)
- Await getUserMedia → await token fetch → await `session.connect()` (~1.5s in Chrome, ~10s Playwright headless)
- SDK resolves `connect()` on data-channel `open` (BUT `updateSessionConfig()` is NOT awaited — the F-9 finding)

**Data flow to orb:**
- `audioData` state polls the mic AnalyserNode inside a setInterval (`audioIntervalRef`, line 664-668)
- Flows down to `RealtimeBlob → CoralRealtimeBlob → CoralStoneMorph` (r3f frame loop reads bass/mid/treble to modulate vertex displacement)

## §4. Live-state visual evidence (Playwright on prod)

Screenshots stored:
- `discovery-state-idle.png` — Coral idle at 1400×900 desktop, default profile
- `discovery-state-idle-nebularr.png` — Nebularr idle
- `discovery-state-idle-circle.png` — Circle idle
- `discovery-projects-landing.png` — /projects gallery for stylization survey

### Verified idle state (Coral default, from computed styles + snapshot):

- **Card**: 901×566, bg `rgb(247,246,244)`, radius `16px`, shadow `rgba(0,0,0,0.06) 0 4px 12px`
- **Orb**: terracotta torus centered vertically-ish in card, ~252px visible diameter inside 328px container
- **Label**: "Ready when you are", Open Runde 16/500, color `rgba(38,36,36,0.3)`
- **Button**: 76×44 dark pill (`rgba(38,36,36,0.95)`) with 26×26 white mic icon
- **Below card**: profile strip of 3 pinned thumbs (Coral, Nebularr, Circle), 44×44 each, only active has border

### States I could NOT trigger in Playwright (require real mic):
- `connecting` (doesn't exist yet — the design gap)
- `listening` (post-connect; identical to idle on Coral orb)
- `ai_thinking` (Coral: pulsing torus)
- `ai_speaking` (Coral: sphere morph)

**Gap surfaced by discovery**: I have no visual reference for `ai_thinking` (pulsing) or `ai_speaking` (sphere morph) either — only can infer from source code. Real-Chrome walkthrough with mic needed to snapshot all 4+1 states before ANY design can be locked.

## §5. Stylization survey — the demo's visual vocabulary

From `/projects` landing (`discovery-projects-landing.png`) and the voice.module.css tokens:

**Palette (from `voice.module.css:264-291`):**
- Base: `--VoiceDarkGrey: #262424`, `--VoiceWhite: #FFFFFF`, `--VoiceRed: #EF4444`, `--VoiceLightGrey: #F4F4F4`
- Dark grey scale: 95 / 90 / 80 / 30 / 20 / 15 / 10 / 5 opacity variants (all on #262424 base)
- Text greys: `--VoiceTextGrey_50: rgba(94,94,94,0.5)`
- Card tokens: `--VoiceBoxBg: #F7F6F4`, `--VoiceBoxOutline: #F2F2F2`, `--VoiceBoxShadow: rgba(0,0,0,0.06)`

**Typography (from voice.module.css:47-252):**
- Primary: Open Runde (4 weights: 400, 500, 600, 700), self-hosted at `/fonts/OpenRunde/`
- Fallback: Inter, system sans
- Letter-spacing on Open Runde: `-0.01em`
- Line-height: `143.75%` for utility classes
- Type scale: 12, 14, 16, 18, 20, 32 (Medium/Regular/Semibold/Bold classes named `OpenRundeMedium16` etc.)

**/projects landing observations:**
- Page background: near-black
- Cards: dark rounded rectangles in 3-column grid, each showcasing a demo preview
- Card labels: bottom pill with subtle background, uppercase, small type
- The realtime voice card shows an orange torus with "Idle" label (LOOPING BLOB PREVIEW — the animated version from `PreviewTraceAnimated.tsx`-adjacent code)
- Overall aesthetic: quiet, generous whitespace, motion-forward, muted palette

**Coherence with /voiceinterface/realtime:**
- ✅ Card padding + soft shadow + off-white bg matches other card-based demos
- ✅ Open Runde typography consistent
- ✅ Dark pill button matches the aesthetic (ClipStream demo uses similar)
- ⚠️ The realtime page's page-bg is WHITE, not black — it's a "demo standalone" page, distinct from /projects/gallery framing. So any warming-state design must feel coherent standing alone on white.

## §6. What "warming state" competes with visually

Design constraints surfaced by the discovery:

**F-orb-invariant (Coral):** idle and listening render identically. The warming state must NOT rely on the orb changing at listening-onset — the chime + label carry the whole signal.

**F-label-color:** label color is `rgba(38,36,36,0.3)` — a soft, understated grey. Any bouncing-dots animation must respect that softness (not high-contrast, not jarring). The v3 plan's dots at `currentColor` with 0.3→1 opacity oscillation might read as too active given the label's own quietness. Alternative: dots stay at the same 0.3 opacity throughout, only translate vertically.

**F-button-affordance:** currently the button changes visual state to `'recording'` (Stop icon) immediately on click because `isConversationActive` flips to true. During warming, the user sees a Stop icon BEFORE the pipeline is live. The v3 plan's `disabled={isConnecting}` only makes it faded — the icon-transition to Stop has already happened. There's a coherence problem: "the button says Stop but you can't stop it, and the label says Connecting."

  → Design decision surfaced: either (a) delay `isConversationActive` flip until connect resolves (keeps button as Mic during warming, disabled), OR (b) accept that "Stop but disabled" is fine because the user gets they clicked it, OR (c) design a warming-specific button state (loading spinner inside button, no icon change).

**F-motion-vocabulary:** Coral has organic motion (breath amp 0.03, idle amp 0.02, torus morph over ~1.3s). A bouncing dot animation at 1.2s cycle (v3 plan §4) is roughly in the same tempo range — coherent. But if we introduce dots animation, we should verify it doesn't compete with the orb's continuous idle breath.

**F-card-composition:** the card is a landscape 901×566 with the orb centered vertically. Adding dots after "Connecting" widens the label horizontally — may cause layout shift on transition to "Listening…". Must reserve fixed width for the label container OR animate width smoothly.

## §7. What the v3 plan MISSES (visual dimension)

Cross-checking v3's §0 UVO/NNF/scope/falsifiers against the discovery:

| v3 covers | v3 misses |
|---|---|
| Async correctness (F-8, F-9, F-10) | Coral's idle==listening visual identity |
| Label text swap sequence | Whether "Connecting" text width matches "Ready when you are" (layout jitter risk) |
| Chime timing + envelope | Whether chime's tempo matches Coral's morphSpeed vocabulary |
| Button `disabled` prop | Button state coherence during warming (Mic vs Stop vs Loading) |
| runIdRef guard for state mutation | Whether Nebularr's mount intro crossfade collides with a fresh mount at connecting state |
| §7.2 VAD-ready escalation | The visual gap between chime + label swap + AI first speech |
| Round A/B/C/D verification | No screenshot proof of what "Connecting" looks like composed with orb+strip |

The v3 plan is state-machine-correct but visually incomplete. The Feature-PIS re-elicitation should specifically fill:

**UVO — visual dimension:**
- The user sees a coherent transition. Card doesn't jump. Orb stays quiet. Label + button + subtle-motion combine to communicate "warming, wait ~1.5s".

**NNF — visual falsifiers:**
- Text width jitter between "Ready when you are" (18 chars) and "Connecting" (10 chars) and "Listening..." (12 chars) — needs measurement or fixed-width container.
- Button state incoherence (label says Connecting, button icon says Stop).
- Orb motion + dot motion overlapping into visual noise.
- On Nebularr / Circle / Radial (non-Coral orbs), the warming state must also feel coherent — those orbs have different motion signatures.
- Card layout shift when error message appears vs disappears during warming.
- Reduced-motion users see the dots animation cut properly and can still distinguish states.

**Scope — visual dimension:**
- In: label text, button icon crossfade (or lack thereof), orb behavior during warming, chime timing.
- Out: total rethink of orb rendering, page-shell layout, profile strip, error styling.

**Falsifiers — visual:**
- F-visual-1: layout jitter on text width change.
- F-visual-2: button icon flips to Stop during warming (user says "did I stop it?").
- F-visual-3: reduced-motion mode drops dots but doesn't communicate warming at all.
- F-visual-4: warming state has no visual echo on Nebularr/Circle (they may already show state changes we haven't accounted for).
- F-visual-5: chime plays before orb+label update, or vice versa (temporal disunity).

## §8. Discovery gaps I could NOT close

Discovery is complete for what I could read/measure, but these remain open:

1. **Live snapshots of `listening` / `ai_thinking` / `ai_speaking` on Coral, Nebularr, Circle** — requires real Chrome + real mic. I have none of these.
2. **How VelvetOrb.tsx differs** — file exists in the tree but not used on prod. If v4/broader-visualization work considers it, needs a read.
3. **The `LinkedProfile` shape + `useLinkedProfileAnimator`** — I know Nebularr uses it but haven't read the animator's implementation. If we ever want a warming-specific animation state on Tube shader, the animator's LinkedState union needs a `'warming'` value + fallback rules.
4. **RadialRealtimeBlob + CircleRealtimeBlob** — read the exports but not the render logic. Warming visual there is unknown.
5. **CoralStoneMorph.tsx** (from `@/projects/blob-orb/variants/CoralStoneMorph`) — the actual r3f shader. If warming needs any subtle prop tweak (e.g. faint idle-amp bump during warming), we'd need to know the shader's controllable props.
6. **Stylization on the `/voiceinterface/showcase/` pages** — sibling voice demos I haven't visited. Might reveal coherent patterns for "loading" states in this codebase.

## §9. Feature-PIS elicitation — what the next step needs to answer

For each lens, a rough question list to drive elicitation:

**UVO (User Value Outcome):**
1. What does success FEEL like for the user in the connect-window? (a) "unnoticed — I just start talking and it works" vs (b) "acknowledged — I see the app is thinking and know to wait" vs (c) "actively delightful — the warming animation is part of the experience"
2. Is UVO scoped to the FIRST session only, or all sessions? (§7.3 open question — subsequent Start-Stop-Start cycles may connect in <200ms)

**NNF (Non-Negotiable Failures):**
1. Ranked list of what MUST NOT happen visually. (Text jitter? Button ambiguity? Motion collision? Voice-first users on reduced-motion?)
2. What baseline stylization must be honored? (Palette tokens, type scale, motion tempo of the orb)

**Scope:**
1. Does this fix touch other orb shaders equally, or is Coral-only acceptable for MVP with a plan for Nebularr/Circle/Radial in v4?
2. Does the visual treatment need to work on mobile (768px breakpoint per existing media queries)?

**Falsifiers:**
1. What visual sanity checks should be Round-D acceptance criteria? (screenshot comparison? snapshot testing?)
2. What states need visual snapshots produced BEFORE implementation? (all 5? just idle+connecting?)

**Appetite:**
1. If we discover during implementation that a coherent visual solution needs a rework of the orb state machine (e.g., a dedicated "warming morph"), do we ship v3 anyway as first-pass or hold for the wider treatment?

## §10. Recommended next moves

1. **Do NOT implement v3 as-is yet.** The plan is correct at the async layer but visually thin — implementing now will produce the counter-friction the user warned about.
2. **Feature-PIS elicitation** using this discovery as the ground-truth reference. Walk through §9's questions with the user.
3. **Produce static visual mockups** of all 5 states (idle, connecting, listening, thinking, speaking) on Coral (default) as the reference target BEFORE implementation. This is the "static visualization of what each page will look like" the user asked about.
4. **Re-scope v3** either to (a) include the visual completeness (grows to ~6-9h estimate), or (b) explicitly ship as async-fix-only with a follow-up plan for the visual layer.
5. **Live-Chrome state snapshots** by the user or via a spike — takes ~5 min in real Chrome and closes the biggest gap (§8.1).

## §11. Cross-references

- `tasks/PLAN_2026-07-02_realtime-connect-window-fix.md` — the v3 plan this discovery is meant to enrich
- `tasks/PLAN_v2_review_synthesis_2026-07-03.md` — v2 → v3 cross-family review synthesis (async layer)
- `src/pages/voiceinterface/realtime.tsx` — page shell (verified)
- `src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx` — container (verified end-to-end)
- `src/projects/voiceinterface/components/ui/VoiceStateLabel.tsx` — label (verified)
- `src/projects/voiceinterface/components/ui/voicemorphingbuttons.tsx:2380-2532` — MorphingRecordWideSimple (verified)
- `src/projects/voiceinterface/components/RealtimeBlob.tsx` — orb dispatcher (verified)
- `src/projects/voiceinterface/components/CoralRealtimeBlob.tsx` — Coral orb (verified)
- `src/projects/voiceinterface/components/NebularrBlob.tsx:1-150` — Nebularr orb (partial read)
- `src/projects/voiceinterface/services/audioService.ts` — audio pipeline (verified)
- `src/projects/voiceinterface/styles/voice.module.css` — design tokens (verified)
- Live screenshots: `discovery-state-idle.png`, `discovery-state-idle-nebularr.png`, `discovery-state-idle-circle.png`, `discovery-projects-landing.png`
- Not yet read: `useLinkedProfileAnimator.ts`, `RadialRealtimeBlob.tsx` (deep), `CircleRealtimeBlob.tsx` (deep), `VelvetOrb.tsx`, `CoralStoneMorph.tsx` (r3f shader), `src/pages/voiceinterface/showcase/*`
