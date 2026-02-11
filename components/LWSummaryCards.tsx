'use client';

import { SUMMARY_CARDS } from '@/lib/lw-config';

interface ByAction {
  [action: string]: { ok: number; error: number };
}

interface LWSummaryCardsProps {
  totalProcessed: number;
  totalErrors: number;
  byAction: ByAction;
  days: number;
  loading: boolean;
}

export default function LWSummaryCards({
  totalProcessed,
  totalErrors,
  byAction,
  days,
  loading,
}: LWSummaryCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl border border-gray-800 bg-gray-900"
          />
        ))}
      </div>
    );
  }

  const errorRate =
    totalProcessed > 0
      ? ((totalErrors / totalProcessed) * 100).toFixed(1)
      : '0';

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Per-action cards */}
      {SUMMARY_CARDS.map(({ action, label, icon }) => {
        const data = byAction[action] || { ok: 0, error: 0 };
        return (
          <div
            key={action}
            className="rounded-2xl border border-gray-800 bg-gray-900 p-5"
          >
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="text-lg">{icon}</span>
              {label}
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums">{data.ok}</p>
            {data.error > 0 && (
              <p className="mt-1 text-xs text-red-400">
                {data.error} errori
              </p>
            )}
          </div>
        );
      })}

      {/* Error card */}
      <div
        className={`rounded-2xl border p-5 ${
          totalErrors > 0
            ? 'border-red-800/50 bg-red-950/30'
            : 'border-gray-800 bg-gray-900'
        }`}
      >
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="text-lg">⚠️</span>
          Errori totali
        </div>
        <p className="mt-2 text-2xl font-bold tabular-nums text-red-400">
          {totalErrors}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          {errorRate}% su {totalProcessed} operazioni ({days}gg)
        </p>
      </div>
    </div>
  );
}
