'use client';

import { useState } from 'react';

export default function EcomVoucherSection() {
  const [voucherCode, setVoucherCode] = useState('');
  const [orderId, setOrderId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherCode.trim() || !orderId.trim()) return;

    setResult(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/ecom/voucher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voucherCode: voucherCode.trim(), orderId: orderId.trim() }),
      });

      const data = await res.json();

      if (data.success) {
        setResult({ ok: true, msg: data.message });
        setVoucherCode('');
        setOrderId('');
      } else {
        setResult({ ok: false, msg: data.message });
      }
    } catch (err: any) {
      setResult({ ok: false, msg: err.message ?? 'Errore di rete' });
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    'w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50';

  return (
    <div className="space-y-6">
      {/* ── Apply Voucher card ──────────────────────── */}
      <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-gray-100 flex items-center gap-2">
            🎁 Applica Voucher all&apos;Ordine
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Inserisci un codice voucher e l&apos;ID ordine per applicare il voucher
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Voucher Code</label>
              <input
                type="text"
                placeholder="Inserisci codice voucher"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                disabled={submitting}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Order ID</label>
              <input
                type="text"
                placeholder="Inserisci ID ordine"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                disabled={submitting}
                className={inputCls}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!voucherCode.trim() || !orderId.trim() || submitting}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium
                         text-white transition disabled:opacity-40 disabled:cursor-not-allowed
                         flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Applicando…
                </>
              ) : (
                '✈ Applica Voucher'
              )}
            </button>
          </div>
        </form>

        {/* Feedback */}
        {result && (
          <div
            className={`mt-5 rounded-xl px-4 py-3 text-sm font-medium ${
              result.ok
                ? 'bg-green-900/30 text-green-400 border border-green-800/40'
                : 'bg-red-900/30 text-red-400 border border-red-800/40'
            }`}
          >
            {result.ok ? '✓' : '⚠'} {result.msg}
          </div>
        )}
      </div>

      {/* ── Instructions card ──────────────────────── */}
      <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
        <h3 className="text-base font-semibold text-gray-100 mb-1">Istruzioni Voucher</h3>
        <p className="text-xs text-gray-400 mb-4">Come funziona il sistema voucher</p>

        <div className="space-y-3 text-sm text-gray-400">
          <p>
            <span className="font-medium text-gray-200">Voucher Code:</span>{' '}
            Inserisci il codice univoco del voucher da applicare all&apos;ordine.
          </p>
          <p>
            <span className="font-medium text-gray-200">Order ID:</span>{' '}
            Inserisci l&apos;ID dell&apos;ordine a cui applicare il voucher. Deve essere un identificativo ordine valido.
          </p>
          <p>
            <span className="font-medium text-gray-200">Processo:</span>{' '}
            Il sistema invierà il voucher e le informazioni dell&apos;ordine alle API esterne per l&apos;elaborazione.
          </p>
        </div>
      </div>
    </div>
  );
}
