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
import { SampleReceiptPickerModal } from '@/projects/trace/components/ui/SampleReceiptPickerModal';
import type { SampleReceipt } from '@/projects/trace/data/sample-receipts';
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

  // Sample-receipt picker modal wiring. TraceCore calls this when the
  // user clicks a strip thumbnail. We open the showcase modal layer
  // with SampleReceiptPickerModal as the content, threading through:
  //   - the receipts array + initialIndex (which thumbnail was clicked)
  //   - the external-store pair (subscribeIsDisabled / getIsDisabled)
  //     so the modal's Upload button can dim live if navbarState
  //     flips mid-modal — see RECEIPT-PICKER-MODAL.md §5.3.2
  //   - onUpload: currently a no-op; commit 6 connects it to
  //     controls.selectReceipt to run the chosen receipt through
  //     TraceCore's processImageFile pipeline
  //   - onClose: closeModal() from the showcase context
  const handleSamplePickerRequest = useCallback((controls: {
    receipts: SampleReceipt[];
    initialIndex: number;
    selectReceipt: (file: File) => Promise<void>;
    cancel: () => void;
    subscribeIsDisabled: (callback: () => void) => () => void;
    getIsDisabled: () => boolean;
  }) => {
    const handleClose = () => {
      controls.cancel();
      closeModal();
    };

    // Upload handler — fetch the chosen receipt's PNG, wrap it in a
    // File the same way a native picker would deliver one, close the
    // modal, then hand it to TraceCore's processImageFile via
    // controls.selectReceipt. From here, the rest of the pipeline
    // (state transitions, /api/trace/parse-receipt, entry rendering)
    // is identical to a real file-picker upload — the API never knows
    // the difference.
    const handleUpload = async (receipt: SampleReceipt) => {
      const response = await fetch(receipt.src);
      const blob = await response.blob();
      const file = new File([blob], `${receipt.id}.png`, { type: receipt.mimeType });
      closeModal();
      await controls.selectReceipt(file);
    };

    openModal({
      closeOnBackdropClick: true,
      onRequestClose: handleClose,
      content: (
        <SampleReceiptPickerModal
          receipts={controls.receipts}
          initialIndex={controls.initialIndex}
          onUpload={handleUpload}
          onClose={handleClose}
          subscribeIsDisabled={controls.subscribeIsDisabled}
          getIsDisabled={controls.getIsDisabled}
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
          onRequestSamplePicker={handleSamplePickerRequest}
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
           natively. 44px square on desktop, 38px on mobile. */
        .strip-thumb {
          width: 44px;
          height: 44px;
          padding: 0;
          border: none;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.7);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
          /* Emil's strong ease-out — built-in CSS curves are too weak.
             See docs/skills/emil-design-eng.md. */
          transition:
            opacity 200ms cubic-bezier(0.23, 1, 0.32, 1),
            transform 100ms cubic-bezier(0.23, 1, 0.32, 1),
            box-shadow 200ms cubic-bezier(0.23, 1, 0.32, 1);
        }
        @media (hover: hover) and (pointer: fine) {
          .strip-thumb:hover:not(:disabled) {
            box-shadow: 0 3px 8px rgba(0, 0, 0, 0.22);
            transform: translateY(-1px);
          }
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
            width: 38px;
            height: 38px;
          }
        }
      `}</style>
    </div>
  );
};
