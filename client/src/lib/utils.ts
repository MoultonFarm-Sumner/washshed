import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Determines stock status based on current stock level
 * @param currentStock The current stock level
 * @returns Object containing status flags
 */
export function getStockStatus(currentStock: number) {
  return {
    isLowStock: currentStock < 10 && currentStock >= 5,
    isCriticalStock: currentStock < 5
  };
}

/**
 * Formats a date string to a readable format
 * @param dateString The date string to format
 * @param includeTime Whether to include time in the output
 * @returns Formatted date string
 */
export function formatDate(dateString: string, includeTime = false) {
  try {
    const date = new Date(dateString);
    
    if (includeTime) {
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return 'Invalid date';
  }
}

/**
 * Formats a number for display
 * @param value The number to format
 * @param showPlus Whether to show a + sign for positive numbers
 * @returns Formatted number string
 */
export function formatNumber(value: number, showPlus = false) {
  if (value > 0 && showPlus) {
    return `+${value}`;
  }
  return value.toString();
}

/**
 * Debounces a function call
 * @param fn The function to debounce
 * @param ms The delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, ms = 300) {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return function(this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
}
