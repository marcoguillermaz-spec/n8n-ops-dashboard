'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CodeItem } from '@/lib/ecom-coupon';

interface Props {
  promotionId: number;
  refreshKey: number;
}

type StatusFilter = 'all' | 'available' | 'used';

const PAGE_SIZE = 50;

export default function EcomCouponList({ promotionId, refreshKey }: Props) {
  const [codes, setCodes] = useState<CodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const loadCodes = useCallback(async (reset: boolean) => {
    if (reset) {
      setLoading(true);
      setCodes([]);
      setCursor(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams({ limit: '250' });
      if (!reset && cursor) params.set('after', cursor);

      const res = await fetch(`/api/ecom/coupon/codes/${promotionId}?${params}`);
      if (!res.ok) return;
      const json = await res.json();

      if (reset) {
        setCodes(json.data ?? []);
      } else {
        setCodes((prev) => [...prev, ...(json.data ?? [])]);
      }
      setCursor(json.pagination?.after ?? null);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [promotionId, cursor]);

  useEffect(() => {
    setPage(1);
    loadCodes(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promotionId, refreshKey]);

  const isAvailable = (c: CodeItem) =>
    c.max_uses === 0 || c.current_uses < c.max_uses;

  const filtered = useMemo(() =>
    codes.filter((c) => {
      if (filter === 'available' && !isAvailable(c)) return false;
      if (filter === 'used' && isAvailable(c)) return false;
      if (search && !c.code.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [codes, filter, search],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Reset to page 1 when filter/search changes
  useEffect(() => { setPage(1); }, [filter, search]);

  const exportCsv = () => {
    if (!codes.length) return;
    const rows = [
      ['Codice', 'Max Utilizzi', 'Utilizzi Correnti', 'Max Per Cliente', 'Stato', 'Data Creazione'].join(','),
      ...codes.map((c) =>
        [
          c.code,
          c.max_uses,
          c.current_uses,
          c.max_uses_per_customer,
          isAvailable(c) ? 'Disponibile' : 'Utilizzato',
          c.created_at,
        ].join(','),
      ),
    ].join('\n');

    const blob = new Blob([rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coupon-codes-${promotionId}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
        <div className="flex justify-center py-10">
          <svg className="h-7 w-7 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gray-900 border border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <h3 className="text-base font-semibold text-gray-100">Codici Coupon</h3>
          <span className="text-xs text-gray-400">{codes.length} caricati</span>
        </div>
        {codes.length > 0 && (
          <button
            onClick={exportCsv}
            className="px-3 py-1.5 rounded-lg border border-gray-700 text-xs text-gray-300
                       hover:bg-gray-800 transition"
          >
            ⬇ Export CSV
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-gray-800/50">
        <div className="flex gap-1 bg-gray-800 rounded-lg p-0.5">
          {([
            { id: 'all', label: 'Tutti' },
            { id: 'available', label: 'Disponibili' },
            { id: 'used', label: 'Utilizzati' },
          ] as const).map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                filter === f.id
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Cerca codice..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg bg-gray-800 border border-gray-700 px-3 py-1.5
                     text-xs text-gray-100 placeholder-gray-500
                     focus:outline-none focus:ring-2 focus:ring-blue-600 w-48"
        />
        <span className="text-xs text-gray-500 ml-auto">{filtered.length} risultati</span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-10">
          <span className="block text-3xl text-gray-600 mb-2">🎟️</span>
          <p className="text-sm text-gray-400">
            {codes.length === 0 ? 'Nessun codice trovato per questa promozione' : 'Nessun risultato con i filtri selezionati'}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Codice</th>
                  <th className="px-6 py-3">Max Utilizzi</th>
                  <th className="px-6 py-3">Utilizzi Correnti</th>
                  <th className="px-6 py-3">Stato</th>
                  <th className="px-6 py-3">Data Creazione</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {paged.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-800/40 transition">
                    <td className="px-6 py-3 font-mono text-gray-100 text-xs">{c.code}</td>
                    <td className="px-6 py-3 text-gray-300">
                      {c.max_uses === 0 ? '∞' : c.max_uses}
                    </td>
                    <td className="px-6 py-3 text-gray-300">{c.current_uses}</td>
                    <td className="px-6 py-3">
                      {isAvailable(c) ? (
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-900/40 text-green-400">
                          Disponibile
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-900/40 text-red-400">
                          Utilizzato
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-gray-400 text-xs">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString('it-IT') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-800">
              <span className="text-xs text-gray-500">
                Pagina {safePage} di {totalPages}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-700 text-xs text-gray-300
                             hover:bg-gray-800 transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ← Precedente
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-700 text-xs text-gray-300
                             hover:bg-gray-800 transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Successiva →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Load more from API */}
      {cursor && (
        <div className="px-6 py-4 border-t border-gray-800 text-center">
          <button
            onClick={() => loadCodes(false)}
            disabled={loadingMore}
            className="px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-300
                       hover:bg-gray-800 transition disabled:opacity-40"
          >
            {loadingMore ? 'Caricamento...' : 'Carica altri dall\'API'}
          </button>
        </div>
      )}
    </div>
  );
}
