import { useState } from 'react';
import type { DomainId, DomainMasteryStat } from '../types/planner';
import { DOMAIN_META } from './DomainBadge';

const RADAR_ORDER: DomainId[] = [
  'guitar',
  'drawing',
  'japanese',
  'bouldering',
  'entrepreneurship',
  'meditation',
  'stretching',
];

interface MasteryStarRadarProps {
  stats: Record<DomainId, DomainMasteryStat>;
  compact?: boolean;
  onSelectDomain?: (domainId: DomainId) => void;
}

export function MasteryStarRadar({
  stats,
  compact = false,
  onSelectDomain,
}: MasteryStarRadarProps) {
  const [hoveredId, setHoveredId] = useState<DomainId | null>(null);

  const size = compact ? 240 : 340;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = compact ? 74 : 108;
  const labelR = compact ? 98 : 140;
  const n = RADAR_ORDER.length;

  const angleFor = (idx: number) => -Math.PI / 2 + (idx * 2 * Math.PI) / n;

  const pointAt = (idx: number, radius: number) => {
    const a = angleFor(idx);
    return {
      x: cx + Math.cos(a) * radius,
      y: cy + Math.sin(a) * radius,
    };
  };

  // Concentric 5-rank rings
  const rings = [20, 40, 60, 80, 100];

  const dataPoints = RADAR_ORDER.map((id, idx) => {
    const stat = stats[id];
    const r = Math.max(0.14, (stat?.score ?? 15) / 100) * maxR;
    return { id, stat, ...pointAt(idx, r) };
  });

  const polygonPoints = dataPoints
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');

  const activeId = hoveredId || 'guitar';
  const activeStat = stats[activeId];
  const activeMeta = DOMAIN_META[activeId];

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className={`w-full ${compact ? 'max-w-[240px]' : 'max-w-[350px]'} overflow-visible select-none`}
        role="img"
        aria-label="7-Domain Persona Mastery Star Radar"
      >
        <defs>
          <radialGradient id="personaStarGlow" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--accent-secondary)" stopOpacity="0.12" />
          </radialGradient>
        </defs>

        {/* Concentric heptagon web */}
        {rings.map((pct, rIdx) => {
          const r = (pct / 100) * maxR;
          const ringPts = RADAR_ORDER.map((_, idx) => {
            const p = pointAt(idx, r);
            return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
          }).join(' ');
          return (
            <polygon
              key={pct}
              points={ringPts}
              fill={rIdx % 2 === 0 ? 'var(--bg-elevated)' : 'none'}
              fillOpacity={rIdx % 2 === 0 ? 0.35 : 0}
              stroke="var(--border-subtle)"
              strokeWidth={rIdx === rings.length - 1 ? 1.5 : 1}
              strokeDasharray={rIdx === rings.length - 1 ? undefined : '2 3'}
            />
          );
        })}

        {/* Axis spokes */}
        {RADAR_ORDER.map((id, idx) => {
          const edge = pointAt(idx, maxR);
          const isHighlighted = hoveredId === id;
          return (
            <line
              key={id}
              x1={cx}
              y1={cy}
              x2={edge.x}
              y2={edge.y}
              stroke={isHighlighted ? DOMAIN_META[id].color : 'var(--border-subtle)'}
              strokeWidth={isHighlighted ? 1.6 : 1}
              opacity={isHighlighted ? 0.9 : 0.7}
            />
          );
        })}

        {/* Data polygon */}
        <polygon
          points={polygonPoints}
          fill="url(#personaStarGlow)"
          stroke="var(--accent-primary)"
          strokeWidth={compact ? 2 : 2.5}
          strokeLinejoin="round"
        />

        {/* Vertex dots */}
        {dataPoints.map((pt) => (
          <circle
            key={pt.id}
            cx={pt.x}
            cy={pt.y}
            r={hoveredId === pt.id ? 5 : compact ? 3.2 : 4}
            fill={DOMAIN_META[pt.id].color}
            stroke="var(--bg-canvas)"
            strokeWidth={1.5}
          />
        ))}

        {/* Vertex labels + Lv badges */}
        {RADAR_ORDER.map((id, idx) => {
          const lp = pointAt(idx, labelR);
          const meta = DOMAIN_META[id];
          const stat = stats[id];
          const isHovered = hoveredId === id;
          return (
            <g
              key={id}
              transform={`translate(${lp.x.toFixed(1)}, ${lp.y.toFixed(1)})`}
              onMouseEnter={() => setHoveredId(id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => {
                setHoveredId(id);
                onSelectDomain?.(id);
              }}
              className="cursor-pointer"
            >
              <text
                x={0}
                y={compact ? -2 : -4}
                textAnchor="middle"
                className="font-display font-bold uppercase"
                style={{
                  fontSize: compact ? '10px' : '12px',
                  fill: isHovered ? meta.color : 'var(--text-primary)',
                  letterSpacing: '0.06em',
                }}
              >
                {meta.radarLabel}
              </text>
              <text
                x={0}
                y={compact ? 10 : 11}
                textAnchor="middle"
                className="font-mono-tabular font-semibold"
                style={{
                  fontSize: compact ? '9px' : '10px',
                  fill: meta.color,
                }}
              >
                Lv.{stat?.rank ?? 1}
              </text>
            </g>
          );
        })}
      </svg>

      {!compact && activeStat && (
        <div className="mt-2 flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/80 px-3.5 py-2 text-xs">
          <span
            className="font-display text-sm font-extrabold uppercase tracking-wider"
            style={{ color: activeMeta.color }}
          >
            {activeMeta.label}
          </span>
          <span className="font-mono-tabular font-semibold text-[var(--text-primary)]">
            Lv.{activeStat.rank} {activeStat.rankLabel}
          </span>
          <span className="text-[var(--text-muted)]">·</span>
          <span className="font-mono-tabular text-[var(--text-secondary)]">
            {activeStat.score}/100 XP
          </span>
        </div>
      )}
    </div>
  );
}
