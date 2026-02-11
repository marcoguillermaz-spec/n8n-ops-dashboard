'use client';

import { useCallback, useEffect, useState } from 'react';
import LWSummaryCards from './LWSummaryCards';
import LWErrorTable from './LWErrorTable';
import LWDetailTable from './LWDetailTable';

interface ByAction {
  [action: string]: { ok: number; error: number };
}

const DAYS_OPTIONS = [
  { value: 7, label: '7 giorni' },
  { value: 30, label: '30 giorni' },
  { value: 90, label: '90 giorni' },
  { value: 0, label: 'Tutto' },
];

export default function LWSection() {
  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState<{
    totalProcessed: number;
    totalErrors: number;
    byAction: ByAction;
  }>({ totalProcessed: 0, totalErrors: 0, byAction: {} });
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const res = await fetch(`/api/lw/summary?days=${days}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSummary(data);
    } catch {
      setSummary({ totalProcessed: 0, totalErrors: 0, byAction: {} });
    } finally {
      setLoadingSummary(false);
    }
  }, [days]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Reset card selection when time filter changes
  useEffect(() => {
    setSelectedAction(null);
  }, [days]);

  return (
    <div className="space-y-8">
      {/* ── Time filter ───────────────────────────── */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">LW • Post-Purchase Automation</h2>
        <div className="flex gap-1 rounded-lg bg-gray-900 p-1">
          {DAYS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                days === opt.value
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Summary cards (clickable) ──────────────── */}
      <LWSummaryCards
        totalProcessed={summary.totalProcessed}
        totalErrors={summary.totalErrors}
        byAction={summary.byAction}
        days={days}
        loading={loadingSummary}
        selectedAction={selectedAction}
        onSelectAction={setSelectedAction}
      />

      {/* ── Detail table (shown when card is selected) */}
      {selectedAction && (
        <LWDetailTable
          action={selectedAction}
          days={days}
          onClose={() => setSelectedAction(null)}
        />
      )}

      {/* ── Error table with filters + pagination ──── */}
      <LWErrorTable days={days} />
    </div>
  );
}
