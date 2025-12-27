// Format Text API Route
// Handles text formatting requests using OpenAI GPT-4o-mini

import { NextApiRequest, NextApiResponse } from 'next';
import { formatTranscription } from '../../../projects/clipperstream/api/textFormatter';
import { logger } from '../../../projects/clipperstream/utils/logger';

const log = logger.scope('API/format-text');

interface FormatRequest {
  rawText: string;
  existingFormattedContext?: string;
}

interface FormatResponse {
  formattedText: string;
  success: boolean;
}

interface ErrorResponse {
  error: string;
  details?: string;
  success: false;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FormatResponse | ErrorResponse>
) {
  log.debug('Request received', { method: req.method });

  // Only accept POST requests
  if (req.method !== 'POST') {
    log.warn('Invalid method', { method: req.method });
    return res.status(405).json({
      error: 'Method not allowed',
      details: 'This endpoint only accepts POST requests',
      success: false
    });
  }

  try {
    // Check for OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;
    log.debug('API key check', { hasKey: !!apiKey });

    if (!apiKey || apiKey === 'your_api_key_here') {
      log.error('Missing or invalid OpenAI API key');
      return res.status(500).json({
        error: 'Configuration error',
        details: 'OpenAI API key is not properly configured',
        success: false
      });
    }

    // Extract request data
    const { rawText, existingFormattedContext }: FormatRequest = req.body;

    // Validate raw text
    if (!rawText || rawText.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        details: 'Raw text cannot be empty',
        success: false
      });
    }

    log.debug('Calling formatter service', {
      rawLength: rawText.length,
      hasContext: !!existingFormattedContext
    });

    // Format the transcription
    const formattedText = await formatTranscription(
      rawText,
      apiKey,
      existingFormattedContext
    );

    log.info('Text formatted successfully');

    // Return formatted text
    return res.status(200).json({
      formattedText,
      success: true
    });

  } catch (error) {
    log.error('Error formatting text', error);

    return res.status(500).json({
      error: 'Formatting failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    });
  }
}

