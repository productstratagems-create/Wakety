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
  onSelect: (profile: DayProfile) => void;
}

export function ProfileSelector({ activeProfileId, onSelect }: Props) {
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
                <Text
                  style={[
                    styles.rowText,
                    p.id === activeProfileId && styles.rowTextActive,
                  ]}
                >
                  {p.label}
                </Text>
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
    maxHeight: '60%',
  },
  sheetTitle: {
    color: '#5A7A9A',
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
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
  rowCheck: {
    color: '#4CAF7D',
    fontSize: 16,
  },
});
