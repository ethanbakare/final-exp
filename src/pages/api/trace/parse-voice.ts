/**
 * Trace API: Parse Voice
 * Endpoint to process voice audio using Gemini AI
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { parseVoiceAudio } from '@/projects/trace/services/geminiService';
import type { ExpenseEntry } from '@/projects/trace/types/trace.types';

interface RequestBody {
  base64Audio: string;
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
    const { base64Audio, mimeType } = req.body as RequestBody;

    if (!base64Audio || !mimeType) {
      return res.status(400).json({ error: 'Missing required fields: base64Audio, mimeType' });
    }

    if (!mimeType.startsWith('audio/')) {
      return res.status(400).json({ error: 'Invalid MIME type. Expected audio/*' });
    }

    const entry = await parseVoiceAudio(base64Audio, mimeType);
    return res.status(200).json(entry);

  } catch (error) {
    console.error('Error parsing voice:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to parse voice'
    });
  }
}
