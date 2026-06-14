import React, { useRef, useState } from 'react';
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
import { AnchorType, Rigidity, UserPlan } from '../data/types';
import { CalendarEvent, useCalendarImport } from '../hooks/useCalendarImport';
import { ANCHOR_ICONS } from './AnchorTag';
import { IcsImportButton, IcsImportResult } from './IcsImportButton';

interface Props {
  initialPlan: UserPlan | null;
  onSubmit: (plan: UserPlan) => void;
  onCancel?: () => void;
}

interface AnchorDraft {
  key: string;
  type: AnchorType | null;
  label: string;
  hour: string;
  minute: string;
  rigidity: Rigidity | null;
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
const RIGIDITY_OPTIONS: Rigidity[] = ['hard', 'medium', 'flexible'];

function emptyDraft(key: string): AnchorDraft {
  return { key, type: null, label: '', hour: '', minute: '', rigidity: null };
}

function isEmptyDraft(draft: AnchorDraft): boolean {
  return !draft.type && !draft.label.trim() && !draft.hour && !draft.minute && !draft.rigidity;
}

export function PlanForm({ initialPlan, onSubmit, onCancel }: Props) {
  const [hasAnchor, setHasAnchor] = useState(initialPlan?.hasAnchor ?? true);
  const [anchors, setAnchors] = useState<AnchorDraft[]>(() => {
    if (initialPlan?.anchors && initialPlan.anchors.length > 0) {
      return initialPlan.anchors.map((anchor, index) => {
        const [hour, minute] = anchor.time.split(':');
        return { key: `init-${index}`, type: anchor.type, label: anchor.label, hour, minute, rigidity: anchor.rigidity };
      });
    }
    return (initialPlan?.hasAnchor ?? true) ? [emptyDraft('init-0')] : [];
  });
  const [prepMinutes, setPrepMinutes] = useState(String(initialPlan?.personalChain.prepMinutes ?? ''));
  const [commuteMinutes, setCommuteMinutes] = useState(String(initialPlan?.personalChain.commuteMinutes ?? ''));
  const [bufferMinutes, setBufferMinutes] = useState(String(initialPlan?.personalChain.bufferMinutes ?? ''));
  const [showErrors, setShowErrors] = useState(false);
  const [calendarStatus, setCalendarStatus] = useState<
    'idle' | 'loading' | 'denied' | 'empty' | 'error' | 'unsupported' | 'picking'
  >('idle');
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const { importTomorrowEvents } = useCalendarImport();
  const keyCounter = useRef(0);

  function nextKey(): string {
    keyCounter.current += 1;
    return `anchor-${keyCounter.current}`;
  }

  const errors: Partial<Record<string, string>> = {};
  if (hasAnchor) {
    if (anchors.length === 0) {
      errors.anchors = 'Add at least one event, or switch to quiet day.';
    }
    for (const anchor of anchors) {
      if (!anchor.type) errors[`${anchor.key}.type`] = 'Pick a type';
      if (!anchor.label.trim()) errors[`${anchor.key}.label`] = 'Required';
      const hourValid = NUMBER_REGEX.test(anchor.hour) && Number(anchor.hour) <= 23;
      const minuteValid = NUMBER_REGEX.test(anchor.minute) && Number(anchor.minute) <= 59;
      if (!hourValid || !minuteValid) errors[`${anchor.key}.time`] = 'Enter a valid 24h time';
      if (!anchor.rigidity) errors[`${anchor.key}.rigidity`] = 'Pick one';
    }
  }
  if (prepMinutes !== '' && !NUMBER_REGEX.test(prepMinutes)) errors.prepMinutes = 'Whole number';
  if (commuteMinutes !== '' && !NUMBER_REGEX.test(commuteMinutes)) errors.commuteMinutes = 'Whole number';
  if (bufferMinutes !== '' && !NUMBER_REGEX.test(bufferMinutes)) errors.bufferMinutes = 'Whole number';

  const isValid = Object.keys(errors).length === 0;

  function handleSubmit() {
    if (!isValid) {
      setShowErrors(true);
      return;
    }

    const plan: UserPlan = {
      id: 'user-plan',
      label: 'Tomorrow',
      hasAnchor,
      anchors: hasAnchor
        ? anchors.map((anchor) => ({
            type: anchor.type!,
            label: anchor.label.trim(),
            time: `${anchor.hour.padStart(2, '0')}:${anchor.minute.padStart(2, '0')}`,
            rigidity: anchor.rigidity!,
          }))
        : [],
      personalChain: {
        prepMinutes: parseInt(prepMinutes || '0', 10),
        commuteMinutes: parseInt(commuteMinutes || '0', 10),
        bufferMinutes: parseInt(bufferMinutes || '0', 10),
      },
    };

    onSubmit(plan);
  }

  function handleSetHasAnchor(value: boolean) {
    setHasAnchor(value);
    if (value && anchors.length === 0) {
      setAnchors([emptyDraft(nextKey())]);
    }
  }

  function handleAddAnchor() {
    setAnchors((prev) => [...prev, emptyDraft(nextKey())]);
  }

  function handleRemoveAnchor(key: string) {
    setAnchors((prev) => prev.filter((anchor) => anchor.key !== key));
  }

  function updateAnchor(key: string, patch: Partial<AnchorDraft>) {
    setAnchors((prev) => prev.map((anchor) => (anchor.key === key ? { ...anchor, ...patch } : anchor)));
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

  function handleIcsResult(result: IcsImportResult) {
    if (result.status === 'ok') {
      setCalendarEvents(result.events);
      setCalendarStatus('picking');
    } else {
      setCalendarStatus(result.status);
    }
  }

  function handleSelectEvent(event: CalendarEvent) {
    const [hour, minute] = event.time.split(':');
    const guessedType = guessAnchorType(event.title);
    const filled: AnchorDraft = { key: nextKey(), type: guessedType, label: event.title, hour, minute, rigidity: 'medium' };

    setHasAnchor(true);
    setAnchors((prev) => (prev.length === 1 && isEmptyDraft(prev[0]) ? [filled] : [...prev, filled]));

    setCalendarEvents((prev) => {
      const remaining = prev.filter((e) => e !== event);
      setCalendarStatus(remaining.length > 0 ? 'picking' : 'idle');
      return remaining;
    });
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Plan tomorrow</Text>

        <Text style={styles.sectionLabel}>Anything important tomorrow?</Text>
        <View style={styles.row}>
          <Chip label="Yes" active={hasAnchor} onPress={() => handleSetHasAnchor(true)} />
          <Chip label="No — quiet day" active={!hasAnchor} onPress={() => handleSetHasAnchor(false)} />
        </View>

        {hasAnchor && (
          <>
            {Platform.OS !== 'web' ? (
              <Pressable
                style={({ pressed }) => [styles.calendarButton, pressed && styles.pressed]}
                onPress={handleImportFromCalendar}
              >
                <Text style={styles.calendarButtonText}>
                  {calendarStatus === 'loading' ? 'Looking…' : '📅 Import from calendar'}
                </Text>
              </Pressable>
            ) : (
              <IcsImportButton
                onResult={handleIcsResult}
                buttonStyle={styles.calendarButton}
                pressedStyle={styles.pressed}
                textStyle={styles.calendarButtonText}
              />
            )}

            {calendarStatus === 'picking' && (
              <>
                <Text style={styles.calendarHint}>Tap each event you'd like to add:</Text>
                <View style={styles.wrapRow}>
                  {calendarEvents.map((event, index) => (
                    <Chip
                      key={`${event.time}-${event.title}-${index}`}
                      label={`${event.time} — ${event.title}`}
                      active={false}
                      onPress={() => handleSelectEvent(event)}
                    />
                  ))}
                  <Chip label="Done" active onPress={() => setCalendarStatus('idle')} />
                </View>
              </>
            )}

            {calendarStatus === 'denied' && (
              <Text style={styles.calendarHint}>Calendar access was denied.</Text>
            )}
            {calendarStatus === 'empty' && (
              <Text style={styles.calendarHint}>
                {Platform.OS === 'web'
                  ? "No events found for tomorrow in that file."
                  : 'No events found on your calendar for tomorrow.'}
              </Text>
            )}
            {calendarStatus === 'error' && (
              <Text style={styles.calendarHint}>
                {Platform.OS === 'web'
                  ? "Couldn't read that file. Make sure it's a valid .ics or .zip calendar export."
                  : "Couldn't read your calendar. Try again later."}
              </Text>
            )}

            <FieldError visible={showErrors} message={errors.anchors} />

            {anchors.map((anchor, index) => (
              <View key={anchor.key} style={styles.anchorCard}>
                <View style={styles.anchorCardHeader}>
                  <Text style={styles.anchorCardTitle}>Event {index + 1}</Text>
                  {anchors.length > 1 && (
                    <Pressable onPress={() => handleRemoveAnchor(anchor.key)}>
                      <Text style={styles.removeText}>Remove</Text>
                    </Pressable>
                  )}
                </View>

                <Text style={styles.sectionLabel}>What kind of event?</Text>
                <View style={styles.wrapRow}>
                  {ANCHOR_TYPES.map((type) => (
                    <Chip
                      key={type}
                      label={`${ANCHOR_ICONS[type]} ${ANCHOR_LABELS[type]}`}
                      active={anchor.type === type}
                      onPress={() => updateAnchor(anchor.key, { type })}
                    />
                  ))}
                </View>
                <FieldError visible={showErrors} message={errors[`${anchor.key}.type`]} />

                <Text style={styles.sectionLabel}>Describe it</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Oliver's school drop-off"
                  placeholderTextColor="#3D5A70"
                  value={anchor.label}
                  onChangeText={(text) => updateAnchor(anchor.key, { label: text })}
                />
                <FieldError visible={showErrors} message={errors[`${anchor.key}.label`]} />

                <Text style={styles.sectionLabel}>What time does it start? (24h)</Text>
                <View style={styles.timeRow}>
                  <TextInput
                    style={styles.timeInput}
                    placeholder="HH"
                    placeholderTextColor="#3D5A70"
                    value={anchor.hour}
                    onChangeText={(text) => updateAnchor(anchor.key, { hour: text.replace(/[^0-9]/g, '').slice(0, 2) })}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <Text style={styles.timeSeparator}>:</Text>
                  <TextInput
                    style={styles.timeInput}
                    placeholder="MM"
                    placeholderTextColor="#3D5A70"
                    value={anchor.minute}
                    onChangeText={(text) => updateAnchor(anchor.key, { minute: text.replace(/[^0-9]/g, '').slice(0, 2) })}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>
                <FieldError visible={showErrors} message={errors[`${anchor.key}.time`]} />

                <Text style={styles.sectionLabel}>How fixed is the time?</Text>
                <View style={styles.row}>
                  {RIGIDITY_OPTIONS.map((option) => (
                    <Chip
                      key={option}
                      label={option.charAt(0).toUpperCase() + option.slice(1)}
                      active={anchor.rigidity === option}
                      onPress={() => updateAnchor(anchor.key, { rigidity: option })}
                    />
                  ))}
                </View>
                <FieldError visible={showErrors} message={errors[`${anchor.key}.rigidity`]} />
              </View>
            ))}

            <Pressable
              style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
              onPress={handleAddAnchor}
            >
              <Text style={styles.secondaryText}>+ Add another event</Text>
            </Pressable>
          </>
        )}

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
          <Text style={styles.primaryText}>Save plan</Text>
        </Pressable>

        {onCancel && (
          <Pressable
            style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
            onPress={onCancel}
          >
            <Text style={styles.secondaryText}>Cancel</Text>
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
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  anchorCard: {
    borderWidth: 1,
    borderColor: '#1E2D40',
    borderRadius: 14,
    padding: 14,
    marginTop: 18,
  },
  anchorCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  anchorCardTitle: {
    fontSize: 13,
    color: '#5A7A9A',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  removeText: {
    color: '#E08A8A',
    fontSize: 13,
  },
  pressed: {
    opacity: 0.7,
  },
});
