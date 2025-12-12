import { NextApiRequest, NextApiResponse } from 'next';
import formidable, { Fields, Files } from 'formidable';
import fs from 'fs';
import { transcribeAudio } from '../../../projects/clipperstream/api/deepgramProvider';

// Clipperstream Transcription API Route
// Handles audio file uploads and transcription using Deepgram Nova 3
// Following AI Confidence Tracker pattern

/* ============================================
   TYPES
   ============================================ */

interface FormidableFile {
  filepath: string;
  path?: string; // for backward compatibility
  mimetype?: string;
  type?: string; // for backward compatibility
  size: number;
  [key: string]: unknown;
}

/* ============================================
   CONFIGURATION
   ============================================ */

// Disable default body parser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

/* ============================================
   FORM PARSING
   ============================================ */

/**
 * Parse multipart form data with file upload
 */
const parseForm = async (req: NextApiRequest): Promise<{
  fields: Fields;
  files: Files;
}> => {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    });
    
    form.parse(req, (err: Error | null, fields: Fields, files: Files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
};

/* ============================================
   API HANDLER
   ============================================ */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      details: 'This endpoint only accepts POST requests'
    });
  }

  try {
    // Check for Deepgram API key
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      console.error('Missing or invalid Deepgram API key');
      return res.status(500).json({ 
        error: 'Configuration error',
        details: 'Deepgram API key is not properly configured. Please add a valid API key to your .env.local file.'
      });
    }

    // Parse the incoming form data
    const { files } = await parseForm(req);
    
    console.log('Files received:', Object.keys(files));
    
    if (!files.audio) {
      return res.status(400).json({ 
        error: 'No audio recorded',
        details: 'No audio file provided. Please try recording again.'
      });
    }
    
    // Handle both array and single file formats from formidable v3+
    const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;
    
    if (!audioFile) {
      return res.status(400).json({ 
        error: 'No audio recorded',
        details: 'No audio file provided or invalid format. Please try recording again.'
      });
    }

    // Explicitly cast to the interface we defined with backward compatibility
    const typedAudioFile = audioFile as unknown as FormidableFile;
    
    // Support both filepath (new) and path (old) properties
    const filePath = typedAudioFile.filepath || typedAudioFile.path;
    const mimeType = typedAudioFile.mimetype || typedAudioFile.type || 'audio/webm';
    
    if (!filePath) {
      return res.status(400).json({ 
        error: 'File error',
        details: 'Invalid file path. The uploaded file may be corrupted.'
      });
    }

    // Validate the file exists
    if (!fs.existsSync(filePath)) {
      return res.status(400).json({ 
        error: 'File error',
        details: 'Uploaded file not found. The temporary file may have been removed.'
      });
    }

    // Read the file
    const audioData = fs.readFileSync(filePath);
    
    // Validate audio data
    if (!audioData || audioData.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ 
        error: 'No audio recorded',
        details: 'The recorded audio file is empty. Please try recording again with your microphone enabled.'
      });
    }
    
    console.log(`Processing audio file: ${filePath}, size: ${audioData.length} bytes, type: ${mimeType}`);

    // Transcribe with Deepgram
    const result = await transcribeAudio(
      audioData,
      mimeType,
      apiKey
    );

    // Clean up temporary file
    try {
      fs.unlinkSync(filePath);
    } catch (unlinkError) {
      console.warn('Failed to clean up temporary file:', unlinkError);
      // Continue execution, as this is not critical
    }
    
    // Return the transcription result
    return res.status(200).json({
      transcript: result.transcript,
      duration: result.duration,
      success: true
    });
    
  } catch (error) {
    console.error('Error processing audio:', error);
    
    // Provide more specific error messages based on the error type
    let errorType = 'Transcription failed';
    let details = error instanceof Error ? error.message : 'Unknown error';
    
    if (error instanceof Error) {
      // Check for specific error patterns
      if (error.message.includes('No audio recorded') || error.message.includes('too short')) {
        errorType = 'No audio recorded';
      } else if (error.message.includes('No speech detected')) {
        errorType = 'No speech detected';
      } else if (error.message.includes('API key') || error.message.includes('Unauthorized')) {
        errorType = 'API key error';
      } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        errorType = 'Connection timeout';
        details = 'The request to Deepgram API timed out. Please check your internet connection and try again.';
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

