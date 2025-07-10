
// Phoenix timezone utilities - Phoenix stays on MST year-round (UTC-7)
// No daylight saving time observed

export const PHOENIX_TIMEZONE = 'America/Phoenix';

// Create a date in Phoenix timezone
export const createPhoenixDate = (year: number, month: number, day: number): Date => {
  // Create date at noon Phoenix time to avoid DST edge cases
  const date = new Date();
  date.setFullYear(year, month, day);
  date.setHours(12, 0, 0, 0);
  return date;
};

// Get current date in Phoenix timezone
export const getCurrentPhoenixDate = (): Date => {
  const now = new Date();
  // Phoenix is always UTC-7 (no DST)
  const phoenixOffset = -7 * 60; // -7 hours in minutes
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const phoenixTime = new Date(utc + (phoenixOffset * 60000));
  return phoenixTime;
};

// Convert any date to Phoenix timezone for display
export const toPhoenixTime = (date: Date): Date => {
  const phoenixOffset = -7 * 60; // Phoenix is always UTC-7
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utc + (phoenixOffset * 60000));
};

// Format date for database storage (YYYY-MM-DD in Phoenix timezone)
export const formatPhoenixDateForDatabase = (date: Date): string => {
  const phoenixDate = toPhoenixTime(date);
  const year = phoenixDate.getFullYear();
  const month = String(phoenixDate.getMonth() + 1).padStart(2, '0');
  const day = String(phoenixDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Parse date from database as Phoenix date
export const parseDateFromDatabase = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return createPhoenixDate(year, month - 1, day); // month is 0-indexed
};

// Check if two dates are the same day in Phoenix timezone
export const isSameDayPhoenix = (date1: Date, date2: Date): boolean => {
  const phoenix1 = toPhoenixTime(date1);
  const phoenix2 = toPhoenixTime(date2);
  
  return phoenix1.getFullYear() === phoenix2.getFullYear() &&
         phoenix1.getMonth() === phoenix2.getMonth() &&
         phoenix1.getDate() === phoenix2.getDate();
};
