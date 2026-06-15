import type { CalendarEvent } from '../hooks/useCalendarImport';

const DAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

interface RRule {
  freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval: number;
  byDay: number[];
  until?: Date;
  count?: number;
}

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

function parseIcsDate(value: string): Date | null {
  let match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
  if (match) {
    const [year, month, day, hour, minute, second] = match.slice(1, 7).map(Number);
    return match[7]
      ? new Date(Date.UTC(year, month - 1, day, hour, minute, second))
      : new Date(year, month - 1, day, hour, minute, second);
  }
  match = value.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (match) {
    const [year, month, day] = match.slice(1).map(Number);
    return new Date(year, month - 1, day);
  }
  return null;
}

function toHHMM(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function dateOnly(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function startOfWeek(date: Date): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - result.getDay());
  return result;
}

function countWeeklyOccurrences(start: Date, byDay: number[], interval: number, target: Date): number {
  const sortedByDay = [...byDay].sort((a, b) => a - b);
  const startWeek = startOfWeek(start);
  const totalWeeks = daysBetween(startWeek, startOfWeek(target)) / 7;

  let count = 0;
  for (let week = 0; week <= totalWeeks; week += interval) {
    const weekStart = new Date(startWeek);
    weekStart.setDate(weekStart.getDate() + week * 7);
    for (const day of sortedByDay) {
      const occurrence = new Date(weekStart);
      occurrence.setDate(occurrence.getDate() + day);
      if (occurrence < start) continue;
      if (occurrence > target) break;
      count += 1;
    }
  }
  return count;
}

function parseRRule(value: string): RRule | null {
  const parts: Record<string, string> = {};
  for (const part of value.split(';')) {
    const [key, val] = part.split('=');
    if (key && val) parts[key.toUpperCase()] = val;
  }

  const freq = parts.FREQ;
  if (freq !== 'DAILY' && freq !== 'WEEKLY' && freq !== 'MONTHLY' && freq !== 'YEARLY') return null;

  const interval = parts.INTERVAL ? parseInt(parts.INTERVAL, 10) : 1;
  const byDay = parts.BYDAY
    ? parts.BYDAY
        .split(',')
        .map((code) => DAY_CODES.indexOf(code.replace(/^[+-]?\d*/, '')))
        .filter((index) => index !== -1)
    : [];
  const until = parts.UNTIL ? parseIcsDate(parts.UNTIL) ?? undefined : undefined;
  const count = parts.COUNT ? parseInt(parts.COUNT, 10) : undefined;

  return { freq, interval: interval || 1, byDay, until, count };
}

function occursOnDate(start: Date, rrule: RRule, target: Date): boolean {
  const startDay = dateOnly(start);
  const targetDay = dateOnly(target);
  if (targetDay < startDay) return false;
  if (rrule.until && targetDay > dateOnly(rrule.until)) return false;

  switch (rrule.freq) {
    case 'DAILY': {
      const diff = daysBetween(startDay, targetDay);
      if (diff % rrule.interval !== 0) return false;
      return rrule.count === undefined || diff / rrule.interval < rrule.count;
    }
    case 'WEEKLY': {
      const byDay = rrule.byDay.length > 0 ? rrule.byDay : [startDay.getDay()];
      if (!byDay.includes(targetDay.getDay())) return false;
      const weekDiff = daysBetween(startOfWeek(startDay), startOfWeek(targetDay)) / 7;
      if (weekDiff < 0 || weekDiff % rrule.interval !== 0) return false;
      if (rrule.count === undefined) return true;
      return countWeeklyOccurrences(startDay, byDay, rrule.interval, targetDay) <= rrule.count;
    }
    case 'MONTHLY': {
      if (targetDay.getDate() !== startDay.getDate()) return false;
      const monthDiff = (targetDay.getFullYear() - startDay.getFullYear()) * 12 + (targetDay.getMonth() - startDay.getMonth());
      if (monthDiff < 0 || monthDiff % rrule.interval !== 0) return false;
      return rrule.count === undefined || monthDiff / rrule.interval < rrule.count;
    }
    case 'YEARLY': {
      if (targetDay.getDate() !== startDay.getDate() || targetDay.getMonth() !== startDay.getMonth()) return false;
      const yearDiff = targetDay.getFullYear() - startDay.getFullYear();
      if (yearDiff < 0 || yearDiff % rrule.interval !== 0) return false;
      return rrule.count === undefined || yearDiff / rrule.interval < rrule.count;
    }
  }
}

function unescapeText(value: string): string {
  return value.replace(/\\n/gi, ' ').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
}

export function parseIcsEvents(ics: string, referenceDate: Date = new Date()): CalendarEvent[] {
  const lines = unfold(ics);
  const tomorrow = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate() + 1);

  const events: { title: string; location?: string; startDate: Date }[] = [];
  let inEvent = false;
  let summary: string | null = null;
  let location: string | null = null;
  let startDate: Date | null = null;
  let rrule: RRule | null = null;
  let exDates: Date[] = [];

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      summary = null;
      location = null;
      startDate = null;
      rrule = null;
      exDates = [];
      continue;
    }
    if (line === 'END:VEVENT') {
      if (summary && startDate) {
        if (isSameDay(startDate, tomorrow)) {
          events.push({ title: summary, location: location ?? undefined, startDate });
        } else if (
          rrule &&
          occursOnDate(startDate, rrule, tomorrow) &&
          !exDates.some((exDate) => isSameDay(exDate, tomorrow))
        ) {
          const occurrence = new Date(tomorrow);
          occurrence.setHours(startDate.getHours(), startDate.getMinutes(), startDate.getSeconds());
          events.push({ title: summary, location: location ?? undefined, startDate: occurrence });
        }
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
    } else if (key === 'LOCATION' || key.startsWith('LOCATION;')) {
      location = unescapeText(value);
    } else if (key === 'DTSTART' || key.startsWith('DTSTART;')) {
      if (key.includes('VALUE=DATE')) continue; // all-day event, no time to anchor on
      startDate = parseIcsDate(value);
    } else if (key === 'RRULE') {
      rrule = parseRRule(value);
    } else if (key === 'EXDATE' || key.startsWith('EXDATE;')) {
      for (const part of value.split(',')) {
        const exDate = parseIcsDate(part);
        if (exDate) exDates.push(exDate);
      }
    }
  }

  return events
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    .map(({ title, location, startDate }) => ({ title, location, time: toHHMM(startDate) }));
}
