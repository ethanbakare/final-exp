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
  children?: React.ReactNode;
}

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
  children,
}) => (
  <div
    className={`demo-canvas ${styles.demoCanvasRoot}`}
    style={{
      background: baseColor,
      borderRadius: `${radius}px`,
      width: width ? `${width}px` : '100%',
    }}
  >
    <div
      className="canvas-tint"
      style={{ background: tint, opacity: tintOpacity }}
    />
    <div className="canvas-texture" style={{ opacity: textureOpacity }} />
    <div className="canvas-content">{children}</div>

    <style jsx>{`
      .demo-canvas {
        position: relative;
        aspect-ratio: ${ASPECT_W} / ${ASPECT_H};
        min-height: 720px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
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
        padding: 50px 116px 15px;
        box-sizing: border-box;
      }
      @media (max-width: 768px) {
        .demo-canvas {
          aspect-ratio: auto;
          min-height: 720px;
        }
        .canvas-content {
          padding: 40px 20px 20px;
          gap: 24px;
        }
      }
    `}</style>
  </div>
);
