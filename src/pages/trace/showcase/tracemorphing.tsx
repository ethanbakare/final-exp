/**
 * Trace Animation Showcase
 * Interactive testing environment for animation scenarios
 * Tests animations in isolation before integrating into main app
 */

'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { EmptyFinanceState } from '@/projects/trace/components/ui/tracefinance';
import { AnimatedTextBox } from '@/projects/trace/components/ui/tracefinance-animated';
import { ANIMATION_CONFIG, SCROLL_CONFIG } from '@/projects/trace/config/animations';
import type { TextBoxProps } from '@/projects/trace/components/ui/tracefinance';

type DayData = NonNullable<TextBoxProps['days']>[0];

export default function TraceMorphing() {
  // Detect if user prefers reduced motion
  const shouldReduceMotion = useReducedMotion();

  // Scenario 0: Empty State → First Entry
  const [scenario0Days, setScenario0Days] = useState<DayData[]>([]);

  // Scenario 1: New MerchantBlock on Same Day
  const [scenario1Days, setScenario1Days] = useState<DayData[]>([
    {
      date: '26th January, 2026',
      total: '628.21',
      merchants: [
        {
          merchantName: 'TESCOS',
          merchantTotal: '628.21',
          items: [
            { quantity: '2x', itemName: 'Headphones', netPrice: '104.99' },
            { quantity: '1x', itemName: 'Playstation 5', netPrice: '500.99' },
            { quantity: '1x', itemName: 'USB Cable', netPrice: '22.23' },
          ],
        },
      ],
    },
  ]);

  // Scenario 2: New DayBlock for Different Date
  const [scenario2Days, setScenario2Days] = useState<DayData[]>([
    {
      date: '26th January, 2026',
      total: '628.21',
      merchants: [
        {
          merchantName: 'TESCOS',
          merchantTotal: '628.21',
          items: [
            { quantity: '2x', itemName: 'Headphones', netPrice: '104.99' },
            { quantity: '1x', itemName: 'Playstation 5', netPrice: '500.99' },
          ],
        },
      ],
    },
  ]);

  // Scenario 3: Auto-Scroll (with scrollable container)
  const [scenario3Days, setScenario3Days] = useState<DayData[]>([
    {
      date: '26th January, 2026',
      total: '628.21',
      merchants: [
        {
          merchantName: 'TESCOS',
          merchantTotal: '628.21',
          items: [
            { quantity: '2x', itemName: 'Headphones', netPrice: '104.99' },
            { quantity: '1x', itemName: 'Playstation 5', netPrice: '500.99' },
          ],
        },
      ],
    },
    {
      date: '25th January, 2026',
      total: '450.00',
      merchants: [
        {
          merchantName: 'AMAZON',
          merchantTotal: '450.00',
          items: [
            { quantity: '1x', itemName: 'Laptop Stand', netPrice: '299.99' },
            { quantity: '3x', itemName: 'Mouse Pad', netPrice: '50.00' },
          ],
        },
      ],
    },
    {
      date: '24th January, 2026',
      total: '120.50',
      merchants: [
        {
          merchantName: 'WAITROSE',
          merchantTotal: '120.50',
          items: [
            { quantity: '5x', itemName: 'Organic Apples', netPrice: '12.50' },
            { quantity: '2x', itemName: 'Bread', netPrice: '54.00' },
          ],
        },
      ],
    },
  ]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scenario 0 handlers
  const handleAddFirstEntry = () => {
    setScenario0Days([
      {
        date: '27th January, 2026',
        total: '1247.88',
        merchants: [
          {
            merchantName: 'AMAZON',
            merchantTotal: '1247.88',
            items: [
              { quantity: '1x', itemName: 'Laptop Stand', netPrice: '299.99' },
              { quantity: '2x', itemName: 'Keyboard', netPrice: '947.89' },
            ],
          },
        ],
      },
    ]);
  };

  const handleResetScenario0 = () => {
    setScenario0Days([]);
  };

  // Scenario 1 handlers
  const handleAddAmazonMerchant = () => {
    setScenario1Days((prev) => [
      {
        ...prev[0],
        total: '1876.09', // Updated total
        merchants: [
          ...prev[0].merchants,
          {
            merchantName: 'AMAZON',
            merchantTotal: '1247.88',
            items: [
              { quantity: '1x', itemName: 'Laptop Stand', netPrice: '299.99' },
              { quantity: '2x', itemName: 'Keyboard', netPrice: '947.89' },
            ],
          },
        ],
      },
    ]);
  };

  const handleResetScenario1 = () => {
    setScenario1Days([
      {
        date: '26th January, 2026',
        total: '628.21',
        merchants: [
          {
            merchantName: 'TESCOS',
            merchantTotal: '628.21',
            items: [
              { quantity: '2x', itemName: 'Headphones', netPrice: '104.99' },
              { quantity: '1x', itemName: 'Playstation 5', netPrice: '500.99' },
              { quantity: '1x', itemName: 'USB Cable', netPrice: '22.23' },
            ],
          },
        ],
      },
    ]);
  };

  // Scenario 2 handlers
  const handleAddNewDay = () => {
    setScenario2Days((prev) => [
      {
        date: '27th January, 2026',
        total: '1247.88',
        merchants: [
          {
            merchantName: 'AMAZON',
            merchantTotal: '1247.88',
            items: [
              { quantity: '1x', itemName: 'Laptop Stand', netPrice: '299.99' },
              { quantity: '2x', itemName: 'Keyboard', netPrice: '947.89' },
            ],
          },
        ],
      },
      ...prev,
    ]);
  };

  const handleResetScenario2 = () => {
    setScenario2Days([
      {
        date: '26th January, 2026',
        total: '628.21',
        merchants: [
          {
            merchantName: 'TESCOS',
            merchantTotal: '628.21',
            items: [
              { quantity: '2x', itemName: 'Headphones', netPrice: '104.99' },
              { quantity: '1x', itemName: 'Playstation 5', netPrice: '500.99' },
            ],
          },
        ],
      },
    ]);
  };

  // Scenario 3 handlers (with auto-scroll)
  const handleAddOlderDay = () => {
    const newDay: DayData = {
      date: '15th January, 2026',
      total: '89.99',
      merchants: [
        {
          merchantName: 'COSTA',
          merchantTotal: '89.99',
          items: [
            { quantity: '3x', itemName: 'Coffee', netPrice: '12.50' },
            { quantity: '2x', itemName: 'Sandwich', netPrice: '77.49' },
          ],
        },
      ],
    };

    setScenario3Days((prev) => [...prev, newDay]);

    // Auto-scroll to new entry after animation starts
    setTimeout(() => {
      const container = scrollContainerRef.current;
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: SCROLL_CONFIG.behavior,
        });
      }
    }, SCROLL_CONFIG.delay);
  };

  const handleResetScenario3 = () => {
    setScenario3Days([
      {
        date: '26th January, 2026',
        total: '628.21',
        merchants: [
          {
            merchantName: 'TESCOS',
            merchantTotal: '628.21',
            items: [
              { quantity: '2x', itemName: 'Headphones', netPrice: '104.99' },
              { quantity: '1x', itemName: 'Playstation 5', netPrice: '500.99' },
            ],
          },
        ],
      },
      {
        date: '25th January, 2026',
        total: '450.00',
        merchants: [
          {
            merchantName: 'AMAZON',
            merchantTotal: '450.00',
            items: [
              { quantity: '1x', itemName: 'Laptop Stand', netPrice: '299.99' },
              { quantity: '3x', itemName: 'Mouse Pad', netPrice: '50.00' },
            ],
          },
        ],
      },
      {
        date: '24th January, 2026',
        total: '120.50',
        merchants: [
          {
            merchantName: 'WAITROSE',
            merchantTotal: '120.50',
            items: [
              { quantity: '5x', itemName: 'Organic Apples', netPrice: '12.50' },
              { quantity: '2x', itemName: 'Bread', netPrice: '54.00' },
            ],
          },
        ],
      },
    ]);
  };

  // Animation props based on reduced motion preference
  const getAnimationProps = (variant: keyof typeof ANIMATION_CONFIG.variants) => {
    if (shouldReduceMotion) {
      return { initial: false, animate: false, exit: false };
    }

    return {
      initial: 'initial',
      animate: 'animate',
      exit: 'exit',
      variants: ANIMATION_CONFIG.variants[variant],
    };
  };

  return (
    <>
      <div className="morphing-showcase">
        <h1 className="main-title">Trace Animation Showcase</h1>
        <p className="subtitle">Interactive testing for animation scenarios</p>

        {/* Scenario 0: Empty State → First Entry */}
        <section className="demo-section">
          <h2 className="section-title">Scenario 0: Empty State → First Entry</h2>
          <p className="section-description">
            Simple crossfade transition (300ms). Empty state fades out, first entry fades in with
            minimal 4px slide.
          </p>

          <div className="controls">
            <button onClick={handleAddFirstEntry} className="btn btn-primary">
              Add First Entry
            </button>
            <button onClick={handleResetScenario0} className="btn btn-secondary">
              Reset
            </button>
          </div>

          <div className="demo-container">
            <div className="textbox-wrapper">
              <AnimatePresence mode="wait">
                {scenario0Days.length === 0 ? (
                  <motion.div
                    key="empty"
                    {...getAnimationProps('emptyState')}
                    transition={{ duration: ANIMATION_CONFIG.duration.fast }}
                    className="empty-wrapper"
                  >
                    <EmptyFinanceState />
                  </motion.div>
                ) : (
                  <motion.div
                    key="content"
                    {...getAnimationProps('firstEntry')}
                    transition={{
                      duration: ANIMATION_CONFIG.duration.normal,
                      ease: ANIMATION_CONFIG.easing.standard,
                    }}
                  >
                    <AnimatedTextBox days={scenario0Days} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* Scenario 1: New MerchantBlock on Same Day */}
        <section className="demo-section">
          <h2 className="section-title">Scenario 1: New MerchantBlock on Existing Day</h2>
          <p className="section-description">
            Expand & fade in (350ms). New AMAZON merchant animates into existing January 26th day.
            Total updates automatically.
          </p>

          <div className="controls">
            <button onClick={handleAddAmazonMerchant} className="btn btn-primary">
              Add AMAZON to Jan 26th
            </button>
            <button onClick={handleResetScenario1} className="btn btn-secondary">
              Reset
            </button>
          </div>

          <div className="demo-container">
            <div className="textbox-wrapper">
              <AnimatedTextBox days={scenario1Days} />
            </div>
          </div>
        </section>

        {/* Scenario 2: New DayBlock for Different Date */}
        <section className="demo-section">
          <h2 className="section-title">Scenario 2: New DayBlock for Different Date</h2>
          <p className="section-description">
            Block fade & expand (400ms). New day inserts at top with staggered reveal. Existing
            content slides down smoothly.
          </p>

          <div className="controls">
            <button onClick={handleAddNewDay} className="btn btn-primary">
              Add Jan 27th
            </button>
            <button onClick={handleResetScenario2} className="btn btn-secondary">
              Reset
            </button>
          </div>

          <div className="demo-container">
            <div className="textbox-wrapper">
              <AnimatedTextBox days={scenario2Days} />
            </div>
          </div>
        </section>

        {/* Scenario 3: Auto-Scroll Behavior */}
        <section className="demo-section">
          <h2 className="section-title">Scenario 3: Auto-Scroll to New Entry</h2>
          <p className="section-description">
            Auto-scroll triggered when new content appears below viewport. Smooth scroll after 50ms
            delay.
          </p>

          <div className="controls">
            <button onClick={handleAddOlderDay} className="btn btn-primary">
              Add Jan 15th (Scroll to Bottom)
            </button>
            <button onClick={handleResetScenario3} className="btn btn-secondary">
              Reset
            </button>
          </div>

          <div className="demo-container">
            <div className="textbox-wrapper scrollable" ref={scrollContainerRef}>
              <AnimatedTextBox days={scenario3Days} />
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        .morphing-showcase {
          min-height: 100vh;
          background: var(--trace-bg-dark);
          color: var(--trace-text-primary);
          padding: 40px 20px;
        }

        .main-title {
          font-family: var(--trace-font-family);
          font-size: 32px;
          font-weight: var(--trace-fw-medium);
          color: var(--trace-text-primary);
          text-align: center;
          margin: 0 0 8px 0;
        }

        .subtitle {
          font-family: var(--trace-font-family);
          font-size: 14px;
          font-weight: var(--trace-fw-normal);
          color: var(--trace-text-secondary);
          text-align: center;
          margin: 0 0 40px 0;
        }

        .demo-section {
          max-width: 800px;
          margin: 0 auto 60px;
          padding: 24px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--trace-border-primary);
          border-radius: 16px;
        }

        .section-title {
          font-family: var(--trace-font-family);
          font-size: 20px;
          font-weight: var(--trace-fw-medium);
          color: var(--trace-text-primary);
          margin: 0 0 8px 0;
        }

        .section-description {
          font-family: var(--trace-font-family);
          font-size: 13px;
          font-weight: var(--trace-fw-normal);
          color: var(--trace-text-secondary);
          margin: 0 0 20px 0;
          line-height: 1.6;
        }

        .controls {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .btn {
          font-family: var(--trace-font-family);
          font-size: 14px;
          font-weight: var(--trace-fw-medium);
          padding: 10px 20px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: var(--trace-transition-fast);
        }

        .btn-primary {
          background: var(--trace-btn-light);
          color: var(--trace-border-primary);
        }

        .btn-primary:hover {
          background: rgba(245, 245, 244, 0.9);
        }

        .btn-secondary {
          background: transparent;
          color: var(--trace-btn-light);
          border: 1px solid rgba(245, 245, 244, 0.35);
        }

        .btn-secondary:hover {
          background: rgba(245, 245, 244, 0.1);
        }

        .demo-container {
          display: flex;
          justify-content: center;
          padding: 20px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
        }

        .textbox-wrapper {
          position: relative;
          min-height: 421px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .textbox-wrapper.scrollable {
          max-height: 500px;
          overflow-y: auto;
        }

        .empty-wrapper {
          width: 301px;
          height: 421px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--trace-bg-dark);
          border: 1px solid var(--trace-border-primary);
          border-radius: 16px;
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </>
  );
}
