'use client';

import { useState, useRef } from 'react';

/* ── Brand registry (kept in sync with lib/elliot-brands.ts) ── */
const BRANDS = [
  { id: '607fe6f7879db1c48df247b4', name: 'Testbusters' },
  { id: '60acfd593ad3392d9e5a164d', name: 'Peer4Med' },
  { id: '6839a7df6aec09e10f636e60', name: 'TopSquad' },
] as const;

/* ── Types ─────────────────────────────────────────────────── */

interface AddedProduct {
  sku: string;
  name: string;
  elliotResponse: unknown;
}

interface ApiError {
  sku: string;
  error: string;
}

interface Result {
  added: AddedProduct[];
  alreadyExists: { sku: string; name: string }[];
  bcErrors: ApiError[];
  elliotErrors: ApiError[];
}

/* ── Sub-components ────────────────────────────────────────── */

function ErrorTable({ title, rows }: { title: string; rows: ApiError[] }) {
  return (
    <div className="rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-800">
        <span className="text-yellow-400 text-sm font-semibold">⚠ {title}</span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-800">
            <th className="text-left px-5 py-2">SKU</th>
            <th className="text-left px-5 py-2">Errore</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {rows.map((e) => (
            <tr key={e.sku} className="hover:bg-gray-800/40 transition">
              <td className="px-5 py-2.5 font-mono text-yellow-300">{e.sku}</td>
              <td className="px-5 py-2.5 text-gray-400">{e.error}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Main component ────────────────────────────────────────── */

export default function EcomElliotSection() {
  const [rawInput, setRawInput] = useState('');
  const [brandId, setBrandId] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setRawInput(ev.target?.result as string);
    reader.readAsText(file);
    // Reset so the same file can be re-uploaded if needed
    e.target.value = '';
  };
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  /* Parse textarea: split by commas or newlines, trim, dedupe */
  function parseSkus(input: string): string[] {
    const arr = input
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    return arr.filter((sku, i) => arr.indexOf(sku) === i);
  }

  const skus = parseSkus(rawInput);
  const canSubmit = skus.length > 0 && brandId !== '';

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    setResult(null);
    setApiError(null);

    try {
      const res = await fetch('/api/ecom/elliot/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skus, brandId }),
      });

      const json = await res.json();

      if (!res.ok) {
        setApiError(json?.error ?? `Errore ${res.status}`);
      } else {
        setResult(json as Result);
      }
    } catch (err: any) {
      setApiError(err?.message ?? 'Errore di rete');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Input card ──────────────────────────────────── */}
      <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6 space-y-5">

        {/* Brand selector */}
        <div>
          <h3 className="text-sm font-semibold text-gray-200 mb-3">
            Brand <span className="text-red-400">*</span>
          </h3>
          <div className="flex flex-wrap gap-3">
            {BRANDS.map((brand) => {
              const selected = brandId === brand.id;
              return (
                <button
                  key={brand.id}
                  type="button"
                  onClick={() => setBrandId(brand.id)}
                  disabled={loading}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
                    selected
                      ? 'bg-blue-600 border-blue-500 text-white shadow'
                      : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${selected ? 'bg-white' : 'bg-gray-600'}`}
                  />
                  {brand.name}
                </button>
              );
            })}
          </div>
          {brandId === '' && (
            <p className="mt-2 text-xs text-gray-500">Seleziona un brand per procedere.</p>
          )}
        </div>

        {/* SKU input */}
        <div>
          <h3 className="text-sm font-semibold text-gray-200 mb-3">SKU da aggiungere</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                Incolla SKU (separati da virgola o a capo)
              </label>
              <textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder={'TB-SKU-001\nTB-SKU-002, TB-SKU-003'}
                rows={5}
                disabled={loading}
                className="w-full rounded-xl bg-gray-800 border border-gray-700 px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                Oppure carica un file CSV
              </label>
              <div
                className="border-2 border-dashed border-gray-700 rounded-xl p-6 text-center hover:border-gray-500 transition cursor-pointer h-[calc(100%-1.5rem)]"
                onClick={() => !loading && fileRef.current?.click()}
              >
                <span className="block text-2xl text-gray-500 mb-1">📄</span>
                <p className="text-xs text-gray-400">Clicca per caricare CSV/TXT</p>
                <p className="text-xs text-gray-600 mt-1">Una SKU per riga o separate da virgola</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFile}
                  className="hidden"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SKU preview chips */}
        {skus.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {skus.map((sku) => (
              <span
                key={sku}
                className="inline-flex items-center rounded-full bg-blue-900/30 border border-blue-800/40 px-3 py-0.5 text-xs text-blue-300 font-mono"
              >
                {sku}
              </span>
            ))}
            <span className="text-xs text-gray-500 self-center ml-1">
              {skus.length} SKU{skus.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !canSubmit}
          className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2.5 text-sm font-semibold text-white transition"
        >
          {loading ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Aggiunta in corso…
            </>
          ) : (
            <>➕ Aggiungi su Elliot</>
          )}
        </button>
      </div>

      {/* ── API error ───────────────────────────────────── */}
      {apiError && (
        <div className="rounded-xl bg-red-900/30 border border-red-800/40 px-4 py-3 text-sm text-red-400">
          ⚠ {apiError}
        </div>
      )}

      {/* ── Results ─────────────────────────────────────── */}
      {result && (
        <div className="space-y-4">
          {/* Added OK */}
          {result.added.length > 0 && (
            <div className="rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-800 flex items-center gap-2">
                <span className="text-green-400 text-sm font-semibold">
                  ✓ {result.added.length} prodott{result.added.length === 1 ? 'o aggiunto' : 'i aggiunti'}
                </span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-800">
                    <th className="text-left px-5 py-2">SKU</th>
                    <th className="text-left px-5 py-2">Nome prodotto (BigCommerce)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {result.added.map((p) => (
                    <tr key={p.sku} className="hover:bg-gray-800/40 transition">
                      <td className="px-5 py-2.5 font-mono text-blue-300">{p.sku}</td>
                      <td className="px-5 py-2.5 text-gray-200">{p.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Already exists */}
          {result.alreadyExists.length > 0 && (
            <div className="rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-800">
                <span className="text-blue-400 text-sm font-semibold">
                  ℹ {result.alreadyExists.length} prodott{result.alreadyExists.length === 1 ? 'o già presente' : 'i già presenti'} su Elliot
                </span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-800">
                    <th className="text-left px-5 py-2">SKU</th>
                    <th className="text-left px-5 py-2">Nome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {result.alreadyExists.map((p) => (
                    <tr key={p.sku} className="hover:bg-gray-800/40 transition">
                      <td className="px-5 py-2.5 font-mono text-blue-300">{p.sku}</td>
                      <td className="px-5 py-2.5 text-gray-400">{p.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* BigCommerce errors */}
          {result.bcErrors.length > 0 && (
            <ErrorTable
              title={`${result.bcErrors.length} SKU non trovat${result.bcErrors.length === 1 ? 'o' : 'i'} su BigCommerce`}
              rows={result.bcErrors}
            />
          )}

          {/* Elliot errors */}
          {result.elliotErrors.length > 0 && (
            <ErrorTable
              title={`${result.elliotErrors.length} errore${result.elliotErrors.length === 1 ? '' : 'i'} durante l'aggiunta su Elliot`}
              rows={result.elliotErrors}
            />
          )}
        </div>
      )}
    </div>
  );
}
