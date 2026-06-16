import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { PersonalSetup } from '../data/types';

interface Props {
  visible: boolean;
  setup: PersonalSetup;
  onSave: (setup: PersonalSetup) => void;
  onDismiss: () => void;
}

const PREP_OPTIONS = [15, 20, 30, 45, 60, 90];
const COMMUTE_OPTIONS = [5, 10, 15, 20, 30, 45, 60];

export function SettingsOverlay({ visible, setup, onSave, onDismiss }: Props) {
  const [prep, setPrep] = useState(setup.prepMinutes);
  const [prepCustom, setPrepCustom] = useState(
    PREP_OPTIONS.includes(setup.prepMinutes) ? '' : String(setup.prepMinutes)
  );
  const [commute, setCommute] = useState(setup.commuteMinutes);
  const [commuteCustom, setCommuteCustom] = useState(
    COMMUTE_OPTIONS.includes(setup.commuteMinutes) ? '' : String(setup.commuteMinutes)
  );

  const effectivePrep = prepCustom ? parseInt(prepCustom, 10) : prep;
  const effectiveCommute = commuteCustom ? parseInt(commuteCustom, 10) : commute;

  function handleDone() {
    const newSetup: PersonalSetup = {
      prepMinutes: effectivePrep || setup.prepMinutes,
      commuteMinutes: effectiveCommute || setup.commuteMinutes,
    };
    if (
      newSetup.prepMinutes !== setup.prepMinutes ||
      newSetup.commuteMinutes !== setup.commuteMinutes
    ) {
      onSave(newSetup);
    }
    onDismiss();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleDone}>
      <Pressable style={styles.backdrop} onPress={handleDone}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.heading}>Morning profile</Text>

          <Text style={styles.sectionLabel}>Getting ready</Text>
          <View style={styles.chips}>
            {PREP_OPTIONS.map((min) => (
              <Pressable
                key={min}
                style={[styles.chip, prep === min && !prepCustom && styles.chipActive]}
                onPress={() => { setPrep(min); setPrepCustom(''); }}
              >
                <Text style={[styles.chipText, prep === min && !prepCustom && styles.chipTextActive]}>
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
            onChangeText={(t) => { setPrepCustom(t.replace(/[^0-9]/g, '')); }}
            keyboardType="number-pad"
          />

          <Text style={styles.sectionLabel}>Commute</Text>
          <View style={styles.chips}>
            {COMMUTE_OPTIONS.map((min) => (
              <Pressable
                key={min}
                style={[styles.chip, commute === min && !commuteCustom && styles.chipActive]}
                onPress={() => { setCommute(min); setCommuteCustom(''); }}
              >
                <Text style={[styles.chipText, commute === min && !commuteCustom && styles.chipTextActive]}>
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
            onChangeText={(t) => { setCommuteCustom(t.replace(/[^0-9]/g, '')); }}
            keyboardType="number-pad"
          />

          <Pressable style={styles.done} onPress={handleDone}>
            <Text style={styles.doneText}>Done</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    backgroundColor: '#0F1923',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1E2D40',
  },
  heading: {
    fontSize: 16,
    fontWeight: '500',
    color: '#F0F4F8',
    letterSpacing: 0.5,
    marginBottom: 24,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 12,
    color: '#5A7A9A',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 4,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: '#1E2D40',
    backgroundColor: '#0A0F1A',
  },
  chipActive: {
    backgroundColor: '#2A5298',
    borderColor: '#2A5298',
  },
  chipText: {
    color: '#8A9BB5',
    fontSize: 13,
  },
  chipTextActive: {
    color: '#F0F4F8',
  },
  customInput: {
    backgroundColor: '#0A0F1A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E2D40',
    paddingVertical: 9,
    paddingHorizontal: 12,
    color: '#F0F4F8',
    fontSize: 14,
    marginBottom: 20,
  },
  done: {
    backgroundColor: '#2A5298',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  doneText: {
    color: '#F0F4F8',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
