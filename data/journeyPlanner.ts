import { AnchorLocation, TransportMode } from './types';

const ENDPOINT = 'https://api.entur.io/journey-planner/v3/graphql';

// Required by Entur's API guidelines to identify the calling application.
const CLIENT_NAME = 'wakety - planform';

const TRAVEL_TIME_QUERY = `
  query travelTime($fromLat: Float!, $fromLon: Float!, $toLat: Float!, $toLon: Float!, $arriveBy: DateTime!, $modes: Modes) {
    trip(
      from: { coordinates: { latitude: $fromLat, longitude: $fromLon } }
      to: { coordinates: { latitude: $toLat, longitude: $toLon } }
      dateTime: $arriveBy
      arriveBy: true
      numTripPatterns: 1
      modes: $modes
    ) {
      tripPatterns {
        duration
      }
    }
  }
`;

/**
 * Builds the Entur `Modes` input for a given transport preference.
 * `walk`/`bicycle` request a direct (non-transit) trip; the public-transport
 * modes restrict transit legs to that mode. `undefined` omits the filter
 * entirely, letting Entur pick the best combination.
 */
function buildModes(transportMode?: TransportMode): Record<string, unknown> | undefined {
  switch (transportMode) {
    case 'walk':
      return { directMode: 'foot' };
    case 'bicycle':
      return { directMode: 'bicycle' };
    case 'car':
      return { directMode: 'car' };
    case 'bus':
    case 'tram':
    case 'metro':
    case 'rail':
      return { accessMode: 'foot', egressMode: 'foot', transportModes: [{ transportMode }] };
    default:
      return undefined;
  }
}

export interface TravelTimeResult {
  minutes: number | null;
  error: string | null;
  /** Set when the preferred mode had no route and a no-restriction fallback was used instead. */
  fallbackFromMode?: TransportMode;
}

async function fetchTrip(
  from: AnchorLocation,
  to: AnchorLocation,
  arriveBy: Date,
  modes: Record<string, unknown> | undefined
): Promise<{ minutes: number | null; error: string | null }> {
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ET-Client-Name': CLIENT_NAME,
      },
      body: JSON.stringify({
        query: TRAVEL_TIME_QUERY,
        variables: {
          fromLat: from.lat,
          fromLon: from.lon,
          toLat: to.lat,
          toLon: to.lon,
          arriveBy: arriveBy.toISOString(),
          modes,
        },
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      return { minutes: null, error: `Request failed (${response.status}): ${body.slice(0, 200)}` };
    }

    const json = await response.json();
    if (json.errors) {
      return { minutes: null, error: JSON.stringify(json.errors).slice(0, 200) };
    }
    const duration = json?.data?.trip?.tripPatterns?.[0]?.duration;
    if (typeof duration === 'number') {
      return { minutes: Math.round(duration / 60), error: null };
    }
    return { minutes: null, error: 'No route found' };
  } catch (err) {
    return { minutes: null, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Returns the estimated travel time, in minutes, to go from `from` to `to`
 * and arrive by `arriveBy`, optionally restricted to `transportMode`.
 * If the preferred mode has no route, falls back to an unrestricted trip
 * search and flags the result via `fallbackFromMode`.
 * If no route was found at all or the request failed, `minutes` is null
 * and `error` describes why.
 */
export async function getTravelTimeMinutes(
  from: AnchorLocation,
  to: AnchorLocation,
  arriveBy: Date,
  transportMode?: TransportMode
): Promise<TravelTimeResult> {
  const preferred = await fetchTrip(from, to, arriveBy, buildModes(transportMode));
  if (preferred.minutes != null || !transportMode) return preferred;

  const fallback = await fetchTrip(from, to, arriveBy, buildModes(undefined));
  if (fallback.minutes != null) {
    return { ...fallback, fallbackFromMode: transportMode };
  }
  return preferred;
}
