'use client';

import { useEffect, useState } from 'react';
import type { Brand, Provider } from '@/lib/catalogue-feed-config';
import { GOOGLE_COLS, AWIN_COLS } from '@/lib/catalogue-feed-config';

interface CatFeedProductTableProps {
  brand: Brand;
  provider: Provider;
}

const PAGE_SIZE = 50;

export default function CatFeedProductTable({ brand, provider }: CatFeedProductTableProps) {
  const [products, setProducts] = useState<Record<string, string>[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);

  // Reset page on brand/provider change
  useEffect(() => {
    setPage(0);
  }, [brand, provider]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    fetch(`/api/catalogue-feed/products?brand=${brand}&provider=${provider}`)
      .then((res) => {
        if (!res.ok) throw new Error('Errore caricamento prodotti');
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setProducts(data.products);
        setCount(data.count);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message ?? 'Errore sconosciuto');
        setProducts([]);
        setCount(0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [brand, provider]);

  const cols = provider === 'google' ? GOOGLE_COLS : AWIN_COLS;

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
  if (!products.length) {
    return (
      <div className="py-12 text-center text-sm text-gray-500">
        Nessun prodotto trovato nel feed.
      </div>
    );
  }

  // Detect rows with empty values
  const rowsWithErrors: { index: number; missingFields: string[] }[] = [];
  for (let i = 0; i < products.length; i++) {
    const missing: string[] = [];
    for (let j = 0; j < cols.keys.length; j++) {
      const val = products[i][cols.keys[j]];
      if (!val || val.trim() === '') {
        missing.push(cols.labels[j]);
      }
    }
    if (missing.length > 0) {
      rowsWithErrors.push({ index: i, missingFields: missing });
    }
  }

  // Pagination
  const totalPages = Math.ceil(products.length / PAGE_SIZE);
  const start = page * PAGE_SIZE;
  const pageProducts = products.slice(start, start + PAGE_SIZE);

  return (
    <div>
      {/* Error banner for rows with missing values */}
      {rowsWithErrors.length > 0 && (
        <div className="mb-4 rounded-xl border border-yellow-800/60 bg-yellow-950/40 px-4 py-3 text-sm text-yellow-300">
          ⚠️ <strong>{rowsWithErrors.length} prodotti</strong> presentano valori assenti:
          <ul className="mt-1.5 ml-4 space-y-0.5 text-xs text-yellow-400">
            {rowsWithErrors.slice(0, 5).map(({ index, missingFields }) => (
              <li key={index}>
                Riga {index + 1} — manca: {missingFields.join(', ')}
              </li>
            ))}
            {rowsWithErrors.length > 5 && (
              <li className="text-yellow-500">…e altri {rowsWithErrors.length - 5} prodotti</li>
            )}
          </ul>
        </div>
      )}

      {/* Stats bar */}
      <div className="mb-4 flex items-center justify-between text-xs text-gray-500">
        <span>{count} prodotti nel feed</span>
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
                <th key={i} className="px-4 py-3">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {pageProducts.map((product, i) => {
              const globalIdx = start + i;
              const hasError = rowsWithErrors.some((r) => r.index === globalIdx);
              return (
                <tr
                  key={globalIdx}
                  className={`transition hover:bg-gray-800/40 ${hasError ? 'bg-yellow-950/20' : ''}`}
                >
                  {cols.keys.map((key) => {
                    const val = product[key];
                    const isEmpty = !val || val.trim() === '';
                    return (
                      <td
                        key={key}
                        className={`whitespace-nowrap px-4 py-3 ${
                          isEmpty ? 'text-red-400 italic' : 'text-gray-300'
                        }`}
                      >
                        {isEmpty ? '(assente)' : val}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
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
                    ? 'bg-violet-600 text-white'
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
