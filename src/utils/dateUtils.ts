
import { parse as dateFnsParse, format as dateFnsFormat } from "date-fns";

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
    return new Date(year, month - 1, day);
  } catch (error) {
    console.error('Error parsing display date:', error);
    return null;
  }
};

