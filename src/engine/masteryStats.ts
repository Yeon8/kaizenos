import { DOMAIN_ORDER } from '../data/methodology';
import type {
  DomainConfig,
  DomainId,
  DomainMasteryStat,
  SessionLog,
  ThemeMode,
} from '../types/planner';
import { addDays, getLocalDateKey } from '../utils/date';

export const RANK_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'Novice',
  2: 'Initiate',
  3: 'Adept',
  4: 'Virtuoso',
  5: 'Master',
};

export function normalizeTheme(theme?: ThemeMode): 'noir' | 'reload' | 'washi' {
  if (theme === 'reload') return 'reload';
  if (theme === 'washi' || theme === 'light') return 'washi';
  return 'noir';
}

export function getRankForScore(score: number): {
  rank: 1 | 2 | 3 | 4 | 5;
  rankLabel: string;
  nextRankProgress: number;
} {
  const clamped = Math.max(0, Math.min(100, score));
  if (clamped >= 80) {
    return {
      rank: 5,
      rankLabel: RANK_LABELS[5],
      nextRankProgress: Math.min(100, Math.round(((clamped - 80) / 20) * 100)),
    };
  }
  if (clamped >= 60) {
    return {
      rank: 4,
      rankLabel: RANK_LABELS[4],
      nextRankProgress: Math.round(((clamped - 60) / 20) * 100),
    };
  }
  if (clamped >= 40) {
    return {
      rank: 3,
      rankLabel: RANK_LABELS[3],
      nextRankProgress: Math.round(((clamped - 40) / 20) * 100),
    };
  }
  if (clamped >= 20) {
    return {
      rank: 2,
      rankLabel: RANK_LABELS[2],
      nextRankProgress: Math.round(((clamped - 20) / 20) * 100),
    };
  }
  return {
    rank: 1,
    rankLabel: RANK_LABELS[1],
    nextRankProgress: Math.round((clamped / 20) * 100),
  };
}

function computeStreakForDomain(
  domainLogs: SessionLog[],
  todayKey: string
): number {
  if (domainLogs.length === 0) return 0;
  const dateSet = new Set(domainLogs.map((l) => l.dateKey));
  let cursor = dateSet.has(todayKey) ? todayKey : addDays(todayKey, -1);
  if (!dateSet.has(cursor)) return 0;

  let streak = 0;
  while (dateSet.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function computeSingleDomainMasteryStat(
  domain: DomainConfig,
  logs: SessionLog[],
  todayKey: string = getLocalDateKey()
): DomainMasteryStat {
  const domainLogs = logs.filter((l) => l.domainId === domain.id);
  const totalMinutes = domainLogs.reduce((acc, l) => acc + l.actualMinutes, 0);
  const sessionsCount = domainLogs.length;

  const baseFromLevel =
    domain.level === 'advanced' ? 62 : domain.level === 'intermediate' ? 38 : 14;

  const completedMilestones = domain.stages.reduce(
    (acc, s) => acc + s.milestones.filter((m) => m.completed).length,
    0
  );
  const stageBonus = domain.currentStageIndex * 5 + completedMilestones * 1.5;

  // Logged hours & quality-weighted volume
  const practicePoints = domainLogs.reduce((acc, l) => {
    const qualityMul = 0.8 + (l.quality - 3) * 0.1;
    return acc + Math.max(0.4, (l.actualMinutes / 30) * 1.2 * qualityMul);
  }, 0);

  const rawScore = Math.round(
    Math.min(100, baseFromLevel + stageBonus + practicePoints)
  );
  const { rank, rankLabel, nextRankProgress } = getRankForScore(rawScore);
  const currentStreak = computeStreakForDomain(domainLogs, todayKey);

  return {
    domainId: domain.id,
    rank,
    rankLabel,
    score: rawScore,
    nextRankProgress,
    totalMinutes,
    sessionsCount,
    currentStreak,
  };
}

export function computeMasteryStats(
  domains: Record<DomainId, DomainConfig>,
  logs: SessionLog[],
  todayKey: string = getLocalDateKey()
): Record<DomainId, DomainMasteryStat> {
  const result = {} as Record<DomainId, DomainMasteryStat>;
  for (const id of DOMAIN_ORDER) {
    result[id] = computeSingleDomainMasteryStat(domains[id], logs, todayKey);
  }
  return result;
}
