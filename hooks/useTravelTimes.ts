import { useEffect, useState } from 'react';
import { getTravelTimeMinutes } from '../data/journeyPlanner';
import { AnchorEvent } from '../data/types';

export interface TravelLeg {
  from: AnchorEvent;
  to: AnchorEvent;
  travelMinutes: number;
  gapMinutes: number;
  tight: boolean;
}

function toMinutes(hhmm: string): number {
  const [hours, minutes] = hhmm.split(':').map(Number);
  return hours * 60 + minutes;
}

function tomorrowAt(hhmm: string): Date {
  const [hours, minutes] = hhmm.split(':').map(Number);
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * For each pair of consecutive anchors that both have a geocoded location,
 * estimates the travel time between them and flags legs where the gap
 * between the two event start times is tighter than the trip itself.
 */
export function useTravelTimes(anchors: AnchorEvent[]): TravelLeg[] {
  const [legs, setLegs] = useState<TravelLeg[]>([]);
  const key = anchors.map((a) => `${a.time}:${a.location?.lat ?? ''},${a.location?.lon ?? ''}`).join('|');

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const results: TravelLeg[] = [];
      for (let i = 0; i < anchors.length - 1; i++) {
        const from = anchors[i];
        const to = anchors[i + 1];
        if (!from.location || !to.location) continue;

        const travelMinutes = await getTravelTimeMinutes(from.location, to.location, tomorrowAt(to.time));
        if (travelMinutes == null) continue;

        const gapMinutes = toMinutes(to.time) - toMinutes(from.time);
        results.push({ from, to, travelMinutes, gapMinutes, tight: travelMinutes > gapMinutes });
      }
      if (!cancelled) setLegs(results);
    }

    if (anchors.length >= 2) {
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
