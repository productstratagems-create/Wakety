import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function QuietState() {
  return (
    <View style={styles.container}>
      <Text style={styles.moon}>○</Text>
      <Text style={styles.heading}>All clear tomorrow.</Text>
      <Text style={styles.subtext}>
        Nothing demanding an early start.{'\n'}Sleep in if you need it.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  moon: {
    fontSize: 48,
    color: '#3D5A80',
    marginBottom: 24,
  },
  heading: {
    fontSize: 26,
    fontWeight: '300',
    color: '#F0F4F8',
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  subtext: {
    fontSize: 16,
    color: '#5A7A9A',
    textAlign: 'center',
    lineHeight: 24,
  },
});
