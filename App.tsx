import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AdvisoryCard } from './components/AdvisoryCard';
import { ProfileSelector } from './components/ProfileSelector';
import { QuietState } from './components/QuietState';
import { UpdateCard } from './components/UpdateCard';
import { useNotifications } from './hooks/useNotifications';
import { useProfile } from './hooks/useProfile';

export default function App() {
  const { activeProfile, confirmed, selectProfile, confirm, reset } = useProfile();
  const {
    notificationState,
    triggeredProfileId,
    scheduleOvernightTwist,
    triggerUpdateNow,
    cancelScheduled,
    resetNotificationState,
  } = useNotifications();

  // When a notification fires for the active profile, surface the update
  const showUpdate =
    notificationState === 'triggered' && triggeredProfileId === activeProfile.id;

  // When the user confirms the advisory, schedule the overnight watch
  async function handleConfirm() {
    confirm();
    if (activeProfile.overnightTwist) {
      await scheduleOvernightTwist(activeProfile);
    }
  }

  function handleAdjust() {
    Alert.alert(
      'Adjust wake time',
      'In the full app, you can nudge the time ± 15 minutes.\n\nThis interaction is being tested in Phase 1.',
      [{ text: 'OK' }]
    );
  }

  function handleUpdateConfirm() {
    resetNotificationState();
    cancelScheduled();
  }

  function handleProfileChange(profile: Parameters<typeof selectProfile>[0]) {
    reset();
    resetNotificationState();
    cancelScheduled();
    selectProfile(profile);
  }

  function renderContent() {
    if (showUpdate) {
      return (
        <UpdateCard
          profile={activeProfile}
          onConfirm={handleUpdateConfirm}
        />
      );
    }

    if (!activeProfile.recommendation) {
      return <QuietState />;
    }

    return (
      <AdvisoryCard
        profile={activeProfile}
        confirmed={confirmed}
        onConfirm={handleConfirm}
        onAdjust={handleAdjust}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <Text style={styles.wordmark}>Wakety</Text>

      {renderContent()}

      <ProfileSelector
        activeProfileId={activeProfile.id}
        onSelect={handleProfileChange}
        onTriggerUpdate={
          activeProfile.overnightTwist && confirmed ? triggerUpdateNow : undefined
        }
        activeProfile={activeProfile}
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
