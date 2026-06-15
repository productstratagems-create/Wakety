import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AnchorEvent, AnchorType } from '../data/types';

export const ANCHOR_ICONS: Record<AnchorType, string> = {
  school_run: '🎒',
  flight: '✈️',
  interview: '💼',
  meeting: '📅',
  appointment: '🏥',
};

interface Props {
  anchor: AnchorEvent;
  compact?: boolean;
}

export function AnchorTag({ anchor, compact }: Props) {
  const icon = ANCHOR_ICONS[anchor.type];
  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <Text style={[styles.text, compact && styles.textCompact]}>
        {icon}  {anchor.label} · {anchor.time}
        {anchor.location && !compact ? ` · ${anchor.location.name}` : ''}
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
  containerCompact: {
    backgroundColor: 'transparent',
    paddingVertical: 3,
  },
  text: {
    color: '#8A9BB5',
    fontSize: 13,
    letterSpacing: 0.2,
  },
  textCompact: {
    color: '#5A7A9A',
    fontSize: 12,
  },
});
