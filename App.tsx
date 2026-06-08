import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AdvisoryCard } from './components/AdvisoryCard';
import { ProfileSelector } from './components/ProfileSelector';
import { QuietState } from './components/QuietState';
import { useProfile } from './hooks/useProfile';

export default function App() {
  const { activeProfile, confirmed, selectProfile, confirm, reset } = useProfile();

  function handleAdjust() {
    Alert.alert(
      'Adjust wake time',
      'In the full app, you can nudge the time ± 15 minutes.\n\nThis interaction is being tested in Phase 1.',
      [{ text: 'OK' }]
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <Text style={styles.wordmark}>Wakety</Text>

      {activeProfile.recommendation ? (
        <AdvisoryCard
          profile={activeProfile}
          confirmed={confirmed}
          onConfirm={confirm}
          onAdjust={handleAdjust}
        />
      ) : (
        <QuietState />
      )}

      <ProfileSelector
        activeProfileId={activeProfile.id}
        onSelect={(p) => selectProfile(p)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0A0F1A',
    paddingTop: 60,
    paddingBottom: 24,
  },
  wordmark: {
    color: '#1E3A5A',
    fontSize: 13,
    letterSpacing: 3,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 0,
  },
});
