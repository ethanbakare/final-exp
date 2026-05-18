# Handoff — projects-component test page & demo-card variant roadmap

Cold-start contract. Read top-to-bottom before continuing. Branch:
**`csw-010-circle-voice-port`** (final-exp). `main` UNTOUCHED.

---

## 0. TL;DR

Building a **test scaffold page** at `/new-home/projects-component`
(file: `src/pages/new-home/projects-component.tsx`) that slots demo
widgets into the **brand-design `DemoCard`** (the 381×298 card from
`CarouselBrand`) across several "chrome" variants, drag-reorderable,
with a show/hide-handles toggle. Goal: decide how each AI demo should
look as a card before moving any of it to the real products page. **Not
the products page yet.**

- **Done:** TraceWidget extracted + slotted (5 chrome variants) + a 6th
  variant: **Clipstream** (`PreviewClipstream`) in the outer-white
  style. Drag-to-reorder + handle toggle. Shared `MasterBlockHolder`
  top-radius tied to the card radius.
- **Next (sequential, one at a time, verify+commit+user-review between
  each):** roadmap items **#2 AI Confidence**, **#3 Ollama**,
  **#4 Voice library** (see §5).

---

## 1. The page & its model

`src/pages/new-home/projects-component.tsx` — a Pages-Router page:

- Wrapped in `styles.pageContainer` (from
  `@/projects/new-home/styles/new-home.module.css`) — **required** so
  the DemoCard CSS vars resolve (`--card-bg #201F1D`,
  `--card-border #2E2C29`, `--card-inner-bg #33312E`,
  `--card-inner-border`). Vars live on `.pageContainer` only.
- `type Variant = { id; className; innerBg?; caption; content: ReactNode }`.
- `const VARIANTS: Variant[]` — the cards. First 5 share
  `traceSlot = <div style={{transform:'scale(0.8)'}}><TraceWidget/></div>`.
  6th = `{ id:'clipstream', className:'projects-card-glass',
  innerBg:'transparent', caption:'Clipstream — outer white',
  content:<PreviewClipstream/> }`.
- `const [order, setOrder] = useState(VARIANTS.map(v=>v.id))` — render
  order; `BY_ID` lookup.
- `const [dragId,setDragId]` + `reorder(targetId)` — native HTML5 DnD.
- `const [showHandles,setShowHandles]=useState(true)` — fixed
  bottom-right pill toggles the per-card ⠿ handle (only the handle is
  `draggable`; hiding it disables drag). Order preserved across toggles.
- Each card = a flex column: a `position:relative; width:381;
  height:298` box (drop target: `onDragOver preventDefault` + `onDrop=
  reorder(id)`) containing the ⠿ handle (absolute top-right, the only
  draggable element) + `<DemoCard label="Trace AI"
  className={`${v.className} pc-card-${v.id}`} innerBg={v.innerBg}>
  {v.content}</DemoCard>`, then a caption span.

### Unique-subclass convention (REQUIRED for every variant)

Each card carries its **shared chrome class** (`projects-card-glass`
etc.) **PLUS a unique `pc-card-<id>` subclass** auto-derived from its
`id`. Reason: two variants can share chrome (`glass`+`clipstream`,
`chrome`+`innerCream`); without a unique hook the element picker's
auto-screenshot resolves to the wrong identical-classed twin and a CSS
edit to the shared class hits BOTH. The shared class still drives the
chrome treatment; the `pc-card-<id>` is purely a targeting/selection
handle. **Every NEW variant must keep getting `pc-card-<id>`** (it's
automatic via the `className={`${v.className} pc-card-${v.id}`}`
template — don't remove it). To restyle exactly one variant, target
`.pc-card-<id> .card-outer` (not the shared chrome class).

### Variant CSS classes (in the page's `<style jsx global>`)

- **`.projects-card`** — "Chrome stripped": `.card-outer` transparent +
  `border:none + box-shadow:none`; `.card-inner` border none;
  `.card-inner > .label` display:none. Used with `innerBg="transparent"`.
- **`.projects-card-chrome`** — "Full card chrome": sizing only (no
  stripping) → default DemoCard bg/border/shadow/label kept. (Variant C
  also passes `innerBg="#F7F6F4"`.)
- **`.projects-card-glass`** — like stripped but
  `.card-outer { background: rgba(255,255,255,0.025) !important }`
  ("Outer white 2.5%"). Border+shadow stripped, label hidden.
- **`.projects-card-glass-bordered`** — white-2.5% `.card-outer` but
  the default border + inset shadow KEPT (not stripped); label hidden.
- All four are in the `width/height:100%` sizing group.
- **CRITICAL label rule:** hide DemoCard's label with
  `.<class> .card-inner > .label` (DIRECT child). A broad
  `.<class> .label` ALSO blanks the Trace widget's own `.label`
  (TotalAmtSpent pill) → "Total amt" disappears. (Bug hit & fixed.)

---

## 2. Components / how to slot things

- **`TraceWidget`** (`src/projects/trace/components/TraceWidget.tsx`) —
  self-contained Figma "Dictation app" card, fixed **301×315**, carries
  its own `<style jsx global>` of `.traceWidgetTextbox…` rules. It's a
  normal block → slot inside `<div style={{transform:'scale(0.8)'}}>` to
  fit the card. Spec: `src/projects/trace/TRACE_WIDGET_SPEC.md`.
- **Preview\* components** (`src/projects/new-home/components/previews/`)
  — `PreviewClipstream`, `PreviewAIConfidence`, `PreviewOllama`,
  `PreviewVoiceAnimated`, `PreviewTraceAnimated`. These are the exact
  wrappers the demos carousel (`CarouselDemos.tsx`) uses. **All are
  `position:absolute; inset:0`** → they fill the DemoCard `.card-inner`
  (which is `position:relative; overflow:hidden; flex column center`).
  **Slot `<PreviewX/>` directly as DemoCard children — NOT the bare
  inner widget, and NOT inside a `transform:scale()` wrapper.**
  (Lesson: bare `<VoiceTextBoxClip>` w/o `PreviewClipstream` collapsed
  to a square; scale compounded it. Always use the Preview wrapper.)

### DemoCard API (`src/projects/new-home/components/DemoCard.tsx`)

`label` (string, required), `href?`, `labelBg?`, `labelTextColor?`,
`labelPosition?` (default bottom-center), `innerBg?` (sets
`.card-inner` inline background), `children`, `className`.
`.card-outer` = 381×298 cell content (padding 12, radius 20, border
`var(--card-border)`, inset box-shadow). `.card-inner` = flex:1,
radius 10, `overflow:hidden`, `position:relative`, bg
`var(--card-inner-bg)`. Brand grid size **381×298** (from
`CarouselBrand.tsx` `.container { grid-template-columns:repeat(3,381px);
grid-auto-rows:298px }`).

---

## 3. Gotchas (will bite if ignored)

1. **styled-jsx specificity:** shared trace/navbar/demo components use
   NON-global `<style jsx>` → every selector is scoped with a
   `.jsx-<hash>` class (effective ~0,2,0). A single
   `.scope .target` (0,2,0) only TIES → loses on source order. Beat it
   with a **doubled class** (`.x.x .target` = 0,3,0) or `!important`.
   The TraceWidget styles + the projects-card overrides already do this.
2. **`.container` CSS-module var shadowing:** the `--trace-*` design
   tokens are declared on the `.container` class, and EVERY trace
   element carries that class → each element re-declares the token on
   itself. Setting a var on an ancestor does NOT reach descendants.
   (Why `MasterBlockHolder` needed an explicit widget-scoped 32px
   radius even though the card scopes `--trace-textbox-radius:32px`.)
3. **Don't scale Preview\* widgets to "fit"** — they're
   absolute/inset:0 and self-lay-out; scaling collapses/distorts them.
   Fit problems are solved by the card/inner sizing, not transforms on
   the widget. (Width-squash of voice clip distorts its navbar — user
   explicitly forbade; revisit via other means.)
4. **MasterBlockHolder top-radius is now SHARED:** `tracefinance.tsx`
   `.master-block-holder { border-radius: var(--trace-textbox-radius)
   var(--trace-textbox-radius) 0 0 }` → 16px on `/trace`, 32px in the
   widget (widget adds a scoped `.traceWidgetTextbox.traceWidgetTextbox
   .master-block-holder { border-radius:32px 32px 0 0 }`). Affects the
   live `/trace` app + widget + this page. Intended.

---

## 4. Verification harness & process (DO THIS EVERY CHANGE)

- `npx tsc --noEmit` → must exit 0 (it does NOT catch styled-jsx / Next
  build errors — see next).
- `curl -s -o /tmp/x.html -w '%{http_code}' --max-time 90
  http://localhost:3000/new-home/projects-component` → must be **200**;
  then `grep -oiE "Build Error|Failed to compile|Module not found"
  /tmp/x.html` → must be empty. (Dev server compiles on request; this
  catches what tsc can't. **Never `npm run build` while dev runs.**)
- Visual: write a throwaway `scripts/_tmp_shot.mjs`
  (`import { chromium } from 'playwright'`; headless; goto the route;
  `waitForTimeout` ~2-3.5s for the simulate loops; screenshot the card
  / `fullPage`; optionally `page.on('pageerror')` capture + computed
  styles via `page.evaluate`), `node` it, **`Read` the PNG**, then
  `rm scripts/_tmp_shot.mjs`. Locator tip: `[class*="voice_container"]`,
  `.projects-card-glass`, `[title="Drag to reorder"]`. Don't index a
  handles[] array by a span index (bug hit).
- Native HTML5 DnD can't be auto-driven by mouse simulation reliably;
  to test reorder, dispatch `DragEvent`s with a shared `DataTransfer`
  with a **render gap** (separate `evaluate` calls + `waitForTimeout`
  between dragstart and drop, else React state hasn't flushed).
- **Commit after every change.** `git -c commit.gpgsign=false commit`.
  **NEVER** Co-Authored-By / any @anthropic.com in messages. Stage
  specific files (no `git add -A`). Live JSON data files are runtime
  DBs — never git-reset them (see `tasks/SESSION_HANDOFF.md` §3).
- One step at a time; screenshot-verify; report honestly (the user has
  repeatedly caught over-claims & over-reach — do exactly what's asked,
  surface obstacles, don't silently substitute).

---

## 5. ROADMAP — remaining items (do in order, one per turn)

The user's plan, verbatim intent. Each: add a new `VARIANTS` entry on
the projects-component page (new `id`, `caption`, `content:
<PreviewX/>`, and a card style), verify, commit, await review.

### #2 — AI Confidence Tracker  (NEXT)

- Slot **`PreviewAIConfidence`**
  (`src/projects/new-home/components/previews/PreviewAIConfidence.tsx`).
- It already paints its own **picture background** (`.bg-image` =
  `/images/voice-interface/wt1.webp`, rotated) + a white `#fafafa`
  `.transcript-box`. User: the card should **NOT** use the outer-white
  bg — it should show **that picture background** (i.e. let the preview's
  own bg-image be the card surface; card-inner effectively transparent
  so the preview fills it). It's `position:absolute inset:0` so it fills
  `.card-inner` already.
- User also wants the **mobile/`@media (max-width:620px)` style** of
  `PreviewAIConfidence` (the variant where `.transcript-box` is
  %-shrunk: `width:93.68%; height:92.2%; right:-6.87%; bottom:-25.89%`)
  — "the way AI confidence looks on mobile, where you shrink the width."
  The 381px card is wider than 620px? No — the card-inner is ~357px, so
  the `@media (max-width:620px)` rule WON'T trigger off viewport (the
  page viewport is wide). Options to get the mobile look: (a) replicate
  those % values via a scoped override for this variant's
  `.transcript-box`, or (b) container-query/forced class. Recommend a
  scoped override mirroring the <620px block. Confirm with user which.
- Card chrome: likely `projects-card` (stripped, transparent) so the
  preview's own picture bg is the surface — NOT `projects-card-glass`.
  Caption e.g. "AI Confidence — picture bg (mobile style)".

### #3 — Ollama (llama)

- Slot **`PreviewOllama`** (`previews/PreviewOllama.tsx`) — 3 images
  (sunglasses/smirk/party) cross-fading every 4s; `position:absolute
  inset:0; flex center; background: var(--preview-ollama-bg)`.
- User: "just need a background… go with auto/outer-white for now and
  see." → simplest: a card with the outer-white style
  (`projects-card-glass`, `innerBg:'transparent'`) OR set
  `--preview-ollama-bg`. Start simple, screenshot, iterate. Caption
  "Ollama — outer white" (adjust per review).

### #4 — Voice URL library (Voice UI)

- Slot **`PreviewVoiceAnimated`** (`previews/PreviewVoiceAnimated.tsx`)
  — `LoopingBlob` (R3F/WebGL, 282×282, auto voice-state loop).
  `position:absolute inset:0; flex center`. Its design bg =
  `var(--preview-voice-bg)` = **`#F7F6F4`** (matches its Whimsy bg).
- User: card bg should **match that white `#F7F6F4`** — i.e. set the
  card-inner to `#F7F6F4` (use `innerBg="#F7F6F4"` on the DemoCard;
  chrome stripped via a glass-like class but with inner = #F7F6F4, or
  reuse `.projects-card` + `innerBg="#F7F6F4"`). Replace the
  outer-white with this white. Caption "Voice UI — #F7F6F4".
- WebGL: headless screenshot needs SwiftShader flags
  (`--use-gl=angle --use-angle=swiftshader
  --enable-unsafe-swiftshader --ignore-gpu-blocklist`) in the Playwright
  launch args, else the blob canvas may not render in the probe.

---

## 6. Key files

- `src/pages/new-home/projects-component.tsx` — the test page (all
  variant config + DnD + toggle + the variant CSS).
- `src/projects/trace/components/TraceWidget.tsx` — reusable Trace card.
- `src/projects/trace/TRACE_WIDGET_SPEC.md` — Trace widget spec.
- `src/projects/new-home/components/DemoCard.tsx` — the brand card.
- `src/projects/new-home/components/CarouselBrand.tsx` — brand grid
  (381×298 source of truth) ; `CarouselDemos.tsx` — how Preview\* are
  used (sizes: demos grid is `repeat(4,282px)` rows 321px — different
  from brand 381×298; relevant if matching demo sizing later).
- `src/projects/new-home/components/previews/Preview*.tsx` — slottables.
- `src/projects/trace/components/ui/tracefinance.tsx` — shared
  `MasterBlockHolder` (radius change lives here).
- `tasks/SESSION_HANDOFF.md` — earlier CSW-010 workstream + the
  non-negotiable data-file rules.

## 7. Commit log (workstream, newest first)

`d1f260a` clipstream uses PreviewClipstream (no square) ·
`0c2ce0f` add Clipstream variant · `c3c24d7` handle show/hide toggle ·
`a7e2763` drag-to-reorder 5 cards · `6965580` 5th variant ·
`b85c790` MasterBlockHolder top-radius tied to card · `a77ccd6` glass
2.5% · `214a010` remove edge box-shadow · `8bab8c6` 4th variant ·
`2ff312f` 3rd variant · `2528283` 2nd variant · `14f5a65` strip
chrome+hide label · `1a5ff21` scale TraceWidget 0.8 · `8015801`
projects-component page · `e68fbd7` extract TraceWidget · then the
Trace-widget build/fix commits down to the CSW-010 work.

## 8. Environment

macOS; Brave (user) / headless Chromium (verify). Next dev on
`localhost:3000` (user-owned — don't kill; HMRs on src changes).
`tsc --noEmit` is the per-change type gate; curl-the-route is the
build gate. Global rules: always commit when an action finishes; NEVER
Co-Authored-By / @anthropic.com.
