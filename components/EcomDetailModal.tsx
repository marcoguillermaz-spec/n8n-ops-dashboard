'use client';

import type { ValidationResult, SubProduct, ProductCheck } from '@/lib/ecom-storage';

interface Props {
  result: ValidationResult;
  onClose: () => void;
  onRetry: (sku: string) => void;
}

/* ── Check badge component ──────────────────────────── */

function CheckBadge({ check }: { check: ProductCheck }) {
  const pass = check.status === 'pass';
  return (
    <div
      className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs border ${
        pass
          ? 'bg-green-900/20 border-green-800/30'
          : 'bg-red-900/20 border-red-800/30'
      }`}
    >
      <span className={`mt-0.5 flex-shrink-0 ${pass ? 'text-green-400' : 'text-red-400'}`}>
        {pass ? '✓' : '✕'}
      </span>
      <div className="min-w-0">
        <div className={`font-medium ${pass ? 'text-green-300' : 'text-red-300'}`}>
          {check.name}
        </div>
        <div className="text-[10px] text-gray-400 truncate">{check.value}</div>
        {check.message && (
          <div className="text-[10px] text-red-400/80 mt-0.5">{check.message}</div>
        )}
      </div>
    </div>
  );
}

/* ── Checks summary pill ─────────────────────────────── */

function ChecksSummary({ checks }: { checks: ProductCheck[] }) {
  const passed = checks.filter((c) => c.status === 'pass').length;
  const total = checks.length;
  const allPassed = passed === total;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        allPassed
          ? 'bg-green-900/40 text-green-400'
          : 'bg-red-900/40 text-red-400'
      }`}
    >
      {allPassed ? '✓' : '⚠'} {passed}/{total}
    </span>
  );
}

/* ── Main modal component ────────────────────────────── */

export default function EcomDetailModal({ result, onClose, onRetry }: Props) {
  const vd = result.validationData as any;
  const subProducts: SubProduct[] = vd?.subProducts ?? [];
  const mainChecks: ProductCheck[] = vd?.mainProductChecks ?? [];
  const apiCalls: any[] = (result.apiCalls as any[]) ?? [];

  const fmt = (ms: number) => (ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`);
  const totalTime = apiCalls.reduce((s, c) => s + (c.duration ?? 0), 0);

  const mainPassCount = mainChecks.filter((c) => c.status === 'pass').length;

  const statusColor: Record<string, string> = {
    passed: 'text-green-400',
    failed: 'text-red-400',
    processing: 'text-yellow-400',
    error: 'text-red-400',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <h3 className="text-base font-semibold text-gray-100">
              Dettaglio Prodotto: {result.sku}
            </h3>
            <p className="text-xs text-gray-400">{result.productName ?? 'Nome non disponibile'}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl transition">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl bg-gray-800/60 p-4">
              <div className="text-xs text-gray-400">Status</div>
              <div className={`text-lg font-semibold mt-1 ${statusColor[result.status] ?? 'text-gray-300'}`}>
                {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
              </div>
            </div>
            <div className="rounded-xl bg-gray-800/60 p-4">
              <div className="text-xs text-gray-400">Sub-Products</div>
              <div className="text-lg font-semibold text-gray-100 mt-1">
                {result.subProductsFound} / {result.subProductsTotal}
              </div>
            </div>
            <div className="rounded-xl bg-gray-800/60 p-4">
              <div className="text-xs text-gray-400">Check Principali</div>
              <div className={`text-lg font-semibold mt-1 ${mainPassCount === mainChecks.length ? 'text-green-400' : 'text-red-400'}`}>
                {mainPassCount} / {mainChecks.length}
              </div>
            </div>
            <div className="rounded-xl bg-gray-800/60 p-4">
              <div className="text-xs text-gray-400">Tempo Totale</div>
              <div className="text-lg font-semibold text-gray-100 mt-1">
                {apiCalls.length > 0 ? fmt(totalTime) : 'N/A'}
              </div>
            </div>
          </div>

          {/* Main product checks */}
          {mainChecks.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-200">
                  Controlli Prodotto Principale
                </h4>
                <ChecksSummary checks={mainChecks} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {mainChecks.map((check, i) => (
                  <CheckBadge key={i} check={check} />
                ))}
              </div>
            </div>
          )}

          {/* Sub-product details */}
          {subProducts.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-200 mb-3">
                Dettaglio Sub-Prodotti
              </h4>
              <div className="space-y-4">
                {subProducts.map((sp, i) => (
                  <div
                    key={i}
                    className={`rounded-xl border ${
                      sp.found
                        ? sp.checks && sp.checks.every((c) => c.status === 'pass')
                          ? 'border-green-800/40 bg-green-900/10'
                          : 'border-yellow-800/40 bg-yellow-900/10'
                        : 'border-red-800/40 bg-red-900/10'
                    }`}
                  >
                    {/* Sub-product header */}
                    <div className="flex items-center justify-between px-4 py-3">
                      <div>
                        <span className="font-medium text-gray-100 text-sm">{sp.name}</span>
                        <div className="text-xs text-gray-400 mt-0.5">
                          SKU: <span className="font-mono text-gray-300">{sp.sku}</span>
                          &nbsp;|&nbsp; Tipo: {sp.type}
                          &nbsp;|&nbsp; Obbligatorio: {sp.required ? 'Sì' : 'No'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {sp.found && sp.checks && <ChecksSummary checks={sp.checks} />}
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            sp.found
                              ? 'bg-green-900/40 text-green-400'
                              : 'bg-red-900/40 text-red-400'
                          }`}
                        >
                          {sp.found ? '✓ Found' : '✕ Missing'}
                        </span>
                      </div>
                    </div>

                    {/* Sub-product checks (only for found products) */}
                    {sp.found && sp.checks && sp.checks.length > 0 && (
                      <div className="px-4 pb-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {sp.checks.map((check, ci) => (
                            <CheckBadge key={ci} check={check} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Error message for missing sub-products */}
                    {sp.error && (
                      <div className="px-4 pb-3">
                        <div className="text-xs text-red-400">⚠ {sp.error}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* API calls */}
          {apiCalls.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-200 mb-3">Dettaglio Chiamate API</h4>
              <div className="space-y-2">
                {apiCalls.map((c, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center rounded-lg bg-gray-800/50 px-4 py-2.5 text-xs"
                  >
                    <span className="text-gray-300">{c.step}</span>
                    <div className="flex items-center gap-2">
                      <span className={c.success ? 'text-green-400' : 'text-red-400'}>
                        {c.success ? `${c.status} OK` : `${c.status} Error`}
                      </span>
                      <span className="text-gray-500">({fmt(c.duration ?? 0)})</span>
                      {c.error && <span className="text-red-400">— {c.error}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Issues summary */}
          {result.issues && result.issues !== 'None' && (
            <div className="rounded-xl border border-red-800/40 bg-red-900/20 p-4">
              <h4 className="text-sm font-semibold text-red-400 mb-1">Issues</h4>
              <p className="text-sm text-red-300">{result.issues}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-800">
          <button
            onClick={() => onRetry(result.sku)}
            className="px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-300
                       hover:bg-gray-800 transition"
          >
            ↻ Ripeti Validazione
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium
                       text-white transition"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
