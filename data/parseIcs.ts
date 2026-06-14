import type { CalendarEvent } from '../hooks/useCalendarImport';

function unfold(ics: string): string[] {
  const rawLines = ics.split(/\r\n|\n|\r/);
  const lines: string[] = [];
  for (const line of rawLines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && lines.length > 0) {
      lines[lines.length - 1] += line.slice(1);
    } else {
      lines.push(line);
    }
  }
  return lines;
}

function parseDateTime(value: string, isUtc: boolean): Date | null {
  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/);
  if (!match) return null;
  const [year, month, day, hour, minute, second] = match.slice(1).map(Number);
  return isUtc
    ? new Date(Date.UTC(year, month - 1, day, hour, minute, second))
    : new Date(year, month - 1, day, hour, minute, second);
}

function toHHMM(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function unescapeText(value: string): string {
  return value.replace(/\\n/gi, ' ').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
}

export function parseIcsEvents(ics: string, referenceDate: Date = new Date()): CalendarEvent[] {
  const lines = unfold(ics);
  const tomorrow = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate() + 1);

  const events: { title: string; startDate: Date }[] = [];
  let inEvent = false;
  let summary: string | null = null;
  let startDate: Date | null = null;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      summary = null;
      startDate = null;
      continue;
    }
    if (line === 'END:VEVENT') {
      if (summary && startDate && isSameDay(startDate, tomorrow)) {
        events.push({ title: summary, startDate });
      }
      inEvent = false;
      continue;
    }
    if (!inEvent) continue;

    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex);
    const value = line.slice(colonIndex + 1);

    if (key === 'SUMMARY' || key.startsWith('SUMMARY;')) {
      summary = unescapeText(value);
    } else if (key === 'DTSTART' || key.startsWith('DTSTART;')) {
      if (key.includes('VALUE=DATE')) continue; // all-day event, no time to anchor on
      startDate = parseDateTime(value, value.endsWith('Z'));
    }
  }

  return events
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    .map(({ title, startDate }) => ({ title, time: toHHMM(startDate) }));
}
