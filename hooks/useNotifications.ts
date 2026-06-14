import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { DayProfile } from '../data/types';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export type NotificationState = 'idle' | 'scheduled' | 'triggered';

export function useNotifications() {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [notificationState, setNotificationState] = useState<NotificationState>('idle');
  const [triggeredProfileId, setTriggeredProfileId] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const scheduledIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    requestPermissions();

    notificationListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const profileId = response.notification.request.content.data?.profileId as string | undefined;
        if (profileId) {
          setTriggeredProfileId(profileId);
          setNotificationState('triggered');
        }
      }
    );

    const foregroundListener = Notifications.addNotificationReceivedListener((notification) => {
      const profileId = notification.request.content.data?.profileId as string | undefined;
      if (profileId) {
        setTriggeredProfileId(profileId);
        setNotificationState('triggered');
      }
    });

    return () => {
      notificationListener.current?.remove();
      foregroundListener.remove();
    };
  }, []);

  async function requestPermissions() {
    if (Platform.OS === 'web') return;
    const { status } = await Notifications.requestPermissionsAsync();
    setPermissionGranted(status === 'granted');
  }

  async function scheduleOvernightTwist(profile: DayProfile) {
    if (Platform.OS === 'web' || !profile.overnightTwist || !permissionGranted) return;

    // Cancel any previously scheduled update
    if (scheduledIdRef.current) {
      await Notifications.cancelScheduledNotificationAsync(scheduledIdRef.current);
    }

    const { triggerTime, updatedWakeTime, updatedExplanation } = profile.overnightTwist;

    // Parse HH:MM and schedule for today (or next occurrence)
    const [hours, minutes] = triggerTime.split(':').map(Number);
    const trigger = new Date();
    trigger.setHours(hours, minutes, 0, 0);
    // If the trigger time has already passed today, schedule for next day
    if (trigger.getTime() <= Date.now()) {
      trigger.setDate(trigger.getDate() + 1);
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Wake up at ${updatedWakeTime} now`,
        body: updatedExplanation,
        data: { profileId: profile.id },
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger },
    });

    scheduledIdRef.current = id;
    setNotificationState('scheduled');
    return id;
  }

  // Dev-only: fire the twist immediately (for testing without waiting overnight)
  async function triggerUpdateNow(profile: DayProfile) {
    if (Platform.OS === 'web' || !profile.overnightTwist) return;

    const { updatedWakeTime, updatedExplanation } = profile.overnightTwist;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Wake up at ${updatedWakeTime} now`,
        body: updatedExplanation,
        data: { profileId: profile.id },
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 2 },
    });
  }

  async function cancelScheduled() {
    if (Platform.OS === 'web' || !scheduledIdRef.current) return;
    if (scheduledIdRef.current) {
      await Notifications.cancelScheduledNotificationAsync(scheduledIdRef.current);
      scheduledIdRef.current = null;
    }
    setNotificationState('idle');
  }

  function resetNotificationState() {
    setNotificationState('idle');
    setTriggeredProfileId(null);
  }

  return {
    permissionGranted,
    notificationState,
    triggeredProfileId,
    scheduleOvernightTwist,
    triggerUpdateNow,
    cancelScheduled,
    resetNotificationState,
  };
}
