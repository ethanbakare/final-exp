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

const CYCLE_DURATION = 4000; // ms per expression

interface ExpressionShowcaseProps {
  /** Use desaturated inactive emojis in the selector (V2 style) */
  desaturateInactive?: boolean;
}

export const ExpressionShowcase: React.FC<ExpressionShowcaseProps> = ({ desaturateInactive = false }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const activeExpression = EXPRESSIONS[activeIndex];

  const startCycle = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    startTimeRef.current = Date.now();
    setProgress(0);

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(elapsed / CYCLE_DURATION, 1);
      setProgress(pct);

      if (pct >= 1) {
        setActiveIndex((prev) => (prev + 1) % EXPRESSIONS.length);
        startTimeRef.current = Date.now();
        setProgress(0);
      }
    }, 30);
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
      startTimeRef.current = Date.now();
      setProgress(0);
    }
  };

  // SVG progress ring — scaled from Figma (50px ring, 9px stroke in 2216px stage)
  const ringRadius = 10;
  const ringStroke = 3;
  const ringSvgSize = ringRadius * 2 + ringStroke; // 23
  const circumference = 2 * Math.PI * ringRadius;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className={styles['showcase-wrapper']}>
      {/* Stage clip container — crops edges on mobile */}
      <div className={styles['showcase-stage-clip']}>
        <div className={styles['showcase-stage']}>
          {/* Soft ambient light */}
          <div className={styles['showcase-soft-light']} />

          {/* Spotlight beam — actual SVG from Figma with inner shadow */}
          <div className={styles['showcase-spotlight']}>
            <svg
              viewBox="0 0 651 869"
              preserveAspectRatio={isMobile ? 'xMidYMid meet' : 'none'}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={styles['showcase-spotlight-svg']}
            >
              <defs>
                <filter
                  id="spotlight-shadow"
                  x="0"
                  y="-1.027"
                  width="650.625"
                  height="869.773"
                  filterUnits="userSpaceOnUse"
                  colorInterpolationFilters="sRGB"
                >
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                  <feColorMatrix
                    in="SourceAlpha"
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                    result="hardAlpha"
                  />
                  <feOffset dy="-1.027" />
                  <feGaussianBlur stdDeviation="26.24" />
                  <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                  <feColorMatrix
                    type="matrix"
                    values="0 0 0 0 0.1255 0 0 0 0 0.1216 0 0 0 0 0.1176 0 0 0 1 0"
                  />
                  <feBlend mode="normal" in2="shape" result="innerShadow" />
                </filter>
                <linearGradient
                  id="spotlight-gradient"
                  x1="325.314"
                  y1="-318.376"
                  x2="325.312"
                  y2="868.746"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="white" />
                  <stop offset="1" stopColor="white" stopOpacity="0" />
                </linearGradient>
              </defs>
              <g filter="url(#spotlight-shadow)">
                <path
                  d="M190.333 0H460.291L650.624 868.746H0L190.333 0Z"
                  fill="url(#spotlight-gradient)"
                  fillOpacity="0.1"
                />
              </g>
            </svg>
          </div>

          {/* Character area — fixed box, bottom-aligned, overlapping shadow */}
          <div className={styles['showcase-character-area']}>
            {/* Floor shadow — static, never changes */}
            <div className={styles['showcase-floor-shadow']} />

            {/* Character box — fixed size, bottom-aligned */}
            <div className={styles['showcase-character-box']}>
              <img
                key={activeExpression}
                src={`/images/ollama/${activeExpression}.webp`}
                alt={`Ollama ${activeExpression} character`}
                className={styles['showcase-character']}
              />
            </div>
          </div>

        </div>

        {/* Cycle timer — positioned in clip container so it never gets cropped */}
        <div className={styles['showcase-cycle-timer']}>
          <svg
            width={ringSvgSize}
            height={ringSvgSize}
            viewBox={`0 0 ${ringSvgSize} ${ringSvgSize}`}
          >
            {/* Track ring */}
            <circle
              cx={ringSvgSize / 2}
              cy={ringSvgSize / 2}
              r={ringRadius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth={ringStroke}
            />
            {/* Progress ring */}
            <circle
              cx={ringSvgSize / 2}
              cy={ringSvgSize / 2}
              r={ringRadius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth={ringStroke}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${ringSvgSize / 2} ${ringSvgSize / 2})`}
            />
          </svg>
        </div>
      </div>

      {/* Expression selector */}
      <ExpressionSelector
        activeExpression={activeExpression}
        onSelect={handleSelect}
        desaturateInactive={desaturateInactive}
      />
    </div>
  );
};
