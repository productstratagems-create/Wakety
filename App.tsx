import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AdvisoryCard } from './components/AdvisoryCard';
import { PlanForm } from './components/PlanForm';
import { QuietState } from './components/QuietState';
import { UpdateCard } from './components/UpdateCard';
import { useNotifications } from './hooks/useNotifications';
import { useUserPlan } from './hooks/useUserPlan';

export default function App() {
  const { plan, dayProfile, loading, confirmed, savePlan, confirm, resetConfirmed } = useUserPlan();
  const {
    notificationState,
    triggeredProfileId,
    scheduleOvernightTwist,
    cancelScheduled,
    resetNotificationState,
  } = useNotifications();
  const [editing, setEditing] = useState(false);

  if (loading) {
    return <View style={styles.screen} />;
  }

  // When a notification fires for the active profile, surface the update
  const showUpdate =
    !!dayProfile && notificationState === 'triggered' && triggeredProfileId === dayProfile.id;

  // When the user confirms the advisory, schedule the overnight watch
  async function handleConfirm() {
    confirm();
    if (dayProfile?.overnightTwist) {
      await scheduleOvernightTwist(dayProfile);
    }
  }

  function handleAdjust() {
    setEditing(true);
  }

  function handleUpdateConfirm() {
    resetNotificationState();
    cancelScheduled();
  }

  async function handlePlanSubmit(plan: Parameters<typeof savePlan>[0]) {
    resetConfirmed();
    resetNotificationState();
    cancelScheduled();
    await savePlan(plan);
    setEditing(false);
  }

  function renderContent() {
    if (!dayProfile) return null;

    if (showUpdate) {
      return (
        <UpdateCard
          profile={dayProfile}
          onConfirm={handleUpdateConfirm}
        />
      );
    }

    if (!dayProfile.recommendation) {
      return <QuietState />;
    }

    return (
      <AdvisoryCard
        profile={dayProfile}
        confirmed={confirmed}
        onConfirm={handleConfirm}
        onAdjust={handleAdjust}
      />
    );
  }

  const showForm = editing || !dayProfile;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <Text style={styles.wordmark}>Wakety</Text>

      {showForm ? (
        <PlanForm
          initialPlan={plan}
          onSubmit={handlePlanSubmit}
          onCancel={dayProfile ? () => setEditing(false) : undefined}
        />
      ) : (
        renderContent()
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
  editButton: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  editButtonText: {
    color: '#5A7A9A',
    fontSize: 14,
    letterSpacing: 0.3,
  },
});
