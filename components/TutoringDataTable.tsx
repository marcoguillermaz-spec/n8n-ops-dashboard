'use client';

import { useEffect, useState } from 'react';
import { TUTORING_COLS } from '@/lib/tutoring-config';

interface TutoringDataTableProps {
  tabId: string;
}

const PAGE_SIZE = 50;

export default function TutoringDataTable({ tabId }: TutoringDataTableProps) {
  const [items, setItems] = useState<Record<string, string>[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [tabId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    fetch(`/api/tutoring/data?tab=${tabId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Errore caricamento dati');
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setItems(data.items);
        setCount(data.count);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message ?? 'Errore sconosciuto');
        setItems([]);
        setCount(0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tabId]);

  const cols = TUTORING_COLS;

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-lg bg-gray-800/60 border border-gray-800/40"
          />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-xl border border-red-800 bg-red-950/50 px-4 py-8 text-center text-sm text-red-300">
        ⚠️ {error}
      </div>
    );
  }

  // Empty state
  if (!items.length) {
    return (
      <div className="py-12 text-center text-sm text-gray-500">
        Nessun dato trovato per questo sheet.
      </div>
    );
  }

  // Pagination
  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const start = page * PAGE_SIZE;
  const pageItems = items.slice(start, start + PAGE_SIZE);

  return (
    <div>
      {/* Stats bar */}
      <div className="mb-4 flex items-center justify-between text-xs text-gray-500">
        <span>{count} righe totali</span>
        {totalPages > 1 && (
          <span>
            Pagina {page + 1} di {totalPages}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-xs uppercase tracking-wider text-gray-500">
              {cols.labels.map((label, i) => (
                <th key={i} className="px-4 py-3 whitespace-nowrap">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {pageItems.map((item, i) => (
              <tr
                key={start + i}
                className="transition hover:bg-gray-800/40"
              >
                {cols.keys.map((key) => (
                  <td
                    key={key}
                    className="whitespace-nowrap px-4 py-3 text-gray-300"
                  >
                    {item[key] || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs transition hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Precedente
          </button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`rounded-lg px-3 py-1.5 text-xs transition ${
                  page === i
                    ? 'bg-amber-600 text-white'
                    : 'border border-gray-700 hover:bg-gray-800 text-gray-400'
                }`}
              >
                {i + 1}
              </button>
            )).slice(
              Math.max(0, page - 2),
              Math.min(totalPages, page + 3)
            )}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs transition hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Successiva →
          </button>
        </div>
      )}
    </div>
  );
}
