/**
 * Trace — Archived / Deprecated Gemini Prompts
 *
 * This file is a graveyard for prompts that were removed from the live
 * service but are worth keeping around for reference, comparison, or
 * rollback. Nothing in here is imported by the runtime — it exists purely
 * as version control of the prompt text itself, with dated notes on why
 * each one was retired.
 *
 * If you add a new deprecated prompt, prepend a short header with the
 * date it was deprecated, the reason, and (if applicable) the commit /
 * PR that replaced it.
 */

/* ============================================================================
 * VOICE PROMPT v1 — Single-Entry (deprecated 2026-04-11)
 * ----------------------------------------------------------------------------
 * Used with: EXPENSE_SCHEMA (single object, one merchant, one date)
 * Replaced by: VOICE_ENTRIES_SCHEMA (list of entries, one per merchant×date)
 *
 * Why deprecated:
 *   The "If multiple merchants, incorporate naturally into item names" rule
 *   forced Gemini to squash multi-merchant recordings into a single entry
 *   (e.g. "Starbucks coffee" as an item name under a null merchant). This
 *   made it impossible for the user to record more than one merchant or
 *   more than one date in a single audio clip — the first merchant/date
 *   would be silently lost. The downstream grouping logic in
 *   src/projects/trace/utils/dataUtils.ts already supported multiple
 *   ExpenseEntry objects per day and per merchant; the only bottleneck was
 *   this single-object schema at the Gemini boundary.
 * ============================================================================ */

export const VOICE_PROMPT_V1_SINGLE_ENTRY = (today: string) => `FIRST: Determine if this audio contains spoken expense or purchase information.
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
          - Return ONLY valid JSON.`;
