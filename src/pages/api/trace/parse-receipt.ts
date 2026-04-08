/**
 * Trace API: Parse Receipt
 * Endpoint to process receipt images using Gemini AI
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { parseReceiptImage, NotAReceiptError } from '@/projects/trace/services/geminiService';
import type { ExpenseEntry } from '@/projects/trace/types/trace.types';

interface RequestBody {
  base64Image: string;
  mimeType: string;
}

// Increase body size limit to 10MB for image uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ExpenseEntry | { error: string }>
) {
  console.log('[TRACE API] parse-receipt: Request received');

  if (req.method !== 'POST') {
    console.log('[TRACE API] parse-receipt: Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { base64Image, mimeType } = req.body as RequestBody;
    console.log('[TRACE API] parse-receipt: Request body received', {
      hasImage: !!base64Image,
      imageLength: base64Image?.length || 0,
      mimeType
    });

    if (!base64Image || !mimeType) {
      console.log('[TRACE API] parse-receipt: Missing required fields');
      return res.status(400).json({ error: 'Missing required fields: base64Image, mimeType' });
    }

    if (!mimeType.startsWith('image/')) {
      console.log('[TRACE API] parse-receipt: Invalid MIME type:', mimeType);
      return res.status(400).json({ error: 'Invalid MIME type. Expected image/*' });
    }

    console.log('[TRACE API] parse-receipt: Calling parseReceiptImage...');
    const entry = await parseReceiptImage(base64Image, mimeType);
    console.log('[TRACE API] parse-receipt: Successfully parsed entry:', entry.id);

    return res.status(200).json(entry);

  } catch (error) {
    // Not a receipt — return 422 with specific error type
    if (error instanceof NotAReceiptError) {
      console.log('[TRACE API] parse-receipt: Not a receipt');
      return res.status(422).json({ error: 'not_a_receipt' });
    }

    console.error('[TRACE API] parse-receipt: ERROR:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to parse receipt'
    });
  }
}
