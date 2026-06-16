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
import { PersonalSetup } from '../data/types';

interface Props {
  onComplete: (setup: PersonalSetup) => void;
}

const PREP_OPTIONS = [15, 20, 30, 45, 60, 90];
const COMMUTE_OPTIONS = [5, 10, 15, 20, 30, 45, 60];

export function OnboardingFlow({ onComplete }: Props) {
  const [step, setStep] = useState<'prep' | 'commute'>('prep');
  const [prepSelected, setPrepSelected] = useState<number | null>(null);
  const [prepCustom, setPrepCustom] = useState('');
  const [commuteSelected, setCommuteSelected] = useState<number | null>(null);
  const [commuteCustom, setCommuteCustom] = useState('');

  const effectivePrep = prepSelected ?? (prepCustom ? parseInt(prepCustom, 10) : null);
  const effectiveCommute = commuteSelected ?? (commuteCustom ? parseInt(commuteCustom, 10) : null);

  function handlePrepContinue() {
    if (!effectivePrep || effectivePrep <= 0) return;
    setStep('commute');
  }

  function handleCommuteDone() {
    if (!effectivePrep || !effectiveCommute || effectiveCommute <= 0) return;
    onComplete({ prepMinutes: effectivePrep, commuteMinutes: effectiveCommute });
  }

  if (step === 'prep') {
    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.stepLabel}>1 of 2</Text>
          <Text style={styles.question}>How long does it take you to get ready?</Text>
          <Text style={styles.hint}>Shower, dress, coffee — the whole ritual.</Text>
          <View style={styles.options}>
            {PREP_OPTIONS.map((min) => (
              <Pressable
                key={min}
                style={({ pressed }) => [
                  styles.chip,
                  prepSelected === min && styles.chipActive,
                  pressed && styles.pressed,
                ]}
                onPress={() => { setPrepSelected(min); setPrepCustom(''); }}
              >
                <Text style={[styles.chipText, prepSelected === min && styles.chipTextActive]}>
                  {min} min
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={styles.customInput}
            placeholder="Or type a number..."
            placeholderTextColor="#3D5A70"
            value={prepCustom}
            onChangeText={(t) => { setPrepCustom(t.replace(/[^0-9]/g, '')); setPrepSelected(null); }}
            keyboardType="number-pad"
          />
          <Pressable
            style={({ pressed }) => [
              styles.next,
              !effectivePrep && styles.nextDisabled,
              pressed && styles.pressed,
            ]}
            onPress={handlePrepContinue}
          >
            <Text style={styles.nextText}>Continue</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.stepLabel}>2 of 2</Text>
        <Text style={styles.question}>How long is your usual commute?</Text>
        <Text style={styles.hint}>Door to destination on a normal day.</Text>
        <View style={styles.options}>
          {COMMUTE_OPTIONS.map((min) => (
            <Pressable
              key={min}
              style={({ pressed }) => [
                styles.chip,
                commuteSelected === min && styles.chipActive,
                pressed && styles.pressed,
              ]}
              onPress={() => { setCommuteSelected(min); setCommuteCustom(''); }}
            >
              <Text style={[styles.chipText, commuteSelected === min && styles.chipTextActive]}>
                {min} min
              </Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          style={styles.customInput}
          placeholder="Or type a number..."
          placeholderTextColor="#3D5A70"
          value={commuteCustom}
          onChangeText={(t) => { setCommuteCustom(t.replace(/[^0-9]/g, '')); setCommuteSelected(null); }}
          keyboardType="number-pad"
        />
        <Pressable
          style={({ pressed }) => [
            styles.next,
            !effectiveCommute && styles.nextDisabled,
            pressed && styles.pressed,
          ]}
          onPress={handleCommuteDone}
        >
          <Text style={styles.nextText}>Done</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 40,
  },
  stepLabel: {
    fontSize: 12,
    color: '#3D5A70',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 24,
  },
  question: {
    fontSize: 26,
    fontWeight: '300',
    color: '#F0F4F8',
    letterSpacing: 0.3,
    marginBottom: 10,
    lineHeight: 34,
  },
  hint: {
    fontSize: 14,
    color: '#5A7A9A',
    marginBottom: 28,
    lineHeight: 20,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  chip: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
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
    fontSize: 15,
  },
  chipTextActive: {
    color: '#F0F4F8',
  },
  customInput: {
    backgroundColor: '#0F1923',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E2D40',
    paddingVertical: 12,
    paddingHorizontal: 14,
    color: '#F0F4F8',
    fontSize: 16,
    marginBottom: 32,
  },
  next: {
    backgroundColor: '#2A5298',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextDisabled: {
    opacity: 0.35,
  },
  nextText: {
    color: '#F0F4F8',
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  pressed: {
    opacity: 0.7,
  },
});
