# Handoff — projects-component test page & demo-card variant roadmap

Cold-start contract. Read top-to-bottom before continuing. Branch:
**`csw-010-circle-voice-port`** (final-exp). `main` UNTOUCHED.

---

## 0. TL;DR

> **STATUS: the real projects page is now BUILT.** The scaffold below
> served its purpose (decide each AI card's treatment); the chosen
> treatments now live on the real page.

**Real page — `/projects`** (`src/pages/projects.tsx` → thin wrapper
of `src/projects/new-home/components/ProjectsPage.tsx`). All 11
projects in the CarouselBrand grid syntax (`repeat(3,381px)`, 298px
rows, gap 15; →2col ≤1200px; →1col aspect-ratio ≤800px) on the
home-page gradient bg. 5 AI demos with the user-chosen treatments +
6 brand-portfolio image cards; **every card is a real link** (DemoCard
`href` → `<a>`) to its project page. Drag-reorder + handle toggle +
localStorage persistence (key `projects-page:order:v1`, own
`reconcileOrder`, direction-aware reorder). Chosen AI treatments:
AI Confidence=`projects-card-aiconf` (picture+outer border, bottom-left
tag) → `/ai-confidence-tracker`; Trace=`projects-card-glass-bordered`
#FFF6DA inner, grey tag bottom-left → `/trace`;
Ollama=`projects-card-ollamaborder` (borders@50%, tag opacity .7) →
`/ollama`; Clipstream=`projects-card-clipgreige` #C5C3C0 →
`/clipperstream`; Voice=`projects-card-voice` #F7F6F4 →
`/voiceinterface/variations`. Curated chrome CSS is self-contained in
ProjectsPage.tsx (NOT shared with the scaffold — scaffold untouched).

**Scaffold (still exists, untouched)** — test page at
`/new-home/projects-component` (file:
`src/pages/new-home/projects-component.tsx`) that slots demo widgets
into the **brand-design `DemoCard`** (the 381×298 card from
`CarouselBrand`) across many "chrome" variants, drag-reorderable, with
a show/hide-handles toggle. It was where each AI demo's card treatment
was decided.

- **Done:** TraceWidget extracted + slotted (5 chrome variants) +
  Clipstream (`PreviewClipstream`, outer-white) + Clipstream alt collar
  `#C5C3C0` + **#2 AI Confidence** + **#3 Ollama** + **#4 Voice UI** —
  the whole roadmap (§5) is COMPLETE (11 variants). Drag-to-reorder
  (now **persisted to localStorage**) + handle toggle. Every card
  carries a unique `pc-card-<id>` subclass. Shared "double border
  line" outer chrome (transparent + `#2E2C29` border + 2 inset
  hairlines + outward drop, no glow) used by glassBordered AND
  aiConfidence. Shared `MasterBlockHolder` top-radius tied to the card
  radius.
- **Next:** review the live `/projects` page; tweak treatments/order
  as needed. The handle toggle/reorder can be removed on request once
  the order is final. Some link destinations may be WIP pages (hrefs
  are the canonical ones from CarouselDemos/CarouselBrand, e.g. Voice
  UI → `/voiceinterface/variations`).

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
- `const [order, setOrder] = useState(DEFAULT_ORDER)` — render order;
  `BY_ID` lookup. **PERSISTED** to `localStorage` (key
  `projects-component:order:v1`): hydrated once on mount via a
  read-only `useEffect`, and written imperatively inside `reorder()`.
  Do NOT persist via a `useEffect([order])` — under Next dev Strict
  Mode it runs on mount with the default order and (double-invoked)
  races the hydration read, clobbering storage back to default (this
  bug was hit & fixed). `reconcileOrder()` merges a saved order with
  current VARIANTS (keep+dedupe valid ids, append new, drop removed)
  so saved orders stay valid as roadmap variants are added.
- `const [dragId,setDragId]` + `reorder(targetId)` — native HTML5 DnD;
  reorder() also writes the new order to localStorage.
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

## 5. ROADMAP — COMPLETE (all 4 items built; awaiting review)

The user's plan is fully implemented. Recorded here as built (each is
a `VARIANTS` entry; all auto-get `pc-card-<id>` + localStorage
reconcile). Iterate per review; treatments are not yet on the real
products page.

### #2 — AI Confidence Tracker ✅ (`id: 'aiConfidence'`)

- `PreviewAIConfidence` (own picture bg `wt1.webp` + white
  `.transcript-box`), `className: 'projects-card-aiconf'`,
  `innerBg: 'transparent'`. The `@media (max-width:620px)` "mobile"
  transcript layout can't fire off-viewport in a 381 card, so it's
  replicated via the scoped doubled-class `!important` block
  `.projects-card-aiconf.projects-card-aiconf .transcript-box {…}`
  (width 93.68% / height 92.2% / right -6.87% / bottom -25.89% /
  padding 25.551 19.163 / radius 20.441; `.transcript-content` gap
  12.775; `.text-area` padding 28 23 12 23). Outer container later
  given the **shared double-border chrome** (see §1) — so it's no
  longer in the strip group. Caption: "AI Confidence — picture bg,
  mobile + outer border".

### #3 — Ollama ✅ (`id: 'ollama'`)

- `PreviewOllama` (own `#1A1A19` bg, 3 PNGs cross-fade 4s),
  `className: 'projects-card-glass'` (outer-white 2.5%),
  `innerBg: 'transparent'`. "Outer-white for now and see." Caption:
  "Ollama — outer white". Iterate per review.

### #4 — Voice UI ✅ (`id: 'voice'`)

- `PreviewVoiceAnimated` (R3F/WebGL `LoopingBlob` 282×282; paints NO
  bg of its own — needs the card surface), `className:
  'projects-card'` (stripped chrome), `innerBg: '#F7F6F4'` (the
  `--preview-voice-bg` Whimsy white). Caption: "Voice UI — #F7F6F4".
- **WebGL probe:** headless screenshot needs SwiftShader launch flags
  (`--use-gl=angle --use-angle=swiftshader
  --enable-unsafe-swiftshader --ignore-gpu-blocklist`) or the blob
  canvas won't render. (Verified rendering with these.)

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

`97e0578` #4 Voice UI (#F7F6F4) · `33433c0` #3 Ollama (outer white) ·
`dd84d3b` AI Confidence shares double-border chrome · `2265217`
persist reorder to localStorage · `2032ef2` glassBordered collar→inner,
outer transparent · `f1d8e74` glassBordered restore inner hairline ·
`81a772e` glassBordered no glow + solid surface ·
`0dfae26` Clipstream `#C5C3C0` collar · `89023fb` unique `pc-card-<id>`
subclass · `74c32aa` #2 AI Confidence · `4215eca` handoff doc ·
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
