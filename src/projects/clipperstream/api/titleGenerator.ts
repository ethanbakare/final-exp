// Title Generator Service
// Generates smart titles from transcription text using OpenAI GPT-3.5
// Following AI SDK pattern (like deepgramProvider.ts)

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { logger } from '../utils/logger';

const log = logger.scope('TitleGenerator');

/* ============================================
   GENERATE CLIP TITLE
   Uses OpenAI GPT-3.5 to create descriptive titles
   ============================================ */

export async function generateClipTitle(
  transcription: string,
  apiKey: string
): Promise<string> {
  log.debug('Starting title generation', {
    transcriptionLength: transcription.length,
    hasApiKey: !!apiKey
  });
  
  try {
    // Validate inputs
    if (!transcription || transcription.trim().length === 0) {
      log.warn('Empty transcription provided, returning fallback');
      return 'New Recording';
    }
    
    if (!apiKey) {
      log.error('OpenAI API key is required');
      return 'New Recording';
    }
    
    // Configure OpenAI client with API key
    log.debug('Creating OpenAI client');
    const openaiClient = createOpenAI({
      apiKey: apiKey,
    });
    
    // Generate title using AI SDK
    log.debug('Calling OpenAI generateText API');
    const { text } = await generateText({
      model: openaiClient('gpt-3.5-turbo'),
      prompt: `Generate a short, descriptive title (max 6 words) for this voice note transcript. Be specific and capture the main topic. Do not use quotes.

Transcript: ${transcription.substring(0, 500)}`,
      temperature: 0.3, // Low temperature for consistent, focused titles
    });
    
    // Clean and validate result
    const title = text.trim();
    
    if (!title || title.length === 0) {
      log.warn('OpenAI returned empty title, using fallback');
      return 'New Recording';
    }
    
    // Remove quotes if present (despite instruction not to use them)
    const cleanTitle = title.replace(/^["']|["']$/g, '');
    
    log.info('Title generated successfully', { title: cleanTitle });
    return cleanTitle;
    
  } catch (error) {
    log.error('Title generation failed', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        log.error('OpenAI API key is invalid or missing');
      } else if (error.message.includes('rate limit') || error.message.includes('quota')) {
        log.error('OpenAI API rate limit exceeded');
      } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        log.error('OpenAI API request timed out');
      }
    }
    
    // Always return fallback title
    return 'New Recording';
  }
}

