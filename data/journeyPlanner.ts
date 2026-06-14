import { AnchorLocation } from './types';

const ENDPOINT = 'https://api.entur.io/journey-planner/v3/graphql';

// Required by Entur's API guidelines to identify the calling application.
const CLIENT_NAME = 'wakety - planform';

const TRAVEL_TIME_QUERY = `
  query travelTime($fromLat: Float!, $fromLon: Float!, $toLat: Float!, $toLon: Float!, $arriveBy: DateTime!) {
    trip(
      from: { coordinates: { latitude: $fromLat, longitude: $fromLon } }
      to: { coordinates: { latitude: $toLat, longitude: $toLon } }
      dateTime: $arriveBy
      arriveBy: true
      numTripPatterns: 1
    ) {
      tripPatterns {
        duration
      }
    }
  }
`;

/**
 * Returns the estimated public-transit travel time, in minutes, to go from
 * `from` to `to` and arrive by `arriveBy`. Returns null if no route was found
 * or the request failed.
 */
export async function getTravelTimeMinutes(
  from: AnchorLocation,
  to: AnchorLocation,
  arriveBy: Date
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
        },
      }),
    });
    if (!response.ok) return null;

    const json = await response.json();
    const duration = json?.data?.trip?.tripPatterns?.[0]?.duration;
    return typeof duration === 'number' ? Math.round(duration / 60) : null;
  } catch {
    return null;
  }
}
