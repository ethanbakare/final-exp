# Trace AI Widget — Figma ↔ Code Source of Truth

> **STATUS: SOURCE OF TRUTH.** This document governs how the Trace AI
> widget is assembled from the *existing* Trace component library and how
> a rebuild is verified for accuracy. If the Figma and this document
> disagree, this document wins (it has been reconciled against the code).
> If this document and the code disagree, that is a defect to resolve —
> not to silently work around.

## 0. What this is

A **Trace AI widget**: the expense card (`TextBox`) + the bottom action
bar (`TRNavbar`), as one composed unit suitable for a page/embed.

It is **not a from-scratch Figma→code build.** Every meaningful node in
the Figma frame already has a named, typed component in
`src/projects/trace/`. Reconstruction = *compose existing components with
the right props*, **not** transliterate layers into DOM. Icons are
already in code (`tracebuttons.tsx` / `traceIcons.tsx`) — do **not**
re-extract SVG from Figma.

- **Figma source:** file *"Dictation app"*, page *Page 1*, root node
  **`2393:1941`** (`TextBox`) + sibling **`3002:498`** (`TRNavbar`),
  bridge channel `y0oifi8l`. Captured 2026-05-18.
- **Code source of truth:** `src/projects/trace/components/ui/tracefinance.tsx`,
  `tracebuttons.tsx`, `tracenavbar-v2.tsx`. Finance-component prop shapes
  below are the **local interfaces in `tracefinance.tsx`** (authoritative;
  they diverge from `types/trace.types.ts`, which is stale **for the
  finance atoms/molecules only**). The **navbar** props are the live
  `TRNavbarProps` **in `types/trace.types.ts`** — `tracenavbar-v2.tsx`
  imports them from there; that file is *not* stale for the navbar.
- **Geometry precedence (ADR):** this is a **widget** — its Figma
  size/height/feel is a design requirement and **wins**. The target is
  the documented design-system size **301×421, 16px radius, 1px border**
  (`TRACE_COMPONENTIZATION_PLAN.md:1588-1591`). The global token was
  later widened to **360×500** *"for MasterBlockHolder"*
  (`trace.module.css:373-374`) — a divergence the widget must **not**
  inherit. Achieve the target by **restoring the documented tokens via a
  scoped CSS-var override** (a real layout resize, supported config),
  **not** by clipping a 360 card to 301 (that crops the price column —
  the bug found in review). Override is scoped to the widget; other
  `TextBox` instances stay 360. See §1a for the mechanism.

## 1. Widget composition (the page-level assembly)

```tsx
// Trace AI widget = existing TextBox + existing TRNavbarV2. No new
// low-level components; no icon work.
<div className="trace-widget">
  <TextBox days={…} grandTotal="14.99" />      {/* header + finance body */}
  <TRNavbarV2 state="idle" />                   {/* Upload / Speak bar   */}
</div>
```

- Figma `TextBox` (`2393:1941`) ⇒ `<TextBox>` — renders
  `MasterBlockHolder` (amber header) + `FinanceBox` (day/merchant/items)
  **internally** (`tracefinance.tsx:1192-1193`). Do not hand-assemble its
  children; pass `days` + `grandTotal`.
- Figma `TRNavbar` (`3002:498`) ⇒ `<TRNavbarV2 state="idle" />` — a
  **sibling**, not a child of `TextBox` (code `TextBox` has no navbar).
- `grandTotal` is a **literal pass-through**, *not* computed:
  `TextBox` defaults it to `'0.00'` and passes it straight to
  `MasterBlockHolder` → `MasterTotalPrice` (`tracefinance.tsx:1187,1192`).
  Pass `grandTotal="14.99"` to match the Figma header. (It does **not**
  auto-sum the days.)
- `imports`: `TextBox` from `tracefinance.tsx`; `TRNavbarV2` (default)
  from `tracenavbar-v2.tsx`.

### 1a. Geometry & the unified-card seam (precedence rule)

The Figma frame draws one rounded card (**301px wide, 16px radius, 1px
border** per the design system — the Figma's 32px is a stale draw value;
the documented token is 16px) with the navbar nested inside it.
`TextBox`'s *current global* CSS is **360×500** because the token was
widened *"for MasterBlockHolder"* (`trace.module.css:373-374`), diverging
from the documented **301×421** (`TRACE_COMPONENTIZATION_PLAN.md:1588`).
`TextBox` contains **no** navbar; `TRNavbarV2`'s header documents it as
the padded variant *"for use inside TextBox … sits flush inside the
TextBox card container."*

Build rule (precedence = the widget/design size; resize, don't clip):

- The size tokens (`--trace-textbox-width|height|radius|border`) are
  defined on the **`.container`** CSS-module class (`trace.module.css:257`)
  that `.text-box` itself carries — so an **ancestor wrapper's inline var
  cannot override them** (the element re-sets them via `.container`).
- `TextBox` forwards `className` onto `.text-box`. Pass
  **`className="traceWidgetTextbox"`** and add a `:global` rule whose
  selector out-specifies `.container` (the **doubled-class hack**
  `.traceWidgetTextbox.traceWidgetTextbox` = specificity 0,2,0 > `.container`
  0,1,0, order-independent) setting `--trace-textbox-width:301px;
  height:421px; radius:16px; border:1px`. This is a **real layout resize
  to a documented supported size**, so nothing crops.
- Scope: the override lives on `.traceWidgetTextbox` only — the page's
  other `TextBox` instances stay 360.
- Append `<TRNavbarV2>` directly beneath, in a `width:fit-content`
  column wrapper with `border-radius:16px; overflow:hidden` so the
  appended bar reads as one 301-wide card with it.
- **Never** size the wrapper to 301 with `overflow:hidden` around a
  360 `TextBox` — that *clips* (crops the right-hand price column), the
  defect found in review. Resize via the token override, not the clip.

## 2. Component inventory (atomic tiers, real prop shapes)

All in `src/projects/trace/components/ui/tracefinance.tsx` unless noted.

| Component | Tier | Key props (authoritative) |
|---|---|---|
| `TextBox` | page card | `days[]`, `grandTotal?`, `className?` |
| `MasterBlockHolder` | organism (header) | `total`, `currency?` (**no default** — `tracefinance.tsx:939`; `TextBox` feeds it `days?.[0]?.currency`, so `undefined` unless the day sets `currency`), `fullWidth?`, `priceSlot?`, `className?` |
| `TotalAmtSpent` | atom (the "Total amt" pill) | `className?` |
| `MasterTotalPrice` | molecule (big header price) | `total`, `currency?`, `className?` |
| `FinanceBox` | organism | `days[]`, `currency?`, `className?` |
| `DayBlock` | organism | `date`, `total`, `merchants[]`, `isFirst?`, `width?`, `currency?` |
| `DayExpenses` | organism | `merchants[]`, `width?`, `currency?` |
| `DayTotal` | molecule | `date`, `total`, `isFirst?`, `width?`, `currency?` |
| `Date` | atom | `date` |
| `TotalFrame` | molecule | `total`, `currency?` |
| `MerchantBlock` | organism | `merchantName?`, `merchantTotal`, `items[]`, `showRowIdentifier?`, `width?`, `currency?` |
| `RowIdentifier` | molecule | `merchantName?`, `merchantTotal`, `showRowIdentifier?`, `width?`, `currency?` |
| `MerchantFrame` | atom | `merchantName?` (undefined ⇒ "- - -") |
| `MerchantTotalFrame` | atom | `total`, `currency?`, `width?` |
| `ContentRow` | molecule | `quantity`, `itemName`, `netPrice`, `discount?`, `isFirst?`, `isLast?`, `width?`, `currency?` |
| `QuantityItemName` | molecule | `quantity`, `itemName` |
| `Quantity` | atom | `quantity` |
| `ItemName` | atom | `itemName` |
| `PriceFrame` | molecule | `netPrice`, `discount?`, `width?`, `currency?` |
| `NetPriceFrame` | atom | `price`, `currency?` |
| `DiscountFrame` | atom | `discount`, `currency?` |
| `CurrencyLabel` | atom (inline `£` in the above) | — rendered by parents; not standalone in Figma |
| `TRNavbarV2` | navbar (`tracenavbar-v2.tsx`; props = `Omit<TRNavbarProps,'fullWidth'>` from `types/trace.types.ts`) | `state`, `onUploadClick?`, `onSpeakClick?`, `onCloseClick?`, `onSendAudioClick?`, `disabled?`, `simulateAudio?`, `className?` |
| `UploadButton` / `SpeakButton` | navbar atoms (`tracebuttons.tsx`) | `onClick?`, `disabled?`, `className?` |

## 3. Annotated Figma tree → component → props (this design's data)

Names below are the **post-rename Figma layer names** (now 1:1 with code).
Values are the literals in *this* Figma instance (placeholder data).

> **`currency="£"` annotations below are the *rendered leaf default*, not
> a threaded prop.** This design's `days` payload sets no `currency`, and
> `TextBox` only forwards `days?.[0]?.currency` (⇒ `undefined`).
> `FinanceBox` is called **without** `currency` (`tracefinance.tsx:1193`).
> The `£` you see comes from each leaf frame's own default, not from a
> value passed down. To force a non-`£` currency you must set
> `currency` on the day object so `TextBox` can forward it.

```
TextBox  2393:1941                      ⇒ <TextBox grandTotal="14.99" days={[day]} />
├─ MasterBlockHolder 2393:1942          ⇒ <MasterBlockHolder total="14.99" currency="£" />
│  └─ MasterRow 2393:1943               (internal flex row of MasterBlockHolder)
│     ├─ TotalAmtSpent 2393:1944        ⇒ <TotalAmtSpent />  (renders the "Total amt" pill)
│     │  └─ "Total amt" 2393:1945       (atom's own label — not a prop)
│     └─ MasterTotalPrice 2393:1946     ⇒ <MasterTotalPrice total="14.99" currency="£" />
│        ├─ CurrencyLabel 2393:1947 → "£" 2393:1948   (currency="£")
│        └─ "14.99" 2393:1949           (total="14.99")
├─ FinanceBox 2393:1950                 ⇒ <FinanceBox days={[day]} currency="£" />
│  └─ DayBlock 2393:1951                ⇒ <DayBlock date="14th Jul" total="5246.99" merchants=[m] isFirst />
│     ├─ DayTotal 2393:1952             ⇒ <DayTotal date="14th Jul" total="5246.99" />
│     │  ├─ Date 2393:1953 → "14th Jul" 2393:1954        (date="14th Jul")
│     │  └─ TotalFrame 2393:1955        ⇒ <TotalFrame total="5246.99" currency="£" />
│     │     └─ CurrencyLabel 2393:1956 → "£" 2393:1957 ; "5246.99" 2393:1958
│     └─ MerchantBlock 2393:1959        ⇒ <MerchantBlock merchantName={undefined} merchantTotal="619.97" items=[…] />
│        ├─ RowIdentifier 2393:1960     ⇒ <RowIdentifier merchantName={undefined} merchantTotal="619.97" />
│        │  ├─ MerchantFrame 2393:1961 → "- - -" 2393:1962   (merchantName undefined ⇒ placeholder)
│        │  └─ MerchantTotalFrame 2393:1963 ⇒ total="619.97" currency="£"
│        │     └─ CurrencyLabel 2393:1964 → "£" 2393:1965 ; "619.97" 2393:1966
│        ├─ ContentRow 2393:1967        ⇒ <ContentRow quantity="2x" itemName="Headphones" netPrice="104.99" discount="3.99" isFirst />
│        │  ├─ QuantityItemName 2393:1968
│        │  │  ├─ Quantity 2393:1969 → "2x" 2393:1970        (quantity="2x")
│        │  │  └─ ItemName 2393:1971 → "Headphones " 2393:1972  (itemName — NOTE trailing space, §5)
│        │  └─ PriceFrame 2393:1973     ⇒ netPrice="104.99" discount="3.99"
│        │     ├─ NetPriceFrame 2393:1974 → CurrencyLabel 2393:1975 "£" 2393:1976 ; "104.99" 2393:1977
│        │     └─ DiscountFrame 2393:1978 → CurrencyLabel 2393:1979 "-£" 2393:1980 ; "3.99" 2393:1981
│        ├─ ContentRow 2393:1982        ⇒ <ContentRow quantity="1x" itemName="Playstation 5" netPrice="499.99" />
│        │  ├─ QuantityItemName 2393:1983 → Quantity 2393:1984 "1x" 2393:1985 ; ItemName 2393:1986 "Playstation 5" 2393:1987
│        │  └─ PriceFrame 2393:1988 → NetPriceFrame 2393:1989 → CurrencyLabel 2393:1990 "£" 2393:1991 ; "499.99" 2393:1992
│        └─ ContentRow 2393:1993        ⇒ <ContentRow quantity="1x" itemName="Chino Trousers" netPrice="14.99" isLast />
│           ├─ QuantityItemName 2393:1994 → Quantity 2393:1995 "1x" 2393:1996 ; ItemName 2393:1997 "Chino Trousers" 2393:1998
│           └─ PriceFrame 2393:1999 → NetPriceFrame 2393:2000 → CurrencyLabel 2393:2001 "£" 2393:2002 ; "14.99" 2393:2003
└─ TRNavbar 3002:498                    ⇒ <TRNavbarV2 state="idle" />   (SIBLING of <TextBox>, not a child)
   ├─ UploadButton 3002:499             ⇒ <UploadButton onClick={…} />
   │  ├─ UploadIcon 3002:500            ┐ scaffolding — in code this is a single <svg>
   │  │  └─ ScanIcon 3002:501           │ (the scan glyph already lives in tracebuttons.tsx /
   │  │     ├─ ScanIconTop 3002:502 → ScanIconTopLine 3002:503   │ traceIcons.tsx). DO NOT rebuild
   │  │     ├─ ScanIconMid 3002:504 → ScanIconMidLine 3002:505   │ from these Figma vectors.
   │  │     └─ ScanIconBar 3002:506 → ScanIconBarLine 3002:507   ┘
   │  └─ "Upload" 3002:508              (button label, internal to UploadButton)
   └─ SpeakButton 3002:509              ⇒ <SpeakButton onClick={…} />
      ├─ MicIcon 3002:510 → MicGlyph 3002:511   ┐ scaffolding — existing mic SVG in code
      └─ "Speak" 3002:512               (button label, internal to SpeakButton)
```

### `days` payload for this instance

```ts
const day = {
  date: "14th Jul",
  total: "5246.99",
  merchants: [{
    merchantName: undefined,            // ⇒ "- - -" placeholder
    merchantTotal: "619.97",
    items: [
      { quantity: "2x", itemName: "Headphones",     netPrice: "104.99", discount: "3.99" },
      { quantity: "1x", itemName: "Playstation 5",  netPrice: "499.99" },
      { quantity: "1x", itemName: "Chino Trousers", netPrice: "14.99"  },
    ],
  }],
};
// grandTotal="14.99" is what the Figma header shows (see §5 caveat).
```

## 4. Node-id → component lookup (quick index)

| Component | Figma node id(s) |
|---|---|
| TextBox | 2393:1941 |
| MasterBlockHolder | 2393:1942 |
| TotalAmtSpent | 2393:1944 |
| MasterTotalPrice | 2393:1946 |
| FinanceBox | 2393:1950 |
| DayBlock | 2393:1951 |
| DayTotal | 2393:1952 |
| Date | 2393:1953 |
| TotalFrame | 2393:1955 |
| MerchantBlock | 2393:1959 |
| RowIdentifier | 2393:1960 |
| MerchantFrame | 2393:1961 |
| MerchantTotalFrame | 2393:1963 |
| ContentRow | 2393:1967, 2393:1982, 2393:1993 |
| QuantityItemName | 2393:1968, 2393:1983, 2393:1994 |
| Quantity | 2393:1969, 2393:1984, 2393:1995 |
| ItemName | 2393:1971, 2393:1986, 2393:1997 |
| PriceFrame | 2393:1973, 2393:1988, 2393:1999 |
| NetPriceFrame | 2393:1974, 2393:1989, 2393:2000 |
| DiscountFrame | 2393:1978 |
| CurrencyLabel | 2393:1947, 1956, 1964, 1975, 1979, 1990, 2001 |
| TRNavbar (→ TRNavbarV2) | 3002:498 |
| UploadButton | 3002:499 |
| SpeakButton | 3002:509 |
| Scan icon (→ existing code SVG) | 3002:500–507 |
| Mic icon (→ existing code SVG) | 3002:510–511 |

## 5. Caveats, gaps & non-functional layers (accuracy risks)

1. **Header total is a literal pass-through, NOT computed.** `TextBox`
   defaults `grandTotal` to `'0.00'` and passes it verbatim to
   `MasterBlockHolder` → `MasterTotalPrice` (`tracefinance.tsx:1187,1192`);
   it does **not** auto-sum the days. So the header shows exactly the
   string you pass — pass **`grandTotal="14.99"`** to match the Figma
   header. (The Figma's 14.99 vs day-total 5246.99 vs item-sum ~619.97
   is unreconciled placeholder data in the design; that's a design-data
   note, not a code behavior — the component will not "correct" it.)
2. **`"Headphones "` has a trailing space** in the Figma text content
   (node 2393:1972). Pass `itemName="Headphones"` (trimmed) in code; the
   space is a Figma artifact, not intended.
3. **`MerchantFrame` "- - -"** is the *empty-merchant placeholder*
   (`merchantName === undefined`), not literal data. Keep it driven by
   the prop, not a hardcoded string.
4. **Icon layers are non-functional scaffolding.** `UploadIcon` is a
   20×20 box wrapping a 15×15 group; `ScanIcon` nests 3 single-child
   groups→vectors; `MicIcon`→`MicGlyph` is one vector. **None of these
   become discrete DOM.** They collapse to the existing icon SVG inside
   `UploadButton`/`SpeakButton`. Renaming them precisely was for tidy
   Figma hygiene only — they are explicitly **out of scope for the
   rebuild**; reuse the code icons.
5. **`CurrencyLabel` wrappers** each wrap a single `£`/`-£` text. They
   are intentional (the inline currency atom inside Net/Discount/Total
   frames), not redundant — but they are *not* a standalone Figma
   component to instantiate; the parent frame component renders them.
6. **Layers are not 1:1 with DOM.** Items 1–5 prove it. Accuracy is
   verified by §6, not by counting layers.

## 6. Rebuild + verification checklist

- [ ] Page composes **only** existing components: `<TextBox>` +
      `<TRNavbarV2>` (plus a wrapper). No new low-level components.
- [ ] Icons come from `tracebuttons.tsx`/`traceIcons.tsx` — zero SVG
      pulled from Figma.
- [ ] Every component-bearing node in §3 maps to its component with
      props of the exact shape in §2 (the real interfaces, not
      `trace.types.ts`).
- [ ] `days` payload matches §3 (trimmed `itemName`, prop-driven merchant
      placeholder; `grandTotal="14.99"` passed literally per §5.1).
- [ ] **Geometry:** `TextBox` carries `className="traceWidgetTextbox"`
      and the scoped `:global` doubled-class rule sets
      `--trace-textbox-width:301px; height:421px; radius:16px; border:1px`.
      The card renders at **301 wide** (design size), the price column is
      **not clipped**, and the wrapper is `fit-content` (never a fixed
      301 box with `overflow:hidden` around a 360 card).
- [ ] Other `TextBox` instances on the page still render at 360 (scope
      check — the override didn't leak).
- [ ] Visual diff: render the widget, screenshot, compare against the
      Figma export of `2393:1941` + `3002:498` at the **design size
      (301 wide; ~421 card + navbar)**. Differences are defects in this
      doc or the code — reconcile, don't paper over.
- [ ] `tsc --noEmit` clean. (Never `npm run build` while the dev server
      runs — repo convention.)

## 7. Provenance

Reconciled from: Figma "Dictation app" `2393:1941`/`3002:498` (post
layer-rename, all names now 1:1 with code) ↔
`src/projects/trace/components/ui/{tracefinance,tracebuttons,tracenavbar-v2}.tsx`
and the local prop interfaces therein. Date 2026-05-18.
