
import type { ClientEvent } from '@/lib/types';

// Helper function to combine date and time strings into a Date object
function parseEventDateTime(dateStr: string, timeStr: string): Date {
  // dateStr is YYYY-MM-DD, timeStr is HH:MM
  // This creates a Date object in the user's local timezone based on the input strings.
  return new Date(`${dateStr}T${timeStr}:00`);
}

export function getGoogleCalendarUrl(event: ClientEvent, assumedDurationHours: number = 2): string {
  const startDateLocal = parseEventDateTime(event.date, event.time);
  const endDateLocal = new Date(startDateLocal.getTime() + assumedDurationHours * 60 * 60 * 1000);

  // Google Calendar link format requires dates in UTC: YYYYMMDDTHHMMSSZ
  const formatDateToGoogleUTC = (date: Date): string => {
    return date.toISOString().replace(/-|:|\.\d{3}/g, '');
  };

  const googleStartDate = formatDateToGoogleUTC(startDateLocal);
  const googleEndDate = formatDateToGoogleUTC(endDateLocal);
  
  // Truncate description if too long to prevent overly long URLs
  const description = event.description ? (event.description.length > 500 ? event.description.substring(0, 497) + "..." : event.description) : '';


  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${googleStartDate}/${googleEndDate}`,
    details: description,
    location: event.location || '',
    // ctz: 'Your/Timezone' // Optional: Add timezone if known, otherwise Google tries to infer
  });
  return `https://www.google.com/calendar/render?${params.toString()}`;
}

export function getOutlookCalendarUrl(event: ClientEvent, assumedDurationHours: number = 2): string {
  const startDateLocal = parseEventDateTime(event.date, event.time);
  const endDateLocal = new Date(startDateLocal.getTime() + assumedDurationHours * 60 * 60 * 1000);

  // Outlook Calendar link format requires dates in UTC ISO 8601 format: YYYY-MM-DDTHH:MM:SSZ
  const outlookStartDate = startDateLocal.toISOString();
  const outlookEndDate = endDateLocal.toISOString();
  
  // Truncate description if too long
  const description = event.description ? (event.description.length > 500 ? event.description.substring(0, 497) + "..." : event.description) : '';

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: outlookStartDate,
    enddt: outlookEndDate,
    body: description,
    location: event.location || '',
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}
