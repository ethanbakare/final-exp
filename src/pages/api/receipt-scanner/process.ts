import { NextApiRequest, NextApiResponse } from 'next';
import * as formidable from 'formidable';
import * as fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';

// Hardcoding config values to avoid module resolution issues
const API_BASE_URL = 'http://localhost:8000';
const RECEIPT_PROCESS_ENDPOINT = '/api/receipts/process';

type File = formidable.File;

// Disable default body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse form with formidable
    const form = new formidable.IncomingForm({
      maxFileSize: 10 * 1024 * 1024, // 10MB max file size
    });
    
    const { fields, files } = await new Promise<{ 
      fields: formidable.Fields; 
      files: { file?: File | File[] };
    }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    // Get file and options
    const fileField = files.file;
    const file = Array.isArray(fileField) ? fileField[0] : fileField;
    
    // Validate file
    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/bmp'];
    const fileType = await getFileType(file.filepath);
    
    if (!validTypes.includes(fileType)) {
      return res.status(400).json({ 
        error: 'Invalid file type. Please upload a JPG, PNG, or BMP image.' 
      });
    }
    
    const advancedParsing = fields.advanced_parsing?.[0] === 'true';

    // Create form data for backend request using Node.js compatible FormData
    const formData = new FormData();
    formData.append(
      'file', 
      fs.createReadStream(file.filepath), 
      {
        filename: file.originalFilename || 'receipt.jpg',
        contentType: fileType
      }
    );
    formData.append('advanced_parsing', String(advancedParsing));

    // Forward to backend API
    try {
      const url = `${API_BASE_URL}${RECEIPT_PROCESS_ENDPOINT}`;
      const backendResponse = await axios.post(url, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 30000, // 30 second timeout
      });
      
      return res.status(200).json(backendResponse.data);
    } catch (error) {
      console.error('Backend API error:', error);
      if (axios.isAxiosError(error)) {
        return res.status(error.response?.status || 500).json({ 
          error: 'Failed to process receipt with backend API',
          detail: error.response?.data?.error || error.message
        });
      } else {
        return res.status(500).json({ 
          error: 'Failed to process receipt with backend API',
          detail: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  } catch (error) {
    console.error('Error processing receipt:', error);
    return res.status(500).json({ 
      error: 'Failed to process receipt',
      detail: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Utility to check file type from buffer
async function getFileType(filePath: string): Promise<string> {
  const buffer = fs.readFileSync(filePath, { encoding: null });
  
  // Check file signature
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
    return 'image/jpeg';
  }
  
  if (
    buffer[0] === 0x89 && 
    buffer[1] === 0x50 && 
    buffer[2] === 0x4E && 
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }
  
  if (buffer[0] === 0x42 && buffer[1] === 0x4D) {
    return 'image/bmp';
  }
  
  return 'application/octet-stream';
} 