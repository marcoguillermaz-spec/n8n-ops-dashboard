'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { CheckBadge, ChecksSummary } from './EcomCheckBadge';
import type { ProductCheck } from '@/lib/ecom-storage';

/* ── Types (mirror server types for client use) ────────── */

interface BundleIndexProgress {
  status: 'idle' | 'building' | 'ready' | 'error';
  currentPage: number;
  totalPages: number;
  productsScanned: number;
  bundlesFound: number;
  percentage: number;
  currentStep: string;
  isExpired: boolean;
  error?: string;
}

interface BundleIndexEntry {
  bundleProductId: number;
  bundleSku: string;
  bundleName: string;
  modifierName: string;
  checks: ProductCheck[];
}

interface BundleLookupResult {
  sku: string;
  found: boolean;
  bundles: BundleIndexEntry[];
  indexAge: number;
  totalBundlesInIndex: number;
}

/* ── Helpers ──────────────────────────────────────────── */

function formatAge(ms: number): string {
  const min = Math.floor(ms / 60_000);
  if (min < 1) return 'meno di 1 minuto fa';
  if (min === 1) return '1 minuto fa';
  return `${min} minuti fa`;
}

/* ── Component ───────────────────────────────────────── */

export default function EcomBundleLookup() {
  const [indexStatus, setIndexStatus] = useState<BundleIndexProgress | null>(null);
  const [skuInput, setSkuInput] = useState('');
  const [result, setResult] = useState<BundleLookupResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showFeedback = useCallback((ok: boolean, msg: string) => {
    setFeedback({ ok, msg });
    setTimeout(() => setFeedback(null), 4000);
  }, []);

  /* ── Poll index status ──────────────────────────────── */

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/ecom/bundle-index/status');
      if (res.ok) {
        const data: BundleIndexProgress = await res.json();
        setIndexStatus(data);
        return data;
      }
    } catch { /* ignore */ }
    return null;
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Polling during build
  useEffect(() => {
    if (indexStatus?.status === 'building') {
      if (!pollingRef.current) {
        pollingRef.current = setInterval(fetchStatus, 2000);
      }
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [indexStatus?.status, fetchStatus]);

  /* ── Actions ────────────────────────────────────────── */

  const startBuild = async () => {
    try {
      const res = await fetch('/api/ecom/bundle-index/build', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        showFeedback(false, data.error ?? 'Errore avvio indicizzazione');
        return;
      }
      setResult(null);
      fetchStatus();
    } catch (e: any) {
      showFeedback(false, e.message ?? 'Errore di rete');
    }
  };

  const invalidateIndex = async () => {
    try {
      await fetch('/api/ecom/bundle-index/build', { method: 'DELETE' });
      setResult(null);
      fetchStatus();
    } catch { /* ignore */ }
  };

  const searchSku = async () => {
    const sku = skuInput.trim();
    if (!sku) return;

    setSearching(true);
    setResult(null);
    setExpandedRow(null);
    try {
      const res = await fetch(`/api/ecom/bundle-lookup?sku=${encodeURIComponent(sku)}`);
      const data = await res.json();
      if (!res.ok) {
        showFeedback(false, data.error ?? 'Errore ricerca');
        return;
      }
      setResult(data.data);
    } catch (e: any) {
      showFeedback(false, e.message ?? 'Errore di rete');
    } finally {
      setSearching(false);
    }
  };

  /* ── Derived state ──────────────────────────────────── */

  const isReady = indexStatus?.status === 'ready' && !indexStatus.isExpired;
  const canSearch = isReady && !searching;

  /* ── Status badge ──────────────────────────────────── */

  function StatusBadge() {
    if (!indexStatus) return null;
    const s = indexStatus.status;
    const expired = indexStatus.isExpired;

    if (s === 'idle')
      return <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-800 text-gray-400">Non costruito</span>;
    if (s === 'building')
      return <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-900/40 text-blue-400">In costruzione…</span>;
    if (s === 'ready' && !expired)
      return <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-900/40 text-green-400">✓ Pronto</span>;
    if (s === 'ready' && expired)
      return <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-900/40 text-yellow-400">⚠ Scaduto</span>;
    if (s === 'error')
      return <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-900/40 text-red-400">✕ Errore</span>;
    return null;
  }

  /* ── Render ─────────────────────────────────────────── */

  return (
    <div className="space-y-6">
      {/* Feedback toast */}
      {feedback && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            feedback.ok
              ? 'bg-green-900/30 text-green-400 border border-green-800/40'
              : 'bg-red-900/30 text-red-400 border border-red-800/40'
          }`}
        >
          {feedback.ok ? '✓' : '⚠'} {feedback.msg}
        </div>
      )}

      {/* ── A. Index Status Card ─────────────────────── */}
      <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-200">Indice Bundle</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Cache reverse-lookup per identificare i bundle che contengono un dato SKU
            </p>
          </div>
          <StatusBadge />
        </div>

        {/* Building: progress bar */}
        {indexStatus?.status === 'building' && (
          <div className="space-y-3">
            <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-blue-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${indexStatus.percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>{indexStatus.currentStep}</span>
              <span>{indexStatus.percentage}%</span>
            </div>
            <div className="flex gap-4 text-xs text-gray-500">
              <span>Pagina {indexStatus.currentPage}/{indexStatus.totalPages || '…'}</span>
              <span>Prodotti: {indexStatus.productsScanned}</span>
              <span>Bundle: {indexStatus.bundlesFound}</span>
            </div>
          </div>
        )}

        {/* Ready: stats */}
        {indexStatus?.status === 'ready' && (
          <div className="flex items-center gap-6 text-xs text-gray-400">
            <span>{indexStatus.bundlesFound} bundle indicizzati</span>
            <span>{indexStatus.productsScanned} prodotti scansionati</span>
            {indexStatus.isExpired ? (
              <span className="text-yellow-400">Scaduto</span>
            ) : (
              <span>Costruito {formatAge(Date.now() - Date.now() + (indexStatus.percentage === 100 ? 0 : 0))}</span>
            )}
          </div>
        )}

        {/* Error: message */}
        {indexStatus?.status === 'error' && (
          <div className="text-xs text-red-400 mt-2">
            {indexStatus.error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-4">
          {(indexStatus?.status === 'idle' || indexStatus?.status === 'error') && (
            <button
              onClick={startBuild}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white transition"
            >
              {indexStatus.status === 'error' ? 'Riprova' : 'Costruisci Indice'}
            </button>
          )}
          {indexStatus?.status === 'ready' && (
            <>
              <button
                onClick={startBuild}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white transition"
              >
                Ricostruisci
              </button>
              <button
                onClick={invalidateIndex}
                className="px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-300 hover:bg-gray-800 transition"
              >
                Invalida Cache
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── B. Search Input ──────────────────────────── */}
      {isReady && (
        <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
          <h3 className="text-sm font-semibold text-gray-200 mb-3">Cerca SKU nei Bundle</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={skuInput}
              onChange={(e) => setSkuInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') searchSku(); }}
              placeholder="Inserisci SKU da cercare…"
              className="flex-1 rounded-lg bg-gray-800 border border-gray-700 px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition font-mono"
            />
            <button
              onClick={searchSku}
              disabled={!canSearch || !skuInput.trim()}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium text-white transition"
            >
              {searching ? 'Ricerca…' : 'Cerca'}
            </button>
          </div>
        </div>
      )}

      {/* ── C. Results Table ─────────────────────────── */}
      {result && (
        <div className="rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-gray-200">
              Risultati per <span className="font-mono text-blue-400">{result.sku}</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {result.found
                ? `${result.bundles.length} bundle trovato/i su ${result.totalBundlesInIndex} totali`
                : 'Nessun bundle contiene lo SKU cercato'}
            </p>
          </div>

          {result.found && result.bundles.length > 0 && (
            <div className="divide-y divide-gray-800">
              {/* Header */}
              <div className="grid grid-cols-[1fr_2fr_auto_1fr_auto_auto] gap-4 px-6 py-3 text-xs font-medium text-gray-500 bg-gray-900/50">
                <span>SKU Bundle</span>
                <span>Nome</span>
                <span>Product ID</span>
                <span>Modifier</span>
                <span>Status</span>
                <span>Check</span>
              </div>

              {/* Rows */}
              {result.bundles.map((bundle, i) => {
                const allPass = bundle.checks.every((c) => c.status === 'pass');
                const isExpanded = expandedRow === i;

                return (
                  <div key={i}>
                    <div
                      onClick={() => setExpandedRow(isExpanded ? null : i)}
                      className="grid grid-cols-[1fr_2fr_auto_1fr_auto_auto] gap-4 px-6 py-3 text-sm items-center cursor-pointer hover:bg-gray-800/50 transition"
                    >
                      <span className="font-mono text-gray-300 text-xs">{bundle.bundleSku || '—'}</span>
                      <span className="text-gray-200 truncate">{bundle.bundleName}</span>
                      <span className="font-mono text-gray-400 text-xs">{bundle.bundleProductId}</span>
                      <span className="text-gray-400 text-xs truncate">{bundle.modifierName}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          allPass
                            ? 'bg-green-900/40 text-green-400'
                            : 'bg-red-900/40 text-red-400'
                        }`}
                      >
                        {allPass ? 'OK' : 'Problemi'}
                      </span>
                      <ChecksSummary checks={bundle.checks} />
                    </div>

                    {/* Expanded check details */}
                    {isExpanded && (
                      <div className="px-6 pb-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                          {bundle.checks.map((check, ci) => (
                            <CheckBadge key={ci} check={check} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {!result.found && (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-500 text-sm">Nessun bundle contiene lo SKU cercato</div>
              <div className="text-gray-600 text-xs mt-1">
                Lo SKU potrebbe non essere un sub-prodotto, oppure l&apos;indice potrebbe non essere aggiornato
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
