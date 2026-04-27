/**
 * TraceDemo — embeddable Trace demo for the showcase carousel.
 *
 * Mounts the same TraceCore component the standalone /trace page renders,
 * so the showcase's "Try Demo" surfaces the real interactive product
 * (AnimatedTextBox + TRNavbarV2 + Speak/Upload flows), not a stripped-down
 * fork. Strips full-page chrome (centred page background, padding) so the
 * core flows naturally inside ShowcaseSlot.
 *
 * Kill-switch wiring:
 *   - cancelSignal + runIdRef are forwarded straight into TraceCore.
 *   - On abort (swipe-away / demo↔sim toggle), TraceCore's own internal
 *     listener invokes its existing handleCancelRecording path. localStorage
 *     entries persist by design — see KILL-SWITCH-ARCHITECTURE.md §2.2.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TraceCore } from '@/projects/trace/components/TraceCore';
import { TraceClearExpensesModal } from '@/projects/trace/components/ui/TraceModal';
import { ClearButton } from '@/projects/trace/components/ui/tracebuttons';
import { useShowcaseModal } from '@/projects/demo-showcase/context/ShowcaseModalContext';

interface TraceDemoProps {
  cancelSignal?: AbortSignal;
  runIdRef?: React.MutableRefObject<number>;
  isVisible?: boolean;
}

export const TraceDemo: React.FC<TraceDemoProps> = ({ cancelSignal, runIdRef, isVisible = false }) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [canvasContentEl, setCanvasContentEl] = useState<Element | null>(null);
  const { openModal, closeModal } = useShowcaseModal();

  useEffect(() => {
    setCanvasContentEl(wrapperRef.current?.closest('.canvas-content') ?? null);
  }, []);

  const handleShowcaseClearRequest = useCallback((controls: {
    confirmClear: () => void;
    cancelClear: () => void;
  }) => {
    const handleCancel = () => {
      controls.cancelClear();
      closeModal();
    };

    const handleDelete = () => {
      controls.confirmClear();
      closeModal();
    };

    openModal({
      closeOnBackdropClick: true,
      onRequestClose: handleCancel,
      content: (
        <TraceClearExpensesModal
          onCancel={handleCancel}
          onDelete={handleDelete}
        />
      ),
    });
  }, [closeModal, openModal]);

  return (
    <div className="trace-demo-wrapper" ref={wrapperRef}>
      <div className="trace-demo-content">
        <TraceCore
          cancelSignal={cancelSignal}
          runIdRef={runIdRef}
          // Suppress TraceCore's internal MicPermissionBanner — the
          // showcase renders its own navbar-slot variant (Stage 2+) so
          // the fixed-position floater doesn't collide with the showcase
          // top chrome. Standalone /trace is unaffected.
          hideMicBanner={true}
          onRequestClearAll={handleShowcaseClearRequest}
          renderClearButton={(requestClearAll, isDisabled) => (
            isVisible && canvasContentEl ? createPortal(
              <div className="showcase-clear-button">
                <ClearButton onClick={requestClearAll} disabled={isDisabled} />
              </div>,
              canvasContentEl,
            ) : null
          )}
          renderSampleStrip={(receipts, onThumbnailClick, isDisabled) => (
            isVisible && canvasContentEl ? createPortal(
              <div className="showcase-sample-strip" aria-label="Sample receipts">
                {receipts.map((receipt, index) => (
                  <button
                    key={receipt.id}
                    type="button"
                    className="strip-thumb"
                    onClick={() => onThumbnailClick(index)}
                    disabled={isDisabled}
                    aria-label={`Open picker at ${receipt.alt}`}
                  >
                    <img src={receipt.thumbSrc} alt="" draggable={false} />
                  </button>
                ))}
              </div>,
              canvasContentEl,
            ) : null
          )}
        />
      </div>

      <style jsx>{`
        .trace-demo-wrapper {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100%;
        }
        .trace-demo-content {
          width: 100%;
          max-width: 620px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .showcase-clear-button {
          position: absolute;
          right: 20px;
          bottom: 20px;
          z-index: 20;
        }

        /* Sample-receipt strip — independently positioned from
           the Clear button. See docs/trace/RECEIPT-PICKER-MODAL.md §7.
           Mobile: bottom-left corner (Y-aligned with Clear). Desktop:
           horizontally centered under the card. Both portaled to
           .canvas-content. */
        .showcase-sample-strip {
          position: absolute;
          left: 20px;
          bottom: 20px;
          z-index: 20;
          display: flex;
          flex-direction: row;
          gap: 10px;
          align-items: center;
        }
        @media (min-width: 769px) {
          .showcase-sample-strip {
            left: 50%;
            transform: translateX(-50%);
          }
        }

        /* Each thumbnail is a button so disabled gating works
           natively. 80px square on desktop, 64px on mobile. */
        .strip-thumb {
          width: 80px;
          height: 80px;
          padding: 0;
          border: none;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.7);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
          transition: opacity 150ms ease, transform 100ms ease, box-shadow 150ms ease;
        }
        .strip-thumb:hover:not(:disabled) {
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
        }
        .strip-thumb:active:not(:disabled) {
          transform: scale(0.97);
        }
        .strip-thumb:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .strip-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          user-select: none;
          -webkit-user-drag: none;
        }

        @media (max-width: 768px) {
          .showcase-clear-button {
            right: 8px;
            bottom: 8px;
          }
          .showcase-sample-strip {
            left: 8px;
            bottom: 8px;
            gap: 6px;
          }
          .strip-thumb {
            width: 64px;
            height: 64px;
          }
        }
      `}</style>
    </div>
  );
};
