/**
 * Sample receipts for the standalone /trace page: the thumbnail strip and the
 * picker modal, wired to TraceCore's onRequestSamplePicker + renderSampleStrip
 * props. The same flow as the showcase's TraceDemo (phase 2 in
 * docs/trace/RECEIPT-PICKER-MODAL.md): tap a thumbnail, the picker opens at it,
 * Upload closes the picker and runs the receipt through TraceCore's real image
 * pipeline. The modal mounts in TraceModalOverlay instead of the showcase's modal
 * layer, and the strip stays in the page flow instead of a portal to the canvas.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
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

const SLOW_MESSAGE_AFTER_MS = 300;
const DOWNLOAD_TIMEOUT_MS = 20000;
const LOADING_TEXT = 'Loading this receipt…';
const FAILED_TEXT = "Couldn't load receipt. Tap Upload to retry.";

// The overlay on this page is z-index 10001 (--trace-z-modal); the phone close button must be above it.
const CLOSE_BUTTON_Z_INDEX = 10002;

/** One sample download: its abort handle and timers live and die together. */
type UploadRun = { controller: AbortController; slowTimer: number; timeoutTimer: number };

const pickerFocusables = (): HTMLElement[] => {
  const closeButton = document.querySelector<HTMLElement>('.sample-picker-close-mobile');
  // An explicit list, in visual order: controls that are on screen whenever they exist. The carousel
  // slides are left out on purpose: most are faded or off screen, and the dots do the same job.
  const inside = document.querySelectorAll<HTMLElement>(
    '.picker-modal .close-btn, .picker-modal .dot, .picker-modal .upload-pill:not([disabled])',
  );
  // The phone close button is portaled to the body but is visually first; the hidden close has no boxes.
  return [closeButton, ...Array.from(inside)].filter((el): el is HTMLElement => !!el && el.getClientRects().length > 0);
};

export const useTraceSamplePicker = () => {
  const [controls, setControls] = useState<PickerControls | null>(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const isOpen = controls !== null;

  // The download in flight, if any: closing the picker aborts it, and a second tap is ignored.
  const runRef = useRef<UploadRun | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const finishRun = useCallback((run: UploadRun) => {
    window.clearTimeout(run.slowTimer);
    window.clearTimeout(run.timeoutTimer);
    if (runRef.current === run) runRef.current = null;
  }, []);

  const abortRun = useCallback(() => {
    const run = runRef.current;
    if (!run) return;
    finishRun(run);
    run.controller.abort();
  }, [finishRun]);

  useEffect(() => abortRun, [abortRun]);

  const handleOpen = useCallback((next: PickerControls) => {
    const active = document.activeElement;
    triggerRef.current = active instanceof HTMLElement && active !== document.body ? active : null;
    setUploadStatus('');
    setControls(next);
  }, []);

  const handleClose = useCallback(() => {
    abortRun();
    setUploadStatus('');
    controls?.cancel();
    setControls(null);
  }, [abortRun, controls]);

  // While the picker is open, Tab stays inside it and follows the visual order; closing
  // returns focus to the thumbnail that opened it.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const items = pickerFocusables();
      if (items.length === 0) return;
      e.preventDefault();
      const at = items.indexOf(document.activeElement as HTMLElement);
      const next = e.shiftKey ? (at <= 0 ? items.length - 1 : at - 1) : (at + 1) % items.length;
      items[next].focus();
    };
    document.addEventListener('keydown', onKeyDown);
    // Move focus into the picker once its portaled close button exists (it mounts a render
    // after the modal); that button is in the DOM at every width, hidden on desktop.
    let frame = 0;
    const focusFirstStop = (framesLeft: number) => {
      if (document.querySelector('.sample-picker-close-mobile') || framesLeft === 0) {
        pickerFocusables()[0]?.focus({ preventScroll: true });
      } else {
        frame = window.requestAnimationFrame(() => focusFirstStop(framesLeft - 1));
      }
    };
    frame = window.requestAnimationFrame(() => focusFirstStop(30));
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      triggerRef.current?.focus({ preventScroll: true });
      triggerRef.current = null;
    };
  }, [isOpen]);

  // Fetch the chosen receipt's PNG and wrap it in a File the same way a native
  // picker would deliver one, so the rest of the pipeline can't tell the difference.
  const handleUpload = useCallback(
    async (receipt: SampleReceipt) => {
      if (!controls || runRef.current) return;
      const controller = new AbortController();
      const run: UploadRun = {
        controller,
        slowTimer: window.setTimeout(() => {
          if (runRef.current === run) setUploadStatus(LOADING_TEXT);
        }, SLOW_MESSAGE_AFTER_MS),
        timeoutTimer: window.setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS),
      };
      runRef.current = run;
      setUploadStatus('');
      let file: File;
      try {
        const response = await fetch(receipt.src, { signal: controller.signal });
        if (!response.ok) throw new Error(String(response.status));
        const blob = await response.blob();
        file = new File([blob], `${receipt.id}.png`, { type: receipt.mimeType });
      } catch {
        // Could not load the sample: the picker stays open, so Upload can be tried again.
        if (runRef.current !== run) return; // closed while it loaded
        finishRun(run);
        setUploadStatus(FAILED_TEXT);
        return;
      }
      if (runRef.current !== run) return; // closed while it loaded
      finishRun(run);
      setUploadStatus('');
      setControls(null);
      await controls.selectReceipt(file);
    },
    [controls, finishRun],
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
          closeButtonZIndex={CLOSE_BUTTON_Z_INDEX}
          uploadStatus={uploadStatus}
          previewRetry
        />
      )}
    </TraceModalOverlay>
  );

  return { onRequestSamplePicker: handleOpen as (c: PickerControls) => void, renderSampleStrip, pickerModal };
};
