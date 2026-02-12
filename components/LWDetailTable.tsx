'use client';

import { useState, useEffect, useCallback } from 'react';
import { ACTION_LABELS, Severity } from '@/lib/lw-config';

interface DetailRow {
  ts: string;
  action: string;
  orderId: string;
  email: string;
  courseId: string;
  outcome: Severity;
  statusCode: string;
  errorMessage: string;
}

interface Props {
  action: string;
  days: number;
  actionCounts: { ok: number; warning: number; error: number };
}

const ALL_TABS: { key: Severity; label: string; activeClass: string; countKey: 'ok' | 'warning' | 'error' }[] = [
  { key: 'OK', label: '✓ Successi', activeClass: 'bg-emerald-600/30 text-emerald-400', countKey: 'ok' },
  { key: 'WARNING', label: '⚠ Warning', activeClass: 'bg-amber-600/30 text-amber-400', countKey: 'warning' },
  { key: 'ERROR', label: '✕ Errori', activeClass: 'bg-red-600/30 text-red-400', countKey: 'error' },
];

/** Overlay spinner */
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

export default function LWDetailTable({ action, days, actionCounts }: Props) {
  const [outcomeTab, setOutcomeTab] = useState<Severity>('OK');
  const [rows, setRows] = useState<DetailRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Reset outcomeTab to OK whenever the selected action changes
  useEffect(() => {
    setOutcomeTab('OK');
    setPage(1);
  }, [action]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        action,
        outcome: outcomeTab,
        days: days.toString(),
        page: page.toString(),
        limit: '30',
      });
      const res = await fetch(`/api/lw/detail?${params}`);
      const data = await res.json();
      setRows(data.rows || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [action, outcomeTab, days, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [outcomeTab]);

  const label = ACTION_LABELS[action] || action;

  function fmtDate(iso: string) {
    if (!iso) return '—';
    const d = new Date(iso);
    return (
      d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }) +
      ', ' +
      d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
    );
  }

  const showMsgCol = outcomeTab === 'WARNING' || outcomeTab === 'ERROR';
  const showCourseCol = action === 'ENROLLMENT';

  // Only show tabs with data (OK always visible)
  const visibleTabs = ALL_TABS.filter(
    (tab) => tab.countKey === 'ok' || actionCounts[tab.countKey] > 0,
  );

  return (
    <div className="mt-6">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">
          LearnWorlds — {label}
        </h3>
        <p className="text-sm text-gray-400">{totalCount} risultati</p>
      </div>

      {/* Dynamic tabs — only show those with data */}
      <div className="flex gap-1 mb-4 bg-gray-800 rounded-lg p-1 w-fit">
        {visibleTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setOutcomeTab(tab.key)}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
              outcomeTab === tab.key
                ? tab.activeClass
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <div className="text-gray-500 py-8 text-center">
          Nessun risultato nel periodo selezionato
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-800/50">
                <tr className="text-left text-gray-400 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Ordine</th>
                  <th className="px-4 py-3">Email</th>
                  {showCourseCol && <th className="px-4 py-3">Corso / Risorsa</th>}
                  {showMsgCol && <th className="px-4 py-3">Messaggio</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                      {fmtDate(r.ts)}
                    </td>
                    <td className="px-4 py-3 text-blue-400 font-mono text-xs">
                      #{r.orderId}
                    </td>
                    <td className="px-4 py-3 text-gray-300 truncate max-w-[200px]">
                      {r.email}
                    </td>
                    {showCourseCol && (
                      <td className="px-4 py-3 text-gray-300 truncate max-w-[200px]">
                        {r.courseId}
                      </td>
                    )}
                    {showMsgCol && (
                      <td
                        className={`px-4 py-3 truncate max-w-[250px] ${
                          outcomeTab === 'WARNING'
                            ? 'text-amber-400'
                            : 'text-red-400'
                        }`}
                      >
                        {r.errorMessage}
                      </td>
                    )}
                  </tr>
                ))}
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
