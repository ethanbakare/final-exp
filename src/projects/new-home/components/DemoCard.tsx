import React from 'react';
import styles from '../styles/new-home.module.css';

type LabelPosition =
  | 'bottom-center'
  | 'bottom-left'
  | 'bottom-right'
  | 'top-left'
  | 'top-right';

interface DemoCardProps {
  label: string;
  href?: string;
  labelBg?: string;
  labelTextColor?: string;
  labelPosition?: LabelPosition;
  innerBg?: string;
  children: React.ReactNode;
  className?: string;
}

const getLabelStyles = (position: LabelPosition): React.CSSProperties => {
  switch (position) {
    case 'top-left':
      return { top: 0, left: '10px', borderRadius: '0 0 12px 12px' };
    case 'top-right':
      return { top: 0, right: '10px', borderRadius: '0 0 12px 12px' };
    case 'bottom-left':
      return { bottom: 0, left: '10px', borderRadius: '12px 12px 0 0' };
    case 'bottom-right':
      return { bottom: 0, right: '10px', borderRadius: '12px 12px 0 0' };
    case 'bottom-center':
    default:
      return { bottom: 0, left: '50%', transform: 'translateX(-50%)', borderRadius: '12px 12px 0 0' };
  }
};

const DemoCard: React.FC<DemoCardProps> = ({
  label,
  href,
  labelBg = 'rgba(34, 34, 34, 0.70)',
  labelTextColor = 'rgba(255, 255, 255, 0.70)',
  labelPosition = 'bottom-center',
  innerBg,
  children,
  className,
}) => {
  const labelPositionStyles = getLabelStyles(labelPosition);

  const cardContent = (
    <div className="card-outer">
      <div className="card-inner" style={innerBg ? { background: innerBg } : undefined}>
        {children}
        <div
          className="label"
          style={{ background: labelBg, ...labelPositionStyles }}
        >
          <span className={styles.OpenRundeMedium14} style={{ color: labelTextColor }}>
            {label}
          </span>
        </div>
      </div>

      <style jsx>{`
        .card-outer {
          display: flex;
          padding: 12px;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
          border-radius: 20px;
          border: 1px solid var(--card-border);
          background: var(--card-bg);
          box-shadow:
            0 7.256px 14.513px 1px var(--white-03) inset,
            0 0.5px 0.5px 1px var(--white-06) inset,
            0 0.25px 0.25px 1px var(--white-12) inset,
            0 14.211px 20.281px -5.477px rgba(0, 0, 0, 0.25);
          box-sizing: border-box;
        }

        .card-inner {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          flex: 1 0 0;
          align-self: stretch;
          border-radius: 10px;
          border: 1px solid var(--card-inner-border);
          background: var(--card-inner-bg);
          overflow: hidden;
        }

        .label {
          position: absolute;
          display: flex;
          padding: 4px 10px;
          justify-content: center;
          align-items: center;
          gap: 5.877px;
          backdrop-filter: blur(2px);
          box-shadow: 0 -6px 19px 0 rgba(255, 255, 255, 0.24) inset;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );

  if (href) {
    return (
      <a href={href} className={className} style={{ textDecoration: 'none', display: 'flex' }}>
        {cardContent}
      </a>
    );
  }

  return <div className={className} style={{ display: 'flex' }}>{cardContent}</div>;
};

export default DemoCard;
