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

export interface AnchorLocation {
  name: string;
  lat: number;
  lon: number;
}

export interface AnchorEvent {
  type: AnchorType;
  label: string;
  time: string;
  rigidity: Rigidity;
  location?: AnchorLocation;
  fromLocation?: AnchorLocation;
}

export interface UserPlan {
  id: string;
  label?: string;
  hasAnchor: boolean;
  anchors: AnchorEvent[];
  personalChain: {
    prepMinutes: number;
    commuteMinutes: number;
    bufferMinutes: number;
  };
}

export interface DayProfile {
  id: string;
  label: string;
  anchor: AnchorEvent | null;
  anchors: AnchorEvent[];
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
