import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnchorType, PersonalSetup, UserPlan } from './types';

const PLAN_KEY = 'wakety.userPlan.v1';
const SETUP_KEY = 'wakety.setup.v1';
const DAY_KEY = 'wakety.day.v1';

export async function loadPersonalSetup(): Promise<PersonalSetup | null> {
  const raw = await AsyncStorage.getItem(SETUP_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as PersonalSetup; } catch { return null; }
}

export async function savePersonalSetup(setup: PersonalSetup): Promise<void> {
  await AsyncStorage.setItem(SETUP_KEY, JSON.stringify(setup));
}

export interface StoredDayConfirmation {
  confirmedDate: string; // YYYY-MM-DD
  anchor: { type: AnchorType; label: string; time: string } | null;
}

export async function loadDayConfirmation(): Promise<StoredDayConfirmation | null> {
  const raw = await AsyncStorage.getItem(DAY_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as StoredDayConfirmation; } catch { return null; }
}

export async function saveDayConfirmation(conf: StoredDayConfirmation): Promise<void> {
  await AsyncStorage.setItem(DAY_KEY, JSON.stringify(conf));
}

// Legacy plan storage (kept for backward compat)
export async function loadUserPlan(): Promise<UserPlan | null> {
  const raw = await AsyncStorage.getItem(PLAN_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as UserPlan; } catch { return null; }
}

export async function saveUserPlan(plan: UserPlan): Promise<void> {
  await AsyncStorage.setItem(PLAN_KEY, JSON.stringify(plan));
}

export async function clearUserPlan(): Promise<void> {
  await AsyncStorage.removeItem(PLAN_KEY);
}
