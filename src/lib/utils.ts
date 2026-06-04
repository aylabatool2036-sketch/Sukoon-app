import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind classes safely using clsx and tailwind-merge.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Sanitizes input strings by removing potentially dangerous HTML tags.
 */
export function sanitizeInput(input: string): string {
  return input.replace(/<[^>]*>?/gm, '').trim();
}

/**
 * Formats a given date into a human-readable HH:mm format.
 */
export function formatTime(date: Date | any): string {
  const d = date instanceof Date ? date : date?.toDate ? date.toDate() : new Date();
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Maps Firebase Auth error codes to user-friendly messages.
 */
export function getFriendlyErrorMessage(error: any): string {
  const code = error?.code || error?.message || '';
  
  if (code.includes('auth/invalid-email')) {
    return 'The email address is not valid. Please check and try again.';
  }
  if (code.includes('auth/user-disabled')) {
    return 'This account has been disabled. Please contact support.';
  }
  if (code.includes('auth/user-not-found')) {
    return 'No account found with this email. Would you like to sign up?';
  }
  if (code.includes('auth/wrong-password')) {
    return 'Incorrect password. Please try again.';
  }
  if (code.includes('auth/email-already-in-use')) {
    return 'This email is already registered. Please sign in instead.';
  }
  if (code.includes('auth/weak-password')) {
    return 'Password is too weak. Please use at least 6 characters.';
  }
  if (code.includes('auth/operation-not-allowed')) {
    return 'This sign-in method is currently disabled.';
  }
  if (code.includes('auth/network-request-failed')) {
    return 'Network error. Please check your internet connection.';
  }
  if (code.includes('auth/too-many-requests')) {
    return 'Too many failed attempts. Please try again later.';
  }
  if (code.includes('auth/internal-error')) {
    return 'An internal error occurred. Please try again.';
  }
  
  // Default fallback
  return 'Authentication failed. Please check your credentials and try again.';
}
