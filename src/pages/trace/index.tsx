/**
 * Trace Application Page
 * Main entry point for the Trace expense tracker
 *
 * Route: /trace
 *
 * The interactive surface lives in TraceCore so the same component can
 * also be embedded inside the demo-showcase carousel without duplicating
 * state machine + recording + upload logic.
 */

'use client';

import React from 'react';
import Head from 'next/head';
import { TraceCore } from '@/projects/trace/components/TraceCore';
import ProjectPageBackground from '@/projects/new-home/components/ProjectPageBackground';

export default function TracePage() {
  return (
    <>
      <Head>
        <title>Trace</title>
        <meta name="description" content="Track expenses using voice or camera" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <ProjectPageBackground variant="trace">
        <div className="trace-page">
          <TraceCore />
        </div>
      </ProjectPageBackground>

      <style jsx>{`
        .trace-page {
          box-sizing: border-box;
          width: 100%;
          /* Background = the home-page AI DEMOS Trace card (#965935),
             painted and framed by <ProjectPageBackground>, which also
             applies the site navbar offset. */
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 20px;
          gap: 16px;
        }

        /* The mic permission banner is a fixed toast by default (top: 24px
           under the navbar), which hugs the frame's top edge and covers
           the card header on phones and in landscape. On this page it is
           laid out in the flow above the card instead: the page's 20px
           padding keeps it clear of the frame edge and the 16px gap
           keeps it clear of the card. Empty containers (inactive states)
           are removed so they add no gap. The override is scoped to this
           page; the component itself is unchanged. */
        .trace-page :global(.mic-banner-container) {
          position: static;
          transform: none;
          max-width: 100%;
        }
        .trace-page :global(.mic-banner-container:empty) {
          display: none;
        }
        /* The mobile banner is a fixed 346px; keep 20px either side of it
           inside the (edge-to-edge) phone frame, so shrink it on the
           narrowest phones. */
        @media (max-width: 389px) {
          .trace-page :global(.mic-banner-container) {
            zoom: 0.92;
          }
        }
        @media (max-width: 359px) {
          .trace-page :global(.mic-banner-container) {
            zoom: 0.84;
          }
        }

        /* Narrow phones: the 360px Trace card does not fit with 20px of air
           either side of it (the phone frame is edge to edge, so that is
           the viewport minus 40px). Scale the card with CSS zoom
           (it is a fixed-size widget; a layout resize would not fit its
           161px-wide buttons). Only the card is zoomed - not the page or
           the fixed mic toast / modals. Each step is the largest zoom
           that fits at the bottom of its range: 360 x zoom <= vw - 40.
           Side padding is dropped so the card can use the whole frame.
           The bar's button height token is raised per step so the
           Upload/Speak buttons stay >= 40px tall after zoom (height x
           zoom). The 12px/10px bar padding shrinks with the zoom too.
           >= 430px is untouched. */
        @media (max-width: 429px) {
          .trace-page {
            /* 12px, not 20px: with the mic banner showing, a 390x844 phone
               then fits the whole page (it overran by 8px at 20px). */
            padding: 12px 0;
          }
          .trace-page :global(.trace-container) {
            zoom: 0.96;
          }
          .trace-page :global(.trnavbar-container.trnavbar-container) {
            --trace-button-height: 44px;
          }
        }
        @media (max-width: 389px) {
          .trace-page :global(.trace-container) {
            zoom: 0.92;
          }
          .trace-page :global(.trnavbar-container.trnavbar-container) {
            --trace-button-height: 44px;
          }
        }
        @media (max-width: 374px) {
          .trace-page :global(.trace-container) {
            zoom: 0.88;
          }
          .trace-page :global(.trnavbar-container.trnavbar-container) {
            --trace-button-height: 46px;
          }
        }
        @media (max-width: 359px) {
          .trace-page :global(.trace-container) {
            zoom: 0.83;
          }
          .trace-page :global(.trnavbar-container.trnavbar-container) {
            --trace-button-height: 49px;
          }
        }
        @media (max-width: 339px) {
          .trace-page :global(.trace-container) {
            zoom: 0.76;
          }
          .trace-page :global(.trnavbar-container.trnavbar-container) {
            --trace-button-height: 53px;
          }
          /* The mic toast is 346px wide; the frame is 280px at 320. */
          .trace-page :global(.mic-banner-container) {
            zoom: 0.78;
          }
        }
      `}</style>
    </>
  );
}
