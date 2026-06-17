import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AnchorConfirmCard } from './components/AnchorConfirmCard';
import { AdvisoryCard } from './components/AdvisoryCard';
import { OnboardingFlow } from './components/OnboardingFlow';
import { QuietState } from './components/QuietState';
import { SettingsOverlay } from './components/SettingsOverlay';
import { UpdateCard } from './components/UpdateCard';
import { PersonalSetup } from './data/types';
import { useGoogleOAuthCallback } from './hooks/useGoogleCalendar';
import { useNotifications } from './hooks/useNotifications';
import { useUserPlan } from './hooks/useUserPlan';

export default function App() {
  const {
    setup,
    dayProfile,
    loading,
    setupComplete,
    anchorConfirmedToday,
    saveSetup,
    confirmAnchor,
  } = useUserPlan();
  const {
    notificationState,
    triggeredProfileId,
    scheduleOvernightTwist,
    cancelScheduled,
    resetNotificationState,
  } = useNotifications();
  const [adjusting, setAdjusting] = useState(false);
  const [advisoryConfirmed, setAdvisoryConfirmed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  useGoogleOAuthCallback();

  if (loading) {
    return <View style={styles.screen} />;
  }

  const showUpdate =
    !!dayProfile && notificationState === 'triggered' && triggeredProfileId === dayProfile.id;

  async function handleAnchorConfirm(
    anchor: Parameters<typeof confirmAnchor>[0]
  ) {
    await confirmAnchor(anchor);
    setAdjusting(false);
    setAdvisoryConfirmed(false);
  }

  async function handleAdvisoryConfirm() {
    setAdvisoryConfirmed(true);
    if (dayProfile?.overnightTwist) {
      await scheduleOvernightTwist(dayProfile);
    }
  }

  function handleUpdateConfirm() {
    resetNotificationState();
    cancelScheduled();
  }

  async function handleSettingsSave(newSetup: PersonalSetup) {
    await saveSetup(newSetup);
    setAdvisoryConfirmed(false);
  }

  function renderContent() {
    if (!setupComplete) {
      return <OnboardingFlow onComplete={saveSetup} />;
    }

    if (!anchorConfirmedToday || adjusting) {
      return <AnchorConfirmCard onConfirm={handleAnchorConfirm} />;
    }

    if (!dayProfile) return null;

    if (showUpdate) {
      return <UpdateCard profile={dayProfile} onConfirm={handleUpdateConfirm} />;
    }

    if (!dayProfile.recommendation) {
      return <QuietState />;
    }

    return (
      <AdvisoryCard
        profile={dayProfile}
        confirmed={advisoryConfirmed}
        onConfirm={handleAdvisoryConfirm}
        onAdjust={() => setAdjusting(true)}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {setupComplete ? (
        <Pressable onPress={() => setShowSettings(true)}>
          <Text style={styles.wordmark}>Wakety</Text>
        </Pressable>
      ) : (
        <Text style={styles.wordmark}>Wakety</Text>
      )}

      {renderContent()}

      {showSettings && setup && (
        <SettingsOverlay
          visible={showSettings}
          setup={setup}
          onSave={handleSettingsSave}
          onDismiss={() => setShowSettings(false)}
        />
      )}
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
