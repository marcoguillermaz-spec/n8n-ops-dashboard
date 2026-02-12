'use client';

import { useState, useEffect, useCallback } from 'react';
import { ACTION_LABELS } from '@/lib/lw-config';

type MacroFilter = 'ALL' | 'WARNING' | 'ERROR';

interface Issue {
  ts: string;
  action: string;
  orderId: string;
  email: string;
  courseId: string;
  statusCode: string;
  errorMessage: string;
  issueType: string;
  severity: 'WARNING' | 'ERROR';
}

interface MacroBreakdown {
  all: number;
  WARNING: number;
  ERROR: number;
}

interface LWIssuesTableProps {
  days: number;
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Spinner */
function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <svg className="h-8 w-8 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
}

const MACRO_FILTERS: { key: MacroFilter; label: string; activeClass: string }[] = [
  { key: 'ALL', label: 'Tutti', activeClass: 'border-blue-500 bg-blue-500/20 text-blue-300' },
  { key: 'WARNING', label: '⚠ Warning', activeClass: 'border-amber-500 bg-amber-500/20 text-amber-300' },
  { key: 'ERROR', label: '✕ Errori', activeClass: 'border-red-500 bg-red-500/20 text-red-300' },
];

export default function LWIssuesTable({ days }: LWIssuesTableProps) {
  const [filter, setFilter] = useState<MacroFilter>('ALL');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [macroBreakdown, setMacroBreakdown] = useState<MacroBreakdown>({ all: 0, WARNING: 0, ERROR: 0 });

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        severity: filter,
        days: days.toString(),
        page: page.toString(),
        limit: '30',
      });

      const res = await fetch(`/api/lw/issues?${params}`);
      const data = await res.json();
      setIssues(data.issues || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
      if (data.macroBreakdown) {
        setMacroBreakdown(data.macroBreakdown);
      }
    } catch {
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }, [filter, days, page]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  useEffect(() => {
    setPage(1);
  }, [filter, days]);

  return (
    <div className="mt-6">
      {/* Header + macro filters */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-3">
          <h3 className="text-base font-semibold text-white">Riepilogo warning ed errori</h3>
          <span className="text-sm text-gray-400">({macroBreakdown.all})</span>
        </div>

        {/* Macro filter pills: Tutti / Warning / Errori */}
        <div className="flex flex-wrap gap-2">
          {MACRO_FILTERS.map((opt) => {
            const count =
              opt.key === 'ALL'
                ? macroBreakdown.all
                : macroBreakdown[opt.key] || 0;
            return (
              <button
                key={opt.key}
                onClick={() => setFilter(opt.key)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                  filter === opt.key
                    ? opt.activeClass
                    : 'border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                {opt.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : issues.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-500">
          Nessun warning o errore nel periodo selezionato
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Severità</th>
                  <th className="px-4 py-3">Azione</th>
                  <th className="px-4 py-3">Ordine</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Corso / Risorsa</th>
                  <th className="px-4 py-3">Messaggio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {issues.map((issue, idx) => {
                  const isWarning = issue.severity === 'WARNING';
                  const badgeBg = isWarning ? 'bg-amber-500/15' : 'bg-red-500/15';
                  const badgeText = isWarning ? 'text-amber-400' : 'text-red-400';
                  const msgColor = isWarning ? 'text-amber-300/80' : 'text-red-300/80';

                  return (
                    <tr
                      key={`${issue.orderId}-${issue.ts}-${idx}`}
                      className="hover:bg-gray-800/30"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-gray-300">
                        {formatDate(issue.ts)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full ${badgeBg} px-2 py-0.5 text-xs font-medium ${badgeText}`}
                        >
                          {isWarning ? '⚠ Warning' : '✕ Errore'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-300">
                          {ACTION_LABELS[issue.action] || issue.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-blue-400">
                        #{issue.orderId}
                      </td>
                      <td className="truncate px-4 py-3 text-gray-400 max-w-[180px]">
                        {issue.email}
                      </td>
                      <td className="truncate px-4 py-3 font-mono text-xs text-gray-500 max-w-[140px]">
                        {issue.courseId || '—'}
                      </td>
                      <td className={`truncate px-4 py-3 text-xs max-w-[220px] ${msgColor}`}>
                        {issue.errorMessage}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-400">
                Pagina {page} di {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 text-sm border border-gray-600 rounded-lg disabled:opacity-30 hover:border-gray-400 text-gray-300 transition-colors"
                >
                  ← Precedente
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 text-sm border border-gray-600 rounded-lg disabled:opacity-30 hover:border-gray-400 text-gray-300 transition-colors"
                >
                  Successiva →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
