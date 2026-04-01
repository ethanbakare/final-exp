import React from 'react';
import Link from 'next/link';

export default function NewHomeShowcase() {
  const pages = [
    { label: 'Component Library', href: '/new-home/showcase/components', description: 'All card, button, and preview components in isolation' },
  ];

  return (
    <div className="showcase-hub">
      <h1>New Home — Showcase</h1>
      <p className="subtitle">Component development and testing</p>
      <div className="links">
        {pages.map((p) => (
          <Link key={p.href} href={p.href} className="link-card">
            <h2>{p.label}</h2>
            <p>{p.description}</p>
          </Link>
        ))}
      </div>

      <style jsx>{`
        .showcase-hub {
          min-height: 100vh;
          background: #0A0A09;
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 80px 20px;
          font-family: 'Inter', sans-serif;
        }
        h1 { font-size: 32px; margin: 0 0 8px; font-weight: 600; }
        .subtitle { color: rgba(255,255,255,0.5); margin: 0 0 48px; }
        .links { display: flex; flex-direction: column; gap: 16px; width: 100%; max-width: 500px; }
        .links :global(.link-card) {
          display: block;
          padding: 24px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.1);
          text-decoration: none;
          color: white;
          transition: border-color 0.2s;
        }
        .links :global(.link-card:hover) { border-color: rgba(255,255,255,0.3); }
        .links :global(.link-card) h2 { margin: 0 0 4px; font-size: 18px; font-weight: 500; }
        .links :global(.link-card) p { margin: 0; font-size: 14px; color: rgba(255,255,255,0.5); }
      `}</style>
    </div>
  );
}
