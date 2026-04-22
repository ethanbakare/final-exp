/**
 * DemoCanvas — the tinted, scribble-textured container that wraps
 * a project demo (intro + slot + progress).
 *
 * Compositing mirrors the Figma source: a white base, a solid tint
 * layer at `tintOpacity`, and the scribble image at `textureOpacity`
 * — straight alpha, no blend modes. Image is white-on-black, so the
 * black pixels blend toward the tint (creating the backdrop) and the
 * white pixels read as the scribbles.
 */
import React from 'react';
import styles from '@/projects/demo-showcase/styles/showcase.module.css';

interface DemoCanvasProps {
  /** Colour behind the tint (defaults to page white). */
  baseColor?: string;
  /** Tint colour overlaid on the base (hex). */
  tint: string;
  /** Tint opacity, 0–1. Matches Figma fill opacity. */
  tintOpacity?: number;
  /** Scribble image opacity, 0–1. Figma default is 0.6. */
  textureOpacity?: number;
  /** Corner radius in px. */
  radius?: number;
  /** Width in px (optional — defaults to 100% of parent). */
  width?: number;
  /** Override the --demo-card-bg CSS variable (used by DemoIntroCard). */
  cardBg?: string;
  /** Override the --demo-headline-color variable. */
  headlineColor?: string;
  /** Override the --demo-caption-color variable. */
  captionColor?: string;
  /** Override the --demo-progress-bar-bg variable. */
  progressBarBg?: string;
  /** Override the --demo-progress-track-bg variable. */
  progressTrackBg?: string;
  /** Override the --demo-progress-thumb-bg variable. */
  progressThumbBg?: string;
  /** Rotate the scribble texture 180° for pattern variety. */
  flipTexture?: boolean;
  children?: React.ReactNode;
}

type DemoCanvasStyle = React.CSSProperties & {
  ['--demo-card-bg']?: string;
  ['--demo-headline-color']?: string;
  ['--demo-caption-color']?: string;
  ['--demo-progress-bar-bg']?: string;
  ['--demo-progress-track-bg']?: string;
  ['--demo-progress-thumb-bg']?: string;
};

const TEXTURE_URL = '/images/demo-showcase/canvas-scribble-texture.webp';
// Figma demo-showcase frame: 1160 × 762.43.
const ASPECT_W = 1160;
const ASPECT_H = 762;

export const DemoCanvas: React.FC<DemoCanvasProps> = ({
  baseColor = '#FFFFFF',
  tint,
  tintOpacity = 0.1,
  textureOpacity = 0.6,
  radius = 24,
  width,
  cardBg,
  headlineColor,
  captionColor,
  progressBarBg,
  progressTrackBg,
  progressThumbBg,
  flipTexture = false,
  children,
}) => {
  const rootStyle: DemoCanvasStyle = {
    background: baseColor,
    borderRadius: `${radius}px`,
    width: width ? `${width}px` : '100%',
  };
  if (cardBg) rootStyle['--demo-card-bg'] = cardBg;
  if (headlineColor) rootStyle['--demo-headline-color'] = headlineColor;
  if (captionColor) rootStyle['--demo-caption-color'] = captionColor;
  if (progressBarBg) rootStyle['--demo-progress-bar-bg'] = progressBarBg;
  if (progressTrackBg) rootStyle['--demo-progress-track-bg'] = progressTrackBg;
  if (progressThumbBg) rootStyle['--demo-progress-thumb-bg'] = progressThumbBg;

  const textureStyle: React.CSSProperties = {
    opacity: textureOpacity,
    ...(flipTexture ? { transform: 'rotate(180deg)' } : null),
  };

  return (
  <div className={`demo-canvas ${styles.demoCanvasRoot}`} style={rootStyle}>
    <div
      className="canvas-tint"
      style={{ background: tint, opacity: tintOpacity }}
    />
    <div className="canvas-texture" style={textureStyle} />
    <div className="canvas-content">{children}</div>

    <style jsx>{`
      .demo-canvas {
        position: relative;
        aspect-ratio: ${ASPECT_W} / ${ASPECT_H};
        overflow: hidden;
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      .canvas-tint,
      .canvas-texture {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }
      .canvas-texture {
        background: url('${TEXTURE_URL}') center / cover no-repeat;
      }
      .canvas-content {
        position: relative;
        z-index: 1;
        flex: 1;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 34px;
        padding: 16px;
        box-sizing: border-box;
      }
      @media (max-width: 768px) {
        .demo-canvas {
          aspect-ratio: auto;
        }
        .canvas-content {
          padding: 16px;
          gap: 24px;
        }
      }
    `}</style>
  </div>
  );
};
