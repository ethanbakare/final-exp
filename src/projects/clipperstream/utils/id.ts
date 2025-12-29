/**
 * Generates a unique random ID string
 * Format: alphanumeric, ~11-22 characters
 * Example: "k7h2j5n9p3d"
 */
export function randomId(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

/**
 * Generates a clip ID with timestamp + random component
 * Format: "clip-{timestamp}-{random}"
 * Example: "clip-1767021108321-k7h2j5n9p3d"
 */
export function generateClipId(): string {
  return `clip-${Date.now()}-${randomId()}`;
}

