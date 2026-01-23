/**
 * Trace API: Parse Receipt
 * Endpoint to process receipt images using Gemini AI
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { parseReceiptImage } from '@/projects/trace/services/geminiService';
import type { ExpenseEntry } from '@/projects/trace/types/trace.types';

interface RequestBody {
  base64Image: string;
  mimeType: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ExpenseEntry | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { base64Image, mimeType } = req.body as RequestBody;

    if (!base64Image || !mimeType) {
      return res.status(400).json({ error: 'Missing required fields: base64Image, mimeType' });
    }

    if (!mimeType.startsWith('image/')) {
      return res.status(400).json({ error: 'Invalid MIME type. Expected image/*' });
    }

    const entry = await parseReceiptImage(base64Image, mimeType);
    return res.status(200).json(entry);

  } catch (error) {
    console.error('Error parsing receipt:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to parse receipt'
    });
  }
}
