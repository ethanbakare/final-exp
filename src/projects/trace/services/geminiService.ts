/**
 * Trace Gemini Service
 * AI-powered expense parsing using Google Gemini
 *
 * Architecture:
 * - Single API call per submission (no separate pre-classifier)
 * - Prompt includes a classification gate: "Is this a receipt/expense?" → if NO, return empty
 * - Response validated server-side: empty items + zero total = rejection
 * - Custom error classes allow the API route to return specific error types to the client
 */

import { GoogleGenAI, Type } from "@google/genai";
import type { ExpenseEntry } from '../types/trace.types';

/* ============================================
   CUSTOM ERRORS — Allow API routes to distinguish
   between "not a receipt" vs "no expense in audio"
   vs generic failures
   ============================================ */

export class NotAReceiptError extends Error {
  constructor() { super('not_a_receipt'); this.name = 'NotAReceiptError'; }
}

export class NoExpenseDetectedError extends Error {
  constructor() { super('no_expense'); this.name = 'NoExpenseDetectedError'; }
}

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
    date: { type: Type.STRING, description: 'YYYY-MM-DD format. Empty string if not a receipt.' },
    merchant: { type: Type.STRING, nullable: true },
    currency: { type: Type.STRING, description: 'ISO 4217 code (e.g. GBP, USD, EUR). Empty string if not a receipt.' },
    total: { type: Type.NUMBER, description: '0 if not a receipt or no expense detected.' },
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
 * Validate that Gemini's response contains real expense data.
 * Rejects empty/zero responses that indicate non-receipt images or non-expense audio.
 */
function validateExpenseResponse(
  parsed: Record<string, unknown>,
  source: 'image' | 'audio'
): void {
  const items = parsed.items as Array<unknown> | undefined;
  const total = parsed.total as number | undefined;

  const hasNoItems = !items || items.length === 0;
  const hasNoTotal = !total || total === 0;

  if (hasNoItems && hasNoTotal) {
    if (source === 'image') {
      throw new NotAReceiptError();
    } else {
      throw new NoExpenseDetectedError();
    }
  }
}

/**
 * Parse receipt image using Gemini AI
 */
export async function parseReceiptImage(base64Image: string, mimeType: string): Promise<ExpenseEntry> {
  console.log('[GEMINI SERVICE] parseReceiptImage: Starting', {
    imageLength: base64Image.length,
    mimeType
  });

  const today = new Date().toISOString().split('T')[0];

  console.log('[GEMINI SERVICE] parseReceiptImage: Getting Gemini AI instance...');
  const ai = getGeminiAI();
  console.log('[GEMINI SERVICE] parseReceiptImage: Gemini AI instance created');

  console.log('[GEMINI SERVICE] parseReceiptImage: Calling Gemini API...');
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash',
    contents: {
      parts: [
        {
          text: `FIRST: Determine if this image contains a receipt, invoice, bill, or financial document.
          If it does NOT (e.g. photo of a person, animal, object, screenshot, blank page, or any non-financial document):
          - Return {"date": "", "merchant": null, "currency": "", "total": 0, "items": []}.
          - Do NOT attempt to extract expense data from non-receipt images.

          If it IS a receipt/invoice/bill, extract structured data using these rules:
          - FALLBACK DATE: Use today's date: ${today} if not found.
          - MERCHANT: Try to identify the business name accurately.
          - CURRENCY: Detect from symbols (£, $, €, etc). Defaults to GBP.
          - FORMATTING: Item names MUST start with a capital letter (e.g., "Coffee", "Milk").
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

  console.log('[GEMINI SERVICE] parseReceiptImage: Response received');
  const text = response.text || '{}';
  console.log('[GEMINI SERVICE] parseReceiptImage: Parsing JSON response');
  const parsed = JSON.parse(text);

  // Validate: reject non-receipt images
  validateExpenseResponse(parsed, 'image');

  const entry = parsed as Omit<ExpenseEntry, 'id' | 'source' | 'createdAt'>;

  const result = {
    ...entry,
    id: crypto.randomUUID(),
    source: 'camera' as const,
    createdAt: new Date().toISOString(),
  };

  console.log('[GEMINI SERVICE] parseReceiptImage: Success', { id: result.id });
  return result;
}

/**
 * Parse voice audio using Gemini AI
 * V1: Direct audio parsing (no transcription step)
 */
export async function parseVoiceAudio(base64Audio: string, mimeType: string): Promise<ExpenseEntry> {
  console.log('[GEMINI SERVICE] parseVoiceAudio: Starting', {
    audioLength: base64Audio.length,
    mimeType
  });

  const today = new Date().toISOString().split('T')[0];

  // Validate mimeType
  if (!mimeType.startsWith('audio/')) {
    console.error('[GEMINI SERVICE] parseVoiceAudio: Invalid MIME type:', mimeType);
    throw new Error('Invalid audio format. Expected audio/* MIME type.');
  }

  console.log('[GEMINI SERVICE] parseVoiceAudio: Getting Gemini AI instance...');
  const ai = getGeminiAI();
  console.log('[GEMINI SERVICE] parseVoiceAudio: Gemini AI instance created');

  console.log('[GEMINI SERVICE] parseVoiceAudio: Calling Gemini API...');
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash',
    contents: {
      parts: [
        {
          text: `FIRST: Determine if this audio contains spoken expense or purchase information.
          If it does NOT (e.g. silence, music, unrelated conversation, background noise, or speech with no mention of prices/items/spending):
          - Return {"date": "", "merchant": null, "currency": "", "total": 0, "items": []}.
          - Do NOT hallucinate or guess expense data from non-expense audio.

          If it DOES contain expense information, parse it into structured JSON using these rules:
          - DATE: Defaults to ${today}.
          - CURRENCY: Defaults to GBP unless specified.
          - ITEMS: Extract specific items and their prices.
          - FORMATTING: Item names MUST start with a capital letter (e.g., "Coffee", "Phone charger").
          - MERCHANT: If all items from same merchant, extract to merchant field. If multiple merchants, incorporate naturally into item names where appropriate (e.g., "Starbucks coffee", "Nando's chicken"). If merchant doesn't fit naturally, use brackets (e.g., "Charger (Argos)") or omit.
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

  console.log('[GEMINI SERVICE] parseVoiceAudio: Response received');
  const textOutput = response.text || '{}';
  console.log('[GEMINI SERVICE] parseVoiceAudio: Parsing JSON response');
  const parsed = JSON.parse(textOutput);

  // Validate: reject non-expense audio
  validateExpenseResponse(parsed, 'audio');

  const entry = parsed as Omit<ExpenseEntry, 'id' | 'source' | 'createdAt'>;

  const result = {
    ...entry,
    id: crypto.randomUUID(),
    source: 'voice' as const,
    createdAt: new Date().toISOString(),
  };

  console.log('[GEMINI SERVICE] parseVoiceAudio: Success', { id: result.id });
  return result;
}
