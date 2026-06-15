export type AnchorType =
  | 'school_run'
  | 'flight'
  | 'interview'
  | 'meeting'
  | 'appointment';

export type Rigidity = 'hard' | 'medium' | 'flexible';

export type ConditionType =
  | 'normal'
  | 'traffic_heavy'
  | 'transit_disruption'
  | 'flight_delay';

export interface UserPlan {
  id: string;
  label?: string;
  hasAnchor: boolean;
  anchor: {
    type: AnchorType;
    label: string;
    time: string;
    rigidity: Rigidity;
  } | null;
  personalChain: {
    prepMinutes: number;
    commuteMinutes: number;
    bufferMinutes: number;
    fromStation: string;
    toStation: string;
  };
}

export interface DayProfile {
  id: string;
  label: string;
  anchor: {
    type: AnchorType;
    label: string;
    time: string;
    rigidity: Rigidity;
  } | null;
  personalChain: {
    prepMinutes: number;
    commuteMinutes: number;
    bufferMinutes: number;
    fromStation: string;
    toStation: string;
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
