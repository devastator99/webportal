import { parse as dateFnsParse, format as dateFnsFormat, compareAsc, parseISO, isValid } from "date-fns";

/**
 * Safely parses a date string into a Date object
 * @param dateString The date string to parse
 * @returns A Date object or null if parsing fails
 */
export const safeParseDateString = (dateString: string | null): Date | null => {
  if (!dateString) return null;
  
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) {
      console.error(`Invalid date: ${dateString}`);
      return null;
    }
    return date;
  } catch (error) {
    console.error('Error parsing date string:', error);
    return null;
  }
};

/**
 * Formats a date to a database-friendly format (YYYY-MM-DD)
 * @param date The date to format
 * @returns A string in YYYY-MM-DD format
 */
export const formatDateForDatabase = (date: Date | string | null): string | null => {
  if (!date) return null;
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!isValid(dateObj)) {
      console.error(`Invalid date for database formatting: ${date}`);
      return null;
    }
    return dateFnsFormat(dateObj, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error formatting date for database:', error);
    return null;
  }
};

/**
 * Format a date for display in the UI (MM/DD/YYYY)
 * @param date The date to format
 * @returns A string in MM/DD/YYYY format or empty string if invalid
 */
export const formatDateForDisplay = (date: Date | string | null): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!isValid(dateObj)) {
      console.error(`Invalid date for display formatting: ${date}`);
      return '';
    }
    return dateFnsFormat(dateObj, 'MM/dd/yyyy');
  } catch (error) {
    console.error('Error formatting date for display:', error);
    return '';
  }
};

/**
 * Parse a display-formatted date (MM/DD/YYYY) into a Date object
 * @param displayDate The display-formatted date string
 * @returns A Date object or null if parsing fails
 */
export const parseDateFromDisplay = (displayDate: string): Date | null => {
  if (!displayDate) return null;
  
  try {
    // Parse MM/DD/YYYY format
    const parts = displayDate.split('/');
    if (parts.length !== 3) {
      console.error(`Invalid date format for parsing: ${displayDate}`);
      return null;
    }
    
    const month = parseInt(parts[0], 10) - 1; // Months are 0-based in JS Date
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    
    const date = new Date(year, month, day);
    
    if (isNaN(date.getTime())) {
      console.error(`Invalid date values for parsing: ${displayDate}`);
      return null;
    }
    
    return date;
  } catch (error) {
    console.error('Error parsing display date:', error);
    return null;
  }
};

/**
 * Debug helper to log date values
 * @param date The date to debug
 * @param label A label for the debug message
 */
export const debugDate = (date: any, label: string = 'Date debug'): void => {
  console.log(`${label}:`, {
    original: date,
    type: typeof date,
    isValid: date instanceof Date ? isValid(date) : 'not a date',
    asISO: date instanceof Date ? date.toISOString() : 'not a date',
    formatted: date instanceof Date ? formatDateForDatabase(date) : 'not a date'
  });
};

/**
 * Groups chat messages by date (YYYY-MM-DD)
 * @param messages Array of message objects with created_at field
 * @returns Object with date keys and arrays of messages
 */
export const groupMessagesByDate = (messages: any[]): Record<string, any[]> => {
  const groups: Record<string, any[]> = {};
  
  if (!Array.isArray(messages)) {
    console.error("groupMessagesByDate received non-array:", messages);
    return {};
  }
  
  messages.forEach(msg => {
    if (!msg || !msg.created_at) {
      console.error("Invalid message or missing created_at:", msg);
      return;
    }
    
    try {
      const date = parseISO(msg.created_at);
      if (!isValid(date)) {
        console.error("Invalid date in message:", msg.created_at);
        return;
      }
      
      // Use YYYY-MM-DD format for consistent key formatting
      const day = dateFnsFormat(date, 'yyyy-MM-dd');
      
      if (!groups[day]) {
        groups[day] = [];
      }
      
      groups[day].push(msg);
    } catch (error) {
      console.error("Error grouping message by date:", msg, error);
    }
  });
  
  // Sort the days in ascending order (oldest to newest)
  return Object.keys(groups)
    .sort()
    .reduce((acc, key) => {
      acc[key] = groups[key];
      return acc;
    }, {} as Record<string, any[]>);
};

/**
 * Sorts an array of objects by their date property
 * @param array Array to sort
 * @param dateField Name of the date field
 * @param ascending Sort order (true for ascending, false for descending)
 * @returns Sorted array
 */
export const sortByDate = <T>(
  array: T[], 
  dateField: keyof T, 
  ascending: boolean = true
): T[] => {
  if (!Array.isArray(array)) {
    console.error("sortByDate received non-array:", array);
    return [];
  }
  
  return [...array].sort((a, b) => {
    try {
      const valueA = a[dateField];
      const valueB = b[dateField];
      
      const dateA = typeof valueA === 'string' ? parseISO(valueA as string) : (valueA as unknown as Date);
      const dateB = typeof valueB === 'string' ? parseISO(valueB as string) : (valueB as unknown as Date);
      
      if (!isValid(dateA) || !isValid(dateB)) {
        console.error("Invalid date for sorting:", { valueA, valueB });
        return 0;
      }
      
      const comparison = compareAsc(dateA, dateB);
      return ascending ? comparison : -comparison;
    } catch (error) {
      console.error("Error comparing dates:", error);
      return 0;
    }
  });
};

/**
 * Formats a chat message timestamp for display
 * @param dateString The ISO date string to format
 * @returns Formatted date and time string
 */
export const formatChatMessageTime = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) {
      console.error(`Invalid date for chat message: ${dateString}`);
      return '';
    }
    
    const today = new Date();
    const messageDate = new Date(date);
    
    // If message is from today, only show time
    if (messageDate.toDateString() === today.toDateString()) {
      return dateFnsFormat(date, 'h:mm a');
    }
    
    // If message is from this year, show month, day and time
    if (messageDate.getFullYear() === today.getFullYear()) {
      return dateFnsFormat(date, 'MMM d, h:mm a');
    }
    
    // For older messages, show full date and time
    return dateFnsFormat(date, 'MMM d, yyyy h:mm a');
  } catch (error) {
    console.error('Error formatting chat message time:', error);
    return '';
  }
};

// Export other functions from the original file that we're not modifying
export { 
  parseISO, 
  dateFnsFormat as format, // Export format properly
  isValid
};
