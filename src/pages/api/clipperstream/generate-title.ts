import { NextApiRequest, NextApiResponse } from 'next';
import { generateClipTitle } from '../../../projects/clipperstream/api/titleGenerator';
import { logger } from '../../../projects/clipperstream/utils/logger';

const log = logger.scope('API/generate-title');

// Clipperstream Title Generation API Route
// Generates AI-powered titles using OpenAI GPT-3.5
// Following transcribe.ts pattern

/* ============================================
   TYPES
   ============================================ */

interface TitleResponse {
  title: string;
  success: boolean;
}

interface ErrorResponse {
  error: string;
  details?: string;
  success: false;
}

/* ============================================
   API HANDLER
   ============================================ */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TitleResponse | ErrorResponse>
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
        details: 'OpenAI API key is not properly configured. Please add a valid API key to your .env.local file.',
        success: false
      });
    }

    // Extract transcription from request body
    const { transcription } = req.body;
    log.debug('Processing transcription', { length: transcription?.length || 0 });
    
    if (!transcription || typeof transcription !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid request',
        details: 'Transcription text is required',
        success: false
      });
    }

    // Validate transcription length
    if (transcription.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Invalid request',
        details: 'Transcription text cannot be empty',
        success: false
      });
    }

    // Generate title using OpenAI
    log.debug('Calling title generator service');
    const title = await generateClipTitle(transcription, apiKey);
    
    log.info('Title generated successfully', { title });
    
    // Return the generated title
    return res.status(200).json({
      title,
      success: true
    });
    
  } catch (error) {
    log.error('Error generating title', error);
    
    // Provide more specific error messages based on the error type
    let errorType = 'Title generation failed';
    let details = error instanceof Error ? error.message : 'Unknown error';
    
    if (error instanceof Error) {
      // Check for specific error patterns
      if (error.message.includes('API key') || error.message.includes('Unauthorized')) {
        errorType = 'API key error';
      } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        errorType = 'Connection timeout';
        details = 'The request to OpenAI API timed out. Please check your internet connection and try again.';
      } else if (error.message.includes('rate limit') || error.message.includes('quota')) {
        errorType = 'Rate limit exceeded';
      }
    }
    
    return res.status(500).json({ 
      error: errorType,
      details: details,
      success: false
    });
  }
}

