/**
 * TRNavbarV2 - Padded variant for use inside TextBox
 *
 * Wraps the original TRNavbar with 10px vertical padding
 * so it sits flush inside the TextBox card container.
 */

import React from 'react';
import { TRNavbar } from './tracenavbar';
import type { TRNavbarProps } from '@/projects/trace/types/trace.types';
import styles from '@/projects/trace/styles/trace.module.css';

export const TRNavbarV2: React.FC<TRNavbarProps> = (props) => {
  return (
    <div className={`trnavbar-v2-wrapper ${styles.container}`}>
      <TRNavbar {...props} />

      <style jsx>{`
        .trnavbar-v2-wrapper {
          padding: 10px 0;
          display: flex;
          justify-content: center;
          width: 100%;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
};

export default TRNavbarV2;
