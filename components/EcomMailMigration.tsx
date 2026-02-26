'use client';

import { useState } from 'react';

/* ── Types ───────────────────────────────────────────────────── */

interface IdentityOrder {
  id: string;
  status?: string;
  skus?: string[];
}

interface CheckResult {
  oldUserOrders: IdentityOrder[];
  newUserOrders: IdentityOrder[];
  ordersToMigrate: IdentityOrder[];   // oggetti completi da migrare
  ordersNotFoundOnOld: string[];      // ID non trovati sul vecchio utente
  ordersAlreadyOnNew: string[];       // ID già presenti sul nuovo utente
}

type Phase = 'input' | 'checking' | 'preview' | 'migrating' | 'done';

/* ── Sub-components ──────────────────────────────────────────── */

function Badge({ variant, children }: { variant: 'green' | 'yellow' | 'red'; children: React.ReactNode }) {
  const colors = {
    green: 'bg-green-900/30 text-green-400 border border-green-800/40',
    yellow: 'bg-yellow-900/30 text-yellow-400 border border-yellow-800/40',
    red: 'bg-red-900/30 text-red-400 border border-red-800/40',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[variant]}`}>
      {children}
    </span>
  );
}

function OrderTag({ id, status }: { id: string; status?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-gray-800 border border-gray-700 text-xs font-mono text-gray-300">
      {id}
      {status && (
        <span className="text-gray-500 font-sans font-normal truncate max-w-[120px]">{status}</span>
      )}
    </span>
  );
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

/* ── Main component ──────────────────────────────────────────── */

export default function EcomMailMigration() {
  const [oldEmail, setOldEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [ordersInput, setOrdersInput] = useState('');

  const [phase, setPhase] = useState<Phase>('input');
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const parsedOrders = ordersInput
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const canSubmit =
    oldEmail.trim() !== '' &&
    newEmail.trim() !== '' &&
    parsedOrders.length > 0 &&
    phase === 'input';

  /* ── Check ──────────────────────────────────────────────────── */
  const handleCheck = async () => {
    setError(null);
    setPhase('checking');

    try {
      const res = await fetch('/api/ecom/mail-migration/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldEmail: oldEmail.trim(), newEmail: newEmail.trim(), orders: parsedOrders }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? 'Errore durante la verifica');
        setPhase('input');
        return;
      }

      setCheckResult(data);
      setPhase('preview');
    } catch {
      setError('Errore di rete durante la verifica');
      setPhase('input');
    }
  };

  /* ── Migrate ─────────────────────────────────────────────────── */
  const handleMigrate = async () => {
    if (!checkResult) return;
    setError(null);
    setPhase('migrating');

    try {
      const res = await fetch('/api/ecom/mail-migration/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldEmail: oldEmail.trim(),
          newEmail: newEmail.trim(),
          ordersToMigrate: checkResult.ordersToMigrate,
          oldUserCurrentOrders: checkResult.oldUserOrders,
          newUserCurrentOrders: checkResult.newUserOrders,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? 'Errore durante la migrazione');
        setPhase('preview');
        return;
      }

      setSuccessMsg(data.message ?? 'Migrazione completata');
      setPhase('done');
    } catch {
      setError('Errore di rete durante la migrazione');
      setPhase('preview');
    }
  };

  /* ── Reset ───────────────────────────────────────────────────── */
  const handleReset = () => {
    setOldEmail('');
    setNewEmail('');
    setOrdersInput('');
    setCheckResult(null);
    setError(null);
    setSuccessMsg(null);
    setPhase('input');
  };

  const isLoading = phase === 'checking' || phase === 'migrating';

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-gray-100">Cambio mail</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Sposta gli ordini da un account a un altro tramite le API identities
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-xl px-4 py-3 text-sm font-medium bg-red-900/30 text-red-400 border border-red-800/40">
          ⚠ {error}
        </div>
      )}

      {/* ── DONE phase ─────────────────────────────────────────── */}
      {phase === 'done' && (
        <div className="space-y-4">
          <div className="rounded-xl px-4 py-4 text-sm font-medium bg-green-900/30 text-green-400 border border-green-800/40">
            ✓ {successMsg}
          </div>
          <div className="text-xs text-gray-400 space-y-1">
            <p>
              Ordini migrati da{' '}
              <span className="text-gray-200 font-mono">{oldEmail}</span> a{' '}
              <span className="text-gray-200 font-mono">{newEmail}</span>:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {checkResult?.ordersToMigrate.map((o) => (
                <OrderTag key={o.id} id={o.id} status={o.status} />
              ))}
            </div>
          </div>
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-medium text-white transition"
          >
            Nuova migrazione
          </button>
        </div>
      )}

      {/* ── INPUT phase ────────────────────────────────────────── */}
      {(phase === 'input' || phase === 'checking') && (
        <div className="space-y-4">
          {/* Email fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-400">Vecchia mail</label>
              <input
                type="email"
                placeholder="vecchia@email.com"
                value={oldEmail}
                onChange={(e) => setOldEmail(e.target.value)}
                disabled={isLoading}
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2
                           text-sm text-gray-100 placeholder-gray-500
                           focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-400">Nuova mail</label>
              <input
                type="email"
                placeholder="nuova@email.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                disabled={isLoading}
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2
                           text-sm text-gray-100 placeholder-gray-500
                           focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Orders field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-400">
              Ordini{' '}
              <span className="text-gray-500 font-normal">(uno per riga o separati da virgola)</span>
            </label>
            <textarea
              rows={5}
              placeholder={'34385\n34386\n34387'}
              value={ordersInput}
              onChange={(e) => setOrdersInput(e.target.value)}
              disabled={isLoading}
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2
                         text-sm text-gray-100 placeholder-gray-500 font-mono resize-none
                         focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
            />
            {parsedOrders.length > 0 && (
              <p className="text-xs text-gray-500">{parsedOrders.length} ordine/i inserito/i</p>
            )}
          </div>

          {/* Submit button */}
          <div className="flex justify-end">
            <button
              onClick={handleCheck}
              disabled={!canSubmit || isLoading}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500
                         text-sm font-medium text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {phase === 'checking' ? (
                <>
                  <Spinner />
                  Verifica in corso…
                </>
              ) : (
                'Verifica e continua →'
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── PREVIEW phase ──────────────────────────────────────── */}
      {(phase === 'preview' || phase === 'migrating') && checkResult && (
        <div className="space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-gray-800 border border-gray-700 p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Utente sorgente</p>
              <p className="text-sm font-mono text-gray-100 truncate">{oldEmail}</p>
              <p className="text-xs text-gray-500">{checkResult.oldUserOrders.length} ordini totali</p>
            </div>
            <div className="rounded-xl bg-gray-800 border border-gray-700 p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Utente destinazione</p>
              <p className="text-sm font-mono text-gray-100 truncate">{newEmail}</p>
              <p className="text-xs text-gray-500">{checkResult.newUserOrders.length} ordini totali</p>
            </div>
          </div>

          {/* Migration plan */}
          <div className="rounded-xl bg-gray-800 border border-gray-700 divide-y divide-gray-700">
            {/* Orders to migrate */}
            <div className="p-4 space-y-2">
              <Badge variant="green">
                ✓ {checkResult.ordersToMigrate.length} da migrare
              </Badge>
              {checkResult.ordersToMigrate.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {checkResult.ordersToMigrate.map((o) => (
                    <OrderTag key={o.id} id={o.id} status={o.status} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">Nessun ordine da migrare</p>
              )}
            </div>

            {/* Orders not found on old user */}
            {checkResult.ordersNotFoundOnOld.length > 0 && (
              <div className="p-4 space-y-2">
                <Badge variant="yellow">
                  ⚠ {checkResult.ordersNotFoundOnOld.length} non trovati sul vecchio utente
                </Badge>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {checkResult.ordersNotFoundOnOld.map((id) => (
                    <OrderTag key={id} id={id} />
                  ))}
                </div>
              </div>
            )}

            {/* Orders already on new user */}
            {checkResult.ordersAlreadyOnNew.length > 0 && (
              <div className="p-4 space-y-2">
                <Badge variant="red">
                  ✕ {checkResult.ordersAlreadyOnNew.length} già presenti sul nuovo utente
                </Badge>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {checkResult.ordersAlreadyOnNew.map((id) => (
                    <OrderTag key={id} id={id} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Warn if nothing to migrate */}
          {checkResult.ordersToMigrate.length === 0 && (
            <div className="rounded-xl px-4 py-3 text-sm bg-yellow-900/20 text-yellow-400 border border-yellow-800/30">
              ⚠ Nessun ordine da migrare. Controlla i dati inseriti.
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleReset}
              disabled={phase === 'migrating'}
              className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-medium
                         text-gray-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Modifica
            </button>

            <button
              onClick={handleMigrate}
              disabled={checkResult.ordersToMigrate.length === 0 || phase === 'migrating'}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-green-600 hover:bg-green-500
                         text-sm font-medium text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {phase === 'migrating' ? (
                <>
                  <Spinner />
                  Migrazione in corso…
                </>
              ) : (
                `Conferma e migra ${checkResult.ordersToMigrate.length} ordine/i`
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
