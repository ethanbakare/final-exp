import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ExpressionSelector } from './ExpressionSelector';
import styles from '@/projects/ollama/styles/ollama.module.css';

const EXPRESSIONS = [
  'party',
  'smirk',
  'sunglasses',
  'frightened',
  'pleading',
  'salute',
  'thinking',
  'rofl',
  'drooling',
  'crying',
] as const;

const CYCLE_DURATION = 5000; // ms per expression

export const ExpressionShowcase: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const activeExpression = EXPRESSIONS[activeIndex];

  const startCycle = useCallback(() => {
    // Clear any existing timer
    if (timerRef.current) clearInterval(timerRef.current);

    startTimeRef.current = Date.now();
    setProgress(0);

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(elapsed / CYCLE_DURATION, 1);
      setProgress(pct);

      if (pct >= 1) {
        // Advance to next expression
        setActiveIndex((prev) => (prev + 1) % EXPRESSIONS.length);
        startTimeRef.current = Date.now();
        setProgress(0);
      }
    }, 30); // ~33fps update for smooth ring
  }, []);

  useEffect(() => {
    startCycle();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startCycle]);

  const handleSelect = (file: string) => {
    const idx = EXPRESSIONS.indexOf(file as (typeof EXPRESSIONS)[number]);
    if (idx !== -1) {
      setActiveIndex(idx);
      // Reset cycle from this new expression
      startTimeRef.current = Date.now();
      setProgress(0);
    }
  };

  // SVG progress ring calculations
  const ringRadius = 20;
  const ringStroke = 4;
  const ringSize = (ringRadius + ringStroke) * 2;
  const circumference = 2 * Math.PI * ringRadius;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className={styles['showcase-wrapper']}>
      {/* Stage */}
      <div className={styles['showcase-stage']}>
        {/* Soft ambient light */}
        <div className={styles['showcase-soft-light']} />

        {/* Spotlight beam */}
        <div className={styles['showcase-spotlight']} />

        {/* Character + shadow group */}
        <div className={styles['showcase-character-group']}>
          <div className={styles['showcase-floor-shadow']} />
          <img
            key={activeExpression}
            src={`/images/ollama/${activeExpression}.webp`}
            alt={`Ollama ${activeExpression} character`}
            className={styles['showcase-character']}
          />
        </div>

        {/* Cycle timer — progress ring */}
        <div className={styles['showcase-cycle-timer']}>
          <svg
            width={ringSize}
            height={ringSize}
            viewBox={`0 0 ${ringSize} ${ringSize}`}
          >
            {/* Track */}
            <circle
              cx={ringRadius + ringStroke}
              cy={ringRadius + ringStroke}
              r={ringRadius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth={ringStroke}
            />
            {/* Progress */}
            <circle
              cx={ringRadius + ringStroke}
              cy={ringRadius + ringStroke}
              r={ringRadius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth={ringStroke}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${ringRadius + ringStroke} ${ringRadius + ringStroke})`}
            />
          </svg>
        </div>
      </div>

      {/* Expression selector */}
      <ExpressionSelector
        activeExpression={activeExpression}
        onSelect={handleSelect}
      />
    </div>
  );
};
