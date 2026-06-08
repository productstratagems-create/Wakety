import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DayProfile } from '../data/types';

const ANCHOR_ICONS: Record<NonNullable<DayProfile['anchor']>['type'], string> = {
  school_run: '🎒',
  flight: '✈️',
  interview: '💼',
  meeting: '📅',
  appointment: '🏥',
};

interface Props {
  anchor: NonNullable<DayProfile['anchor']>;
}

export function AnchorTag({ anchor }: Props) {
  const icon = ANCHOR_ICONS[anchor.type];
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {icon}  {anchor.label} · {anchor.time}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A2535',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignSelf: 'center',
  },
  text: {
    color: '#8A9BB5',
    fontSize: 13,
    letterSpacing: 0.2,
  },
});
