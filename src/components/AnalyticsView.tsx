import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Flame,
  Mountain,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { DOMAIN_ORDER } from '../data/methodology';
import { computeTendonLoad } from '../engine/fatigue';
import { computeMasteryStats } from '../engine/masteryStats';
import { computeProgressionSuggestions } from '../engine/progression';
import { usePlannerStore } from '../store/usePlannerStore';
import type { DomainId } from '../types/planner';
import { formatDurationCompact, getLastNDaysKeys, getLocalDateKey } from '../utils/date';
import { DOMAIN_META, DomainBadge, DomainIcon } from './DomainBadge';
import { MasteryStarRadar } from './MasteryStarRadar';

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function Sparkline({
  values,
  color,
  unit,
  label,
}: {
  values: number[];
  color: string;
  unit: string;
  label: string;
}) {
  const width = 180;
  const height = 46;
  if (values.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/55 p-3.5">
        <p className="text-xs font-semibold text-[var(--text-secondary)]">{label}</p>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Complete sessions to plot trend.
        </p>
      </div>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values
    .map((v, idx) => {
      const x =
        values.length === 1 ? width / 2 : (idx / (values.length - 1)) * (width - 8) + 4;
      const y = height - 6 - ((v - min) / span) * (height - 14);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const latest = values[values.length - 1];

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/55 p-3.5">
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <span className="text-xs font-semibold text-[var(--text-secondary)]">
          {label}
        </span>
        <span className="font-mono-tabular text-sm font-bold" style={{ color }}>
          {latest} {unit}
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-12 overflow-visible">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={pts}
        />
      </svg>
    </div>
  );
}

export function AnalyticsView() {
  const domains = usePlannerStore((s) => s.domains);
  const sessionLogs = usePlannerStore((s) => s.sessionLogs);
  const weeklyTemplate = usePlannerStore((s) => s.weeklyTemplate);
  const daysByDate = usePlannerStore((s) => s.daysByDate);
  const updateWeeklyDay = usePlannerStore((s) => s.updateWeeklyDay);
  const applyProgressionSuggestion = usePlannerStore(
    (s) => s.applyProgressionSuggestion
  );

  const [heatmapFilter, setHeatmapFilter] = useState<'all' | DomainId>('all');

  const todayKey = getLocalDateKey();
  const fingerReadiness = daysByDate[todayKey]?.checkIn.fingerReadiness ?? 4;
  const fatigue = useMemo(
    () => computeTendonLoad(sessionLogs, todayKey, fingerReadiness),
    [sessionLogs, todayKey, fingerReadiness]
  );

  const masteryStats = useMemo(
    () => computeMasteryStats(domains, sessionLogs, todayKey),
    [domains, sessionLogs, todayKey]
  );

  const suggestions = useMemo(
    () => computeProgressionSuggestions(domains, sessionLogs, fatigue),
    [domains, sessionLogs, fatigue]
  );

  const last28Keys = useMemo(() => getLastNDaysKeys(28, todayKey), [todayKey]);

  const heatmapData = useMemo(() => {
    return last28Keys.map((dk) => {
      const logs = sessionLogs.filter(
        (l) => l.dateKey === dk && (heatmapFilter === 'all' || l.domainId === heatmapFilter)
      );
      const totalMin = logs.reduce((acc, l) => acc + l.actualMinutes, 0);
      return { dateKey: dk, count: logs.length, totalMin };
    });
  }, [last28Keys, sessionLogs, heatmapFilter]);

  const challengeBreakdown = useMemo(() => {
    const total = sessionLogs.length;
    if (total === 0) return { easy: 0, optimal: 0, hard: 0, total: 0 };
    const easy = sessionLogs.filter((l) => l.challenge === 'too_easy').length;
    const optimal = sessionLogs.filter((l) => l.challenge === 'optimal').length;
    const hard = sessionLogs.filter((l) => l.challenge === 'too_hard').length;
    return {
      easy: Math.round((easy / total) * 100),
      optimal: Math.round((optimal / total) * 100),
      hard: Math.round((hard / total) * 100),
      total,
    };
  }, [sessionLogs]);

  const guitarBpmSeries = useMemo(
    () =>
      [...sessionLogs]
        .filter((l) => l.domainId === 'guitar' && l.metrics?.bpm)
        .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
        .slice(-14)
        .map((l) => l.metrics!.bpm!),
    [sessionLogs]
  );

  const jpCardsSeries = useMemo(
    () =>
      [...sessionLogs]
        .filter((l) => l.domainId === 'japanese')
        .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
        .slice(-14)
        .map((l) => l.metrics?.minedCards ?? l.actualMinutes),
    [sessionLogs]
  );

  const medMinutesSeries = useMemo(
    () =>
      [...sessionLogs]
        .filter((l) => l.domainId === 'meditation')
        .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
        .slice(-14)
        .map((l) => l.actualMinutes),
    [sessionLogs]
  );

  const climbMinutesSeries = useMemo(
    () =>
      [...sessionLogs]
        .filter((l) => l.domainId === 'bouldering')
        .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
        .slice(-10)
        .map((l) => l.actualMinutes),
    [sessionLogs]
  );

  const cycleClimbFocus = (current: 'limit' | 'volume' | 'capacity') => {
    if (current === 'limit') return 'volume';
    if (current === 'volume') return 'capacity';
    return 'limit';
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="font-display text-xs font-extrabold uppercase tracking-widest text-[var(--accent-primary)]">
          03 // Social Stats & Periodization
        </span>
        <h2 className="font-display text-3xl font-extrabold italic uppercase tracking-tight">
          Mastery Star & Progression
        </h2>
      </div>

      {/* Hero Section: 7-Point Persona Mastery Star + Rank Breakdown */}
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-6 bg-halftone-subtle">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-center">
          <div className="lg:col-span-5 flex flex-col items-center">
            <MasteryStarRadar stats={masteryStats} />
          </div>

          <div className="lg:col-span-7 space-y-2.5">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
              <span className="font-display text-sm font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">
                7-Parameter Rank Breakdown
              </span>
              <span className="font-mono-tabular text-[11px] text-[var(--text-muted)]">
                {sessionLogs.length} total sessions logged
              </span>
            </div>

            <div className="space-y-2">
              {DOMAIN_ORDER.map((id) => {
                const st = masteryStats[id];
                const meta = DOMAIN_META[id];
                return (
                  <div
                    key={id}
                    className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 px-3 py-2"
                  >
                    <span style={{ color: meta.color }} className="shrink-0">
                      <DomainIcon domainId={id} size={15} />
                    </span>
                    <div className="w-24 shrink-0">
                      <span className="text-xs font-bold block leading-tight">
                        {meta.shortLabel}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {st.rankLabel}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-canvas)]">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.max(8, st.score)}%`,
                            backgroundColor: meta.color,
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 font-mono-tabular text-xs">
                      <span className="font-bold" style={{ color: meta.color }}>
                        Lv.{st.rank}
                      </span>
                      <span className="hidden sm:inline text-[11px] text-[var(--text-muted)] w-14 text-right">
                        {formatDurationCompact(st.totalMinutes)}
                      </span>
                      <span className="text-[11px] text-[var(--text-secondary)] w-10 text-right">
                        {st.currentStreak}d
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Auto-Progression Suggestions */}
      {suggestions.length > 0 && (
        <section className="rounded-2xl border border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/8 p-4 space-y-2.5">
          <div className="flex items-center gap-2 font-display text-sm font-extrabold uppercase tracking-wider text-[var(--accent-primary)]">
            <Sparkles size={14} /> Ready to Rank Up
          </div>
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {suggestions.map((sug) => (
              <div
                key={sug.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3"
              >
                <div className="min-w-0">
                  <div className="mb-1">
                    <DomainBadge domainId={sug.domainId} compact />
                  </div>
                  <p className="text-xs font-bold">{sug.title}</p>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    {sug.reason}
                  </p>
                </div>
                {(sug.actionType === 'bump_meditation_minutes' ||
                  sug.actionType === 'advance_stage') && (
                  <button
                    type="button"
                    onClick={() => applyProgressionSuggestion(sug)}
                    className="persona-cut inline-flex shrink-0 items-center gap-1 bg-[var(--accent-primary)] px-3.5 py-2 text-xs font-extrabold uppercase text-[var(--accent-ink)]"
                  >
                    Apply <ArrowUpRight size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Weekly Cadence Blueprint */}
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5 space-y-3">
        <div>
          <h3 className="text-sm font-bold">Weekly Undulating Climbing Blueprint</h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Toggle climbing days and cycle Limit / Volume / Capacity focus.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
          {weeklyTemplate.map((day) => (
            <div
              key={day.weekday}
              className={`rounded-xl border p-3 transition-colors ${
                day.isBoulderingDay
                  ? 'border-[#2EC4B6]/50 bg-[#2EC4B6]/10'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold">
                  {WEEKDAY_NAMES[day.weekday]}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateWeeklyDay(day.weekday, {
                      isBoulderingDay: !day.isBoulderingDay,
                    })
                  }
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                    day.isBoulderingDay
                      ? 'bg-[#2EC4B6] text-[#0A0B0F]'
                      : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-subtle)]'
                  }`}
                >
                  {day.isBoulderingDay ? 'Climb' : 'Rest'}
                </button>
              </div>

              {day.isBoulderingDay ? (
                <button
                  type="button"
                  onClick={() =>
                    updateWeeklyDay(day.weekday, {
                      boulderingFocus: cycleClimbFocus(day.boulderingFocus),
                    })
                  }
                  className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-[#2EC4B6]/40 bg-[var(--bg-surface)] py-1 text-[11px] font-semibold capitalize text-[#2EC4B6]"
                >
                  <Mountain size={11} />
                  {day.boulderingFocus}
                </button>
              ) : (
                <p className="text-[11px] text-[var(--text-muted)] leading-snug">
                  Skill & tendon recovery
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Tendon Load & Challenge Calibration */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold flex items-center gap-1.5">
              <AlertTriangle
                size={15}
                className={
                  fatigue.level === 'high'
                    ? 'text-[#E56B6F]'
                    : fatigue.level === 'moderate'
                      ? 'text-[#F4A261]'
                      : 'text-[#68D391]'
                }
              />
              7-Day Exponential Tendon Load
            </h3>
            <span className="font-mono-tabular text-sm font-bold">
              {fatigue.score}/100
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)] mb-3">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.max(5, fatigue.score)}%`,
                backgroundColor:
                  fatigue.level === 'high'
                    ? '#E56B6F'
                    : fatigue.level === 'moderate'
                      ? '#F4A261'
                      : '#68D391',
              }}
            />
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            High-load sessions in past 4 days:{' '}
            <strong className="font-mono-tabular">{fatigue.recentHighLoadCount}</strong>.{' '}
            {fatigue.level === 'high'
              ? 'Tendon recovery mode active — heavy climbing & aggressive guitar picking auto-swapped.'
              : 'Tendon load within sustainable adaptation zone.'}
          </p>
        </section>

        <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold flex items-center gap-1.5">
              <Flame size={15} className="text-[var(--accent-primary)]" />
              Challenge-Zone Calibration
            </h3>
            <span className="font-mono-tabular text-xs text-[var(--text-muted)]">
              {challengeBreakdown.total} sessions
            </span>
          </div>

          {challengeBreakdown.total > 0 ? (
            <>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)] mb-3">
                <div
                  style={{ width: `${challengeBreakdown.easy}%` }}
                  className="bg-[#6B8EFE]"
                  title={`Too Easy: ${challengeBreakdown.easy}%`}
                />
                <div
                  style={{ width: `${challengeBreakdown.optimal}%` }}
                  className="bg-[#68D391]"
                  title={`Optimal Edge: ${challengeBreakdown.optimal}%`}
                />
                <div
                  style={{ width: `${challengeBreakdown.hard}%` }}
                  className="bg-[#E56B6F]"
                  title={`Too Hard: ${challengeBreakdown.hard}%`}
                />
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-[var(--text-secondary)]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#6B8EFE]" />
                  Too Easy {challengeBreakdown.easy}%
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-[#68D391]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#68D391]" />
                  Optimal Edge {challengeBreakdown.optimal}%
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#E56B6F]" />
                  Too Hard {challengeBreakdown.hard}%
                </span>
              </div>
            </>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">
              Complete sessions (or load 14-day sample history in System) to track challenge calibration.
            </p>
          )}
        </section>
      </div>

      {/* 28-Day Consistency Heatmap */}
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold">28-Day Consistency Heatmap</h3>
          <select
            aria-label="Filter heatmap by domain"
            value={heatmapFilter}
            onChange={(e) =>
              setHeatmapFilter(e.target.value as 'all' | DomainId)
            }
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-medium"
          >
            <option value="all">All 7 Domains</option>
            {DOMAIN_ORDER.map((id) => (
              <option key={id} value={id}>
                {DOMAIN_META[id].label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-14">
          {heatmapData.map((cell) => {
            const activeColor =
              heatmapFilter === 'all'
                ? '#68D391'
                : DOMAIN_META[heatmapFilter].color;
            const opacity =
              cell.totalMin === 0
                ? 0.08
                : cell.totalMin < 25
                  ? 0.35
                  : cell.totalMin < 75
                    ? 0.65
                    : 0.95;
            return (
              <div
                key={cell.dateKey}
                title={`${cell.dateKey}: ${cell.count} sessions (${cell.totalMin}m)`}
                className="flex aspect-square flex-col items-center justify-center rounded-lg border border-[var(--border-subtle)] text-[10px] font-mono-tabular"
                style={{
                  backgroundColor:
                    cell.totalMin > 0 ? activeColor : 'var(--bg-elevated)',
                  opacity: cell.totalMin > 0 ? opacity : 1,
                  color: cell.totalMin > 0 ? '#0A0B0F' : 'var(--text-muted)',
                }}
              >
                <span className="font-bold">{cell.dateKey.slice(8)}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Domain Metric Sparklines */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold flex items-center gap-1.5">
          <TrendingUp size={15} className="text-[var(--accent-primary)]" />
          Domain Progression Trends
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Sparkline
            label="Guitar Clean Peak"
            values={guitarBpmSeries}
            color="#E6A84C"
            unit="BPM"
          />
          <Sparkline
            label="Japanese Mined / Min"
            values={jpCardsSeries}
            color="#6B8EFE"
            unit=""
          />
          <Sparkline
            label="Meditation Duration"
            values={medMinutesSeries}
            color="#68D391"
            unit="m"
          />
          <Sparkline
            label="Bouldering Volume"
            values={climbMinutesSeries}
            color="#2EC4B6"
            unit="m"
          />
        </div>
      </section>

      {/* Recent Session Feed */}
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5 space-y-3">
        <h3 className="text-sm font-bold">Recent Logged Sessions</h3>
        {sessionLogs.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">
            No completed sessions logged yet. Start any block on Today’s timeline to log progress.
          </p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {sessionLogs.slice(0, 15).map((log) => (
              <div
                key={log.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 px-3.5 py-2.5 text-xs"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <DomainBadge domainId={log.domainId} compact />
                    <span className="font-semibold text-[var(--text-primary)]">
                      {log.title}
                    </span>
                    <span className="font-mono-tabular text-[var(--text-muted)]">
                      {log.dateKey} · {log.actualMinutes}m
                    </span>
                  </div>
                  {log.takeaway && (
                    <p className="text-[var(--text-secondary)] truncate">
                      {log.takeaway}
                    </p>
                  )}
                </div>
                <span className="rounded-md bg-[var(--bg-surface)] px-2 py-1 text-[11px] font-medium capitalize text-[var(--text-secondary)]">
                  {log.challenge.replace('_', ' ')} · {log.quality}/5
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
