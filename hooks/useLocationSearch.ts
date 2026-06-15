import { useEffect, useState } from 'react';
import { LocationSuggestion, searchLocations } from '../data/entur';

const DEBOUNCE_MS = 300;

export function useLocationSearch(query: string, enabled: boolean) {
  const [results, setResults] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let cancelled = false;

    const timer = setTimeout(() => {
      searchLocations(query)
        .then((suggestions) => {
          if (!cancelled) setResults(suggestions);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, enabled]);

  return { results, loading };
}
