import React, { useRef } from 'react';
import { Pressable, Text } from 'react-native';
import { parseIcsEvents } from '../data/parseIcs';
import { IcsImportButtonProps } from './IcsImportButton';

export function IcsImportButton({ onResult, buttonStyle, pressedStyle, textStyle }: IcsImportButtonProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const events = parseIcsEvents(String(reader.result ?? ''));
        onResult(events.length > 0 ? { status: 'ok', events } : { status: 'empty' });
      } catch {
        onResult({ status: 'error' });
      }
    };
    reader.onerror = () => onResult({ status: 'error' });
    reader.readAsText(file);
  }

  return (
    <>
      <Pressable
        style={({ pressed }) => [buttonStyle, pressed && pressedStyle]}
        onPress={() => inputRef.current?.click()}
      >
        <Text style={textStyle}>📅 Import from calendar (.ics)</Text>
      </Pressable>
      <input ref={inputRef} type="file" accept=".ics,text/calendar" style={{ display: 'none' }} onChange={handleChange} />
    </>
  );
}
