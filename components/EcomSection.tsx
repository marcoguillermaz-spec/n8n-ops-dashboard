'use client';

import { useState } from 'react';
import EcomSkuInput from './EcomSkuInput';
import EcomValidationResults from './EcomValidationResults';
import EcomDetailModal from './EcomDetailModal';
import EcomVoucherSection from './EcomVoucherSection';
import EcomCouponSection from './EcomCouponSection';
import EcomBundleLookup from './EcomBundleLookup';
import EcomCacheFlushSection from './EcomCacheFlushSection';
import type { ValidationResult } from '@/lib/ecom-storage';

/* ── Sub-tabs ─────────────────────────────────────── */

const SUB_TABS = [
  { id: 'coupon', label: 'Creazione massiva codici Coupon', icon: '🎟️' },
  { id: 'voucher', label: 'Convalida Buono-Ordine CC e CD', icon: '🏛️' },
  { id: 'validation', label: 'Validazione configurazione Bundle', icon: '🔍' },
  { id: 'bundle-lookup', label: 'Ricerca inversa SKU-bundle', icon: '📦' },
  { id: 'cache-flush', label: 'Cache flush pagina e SKU prodotto', icon: '🔄' },
] as const;

type SubTab = (typeof SUB_TABS)[number]['id'];

/** Overlay spinner (same pattern as LWSection) */
function OverlaySpinner() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-950/60 backdrop-blur-sm rounded-2xl">
      <svg className="h-10 w-10 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
}

export default function EcomSection() {
  const [subTab, setSubTab] = useState<SubTab>('coupon');

  // ── SKU Validation state ─────────────────────────
  const [isValidating, setIsValidating] = useState(false);
  const [selectedResult, setSelectedResult] = useState<ValidationResult | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleValidationEnd = (ok: boolean, msg: string) => {
    setIsValidating(false);
    setFeedback({ ok, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleRetry = async (sku: string) => {
    setSelectedResult(null);
    setIsValidating(true);
    try {
      const res = await fetch(`/api/ecom/validate-sku/${encodeURIComponent(sku)}`, { method: 'POST' });
      if (!res.ok) throw new Error('Retry failed');
      setRefreshKey((k) => k + 1);
      handleValidationEnd(true, `SKU ${sku} ri-validato`);
    } catch (e: any) {
      handleValidationEnd(false, e.message ?? 'Errore');
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Sub-tab navigation ────────────────────── */}
      <div className="flex gap-1 rounded-xl bg-gray-900 border border-gray-800 p-1 w-fit">
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition ${
              subTab === t.id
                ? 'bg-gray-800 text-white shadow'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ━━ SKU VALIDATION ━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {subTab === 'validation' && (
        <div className="relative space-y-6">
          {isValidating && <OverlaySpinner />}

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

          <EcomSkuInput
            onValidationStart={() => setIsValidating(true)}
            onValidationEnd={handleValidationEnd}
            isValidating={isValidating}
            onResultsChanged={() => setRefreshKey((k) => k + 1)}
          />

          <EcomValidationResults
            onViewDetails={setSelectedResult}
            refreshKey={refreshKey}
          />

          {selectedResult && (
            <EcomDetailModal
              result={selectedResult}
              onClose={() => setSelectedResult(null)}
              onRetry={handleRetry}
            />
          )}
        </div>
      )}

      {/* ━━ VOUCHER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {subTab === 'voucher' && <EcomVoucherSection />}

      {/* ━━ COUPON ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {subTab === 'coupon' && <EcomCouponSection />}

      {/* ━━ BUNDLE LOOKUP ━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {subTab === 'bundle-lookup' && <EcomBundleLookup />}

      {/* ━━ CACHE FLUSH ━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {subTab === 'cache-flush' && <EcomCacheFlushSection />}
    </div>
  );
}
