import { format, isToday as dateFnsIsToday, isYesterday, parseISO, formatDistanceToNow } from "date-fns";

// Function to safely parse ISO dates with fallback
export function safeParseISO(dateString: string) {
  try {
    // Regular ISO date format
    return parseISO(dateString);
  } catch (error) {
    console.error(`Error parsing date: ${dateString}`, error);
    
    // Try alternative parsing as fallback
    try {
      // For database timestamp strings
      return new Date(dateString);
    } catch (innerError) {
      console.error(`Fallback date parsing failed for: ${dateString}`, innerError);
      return new Date(); // Return current date as last resort
    }
  }
}

// Sort messages by date field
export function sortByDate(items: any[], dateField: string, ascending = true) {
  if (!items || !items.length) return [];
  
  return [...items].sort((a, b) => {
    const dateA = safeParseISO(a[dateField]).getTime();
    const dateB = safeParseISO(b[dateField]).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
}

// Format a chat message time in a user-friendly way
export function formatChatMessageTime(timestamp: string) {
  try {
    const date = safeParseISO(timestamp);
    
    // For recent messages (less than a day)
    if (dateFnsIsToday(date)) {
      return format(date, 'h:mm a'); // e.g. "3:42 PM"
    }
    
    // Within the last week, show relative time
    if (Date.now() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return formatDistanceToNow(date, { addSuffix: true }); // e.g. "2 days ago"
    }
    
    // Otherwise, show the date
    return format(date, 'MMM d, yyyy h:mm a'); // e.g. "Jan 5, 2025 3:42 PM"
  } catch (error) {
    console.error(`Error formatting message time: ${timestamp}`, error);
    return timestamp; // Fallback to the original string
  }
}

// Normalize a date to YYYY-MM-DD format without time component
export function normalizeDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

// Check if a date is today, with additional safety and logging
export function isToday(dateObj: Date): boolean {
  try {
    // Get today's date string in YYYY-MM-DD format
    const today = normalizeDateString(new Date());
    
    // Format the input date in the same format for comparison
    const inputDateStr = normalizeDateString(dateObj);
    
    // Compare strings to ensure we're only comparing dates without time
    const result = today === inputDateStr;
    
    console.log(`Date check - Input date: ${inputDateStr}, Today: ${today}, isToday: ${result}`);
    
    return result;
  } catch (error) {
    console.error("Error in isToday:", error);
    return dateFnsIsToday(dateObj); // Fall back to date-fns isToday
  }
}

// Group messages by date for display in chat, with simplified handling (no "today"/"yesterday" groups)
export function groupMessagesByDate(messages: any[]) {
  const groups: Record<string, any[]> = {};
  if (!messages || !messages.length) return groups;

  // First sort messages by date ascending (oldest first)
  const sortedMessages = sortByDate(messages, 'created_at', true);

  sortedMessages.forEach(message => {
    try {
      const date = safeParseISO(message.created_at);
      // Use consistent date format for grouping: 'yyyy-MM-dd'
      const dateKey = normalizeDateString(date);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    } catch (error) {
      console.error(`Error processing message date for grouping: ${message.created_at}`, error);
      // Use "Unknown Date" as fallback group
      const fallbackKey = 'unknown-date';
      if (!groups[fallbackKey]) {
        groups[fallbackKey] = [];
      }
      groups[fallbackKey].push(message);
    }
  });

  return groups;
}

// Determine if a date group should auto-expand (simplify: always expanded)
export function shouldExpandDateGroup(_dateString: string) {
  return true;
}

// Format a date for display in chat groups (ALWAYS format as long date, no "Today"/"Yesterday")
export function formatMessageDateGroup(dateString: string): string {
  try {
    // Convert string to date for formatting
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return format(date, 'MMMM d, yyyy');
  } catch (error) {
    console.error(`Error formatting date group: ${dateString}`, error);
    return dateString; // Return original as fallback
  }
}

// New function to format date for display (e.g., MM/DD/YYYY)
export function formatDateForDisplay(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'MM/dd/yyyy');
}

// New function to parse a display-formatted date
export function parseDateFromDisplay(dateString: string): Date | null {
  try {
    // Split the date string into parts
    const [month, day, year] = dateString.split('/').map(Number);
    
    // Validate the parts
    if (month && day && year) {
      // Create a new Date object (note: month is 0-indexed in JS Date)
      const parsedDate = new Date(year, month - 1, day);
      
      // Additional validation to ensure the date is valid
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing display date:', error);
    return null;
  }
}

// Check if a date is today using direct method
export function checkIsToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

// Export the original date-fns isToday function as a named export
export { dateFnsIsToday };

// For backward compatibility - keep the old function name available
export const isTodayWithSafety = isToday;
