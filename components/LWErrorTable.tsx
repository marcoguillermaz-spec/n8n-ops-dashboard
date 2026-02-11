'use client';

import { useState } from 'react';
import { ACTION_LABELS } from '@/lib/lw-config';

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

interface OrderOp {
  ts: string;
  action: string;
  email: string;
  courseId: string;
  statusCode: string;
  outcome: string;
  httpNote: string;
  errorMessage: string;
}

interface LWErrorTableProps {
  errors: LWError[];
  loading: boolean;
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

export default function LWErrorTable({ errors, loading }: LWErrorTableProps) {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderOps, setOrderOps] = useState<OrderOp[]>([]);
  const [loadingDrill, setLoadingDrill] = useState(false);

  async function toggleDrilldown(orderId: string) {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      setOrderOps([]);
      return;
    }

    setExpandedOrder(orderId);
    setLoadingDrill(true);

    try {
      const res = await fetch(`/api/lw/orders?orderId=${orderId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOrderOps(data.operations || []);
    } catch {
      setOrderOps([]);
    } finally {
      setLoadingDrill(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        <svg className="mr-2 h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Caricamento errori…
      </div>
    );
  }

  if (!errors.length) {
    return (
      <div className="py-12 text-center text-sm text-gray-500">
        Nessun errore nel periodo selezionato
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-800">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-xs uppercase tracking-wider text-gray-500">
            <th className="px-4 py-3">Data</th>
            <th className="px-4 py-3">Azione</th>
            <th className="px-4 py-3">Ordine</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Corso / Risorsa</th>
            <th className="px-4 py-3">Codice</th>
            <th className="px-4 py-3">Errore</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/60">
          {errors.map((err, idx) => {
            const isExpanded = expandedOrder === err.orderId;
            return (
              <tr key={`${err.orderId}-${err.ts}-${idx}`} className="group">
                <td colSpan={7} className="p-0">
                  {/* Error row */}
                  <div
                    onClick={() => toggleDrilldown(err.orderId)}
                    className={`flex cursor-pointer items-center transition hover:bg-gray-800/40 ${
                      isExpanded ? 'bg-gray-800/30' : ''
                    }`}
                  >
                    <div className="w-[14%] whitespace-nowrap px-4 py-3 text-gray-300">
                      {formatDate(err.ts)}
                    </div>
                    <div className="w-[12%] px-4 py-3">
                      <span className="inline-flex rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-300">
                        {ACTION_LABELS[err.action] || err.action}
                      </span>
                    </div>
                    <div className="w-[10%] px-4 py-3 font-mono text-xs text-blue-400">
                      #{err.orderId}
                    </div>
                    <div className="w-[18%] truncate px-4 py-3 text-gray-400">
                      {err.email}
                    </div>
                    <div className="w-[16%] truncate px-4 py-3 font-mono text-xs text-gray-500">
                      {err.courseId || '—'}
                    </div>
                    <div className="w-[8%] px-4 py-3">
                      <span className="inline-flex rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-400">
                        {err.statusCode || err.httpNote}
                      </span>
                    </div>
                    <div className="w-[22%] truncate px-4 py-3 text-xs text-red-300/80">
                      {err.errorMessage || err.httpNote}
                    </div>
                  </div>

                  {/* Drill-down panel */}
                  {isExpanded && (
                    <div className="border-t border-gray-800/50 bg-gray-900/80 px-6 py-4">
                      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                        Tutte le operazioni — Ordine #{err.orderId}
                      </p>

                      {loadingDrill ? (
                        <p className="py-4 text-center text-xs text-gray-500">
                          Caricamento…
                        </p>
                      ) : orderOps.length === 0 ? (
                        <p className="py-4 text-center text-xs text-gray-500">
                          Nessuna operazione trovata
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {orderOps.map((op, opIdx) => (
                            <div
                              key={opIdx}
                              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs ${
                                op.outcome === 'OK'
                                  ? 'bg-emerald-500/5 text-gray-300'
                                  : 'bg-red-500/10 text-red-300'
                              }`}
                            >
                              <span className="w-5 text-center">
                                {op.outcome === 'OK' ? '✓' : '✕'}
                              </span>
                              <span className="w-24">
                                {ACTION_LABELS[op.action] || op.action}
                              </span>
                              <span className="w-40 truncate font-mono text-gray-500">
                                {op.courseId || '—'}
                              </span>
                              <span className="w-12 text-center">
                                {op.statusCode}
                              </span>
                              <span className="flex-1 truncate text-gray-500">
                                {op.errorMessage || ''}
                              </span>
                              <span className="text-gray-600">
                                {formatDate(op.ts)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
