import { AnchorType, DayProfile, UserPlan } from './types';

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

function buildExplanation(plan: UserPlan, leaveByTime: string): string {
  const { anchor, personalChain } = plan;
  const noun = ANCHOR_NOUNS[anchor!.type];

  if (personalChain.bufferMinutes >= 30) {
    return `Leaving by ${leaveByTime} gives you a solid buffer (${personalChain.bufferMinutes} min) for ${noun}.`;
  }
  if (personalChain.bufferMinutes <= 5) {
    return `It's tight — leaving by ${leaveByTime} gets you to ${anchor!.label} right on time for ${noun}.`;
  }
  return `Leaving by ${leaveByTime} gives you a comfortable margin for ${noun}.`;
}

export function computeDayProfile(plan: UserPlan): DayProfile {
  if (!plan.hasAnchor || !plan.anchor) {
    return {
      id: plan.id,
      label: plan.label ?? 'Tomorrow',
      anchor: null,
      personalChain: plan.personalChain,
      conditions: { type: 'normal', detail: 'Nothing significant tomorrow.' },
      recommendation: null,
    };
  }

  const { anchor, personalChain } = plan;
  const leaveByMins = toMinutes(anchor.time) - (personalChain.commuteMinutes + personalChain.bufferMinutes);
  const wakeMins = leaveByMins - personalChain.prepMinutes;

  const leaveByTime = fromMinutes(leaveByMins);
  const wakeTime = fromMinutes(wakeMins);

  return {
    id: plan.id,
    label: plan.label ?? 'Tomorrow',
    anchor,
    personalChain,
    conditions: { type: 'normal', detail: 'All clear on your usual route.' },
    recommendation: {
      wakeTime,
      leaveByTime,
      explanation: buildExplanation(plan, leaveByTime),
    },
  };
}
