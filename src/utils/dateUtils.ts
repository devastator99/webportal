
import { parse as dateFnsParse, format as dateFnsFormat, compareAsc } from "date-fns";

/**
 * Parses a time string into a Date object
 * @param timeString The time string in HH:mm format
 * @param format The format string to use for parsing
 * @param referenceDate The reference date to use
 * @returns A Date object containing the parsed time
 */
export const parseTime = (
  timeString: string, 
  format: string, 
  referenceDate: Date
): Date => {
  return dateFnsParse(timeString, format, referenceDate);
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
    console.log("Formatting for DB:", dateObj);
    return dateFnsFormat(dateObj, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error formatting date for database:', error);
    return null;
  }
};

/**
 * Safely parses a date string into a Date object
 * @param dateString The date string to parse
 * @returns A Date object or null if parsing fails
 */
export const safeParseDateString = (dateString: string | null): Date | null => {
  if (!dateString) return null;
  
  try {
    return new Date(dateString);
  } catch (error) {
    console.error('Error parsing date string:', error);
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
    isValid: date instanceof Date ? !isNaN(date.getTime()) : 'not a date',
    asISO: date instanceof Date ? date.toISOString() : 'not a date',
    formatted: date instanceof Date ? formatDateForDatabase(date) : 'not a date'
  });
};

/**
 * Formats a date for display in DD/MM/YYYY format
 * @param date The date to format
 * @returns A string in DD/MM/YYYY format
 */
export const formatDateForDisplay = (date: Date | string | null): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateFnsFormat(dateObj, 'dd/MM/yyyy');
  } catch (error) {
    console.error('Error formatting date for display:', error);
    return '';
  }
};

/**
 * Parses a date string in DD/MM/YYYY format
 * @param dateString The date string in DD/MM/YYYY format
 * @returns A Date object or null if parsing fails
 */
export const parseDateFromDisplay = (dateString: string): Date | null => {
  if (!dateString) return null;
  
  try {
    // Split the date string by slash
    const [day, month, year] = dateString.split('/').map(part => parseInt(part, 10));
    
    // Create a new date, month is 0-indexed in JavaScript
    const parsedDate = new Date(year, month - 1, day);
    console.log(`Parsed ${dateString} to:`, parsedDate);
    return parsedDate;
  } catch (error) {
    console.error('Error parsing display date:', error);
    return null;
  }
};

/**
 * Formats a date for chat messages display, showing full date and time
 * @param date The date to format
 * @returns A string with formatted date and time
 */
export const formatChatMessageTimestamp = (date: Date | string | null): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateFnsFormat(dateObj, 'dd/MM/yyyy HH:mm');
  } catch (error) {
    console.error('Error formatting chat message timestamp:', error);
    return '';
  }
};

/**
 * Compares two dates (either Date objects or ISO strings) for sorting
 * @param dateA First date to compare
 * @param dateB Second date to compare
 * @returns Negative if dateA is earlier, positive if dateA is later, 0 if equal
 */
export const compareDates = (dateA: Date | string, dateB: Date | string): number => {
  const dateObjA = typeof dateA === 'string' ? new Date(dateA) : dateA;
  const dateObjB = typeof dateB === 'string' ? new Date(dateB) : dateB;
  
  return compareAsc(dateObjA, dateObjB);
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
  return [...array].sort((a, b) => {
    const dateA = a[dateField] as unknown as Date | string;
    const dateB = b[dateField] as unknown as Date | string;
    
    const comparison = compareDates(dateA, dateB);
    return ascending ? comparison : -comparison;
  });
};
