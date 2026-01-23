/**
 * Trace Gemini Service
 * AI-powered expense parsing using Google Gemini
 */

import { GoogleGenAI, Type } from "@google/genai";
import type { ExpenseEntry } from '../types/trace.types';

/**
 * Get Gemini AI instance with API key validation
 */
function getGeminiAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'Gemini API key not found. Please set GEMINI_API_KEY in your .env.local file.'
    );
  }

  return new GoogleGenAI({ apiKey });
}

/**
 * JSON schema for expense entry validation
 */
const EXPENSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    date: { type: Type.STRING, description: 'YYYY-MM-DD format' },
    merchant: { type: Type.STRING, nullable: true },
    currency: { type: Type.STRING, description: 'ISO 4217 code (e.g. GBP, USD, EUR)' },
    total: { type: Type.NUMBER },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          quantity: { type: Type.NUMBER },
          name: { type: Type.STRING },
          unit_price: { type: Type.NUMBER },
          total_price: { type: Type.NUMBER },
          discount: { type: Type.NUMBER },
        },
        required: ["quantity", "name", "unit_price", "total_price", "discount"]
      }
    }
  },
  required: ["date", "currency", "total", "items"]
};

/**
 * Parse receipt image using Gemini AI
 */
export async function parseReceiptImage(base64Image: string, mimeType: string): Promise<ExpenseEntry> {
  const today = new Date().toISOString().split('T')[0];
  const ai = getGeminiAI();

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          text: `Extract structured data from this receipt.
          Rules:
          - FALLBACK DATE: Use today's date: ${today} if not found.
          - MERCHANT: Try to identify the business name accurately.
          - CURRENCY: Detect from symbols (£, $, €, etc). Defaults to GBP.
          - ACCURACY: Ensure quantity * unit_price - discount = total_price.
          - Return ONLY valid JSON.`
        },
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType
          }
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: EXPENSE_SCHEMA,
      thinkingConfig: { thinkingBudget: 0 }
    }
  });

  const text = response.text || '{}';
  const entry = JSON.parse(text) as Omit<ExpenseEntry, 'id' | 'source' | 'createdAt'>;

  return {
    ...entry,
    id: crypto.randomUUID(),
    source: 'camera',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Parse voice audio using Gemini AI
 * V1: Direct audio parsing (no transcription step)
 */
export async function parseVoiceAudio(base64Audio: string, mimeType: string): Promise<ExpenseEntry> {
  const today = new Date().toISOString().split('T')[0];

  // Validate mimeType
  if (!mimeType.startsWith('audio/')) {
    throw new Error('Invalid audio format. Expected audio/* MIME type.');
  }

  const ai = getGeminiAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          text: `Parse this spoken expense log into structured JSON.
          Rules:
          - DATE: Defaults to ${today}.
          - CURRENCY: Defaults to GBP unless specified.
          - ITEMS: Extract specific items and their prices.
          - If user says "it was five pounds for a coffee and three for a cake", total is 8.00.
          - Return ONLY valid JSON.`
        },
        {
          inlineData: {
            data: base64Audio,
            mimeType: mimeType
          }
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: EXPENSE_SCHEMA,
      thinkingConfig: { thinkingBudget: 0 }
    }
  });

  const textOutput = response.text || '{}';
  const entry = JSON.parse(textOutput) as Omit<ExpenseEntry, 'id' | 'source' | 'createdAt'>;

  return {
    ...entry,
    id: crypto.randomUUID(),
    source: 'voice',
    createdAt: new Date().toISOString(),
  };
}
