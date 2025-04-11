
import { format, isToday, isThisWeek, isThisMonth, addDays, subDays } from 'date-fns';

export const dateFormatters = {
  dayMonthYear: (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'MMMM d, yyyy');
  },
  
  dayMonth: (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'MMM d');
  },
  
  timeOnly: (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'h:mm a');
  },
  
  dayOfWeek: (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'EEEE');
  },
  
  shortDayOfWeek: (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'EEE');
  }
};

export const dateHelpers = {
  isToday,
  isThisWeek,
  isThisMonth,
  addDays,
  subDays,
  
  getLast7Days: (): Date[] => {
    const result: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      result.push(subDays(new Date(), i));
    }
    return result;
  },
  
  getLast30Days: (): Date[] => {
    const result: Date[] = [];
    for (let i = 29; i >= 0; i--) {
      result.push(subDays(new Date(), i));
    }
    return result;
  },
  
  getNext7Days: (): Date[] => {
    const result: Date[] = [];
    for (let i = 0; i < 7; i++) {
      result.push(addDays(new Date(), i));
    }
    return result;
  }
};
