
import { parse } from "date-fns";

/**
 * Parses a time string into a Date object
 * @param timeString The time string in HH:mm format
 * @param referenceDate The reference date to use (defaults to current date)
 * @returns A Date object containing the parsed time
 */
export const parse = (
  timeString: string, 
  format: string, 
  referenceDate: Date
): Date => {
  return parse(timeString, format, referenceDate);
};
