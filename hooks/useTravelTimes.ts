import { useEffect, useState } from 'react';
import { getTravelTimeMinutes } from '../data/journeyPlanner';
import { AnchorLocation, AnchorEvent, TransportMode } from '../data/types';

export interface TravelLeg {
  key: string;
  fromLabel: string;
  toLabel: string;
  travelMinutes: number;
  gapMinutes: number | null;
  tight: boolean;
  icon: string;
  leaveByTime: string;
  error?: string;
  origin?: AnchorLocation;
  destination?: AnchorLocation;
  /** Set when the preferred mode had no route and this leg falls back to the best available route instead. */
  modeFallback?: TransportMode;
}

const MODE_ICONS: Record<TransportMode, string> = {
  walk: '🚶',
  bicycle: '🚲',
  car: '🚗',
  bus: '🚌',
  tram: '🚊',
  metro: '🚇',
  rail: '🚆',
};

export const MODE_LABELS: Record<TransportMode, string> = {
  walk: 'walking',
  bicycle: 'biking',
  car: 'driving',
  bus: 'bus',
  tram: 'tram',
  metro: 'T-bane',
  rail: 'train',
};

const DEFAULT_ICON = '🚇';

function toMinutes(hhmm: string): number {
  const [hours, minutes] = hhmm.split(':').map(Number);
  return hours * 60 + minutes;
}

function fromMinutes(mins: number): string {
  const wrapped = ((mins % 1440) + 1440) % 1440;
  const hours = Math.floor(wrapped / 60);
  const minutes = wrapped % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function tomorrowAt(hhmm: string): Date {
  const [hours, minutes] = hhmm.split(':').map(Number);
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * For each anchor, resolves a departure point — either its own custom
 * `fromLocation`, or the previous anchor's `location` — and, if the anchor
 * itself has a `location`, estimates the travel time between the two.
 * Flags legs where the gap between the departure and arrival times is
 * tighter than the trip itself.
 */
export function useTravelTimes(anchors: AnchorEvent[]): TravelLeg[] {
  const [legs, setLegs] = useState<TravelLeg[]>([]);
  const key = anchors
    .map((a) => `${a.time}:${a.location?.lat ?? ''},${a.location?.lon ?? ''}:${a.fromLocation?.lat ?? ''},${a.fromLocation?.lon ?? ''}:${a.transportMode ?? ''}`)
    .join('|');

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const results: TravelLeg[] = [];
      for (let i = 0; i < anchors.length; i++) {
        const anchor = anchors[i];
        const previous = anchors[i - 1];
        const origin = anchor.fromLocation ?? previous?.location;
        const destination = anchor.location;
        if (!origin || !destination) continue;

        const { minutes: travelMinutes, error, fallbackFromMode } = await getTravelTimeMinutes(origin, destination, tomorrowAt(anchor.time), anchor.transportMode);
        const fromLabel = anchor.fromLocation ? anchor.fromLocation.name : previous!.label;

        if (travelMinutes == null) {
          results.push({
            key: `${anchor.time}-${anchor.label}`,
            fromLabel,
            toLabel: anchor.label,
            travelMinutes: 0,
            gapMinutes: null,
            tight: false,
            icon: DEFAULT_ICON,
            leaveByTime: '',
            error: error ?? 'No route found',
            origin,
            destination,
          });
          continue;
        }

        const gapMinutes = previous ? toMinutes(anchor.time) - toMinutes(previous.time) : null;
        const tight = gapMinutes != null && travelMinutes > gapMinutes;
        const icon = !fallbackFromMode && anchor.transportMode ? MODE_ICONS[anchor.transportMode] : DEFAULT_ICON;
        const leaveByTime = fromMinutes(toMinutes(anchor.time) - travelMinutes);

        results.push({
          key: `${anchor.time}-${anchor.label}`,
          fromLabel,
          toLabel: anchor.label,
          travelMinutes,
          gapMinutes,
          tight,
          icon,
          leaveByTime,
          modeFallback: fallbackFromMode,
          origin,
          destination,
        });
      }
      if (!cancelled) setLegs(results);
    }

    if (anchors.length >= 1) {
      run();
    } else {
      setLegs([]);
    }

    return () => {
      cancelled = true;
    };
  }, [key]);

  return legs;
}
