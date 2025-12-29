/**
 * Returns formatted date string for current day
 * Format: "Dec 29, 2025"
 */
export function today(): string {
  return new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Formats a timestamp to date string
 * @param timestamp - Unix timestamp in milliseconds
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

