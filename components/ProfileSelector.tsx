import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { profiles } from '../data/profiles';
import { DayProfile } from '../data/types';

interface Props {
  activeProfileId: string;
  activeProfile: DayProfile;
  onSelect: (profile: DayProfile) => void;
  onTriggerUpdate?: (profile: DayProfile) => void;
}

export function ProfileSelector({ activeProfileId, activeProfile, onSelect, onTriggerUpdate }: Props) {
  const [visible, setVisible] = useState(false);

  if (!__DEV__) return null;

  return (
    <>
      {/* Invisible tap target — bottom-right corner */}
      <Pressable
        style={styles.trigger}
        onPress={() => setVisible(true)}
        hitSlop={20}
      />

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Scenario</Text>

          {onTriggerUpdate && (
            <Pressable
              style={styles.triggerUpdateButton}
              onPress={() => {
                onTriggerUpdate(activeProfile);
                setVisible(false);
              }}
            >
              <Text style={styles.triggerUpdateText}>⚡ Trigger overnight update now</Text>
            </Pressable>
          )}

          <ScrollView>
            {profiles.map((p) => (
              <Pressable
                key={p.id}
                style={[
                  styles.row,
                  p.id === activeProfileId && styles.rowActive,
                ]}
                onPress={() => {
                  onSelect(p);
                  setVisible(false);
                }}
              >
                <View>
                  <Text
                    style={[
                      styles.rowText,
                      p.id === activeProfileId && styles.rowTextActive,
                    ]}
                  >
                    {p.label}
                  </Text>
                  {p.overnightTwist && (
                    <Text style={styles.twistHint}>has overnight twist</Text>
                  )}
                </View>
                {p.id === activeProfileId && (
                  <Text style={styles.rowCheck}>✓</Text>
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 32,
    height: 32,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: '#0F1923',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '65%',
  },
  sheetTitle: {
    color: '#5A7A9A',
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 12,
  },
  triggerUpdateButton: {
    marginHorizontal: 24,
    marginBottom: 12,
    backgroundColor: '#1A2E1A',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#2A4A2A',
    alignItems: 'center',
  },
  triggerUpdateText: {
    color: '#4CAF7D',
    fontSize: 14,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2535',
  },
  rowActive: {
    backgroundColor: '#1A2535',
  },
  rowText: {
    color: '#8A9BB5',
    fontSize: 15,
  },
  rowTextActive: {
    color: '#F0F4F8',
  },
  twistHint: {
    color: '#2A4A3A',
    fontSize: 11,
    marginTop: 2,
  },
  rowCheck: {
    color: '#4CAF7D',
    fontSize: 16,
  },
});
