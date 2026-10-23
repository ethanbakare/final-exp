import React, { useEffect, useRef, useState } from 'react';
import styles from '../styles/madeforhumans.module.css';

// Hero image carousel (Figma "2025", node 5000:265). All frames are stacked and
// mounted up front so each swap is an opacity change on an already-loaded
// image, never a fresh request that could flash.
//
// WCAG 2.2.2 (pause, stop, hide) without a visible control: the carousel is
// itself a toggle button (click or tap pins a pause, aria-pressed reports it),
// and it also rests while hovered, keyboard-focused, offscreen or in a hidden tab.
const FRAME_NAMES = ['train', 'test', 'prompt', 'scare'];

// The frames are cut from the full comic panels at one shared scale, each
// scene centred, so both characters stay whole (operator's pick, 23 Oct).
const FRAMES = FRAME_NAMES.map((n) => `/images/madeforhumans/hero-v6/${n}.webp`);

const FRAME_COUNT = FRAME_NAMES.length;

const INTERVAL_MS = 1000;

const HeroCarousel: React.FC = () => {
  const ref = useRef<HTMLButtonElement>(null);
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);

  // Follow the OS setting live, not just at load
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    observer.observe(el);
    const onVisibility = () => setTabVisible(document.visibilityState === 'visible');
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const running = !reduceMotion && !pinned && !hovered && !focused && onScreen && tabVisible;

  useEffect(() => {
    if (reduceMotion) setIndex(0);
  }, [reduceMotion]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % FRAME_COUNT), INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [running]);

  return (
    <button
      ref={ref}
      type="button"
      className={styles.heroCarousel}
      aria-label="Pause the comic slideshow"
      aria-pressed={pinned}
      onClick={() => setPinned((p) => !p)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      // Keyboard focus only: a mouse click also focuses the button, and
      // pausing on that would stop a second click from resuming
      onFocus={(e) => setFocused(e.currentTarget.matches(':focus-visible'))}
      onBlur={() => setFocused(false)}
      data-running={running}
    >
      {FRAMES.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          width={933}
          height={471}
          className={styles.heroFrame}
          // Lowercase: React 18 passes it through as a plain attribute
          {...{ fetchpriority: i === 0 ? 'high' : 'auto' }}
          data-active={i === index}
          data-prev={i === (index + FRAME_COUNT - 1) % FRAME_COUNT}
          draggable={false}
        />
      ))}
    </button>
  );
};

export default HeroCarousel;
