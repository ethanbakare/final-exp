/**
 * Trace Data Utilities
 * Helper functions for data transformation and grouping
 */

import type { ExpenseEntry } from '../types/trace.types';

/**
 * Group expense entries by day
 * Returns an array formatted for FinanceBox component
 */
export function groupEntriesByDay(entries: ExpenseEntry[]): any[] {
  // Group entries by date
  const grouped = entries.reduce((acc, entry) => {
    const date = entry.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, ExpenseEntry[]>);

  // Convert to Day array
  const days: any[] = Object.entries(grouped).map(([date, dayEntries]) => {
    // Group by merchant within the day
    const merchantsMap = dayEntries.reduce((acc, entry) => {
      const merchantName = entry.merchant || 'Unknown Merchant';
      if (!acc[merchantName]) {
        acc[merchantName] = [];
      }
      acc[merchantName].push(entry);
      return acc;
    }, {} as Record<string, ExpenseEntry[]>);

    // Convert to Merchant array
    const merchants: any[] = Object.entries(merchantsMap).map(([merchantName, merchantEntries]) => {
      // Calculate merchant total from all entries for that merchant
      const merchantTotal = merchantEntries.reduce((sum, entry) => sum + entry.total, 0);

      // Flatten all items from all entries for this merchant
      // Map to the format FinanceBox components expect
      const allItems = merchantEntries.flatMap(entry =>
        entry.items.map(item => ({
          quantity: item.quantity.toString() + 'x',
          itemName: item.name,
          netPrice: item.total_price.toFixed(2),
          discount: item.discount > 0 ? item.discount.toFixed(2) : undefined,
        }))
      );

      return {
        merchantName: merchantName === 'Unknown Merchant' ? undefined : merchantName,
        merchantTotal: merchantTotal.toFixed(2),
        items: allItems,
      };
    });

    // Calculate day total from all entries
    const dayTotal = dayEntries.reduce((sum, entry) => sum + entry.total, 0);

    return {
      date: formatDate(date), // Formatted for display (e.g., "27th Jan")
      dateOriginal: date, // Keep original ISO format for sorting (e.g., "2026-01-27")
      total: dayTotal.toFixed(2),
      currency: dayEntries[0]?.currency || 'GBP',
      merchants,
    };
  });

  // Sort by date descending (most recent first) using original ISO date
  return days.sort((a, b) => {
    const dateA = new Date(a.dateOriginal);
    const dateB = new Date(b.dateOriginal);
    return dateB.getTime() - dateA.getTime();
  });
}

/**
 * Format date from YYYY-MM-DD to "14th Jul" format
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });

  // Add ordinal suffix (st, nd, rd, th)
  const ordinal = getOrdinalSuffix(day);

  return `${day}${ordinal} ${month}`;
}

/**
 * Get ordinal suffix for a day number
 */
function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}
