export interface ParsedAppointment {
  title: string;
  time: string;
  date: string | null;
  location?: string;
}

const NORWEGIAN_WEEKDAYS = ['mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag', 'søndag', 'man', 'tir', 'ons', 'tor', 'fre', 'lør', 'søn'];

function extractTime(text: string): string | null {
  const match = text.match(/kl\.?\s*(\d{1,2})[.:](\d{2})/i);
  if (!match) return null;
  const [, hour, minute] = match;
  return `${hour.padStart(2, '0')}:${minute}`;
}

function extractDate(text: string): string | null {
  const match = text.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function extractLocation(text: string): string | undefined {
  const match = text.match(/Adr:?\s*(.+)/i);
  if (!match) return undefined;
  return match[1].trim();
}

function extractTitle(text: string): string {
  const hosMatch = text.match(/hos\s+(.+)/i);
  if (hosMatch) {
    let rest = hosMatch[1];

    // Cut off at the first weekday abbreviation or a date, whichever comes first.
    const weekdayPattern = new RegExp(`\\b(${NORWEGIAN_WEEKDAYS.join('|')})\\.?\\b`, 'i');
    const datePattern = /\d{1,2}\.\d{1,2}\.\d{4}/;

    const weekdayIndex = rest.search(weekdayPattern);
    const dateIndex = rest.search(datePattern);
    const cutIndices = [weekdayIndex, dateIndex].filter((i) => i !== -1);
    if (cutIndices.length > 0) {
      rest = rest.slice(0, Math.min(...cutIndices));
    }

    rest = rest.trim();
    if (rest) return `Hos ${rest}`;
  }

  const firstLine = text
    .split(/\r\n|\n|\r/)
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  return firstLine ?? 'Appointment';
}

export function parseAppointmentMessage(text: string): ParsedAppointment | null {
  const time = extractTime(text);
  if (!time) return null;

  return {
    title: extractTitle(text),
    time,
    date: extractDate(text),
    location: extractLocation(text),
  };
}
