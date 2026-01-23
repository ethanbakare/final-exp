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
  console.log('[TRACE API] parse-voice: Request received');

  if (req.method !== 'POST') {
    console.log('[TRACE API] parse-voice: Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { base64Audio, mimeType } = req.body as RequestBody;
    console.log('[TRACE API] parse-voice: Request body received', {
      hasAudio: !!base64Audio,
      audioLength: base64Audio?.length || 0,
      mimeType
    });

    if (!base64Audio || !mimeType) {
      console.log('[TRACE API] parse-voice: Missing required fields');
      return res.status(400).json({ error: 'Missing required fields: base64Audio, mimeType' });
    }

    if (!mimeType.startsWith('audio/')) {
      console.log('[TRACE API] parse-voice: Invalid MIME type:', mimeType);
      return res.status(400).json({ error: 'Invalid MIME type. Expected audio/*' });
    }

    console.log('[TRACE API] parse-voice: Calling parseVoiceAudio...');
    const entry = await parseVoiceAudio(base64Audio, mimeType);
    console.log('[TRACE API] parse-voice: Successfully parsed entry:', entry.id);

    return res.status(200).json(entry);

  } catch (error) {
    console.error('[TRACE API] parse-voice: ERROR:', error);
    console.error('[TRACE API] parse-voice: Error stack:', error instanceof Error ? error.stack : 'No stack');
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to parse voice'
    });
  }
}
