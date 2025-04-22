import { format, isToday, isYesterday, parseISO, formatDistanceToNow } from "date-fns";

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
    if (isToday(date)) {
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

// Group messages by date for display in chat
export function groupMessagesByDate(messages: any[]) {
  const groups: Record<string, any[]> = {};
  
  if (!messages || !messages.length) return groups;
  
  // First sort messages by date ascending (oldest first)
  const sortedMessages = sortByDate(messages, 'created_at', true);
  
  sortedMessages.forEach(message => {
    try {
      const date = safeParseISO(message.created_at);
      // Use consistent date format for grouping
      const dateKey = format(date, 'yyyy-MM-dd');
      
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

// Determine if a date group should auto-expand
export function shouldExpandDateGroup(dateString: string) {
  try {
    const date = safeParseISO(dateString);
    // Auto-expand today and yesterday date groups
    return isToday(date) || isYesterday(date);
  } catch (error) {
    console.error(`Error determining if date group should expand: ${dateString}`, error);
    return true; // Default to expanded if there's an error
  }
}

// Format a date for display in chat groups
export function formatMessageDateGroup(dateString: string): string {
  try {
    const date = safeParseISO(dateString);
    
    if (isToday(date)) {
      return "Today";
    } else if (isYesterday(date)) {
      return "Yesterday";
    } else {
      return format(date, 'MMMM d, yyyy');
    }
  } catch (error) {
    console.error(`Error formatting date group: ${dateString}`, error);
    return dateString; // Return original as fallback
  }
}
