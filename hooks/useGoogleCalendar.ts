import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GOOGLE_CLIENT_ID } from '../data/config';

const SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
const TOKEN_KEY = 'wakety.google.token';
const TOKEN_EXPIRY_KEY = 'wakety.google.token.expiry';

function getRedirectUri(): string {
  if (typeof window === 'undefined') return '';
  return window.location.origin + window.location.pathname.replace(/\/$/, '');
}

export function storeGoogleToken(token: string, expiresIn: number): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + expiresIn * 1000 - 60_000));
  } catch {}
}

export function getStoredGoogleToken(): string | null {
  try {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const expiry = sessionStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!token || !expiry) return null;
    if (Date.now() > parseInt(expiry, 10)) {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

export function initiateGoogleAuth(): void {
  if (!GOOGLE_CLIENT_ID || typeof window === 'undefined') return;
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: getRedirectUri(),
    response_type: 'token',
    scope: SCOPE,
    include_granted_scopes: 'true',
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function fetchGoogleCalendarTomorrow(
  token: string
): Promise<{ title: string; time: string }[]> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const start = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
  const end = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate() + 1);

  const params = new URLSearchParams({
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) throw new Error('Calendar API error');
  const data = await res.json();

  return (data.items ?? [])
    .filter((item: { start?: { dateTime?: string } }) => item.start?.dateTime)
    .map((item: { summary?: string; start: { dateTime: string } }) => {
      const d = new Date(item.start.dateTime);
      return {
        title: item.summary ?? 'Event',
        time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
      };
    });
}

// Call this once in App to handle the OAuth redirect callback
export function useGoogleOAuthCallback() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (!hash.includes('access_token=')) return;
    const params = new URLSearchParams(hash.slice(1));
    const token = params.get('access_token');
    const expiresIn = params.get('expires_in');
    if (token && expiresIn) {
      storeGoogleToken(token, parseInt(expiresIn, 10));
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname + window.location.search
      );
    }
  }, []);
}

export function useGoogleCalendar() {
  return {
    isConfigured: () => !!GOOGLE_CLIENT_ID,
    hasToken: () => getStoredGoogleToken() !== null,
    fetchTomorrow: () => {
      const token = getStoredGoogleToken();
      if (!token) throw new Error('No token');
      return fetchGoogleCalendarTomorrow(token);
    },
    initiateAuth: initiateGoogleAuth,
  };
}
