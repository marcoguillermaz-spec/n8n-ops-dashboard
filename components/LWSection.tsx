'use client';

import { useCallback, useEffect, useState } from 'react';
import LWSummaryCards from './LWSummaryCards';
import LWDetailTable from './LWDetailTable';
import LWIssuesTable from './LWIssuesTable';
import LWWorkflowPanel from './LWWorkflowPanel';

interface ByAction {
  [action: string]: { ok: number; warning: number; error: number };
}

const DAYS_OPTIONS = [
  { value: 7, label: '7 giorni' },
  { value: 30, label: '30 giorni' },
  { value: 90, label: '90 giorni' },
  { value: 0, label: 'Tutto' },
];

/** Large centered overlay spinner */
function OverlaySpinner() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-950/60 backdrop-blur-sm rounded-2xl">
      <svg className="h-10 w-10 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
}

export default function LWSection() {
  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState<{
    totalProcessed: number;
    totalWarnings: number;
    totalErrors: number;
    byAction: ByAction;
  }>({ totalProcessed: 0, totalWarnings: 0, totalErrors: 0, byAction: {} });
  const [loadingSummary, setLoadingSummary] = useState(true);
  // Radio selector — always has a value, defaults to USER_CREATED
  const [selectedAction, setSelectedAction] = useState<string>('USER_CREATED');

  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const res = await fetch(`/api/lw/summary?days=${days}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSummary(data);
    } catch {
      setSummary({ totalProcessed: 0, totalWarnings: 0, totalErrors: 0, byAction: {} });
    } finally {
      setLoadingSummary(false);
    }
  }, [days]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <div className="space-y-8">
      {/* ── Workflow accordion ────────────────────── */}
      <LWWorkflowPanel />

      {/* ── Time filter ───────────────────────────── */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">LearnWorlds</h2>
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

      {/* ── Summary cards (radio selector) ──────────── */}
      <div className="relative">
        {loadingSummary && <OverlaySpinner />}
        <LWSummaryCards
          totalProcessed={summary.totalProcessed}
          totalWarnings={summary.totalWarnings}
          totalErrors={summary.totalErrors}
          byAction={summary.byAction}
          days={days}
          selectedAction={selectedAction}
          onSelectAction={setSelectedAction}
        />
      </div>

      {/* ── Content area: Detail table OR Aggregated issues ── */}
      {selectedAction === '__SUMMARY__' ? (
        <LWIssuesTable days={days} />
      ) : (
        <LWDetailTable
          action={selectedAction}
          days={days}
          actionCounts={
            summary.byAction[selectedAction] || { ok: 0, warning: 0, error: 0 }
          }
        />
      )}
    </div>
  );
}
