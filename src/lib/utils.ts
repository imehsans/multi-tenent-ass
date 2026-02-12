import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function encodeCursor(cursor: Record<string, any>): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64');
}

export function decodeCursor(cursor: string): Record<string, any> {
  return JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
}
