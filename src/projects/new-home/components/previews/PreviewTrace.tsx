import React from 'react';
import traceStyles from '@/projects/trace/styles/trace.module.css';
import {
  MasterBlockHolder,
  DayBlock,
  FinanceBox,
} from '@/projects/trace/components/ui/tracefinance';
import { TRNavbarV2 } from '@/projects/trace/components/ui/tracenavbar-v2';

const DUMMY_DAYS = [
  {
    date: '14th Jul',
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

const PreviewTrace: React.FC = () => {
  return (
    <div className="preview-trace">
      <div className={`trace-frame ${traceStyles.container}`}>
        <MasterBlockHolder total="720.97" />
        <FinanceBox days={DUMMY_DAYS} />
        <TRNavbarV2 state="idle" />
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

export default PreviewTrace;
