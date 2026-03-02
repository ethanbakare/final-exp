import React from 'react';
import { OllamaLayout } from '@/projects/ollama/components/OllamaLayout';

export default function OllamaPage() {
  const images = {
    visualAudit: { src: '/images/ollama/cs-visual-audit.webp', alt: 'Ollama visual audit collage' },
    magicWords: { src: '/images/ollama/cs-magic-words.webp', alt: 'Just type the magic words poster' },
    terminalPoster: { src: '/images/ollama/cs-terminal.webp', alt: 'Ollama runs on terminal poster' },
    itsTimeToBuild: { src: '/images/ollama/cs-its-time-to-build.webp', alt: 'It is time to build poster' },
    dolphin: { src: '/images/ollama/cs-dolphin.webp', alt: 'Dolphin model announcement' },
    gemma: { src: '/images/ollama/cs-gemma.webp', alt: 'Google Gemma model announcement' },
    weLoveOpenSource: { src: '/images/ollama/cs-we-love-open-source.webp', alt: 'We love open source illustration' },
    openSourceCelebration: { src: '/images/ollama/cs-open-source-celebration.webp', alt: 'Open source celebration' },
    ollamaRocks: { src: '/images/ollama/cs-ollama-rocks.webp', alt: 'Ollama rocks illustration' },
    ollamaEnlightenment: { src: '/images/ollama/cs-ollama-enlightenment.webp', alt: 'Ollama enlightenment illustration' },
    gpuRich: { src: '/images/ollama/cs-gpu-rich.webp', alt: 'GPU Rich illustration' },
  };

  return <OllamaLayout images={images} />;
}
