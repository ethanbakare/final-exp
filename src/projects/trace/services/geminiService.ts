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
 * Shared shape of a single expense entry. Used directly by the receipt
 * path (EXPENSE_SCHEMA) and as the array-item shape of the voice path
 * (VOICE_ENTRIES_SCHEMA). Keeping the fields/required in a single place
 * so the two schemas can never drift apart.
 */
const EXPENSE_ENTRY_PROPERTIES = {
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
};

const EXPENSE_ENTRY_REQUIRED = ["date", "currency", "total", "items"];

/**
 * JSON schema for a single expense entry (used by the receipt/image path).
 * Receipts are still one transaction per image, so the single-object shape
 * is the right fit for that path.
 */
const EXPENSE_SCHEMA = {
  type: Type.OBJECT,
  properties: EXPENSE_ENTRY_PROPERTIES,
  required: EXPENSE_ENTRY_REQUIRED,
};

/**
 * JSON schema for a list of expense entries (used by the voice/audio path).
 * A single recording can describe multiple purchases across multiple
 * merchants and multiple dates, so the voice path returns a wrapped list
 * `{ entries: [...] }`. We wrap in an object (rather than returning a bare
 * top-level array) because Gemini's structured output is noticeably more
 * reliable when the root is an object.
 */
const VOICE_ENTRIES_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    entries: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: EXPENSE_ENTRY_PROPERTIES,
        required: EXPENSE_ENTRY_REQUIRED,
      }
    }
  },
  required: ["entries"]
};

/**
 * True if a single entry is empty / contains no real expense data. Used
 * both for the single-object (receipt) path and to filter individual
 * entries out of the multi-entry (voice) response.
 */
function isEmptyEntry(entry: Record<string, unknown>): boolean {
  const items = entry.items as Array<unknown> | undefined;
  const total = entry.total as number | undefined;
  const hasNoItems = !items || items.length === 0;
  const hasNoTotal = !total || total === 0;
  return hasNoItems && hasNoTotal;
}

/**
 * Validate that Gemini's single-object response contains real expense data.
 * Rejects empty/zero responses that indicate non-receipt images or non-expense audio.
 */
function validateExpenseResponse(
  parsed: Record<string, unknown>,
  source: 'image' | 'audio'
): void {
  if (isEmptyEntry(parsed)) {
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
    model: 'gemini-3-flash-preview',
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
 * Parse voice audio using Gemini AI.
 *
 * V2: Multi-entry. A single recording can describe multiple purchases
 * across multiple merchants and multiple dates; this returns one
 * ExpenseEntry per unique (merchant, date) pair Gemini identifies.
 *
 * Partial-failure handling: individual empty entries (no items AND no
 * total) are dropped silently. NoExpenseDetectedError is only thrown
 * when EVERY entry in the batch is empty (i.e. Gemini heard no
 * expense-worthy content at all).
 *
 * The previous single-entry prompt is archived in
 * src/projects/trace/services/archived-prompts.ts for reference.
 */
export async function parseVoiceAudio(base64Audio: string, mimeType: string): Promise<ExpenseEntry[]> {
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
    model: 'gemini-3.1-flash-lite-preview',
    contents: {
      parts: [
        {
          text: `FIRST: Determine if this audio contains spoken expense or purchase information.
          If it does NOT (e.g. silence, music, unrelated conversation, background noise, or speech with no mention of prices/items/spending):
          - Return {"entries": []}.
          - Do NOT hallucinate or guess expense data from non-expense audio.

          If it DOES contain expense information, parse it into structured JSON using these rules:
          - DATE: Defaults to ${today}.
          - CURRENCY: Defaults to GBP unless specified.
          - ITEMS: Extract specific items and their prices.
          - FORMATTING: Item names MUST start with a capital letter (e.g., "Coffee", "Phone charger").
          - MULTIPLE ENTRIES: Return a list of entries under the "entries" key. Create ONE entry per unique (merchant, date) pair.
            Same merchant, same date, many items -> ONE entry with multiple items.
            Different merchants on the same date -> multiple entries, same date.
            Same merchant on different dates -> multiple entries, different dates.
          - MERCHANT: Only set "merchant" when the user explicitly names one. If the user doesn't mention a merchant for an item, leave that entry's merchant as null — do NOT guess or fabricate. If some items have a merchant and others don't, split them into separate entries.
            Example: "I got bread for two pounds and a coffee at Starbucks for five pounds" ->
              [{ "merchant": null, "items": [bread] }, { "merchant": "Starbucks", "items": [coffee] }]
          - If user says "it was five pounds for a coffee and three for a cake" (same merchant implied), that entry's total is 8.00.
          - Return ONLY valid JSON matching the schema.`
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
      responseSchema: VOICE_ENTRIES_SCHEMA,
      thinkingConfig: { thinkingBudget: 0 }
    }
  });

  console.log('[GEMINI SERVICE] parseVoiceAudio: Response received');
  const textOutput = response.text || '{"entries":[]}';
  console.log('[GEMINI SERVICE] parseVoiceAudio: Parsing JSON response');
  const parsed = JSON.parse(textOutput) as { entries?: Array<Record<string, unknown>> };

  const rawEntries = Array.isArray(parsed.entries) ? parsed.entries : [];

  // Drop empty entries (Gemini sometimes emits a stray empty item when
  // it's uncertain about part of the audio). If EVERY entry is empty,
  // we treat the whole recording as non-expense audio.
  const validEntries = rawEntries.filter((entry) => !isEmptyEntry(entry));

  if (validEntries.length === 0) {
    console.log('[GEMINI SERVICE] parseVoiceAudio: No valid entries in response');
    throw new NoExpenseDetectedError();
  }

  const createdAt = new Date().toISOString();
  const results: ExpenseEntry[] = validEntries.map((entry) => ({
    ...(entry as unknown as Omit<ExpenseEntry, 'id' | 'source' | 'createdAt'>),
    id: crypto.randomUUID(),
    source: 'voice' as const,
    createdAt,
  }));

  console.log('[GEMINI SERVICE] parseVoiceAudio: Success', {
    count: results.length,
    ids: results.map((r) => r.id),
    dropped: rawEntries.length - validEntries.length,
  });
  return results;
}
