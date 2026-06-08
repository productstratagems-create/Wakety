import { useState } from 'react';
import { DayProfile } from '../data/types';
import { defaultProfile } from '../data/profiles';

export function useProfile() {
  const [activeProfile, setActiveProfile] = useState<DayProfile>(defaultProfile);
  const [confirmed, setConfirmed] = useState(false);

  function selectProfile(profile: DayProfile) {
    setActiveProfile(profile);
    setConfirmed(false);
  }

  function confirm() {
    setConfirmed(true);
  }

  function reset() {
    setConfirmed(false);
  }

  return { activeProfile, confirmed, selectProfile, confirm, reset };
}
