import React, { useState } from 'react';
import styles from '@/projects/ollama/styles/ollama.module.css';

const expressions = [
  { name: 'Party', file: 'party' },
  { name: 'Smirk', file: 'smirk' },
  { name: 'Sunglasses', file: 'sunglasses' },
  { name: 'Frightened', file: 'frightened' },
  { name: 'Pleading', file: 'pleading' },
  { name: 'Salute', file: 'salute' },
  { name: 'Thinking', file: 'thinking' },
  { name: 'ROFL', file: 'rofl' },
  { name: 'Drooling', file: 'drooling' },
];

interface ExpressionSelectorProps {
  /** Currently active expression file key (e.g. 'party') */
  activeExpression?: string;
  /** Callback when an expression is clicked */
  onSelect?: (file: string) => void;
}

export const ExpressionSelector: React.FC<ExpressionSelectorProps> = ({
  activeExpression,
  onSelect,
}) => {
  const [hoveredExpression, setHoveredExpression] = useState<string | null>(null);

  return (
    <div className={styles['expr-selector']}>
      {expressions.map((expr) => {
        const isActive = activeExpression === expr.file;
        const isHovered = hoveredExpression === expr.file;

        const frameClasses = [
          styles['expr-selector-frame'],
          isActive ? styles['expr-selector-frame-active'] : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <button
            key={expr.file}
            className={frameClasses}
            onClick={() => onSelect?.(expr.file)}
            onMouseEnter={() => setHoveredExpression(expr.file)}
            onMouseLeave={() => setHoveredExpression(null)}
            aria-label={`Select ${expr.name} expression`}
            aria-pressed={isActive}
          >
            <div
              className={`${styles['expr-selector-icon-wrapper']} ${
                isActive || isHovered ? styles['expr-selector-icon-wrapper-scaled'] : ''
              }`}
            >
              <img
                src={`/images/ollama/outline-${expr.file}.webp`}
                alt=""
                className={styles['expr-selector-outline']}
                aria-hidden="true"
              />
              <img
                src={`/images/ollama/emoji-${expr.file}.webp`}
                alt={`${expr.name} emoji`}
                className={styles['expr-selector-emoji']}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
};
