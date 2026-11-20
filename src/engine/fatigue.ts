import type { SessionLog, TendonFatigueReport } from '../types/planner';
import { diffDays } from '../utils/date';

/**
 * Computes rolling 7-day tendon stress (exponentially decayed) combined with
 * today's subjective finger readiness (1..5).
 */
export function computeTendonLoad(
  logs: SessionLog[],
  todayKey: string,
  fingerReadiness: number
): TendonFatigueReport {
  let weightedLoad = 0;
  let climbedYesterday = false;
  let recentHighLoadCount = 0;

  for (const log of logs) {
    const ageDays = diffDays(log.dateKey, todayKey);
    if (ageDays < 0 || ageDays > 7) continue;

    if (ageDays === 1 && log.domainId === 'bouldering') {
      climbedYesterday = true;
    }

    if (log.fingerLoad >= 2 && ageDays <= 4) {
      recentHighLoadCount += 1;
    }

    const baseStress =
      log.fingerLoad === 3
        ? 30
        : log.fingerLoad === 2
          ? 18
          : log.fingerLoad === 1
            ? 5
            : 0;

    if (baseStress === 0) continue;

    const durationFactor = Math.max(0.6, Math.min(1.4, (log.actualMinutes || 45) / 60));
    const fatigueBonus =
      log.fingerFatigue && log.fingerFatigue > 2 ? (log.fingerFatigue - 2) * 4 : 0;

    const decay = Math.exp(-ageDays * 0.38);
    weightedLoad += (baseStress * durationFactor + fatigueBonus) * decay;
  }

  const clampedReadiness = Math.max(1, Math.min(5, fingerReadiness));
  const readinessPenalty = (5 - clampedReadiness) * 12;
  const score = Math.max(0, Math.min(100, Math.round(weightedLoad + readinessPenalty)));

  let level: 'low' | 'moderate' | 'high' = 'low';
  if (score >= 65 || clampedReadiness <= 2) {
    level = 'high';
  } else if (score >= 35) {
    level = 'moderate';
  }

  const warnings: string[] = [];
  if (climbedYesterday) {
    warnings.push(
      'You bouldered yesterday — finger pulleys normally need ~48h between limit sessions.'
    );
  }
  if (clampedReadiness <= 2) {
    warnings.push(
      `Low finger readiness (${clampedReadiness}/5) — auto-protecting tendons with low-tension drills.`
    );
  } else if (score >= 65) {
    warnings.push(
      `High 7-day tendon load (${score}/100) — shifting heavy grip work toward ear training and recovery.`
    );
  }

  return {
    score,
    level,
    climbedYesterday,
    recentHighLoadCount,
    warnings,
  };
}

export function shouldProtectFingers(fatigue: TendonFatigueReport): boolean {
  return fatigue.level === 'high';
}
