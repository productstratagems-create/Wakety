import React from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { DayProfile } from '../data/types';
import { useTravelTimes } from '../hooks/useTravelTimes';
import { AnchorTag } from './AnchorTag';

interface Props {
  profile: DayProfile;
  confirmed: boolean;
  onConfirm: () => void;
  onAdjust: () => void;
}

export function AdvisoryCard({ profile, confirmed, onConfirm, onAdjust }: Props) {
  const { anchor, anchors, recommendation } = profile;
  const travelLegs = useTravelTimes(anchors);

  if (!recommendation || !anchor) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Wake up at</Text>

      <View style={styles.timeRow}>
        <Text style={styles.time}>{recommendation.wakeTime}</Text>
        {confirmed && <Text style={styles.check}>✓</Text>}
      </View>

      <Text style={styles.leaveBy}>
        Leave by {recommendation.leaveByTime}
      </Text>

      <Text style={styles.explanation}>{recommendation.explanation}</Text>

      <View style={styles.anchorRow}>
        <AnchorTag anchor={anchor} />
        {anchors.slice(1).map((extra, index) => (
          <AnchorTag key={`${extra.time}-${extra.label}-${index}`} anchor={extra} compact />
        ))}
      </View>

      {travelLegs.map((leg) => (
        <Text key={leg.key} style={leg.tight ? styles.travelWarning : styles.travelInfo}>
          {leg.tight
            ? `⚠ Only ${leg.gapMinutes} min between ${leg.fromLabel} and ${leg.toLabel}, but it's about a ${leg.travelMinutes} min trip.`
            : `${leg.icon} ~${leg.travelMinutes} min from ${leg.fromLabel} to ${leg.toLabel}`}
        </Text>
      ))}

      {confirmed ? (
        <View style={styles.confirmedBlock}>
          <Text style={styles.confirmedText}>Good night.</Text>
          <Text style={styles.confirmedSub}>
            We'll let you know if anything changes.
          </Text>
        </View>
      ) : (
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
            onPress={onConfirm}
          >
            <Text style={styles.primaryText}>Sounds right</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
            onPress={onAdjust}
          >
            <Text style={styles.secondaryText}>Adjust</Text>
          </Pressable>
        </View>
      )}
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
  label: {
    fontSize: 14,
    color: '#5A7A9A',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  time: {
    fontSize: 80,
    fontWeight: '200',
    color: '#F0F4F8',
    letterSpacing: -2,
    lineHeight: 88,
  },
  check: {
    fontSize: 28,
    color: '#4CAF7D',
    marginTop: 16,
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
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  anchorRow: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 52,
  },
  travelWarning: {
    color: '#E0B88A',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  travelInfo: {
    color: '#5A7A9A',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
    paddingHorizontal: 16,
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
  },
  secondaryText: {
    color: '#5A7A9A',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  pressed: {
    opacity: 0.7,
  },
  confirmedBlock: {
    alignItems: 'center',
    gap: 8,
  },
  confirmedText: {
    fontSize: 22,
    fontWeight: '300',
    color: '#F0F4F8',
    letterSpacing: 0.5,
  },
  confirmedSub: {
    fontSize: 14,
    color: '#3D6080',
    textAlign: 'center',
    lineHeight: 20,
  },
});
