'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import EcomCouponCodeGen from './EcomCouponCodeGen';
import EcomCouponUpload from './EcomCouponUpload';
import EcomCouponList from './EcomCouponList';

interface PromotionInfo {
  id: number;
  name: string;
  redemption_type: string;
  status: string;
}

export default function EcomCouponSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PromotionInfo[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [promotion, setPromotion] = useState<PromotionInfo | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  const [codes, setCodes] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [refreshListKey, setRefreshListKey] = useState(0);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  /* ── Search promotions by name ─────────────────────── */
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    setSearchLoading(true);
    setPromoError(null);
    try {
      const res = await fetch(`/api/ecom/coupon/promotions?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (json.success) {
        setSearchResults(json.data ?? []);
        setShowDropdown(true);
      } else {
        setPromoError(json.message ?? 'Errore nella ricerca');
      }
    } catch {
      setPromoError('Errore di rete');
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleInputChange = (val: string) => {
    setSearchQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 350);
  };

  const handleSelectPromotion = (p: PromotionInfo) => {
    setPromotion(p);
    setSearchQuery(p.name);
    setShowDropdown(false);
    setPromoError(null);
  };

  /* ── Close dropdown on outside click ───────────────── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleFeedback = (ok: boolean, msg: string) => {
    setFeedback({ ok, msg });
    setTimeout(() => setFeedback(null), 5000);
  };

  const isCouponType = promotion
    ? promotion.redemption_type.toLowerCase() === 'coupon'
    : true;

  return (
    <div className="space-y-6">
      {/* Feedback banner */}
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

      {/* Promotion Selector */}
      <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
        <h3 className="text-base font-semibold text-gray-100 mb-1">Seleziona Promozione</h3>
        <p className="text-xs text-gray-400 mb-2">
          Cerca per nome la promozione BigCommerce per gestirne i codici coupon
        </p>
        <p className="text-xs text-yellow-500/80 mb-4">
          La promozione deve essere già stata creata su BigCommerce prima di poter inserire i codici coupon.
        </p>

        <div className="relative" ref={dropdownRef}>
          <div className="flex gap-3 items-end">
            <div className="flex-1 max-w-md">
              <label className="block text-xs text-gray-400 mb-1.5">Nome Promozione</label>
              <input
                type="text"
                placeholder="Cerca promozione..."
                value={searchQuery}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2
                           text-sm text-gray-100 placeholder-gray-500
                           focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            {searchLoading && (
              <svg className="h-5 w-5 animate-spin text-blue-500 mb-2.5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
          </div>

          {/* Dropdown results */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute z-20 mt-1 w-full max-w-md rounded-lg bg-gray-800 border border-gray-700
                            shadow-lg max-h-64 overflow-y-auto">
              {searchResults.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPromotion(p)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-700/60 transition
                             border-b border-gray-700/50 last:border-0"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-gray-100">{p.name}</span>
                      <span className="text-xs text-gray-500 ml-2">ID: {p.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-500 uppercase">{p.redemption_type}</span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          p.status.toLowerCase() === 'enabled'
                            ? 'bg-green-900/40 text-green-400'
                            : 'bg-gray-700 text-gray-400'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {showDropdown && searchResults.length === 0 && searchQuery.trim() && !searchLoading && (
            <div className="absolute z-20 mt-1 w-full max-w-md rounded-lg bg-gray-800 border border-gray-700
                            shadow-lg px-4 py-3">
              <p className="text-sm text-gray-400">Nessuna promozione trovata</p>
            </div>
          )}
        </div>

        {/* Error */}
        {promoError && (
          <div className="mt-3 rounded-lg bg-red-900/20 border border-red-800/40 px-4 py-2.5 text-sm text-red-400">
            {promoError}
          </div>
        )}

        {/* Warning (not coupon type) */}
        {promotion && !isCouponType && (
          <div className="mt-3 rounded-lg bg-yellow-900/20 border border-yellow-800/40 px-4 py-2.5 text-sm text-yellow-400">
            Attenzione: questa promozione è di tipo &quot;{promotion.redemption_type}&quot;, non &quot;coupon&quot;
          </div>
        )}

        {/* Promotion info card */}
        {promotion && (
          <div className="mt-4 rounded-lg bg-gray-800/60 border border-gray-700 px-5 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="block text-xs text-gray-500 mb-1">Nome</span>
                <p className="text-sm font-medium text-gray-100">{promotion.name}</p>
              </div>
              <div>
                <span className="block text-xs text-gray-500 mb-1">Tipo</span>
                <p className="text-sm text-gray-300">{promotion.redemption_type}</p>
              </div>
              <div>
                <span className="block text-xs text-gray-500 mb-1">Stato</span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    promotion.status.toLowerCase() === 'enabled'
                      ? 'bg-green-900/40 text-green-400'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {promotion.status}
                </span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 mb-1">ID</span>
                <p className="text-sm text-gray-400 font-mono">{promotion.id}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Children — only when promotion is loaded */}
      {promotion && (
        <>
          <EcomCouponCodeGen onCodesGenerated={setCodes} />

          <EcomCouponUpload
            promotionId={promotion.id}
            initialCodes={codes}
            onInsertComplete={() => setRefreshListKey((k) => k + 1)}
            onFeedback={handleFeedback}
          />

          <EcomCouponList
            promotionId={promotion.id}
            refreshKey={refreshListKey}
          />
        </>
      )}
    </div>
  );
}
