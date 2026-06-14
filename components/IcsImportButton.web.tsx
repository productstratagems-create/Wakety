import React, { useRef } from 'react';
import { Pressable, Text } from 'react-native';
import { unzipSync } from 'fflate';
import { parseIcsEvents } from '../data/parseIcs';
import { CalendarEvent } from '../hooks/useCalendarImport';
import { IcsImportButtonProps } from './IcsImportButton';

function isZipFile(file: File): boolean {
  return file.name.toLowerCase().endsWith('.zip') || file.type === 'application/zip';
}

function readIcsEvents(text: string): CalendarEvent[] {
  return parseIcsEvents(text);
}

function readZipEvents(buffer: ArrayBuffer): CalendarEvent[] {
  const entries = unzipSync(new Uint8Array(buffer));
  const decoder = new TextDecoder();
  const events: CalendarEvent[] = [];

  for (const [name, data] of Object.entries(entries)) {
    if (!name.toLowerCase().endsWith('.ics')) continue;
    events.push(...parseIcsEvents(decoder.decode(data)));
  }

  return events.sort((a, b) => a.time.localeCompare(b.time));
}

export function IcsImportButton({ onResult, buttonStyle, pressedStyle, textStyle }: IcsImportButtonProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const events = isZipFile(file)
          ? readZipEvents(reader.result as ArrayBuffer)
          : readIcsEvents(String(reader.result ?? ''));
        onResult(events.length > 0 ? { status: 'ok', events } : { status: 'empty' });
      } catch {
        onResult({ status: 'error' });
      }
    };
    reader.onerror = () => onResult({ status: 'error' });

    if (isZipFile(file)) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  }

  return (
    <>
      <Pressable
        style={({ pressed }) => [buttonStyle, pressed && pressedStyle]}
        onPress={() => inputRef.current?.click()}
      >
        <Text style={textStyle}>📅 Import from calendar (.ics or .zip)</Text>
      </Pressable>
      <input
        ref={inputRef}
        type="file"
        accept=".ics,.zip,text/calendar,application/zip"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
    </>
  );
}
