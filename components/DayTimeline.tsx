import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AnchorEvent } from '../data/types';
import { TravelLeg } from '../hooks/useTravelTimes';
import { AnchorTag } from './AnchorTag';

interface Props {
  anchors: AnchorEvent[];
  travelLegs: TravelLeg[];
}

/**
 * Secondary "today at a glance" panel: lists every event in order, with the
 * travel advice for getting to it (if any) shown directly underneath.
 */
export function DayTimeline({ anchors, travelLegs }: Props) {
  if (anchors.length === 0) return null;

  const legByKey = new Map(travelLegs.map((leg) => [leg.key, leg]));

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Today's plan</Text>
      {anchors.map((anchor, index) => {
        const leg = legByKey.get(`${anchor.time}-${anchor.label}`);
        return (
          <View key={`${anchor.time}-${anchor.label}-${index}`} style={styles.item}>
            <AnchorTag anchor={anchor} compact={index > 0} />
            {leg && (
              <Text style={leg.tight ? styles.travelWarning : styles.travelInfo}>
                {leg.tight
                  ? `⚠ Only ${leg.gapMinutes} min between ${leg.fromLabel} and ${leg.toLabel}, but it's about a ${leg.travelMinutes} min trip — leave by ${leg.leaveByTime} to make it.`
                  : `${leg.icon} ~${leg.travelMinutes} min from ${leg.fromLabel} to ${leg.toLabel} — leave by ${leg.leaveByTime}`}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#0F1923',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E2D40',
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  heading: {
    fontSize: 12,
    color: '#5A7A9A',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  item: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  travelWarning: {
    color: '#E0B88A',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 6,
    paddingHorizontal: 8,
  },
  travelInfo: {
    color: '#5A7A9A',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 6,
    paddingHorizontal: 8,
  },
});
