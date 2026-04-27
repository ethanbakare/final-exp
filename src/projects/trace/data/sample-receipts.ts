/**
 * Sample receipts for the Trace upload picker.
 *
 * Used in two places (eventually):
 *   - The showcase TraceDemo's thumbnail strip + receipt-picker modal
 *     (phase 1 — see docs/trace/RECEIPT-PICKER-MODAL.md).
 *   - The standalone /trace page's equivalent picker (phase 2).
 *
 * Two assets per receipt:
 *   - `thumbSrc`: small WebP (~200x200, ~5 KB) for the strip thumbnail.
 *     Lightweight, paint-fast on the demo card.
 *   - `src`: full-resolution transparent-background PNG. Shown inside
 *     the modal preview AND used as the upload payload sent to
 *     /api/trace/parse-receipt. Trace's API doesn't accept WebP, so
 *     PNG is the source-of-truth here.
 *
 * Both assets are produced by the cleanup pipeline at
 * docs/skills/remove-bg.md (rembg + EXIF rotate + 1500px max edge)
 * plus a square center-crop + cwebp pass for the thumb.
 *
 * Captions describe the real-world condition each receipt represents
 * — what makes it a useful test case for the AI's receipt-parsing
 * pipeline. Drafts in place; refine as needed.
 */

export interface SampleReceipt {
  /** Stable identifier — used as the React key and in commit logs. */
  id: string;
  /** Full-resolution PNG path (relative to /public). Upload payload + modal preview. */
  src: string;
  /** WebP thumbnail path (relative to /public). Strip-rendered. */
  thumbSrc: string;
  /** Screen-reader label for both thumb and modal preview. */
  alt: string;
  /** Short descriptive line shown at the top of the modal — frames the
   *  receipt as a representative test case rather than just naming it. */
  caption: string;
  /** MIME type of the upload payload. The cleanup pipeline always
   *  emits PNG, so this is hardcoded. */
  mimeType: 'image/png';
}

export const SAMPLE_RECEIPTS: SampleReceipt[] = [
  {
    id: 'tesco-1',
    src: '/images/receipts-cutout/tesco-1.png',
    thumbSrc: '/images/receipts-cutout/thumbs/tesco-1.webp',
    alt: 'Heavily crumpled Tesco receipt with creased line items',
    caption: 'Crumpled receipt — creases obscure some values.',
    mimeType: 'image/png',
  },
  {
    id: 'tesco-2',
    src: '/images/receipts-cutout/tesco-2.png',
    thumbSrc: '/images/receipts-cutout/thumbs/tesco-2.webp',
    alt: 'Tesco receipt with slight thermal-paper fade near the footer',
    caption: 'Well-shot but slight fading near the footer.',
    mimeType: 'image/png',
  },
  {
    id: 'tesco-3',
    src: '/images/receipts-cutout/tesco-3.png',
    thumbSrc: '/images/receipts-cutout/thumbs/tesco-3.webp',
    alt: 'Dimly lit Tesco receipt with fading lower values',
    caption: 'Dimly lit receipt with fading values.',
    mimeType: 'image/png',
  },
  {
    id: 'sainsburys',
    src: '/images/receipts-cutout/sainsburys.png',
    thumbSrc: '/images/receipts-cutout/thumbs/sainsburys.webp',
    alt: "Clean, well-lit Sainsbury's receipt with all values legible",
    caption: 'Clean shot — different store, values strongly visible.',
    mimeType: 'image/png',
  },
];
