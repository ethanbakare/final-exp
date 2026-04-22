/**
 * DemoCanvas — the tinted, scribble-textured container that wraps
 * a project demo (intro + slot + progress). Colour is supplied by
 * the caller so each project can have its own flavour.
 *
 * Compositing: the scribble texture is white-on-black. We lay it
 * over a solid tint and use mix-blend-mode: lighten to keep the
 * white scribbles and drop the black back to the tint colour.
 */
import React from 'react';

interface DemoCanvasProps {
  /** Background tint colour (CSS). */
  tint?: string;
  /** How visible the scribble texture is, 0–1. */
  textureOpacity?: number;
  /** Corner radius in px. */
  radius?: number;
  /** Min height of the canvas in px. */
  minHeight?: number;
  children?: React.ReactNode;
}

const TEXTURE_URL = '/images/demo-showcase/canvas-scribble-texture.webp';

export const DemoCanvas: React.FC<DemoCanvasProps> = ({
  tint = '#E8D2E9',
  textureOpacity = 1,
  radius = 24,
  minHeight = 500,
  children,
}) => (
  <div
    className="demo-canvas"
    style={{ background: tint, borderRadius: `${radius}px`, minHeight: `${minHeight}px` }}
  >
    <div className="canvas-texture" style={{ opacity: textureOpacity }} />
    <div className="canvas-content">{children}</div>

    <style jsx>{`
      .demo-canvas {
        position: relative;
        width: 100%;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .canvas-texture {
        position: absolute;
        inset: 0;
        background: url('${TEXTURE_URL}') center / cover no-repeat;
        mix-blend-mode: lighten;
        pointer-events: none;
      }
      .canvas-content {
        position: relative;
        z-index: 1;
        width: 100%;
      }
    `}</style>
  </div>
);
