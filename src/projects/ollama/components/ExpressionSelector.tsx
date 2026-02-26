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
  { name: 'Crying', file: 'crying' },
];

interface ExpressionSelectorProps {
  /** Currently active expression file key (e.g. 'party') */
  activeExpression?: string;
  /** Callback when an expression is clicked */
  onSelect?: (file: string) => void;
  /** Dark mode variant for use on dark backgrounds */
  dark?: boolean;
}

export const ExpressionSelector: React.FC<ExpressionSelectorProps> = ({
  activeExpression,
  onSelect,
  dark = false,
}) => {
  const [hoveredExpression, setHoveredExpression] = useState<string | null>(null);

  return (
    <div className={`${styles['expr-selector']} ${dark ? styles['expr-selector-dark'] : ''}`}>
      {expressions.map((expr) => {
        const isActive = activeExpression === expr.file;
        const isHovered = hoveredExpression === expr.file;

        const frameClasses = [
          styles['expr-selector-frame'],
          isActive ? styles['expr-selector-frame-active'] : '',
          dark && !isActive ? styles['expr-selector-frame-desaturated'] : '',
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
            <img
              src={`/images/ollama/expr-${expr.file}.webp`}
              alt={`${expr.name} emoji`}
              className={`${styles['expr-selector-img']} ${
                isActive || isHovered ? styles['expr-selector-img-scaled'] : ''
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};
