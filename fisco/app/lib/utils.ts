import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Parse an ISO‐like timestamp *as UTC* even if it has no "Z"  
export function parseAsUTC(dateString: string): Date {  
  // Pull out the date‐time components  
  const m = dateString.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?$/  
  );  
  if (!m) return new Date(dateString); // fallback to default parsing  

  const [ , Y, Mo, D, h, mnt, s ] = m.map(Number);  
  // Date.UTC interprets args as UTC  
  return new Date(Date.UTC(Y, Mo - 1, D, h, mnt, s));  
}

export function formatRelativeTime(dateString: string | Date) {
  try {
    const date =
      typeof dateString === "string"
        ? parseAsUTC(dateString)
        : dateString;

    if (isNaN(date.getTime())) {
      return null;
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime(); // Removed UTCtoLocal

    const diffMinutes = Math.floor(diffMs / 60_000);
    const diffHours = Math.floor(diffMs / 3_600_000);
    const diffDays = Math.floor(diffMs / 86_400_000);
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffMinutes < 1) return `Just now`;
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return `${diffWeeks}w`;
  } catch (err) {
    console.error(err);
    return null;
  }
}