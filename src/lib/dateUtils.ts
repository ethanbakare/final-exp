export function calculateDaysLeft(startDate: string, duration: number): number {
  if (!startDate || !duration) return 0;
  
  const start = new Date(startDate);
  const today = new Date();
  
  // Reset time component to get accurate day difference
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  // Calculate days elapsed
  const daysElapsed = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate days left
  const daysLeft = Math.max(0, duration - daysElapsed);
  
  return daysLeft;
}

/**
 * Formats a date range string based on project start date and duration
 * @param startDate ISO string date (YYYY-MM-DD)
 * @param duration Number of days the project runs for
 * @returns Formatted date range string (e.g., "Apr 7th-10th")
 */
export function formatDateRange(startDate: string, duration: number): string {
  if (!startDate || !duration) return '';
  
  // Parse the start date
  const start = new Date(startDate);
  
  // Calculate the end date (start date + duration - 1)
  const end = new Date(startDate);
  end.setDate(start.getDate() + duration - 1);
  
  // Get the month abbreviation for the start date
  const startMonth = start.toLocaleString('default', { month: 'short' });
  
  // Get the day with ordinal suffix for both dates
  const startDay = addOrdinalSuffix(start.getDate());
  const endDay = addOrdinalSuffix(end.getDate());
  
  // If the dates span different months, include both months
  if (start.getMonth() !== end.getMonth()) {
    const endMonth = end.toLocaleString('default', { month: 'short' });
    return `${startMonth} ${startDay}-${endMonth} ${endDay}`;
  }
  
  // If in the same month, just use one month name
  return `${startMonth} ${startDay}-${endDay}`;
}

/**
 * Adds ordinal suffix to a number (1st, 2nd, 3rd, etc.)
 * @param day The day number
 * @returns The day with ordinal suffix
 */
function addOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return `${day}th`;
  
  switch (day % 10) {
    case 1: return `${day}st`;
    case 2: return `${day}nd`;
    case 3: return `${day}rd`;
    default: return `${day}th`;
  }
} 