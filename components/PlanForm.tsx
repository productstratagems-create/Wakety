import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { guessAnchorType } from '../data/guessAnchorType';
import { AnchorType, UserPlan } from '../data/types';
import { CalendarEvent, useCalendarImport } from '../hooks/useCalendarImport';
import { ANCHOR_ICONS } from './AnchorTag';

interface Props {
  initialPlan: UserPlan | null;
  onSubmit: (plan: UserPlan) => void;
  onCancel?: () => void;
}

const NUMBER_REGEX = /^\d+$/;

const ANCHOR_TYPES: AnchorType[] = ['school_run', 'flight', 'interview', 'meeting', 'appointment'];
const ANCHOR_LABELS: Record<AnchorType, string> = {
  school_run: 'School run',
  flight: 'Flight',
  interview: 'Interview',
  meeting: 'Meeting',
  appointment: 'Appointment',
};

export function PlanForm({ initialPlan, onSubmit, onCancel }: Props) {
  const [anchorType, setAnchorType] = useState<AnchorType | null>(initialPlan?.anchor?.type ?? null);
  const [anchorLabel, setAnchorLabel] = useState(initialPlan?.anchor?.label ?? '');
  const [initialHour, initialMinute] = (initialPlan?.anchor?.time ?? '').split(':');
  const [anchorHour, setAnchorHour] = useState(initialHour ?? '');
  const [anchorMinute, setAnchorMinute] = useState(initialMinute ?? '');
  const [prepMinutes, setPrepMinutes] = useState(String(initialPlan?.personalChain.prepMinutes ?? ''));
  const [commuteMinutes, setCommuteMinutes] = useState(String(initialPlan?.personalChain.commuteMinutes ?? ''));
  const [bufferMinutes, setBufferMinutes] = useState(String(initialPlan?.personalChain.bufferMinutes ?? ''));
  const [showErrors, setShowErrors] = useState(false);
  const [calendarStatus, setCalendarStatus] = useState<
    'idle' | 'loading' | 'denied' | 'empty' | 'error' | 'unsupported' | 'picking'
  >('idle');
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const { importTomorrowEvents } = useCalendarImport();

  const hasAnchorInput = !!(anchorLabel.trim() || anchorHour);

  const errors: Partial<Record<string, string>> = {};
  if (hasAnchorInput) {
    if (!anchorType) errors.anchorType = 'Pick a type';
    if (!anchorLabel.trim()) errors.anchorLabel = 'Required';
    const hourValid = NUMBER_REGEX.test(anchorHour) && Number(anchorHour) <= 23;
    const minuteValid = NUMBER_REGEX.test(anchorMinute) && Number(anchorMinute) <= 59;
    if (!hourValid || !minuteValid) errors.anchorTime = 'Enter a valid 24h time';
  }
  if (prepMinutes !== '' && !NUMBER_REGEX.test(prepMinutes)) errors.prepMinutes = 'Whole number';
  if (commuteMinutes !== '' && !NUMBER_REGEX.test(commuteMinutes)) errors.commuteMinutes = 'Whole number';
  if (bufferMinutes !== '' && !NUMBER_REGEX.test(bufferMinutes)) errors.bufferMinutes = 'Whole number';

  const isValid = Object.keys(errors).length === 0;

  function buildPlan(anchor: UserPlan['anchor']): UserPlan {
    return {
      id: 'user-plan',
      label: 'Tomorrow',
      anchor,
      personalChain: {
        prepMinutes: parseInt(prepMinutes || '0', 10),
        commuteMinutes: parseInt(commuteMinutes || '0', 10),
        bufferMinutes: parseInt(bufferMinutes || '0', 10),
      },
    };
  }

  function handleSubmit() {
    if (!isValid) {
      setShowErrors(true);
      return;
    }

    const anchor = hasAnchorInput
      ? {
          type: anchorType!,
          label: anchorLabel.trim(),
          time: `${anchorHour.padStart(2, '0')}:${anchorMinute.padStart(2, '0')}`,
        }
      : null;

    onSubmit(buildPlan(anchor));
  }

  function handleNoCommitment() {
    onSubmit(buildPlan(null));
  }

  async function handleImportFromCalendar() {
    setCalendarStatus('loading');
    const result = await importTomorrowEvents();
    if (result.status === 'ok') {
      setCalendarEvents(result.events);
      setCalendarStatus('picking');
    } else {
      setCalendarStatus(result.status);
    }
  }

  function handleSelectEvent(event: CalendarEvent) {
    const [hour, minute] = event.time.split(':');
    setAnchorLabel(event.title);
    setAnchorHour(hour);
    setAnchorMinute(minute);
    const guessedType = guessAnchorType(event.title);
    if (guessedType) {
      setAnchorType(guessedType);
    }
    setCalendarStatus('idle');
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Your morning profile</Text>

        {Platform.OS !== 'web' && (
          <>
            <Pressable
              style={({ pressed }) => [styles.calendarButton, pressed && styles.pressed]}
              onPress={handleImportFromCalendar}
            >
              <Text style={styles.calendarButtonText}>
                {calendarStatus === 'loading' ? 'Looking…' : '📅 Import from calendar'}
              </Text>
            </Pressable>

            {calendarStatus === 'picking' && (
              <View style={styles.wrapRow}>
                {calendarEvents.map((event, index) => (
                  <Chip
                    key={`${event.time}-${event.title}-${index}`}
                    label={`${event.time} — ${event.title}`}
                    active={false}
                    onPress={() => handleSelectEvent(event)}
                  />
                ))}
              </View>
            )}

            {calendarStatus === 'denied' && (
              <Text style={styles.calendarHint}>Calendar access was denied.</Text>
            )}
            {calendarStatus === 'empty' && (
              <Text style={styles.calendarHint}>No events found on your calendar for tomorrow.</Text>
            )}
            {calendarStatus === 'error' && (
              <Text style={styles.calendarHint}>Couldn't read your calendar. Try again later.</Text>
            )}
          </>
        )}

        <Text style={styles.sectionLabel}>First commitment tomorrow</Text>
        <View style={styles.wrapRow}>
          {ANCHOR_TYPES.map((type) => (
            <Chip
              key={type}
              label={`${ANCHOR_ICONS[type]} ${ANCHOR_LABELS[type]}`}
              active={anchorType === type}
              onPress={() => setAnchorType(type)}
            />
          ))}
        </View>
        <FieldError visible={showErrors} message={errors.anchorType} />

        <TextInput
          style={[styles.input, { marginTop: 10 }]}
          placeholder="e.g. Oliver's school drop-off"
          placeholderTextColor="#3D5A70"
          value={anchorLabel}
          onChangeText={setAnchorLabel}
        />
        <FieldError visible={showErrors} message={errors.anchorLabel} />

        <Text style={styles.sectionLabel}>What time? (24h)</Text>
        <View style={styles.timeRow}>
          <TextInput
            style={styles.timeInput}
            placeholder="HH"
            placeholderTextColor="#3D5A70"
            value={anchorHour}
            onChangeText={(text) => setAnchorHour(text.replace(/[^0-9]/g, '').slice(0, 2))}
            keyboardType="number-pad"
            maxLength={2}
          />
          <Text style={styles.timeSeparator}>:</Text>
          <TextInput
            style={styles.timeInput}
            placeholder="MM"
            placeholderTextColor="#3D5A70"
            value={anchorMinute}
            onChangeText={(text) => setAnchorMinute(text.replace(/[^0-9]/g, '').slice(0, 2))}
            keyboardType="number-pad"
            maxLength={2}
          />
        </View>
        <FieldError visible={showErrors} message={errors.anchorTime} />

        <Text style={styles.sectionLabel}>Getting ready (minutes)</Text>
        <TextInput
          style={styles.input}
          placeholder="0"
          placeholderTextColor="#3D5A70"
          value={prepMinutes}
          onChangeText={setPrepMinutes}
          keyboardType="numeric"
        />
        <FieldError visible={showErrors} message={errors.prepMinutes} />

        <Text style={styles.sectionLabel}>Commute (minutes)</Text>
        <TextInput
          style={styles.input}
          placeholder="0"
          placeholderTextColor="#3D5A70"
          value={commuteMinutes}
          onChangeText={setCommuteMinutes}
          keyboardType="numeric"
        />
        <FieldError visible={showErrors} message={errors.commuteMinutes} />

        <Text style={styles.sectionLabel}>Buffer (minutes)</Text>
        <TextInput
          style={styles.input}
          placeholder="0"
          placeholderTextColor="#3D5A70"
          value={bufferMinutes}
          onChangeText={setBufferMinutes}
          keyboardType="numeric"
        />
        <FieldError visible={showErrors} message={errors.bufferMinutes} />

        <Pressable
          style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
          onPress={handleSubmit}
        >
          <Text style={styles.primaryText}>Save</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
          onPress={handleNoCommitment}
        >
          <Text style={styles.secondaryText}>Nothing important tomorrow</Text>
        </Pressable>

        {onCancel && (
          <Pressable
            style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
            onPress={onCancel}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function FieldError({ visible, message }: { visible: boolean; message?: string }) {
  if (!visible || !message) return null;
  return <Text style={styles.error}>{message}</Text>;
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 22,
    fontWeight: '300',
    color: '#F0F4F8',
    letterSpacing: 0.5,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 13,
    color: '#5A7A9A',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 18,
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chip: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#1E2D40',
    backgroundColor: '#0F1923',
  },
  chipActive: {
    backgroundColor: '#2A5298',
    borderColor: '#2A5298',
  },
  chipText: {
    color: '#8A9BB5',
    fontSize: 14,
  },
  chipTextActive: {
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
  timeSeparator: {
    color: '#5A7A9A',
    fontSize: 20,
    fontWeight: '300',
  },
  error: {
    color: '#E08A8A',
    fontSize: 12,
    marginTop: 6,
  },
  primary: {
    backgroundColor: '#2A5298',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
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
    marginTop: 12,
  },
  secondaryText: {
    color: '#5A7A9A',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  cancel: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelText: {
    color: '#3D5A70',
    fontSize: 15,
  },
  calendarButton: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E2D40',
    backgroundColor: '#0F1923',
    marginBottom: 12,
  },
  calendarButtonText: {
    color: '#8A9BB5',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  calendarHint: {
    color: '#5A7A9A',
    fontSize: 13,
    marginBottom: 12,
  },
  pressed: {
    opacity: 0.7,
  },
});
