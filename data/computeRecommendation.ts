import { AnchorType, DayProfile, UserPlan } from './types';
import { TravelLeg } from '../hooks/useTravelTimes';

const ANCHOR_NOUNS: Record<AnchorType, string> = {
  school_run: 'the drop-off',
  flight: 'your flight',
  interview: 'your interview',
  meeting: 'your meeting',
  appointment: 'your appointment',
};

function toMinutes(hhmm: string): number {
  const [hours, minutes] = hhmm.split(':').map(Number);
  return hours * 60 + minutes;
}

function fromMinutes(mins: number): string {
  const wrapped = ((mins % 1440) + 1440) % 1440;
  const hours = Math.floor(wrapped / 60);
  const minutes = wrapped % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function buildExplanation(anchor: UserPlan['anchors'][number], extraCount: number, personalChain: UserPlan['personalChain'], leaveByTime: string): string {
  const noun = ANCHOR_NOUNS[anchor.type];

  let explanation: string;
  if (personalChain.bufferMinutes >= 30) {
    explanation = `Leaving by ${leaveByTime} gives you a solid buffer (${personalChain.bufferMinutes} min) for ${noun}.`;
  } else if (personalChain.bufferMinutes <= 5) {
    explanation = `It's tight — leaving by ${leaveByTime} gets you to ${anchor.label} right on time for ${noun}.`;
  } else {
    explanation = `Leaving by ${leaveByTime} gives you a comfortable margin for ${noun}.`;
  }

  if (extraCount === 1) {
    explanation += ` You've also got something else lined up tomorrow.`;
  } else if (extraCount > 1) {
    explanation += ` You've also got ${extraCount} more things lined up tomorrow.`;
  }

  return explanation;
}

export function computeDayProfile(plan: UserPlan): DayProfile {
  if (!plan.hasAnchor || plan.anchors.length === 0) {
    return {
      id: plan.id,
      label: plan.label ?? 'Tomorrow',
      anchor: null,
      anchors: [],
      personalChain: plan.personalChain,
      conditions: { type: 'normal', detail: 'Nothing significant tomorrow.' },
      recommendation: null,
    };
  }

  const { personalChain } = plan;
  const sortedAnchors = [...plan.anchors].sort((a, b) => toMinutes(a.time) - toMinutes(b.time));
  const anchor = sortedAnchors[0];

  const leaveByMins = toMinutes(anchor.time) - (personalChain.commuteMinutes + personalChain.bufferMinutes);
  const wakeMins = leaveByMins - personalChain.prepMinutes;

  const leaveByTime = fromMinutes(leaveByMins);
  const wakeTime = fromMinutes(wakeMins);

  return {
    id: plan.id,
    label: plan.label ?? 'Tomorrow',
    anchor,
    anchors: sortedAnchors,
    personalChain,
    conditions: { type: 'normal', detail: 'All clear on your usual route.' },
    recommendation: {
      wakeTime,
      leaveByTime,
      explanation: buildExplanation(anchor, sortedAnchors.length - 1, personalChain, leaveByTime),
    },
  };
}

/**
 * Replaces the manual-commute-based recommendation with one based on a real
 * travel-time estimate for the first event, when available. No-op if the leg
 * couldn't be computed (no `fromLocation` set, or the lookup failed).
 */
export function applyTravelOverride(profile: DayProfile, firstLeg: TravelLeg | undefined): DayProfile {
  const anchor = profile.anchors[0];
  if (!profile.recommendation || !anchor || !firstLeg || firstLeg.error || typeof firstLeg.travelMinutes !== 'number') {
    return profile;
  }

  const leaveByMins = toMinutes(anchor.time) - (firstLeg.travelMinutes + profile.personalChain.bufferMinutes);
  const wakeMins = leaveByMins - profile.personalChain.prepMinutes;

  const leaveByTime = fromMinutes(leaveByMins);
  const wakeTime = fromMinutes(wakeMins);

  return {
    ...profile,
    recommendation: {
      wakeTime,
      leaveByTime,
      explanation: buildExplanation(anchor, profile.anchors.length - 1, profile.personalChain, leaveByTime),
    },
  };
}
