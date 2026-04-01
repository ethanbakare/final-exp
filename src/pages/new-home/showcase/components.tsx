import React from 'react';
import { Inter, Frank_Ruhl_Libre, Hedvig_Letters_Sans } from 'next/font/google';
import styles from '@/projects/new-home/styles/new-home.module.css';
import DemoCard from '@/projects/new-home/components/DemoCard';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const frankRuhlLibre = Frank_Ruhl_Libre({ subsets: ['latin'], weight: ['400'], variable: '--font-frank-ruhl-libre', display: 'swap' });
const hedvigLettersSans = Hedvig_Letters_Sans({ subsets: ['latin'], weight: ['400'], variable: '--font-hedvig', display: 'swap' });

const SAMPLE_TEXT = 'The quick brown fox jumps over the lazy dog';

const COLOURS = [
  { name: 'card-bg', hex: '#201F1D' },
  { name: 'card-border', hex: '#2E2C29' },
  { name: 'card-inner-bg', hex: '#33312E' },
  { name: 'card-inner-border', hex: '#403D3A' },
  { name: 'accent-orange', hex: '#FB7232' },
  { name: 'preview-ollama-bg', hex: '#1A1A19' },
  { name: 'preview-trace-bg', hex: '#965935' },
  { name: 'preview-voice-bg', hex: '#F7F6F4', light: true },
  { name: 'preview-clipstream-bg', hex: '#F0EBEB', light: true },
];

interface TypeSpec {
  className: string;
  family: string;
  size: string;
  weight: string;
  tracking: string;
  lineHeight: string;
  usage: string;
}

const TYPE_GROUPS: Array<{ family: string; specimens: TypeSpec[] }> = [
  {
    family: 'Frank Ruhl Libre',
    specimens: [
      { className: styles.FrankRuhlLibre30, family: 'Frank Ruhl Libre', size: '30px', weight: '400 Regular', tracking: '-0.6px', lineHeight: '93.75%', usage: 'Hero headline' },
    ],
  },
  {
    family: 'Inter',
    specimens: [
      { className: styles.InterMedium16Spaced, family: 'Inter', size: '16px', weight: '500 Medium', tracking: '1.92px', lineHeight: '143.75%', usage: 'Section headers' },
      { className: styles.InterRegular16, family: 'Inter', size: '16px', weight: '400 Regular', tracking: '-0.16px', lineHeight: '143.75%', usage: 'Body text, subtitles' },
      { className: styles.InterRegular14, family: 'Inter', size: '14px', weight: '400 Regular', tracking: '-0.14px', lineHeight: '143.75%', usage: 'Credential line, small text' },
    ],
  },
  {
    family: 'Open Runde',
    specimens: [
      { className: styles.OpenRundeMedium14, family: 'Open Runde', size: '14px', weight: '500 Medium', tracking: '0.42px', lineHeight: '143.75%', usage: 'Card labels' },
    ],
  },
  {
    family: 'Hedvig Letters Sans',
    specimens: [
      { className: styles.HedvigLettersSans16, family: 'Hedvig Letters Sans', size: '16px', weight: '400 Regular', tracking: '-0.16px', lineHeight: '143.75%', usage: 'CTA buttons' },
    ],
  },
];

/* Grid box — mirrors Trace's ButtonGrid pattern */
function GridBox({ children, label, width, height }: {
  children: React.ReactNode;
  label: string;
  width: number;
  height: number;
}) {
  return (
    <div className="grid-box">
      <div className="grid-box-content" style={{ width, height }}>{children}</div>
      <span className="grid-box-label">{label}</span>
      <style jsx>{`
        .grid-box {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          border: 0.8px solid rgba(255, 255, 255, 0.08);
          flex-shrink: 0;
          padding: 16px;
          gap: 10px;
          box-sizing: content-box;
        }
        .grid-box-content {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
        }
        .grid-box-label {
          font-family: 'Inter', sans-serif;
          font-size: 9px;
          font-weight: 400;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: rgba(255, 255, 255, 0.25);
          white-space: nowrap;
          text-align: center;
        }
      `}</style>
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="section-title">
      <span className="section-accent" />
      {children}
      <style jsx>{`
        .section-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(255, 255, 255, 0.45);
          margin: 0 0 28px;
        }
        .section-accent {
          width: 3px;
          height: 16px;
          background: var(--accent-orange);
          border-radius: 2px;
          flex-shrink: 0;
        }
      `}</style>
    </h2>
  );
}

export default function NewHomeComponents() {
  return (
    <>
      <div className={`${inter.variable} ${frankRuhlLibre.variable} ${hedvigLettersSans.variable} ${styles.pageContainer}`}>
        <div className="showcase-page">
          <h1 className="page-title">New Home — Component Library</h1>
          <p className="page-subtitle">All components displayed in isolation</p>

          {/* ======== DEMO CARD — LABEL POSITIONS ======== */}
          <div className="section">
            <SectionTitle>DemoCard — Label Positions</SectionTitle>
            <div className="seamless-grid">
              <GridBox label="bottom-center (default)" width={200} height={200}>
                <DemoCard label="Default Label" labelBg="rgba(34,34,34,0.70)" className="fill">
                  <div className="empty-fill" />
                </DemoCard>
              </GridBox>
              <GridBox label="top-right" width={200} height={200}>
                <DemoCard label="Top Right" labelPosition="top-right" labelBg="rgba(128,34,63,0.40)" className="fill">
                  <div className="empty-fill" />
                </DemoCard>
              </GridBox>
              <GridBox label="top-left" width={200} height={200}>
                <DemoCard label="Top Left" labelPosition="top-left" labelBg="rgba(255,255,255,0.30)" labelTextColor="rgba(49,49,49,0.70)" className="fill">
                  <div className="empty-fill" />
                </DemoCard>
              </GridBox>
            </div>
          </div>

          {/* ======== CAROUSEL CARD SIZES ======== */}
          <div className="section">
            <SectionTitle>Carousel Card Sizes</SectionTitle>
            <div className="subsection-label">AI Demos</div>
            <div className="seamless-grid">
              <GridBox label="standard — 282 × 321" width={282} height={321}>
                <DemoCard label="Standard" labelBg="rgba(34,34,34,0.70)" className="fill">
                  <div className="empty-fill" />
                </DemoCard>
              </GridBox>
              <GridBox label="wide — 575 × 321" width={575} height={321}>
                <DemoCard label="Wide" labelBg="rgba(34,34,34,0.70)" className="fill">
                  <div className="empty-fill" />
                </DemoCard>
              </GridBox>
            </div>
            <div className="seamless-grid" style={{ marginTop: 0 }}>
              <GridBox label="tall — 282 × 652" width={282} height={652}>
                <DemoCard label="Tall" labelBg="rgba(34,34,34,0.70)" className="fill">
                  <div className="empty-fill" />
                </DemoCard>
              </GridBox>
            </div>
            <div className="subsection-label" style={{ marginTop: 32 }}>Brand Work</div>
            <div className="seamless-grid">
              <GridBox label="brand card — 381 × 298" width={381} height={298}>
                <DemoCard label="Brand Card" labelBg="rgba(34,34,34,0.70)" className="fill">
                  <div className="empty-fill" />
                </DemoCard>
              </GridBox>
            </div>
          </div>

          {/* ======== BUTTONS ======== */}
          <div className="section">
            <SectionTitle>Buttons</SectionTitle>
            <div className="seamless-grid">
              <GridBox label="ghost outline" width={160} height={60}>
                <button className="btn-ghost">
                  <span className={styles.HedvigLettersSans16} style={{ color: '#5E5E5E' }}>View all Projects</span>
                </button>
              </GridBox>
              <GridBox label="solid accent" width={140} height={60}>
                <button className="btn-accent">
                  <span className={styles.HedvigLettersSans16} style={{ color: '#FFF' }}>View Demos</span>
                </button>
              </GridBox>
            </div>
          </div>

          {/* ======== TYPOGRAPHY ======== */}
          <div className="section">
            <SectionTitle>Typography</SectionTitle>
            <div className="type-groups">
              {TYPE_GROUPS.map((group) => (
                <div key={group.family} className="type-family-group">
                  <div className="type-family-name">{group.family}</div>
                  {group.specimens.map((spec, i) => (
                    <div key={i} className="type-specimen">
                      <div className="type-specimen-sample">
                        <span className={spec.className} style={{ color: 'rgba(255,255,255,0.9)' }}>{SAMPLE_TEXT}</span>
                      </div>
                      <div className="type-specimen-meta">
                        <div className="type-meta-specs">
                          <span className="type-meta-value">{spec.size}</span>
                          <span className="type-meta-sep">/</span>
                          <span className="type-meta-value">{spec.weight}</span>
                          <span className="type-meta-sep">/</span>
                          <span className="type-meta-value">{spec.tracking} tracking</span>
                          <span className="type-meta-sep">/</span>
                          <span className="type-meta-value">{spec.lineHeight} line-height</span>
                        </div>
                        <span className="type-meta-usage">{spec.usage}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* ======== COLOURS ======== */}
          <div className="section">
            <SectionTitle>Colours</SectionTitle>
            <div className="colour-list">
              {COLOURS.map((c) => (
                <div key={c.name} className="colour-row">
                  <div className="colour-circle" style={{ background: c.hex, border: c.light ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)' }} />
                  <div className="colour-text">
                    <span className="colour-hex">{c.hex}</span>
                    <span className="colour-name">{c.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      <style jsx global>{`
        body, html { margin: 0; padding: 0; background-color: #0A0A09; }
      `}</style>

      <style jsx>{`
        .showcase-page {
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
          padding: 80px 24px 120px;
          box-sizing: border-box;
        }

        .page-title {
          font-family: 'Inter', sans-serif;
          font-size: 24px;
          font-weight: 600;
          color: white;
          margin: 0 0 6px;
        }

        .page-subtitle {
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.3);
          margin: 0 0 64px;
        }

        .section {
          margin-bottom: 0;
          padding: 48px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .section:first-child {
          border-top: none;
          padding-top: 0;
        }

        .subsection-label {
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.35);
          margin-bottom: 16px;
        }

        /* Seamless grid — Trace pattern */
        .seamless-grid {
          display: inline-flex;
          flex-wrap: wrap;
          gap: 0px;
        }

        /* Fill utility for DemoCard inside grid boxes */
        .seamless-grid :global(.fill) {
          width: 100%;
          height: 100%;
        }

        .empty-fill {
          width: 100%;
          height: 100%;
        }

        /* Typography */
        .type-groups {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .type-family-group {
          padding: 24px 0;
        }

        .type-family-group:first-child {
          padding-top: 0;
        }

        .type-family-group:last-child {
          padding-bottom: 0;
        }

        .type-family-name {
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.35);
          margin-bottom: 20px;
        }

        .type-specimen {
          margin-bottom: 28px;
        }

        .type-specimen:last-child {
          margin-bottom: 0;
        }

        .type-specimen-sample {
          margin-bottom: 8px;
        }

        .type-specimen-meta {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .type-meta-specs {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .type-meta-value {
          font-family: 'JetBrains Mono', 'Inter', monospace;
          font-size: 11px;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.3);
        }

        .type-meta-sep {
          font-family: 'Inter', sans-serif;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.12);
        }

        .type-meta-usage {
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.18);
          font-style: italic;
        }

        /* Colours */
        .colour-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          column-gap: 12px;
          row-gap: 24px;
        }

        .colour-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .colour-circle {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .colour-text {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .colour-hex {
          font-family: 'JetBrains Mono', 'Inter', monospace;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.6);
        }

        .colour-name {
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.25);
        }

        /* Buttons */
        .seamless-grid :global(.btn-ghost) {
          display: flex;
          padding: 12px 16px;
          justify-content: center;
          align-items: center;
          border-radius: 18px;
          border: 2px solid rgba(94, 94, 94, 0.40);
          background: transparent;
          cursor: pointer;
        }

        .seamless-grid :global(.btn-accent) {
          display: flex;
          padding: 12px 16px;
          justify-content: center;
          align-items: center;
          border-radius: 18px;
          border: 2px solid transparent;
          background: var(--accent-orange);
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .seamless-grid {
            display: flex;
            justify-content: center;
            max-width: 100%;
            overflow-x: auto;
          }
        }
      `}</style>
    </>
  );
}
