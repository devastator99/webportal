
import { parse as dateFnsParse } from "date-fns";

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
