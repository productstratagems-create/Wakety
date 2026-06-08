import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DayProfile } from '../data/types';
import { AnchorTag } from './AnchorTag';

interface Props {
  profile: DayProfile;
  onConfirm: () => void;
}

export function UpdateCard({ profile, onConfirm }: Props) {
  const { anchor, recommendation, overnightTwist } = profile;

  if (!overnightTwist || !anchor || !recommendation) return null;

  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Updated</Text>
      </View>

      <Text style={styles.label}>Wake up at</Text>

      <Text style={styles.time}>{overnightTwist.updatedWakeTime}</Text>

      <Text style={styles.leaveBy}>
        Leave by {overnightTwist.updatedLeaveByTime}
      </Text>

      <Text style={styles.explanation}>{overnightTwist.updatedExplanation}</Text>

      <View style={styles.wasRow}>
        <Text style={styles.wasLabel}>Was </Text>
        <Text style={styles.wasTime}>{recommendation.wakeTime}</Text>
      </View>

      <View style={styles.anchorRow}>
        <AnchorTag anchor={anchor} />
      </View>

      <Pressable
        style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
        onPress={onConfirm}
      >
        <Text style={styles.primaryText}>Got it</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  badge: {
    backgroundColor: '#1E3A2A',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 28,
  },
  badgeText: {
    color: '#4CAF7D',
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  label: {
    fontSize: 14,
    color: '#5A7A9A',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  time: {
    fontSize: 80,
    fontWeight: '200',
    color: '#F0F4F8',
    letterSpacing: -2,
    lineHeight: 88,
  },
  leaveBy: {
    fontSize: 14,
    color: '#3D6080',
    marginTop: 2,
    marginBottom: 28,
    letterSpacing: 0.3,
  },
  explanation: {
    fontSize: 17,
    color: '#C5D4E8',
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '300',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  wasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  wasLabel: {
    fontSize: 13,
    color: '#3D5A70',
  },
  wasTime: {
    fontSize: 13,
    color: '#3D5A70',
    textDecorationLine: 'line-through',
  },
  anchorRow: {
    marginBottom: 48,
  },
  primary: {
    backgroundColor: '#1E3A2A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#2A5C3A',
  },
  primaryText: {
    color: '#4CAF7D',
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  pressed: {
    opacity: 0.7,
  },
});
