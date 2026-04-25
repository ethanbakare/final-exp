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

export default function TracePage() {
  return (
    <>
      <Head>
        <title>Trace - Voice & Image Expense Tracker</title>
        <meta name="description" content="Track expenses using voice or camera" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="trace-page">
        <TraceCore />
      </div>

      <style jsx>{`
        .trace-page {
          position: relative;
          min-height: 100vh;
          background: var(--trace-bg-dark);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 20px;
          gap: 16px;
        }
      `}</style>
    </>
  );
}
