import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserPlan } from './types';

const KEY = 'wakety.userPlan.v1';

export async function loadUserPlan(): Promise<UserPlan | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as UserPlan & { anchor?: UserPlan['anchors'][number] | null };
    if (!parsed.anchors) {
      parsed.anchors = parsed.anchor ? [parsed.anchor] : [];
    }
    delete parsed.anchor;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveUserPlan(plan: UserPlan): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(plan));
}

export async function clearUserPlan(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
