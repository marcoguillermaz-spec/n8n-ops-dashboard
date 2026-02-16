'use client';

import { useState } from 'react';

type CartaType = 'cultura' | 'docente';

interface VerifyResult {
  nominativo: string;
  partitaIva: string;
  ambito: string;
  bene: string;
  importo: string;
}

export default function EcomVoucherSection() {
  /* ── Verifica state ─────────────────────────── */
  const [cartaTipo, setCartaTipo] = useState<CartaType>('cultura');
  const [verifyCode, setVerifyCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  /* ── Convalida state (existing) ─────────────── */
  const [voucherCode, setVoucherCode] = useState('');
  const [orderId, setOrderId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  /* ── Verifica handler ───────────────────────── */
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = verifyCode.trim();
    if (!code) return;

    setVerifyResult(null);
    setVerifyError(null);
    setVerifying(true);

    try {
      const res = await fetch('/api/ecom/carta-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codiceVoucher: code, tipo: cartaTipo }),
      });
      const data = await res.json();

      if (data.success) {
        setVerifyResult(data.data);
      } else {
        setVerifyError(data.message);
      }
    } catch (err: any) {
      setVerifyError(err.message ?? 'Errore di rete');
    } finally {
      setVerifying(false);
    }
  };

  /* ── Convalida handler (existing) ───────────── */
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

  const pillCls = (active: boolean) =>
    `px-4 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
      active
        ? 'bg-blue-600 text-white'
        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
    }`;

  const spinner = (
    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );

  return (
    <div className="space-y-6">
      {/* ── Verifica Buono card ──────────────────── */}
      <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-gray-100 flex items-center gap-2">
            Verifica Buono
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Verifica validità e importo di un buono senza riscattarlo (sola lettura)
          </p>
        </div>

        {/* Pill selector */}
        <div className="flex gap-2 mb-5">
          <button
            type="button"
            className={pillCls(cartaTipo === 'cultura')}
            onClick={() => setCartaTipo('cultura')}
          >
            Carta Cultura
          </button>
          <button
            type="button"
            className={pillCls(cartaTipo === 'docente')}
            onClick={() => setCartaTipo('docente')}
          >
            Carta del Docente
          </button>
        </div>

        <form onSubmit={handleVerify} className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-400 mb-1.5">Codice Buono</label>
            <input
              type="text"
              placeholder="Codice 8 caratteri"
              maxLength={8}
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.toUpperCase())}
              disabled={verifying}
              className={inputCls}
            />
          </div>
          <button
            type="submit"
            disabled={verifyCode.trim().length !== 8 || verifying}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium
                       text-white transition disabled:opacity-40 disabled:cursor-not-allowed
                       flex items-center gap-2 whitespace-nowrap"
          >
            {verifying ? <>{spinner} Verificando…</> : 'Verifica →'}
          </button>
        </form>

        {/* Verify result */}
        {verifyResult && (
          <div className="mt-5 rounded-xl bg-gray-800/60 border border-gray-700/50 p-4">
            <h3 className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wide">
              Risultato verifica
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Beneficiario:</span>{' '}
                <span className="text-gray-100 font-medium">{verifyResult.nominativo || '—'}</span>
              </div>
              <div>
                <span className="text-gray-500">Importo:</span>{' '}
                <span className="text-green-400 font-medium">
                  {verifyResult.importo ? `€ ${parseFloat(verifyResult.importo).toFixed(2)}` : '—'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Ambito:</span>{' '}
                <span className="text-gray-100">{verifyResult.ambito || '—'}</span>
              </div>
              <div>
                <span className="text-gray-500">Bene:</span>{' '}
                <span className="text-gray-100">{verifyResult.bene || '—'}</span>
              </div>
              {verifyResult.partitaIva && (
                <div className="sm:col-span-2">
                  <span className="text-gray-500">P.IVA Esercente:</span>{' '}
                  <span className="text-gray-100">{verifyResult.partitaIva}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Verify error */}
        {verifyError && (
          <div className="mt-5 rounded-xl px-4 py-3 text-sm font-medium bg-red-900/30 text-red-400 border border-red-800/40">
            {verifyError}
          </div>
        )}
      </div>

      {/* ── Convalida Buono-Ordine card (existing) ── */}
      <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-gray-100 flex items-center gap-2">
            Convalida Buono-Ordine Carta Cultura / Carta Docente
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Inserisci il codice buono e l&apos;ID ordine per convalidare il buono Carta Cultura o Carta Docente
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Codice Buono</label>
              <input
                type="text"
                placeholder="Inserisci codice buono (8 caratteri)"
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
              {submitting ? <>{spinner} Applicando…</> : 'Convalida Buono'}
            </button>
          </div>
        </form>

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
        <h3 className="text-base font-semibold text-gray-100 mb-1">Istruzioni</h3>
        <p className="text-xs text-gray-400 mb-4">Come funziona la convalida buono Carta Cultura e Carta Docente</p>

        <div className="space-y-3 text-sm text-gray-400">
          <p>
            <span className="font-medium text-gray-200">Verifica Buono:</span>{' '}
            Controlla validità, beneficiario e importo di un buono senza consumarlo (operazione di sola lettura).
            Seleziona il tipo di carta e inserisci il codice a 8 caratteri.
          </p>
          <p>
            <span className="font-medium text-gray-200">Codice Buono:</span>{' '}
            Il codice a 8 caratteri alfanumerici generato dal beneficiario su cartadeldocente.istruzione.it o cartacultura.gov.it.
          </p>
          <p>
            <span className="font-medium text-gray-200">Order ID:</span>{' '}
            L&apos;ID dell&apos;ordine BigCommerce a cui associare il buono.
          </p>
          <p>
            <span className="font-medium text-gray-200">Processo:</span>{' '}
            Il sistema convalida il buono tramite il servizio SOAP del Ministero (Sogei) e lo associa all&apos;ordine.
            Lo stesso endpoint gestisce sia Carta della Cultura Giovani che Carta del Docente.
          </p>
        </div>
      </div>
    </div>
  );
}
