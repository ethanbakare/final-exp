import React from 'react';
import { OllamaLayout } from '@/projects/ollama/components/OllamaLayout';

export default function OllamaPage() {
  const images = {
    visualAudit: { src: '/images/ollama/visual-audit.webp', alt: 'Ollama visual audit collage' },
    characterBible: { src: '/images/ollama/character-bible.webp', alt: 'Ollama character bible' },
    magicWords: { src: '/images/ollama/magic-words.webp', alt: 'Just type the magic words poster' },
    terminalPoster: { src: '/images/ollama/terminal.webp', alt: 'Ollama runs on terminal poster' },
    itsTimeToBuild: { src: '/images/ollama/its-time-to-build.webp', alt: 'It is time to build poster' },
    dolphin: { src: '/images/ollama/dolphin.webp', alt: 'Dolphin model announcement' },
    gemma: { src: '/images/ollama/gemma.webp', alt: 'Google Gemma model announcement' },
    weLoveOpenSource: { src: '/images/ollama/we-love-open-source.webp', alt: 'We love open source illustration' },
    openSourceCelebration: { src: '/images/ollama/open-source-celebration.webp', alt: 'Open source celebration' },
    ollamaRocks: { src: '/images/ollama/ollama-rocks.webp', alt: 'Ollama rocks illustration' },
    ollamaEnlightenment: { src: '/images/ollama/ollama-enlightenment.webp', alt: 'Ollama enlightenment illustration' },
    gpuRich: { src: '/images/ollama/gpu-rich.webp', alt: 'GPU Rich illustration' },
  };

  return <OllamaLayout images={images} />;
}
