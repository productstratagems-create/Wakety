import { useEffect, useState } from 'react';
import { computeDayProfile } from '../data/computeRecommendation';
import { loadUserPlan, saveUserPlan } from '../data/storage';
import { UserPlan } from '../data/types';

export function useUserPlan() {
  const [plan, setPlan] = useState<UserPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    loadUserPlan().then((p) => {
      setPlan(p);
      setLoading(false);
    });
  }, []);

  async function savePlan(newPlan: UserPlan) {
    await saveUserPlan(newPlan);
    setPlan(newPlan);
    setConfirmed(false);
  }

  function confirm() {
    setConfirmed(true);
  }

  function resetConfirmed() {
    setConfirmed(false);
  }

  const dayProfile = plan ? computeDayProfile(plan) : null;

  return { plan, dayProfile, loading, confirmed, savePlan, confirm, resetConfirmed };
}
