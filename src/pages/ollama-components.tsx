import React, { useState } from 'react';
import { OllamaTerminal } from '@/projects/ollama/components/OllamaTerminal';
import { ExpressionSelector } from '@/projects/ollama/components/ExpressionSelector';
import { ExpressionShowcase } from '@/projects/ollama/components/ExpressionShowcase';
import styles from '@/projects/ollama/styles/ollama.module.css';

const expressions = [
  { name: 'Running', file: 'running' },
  { name: 'Sunglasses', file: 'sunglasses' },
  { name: 'Thinking', file: 'thinking' },
  { name: 'Crying', file: 'crying' },
  { name: 'Drooling', file: 'drooling' },
  { name: 'Frightened', file: 'frightened' },
  { name: 'Pleading', file: 'pleading' },
  { name: 'ROFL', file: 'rofl' },
  { name: 'Salute', file: 'salute' },
  { name: 'Write That Down', file: 'writethatdown' },
  { name: 'Smirk', file: 'smirk' },
  { name: 'Party', file: 'party' },
];

export default function OllamaComponentsPage() {
  const [showCardBg, setShowCardBg] = useState(true);
  const [activeExpression, setActiveExpression] = useState<string | undefined>('party');

  return (
    <div className={styles['ollama-components-page']}>
      <div className={styles['ollama-components-inner']}>
        <h1 className={styles['ollama-components-title']}>Ollama Components</h1>

        {/* OllamaTerminal — mascot + terminal together */}
        <section className={styles['ollama-components-section']}>
          <h2 className={styles['ollama-components-heading']}>OllamaTerminal</h2>
          <p className={styles['ollama-components-desc']}>
            The running llama entering a macOS terminal window. These two elements always appear together.
          </p>
          <div className={styles['ollama-components-preview']} style={{ background: '#201F1E' }}>
            <OllamaTerminal />
          </div>
        </section>

        {/* Expression Selector — interactive emoji picker */}
        <section className={styles['ollama-components-section']}>
          <h2 className={styles['ollama-components-heading']}>Expression Selector</h2>
          <p className={styles['ollama-components-desc']}>
            An interactive menu for switching between mascot expressions. Click to activate, hover to preview.
          </p>
          <div className={styles['ollama-components-preview']}>
            <ExpressionSelector
              activeExpression={activeExpression}
              onSelect={(file) =>
                setActiveExpression(file === activeExpression ? undefined : file)
              }
            />
          </div>
        </section>

        {/* Expression Showcase — stage + auto-cycling selector */}
        <section className={styles['ollama-components-section']}>
          <h2 className={styles['ollama-components-heading']}>Expression Showcase</h2>
          <p className={styles['ollama-components-desc']}>
            The mascot on stage, cycling through expressions. Click any expression to jump to it, or let it auto-advance.
          </p>
          <div className={styles['ollama-components-preview']} style={{ background: '#201F1E' }}>
            <ExpressionShowcase />
          </div>
        </section>

        {/* Expression Grid — all mascot variants */}
        <section className={styles['ollama-components-section']}>
          <div className={styles['ollama-toggle-row']}>
            <h2 className={styles['ollama-components-heading']}>Expressions</h2>
            <div
              className={styles['ollama-toggle-container']}
              onClick={() => setShowCardBg(!showCardBg)}
            >
              <div className={`${styles['ollama-toggle-switch']} ${showCardBg ? styles['active'] : ''}`}>
                <div className={styles['ollama-toggle-slider']} />
              </div>
            </div>
          </div>
          <p className={styles['ollama-components-desc']}>
            All mascot expressions — each is an atomic unit deployed across posters, announcements, and social content.
          </p>
          <div className={styles['ollama-expression-grid']}>
            {expressions.map((expr) => (
              <div
                key={expr.file}
                className={styles['ollama-expression-card']}
                style={showCardBg ? undefined : { background: 'transparent' }}
              >
                <img
                  src={`/images/ollama/${expr.file}.webp`}
                  alt={`Ollama ${expr.name} expression`}
                  className={styles['ollama-expression-img']}
                />
                <span className={styles['ollama-expression-label']}>{expr.name}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
