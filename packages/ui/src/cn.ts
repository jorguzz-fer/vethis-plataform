import { clsx, type ClassValue } from 'clsx';

/** Concatena classes condicionalmente (wrapper fino sobre clsx). */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
