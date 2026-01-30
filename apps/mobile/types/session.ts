export interface TrainingSession {
  id: string;
  startedAt: Date;
  endedAt: Date;
  roundSeconds: number;
  restSeconds: number;
  plannedRounds: number;
  completedRounds: number;
  totalSeconds: number;
  note?: string;
}

export interface SessionSummary {
  roundSeconds: number;
  restSeconds: number;
  plannedRounds: number;
  completedRounds: number;
  totalSeconds: number;
  startedAt: Date;
  endedAt: Date;
}