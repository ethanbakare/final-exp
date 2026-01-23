/**
 * Trace Application Page
 * Main entry point for the Trace expense tracker
 *
 * Route: /trace
 */

import React from 'react';
import { TraceApp } from '@/projects/trace/components/TraceApp';
import Head from 'next/head';

export default function TracePage() {
  return (
    <>
      <Head>
        <title>Trace - Voice & Image Expense Tracker</title>
        <meta name="description" content="Track expenses using voice or camera" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <TraceApp />
    </>
  );
}
