import React from 'react';
import dynamic from 'next/dynamic';
import { Inter, Frank_Ruhl_Libre, Hedvig_Letters_Sans } from 'next/font/google';
import styles from '@/projects/new-home/styles/new-home.module.css';
import DemoCard from '@/projects/new-home/components/DemoCard';
import HeroBanner from '@/projects/new-home/components/HeroBanner';
import CarouselDemos from '@/projects/new-home/components/CarouselDemos';
import CarouselBrand from '@/projects/new-home/components/CarouselBrand';

const PreviewOllama = dynamic(() => import('@/projects/new-home/components/previews/PreviewOllama'), { ssr: false });
const PreviewTrace = dynamic(() => import('@/projects/new-home/components/previews/PreviewTrace'), { ssr: false });
const PreviewAIConfidence = dynamic(() => import('@/projects/new-home/components/previews/PreviewAIConfidence'), { ssr: false });
const PreviewClipstream = dynamic(() => import('@/projects/new-home/components/previews/PreviewClipstream'), { ssr: false });

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const frankRuhlLibre = Frank_Ruhl_Libre({ subsets: ['latin'], weight: ['400'], variable: '--font-frank-ruhl-libre', display: 'swap' });
const hedvigLettersSans = Hedvig_Letters_Sans({ subsets: ['latin'], weight: ['400'], variable: '--font-hedvig', display: 'swap' });

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="section">
      <div className="section-label">{label}</div>
      <div className="section-content">{children}</div>
      <style jsx>{`
        .section { margin-bottom: 64px; width: 100%; }
        .section-label {
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .section-content { display: flex; flex-direction: column; gap: 24px; }
      `}</style>
    </div>
  );
}

export default function NewHomeComponents() {
  return (
    <>
      <div className={`${inter.variable} ${frankRuhlLibre.variable} ${hedvigLettersSans.variable} ${styles.pageContainer}`}>
        <div className="showcase-page">
          <h1 className="page-title">New Home — Component Library</h1>
          <p className="page-subtitle">All components displayed in isolation</p>

          {/* ---- DemoCard Variants ---- */}
          <Section label="DemoCard — Empty (default)">
            <div className="card-row">
              <DemoCard label="Default Label" className="card-box" labelBg="rgba(34,34,34,0.70)">
                <div style={{ width: '100%', height: '100%', background: 'var(--card-inner-bg)' }} />
              </DemoCard>
              <DemoCard label="Top Right Label" labelPosition="top-right" labelBg="rgba(128,34,63,0.40)" className="card-box">
                <div style={{ width: '100%', height: '100%', background: 'var(--card-inner-bg)' }} />
              </DemoCard>
              <DemoCard label="Top Left Label" labelPosition="top-left" labelBg="rgba(255,255,255,0.30)" labelTextColor="rgba(49,49,49,0.70)" className="card-box">
                <div style={{ width: '100%', height: '100%', background: 'var(--card-inner-bg)' }} />
              </DemoCard>
            </div>
          </Section>

          {/* ---- Preview Components ---- */}
          <Section label="PreviewOllama — Auto-cycling llama (sunglasses, smirk, party)">
            <div className="card-row">
              <DemoCard label="Ollama" labelBg="rgba(255,255,255,0.30)" className="card-box">
                <PreviewOllama />
              </DemoCard>
            </div>
          </Section>

          <Section label="PreviewTrace — Trace AI expense tracker on brown background">
            <div className="card-row-tall">
              <DemoCard label="Trace AI" labelPosition="top-left" labelBg="rgba(255,255,255,0.30)" labelTextColor="rgba(49,49,49,0.70)" innerBg="var(--preview-trace-bg)" className="card-box-tall">
                <PreviewTrace />
              </DemoCard>
            </div>
          </Section>

          <Section label="PreviewAIConfidence — Watercolor bg + transcript overlay">
            <div className="card-row-wide">
              <DemoCard label="AI Confidence tracker" labelPosition="top-right" labelBg="rgba(128,34,63,0.40)" className="card-box-wide">
                <PreviewAIConfidence />
              </DemoCard>
            </div>
          </Section>

          <Section label="PreviewClipstream — Recording bar on dot grid">
            <div className="card-row-wide">
              <DemoCard label="Clipstream" labelBg="rgba(113,113,113,0.50)" labelTextColor="rgba(255,255,255,0.80)" className="card-box-wide">
                <div style={{ position: 'absolute', inset: 0, backgroundColor: 'var(--preview-clipstream-bg)', backgroundImage: 'radial-gradient(circle, var(--preview-clipstream-dots) 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                <PreviewClipstream />
              </DemoCard>
            </div>
          </Section>

          <Section label="PreviewVoiceUI — Blob orb image">
            <div className="card-row">
              <DemoCard label="Voice UI Library" labelBg="rgba(113,113,113,0.50)" labelTextColor="rgba(255,255,255,0.80)" innerBg="var(--preview-voice-bg)" className="card-box">
                <img src="/images/new-home/voice-ui-blob.webp" alt="Voice UI blob" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
              </DemoCard>
            </div>
          </Section>

          {/* ---- Hero Banner ---- */}
          <Section label="HeroBanner — Full section">
            <HeroBanner />
          </Section>

          {/* ---- Carousels ---- */}
          <Section label="CarouselDemos — AI Demos bento grid">
            <CarouselDemos />
          </Section>

          <Section label="CarouselBrand — Brand Design Work 3×2 grid">
            <CarouselBrand />
          </Section>

          {/* ---- Typography ---- */}
          <Section label="Typography — From Figma">
            <div className="type-samples">
              <div className="type-row">
                <span className="type-label">FrankRuhlLibre30</span>
                <span className={styles.FrankRuhlLibre30} style={{ color: 'var(--white-90)' }}>Software can now think</span>
              </div>
              <div className="type-row">
                <span className="type-label">InterMedium16Spaced</span>
                <span className={styles.InterMedium16Spaced} style={{ color: 'var(--white-25)' }}>AI DEMOS</span>
              </div>
              <div className="type-row">
                <span className="type-label">InterRegular16</span>
                <span className={styles.InterRegular16} style={{ color: 'var(--white-60)' }}>Crafting visual narratives for startups since 2018</span>
              </div>
              <div className="type-row">
                <span className="type-label">InterRegular14</span>
                <span className={styles.InterRegular14} style={{ color: 'var(--white-20)' }}>M.Sc in AI (2020) · 4 prototypes and counting</span>
              </div>
              <div className="type-row">
                <span className="type-label">OpenRundeMedium14</span>
                <span className={styles.OpenRundeMedium14} style={{ color: 'var(--white-70)' }}>OLLAMA</span>
              </div>
              <div className="type-row">
                <span className="type-label">HedvigLettersSans16</span>
                <span className={styles.HedvigLettersSans16} style={{ color: 'var(--white-70)' }}>View all Projects</span>
              </div>
            </div>
          </Section>

          {/* ---- Colour Swatches ---- */}
          <Section label="Colours — CSS Variables">
            <div className="swatch-grid">
              <div className="swatch" style={{ background: '#201F1D' }}><span>card-bg #201F1D</span></div>
              <div className="swatch" style={{ background: '#2E2C29' }}><span>card-border #2E2C29</span></div>
              <div className="swatch" style={{ background: '#33312E' }}><span>card-inner-bg #33312E</span></div>
              <div className="swatch" style={{ background: '#403D3A' }}><span>card-inner-border #403D3A</span></div>
              <div className="swatch" style={{ background: '#FB7232' }}><span>accent-orange #FB7232</span></div>
              <div className="swatch" style={{ background: '#1A1A19' }}><span>ollama-bg #1A1A19</span></div>
              <div className="swatch" style={{ background: '#965935' }}><span>trace-bg #965935</span></div>
              <div className="swatch" style={{ background: '#F7F6F4', color: '#333' }}><span>voice-bg #F7F6F4</span></div>
              <div className="swatch" style={{ background: '#F0EBEB', color: '#333' }}><span>clipstream-bg #F0EBEB</span></div>
            </div>
          </Section>
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
          padding: 80px 20px 120px;
          box-sizing: border-box;
        }
        .page-title {
          font-family: 'Inter', sans-serif;
          font-size: 28px;
          font-weight: 600;
          color: white;
          margin: 0 0 8px;
        }
        .page-subtitle {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          color: rgba(255,255,255,0.4);
          margin: 0 0 64px;
        }

        /* Card display boxes */
        .card-row { display: flex; gap: 16px; flex-wrap: wrap; }
        .card-row :global(.card-box) { width: 282px; height: 321px; }
        .card-row-tall { display: flex; gap: 16px; }
        .card-row-tall :global(.card-box-tall) { width: 282px; height: 652px; }
        .card-row-wide { display: flex; gap: 16px; }
        .card-row-wide :global(.card-box-wide) { width: 575px; height: 321px; }

        /* Typography */
        .type-samples { display: flex; flex-direction: column; gap: 16px; }
        .type-row { display: flex; align-items: baseline; gap: 24px; }
        .type-label {
          font-family: 'Inter', monospace;
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          min-width: 180px;
          flex-shrink: 0;
        }

        /* Colour swatches */
        .swatch-grid { display: flex; flex-wrap: wrap; gap: 12px; }
        .swatch {
          width: 140px;
          height: 80px;
          border-radius: 8px;
          display: flex;
          align-items: flex-end;
          padding: 8px;
          box-sizing: border-box;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .swatch span {
          font-family: 'Inter', monospace;
          font-size: 10px;
          color: rgba(255,255,255,0.7);
        }
      `}</style>
    </>
  );
}
