import {
  Activity,
  Briefcase,
  Compass,
  Languages,
  Mountain,
  Music,
  PenTool,
  Sparkles,
} from 'lucide-react';
import type { DomainId } from '../types/planner';

export const DOMAIN_META: Record<
  DomainId,
  {
    label: string;
    shortLabel: string;
    radarLabel: string;
    glyph: string;
    color: string;
  }
> = {
  guitar: {
    label: 'Guitar',
    shortLabel: 'Guitar',
    radarLabel: 'GUITAR',
    glyph: '♪',
    color: '#E6A84C',
  },
  drawing: {
    label: 'Drawing',
    shortLabel: 'Draw',
    radarLabel: 'DRAW',
    glyph: '★',
    color: '#E56B6F',
  },
  japanese: {
    label: 'Japanese',
    shortLabel: 'Japanese',
    radarLabel: 'JP',
    glyph: '語',
    color: '#6B8EFE',
  },
  bouldering: {
    label: 'Bouldering',
    shortLabel: 'Boulder',
    radarLabel: 'CLIMB',
    glyph: '▲',
    color: '#2EC4B6',
  },
  entrepreneurship: {
    label: 'Entrepreneurship',
    shortLabel: 'Ventures',
    radarLabel: 'VENTURE',
    glyph: '◆',
    color: '#A78BFA',
  },
  meditation: {
    label: 'Meditation',
    shortLabel: 'Meditate',
    radarLabel: 'MIND',
    glyph: '◎',
    color: '#68D391',
  },
  stretching: {
    label: 'Stretching & Mobility',
    shortLabel: 'Stretch',
    radarLabel: 'BODY',
    glyph: '⚡',
    color: '#F4A261',
  },
};

export function DomainIcon({
  domainId,
  size = 16,
  className = '',
}: {
  domainId: DomainId;
  size?: number;
  className?: string;
}) {
  const props = { size, className };
  switch (domainId) {
    case 'guitar':
      return <Music {...props} />;
    case 'drawing':
      return <PenTool {...props} />;
    case 'japanese':
      return <Languages {...props} />;
    case 'bouldering':
      return <Mountain {...props} />;
    case 'entrepreneurship':
      return <Briefcase {...props} />;
    case 'meditation':
      return <Sparkles {...props} />;
    case 'stretching':
      return <Activity {...props} />;
    default:
      return <Compass {...props} />;
  }
}

export function DomainBadge({
  domainId,
  compact = false,
}: {
  domainId: DomainId;
  compact?: boolean;
}) {
  const meta = DOMAIN_META[domainId];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-tight border"
      style={{
        color: meta.color,
        borderColor: `${meta.color}40`,
        backgroundColor: `${meta.color}14`,
      }}
    >
      <DomainIcon domainId={domainId} size={12} />
      <span>{compact ? meta.shortLabel : meta.label}</span>
    </span>
  );
}
