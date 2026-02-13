'use client';

import { useState, useRef, useEffect } from 'react';

interface Props {
  promotionId: number;
  initialCodes: string[];
  onInsertComplete: () => void;
  onFeedback: (ok: boolean, msg: string) => void;
}

interface InsertError {
  code: string;
  message: string;
}

export default function EcomCouponUpload({
  promotionId,
  initialCodes,
  onInsertComplete,
  onFeedback,
}: Props) {
  const [text, setText] = useState('');
  const [maxUses, setMaxUses] = useState(1);
  const [maxUsesPerCustomer, setMaxUsesPerCustomer] = useState(1);
  const [dryRun, setDryRun] = useState(false);
  const [inserting, setInserting] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0, errors: 0 });
  const [currentCode, setCurrentCode] = useState('');
  const [errors, setErrors] = useState<InsertError[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);

  useEffect(() => {
    if (initialCodes.length > 0) {
      setText(initialCodes.join('\n'));
    }
  }, [initialCodes]);

  const parseCodes = (raw: string) =>
    raw
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);

  const codes = parseCodes(text);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setText(ev.target?.result as string);
    reader.readAsText(file);
  };

  const handleConfirmInsert = async () => {
    if (!codes.length) return;
    setInserting(true);
    setProgress({ completed: 0, total: codes.length, errors: 0 });
    setErrors([]);
    setShowErrors(false);
    abortRef.current = false;

    let errorCount = 0;
    const insertErrors: InsertError[] = [];

    for (let i = 0; i < codes.length; i++) {
      if (abortRef.current) break;

      const code = codes[i];
      setCurrentCode(code);

      try {
        const res = await fetch('/api/ecom/coupon/codes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            promotionId,
            code,
            max_uses: maxUses,
            max_uses_per_customer: maxUsesPerCustomer,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: 'Errore sconosciuto' }));
          errorCount++;
          insertErrors.push({ code, message: err.message ?? 'Errore' });
        }
      } catch {
        errorCount++;
        insertErrors.push({ code, message: 'Errore di rete' });
      }

      setProgress({ completed: i + 1, total: codes.length, errors: errorCount });

      // rate limiting delay
      if (i < codes.length - 1) {
        await new Promise((r) => setTimeout(r, 50));
      }
    }

    setErrors(insertErrors);
    setCurrentCode('');
    setInserting(false);
    setDryRun(false);

    const successCount = codes.length - errorCount;
    onFeedback(
      errorCount === 0,
      errorCount === 0
        ? `${successCount} codici inseriti con successo`
        : `${successCount} inseriti, ${errorCount} errori`,
    );
    onInsertComplete();
  };

  const progressPct = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

  return (
    <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
      <h3 className="text-base font-semibold text-gray-100 mb-1">Carica e Inserisci Codici</h3>
      <p className="text-xs text-gray-400 mb-5">
        Inserisci i codici coupon nella promozione BigCommerce
      </p>

      {!inserting && (
        <>
          {/* Input area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                Codici (1 per riga o separati da virgola)
              </label>
              <textarea
                rows={6}
                placeholder={'PROMO-ABC123\nPROMO-DEF456\nPROMO-GHI789'}
                value={text}
                onChange={(e) => { setText(e.target.value); setDryRun(false); }}
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2
                           text-sm text-gray-100 placeholder-gray-500 resize-none font-mono
                           focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                Oppure carica un file TXT/CSV
              </label>
              <div
                className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center
                           hover:border-gray-500 transition cursor-pointer"
                onClick={() => fileRef.current?.click()}
              >
                <span className="block text-2xl text-gray-500 mb-1">📄</span>
                <p className="text-xs text-gray-400">Clicca per caricare TXT/CSV</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFile}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Config */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Max utilizzi totali</label>
              <input
                type="number"
                min={0}
                value={maxUses}
                onChange={(e) => setMaxUses(Math.max(0, Number(e.target.value) || 0))}
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2
                           text-sm text-gray-100
                           focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <span className="text-[11px] text-gray-500">0 = illimitato</span>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Max per cliente</label>
              <input
                type="number"
                min={0}
                value={maxUsesPerCustomer}
                onChange={(e) => setMaxUsesPerCustomer(Math.max(0, Number(e.target.value) || 0))}
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2
                           text-sm text-gray-100
                           focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <span className="text-[11px] text-gray-500">0 = illimitato</span>
            </div>
          </div>

          {/* Dry-run preview / confirm */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{codes.length} codici pronti</span>
            {!dryRun ? (
              <button
                onClick={() => setDryRun(true)}
                disabled={codes.length === 0}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium
                           text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Anteprima
              </button>
            ) : (
              <div className="flex gap-2 items-center">
                <span className="text-xs text-yellow-400">
                  Inserire {codes.length} codici con max_uses={maxUses}, max_per_customer={maxUsesPerCustomer}?
                </span>
                <button
                  onClick={() => setDryRun(false)}
                  className="px-3 py-1.5 rounded-lg border border-gray-700 text-xs text-gray-300
                             hover:bg-gray-800 transition"
                >
                  Annulla
                </button>
                <button
                  onClick={handleConfirmInsert}
                  className="px-4 py-2 rounded-lg bg-green-700 hover:bg-green-600 text-sm font-medium
                             text-white transition"
                >
                  Conferma e Inserisci
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Progress */}
      {inserting && (
        <div className="space-y-3">
          <div className="flex justify-between text-xs text-gray-400">
            <span>
              {progress.completed} / {progress.total} completati
              {progress.errors > 0 && (
                <span className="text-red-400 ml-2">{progress.errors} errori</span>
              )}
            </span>
            <button
              onClick={() => { abortRef.current = true; }}
              className="text-red-400 hover:text-red-300 transition"
            >
              Interrompi
            </button>
          </div>
          <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-200"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {currentCode && (
            <p className="text-xs text-gray-500 font-mono truncate">
              Inserendo: {currentCode}
            </p>
          )}
        </div>
      )}

      {/* Error summary */}
      {!inserting && errors.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowErrors(!showErrors)}
            className="text-xs text-red-400 hover:text-red-300 transition"
          >
            {showErrors ? '▾' : '▸'} {errors.length} errori durante l&apos;inserimento
          </button>
          {showErrors && (
            <div className="mt-2 max-h-40 overflow-y-auto rounded-lg bg-gray-800 border border-red-900/40 p-3">
              {errors.map((e, i) => (
                <div key={i} className="text-xs text-red-300 mb-1">
                  <span className="font-mono text-red-400">{e.code}</span>
                  <span className="text-gray-500 mx-1">→</span>
                  {e.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
