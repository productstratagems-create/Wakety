import { AnchorType } from './types';

const KEYWORD_TYPES: { keywords: string[]; type: AnchorType }[] = [
  { keywords: ['flight', 'departure', 'airport'], type: 'flight' },
  { keywords: ['interview'], type: 'interview' },
  { keywords: ['school', 'drop off', 'drop-off'], type: 'school_run' },
  { keywords: ['appointment', 'dr.', 'doctor', 'dentist', 'clinic', 'lege', 'time hos', 'klinikk', 'tannlege', 'sykehus'], type: 'appointment' },
  { keywords: ['meeting', 'call', 'sync', 'standup', 'stand-up', 'møte'], type: 'meeting' },
];

export function guessAnchorType(title: string): AnchorType | null {
  const lower = title.toLowerCase();
  for (const { keywords, type } of KEYWORD_TYPES) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      return type;
    }
  }
  return null;
}
