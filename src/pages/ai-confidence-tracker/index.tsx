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
 * Main page for the Speech Confidence Visualizer
 * Wraps the main component with the context provider
 */
export default function SpeechConfidencePage() {
  return (
    <div className={`${inter.variable} full-page`}>
      <SpeechConfidenceProvider>
        <SpeechConfidenceVisualizer />
      </SpeechConfidenceProvider>
    </div>
  );
} 