import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { Fields, Files, File as FormidableFile } from 'formidable';
import fs from 'fs';

// Disable body parser for file upload
export const config = {
  api: {
    bodyParser: false,
  },
};

type TranscriptionResponse = {
  text: string;
  confidence?: number;
  duration?: number;
};

type ErrorResponse = {
  error: string;
  details?: string;
};

/**
 * Parse form data
 */
const parseForm = async (req: NextApiRequest): Promise<{ fields: Fields; files: Files }> => {
  const form = formidable({ keepExtensions: true });
  
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
};

/**
 * Deepgram batch transcription endpoint
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TranscriptionResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get API key
    const apiKey = process.env.DEEPGRAM_API_KEY;
    
    if (!apiKey || apiKey === 'your_api_key_here') {
      console.error('Missing Deepgram API key');
      return res.status(500).json({ 
        error: 'Configuration error',
        details: 'Deepgram API key not configured'
      });
    }

    // Parse form data
    const { files } = await parseForm(req);
    
    if (!files.audio) {
      return res.status(400).json({ 
        error: 'No audio file',
        details: 'Please provide audio file in "audio" field'
      });
    }

    // Handle array or single file
    const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;
    const typedAudioFile = audioFile as unknown as FormidableFile;
    
    // Read audio file
    const filePath = typedAudioFile.filepath || (typedAudioFile as any).path;
    const audioBuffer = fs.readFileSync(filePath);
    const mimeType = typedAudioFile.mimetype || typedAudioFile.type || 'audio/webm';

    console.log(`Transcribing audio: ${audioBuffer.length} bytes, ${mimeType}`);

    // Call Deepgram REST API
    const response = await fetch(
      'https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true',
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': mimeType,
        },
        body: audioBuffer,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Deepgram error:', errorText);
      throw new Error(`Deepgram API error: ${response.status}`);
    }

    const result = await response.json();

    // Extract transcript
    const transcript = result.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
    const confidence = result.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0;
    const duration = result.metadata?.duration || 0;

    if (!transcript) {
      return res.status(400).json({
        error: 'No speech detected',
        details: 'Could not detect any speech in the audio'
      });
    }

    console.log(`Transcription successful: "${transcript}"`);

    // Clean up temp file
    fs.unlinkSync(filePath);

    return res.status(200).json({
      text: transcript,
      confidence,
      duration
    });

  } catch (error) {
    console.error('Transcription error:', error);
    return res.status(500).json({ 
      error: 'Transcription failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
