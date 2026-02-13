'use client';

import { useState } from 'react';

interface Props {
  onCodesGenerated: (codes: string[]) => void;
}

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function generateCode(prefix: string, length: number): string {
  let random = '';
  for (let i = 0; i < length; i++) {
    random += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return prefix ? `${prefix}-${random}` : random;
}

export default function EcomCouponCodeGen({ onCodesGenerated }: Props) {
  const [prefix, setPrefix] = useState('');
  const [length, setLength] = useState(8);
  const [quantity, setQuantity] = useState(10);
  const [codes, setCodes] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);

  const handleGenerate = () => {
    const set = new Set<string>();
    let attempts = 0;
    while (set.size < quantity && attempts < quantity * 3) {
      set.add(generateCode(prefix.trim().toUpperCase(), length));
      attempts++;
    }
    setCodes(Array.from(set));
    setShowAll(false);
  };

  const handleDownloadCsv = () => {
    if (!codes.length) return;
    const blob = new Blob([codes.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coupon-codes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUseForInsert = () => {
    onCodesGenerated(codes);
  };

  const displayCodes = showAll ? codes : codes.slice(0, 20);

  return (
    <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
      <h3 className="text-base font-semibold text-gray-100 mb-1">Genera Codici</h3>
      <p className="text-xs text-gray-400 mb-5">
        Genera codici coupon casuali lato client
      </p>

      {/* Form */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">
            Prefisso <span className="text-gray-600">(opzionale, max 20)</span>
          </label>
          <input
            type="text"
            maxLength={20}
            placeholder="Es: PROMO"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2
                       text-sm text-gray-100 placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">
            Lunghezza parte random (4-30)
          </label>
          <input
            type="number"
            min={4}
            max={30}
            value={length}
            onChange={(e) => setLength(Math.max(4, Math.min(30, Number(e.target.value) || 4)))}
            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2
                       text-sm text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">
            Quantità (1-10.000)
          </label>
          <input
            type="number"
            min={1}
            max={10000}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Math.min(10000, Number(e.target.value) || 1)))}
            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2
                       text-sm text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      <button
        onClick={handleGenerate}
        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium
                   text-white transition"
      >
        Genera {quantity.toLocaleString()} codici
      </button>

      {/* Preview */}
      {codes.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-400">
              {codes.length.toLocaleString()} codici generati
              {!showAll && codes.length > 20 && ` (anteprima primi 20)`}
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadCsv}
                className="px-3 py-1.5 rounded-lg border border-gray-700 text-xs text-gray-300
                           hover:bg-gray-800 transition"
              >
                ⬇ Scarica CSV
              </button>
              <button
                onClick={handleUseForInsert}
                className="px-3 py-1.5 rounded-lg bg-green-700 hover:bg-green-600 text-xs
                           text-white font-medium transition"
              >
                ▶ Usa per Inserimento
              </button>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto rounded-lg bg-gray-800 border border-gray-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-2">#</th>
                  <th className="px-4 py-2">Codice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {displayCodes.map((c, i) => (
                  <tr key={i} className="hover:bg-gray-700/30">
                    <td className="px-4 py-1.5 text-gray-500 text-xs">{i + 1}</td>
                    <td className="px-4 py-1.5 text-gray-100 font-mono text-xs">{c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {codes.length > 20 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition"
            >
              {showAll ? 'Mostra solo primi 20' : `Mostra tutti (${codes.length.toLocaleString()})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
