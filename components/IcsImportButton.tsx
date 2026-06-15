import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import type { CalendarEvent } from '../hooks/useCalendarImport';

export type IcsImportResult = { status: 'ok'; events: CalendarEvent[] } | { status: 'empty' | 'error' };

export interface IcsImportButtonProps {
  onResult: (result: IcsImportResult) => void;
  buttonStyle: StyleProp<ViewStyle>;
  pressedStyle: StyleProp<ViewStyle>;
  textStyle: StyleProp<TextStyle>;
}

// Native platforms don't show the .ics import option (see PlanForm).
export function IcsImportButton(_props: IcsImportButtonProps) {
  return null;
}
