import React, { useState, useEffect, useCallback, useRef } from 'react';

const EXPRESSIONS = ['sunglasses', 'smirk', 'party'] as const;
const CYCLE_DURATION = 4000;

const PreviewOllama: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const startCycle = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      if (elapsed >= CYCLE_DURATION) {
        setActiveIndex((prev) => (prev + 1) % EXPRESSIONS.length);
        startTimeRef.current = Date.now();
      }
    }, 100);
  }, []);

  useEffect(() => {
    startCycle();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startCycle]);

  const activeExpression = EXPRESSIONS[activeIndex];

  return (
    <div className="preview-ollama">
      {EXPRESSIONS.map((expr) => (
        <img
          key={expr}
          src={`/images/ollama/${expr}.png`}
          alt={`Ollama ${expr}`}
          className={`ollama-img ${expr === activeExpression ? 'active' : ''}`}
          draggable={false}
        />
      ))}

      <style jsx>{`
        .preview-ollama {
          position: absolute;
          inset: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #1A1A19;
        }

        .ollama-img {
          position: absolute;
          width: 60%;
          height: auto;
          object-fit: contain;
          opacity: 0;
          transition: opacity 0.6s ease;
          pointer-events: none;
        }

        .ollama-img.active {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default PreviewOllama;
