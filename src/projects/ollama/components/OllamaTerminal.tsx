import React from 'react';
import styles from '@/projects/ollama/styles/ollama.module.css';

/**
 * OllamaTerminal Component
 * The running Ollama llama mascot entering a macOS-style terminal window.
 * These two elements always appear together — the mascot running into the terminal.
 */
export const OllamaTerminal: React.FC = () => {
  return (
    <div className={styles['ollama-terminal-group']}>
      {/* Mascot */}
      <img
        src="/images/ollama/ollama-mascot.webp"
        alt="Ollama mascot — running llama entering terminal"
        className={styles['ollama-mascot']}
        width={71}
        height={91}
      />
      {/* Terminal window */}
      <div className={styles['terminal']}>
        <div className={styles['terminal-window']}>
          <div className={styles['terminal-control']}>
            <span className={`${styles['terminal-dot']} ${styles['terminal-dot-close']}`} />
            <span className={`${styles['terminal-dot']} ${styles['terminal-dot-minimize']}`} />
            <span className={`${styles['terminal-dot']} ${styles['terminal-dot-maximize']}`} />
          </div>
        </div>
        <div className={styles['terminal-shadow']} />
      </div>
    </div>
  );
};
