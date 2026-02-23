import React from 'react';
import styles from '@/projects/ollama/styles/ollama.module.css';

/**
 * OllamaMascot Component
 * The running Ollama llama character.
 * Maintains consistent size across breakpoints.
 */
export const OllamaMascot: React.FC = () => {
  return (
    <img
      src="/images/ollama/ollama-mascot.webp"
      alt="Ollama mascot — running llama character"
      className={styles['ollama-mascot']}
      width={71}
      height={91}
    />
  );
};
