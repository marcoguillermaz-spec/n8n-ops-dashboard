'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ValidationResult } from '@/lib/ecom-storage';

interface Props {
  onViewDetails: (r: ValidationResult) => void;
  refreshKey: number; // bump to trigger re-fetch
}

export default function EcomValidationResults({ onViewDetails, refreshKey }: Props) {
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ecom/validation-results');
      if (res.ok) setResults(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const clearAll = async () => {
    await fetch('/api/ecom/validation-results', { method: 'DELETE' });
    setResults([]);
  };

  const exportCsv = () => {
    if (!results.length) return;
    const rows = [
      ['SKU', 'Product Name', 'Status', 'Sub-Products Found', 'Sub-Products Total', 'Issues'].join(','),
      ...results.map((r) =>
        [r.sku, r.productName ?? 'N/A', r.status, r.subProductsFound, r.subProductsTotal, r.issues ?? 'None'].join(','),
      ),
    ].join('\n');

    const blob = new Blob([rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `validation-results-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /** Extract check counts from validationData */
  const getChecksSummary = (r: ValidationResult) => {
    const vd = r.validationData as any;
    const mainChecks: any[] = vd?.mainProductChecks ?? [];
    const subProducts: any[] = vd?.subProducts ?? [];

    const mainPass = mainChecks.filter((c: any) => c.status === 'pass').length;
    const mainTotal = mainChecks.length;

    const subChecks = subProducts
      .filter((sp: any) => sp.found && sp.checks)
      .flatMap((sp: any) => sp.checks);
    const subPass = subChecks.filter((c: any) => c.status === 'pass').length;
    const subTotal = subChecks.length;

    return { mainPass, mainTotal, subPass, subTotal };
  };

  const passedCount = results.filter((r) => r.status === 'passed').length;
  const failedCount = results.filter((r) => r.status === 'failed').length;

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      passed: 'bg-green-900/40 text-green-400',
      failed: 'bg-red-900/40 text-red-400',
      processing: 'bg-yellow-900/40 text-yellow-400',
      error: 'bg-red-900/40 text-red-400',
    };
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] ?? 'bg-gray-700 text-gray-300'}`}>
        {status === 'passed' && '✓'}
        {status === 'failed' && '✕'}
        {status === 'processing' && '⏳'}
        {status === 'error' && '⚠'}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  /* ── loading ──────────────────────────────────── */
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
          <h3 className="text-base font-semibold text-gray-100">Risultati Validazione</h3>
          {results.length > 0 && (
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-green-400">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> {passedCount} Passed
              </span>
              <span className="flex items-center gap-1 text-red-400">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full" /> {failedCount} Failed
              </span>
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={exportCsv}
              className="px-3 py-1.5 rounded-lg border border-gray-700 text-xs text-gray-300
                         hover:bg-gray-800 transition"
            >
              ⬇ Export CSV
            </button>
            <button
              onClick={clearAll}
              className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-red-400
                         hover:bg-gray-800 transition"
            >
              🗑 Cancella
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      {results.length === 0 ? (
        <div className="text-center py-12">
          <span className="block text-3xl text-gray-600 mb-2">🔍</span>
          <p className="text-sm text-gray-400">Nessun risultato. Inserisci SKU sopra per iniziare.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">SKU</th>
                <th className="px-6 py-3">Prodotto</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Sub-Products</th>
                <th className="px-6 py-3">Checks</th>
                <th className="px-6 py-3">Issues</th>
                <th className="px-6 py-3">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {results.map((r) => {
                const cs = getChecksSummary(r);
                const totalPass = cs.mainPass + cs.subPass;
                const totalChecks = cs.mainTotal + cs.subTotal;
                return (
                  <tr key={r.id} className="hover:bg-gray-800/40 transition">
                    <td className="px-6 py-3 font-medium text-gray-100">{r.sku}</td>
                    <td className="px-6 py-3">
                      <div className="text-gray-200">{r.productName ?? 'N/A'}</div>
                      {r.productId && <div className="text-[11px] text-gray-500">ID: {r.productId}</div>}
                    </td>
                    <td className="px-6 py-3">{statusBadge(r.status)}</td>
                    <td className="px-6 py-3">
                      <span className={r.subProductsFound === r.subProductsTotal ? 'text-green-400' : 'text-red-400'}>
                        {r.subProductsFound}
                      </span>
                      <span className="text-gray-500"> / {r.subProductsTotal}</span>
                    </td>
                    <td className="px-6 py-3">
                      {totalChecks > 0 ? (
                        <span className={totalPass === totalChecks ? 'text-green-400' : 'text-red-400'}>
                          {totalPass}
                          <span className="text-gray-500"> / {totalChecks}</span>
                        </span>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <span className={r.issues && r.issues !== 'None' ? 'text-red-400 text-xs' : 'text-gray-500'}>
                        {r.issues ?? 'None'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => onViewDetails(r)}
                        className="text-xs text-blue-400 hover:text-blue-300 transition"
                      >
                        👁 Dettagli
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
