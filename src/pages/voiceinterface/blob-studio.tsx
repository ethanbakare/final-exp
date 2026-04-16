/**
 * Blob Studio — Development page for crafting voice interface blob states.
 *
 * Section A: 4 gallery cells (Idle, Listening, Thinking, Talking)
 *            each with slider controls for tweaking.
 * Section B: Sequential demo that loops through all 4 states
 *            using the settings from Section A.
 *
 * Route: /voiceinterface/blob-studio
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';

// Dynamic import — Three.js components are SSR-unsafe
const BlobStudioContent = dynamic(
  () => import('@/projects/voiceinterface/components/blob-studio/BlobStudioContent'),
  { ssr: false }
);

export default function BlobStudioPage() {
  return (
    <>
      <Head>
        <title>Blob Studio</title>
        <meta name="description" content="Voice interface blob state development" />
      </Head>
      <BlobStudioContent />
    </>
  );
}
