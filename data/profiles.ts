import { DayProfile } from './types';

export const profiles: DayProfile[] = [
  {
    id: 'school-normal',
    label: 'School run — normal',
    anchor: {
      type: 'school_run',
      label: "Oliver's school drop-off",
      time: '08:30',
      rigidity: 'hard',
    },
    personalChain: {
      prepMinutes: 45,
      commuteMinutes: 20,
      bufferMinutes: 10,
    },
    conditions: {
      type: 'normal',
      detail: 'All clear on your usual route.',
    },
    recommendation: {
      wakeTime: '07:15',
      leaveByTime: '08:00',
      explanation: "Leaving by 8:00 gives you a comfortable margin for the drop-off.",
    },
    overnightTwist: {
      triggerTime: '05:30',
      updatedWakeTime: '07:00',
      updatedLeaveByTime: '07:45',
      updatedExplanation: "Your usual line is now running 15 minutes late — heading out by 7:45 keeps the drop-off on time.",
    },
  },
  {
    id: 'school-transit',
    label: 'School run — transit disruption',
    anchor: {
      type: 'school_run',
      label: "Oliver's school drop-off",
      time: '08:30',
      rigidity: 'hard',
    },
    personalChain: {
      prepMinutes: 45,
      commuteMinutes: 35,
      bufferMinutes: 15,
    },
    conditions: {
      type: 'transit_disruption',
      detail: 'Northern line running 15 minutes late due to a signal fault.',
    },
    recommendation: {
      wakeTime: '07:00',
      leaveByTime: '07:45',
      explanation: "Your usual line is running 15 minutes late — heading out by 7:45 keeps the drop-off on time.",
    },
  },
  {
    id: 'flight-gate-change',
    label: 'Early flight — gate change',
    anchor: {
      type: 'flight',
      label: 'Flight LH1234 to Amsterdam',
      time: '09:30',
      rigidity: 'hard',
    },
    personalChain: {
      prepMinutes: 45,
      commuteMinutes: 40,
      bufferMinutes: 90,
    },
    conditions: {
      type: 'flight_delay',
      detail: 'Gate moved from Terminal 1 to Terminal 2 — adds a 15-minute transfer.',
    },
    recommendation: {
      wakeTime: '06:20',
      leaveByTime: '07:05',
      explanation: "Your gate moved to Terminal 2 — leaving 15 minutes earlier covers the terminal transfer.",
    },
    overnightTwist: {
      triggerTime: '04:45',
      updatedWakeTime: '05:50',
      updatedLeaveByTime: '06:35',
      updatedExplanation: "Your flight moved up 30 minutes — you'll want to leave by 6:35 to keep your check-in window.",
    },
  },
  {
    id: 'interview-traffic',
    label: 'Job interview — heavy traffic',
    anchor: {
      type: 'interview',
      label: 'Interview at Northgate Partners',
      time: '10:00',
      rigidity: 'hard',
    },
    personalChain: {
      prepMinutes: 60,
      commuteMinutes: 55,
      bufferMinutes: 15,
    },
    conditions: {
      type: 'traffic_heavy',
      detail: 'Roadworks on your usual route adding 20 minutes.',
    },
    recommendation: {
      wakeTime: '07:50',
      leaveByTime: '08:50',
      explanation: "Traffic is heavier than usual — leaving by 8:50 gets you there with time to settle in.",
    },
    overnightTwist: {
      triggerTime: '06:00',
      updatedWakeTime: '07:30',
      updatedLeaveByTime: '08:30',
      updatedExplanation: "Roadworks cleared overnight — traffic's back to normal, so 8:30 departure is fine.",
    },
  },
  {
    id: 'quiet-day',
    label: 'Quiet day — nothing significant',
    anchor: null,
    personalChain: {
      prepMinutes: 0,
      commuteMinutes: 0,
      bufferMinutes: 0,
    },
    conditions: {
      type: 'normal',
      detail: 'Nothing significant tomorrow.',
    },
    recommendation: null,
  },
];

export const defaultProfile = profiles[0];
