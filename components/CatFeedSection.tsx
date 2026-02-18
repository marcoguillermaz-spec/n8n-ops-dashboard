'use client';

import { useState } from 'react';
import CatFeedProductTable from './CatFeedProductTable';
import CatFeedWorkflowPanel from './CatFeedWorkflowPanel';
import CatFeedGuide from './CatFeedGuide';
import CatFeedSkuValidator from './CatFeedSkuValidator';
import { BRANDS, type Brand, type Provider } from '@/lib/catalogue-feed-config';

/* ── Provider options ───────────────────────────── */

const PROVIDERS = [
  { id: 'google' as Provider, label: 'Google Merchant', icon: '🔍' },
  { id: 'awin' as Provider, label: 'AWIN', icon: '🌐' },
];

export default function CatFeedSection() {
  const [brand, setBrand] = useState<Brand>('testbusters');
  const [provider, setProvider] = useState<Provider>('google');
  const [feedExpanded, setFeedExpanded] = useState(true);

  return (
    <div className="space-y-4">
      {/* ── Guide CTA (always visible) ──────────────── */}
      <div className="flex justify-end">
        <CatFeedGuide />
      </div>

      {/* ━━ ACCORDION 1 — Monitoraggio Workflow ━━━━━━ */}
      <CatFeedWorkflowPanel />

      {/* ━━ VALIDAZIONE SKU ━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <CatFeedSkuValidator />

      {/* ━━ ACCORDION 2 — Esplora Feed ━━━━━━━━━━━━━━ */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900/50">
        {/* Header */}
        <button
          onClick={() => setFeedExpanded((v) => !v)}
          className="flex w-full items-center justify-between px-6 py-4 text-left transition hover:bg-gray-800/30 rounded-2xl"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">📋</span>
            <div>
              <h3 className="text-sm font-semibold text-gray-100">
                Esplora Feed
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {BRANDS.find((b) => b.id === brand)?.label} — {provider === 'google' ? 'Google Merchant' : 'AWIN'}
              </p>
            </div>
          </div>
          <span className={`text-gray-500 transition-transform ${feedExpanded ? 'rotate-180' : ''}`}>
            ▾
          </span>
        </button>

        {/* Content */}
        {feedExpanded && (
          <div className="border-t border-gray-800 px-6 py-6 space-y-5">
            {/* Brand selector (1° filtro) */}
            <div className="flex gap-2">
              {BRANDS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setBrand(b.id)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    brand === b.id
                      ? 'bg-violet-600 text-white shadow'
                      : 'bg-gray-800 text-gray-400 hover:text-gray-200 border border-gray-700'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>

            {/* Provider selector (2° filtro) */}
            <div className="flex gap-1 rounded-xl bg-gray-900 border border-gray-800 p-1 w-fit">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProvider(p.id)}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition ${
                    provider === p.id
                      ? 'bg-gray-800 text-white shadow'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span>{p.icon}</span>
                  {p.label}
                </button>
              ))}
            </div>

            {/* Product table */}
            <CatFeedProductTable brand={brand} provider={provider} />
          </div>
        )}
      </div>
    </div>
  );
}
