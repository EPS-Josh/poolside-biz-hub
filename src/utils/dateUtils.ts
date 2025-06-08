
// Utility functions for consistent date handling in MST
export const createMSTDate = (year: number, month: number, day: number): Date => {
  // Create date in MST by using local timezone (assuming user is in MST)
  return new Date(year, month, day);
};

export const formatDateForDatabase = (date: Date): string => {
  // Format date as YYYY-MM-DD for database storage
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseDateFromDatabase = (dateString: string): Date => {
  // Parse date string from database (YYYY-MM-DD) as local date
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
};

export const getCurrentMSTDate = (): Date => {
  // Get current date in MST
  return new Date();
};
