export type AnchorType =
  | 'school_run'
  | 'flight'
  | 'interview'
  | 'meeting'
  | 'appointment';

export type ConditionType =
  | 'normal'
  | 'traffic_heavy'
  | 'transit_disruption'
  | 'flight_delay';

export interface UserPlan {
  id: string;
  label?: string;
  anchor: {
    type: AnchorType;
    label: string;
    time: string;
  } | null;
  personalChain: {
    prepMinutes: number;
    commuteMinutes: number;
    bufferMinutes: number;
  };
}

export interface DayProfile {
  id: string;
  label: string;
  anchor: {
    type: AnchorType;
    label: string;
    time: string;
  } | null;
  personalChain: {
    prepMinutes: number;
    commuteMinutes: number;
    bufferMinutes: number;
  };
  conditions: {
    type: ConditionType;
    detail: string;
  };
  recommendation: {
    wakeTime: string;
    leaveByTime: string;
    explanation: string;
  } | null;
  overnightTwist?: {
    triggerTime: string;
    updatedWakeTime: string;
    updatedLeaveByTime: string;
    updatedExplanation: string;
  };
}
