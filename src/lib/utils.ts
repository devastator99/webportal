
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a string with values
 * Example: fmt("Hello {name}", { name: "World" }) => "Hello World"
 */
export function fmt(template: string, values: Record<string, any>): string {
  return template.replace(/{([^{}]*)}/g, (match, key) => {
    const value = values[key];
    return value !== undefined ? String(value) : match;
  });
}
