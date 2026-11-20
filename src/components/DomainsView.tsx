import { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  Flame,
  Plus,
  Star,
  Trash2,
} from 'lucide-react';
import { DOMAIN_ORDER, getTemplatesForDomain } from '../data/methodology';
import { computeMasteryStats } from '../engine/masteryStats';
import { usePlannerStore } from '../store/usePlannerStore';
import type { DomainId, Intensity, SkillLevel } from '../types/planner';
import { getLocalDateKey } from '../utils/date';
import { DOMAIN_META, DomainIcon } from './DomainBadge';

export function DomainsView() {
  const domains = usePlannerStore((s) => s.domains);
  const sessionLogs = usePlannerStore((s) => s.sessionLogs);
  const entrepreneurTasks = usePlannerStore((s) => s.entrepreneurTasks);
  const updateDomainConfig = usePlannerStore((s) => s.updateDomainConfig);
  const toggleMilestone = usePlannerStore((s) => s.toggleMilestone);
  const advanceStage = usePlannerStore((s) => s.advanceStage);
  const addCustomDrill = usePlannerStore((s) => s.addCustomDrill);
  const deleteCustomDrill = usePlannerStore((s) => s.deleteCustomDrill);
  const addEntrepreneurTask = usePlannerStore((s) => s.addEntrepreneurTask);
  const setDominoTask = usePlannerStore((s) => s.setDominoTask);
  const toggleEntrepreneurTask = usePlannerStore((s) => s.toggleEntrepreneurTask);
  const deleteEntrepreneurTask = usePlannerStore((s) => s.deleteEntrepreneurTask);

  const [selectedId, setSelectedId] = useState<DomainId>('guitar');
  const [detailTab, setDetailTab] = useState<'roadmap' | 'drills' | 'backlog'>(
    'roadmap'
  );
  const [showNewDrill, setShowNewDrill] = useState(false);

  const [drillTitle, setDrillTitle] = useState('');
  const [drillMinutes, setDrillMinutes] = useState(30);
  const [drillInstruction, setDrillInstruction] = useState('');
  const [drillIntensity, setDrillIntensity] = useState<Intensity>('moderate');

  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState<
    'build' | 'distribution' | 'strategy'
  >('build');
  const [taskVenture, setTaskVenture] = useState('Primary Venture');

  const stats = useMemo(
    () => computeMasteryStats(domains, sessionLogs, getLocalDateKey()),
    [domains, sessionLogs]
  );

  const domain = domains[selectedId];
  const meta = DOMAIN_META[selectedId];
  const stat = stats[selectedId];
  const templates = getTemplatesForDomain(selectedId, domain.customDrills);

  const handleSelectDomain = (id: DomainId) => {
    setSelectedId(id);
    if (id !== 'entrepreneurship' && detailTab === 'backlog') {
      setDetailTab('roadmap');
    }
  };

  const handleAddDrill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!drillTitle.trim() || !drillInstruction.trim()) return;
    addCustomDrill(selectedId, {
      title: drillTitle.trim(),
      track: domain.tracks[0] || 'custom',
      level: domain.level,
      targetMinutes: drillMinutes,
      intensity: drillIntensity,
      fingerLoad: selectedId === 'bouldering' || selectedId === 'guitar' ? 1 : 0,
      methodologyNote: 'Custom user deliberate-practice drill.',
      phases: [
        {
          id: `cp-${Date.now()}`,
          title: drillTitle.trim(),
          minutes: drillMinutes,
          instruction: drillInstruction.trim(),
          toolHint:
            selectedId === 'guitar'
              ? 'metronome'
              : selectedId === 'bouldering'
                ? 'rest_timer'
                : selectedId === 'meditation'
                  ? 'meditation_bell'
                  : 'focus_sprint',
        },
      ],
    });
    setDrillTitle('');
    setDrillInstruction('');
    setShowNewDrill(false);
  };

  const handleAddEntTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    addEntrepreneurTask({
      title: taskTitle.trim(),
      category: taskCategory,
      venture: taskVenture.trim() || 'Primary Venture',
    });
    setTaskTitle('');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <span className="font-display text-xs font-extrabold uppercase tracking-widest text-[var(--accent-primary)]">
            02 // Confidant Curricula
          </span>
          <h2 className="font-display text-3xl font-extrabold italic uppercase tracking-tight">
            Mastery Paths & Drills
          </h2>
        </div>
        <p className="text-xs text-[var(--text-secondary)]">
          Calibrate ranks, stage milestones, custom drills, and Venture Dominos.
        </p>
      </div>

      {/* Master-Detail Split */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Left Domain Roster */}
        <aside className="w-full lg:w-[260px] shrink-0 flex lg:flex-col gap-2 overflow-x-auto pb-1 lg:pb-0">
          {DOMAIN_ORDER.map((id) => {
            const d = domains[id];
            const m = DOMAIN_META[id];
            const st = stats[id];
            const active = selectedId === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleSelectDomain(id)}
                className={`shrink-0 lg:w-full rounded-xl border p-3 text-left transition-all ${
                  active
                    ? 'border-[var(--accent-primary)] bg-[var(--bg-elevated)] shadow-md'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)]'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span style={{ color: m.color }}>
                      <DomainIcon domainId={id} size={15} />
                    </span>
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      {m.shortLabel}
                    </span>
                  </div>
                  <span
                    className="font-mono-tabular text-[11px] font-bold"
                    style={{ color: m.color }}
                  >
                    Lv.{st.rank}
                  </span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--bg-canvas)] mb-1">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(8, st.nextRankProgress)}%`,
                      backgroundColor: m.color,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                  <span className="capitalize">{d.level}</span>
                  <span>P{d.priority}</span>
                </div>
              </button>
            );
          })}
        </aside>

        {/* Right Detail Workspace */}
        <div className="w-full flex-1 min-w-0 space-y-4">
          {/* Domain Header & Compact Settings Strip */}
          <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="persona-slash flex h-11 w-11 items-center justify-center font-display text-lg font-extrabold text-[#0A0B0F]"
                  style={{ backgroundColor: meta.color }}
                >
                  <span className="persona-unskew">{meta.glyph}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold">{domain.name}</h3>
                    <span
                      className="rounded px-2 py-0.5 font-mono-tabular text-[11px] font-bold"
                      style={{
                        backgroundColor: `${meta.color}20`,
                        color: meta.color,
                      }}
                    >
                      Lv.{stat.rank} {stat.rankLabel}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    Stage {domain.currentStageIndex + 1} of {domain.stages.length} ·{' '}
                    {stat.totalMinutes} min logged
                  </p>
                </div>
              </div>

              {/* Sub-tab switcher */}
              <div className="flex items-center gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-1">
                <button
                  type="button"
                  onClick={() => setDetailTab('roadmap')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                    detailTab === 'roadmap'
                      ? 'bg-[var(--accent-primary)] text-[var(--accent-ink)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Roadmap
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('drills')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                    detailTab === 'drills'
                      ? 'bg-[var(--accent-primary)] text-[var(--accent-ink)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Drill Deck ({templates.length})
                </button>
                {selectedId === 'entrepreneurship' && (
                  <button
                    type="button"
                    onClick={() => setDetailTab('backlog')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                      detailTab === 'backlog'
                        ? 'bg-[#A78BFA] text-[#0A0B0F]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    Domino Backlog
                  </button>
                )}
              </div>
            </div>

            {/* Compact Config Strip */}
            <div className="grid grid-cols-2 gap-3 border-t border-[var(--border-subtle)] pt-3.5 sm:grid-cols-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Level
                </label>
                <select
                  value={domain.level}
                  onChange={(e) =>
                    updateDomainConfig(selectedId, {
                      level: e.target.value as SkillLevel,
                    })
                  }
                  className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-xs font-medium"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Priority ({domain.priority}/5)
                </label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={domain.priority}
                  onChange={(e) =>
                    updateDomainConfig(selectedId, {
                      priority: Number(e.target.value) as 1 | 2 | 3 | 4 | 5,
                    })
                  }
                  className="w-full mt-2 accent-[var(--accent-primary)]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Days / Week
                </label>
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={domain.weeklyTargetDays}
                  onChange={(e) =>
                    updateDomainConfig(selectedId, {
                      weeklyTargetDays: Math.max(
                        1,
                        Math.min(7, Number(e.target.value) || 1)
                      ),
                    })
                  }
                  className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1.5 font-mono-tabular text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Default Min
                </label>
                <input
                  type="number"
                  min={5}
                  max={150}
                  step={5}
                  value={domain.defaultMinutes}
                  onChange={(e) =>
                    updateDomainConfig(selectedId, {
                      defaultMinutes: Math.max(
                        5,
                        Math.min(150, Number(e.target.value) || 15)
                      ),
                    })
                  }
                  className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1.5 font-mono-tabular text-xs"
                />
              </div>
            </div>
          </section>

          {/* Sub-Tab Content */}
          {detailTab === 'roadmap' && (
            <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold">Progression Stage Ladder</h4>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Check off milestones when verified cleanly in practice.
                  </p>
                </div>
                {domain.currentStageIndex < domain.stages.length - 1 && (
                  <button
                    type="button"
                    onClick={() => advanceStage(selectedId)}
                    className="persona-cut inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-extrabold uppercase text-[#0A0B0F]"
                    style={{ backgroundColor: meta.color }}
                  >
                    Advance Stage <ArrowUpRight size={14} />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {domain.stages.map((stage, idx) => {
                  const isActive = idx === domain.currentStageIndex;
                  const isPast = idx < domain.currentStageIndex;
                  return (
                    <div
                      key={stage.id}
                      className={`rounded-xl border p-3.5 ${
                        isActive
                          ? 'border-[var(--accent-primary)]/50 bg-[var(--bg-elevated)]'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-canvas)]/45'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                              isActive
                                ? 'bg-[var(--accent-primary)] text-[var(--accent-ink)]'
                                : isPast
                                  ? 'bg-[#68D391]/20 text-[#68D391]'
                                  : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'
                            }`}
                          >
                            {isActive
                              ? 'Active'
                              : isPast
                                ? 'Cleared'
                                : `Stage ${idx + 1}`}
                          </span>
                          <h5 className="text-sm font-bold">{stage.title}</h5>
                        </div>

                        {!isActive && (
                          <button
                            type="button"
                            onClick={() => advanceStage(selectedId, idx)}
                            className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                          >
                            Set Active
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-[var(--text-secondary)] mb-2.5">
                        {stage.description}
                      </p>

                      <div className="space-y-1.5">
                        {stage.milestones.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => toggleMilestone(selectedId, idx, m.id)}
                            className="flex w-full items-start gap-2 rounded-lg bg-[var(--bg-surface)]/80 px-2.5 py-2 text-left text-xs hover:bg-[var(--bg-hover)]"
                          >
                            <span
                              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                m.completed
                                  ? 'border-[#68D391] bg-[#68D391] text-[#0A0B0F]'
                                  : 'border-[var(--border-strong)]'
                              }`}
                            >
                              {m.completed && <Check size={11} />}
                            </span>
                            <span
                              className={
                                m.completed
                                  ? 'line-through text-[var(--text-muted)]'
                                  : 'text-[var(--text-primary)]'
                              }
                            >
                              {m.text}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {detailTab === 'drills' && (
            <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold">Deliberate Practice Drill Deck</h4>
                <button
                  type="button"
                  onClick={() => setShowNewDrill((v) => !v)}
                  className="inline-flex items-center gap-1 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-bold hover:border-[var(--accent-primary)]"
                >
                  <Plus size={13} /> New Drill
                </button>
              </div>

              {showNewDrill && (
                <form
                  onSubmit={handleAddDrill}
                  className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-canvas)]/50 p-3.5 space-y-3"
                >
                  <p className="flex items-center gap-1.5 text-xs font-bold">
                    <Flame size={13} style={{ color: meta.color }} /> Custom Drill for{' '}
                    {domain.shortName}
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                    <input
                      type="text"
                      value={drillTitle}
                      onChange={(e) => setDrillTitle(e.target.value)}
                      placeholder="Drill title..."
                      className="sm:col-span-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-xs"
                    />
                    <input
                      type="number"
                      min={5}
                      max={120}
                      value={drillMinutes}
                      onChange={(e) =>
                        setDrillMinutes(Number(e.target.value) || 20)
                      }
                      className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 font-mono-tabular text-xs"
                    />
                    <select
                      value={drillIntensity}
                      onChange={(e) =>
                        setDrillIntensity(e.target.value as Intensity)
                      }
                      className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-xs"
                    >
                      <option value="low">Low Intensity</option>
                      <option value="moderate">Moderate</option>
                      <option value="high">High Intensity</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={drillInstruction}
                      onChange={(e) => setDrillInstruction(e.target.value)}
                      placeholder="Exact practice instruction..."
                      className="flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-xs"
                    />
                    <button
                      type="submit"
                      className="rounded-lg px-4 py-2 text-xs font-bold text-[#0A0B0F]"
                      style={{ backgroundColor: meta.color }}
                    >
                      Save
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {templates.map((tpl) => {
                  const isCustom = tpl.id.startsWith('custom-');
                  return (
                    <div
                      key={tpl.id}
                      className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/55 p-3.5 space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h5 className="text-sm font-bold">{tpl.title}</h5>
                          <span className="font-mono-tabular text-[11px] text-[var(--text-muted)]">
                            {tpl.targetMinutes}m · {tpl.intensity} · {tpl.track}
                          </span>
                        </div>
                        {isCustom && (
                          <button
                            type="button"
                            onClick={() => deleteCustomDrill(selectedId, tpl.id)}
                            aria-label="Delete custom drill"
                            className="text-[var(--text-muted)] hover:text-[#E56B6F]"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {tpl.methodologyNote}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {detailTab === 'backlog' && selectedId === 'entrepreneurship' && (
            <section className="rounded-2xl border border-[#A78BFA]/35 bg-[var(--bg-surface)] p-4 sm:p-5 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#A78BFA]">
                  Single-Domino Venture Backlog
                </h4>
                <p className="text-xs text-[var(--text-secondary)]">
                  Pin one tangible outcome as Today’s Domino.
                </p>
              </div>

              <form
                onSubmit={handleAddEntTask}
                className="grid grid-cols-1 gap-2 sm:grid-cols-12"
              >
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Next concrete shippable outcome..."
                  className="sm:col-span-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-xs"
                />
                <select
                  value={taskCategory}
                  onChange={(e) =>
                    setTaskCategory(
                      e.target.value as 'build' | 'distribution' | 'strategy'
                    )
                  }
                  className="sm:col-span-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-2 text-xs"
                >
                  <option value="build">Build</option>
                  <option value="distribution">Distribution</option>
                  <option value="strategy">Strategy</option>
                </select>
                <input
                  type="text"
                  value={taskVenture}
                  onChange={(e) => setTaskVenture(e.target.value)}
                  placeholder="Venture"
                  className="sm:col-span-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-2 text-xs"
                />
                <button
                  type="submit"
                  className="sm:col-span-2 inline-flex items-center justify-center gap-1 rounded-xl bg-[#A78BFA] px-3 py-2 text-xs font-bold text-[#0A0B0F]"
                >
                  <Plus size={14} /> Add
                </button>
              </form>

              <div className="space-y-2">
                {entrepreneurTasks.map((t) => (
                  <div
                    key={t.id}
                    className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 ${
                      t.isDominoToday
                        ? 'border-[#A78BFA]/50 bg-[#A78BFA]/10'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleEntrepreneurTask(t.id)}
                      className="flex flex-1 items-start gap-2.5 text-left min-w-[200px]"
                    >
                      <span
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          t.done
                            ? 'border-[#68D391] bg-[#68D391] text-[#0A0B0F]'
                            : 'border-[var(--border-strong)]'
                        }`}
                      >
                        {t.done && <Check size={11} />}
                      </span>
                      <div>
                        <p
                          className={`text-xs font-semibold ${
                            t.done ? 'line-through text-[var(--text-muted)]' : ''
                          }`}
                        >
                          {t.title}
                        </p>
                        <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                          {t.venture} · {t.category}
                        </span>
                      </div>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setDominoTask(t.id)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                          t.isDominoToday
                            ? 'bg-[#A78BFA] text-[#0A0B0F]'
                            : 'border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)]'
                        }`}
                      >
                        <Star size={11} />{' '}
                        {t.isDominoToday ? 'Today’s Domino' : 'Pin Today'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteEntrepreneurTask(t.id)}
                        aria-label="Delete venture task"
                        className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[#E56B6F]"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
