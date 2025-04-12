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