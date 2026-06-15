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
      return { transportModes: [{ transportMode }] };
    default:
      return undefined;
  }
}

/**
 * Returns the estimated travel time, in minutes, to go from `from` to `to`
 * and arrive by `arriveBy`, optionally restricted to `transportMode`.
 * Returns null if no route was found or the request failed.
 */
export async function getTravelTimeMinutes(
  from: AnchorLocation,
  to: AnchorLocation,
  arriveBy: Date,
  transportMode?: TransportMode
): Promise<number | null> {
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
          modes: buildModes(transportMode),
        },
      }),
    });
    if (!response.ok) {
      console.warn('Entur journey planner request failed', response.status, await response.text());
      return null;
    }

    const json = await response.json();
    if (json.errors) {
      console.warn('Entur journey planner returned errors', json.errors);
      return null;
    }
    const duration = json?.data?.trip?.tripPatterns?.[0]?.duration;
    return typeof duration === 'number' ? Math.round(duration / 60) : null;
  } catch (err) {
    console.warn('Entur journey planner request threw', err);
    return null;
  }
}
