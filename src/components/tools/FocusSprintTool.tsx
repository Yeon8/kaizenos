import { useState } from 'react';
import { Check, Plus, Sparkles } from 'lucide-react';
import { usePlannerStore } from '../../store/usePlannerStore';
import type { DomainId } from '../../types/planner';

interface FocusSprintToolProps {
  domainId: DomainId;
  minedCards: number;
  onMinedCardsChange: (count: number) => void;
}

export function FocusSprintTool({
  domainId,
  minedCards,
  onMinedCardsChange,
}: FocusSprintToolProps) {
  const domains = usePlannerStore((s) => s.domains);
  const toggleMilestone = usePlannerStore((s) => s.toggleMilestone);
  const entrepreneurTasks = usePlannerStore((s) => s.entrepreneurTasks);
  const toggleEntrepreneurTask = usePlannerStore((s) => s.toggleEntrepreneurTask);
  const [scratchpad, setScratchpad] = useState('');

  if (domainId === 'drawing') {
    const draw = domains.drawing;
    const stage = draw.stages[draw.currentStageIndex];
    return (
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#E56B6F]">
            {stage?.title || 'Drawing Fundamentals'}
          </p>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#E56B6F]/15 px-2 py-0.5 text-[11px] font-medium text-[#E56B6F]">
            <Sparkles size={11} /> 50% Rule Protected
          </span>
        </div>
        {stage && (
          <div className="space-y-1.5 mt-2">
            {stage.milestones.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleMilestone('drawing', draw.currentStageIndex, m.id)}
                className="flex w-full items-start gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-left text-xs hover:bg-[var(--bg-hover)]"
              >
                <span
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    m.completed
                      ? 'border-[#68D391] bg-[#68D391] text-[#0E1013]'
                      : 'border-[var(--border-strong)]'
                  }`}
                >
                  {m.completed && <Check size={11} />}
                </span>
                <span
                  className={
                    m.completed
                      ? 'line-through text-[var(--text-muted)]'
                      : 'text-[var(--text-secondary)]'
                  }
                >
                  {m.text}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (domainId === 'japanese') {
    return (
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6B8EFE]">
              Sentence Mining & Immersion Counter
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              Mine clean i+1 sentences only—skip rare distractions to preserve flow.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onMinedCardsChange(Math.max(0, minedCards - 1))}
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1.5 font-mono-tabular text-xs"
            >
              -1
            </button>
            <div className="text-center min-w-[56px]">
              <span className="font-mono-tabular text-xl font-bold text-[#6B8EFE]">
                {minedCards}
              </span>
              <span className="block text-[10px] text-[var(--text-muted)]">
                Cards
              </span>
            </div>
            <button
              type="button"
              onClick={() => onMinedCardsChange(minedCards + 1)}
              className="inline-flex items-center gap-1 rounded-lg bg-[#6B8EFE] px-3 py-1.5 text-xs font-semibold text-white"
            >
              <Plus size={13} /> Card
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (domainId === 'entrepreneurship') {
    const domino =
      entrepreneurTasks.find((t) => t.isDominoToday) || entrepreneurTasks[0];
    return (
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#A78BFA] mb-1.5">
            Today’s Single Domino
          </p>
          {domino ? (
            <button
              type="button"
              onClick={() => toggleEntrepreneurTask(domino.id)}
              className="flex w-full items-center gap-2.5 rounded-lg border border-[#A78BFA]/35 bg-[#A78BFA]/10 px-3 py-2 text-left text-sm font-medium"
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                  domino.done
                    ? 'border-[#68D391] bg-[#68D391] text-[#0E1013]'
                    : 'border-[#A78BFA]'
                }`}
              >
                {domino.done && <Check size={12} />}
              </span>
              <span className={domino.done ? 'line-through opacity-70' : ''}>
                {domino.title}
              </span>
            </button>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">
              Add a Domino in Domains → Entrepreneurship.
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="ent-scratchpad"
            className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1"
          >
            Distraction Parking Lot (Capture tangents without switching tabs)
          </label>
          <textarea
            id="ent-scratchpad"
            rows={2}
            value={scratchpad}
            onChange={(e) => setScratchpad(e.target.value)}
            placeholder="Jot tangent ideas here so your focus stays locked on the Domino..."
            className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#A78BFA]"
          />
        </div>
      </div>
    );
  }

  return null;
}
