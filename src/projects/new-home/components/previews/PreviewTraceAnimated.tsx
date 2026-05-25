/**
 * Animated Trace preview for the home page card.
 * Same structure as the static PreviewTrace (three sibling components
 * inside a manually-sized div) but with animated versions + a simulation
 * loop: idle → recording → processing → results → pause → restart.
 * The loop itself lives in the shared useTraceSimLoop hook.
 *
 * Uses the existing £720.97 dummy data, NOT TraceSim's £18.47.
 */
import React from 'react';
import traceStyles from '@/projects/trace/styles/trace.module.css';
import { MasterBlockHolder } from '@/projects/trace/components/ui/tracefinance';
import {
  AnimatedFinanceBox,
  AnimatedMasterTotalPrice,
} from '@/projects/trace/components/ui/tracefinance-animated';
import { TRNavbarV2 } from '@/projects/trace/components/ui/tracenavbar-v2';
import { useTraceSimLoop } from '@/projects/trace/hooks/useTraceSimLoop';

// ─── Same data as the original static PreviewTrace ─────────
const DUMMY_DAYS = [
  {
    date: '14th Jul',
    dateOriginal: '2026-07-14',
    total: '720.97',
    merchants: [
      {
        merchantName: 'TESCOS',
        merchantTotal: '720.97',
        items: [
          { quantity: '2x', itemName: 'Headphones', netPrice: '104.99', discount: '3.99' },
          { quantity: '1x', itemName: 'Playstation 5', netPrice: '499.99' },
          { quantity: '1x', itemName: 'Chino Trousers', netPrice: '14.99' },
        ],
      },
    ],
  },
];

const PreviewTraceAnimated: React.FC = () => {
  const { days, grandTotal, navbarState, processingState } = useTraceSimLoop(
    DUMMY_DAYS,
    '720.97',
  );

  return (
    <div className="preview-trace">
      <div className={`trace-frame ${traceStyles.container}`}>
        <MasterBlockHolder
          total={grandTotal}
          priceSlot={<AnimatedMasterTotalPrice total={grandTotal} />}
        />
        <AnimatedFinanceBox days={days} processingState={processingState} />
        <TRNavbarV2
          state={navbarState}
          simulateAudio
          onUploadClick={() => {}}
          onSpeakClick={() => {}}
          onCloseClick={() => {}}
          onSendAudioClick={() => {}}
        />
      </div>

      <style jsx>{`
        .preview-trace {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .trace-frame {
          position: absolute;
          left: -72px;
          bottom: 27px;
          width: 301px;
          height: 530px;
          border-radius: 16px;
          border: 1px solid #44403C;
          background: #1C1917;
          box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.06);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          pointer-events: none;
          will-change: transform;
        }
      `}</style>
    </div>
  );
};

export default PreviewTraceAnimated;
