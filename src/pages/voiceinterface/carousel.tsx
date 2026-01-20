import React from 'react';
import { VoiceInterfaceCarousel } from '@/projects/voiceinterface/components/VoiceInterfaceCarousel';

/**
 * Voice Interface Carousel Page
 * 
 * Full-screen carousel showcasing all 3 voice interface variations
 * Navigate: Click left/right edges or use arrow keys
 */

export default function VoiceInterfaceCarouselPage() {
  return (
    <>
      <VoiceInterfaceCarousel />
      
      <style jsx global>{`
        /* Remove default body margins for true full-screen experience */
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
        
        html {
          margin: 0;
          padding: 0;
        }
        
        /* Ensure Next.js root containers don't add spacing */
        #__next {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
        }
        
        /* Hide Next.js development indicator (bottom-left "N" icon) */
        #__next-build-watcher {
          display: none !important;
        }
        
        /* Alternative selector for Next.js dev indicator */
        [data-nextjs-toast-errors-parent],
        [data-nextjs-toast-errors] {
          display: none !important;
        }
      `}</style>
    </>
  );
}
