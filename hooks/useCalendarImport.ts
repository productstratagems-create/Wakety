import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

export interface CalendarEvent {
  title: string;
  time: string;
}

export type ImportResult =
  | { status: 'ok'; events: CalendarEvent[] }
  | { status: 'denied' | 'empty' | 'error' | 'unsupported' };

function toHHMM(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function useCalendarImport() {
  async function importTomorrowEvents(): Promise<ImportResult> {
    if (Platform.OS === 'web') {
      return { status: 'unsupported' };
    }

    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        return { status: 'denied' };
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const calendarIds = calendars.map((calendar) => calendar.id);

      const now = new Date();
      const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const endOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);

      const rawEvents = await Calendar.getEventsAsync(calendarIds, startOfTomorrow, endOfTomorrow);

      const events: CalendarEvent[] = rawEvents
        .filter((event) => !event.allDay)
        .map((event) => ({
          title: event.title,
          startDate: new Date(event.startDate),
        }))
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
        .map(({ title, startDate }) => ({ title, time: toHHMM(startDate) }));

      if (events.length === 0) {
        return { status: 'empty' };
      }

      return { status: 'ok', events };
    } catch {
      return { status: 'error' };
    }
  }

  return { importTomorrowEvents };
}
