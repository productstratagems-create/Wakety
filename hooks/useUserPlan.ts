import { useEffect, useState } from 'react';
import { applyTravelOverride, computeDayProfile } from '../data/computeRecommendation';
import { loadUserPlan, saveUserPlan } from '../data/storage';
import { UserPlan } from '../data/types';
import { useTravelTimes } from './useTravelTimes';

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

  const baseDayProfile = plan ? computeDayProfile(plan) : null;
  const travelLegs = useTravelTimes(baseDayProfile?.anchors ?? []);
  const firstAnchor = baseDayProfile?.anchors[0];
  const firstLeg = firstAnchor
    ? travelLegs.find((leg) => leg.key === `${firstAnchor.time}-${firstAnchor.label}`)
    : undefined;
  const dayProfile = baseDayProfile ? applyTravelOverride(baseDayProfile, firstLeg) : null;

  return { plan, dayProfile, loading, confirmed, savePlan, confirm, resetConfirmed };
}
