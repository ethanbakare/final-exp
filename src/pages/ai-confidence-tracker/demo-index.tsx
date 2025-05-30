import React from 'react';
import { Inter } from 'next/font/google';
import SpeechConfidenceVisualizer from '../../projects/ai-confidence-tracker/components/SpeechConfidenceComponents';
import { SpeechConfidenceProvider } from '../../projects/ai-confidence-tracker/hooks/SpeechConfidenceHooks';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

/**
 * Demo page for the original Speech Confidence Visualizer
 * This is the previous version moved from index.tsx
 * Wraps the main component with the context provider
 */
export default function SpeechConfidenceDemoPage() {
  return (
    <div className={`${inter.variable} full-page`}>
      <SpeechConfidenceProvider>
        <SpeechConfidenceVisualizer />
      </SpeechConfidenceProvider>
    </div>
  );
} 