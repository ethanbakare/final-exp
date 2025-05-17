import { NextApiRequest, NextApiResponse } from 'next';
import formidable, { Fields, Files } from 'formidable';
import fs from 'fs';
import { processAudioWithDeepgram } from '../../../projects/ai-confidence-tracker/api/DeepgramApi';

// Define the shape of formidable file to help TypeScript
interface FormidableFile {
  filepath: string;
  path?: string; // for backward compatibility
  mimetype?: string;
  type?: string; // for backward compatibility
  size: number;
  [key: string]: unknown;
}

// Disable default body parser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// Parse form data with files
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check for Deepgram API key
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      console.error('Missing or invalid DeepGram API key');
      return res.status(500).json({ 
        error: 'Configuration error',
        details: 'DeepGram API key is not properly configured. Please add a valid API key to your .env.local file.'
      });
    }

    // Parse the incoming form data
    const { files } = await parseForm(req);
    
    console.log('Files received:', Object.keys(files)); // Debug log
    
    if (!files.audio) {
      return res.status(400).json({ 
        error: 'Invalid input',
        details: 'No audio file provided. Please try recording again.'
      });
    }
    
    // Handle both array and single file formats from formidable v3+
    const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;
    
    if (!audioFile) {
      return res.status(400).json({ 
        error: 'Invalid input',
        details: 'No audio file provided or invalid format. Please try recording again.'
      });
    }

    // Explicitly cast to the interface we defined with backward compatibility
    const typedAudioFile = audioFile as unknown as FormidableFile;
    
    // Support both filepath (new) and path (old) properties
    const filePath = typedAudioFile.filepath || typedAudioFile.path;
    const mimeType = typedAudioFile.mimetype || typedAudioFile.type || 'audio/wav';
    
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
        error: 'Empty audio',
        details: 'The recorded audio file is empty. Please try recording again with your microphone enabled.'
      });
    }
    
    console.log(`Processing audio file: ${filePath}, size: ${audioData.length} bytes, type: ${mimeType}`);

    // Process with DeepGram
    const result = await processAudioWithDeepgram(
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
    
    // Return the processed result
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Error processing audio:', error);
    
    // Provide more specific error messages based on the error type
    let errorMessage = 'Failed to process audio';
    let details = error instanceof Error ? error.message : 'Unknown error';
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'API key error';
      } else if (error.message.includes('mic') || error.message.includes('permission')) {
        errorMessage = 'Microphone error';
      } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        errorMessage = 'Connection timeout';
        details = 'The request to DeepGram API timed out. Please check your internet connection and try again.';
      }
    }
    
    return res.status(500).json({ 
      error: errorMessage,
      details: details
    });
  }
} 