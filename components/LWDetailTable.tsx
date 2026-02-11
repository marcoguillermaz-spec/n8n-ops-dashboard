'use client';

import { useState, useEffect, useCallback } from 'react';
import { ACTION_LABELS } from '@/lib/lw-config';

interface DetailRow {
  ts: string;
  action: string;
  orderId: string;
  email: string;
  courseId: string;
  outcome: string;
  statusCode: string;
  errorMessage: string;
}

interface Props {
  action: string;
  days: number;
  onClose: () => void;
}

export default function LWDetailTable({ action, days, onClose }: Props) {
  const [outcomeTab, setOutcomeTab] = useState<'OK' | 'ERROR'>('OK');
  const [rows, setRows] = useState<DetailRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

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
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }) +
      ', ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="mt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Dettaglio: {label}
          </h3>
          <p className="text-sm text-gray-400">{totalCount} risultati</p>
        </div>
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-sm text-gray-400 hover:text-white border border-gray-600 rounded-lg hover:border-gray-400 transition-colors"
        >
          ✕ Chiudi
        </button>
      </div>

      {/* OK / ERROR tabs */}
      <div className="flex gap-1 mb-4 bg-gray-800 rounded-lg p-1 w-fit">
        {(['OK', 'ERROR'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setOutcomeTab(tab)}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
              outcomeTab === tab
                ? tab === 'OK'
                  ? 'bg-emerald-600/30 text-emerald-400'
                  : 'bg-red-600/30 text-red-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab === 'OK' ? '✓ Successi' : '✕ Errori'}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-gray-400 py-8 text-center">Caricamento…</div>
      ) : rows.length === 0 ? (
        <div className="text-gray-500 py-8 text-center">Nessun risultato nel periodo selezionato</div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-800/50">
                <tr className="text-left text-gray-400 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Ordine</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Corso / Risorsa</th>
                  {outcomeTab === 'ERROR' && <th className="px-4 py-3">Errore</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{fmtDate(r.ts)}</td>
                    <td className="px-4 py-3 text-blue-400 font-mono text-xs">#{r.orderId}</td>
                    <td className="px-4 py-3 text-gray-300 truncate max-w-[200px]">{r.email}</td>
                    <td className="px-4 py-3 text-gray-300 truncate max-w-[200px]">{r.courseId}</td>
                    {outcomeTab === 'ERROR' && (
                      <td className="px-4 py-3 text-red-400 truncate max-w-[250px]">{r.errorMessage}</td>
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
