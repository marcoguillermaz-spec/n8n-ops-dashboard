'use client';

import { useCallback, useEffect, useState } from 'react';
import LWSummaryCards from './LWSummaryCards';
import LWErrorTable from './LWErrorTable';

interface ByAction {
  [action: string]: { ok: number; error: number };
}

interface LWError {
  ts: string;
  action: string;
  orderId: string;
  email: string;
  courseId: string;
  statusCode: string;
  httpNote: string;
  errorMessage: string;
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
  const [errors, setErrors] = useState<LWError[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingErrors, setLoadingErrors] = useState(true);

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

  const fetchErrors = useCallback(async () => {
    setLoadingErrors(true);
    try {
      const res = await fetch(`/api/lw/errors?days=${days}&limit=30`);
      if (!res.ok) throw new Error();
      const data: LWError[] = await res.json();
      setErrors(data);
    } catch {
      setErrors([]);
    } finally {
      setLoadingErrors(false);
    }
  }, [days]);

  useEffect(() => {
    fetchSummary();
    fetchErrors();
  }, [fetchSummary, fetchErrors]);

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

      {/* ── Summary cards ─────────────────────────── */}
      <LWSummaryCards
        totalProcessed={summary.totalProcessed}
        totalErrors={summary.totalErrors}
        byAction={summary.byAction}
        days={days}
        loading={loadingSummary}
      />

      {/* ── Error table ───────────────────────────── */}
      <div>
        <h3 className="mb-4 text-base font-semibold">
          Errori recenti
          {errors.length > 0 && (
            <span className="ml-2 text-sm font-normal text-red-400">
              ({errors.length})
            </span>
          )}
        </h3>
        <p className="mb-4 text-xs text-gray-500">
          Clicca su una riga per vedere tutte le operazioni dell'ordine
        </p>
        <LWErrorTable errors={errors} loading={loadingErrors} />
      </div>
    </div>
  );
}
