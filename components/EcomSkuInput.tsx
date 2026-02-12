'use client';

import { useState, useRef } from 'react';
import EcomValidationGuide from './EcomValidationGuide';

interface Props {
  onValidationStart: () => void;
  onValidationEnd: (success: boolean, message: string) => void;
  isValidating: boolean;
  onResultsChanged: () => void;
}

export default function EcomSkuInput({
  onValidationStart,
  onValidationEnd,
  isValidating,
  onResultsChanged,
}: Props) {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [currentSku, setCurrentSku] = useState('');
  const [bulkSkus, setBulkSkus] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const parseBulk = (text: string) =>
    text
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);

  const bulkCount = parseBulk(bulkSkus).length;

  /* ── single ────────────────────────────────────── */
  const handleSingle = async () => {
    const sku = currentSku.trim();
    if (!sku) return;
    onValidationStart();
    try {
      const res = await fetch(`/api/ecom/validate-sku/${encodeURIComponent(sku)}`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Validation failed');
      }
      setCurrentSku('');
      onResultsChanged();
      onValidationEnd(true, `SKU ${sku} validato con successo`);
    } catch (e: any) {
      onValidationEnd(false, e.message ?? 'Errore di validazione');
    }
  };

  /* ── bulk ───────────────────────────────────────── */
  const handleBulk = async () => {
    const skus = parseBulk(bulkSkus);
    if (!skus.length) return;
    onValidationStart();
    try {
      const res = await fetch('/api/ecom/validate-skus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skus }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Bulk validation failed');
      }
      setBulkSkus('');
      onResultsChanged();
      onValidationEnd(true, `${skus.length} SKU validati con successo`);
    } catch (e: any) {
      onValidationEnd(false, e.message ?? 'Errore di validazione');
    }
  };

  /* ── file upload ────────────────────────────────── */
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setBulkSkus(ev.target?.result as string);
    reader.readAsText(file);
  };

  return (
    <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-gray-100">SKU Validation</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Inserisci gli SKU per validare le configurazioni dei sub-prodotti
          </p>
        </div>
        <EcomValidationGuide />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-800 rounded-lg p-1 w-fit mb-5">
        {(['single', 'bulk'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setMode(t)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition ${
              mode === t
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {t === 'single' ? 'Singolo SKU' : 'Import Multiplo'}
          </button>
        ))}
      </div>

      {/* Single */}
      {mode === 'single' && (
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Es: PROD-123-ABC"
            value={currentSku}
            onChange={(e) => setCurrentSku(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSingle()}
            disabled={isValidating}
            className="flex-1 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2
                       text-sm text-gray-100 placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
          />
          <button
            onClick={handleSingle}
            disabled={!currentSku.trim() || isValidating}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium
                       text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Valida
          </button>
        </div>
      )}

      {/* Bulk */}
      {mode === 'bulk' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                Incolla SKU (separati da virgola o a capo)
              </label>
              <textarea
                rows={6}
                placeholder={'PROD-123-ABC\nPROD-456-DEF\nPROD-789-GHI'}
                value={bulkSkus}
                onChange={(e) => setBulkSkus(e.target.value)}
                disabled={isValidating}
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2
                           text-sm text-gray-100 placeholder-gray-500 resize-none
                           focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                Oppure carica un file CSV
              </label>
              <div
                className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center
                           hover:border-gray-500 transition cursor-pointer"
                onClick={() => fileRef.current?.click()}
              >
                <span className="block text-2xl text-gray-500 mb-1">📄</span>
                <p className="text-xs text-gray-400">Clicca per caricare CSV/TXT</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFile}
                  className="hidden"
                  disabled={isValidating}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">{bulkCount} SKU pronti</span>
            <button
              onClick={handleBulk}
              disabled={bulkCount === 0 || isValidating}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium
                         text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ▶ Avvia Validazione Batch
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
