/**
 * Sample receipts for the standalone /trace page: the thumbnail strip and the
 * picker modal, wired to TraceCore's onRequestSamplePicker + renderSampleStrip
 * props. The same flow as the showcase's TraceDemo (phase 2 in
 * docs/trace/RECEIPT-PICKER-MODAL.md): tap a thumbnail, the picker opens at it,
 * Upload closes the picker and runs the receipt through TraceCore's real image
 * pipeline. The modal mounts in TraceModalOverlay instead of the showcase's modal
 * layer, and the strip stays in the page flow instead of a portal to the canvas.
 */
import React, { useCallback, useState } from 'react';
import { TraceModalOverlay } from './ui/TraceModalOverlay';
import { SampleReceiptPickerModal } from './ui/SampleReceiptPickerModal';
import type { SampleReceipt } from '../data/sample-receipts';

type PickerControls = {
  receipts: SampleReceipt[];
  initialIndex: number;
  selectReceipt: (file: File) => Promise<void>;
  cancel: () => void;
  subscribeIsDisabled: (callback: () => void) => () => void;
  getIsDisabled: () => boolean;
};

export const useTraceSamplePicker = () => {
  const [controls, setControls] = useState<PickerControls | null>(null);

  const handleClose = useCallback(() => {
    controls?.cancel();
    setControls(null);
  }, [controls]);

  // Fetch the chosen receipt's PNG and wrap it in a File the same way a native
  // picker would deliver one, so the rest of the pipeline can't tell the difference.
  const handleUpload = useCallback(
    async (receipt: SampleReceipt) => {
      if (!controls) return;
      const response = await fetch(receipt.src);
      const blob = await response.blob();
      const file = new File([blob], `${receipt.id}.png`, { type: receipt.mimeType });
      setControls(null);
      await controls.selectReceipt(file);
    },
    [controls],
  );

  const renderSampleStrip = useCallback(
    (receipts: SampleReceipt[], onThumbnailClick: (index: number) => void, isDisabled: boolean) => (
      <div className="trace-sample-strip" aria-label="Sample receipts">
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
        <style jsx>{`
          .trace-sample-strip {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 10px;
          }
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
            .trace-sample-strip {
              gap: 6px;
            }
            .strip-thumb {
              width: 38px;
              height: 38px;
            }
          }
        `}</style>
      </div>
    ),
    [],
  );

  const pickerModal = (
    <TraceModalOverlay isVisible={controls !== null} onClose={handleClose} closeOnBackdropClick={true}>
      {controls && (
        <SampleReceiptPickerModal
          receipts={controls.receipts}
          initialIndex={controls.initialIndex}
          onUpload={handleUpload}
          onClose={handleClose}
          subscribeIsDisabled={controls.subscribeIsDisabled}
          getIsDisabled={controls.getIsDisabled}
        />
      )}
    </TraceModalOverlay>
  );

  return { onRequestSamplePicker: setControls as (c: PickerControls) => void, renderSampleStrip, pickerModal };
};
