/**
 * TraceWidget — the Figma "Dictation app" card as a self-contained,
 * slot-anywhere component.
 *
 * Composition mirrors the live /trace demo (TraceCore.tsx): an
 * <AnimatedTextBox> (amber header + scrolling finance body) with the
 * navbar passed via its `navbar` slot so Upload/Speak render INSIDE the
 * card. All Figma-restyle deltas are widget-scoped via the
 * `.traceWidgetTextbox` class + the <style jsx global> below — shared
 * Trace components and /trace are untouched (spec:
 * src/projects/trace/TRACE_WIDGET_SPEC.md). Extracted from the trace
 * component showcase so the same widget can be slotted into the brand
 * /demo cards (projects-component test page → products page).
 *
 * Fixed Figma size: 301 × 315. Renders at its own size; the wrapper
 * hugs it (width:fit-content) and clips to the 32px Figma radius. Place
 * it inside whatever card/cell you need.
 */
import React from 'react';
import { AnimatedTextBox } from '@/projects/trace/components/ui/tracefinance-animated';
import TRNavbarV2 from '@/projects/trace/components/ui/tracenavbar-v2';

const TraceWidget: React.FC = () => {
  return (
    <div
      style={{
        width: 'fit-content',
        borderRadius: 32,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column' as const,
      }}
    >
      <AnimatedTextBox
        className="traceWidgetTextbox"
        grandTotal="14.99"
        days={[
          {
            date: '14th Jul',
            total: '5246.99',
            merchants: [
              {
                merchantName: 'JOHN LEWIS',
                merchantTotal: '619.97',
                items: [
                  { quantity: '2x', itemName: 'Headphones', netPrice: '104.99', discount: '3.99' },
                  { quantity: '1x', itemName: 'Playstation 5', netPrice: '499.99' },
                  { quantity: '1x', itemName: 'Chino Trousers', netPrice: '14.99' },
                ],
              },
              {
                merchantName: 'TESCO',
                merchantTotal: '52.18',
                items: [
                  { quantity: '3x', itemName: 'Organic Milk', netPrice: '2.50', discount: '0.50' },
                  { quantity: '5x', itemName: 'Energy Drink', netPrice: '6.25' },
                  { quantity: '2x', itemName: 'Kitchen Towels', netPrice: '3.98' },
                ],
              },
            ],
          },
        ]}
        navbar={
          <TRNavbarV2
            state="idle"
            onUploadClick={() => console.log('Widget upload clicked')}
            onSpeakClick={() => console.log('Widget speak clicked')}
          />
        }
      />

      <style jsx global>{`
        /* ============================================================
           Trace AI Widget — Figma "Dictation app" restyle (Option A:
           widget-scoped overrides only; shared components & /trace are
           untouched). All values are the exact Figma node values
           (frame 2393:1941 etc.). Scoped to .traceWidgetTextbox.
           ============================================================ */

        /* Card size via CSS VARS — the size tokens come from the
           .container CSS-module class (specificity 0,1,0), so the
           doubled-class (0,2,0) reliably wins and feeds the component
           its own var. AnimatedTextBox computes
           .text-box--with-navbar height = calc(var + 44 + 20), so
           height var 251 ⇒ total 315 = the exact Figma frame.
           (Driving height through the var sidesteps the styled-jsx
           specificity problem below — the component reads the var, we
           don't have to out-specify its scoped height rule.) */
        .traceWidgetTextbox.traceWidgetTextbox {
          --trace-textbox-width: 301px;
          --trace-textbox-height: 251px; /* + 44 + 20 = 315 (Figma) */
          --trace-textbox-radius: 32px;
          --trace-textbox-border: 0px;
          /* Clip the absolutely-pinned navbar + scrolling content to the
             card's rounded corners. */
          overflow: hidden;
        }

        /* IMPORTANT: the shared components use NON-global styled-jsx,
           which scopes every selector with a .jsx-<hash> class →
           effective specificity (0,2,0). A single
           a single .traceWidgetTextbox .x is also (0,2,0) and only TIES
           (loses on source order). So every visual override below uses
           the doubled prefix .traceWidgetTextbox.traceWidgetTextbox →
           (0,3,0), which deterministically beats the component rule.
           The card stays fixed-size: header pinned top, .finance-box
           flex:1 scrolls, navbar pinned bottom — the live /trace
           mechanism, at the widget's real size. */

        /* Header gradient belongs on master-block-HOLDER (the outer
           element); master-block itself carries NO colour.
           Top radius forced to the widget card's 32px here: the shared
           rule (tracefinance.tsx) ties it to --trace-textbox-radius, but
           every element re-declares that token at 16px via its own
           .container class, so the holder would round at 16 while the
           widget card clips at 32 (a dark corner notch). This doubled-
           class rule out-specifies .container and matches the 32px card. */
        .traceWidgetTextbox.traceWidgetTextbox .master-block-holder {
          background: linear-gradient(
            181deg,
            #ffb700 13.16%,
            #fcbd1f 47.72%,
            #facb55 80.23%,
            #f1d07d 98.75%
          );
          border-radius: 32px 32px 0 0;
        }
        .traceWidgetTextbox.traceWidgetTextbox .master-block {
          background: transparent;
          border-bottom: none;
        }

        /* Pill ↔ price alignment. Figma MasterRow (2393:1943) is
           align-items:center; the component uses align-items:baseline,
           which lines the 10px pill text to the 28px number's baseline
           so the big price drops below the pill / out of the band.
           Centring the row lines them up like Figma. (The £-vs-number
           baseline INSIDE .master-total-price-anim is left as-is — that
           matches Figma's small-£-on-the-number's-baseline.) */
        .traceWidgetTextbox.traceWidgetTextbox .master-total-frame {
          align-items: center;
        }

        /* Finance box = its OWN bounded scroll section, separate from the
           navbar. The component gives .finance-box a 200px bottom-padding
           scroll spacer (sized for the tall demo card). With border-box,
           min-height:0 can't shrink a box below its own padding, so at
           the widget's 315 card the finance box is stuck at 200px min and
           shoves the navbar past the bottom (they overlapped). Shrinking
           the spacer to the design's normal 12px lets finance flex-shrink
           into the free space and scroll there; the navbar then sits in
           its own section below — no overlap. */
        .traceWidgetTextbox.traceWidgetTextbox .finance-box {
          padding-bottom: 12px;
        }

        /* Hide the merchant name/total header row in this widget for now
           (not needed in this context). The component derives
           showRowIdentifier internally from the days data
           (tracefinance.tsx:895), so it can't be turned off via props
           with 2 merchants — scoped display:none is the reversible lever. */
        .traceWidgetTextbox.traceWidgetTextbox .row-identifier {
          display: none;
        }

        /* Scroll-depth fade — the Trace pattern (.text-box::after): a
           #1c1917→transparent gradient that sits at the BOTTOM of the
           figures section, just above the navbar bar, so partially-
           scrolled rows fade out and the user reads "more below". Now
           that the layout is correct (finance is its own bounded
           scrolling section, navbar in its own section), this reads as
           an intentional depth cue rather than the earlier row-eating
           glitch. Re-defined scoped (triple-class out-specifies the
           component's styled-jsx ::after): bottom = navbar height (65px)
           so the fade ends exactly on the bar's top stroke. */
        .traceWidgetTextbox.traceWidgetTextbox.traceWidgetTextbox::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          bottom: 65px;
          height: 32px;
          background: linear-gradient(
            to top,
            #1c1917 0%,
            rgba(28, 25, 23, 0) 100%
          );
          pointer-events: none;
          z-index: 10;
        }

        /* "Total amt" outlined pill (Figma node 2393:1944) — drop the
           red indicator, restyle as the bordered pill, swap the label
           text via CSS (no shared-component change; Option A). */
        .traceWidgetTextbox.traceWidgetTextbox .total-amt-spent {
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 20px;
          padding: 0 10px;
          height: 24px;
          background: transparent;
        }
        .traceWidgetTextbox.traceWidgetTextbox .total-amt-spent .indicator {
          display: none;
        }
        .traceWidgetTextbox.traceWidgetTextbox .total-amt-spent .label {
          font-size: 0;
        }
        .traceWidgetTextbox.traceWidgetTextbox .total-amt-spent .label::after {
          content: 'Total amt';
          font-size: 10px;
          font-weight: 500;
          color: #fff;
        }

        /* Bottom bar: stays in normal flex flow (the demo's mechanism)
           so it occupies its OWN section below the figures and never
           overlaps them. (Absolute-positioning it made it overlay the
           finance area — wrong.) Finance is bounded just below so it
           scrolls within its own region. Only the Figma fill + top
           stroke (node 3002:498) live here. */
        .traceWidgetTextbox.traceWidgetTextbox .trnavbar-v2-wrapper {
          background: #24201d;
          border-top: 1px solid #3b3b3b;
        }

        /* Buttons — exact Figma values (nodes 3002:499 / 3002:509):
           background #413C38, text rgba(255,255,255,.80). Text/icon uses
           the OPAQUE equivalent #d9d8d7 (= 0.8·#fff + 0.2·#413C38) so the
           mic icon's filled+stroked paths don't alpha-compound on overlap
           — on a #413C38 bg this is visually identical to white@80%.
           The component's idle bg comes from the styled-jsx-SCOPED rule
           .full-width.state-idle .left/right-morph-button (tracenavbar.tsx
           :655); its effective specificity ties ours, so prior overrides
           lost on source order. !important wins deterministically and is
           safe — scoped entirely to .traceWidgetTextbox. */
        .traceWidgetTextbox.traceWidgetTextbox .full-width.state-idle .left-morph-button,
        .traceWidgetTextbox.traceWidgetTextbox .full-width.state-idle .right-morph-button {
          background: #413c38 !important;
          color: #d9d8d7;
        }
        .traceWidgetTextbox.traceWidgetTextbox .full-width.state-idle .left-morph-button .upload-content,
        .traceWidgetTextbox.traceWidgetTextbox .full-width.state-idle .right-morph-button .speak-content,
        .traceWidgetTextbox.traceWidgetTextbox .full-width.state-idle .button-text {
          color: #d9d8d7;
        }
      `}</style>
    </div>
  );
};

export default TraceWidget;
