import React, { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { guessAnchorType } from '../data/guessAnchorType';
import { AnchorType } from '../data/types';
import { CalendarEvent, useCalendarImport } from '../hooks/useCalendarImport';
import { useGoogleCalendar } from '../hooks/useGoogleCalendar';
import { ANCHOR_ICONS } from './AnchorTag';

type AnchorInput = { type: AnchorType; label: string; time: string };

interface Props {
  onConfirm: (anchor: AnchorInput | null) => void;
}

const ANCHOR_TYPES: AnchorType[] = ['school_run', 'flight', 'interview', 'meeting', 'appointment'];
const ANCHOR_LABELS: Record<AnchorType, string> = {
  school_run: 'School run',
  flight: 'Flight',
  interview: 'Interview',
  meeting: 'Meeting',
  appointment: 'Appointment',
};

type Mode = 'checking' | 'suggested' | 'quiet' | 'picking' | 'manual' | 'google_connect';

export function AnchorConfirmCard({ onConfirm }: Props) {
  const [mode, setMode] = useState<Mode>('checking');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [suggested, setSuggested] = useState<CalendarEvent | null>(null);
  const [manualType, setManualType] = useState<AnchorType | null>(null);
  const [manualLabel, setManualLabel] = useState('');
  const [manualHour, setManualHour] = useState('');
  const [manualMinute, setManualMinute] = useState('');
  const { importTomorrowEvents } = useCalendarImport();
  const googleCal = useGoogleCalendar();

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (!googleCal.isConfigured()) {
        setMode('quiet');
        return;
      }
      if (googleCal.hasToken()) {
        googleCal.fetchTomorrow()
          .then((evts) => {
            if (evts.length > 0) {
              setEvents(evts);
              setSuggested(evts[0]);
              setMode('suggested');
            } else {
              setMode('quiet');
            }
          })
          .catch(() => setMode('google_connect'));
      } else {
        setMode('google_connect');
      }
      return;
    }
    importTomorrowEvents().then((result) => {
      if (result.status === 'ok' && result.events.length > 0) {
        setEvents(result.events);
        setSuggested(result.events[0]);
        setMode('suggested');
      } else {
        setMode('quiet');
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function confirmEvent(event: CalendarEvent) {
    const type = guessAnchorType(event.title) ?? 'meeting';
    onConfirm({ type, label: event.title, time: event.time });
  }

  function enterManual(prefill?: CalendarEvent) {
    if (prefill) {
      setManualLabel(prefill.title);
      const [h, m] = prefill.time.split(':');
      setManualHour(h);
      setManualMinute(m);
      const guessed = guessAnchorType(prefill.title);
      if (guessed) setManualType(guessed);
    }
    setMode('manual');
  }

  function handleManualConfirm() {
    if (!manualType || !manualLabel.trim() || !manualHour || !manualMinute) return;
    onConfirm({
      type: manualType,
      label: manualLabel.trim(),
      time: `${manualHour.padStart(2, '0')}:${manualMinute.padStart(2, '0')}`,
    });
  }

  const manualReady =
    !!manualType &&
    manualLabel.trim().length > 0 &&
    /^\d{1,2}$/.test(manualHour) && Number(manualHour) <= 23 &&
    /^\d{1,2}$/.test(manualMinute) && Number(manualMinute) <= 59;

  if (mode === 'checking') {
    return (
      <View style={styles.center}>
        <Text style={styles.checking}>Checking tomorrow...</Text>
      </View>
    );
  }

  if (mode === 'suggested' && suggested) {
    const icon = ANCHOR_ICONS[guessAnchorType(suggested.title) ?? 'meeting'];
    return (
      <View style={styles.center}>
        <Text style={styles.eyebrow}>Tomorrow's anchor</Text>
        <Text style={styles.eventIcon}>{icon}</Text>
        <Text style={styles.eventTitle}>{suggested.title}</Text>
        <Text style={styles.eventTime}>{suggested.time}</Text>
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
            onPress={() => confirmEvent(suggested)}
          >
            <Text style={styles.primaryText}>Yes, that's it</Text>
          </Pressable>
          {events.length > 1 && (
            <Pressable
              style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
              onPress={() => setMode('picking')}
            >
              <Text style={styles.secondaryText}>See other events</Text>
            </Pressable>
          )}
          <Pressable
            style={({ pressed }) => [styles.ghost, pressed && styles.pressed]}
            onPress={() => enterManual(suggested)}
          >
            <Text style={styles.ghostText}>Enter something different</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.ghost, pressed && styles.pressed]}
            onPress={() => onConfirm(null)}
          >
            <Text style={styles.ghostText}>Nothing important tomorrow</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (mode === 'picking') {
    return (
      <ScrollView contentContainerStyle={styles.pickContent}>
        <Text style={[styles.eyebrow, { marginTop: 8 }]}>Which one matters most?</Text>
        <View style={styles.eventList}>
          {events.map((event, i) => (
            <Pressable
              key={i}
              style={({ pressed }) => [styles.eventChip, pressed && styles.pressed]}
              onPress={() => confirmEvent(event)}
            >
              <Text style={styles.eventChipTime}>{event.time}</Text>
              <Text style={styles.eventChipTitle} numberOfLines={1}>{event.title}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          style={({ pressed }) => [styles.ghost, pressed && styles.pressed]}
          onPress={() => enterManual()}
        >
          <Text style={styles.ghostText}>Enter something different</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.ghost, pressed && styles.pressed]}
          onPress={() => onConfirm(null)}
        >
          <Text style={styles.ghostText}>Nothing important tomorrow</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (mode === 'manual') {
    return (
      <ScrollView contentContainerStyle={styles.pickContent} keyboardShouldPersistTaps="handled">
        <Text style={[styles.eyebrow, { marginTop: 8 }]}>What's the commitment?</Text>
        <View style={styles.typeRow}>
          {ANCHOR_TYPES.map((type) => (
            <Pressable
              key={type}
              style={({ pressed }) => [
                styles.typeChip,
                manualType === type && styles.typeChipActive,
                pressed && styles.pressed,
              ]}
              onPress={() => setManualType(type)}
            >
              <Text style={[styles.typeChipText, manualType === type && styles.typeChipTextActive]}>
                {ANCHOR_ICONS[type]} {ANCHOR_LABELS[type]}
              </Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          style={styles.input}
          placeholder="e.g. Oliver's school drop-off"
          placeholderTextColor="#3D5A70"
          value={manualLabel}
          onChangeText={setManualLabel}
        />
        <View style={styles.timeRow}>
          <TextInput
            style={styles.timeInput}
            placeholder="HH"
            placeholderTextColor="#3D5A70"
            value={manualHour}
            onChangeText={(t) => setManualHour(t.replace(/[^0-9]/g, '').slice(0, 2))}
            keyboardType="number-pad"
            maxLength={2}
          />
          <Text style={styles.timeSep}>:</Text>
          <TextInput
            style={styles.timeInput}
            placeholder="MM"
            placeholderTextColor="#3D5A70"
            value={manualMinute}
            onChangeText={(t) => setManualMinute(t.replace(/[^0-9]/g, '').slice(0, 2))}
            keyboardType="number-pad"
            maxLength={2}
          />
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.primary,
            !manualReady && styles.primaryDisabled,
            pressed && styles.pressed,
          ]}
          onPress={handleManualConfirm}
        >
          <Text style={styles.primaryText}>Confirm</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.ghost, pressed && styles.pressed]}
          onPress={() => setMode(events.length > 0 ? 'suggested' : 'quiet')}
        >
          <Text style={styles.ghostText}>Back</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (mode === 'google_connect') {
    return (
      <View style={styles.center}>
        <Text style={styles.googleIcon}>G</Text>
        <Text style={styles.quietHeading}>Connect Google Calendar</Text>
        <Text style={styles.quietSub}>
          Sign in once and Wakety checks tomorrow automatically.
        </Text>
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
            onPress={googleCal.initiateAuth}
          >
            <Text style={styles.primaryText}>Continue with Google</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
            onPress={() => enterManual()}
          >
            <Text style={styles.secondaryText}>I'll enter it manually</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.ghost, pressed && styles.pressed]}
            onPress={() => onConfirm(null)}
          >
            <Text style={styles.ghostText}>Nothing important tomorrow</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // quiet
  return (
    <View style={styles.center}>
      <Text style={styles.quietMoon}>○</Text>
      <Text style={styles.quietHeading}>Looks quiet tomorrow.</Text>
      <Text style={styles.quietSub}>
        Nothing on your calendar demanding an early start.
      </Text>
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
          onPress={() => onConfirm(null)}
        >
          <Text style={styles.primaryText}>That's right</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
          onPress={() => enterManual()}
        >
          <Text style={styles.secondaryText}>I have something</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  pickContent: {
    paddingHorizontal: 28,
    paddingBottom: 40,
    flexGrow: 1,
    justifyContent: 'center',
  },
  checking: {
    fontSize: 17,
    color: '#5A7A9A',
    letterSpacing: 0.3,
  },
  eyebrow: {
    fontSize: 13,
    color: '#5A7A9A',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 24,
    textAlign: 'center',
  },
  eventIcon: {
    fontSize: 52,
    marginBottom: 16,
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: '300',
    color: '#F0F4F8',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.2,
    lineHeight: 30,
  },
  eventTime: {
    fontSize: 15,
    color: '#5A7A9A',
    marginBottom: 40,
    letterSpacing: 0.5,
  },
  googleIcon: {
    fontSize: 40,
    fontWeight: '700',
    color: '#4285F4',
    marginBottom: 20,
    letterSpacing: -1,
  },
  quietMoon: {
    fontSize: 48,
    color: '#3D5A80',
    marginBottom: 20,
  },
  quietHeading: {
    fontSize: 24,
    fontWeight: '300',
    color: '#F0F4F8',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  quietSub: {
    fontSize: 14,
    color: '#5A7A9A',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 40,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  primary: {
    backgroundColor: '#2A5298',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  primaryDisabled: {
    opacity: 0.35,
  },
  primaryText: {
    color: '#F0F4F8',
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  secondary: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E2D40',
    width: '100%',
  },
  secondaryText: {
    color: '#5A7A9A',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  ghost: {
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
  },
  ghostText: {
    color: '#3D5A70',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.7,
  },
  eventList: {
    gap: 10,
    marginBottom: 24,
  },
  eventChip: {
    backgroundColor: '#0F1923',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E2D40',
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  eventChipTime: {
    color: '#5A7A9A',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
    minWidth: 40,
  },
  eventChipTitle: {
    color: '#C5D4E8',
    fontSize: 15,
    flex: 1,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  typeChip: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#1E2D40',
    backgroundColor: '#0F1923',
  },
  typeChipActive: {
    backgroundColor: '#2A5298',
    borderColor: '#2A5298',
  },
  typeChipText: {
    color: '#8A9BB5',
    fontSize: 14,
  },
  typeChipTextActive: {
    color: '#F0F4F8',
  },
  input: {
    backgroundColor: '#0F1923',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E2D40',
    paddingVertical: 12,
    paddingHorizontal: 14,
    color: '#F0F4F8',
    fontSize: 16,
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 32,
  },
  timeInput: {
    backgroundColor: '#0F1923',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E2D40',
    paddingVertical: 12,
    paddingHorizontal: 14,
    color: '#F0F4F8',
    fontSize: 16,
    width: 64,
    textAlign: 'center',
  },
  timeSep: {
    color: '#5A7A9A',
    fontSize: 20,
    fontWeight: '300',
  },
});
