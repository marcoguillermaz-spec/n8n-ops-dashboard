'use client';

import { useState } from 'react';

/* ── Brand / environment config ────────────────────── */

const BRANDS = [
  { id: 'testbusters', label: 'Testbusters' },
  { id: 'peer4med', label: 'Peer4med' },
  { id: 'topsquad', label: 'Topsquad' },
  { id: 'medschool', label: 'Medschool' },
] as const;

type BrandId = (typeof BRANDS)[number]['id'];
type Env = 'production' | 'staging';

/* ── Component ─────────────────────────────────────── */

export default function EcomCacheFlushSection() {
  const [brand, setBrand] = useState<BrandId>('testbusters');
  const [env, setEnv] = useState<Env>('production');

  // Path flush state
  const [pathValue, setPathValue] = useState('');
  const [pathLoading, setPathLoading] = useState(false);
  const [pathResult, setPathResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // SKU flush state
  const [skuValue, setSkuValue] = useState('');
  const [skuLoading, setSkuLoading] = useState(false);
  const [skuResult, setSkuResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const flush = async (type: 'path' | 'sku') => {
    const value = type === 'path' ? pathValue.trim() : skuValue.trim();
    if (!value) return;

    const setLoading = type === 'path' ? setPathLoading : setSkuLoading;
    const setResult = type === 'path' ? setPathResult : setSkuResult;

    setResult(null);
    setLoading(true);

    try {
      const res = await fetch('/api/ecom/cache-flush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand, env, type, value }),
      });

      const data = await res.json();

      if (data.success) {
        setResult({ ok: true, msg: data.message });
        if (type === 'path') setPathValue('');
        else setSkuValue('');
      } else {
        setResult({ ok: false, msg: data.message });
      }
    } catch (err: any) {
      setResult({ ok: false, msg: err.message ?? 'Errore di rete' });
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50';

  return (
    <div className="space-y-6">
      {/* ── Brand + Environment selectors ─────────── */}
      <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-gray-100 flex items-center gap-2">
            🔄 Cache Flush (Revalidate)
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Invalida la cache Next.js per una pagina o uno SKU su uno dei siti di produzione/staging
          </p>
        </div>

        {/* Brand pills */}
        <div className="mb-4">
          <label className="block text-xs text-gray-400 mb-2">Brand</label>
          <div className="flex gap-2 flex-wrap">
            {BRANDS.map((b) => (
              <button
                key={b.id}
                onClick={() => setBrand(b.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  brand === b.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-gray-200 border border-gray-700'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* Environment toggle */}
        <div>
          <label className="block text-xs text-gray-400 mb-2">Ambiente</label>
          <div className="flex gap-2">
            {(['production', 'staging'] as const).map((e) => (
              <button
                key={e}
                onClick={() => setEnv(e)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  env === e
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-gray-200 border border-gray-700'
                }`}
              >
                {e === 'production' ? 'Produzione' : 'Staging'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Two flush cards ──────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card: Flush Pagina */}
        <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
          <h3 className="text-base font-semibold text-gray-100 mb-1">Flush Pagina</h3>
          <p className="text-xs text-gray-400 mb-4">Invalida la cache di una pagina specifica</p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              flush('path');
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Path relativo</label>
              <input
                type="text"
                placeholder="/test-ammissione/biennali-medicina-odontoiatria-veterinaria/pack-name"
                value={pathValue}
                onChange={(e) => setPathValue(e.target.value)}
                disabled={pathLoading}
                className={inputCls}
              />
              <p className="text-xs text-gray-500 mt-1.5">
                Inserisci il percorso della pagina senza il dominio, es. <code className="text-gray-400">/nome-categoria/nome-pagina</code>
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!pathValue.trim() || pathLoading}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium
                           text-white transition disabled:opacity-40 disabled:cursor-not-allowed
                           flex items-center gap-2"
              >
                {pathLoading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Flushing…
                  </>
                ) : (
                  '🔄 Flush Pagina'
                )}
              </button>
            </div>
          </form>

          {pathResult && (
            <div
              className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${
                pathResult.ok
                  ? 'bg-green-900/30 text-green-400 border border-green-800/40'
                  : 'bg-red-900/30 text-red-400 border border-red-800/40'
              }`}
            >
              {pathResult.ok ? '✓' : '⚠'} {pathResult.msg}
            </div>
          )}
        </div>

        {/* Card: Flush SKU */}
        <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
          <h3 className="text-base font-semibold text-gray-100 mb-1">Flush SKU</h3>
          <p className="text-xs text-gray-400 mb-4">Invalida la cache di tutte le pagine di uno SKU</p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              flush('sku');
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">SKU</label>
              <input
                type="text"
                placeholder="EDI-26-MED-TAV-PRD"
                value={skuValue}
                onChange={(e) => setSkuValue(e.target.value)}
                disabled={skuLoading}
                className={inputCls}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!skuValue.trim() || skuLoading}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium
                           text-white transition disabled:opacity-40 disabled:cursor-not-allowed
                           flex items-center gap-2"
              >
                {skuLoading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Flushing…
                  </>
                ) : (
                  '🔄 Flush SKU'
                )}
              </button>
            </div>
          </form>

          {skuResult && (
            <div
              className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${
                skuResult.ok
                  ? 'bg-green-900/30 text-green-400 border border-green-800/40'
                  : 'bg-red-900/30 text-red-400 border border-red-800/40'
              }`}
            >
              {skuResult.ok ? '✓' : '⚠'} {skuResult.msg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
