import { useEffect, useState } from 'react';
import { computeDayProfile } from '../data/computeRecommendation';
import {
  StoredDayConfirmation,
  loadDayConfirmation,
  loadPersonalSetup,
  saveDayConfirmation,
  savePersonalSetup,
} from '../data/storage';
import { AnchorType, DayProfile, PersonalSetup } from '../data/types';

const BUFFER_MINUTES = 10;

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function useUserPlan() {
  const [setup, setSetup] = useState<PersonalSetup | null>(null);
  const [dayConf, setDayConf] = useState<StoredDayConfirmation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([loadPersonalSetup(), loadDayConfirmation()]).then(([s, d]) => {
      setSetup(s);
      setDayConf(d);
      setLoading(false);
    });
  }, []);

  const today = todayString();
  const setupComplete = setup !== null;
  const anchorConfirmedToday = dayConf?.confirmedDate === today;

  async function saveSetup(newSetup: PersonalSetup) {
    await savePersonalSetup(newSetup);
    setSetup(newSetup);
  }

  async function confirmAnchor(
    anchor: { type: AnchorType; label: string; time: string } | null
  ) {
    const conf: StoredDayConfirmation = { confirmedDate: today, anchor };
    await saveDayConfirmation(conf);
    setDayConf(conf);
  }

  const dayProfile: DayProfile | null =
    setup && anchorConfirmedToday
      ? computeDayProfile({
          id: 'user-plan',
          label: 'Tomorrow',
          anchor: dayConf?.anchor ?? null,
          personalChain: {
            prepMinutes: setup.prepMinutes,
            commuteMinutes: setup.commuteMinutes,
            bufferMinutes: BUFFER_MINUTES,
          },
        })
      : null;

  return {
    setup,
    dayProfile,
    loading,
    setupComplete,
    anchorConfirmedToday,
    saveSetup,
    confirmAnchor,
  };
}
