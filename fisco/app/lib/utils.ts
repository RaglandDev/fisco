import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Private
function UTCtoLocal(date: Date) {
    const newDate = new Date(date.getTime()+date.getTimezoneOffset()*60*1000);

    const offset = date.getTimezoneOffset() / 60;
    const hours = date.getHours();

    newDate.setHours(hours - offset);

    return newDate;   
}

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
    // 1) Turn strings into UTC‐based Date objects  
    const date =
      typeof dateString === "string"
        ? parseAsUTC(dateString)
        : dateString;

    // ADD THIS CHECK HERE - right after creating the date object
    if (isNaN(date.getTime())) {
      return null;
    }

    const now = new Date();
    const diffMs = now.getTime() - UTCtoLocal(date).getTime();

    // 2) Break down into units  
    const diffMinutes = Math.floor(diffMs / 60_000);
    const diffHours   = Math.floor(diffMs / 3_600_000);
    const diffDays    = Math.floor(diffMs / 86_400_000);
    const diffWeeks   = Math.floor(diffDays / 7);

    // 3) Format  
    if (diffMinutes < 1)  return `Just now`;  
    if (diffMinutes < 60) return `${diffMinutes}m`;  
    if (diffHours   < 24) return `${diffHours}h`;  
    if (diffDays    < 7)  return `${diffDays}d`;  
                          return `${diffWeeks}w`;
  } catch (err) {
    console.error(err)
    return null;
  }
}