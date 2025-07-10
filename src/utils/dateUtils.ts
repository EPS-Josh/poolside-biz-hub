
// Updated utility functions for consistent Phoenix timezone date handling
import { 
  createPhoenixDate, 
  getCurrentPhoenixDate, 
  formatPhoenixDateForDatabase, 
  parseDateFromDatabase as parsePhoenixDate 
} from './phoenixTimeUtils';

// Use Phoenix-specific functions for consistency
export const createMSTDate = createPhoenixDate;
export const getCurrentMSTDate = getCurrentPhoenixDate;
export const formatDateForDatabase = formatPhoenixDateForDatabase;
export const parseDateFromDatabase = parsePhoenixDate;
