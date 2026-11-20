export type DomainId =
  | 'guitar'
  | 'drawing'
  | 'japanese'
  | 'bouldering'
  | 'entrepreneurship'
  | 'meditation'
  | 'stretching';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export type ChallengeRating = 'too_easy' | 'optimal' | 'too_hard';

export type DayMode = 'normal' | 'peak' | 'med';

export type Intensity = 'low' | 'moderate' | 'high';

export type ToolHint =
  | 'metronome'
  | 'rest_timer'
  | 'meditation_bell'
  | 'stretch_guide'
  | 'focus_sprint';

export type ThemeMode = 'noir' | 'reload' | 'washi' | 'dark' | 'light';

export type PriorityPreset =
  | 'skills_first'
  | 'balanced'
  | 'entrepreneurship_first';

export interface StretchPose {
  id: string;
  name: string;
  target: string;
  holdSeconds: number;
  bilateral?: boolean;
  cue: string;
}

export interface DrillPhase {
  id: string;
  title: string;
  minutes: number;
  instruction: string;
  toolHint?: ToolHint;
  stretchPoses?: StretchPose[];
}

export interface SessionTemplate {
  id: string;
  domainId: DomainId;
  title: string;
  track: string;
  level: SkillLevel;
  targetMinutes: number;
  intensity: Intensity;
  fingerLoad: 0 | 1 | 2 | 3;
  isMicroBlock?: boolean;
  phases: DrillPhase[];
  methodologyNote: string;
}

export interface CurriculumMilestone {
  id: string;
  text: string;
  completed: boolean;
}

export interface CurriculumStage {
  id: string;
  index: number;
  title: string;
  description: string;
  milestones: CurriculumMilestone[];
}

export interface DomainConfig {
  id: DomainId;
  name: string;
  shortName: string;
  level: SkillLevel;
  priority: 1 | 2 | 3 | 4 | 5;
  weeklyTargetDays: number;
  defaultMinutes: number;
  color: string;
  tracks: string[];
  currentStageIndex: number;
  stages: CurriculumStage[];
  customDrills: SessionTemplate[];
}

export interface FixedCommitment {
  id: string;
  title: string;
  startMin: number;
  endMin: number;
}

export interface DailyCheckIn {
  energy: 1 | 2 | 3 | 4 | 5;
  fingerReadiness: 1 | 2 | 3 | 4 | 5;
  bodySoreness: 1 | 2 | 3 | 4 | 5;
  wakeMin: number;
  sleepMin: number;
  isBoulderingDay: boolean;
  mode: DayMode;
  commitments: FixedCommitment[];
}

export interface ScheduledBlock {
  id: string;
  dateKey: string;
  domainId: DomainId;
  templateId: string;
  title: string;
  subtitle: string;
  track: string;
  startMin: number;
  endMin: number;
  locked: boolean;
  status: 'pending' | 'completed' | 'skipped';
  energyWindow: string;
  rationale: string;
  intensity: Intensity;
  fingerLoad: 0 | 1 | 2 | 3;
  methodologyNote: string;
  phases: DrillPhase[];
  sessionLogId?: string;
}

export interface SessionMetrics {
  bpm?: number;
  maxGrade?: string;
  attempts?: number;
  sends?: number;
  minedCards?: number;
  immersionMin?: number;
  deliverable?: string;
}

export interface SessionLog {
  id: string;
  dateKey: string;
  domainId: DomainId;
  templateId: string;
  title: string;
  track: string;
  plannedMinutes: number;
  actualMinutes: number;
  quality: 1 | 2 | 3 | 4 | 5;
  challenge: ChallengeRating;
  fingerFatigue?: 1 | 2 | 3 | 4 | 5;
  fingerLoad: 0 | 1 | 2 | 3;
  metrics?: SessionMetrics;
  takeaway: string;
  nextFocus: string;
  completedAt: string;
  updatedAt: string;
}

export interface EntrepreneurTask {
  id: string;
  title: string;
  category: 'build' | 'distribution' | 'strategy';
  venture: string;
  done: boolean;
  isDominoToday: boolean;
  createdAt: string;
}

export interface WeeklyDayTemplate {
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  isBoulderingDay: boolean;
  boulderingFocus: 'limit' | 'volume' | 'capacity';
  focusNote: string;
}

export interface DayRecord {
  dateKey: string;
  checkIn: DailyCheckIn;
  blocks: ScheduledBlock[];
  summaryNotes: string[];
  updatedAt: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface AppSettings {
  theme: ThemeMode;
  defaultWakeMin: number;
  defaultSleepMin: number;
  priorityPreset: PriorityPreset;
  supabaseConfig: SupabaseConfig;
}

export interface TendonFatigueReport {
  score: number; // 0..100
  level: 'low' | 'moderate' | 'high';
  climbedYesterday: boolean;
  recentHighLoadCount: number;
  warnings: string[];
}

export interface ProgressionSuggestion {
  id: string;
  domainId: DomainId;
  title: string;
  reason: string;
  actionType:
    | 'bump_meditation_minutes'
    | 'advance_stage'
    | 'challenge_calibration'
    | 'protect_tendons';
  actionPayload?: {
    newMinutes?: number;
    nextStageIndex?: number;
  };
}

export interface DomainMasteryStat {
  domainId: DomainId;
  rank: 1 | 2 | 3 | 4 | 5;
  rankLabel: string;
  score: number; // 0..100
  nextRankProgress: number; // 0..100 within current rank tier
  totalMinutes: number;
  sessionsCount: number;
  currentStreak: number;
}

export interface CompletedToastPayload {
  id: string;
  domainId: DomainId;
  title: string;
  minutes: number;
  pointsGained: number;
  newRank: 1 | 2 | 3 | 4 | 5;
  rankLabel: string;
  nextRankProgress: number;
  metricText?: string;
}
