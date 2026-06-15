import { AnchorLocation } from './types';

const GEOCODER_URL = 'https://api.entur.io/geocoder/v1/autocomplete';

// Required by Entur's API guidelines to identify the calling application.
const CLIENT_NAME = 'wakety - planform';

export interface LocationSuggestion extends AnchorLocation {
  id: string;
}

interface GeocoderFeature {
  properties?: {
    id?: string;
    label?: string;
    name?: string;
    category?: string[];
    layer?: string;
  };
  geometry?: {
    coordinates?: [number, number];
  };
}

// Entur geocoder "category" values that mark a stop/station rather than a
// generic place (address, venue, etc.) — multiple places can share a name
// (e.g. "Majorstuen" the area vs. "Majorstuen" the T-bane station).
const STOP_CATEGORIES = new Set([
  'railStation',
  'metroStation',
  'busStation',
  'onstreetBus',
  'onstreetTram',
  'tramStation',
  'harbourPort',
  'airport',
  'ferryStop',
  'GroupOfStopPlaces',
  'StopPlace',
]);

export function isStopPlace(category?: string[]): boolean {
  return !!category?.some((c) => STOP_CATEGORIES.has(c));
}

export async function searchLocations(query: string): Promise<LocationSuggestion[]> {
  const text = query.trim();
  if (text.length < 2) return [];

  const url = `${GEOCODER_URL}?text=${encodeURIComponent(text)}&size=5&lang=en`;
  const response = await fetch(url, {
    headers: { 'ET-Client-Name': CLIENT_NAME },
  });
  if (!response.ok) return [];

  const data = await response.json();
  const features: GeocoderFeature[] = data.features ?? [];

  return features
    .map((feature, index) => {
      const [lon, lat] = feature.geometry?.coordinates ?? [];
      return {
        id: feature.properties?.id ?? `${index}`,
        name: feature.properties?.label ?? feature.properties?.name ?? '',
        lat,
        lon,
        category: feature.properties?.category,
      };
    })
    .filter((suggestion): suggestion is LocationSuggestion =>
      !!suggestion.name && Number.isFinite(suggestion.lat) && Number.isFinite(suggestion.lon)
    );
}
