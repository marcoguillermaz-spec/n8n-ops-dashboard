'use client';

import { SUMMARY_CARDS } from '@/lib/lw-config';

interface ByAction {
  [action: string]: { ok: number; warning: number; error: number };
}

interface LWSummaryCardsProps {
  totalProcessed: number;
  totalWarnings: number;
  totalErrors: number;
  byAction: ByAction;
  days: number;
  selectedAction: string;
  onSelectAction: (action: string) => void;
}

/** Shared spinner used inside cards when section-level loading */
function MiniSpinner() {
  return (
    <svg className="h-4 w-4 animate-spin text-gray-500" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function LWSummaryCards({
  totalProcessed,
  totalWarnings,
  totalErrors,
  byAction,
  days,
  selectedAction,
  onSelectAction,
}: LWSummaryCardsProps) {
  const errorRate =
    totalProcessed > 0
      ? ((totalErrors / totalProcessed) * 100).toFixed(1)
      : '0';

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Per-action cards — radio selector */}
      {SUMMARY_CARDS.map(({ action, label, icon }) => {
        const data = byAction[action] || { ok: 0, warning: 0, error: 0 };
        const total = data.ok + data.warning + data.error;
        const isSelected = selectedAction === action;
        return (
          <button
            key={action}
            onClick={() => onSelectAction(action)}
            className={`rounded-2xl border p-5 text-left transition-all cursor-pointer ${
              isSelected
                ? 'border-blue-500 bg-blue-950/30 ring-1 ring-blue-500/50'
                : 'border-gray-800 bg-gray-900 hover:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="text-lg">{icon}</span>
              {label}
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums">{total}</p>
            {/* Three severity badges */}
            <div className="mt-2 flex gap-2">
              {data.ok > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
                  ✓ {data.ok}
                </span>
              )}
              {data.warning > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
                  ⚠ {data.warning}
                </span>
              )}
              {data.error > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-400">
                  ✕ {data.error}
                </span>
              )}
            </div>
            {isSelected && (
              <p className="mt-1 text-xs text-blue-400">▼ Dettaglio aperto</p>
            )}
          </button>
        );
      })}

      {/* Riepilogo card — 4th radio option (__SUMMARY__) */}
      {(() => {
        const isSelected = selectedAction === '__SUMMARY__';
        return (
          <button
            onClick={() => onSelectAction('__SUMMARY__')}
            className={`rounded-2xl border p-5 text-left transition-all cursor-pointer ${
              isSelected
                ? 'border-blue-500 bg-blue-950/30 ring-1 ring-blue-500/50'
                : totalErrors > 0
                  ? 'border-red-800/50 bg-red-950/30 hover:border-red-600/70'
                  : totalWarnings > 0
                    ? 'border-amber-800/50 bg-amber-950/20 hover:border-amber-600/70'
                    : 'border-gray-800 bg-gray-900 hover:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="text-lg">📊</span>
              Riepilogo
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums">{totalProcessed}</p>
            <div className="mt-2 flex gap-3">
              {totalWarnings > 0 && (
                <span className="text-xs text-amber-400">
                  ⚠ {totalWarnings} warning
                </span>
              )}
              {totalErrors > 0 && (
                <span className="text-xs text-red-400">
                  ✕ {totalErrors} errori
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {errorRate}% errori su {totalProcessed} operazioni ({days === 0 ? 'tutto' : `${days}gg`})
            </p>
            {isSelected && (
              <p className="mt-1 text-xs text-blue-400">▼ Dettaglio aperto</p>
            )}
          </button>
        );
      })()}
    </div>
  );
}
