'use client';

import { useState } from 'react';
import type { FeedValidationResult, FeedCheck } from '@/app/api/catalogue-feed/validate-sku/route';

/* ── Badge ───────────────────────────────────────── */

function CheckBadge({ status }: { status: 'pass' | 'fail' | 'warn' }) {
  if (status === 'pass')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-900/40 px-2 py-0.5 text-xs font-medium text-green-400 border border-green-800/40">
        ✓ Pass
      </span>
    );
  if (status === 'warn')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-900/40 px-2 py-0.5 text-xs font-medium text-yellow-400 border border-yellow-800/40">
        ⚠ Warn
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-900/40 px-2 py-0.5 text-xs font-medium text-red-400 border border-red-800/40">
      ✕ Fail
    </span>
  );
}

/* ── Check row ───────────────────────────────────── */

function CheckRow({ check }: { check: FeedCheck }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-800/60 last:border-0">
      <div className="min-w-0">
        <p className="text-sm text-gray-200 font-medium">{check.name}</p>
        <p className="text-xs text-gray-500 mt-0.5 font-mono">{check.value}</p>
        {check.message && (
          <p className="text-xs text-yellow-400/80 mt-1">{check.message}</p>
        )}
      </div>
      <div className="flex-shrink-0 mt-0.5">
        <CheckBadge status={check.status} />
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────── */

export default function CatFeedSkuValidator() {
  const [sku, setSku] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FeedValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inputCls =
    'w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50';

  const spinner = (
    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = sku.trim();
    if (!trimmed) return;

    setResult(null);
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/catalogue-feed/validate-sku', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku: trimmed }),
      });
      const data = await res.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.message ?? 'Errore sconosciuto');
      }
    } catch (err: any) {
      setError(err.message ?? 'Errore di rete');
    } finally {
      setLoading(false);
    }
  };

  const passCount = result?.checks.filter((c) => c.status === 'pass').length ?? 0;
  const total = result?.checks.length ?? 0;

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/50">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-lg">🔍</span>
          <div>
            <h3 className="text-sm font-semibold text-gray-100">Validazione SKU per Feed</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Verifica che un prodotto rispetti i requisiti per essere pubblicato nei feed Google Merchant e AWIN
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-5">
        {/* Input */}
        <form onSubmit={handleValidate} className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-400 mb-1.5">SKU Prodotto</label>
            <input
              type="text"
              placeholder="es. TB-COR-2024-PLUS"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              disabled={loading}
              className={inputCls}
            />
          </div>
          <button
            type="submit"
            disabled={!sku.trim() || loading}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium
                       text-white transition disabled:opacity-40 disabled:cursor-not-allowed
                       flex items-center gap-2 whitespace-nowrap"
          >
            {loading ? <>{spinner} Validando…</> : 'Valida →'}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="rounded-xl px-4 py-3 text-sm font-medium bg-red-900/30 text-red-400 border border-red-800/40">
            ⚠ {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-4">
            {/* Product header */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-100">{result.productName}</p>
                <p className="text-xs text-gray-500 font-mono mt-0.5">
                  SKU: {result.sku} · ID: {result.productId}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-gray-500">{passCount}/{total} check</span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${
                    result.status === 'passed'
                      ? 'bg-green-900/40 text-green-400 border-green-800/40'
                      : 'bg-red-900/40 text-red-400 border-red-800/40'
                  }`}
                >
                  {result.status === 'passed' ? '✓ Idoneo al feed' : '✕ Non idoneo al feed'}
                </span>
              </div>
            </div>

            {/* Checks list */}
            <div className="rounded-xl bg-gray-800/30 border border-gray-700/50 px-4 divide-y-0">
              {result.checks.map((check, i) => (
                <CheckRow key={i} check={check} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
