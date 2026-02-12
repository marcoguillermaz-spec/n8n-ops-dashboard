'use client';

import { useState } from 'react';

/* ── Guide data ──────────────────────────────────────── */

const MAIN_CHECKS = [
  { name: 'Visibilità', desc: 'Il prodotto deve essere visibile sullo Storefront (is_visible = true).' },
  {
    name: 'Purchasability',
    desc: 'Il prodotto deve essere disponibile ("available") oppure in preorder con data di rilascio configurata. Lo stato "disabled" è un errore.',
  },
  { name: 'Nome', desc: 'Il campo nome del prodotto deve essere presente e non vuoto.' },
  { name: 'SKU', desc: 'Lo SKU del prodotto deve essere presente e non vuoto.' },
  { name: 'Prezzo', desc: 'Il prezzo del prodotto principale deve essere strettamente > 0.' },
  { name: 'Tipologia', desc: 'Il tipo di prodotto ("physical" o "digital") deve essere definito.' },
  { name: 'Brand', desc: 'Il prodotto deve avere un brand assegnato (brand_id > 0).' },
  { name: 'Channel', desc: 'Il prodotto deve essere assegnato ad almeno un canale di vendita.' },
  { name: 'Categoria', desc: 'Il prodotto deve appartenere ad almeno una categoria del catalogo.' },
  { name: 'Descrizione', desc: 'Il prodotto deve avere una descrizione testuale non vuota.' },
  { name: 'Immagine', desc: 'Il prodotto deve avere almeno un\'immagine associata.' },
];

const SUB_CHECKS = [
  { name: 'Visibilità', desc: 'Il sub-prodotto deve essere visibile sullo Storefront.' },
  {
    name: 'Purchasability',
    desc: 'Il sub-prodotto deve essere disponibile o in preorder valido (con data di rilascio).',
  },
  { name: 'Nome', desc: 'Il nome del sub-prodotto deve essere presente.' },
  { name: 'SKU', desc: 'Lo SKU del sub-prodotto deve essere presente.' },
  { name: 'Prezzo', desc: 'Il prezzo del sub-prodotto può essere ≥ 0 (zero è ammesso).' },
  { name: 'Tipologia', desc: 'Il tipo di prodotto deve essere definito.' },
  { name: 'Brand', desc: 'Il sub-prodotto deve avere un brand assegnato.' },
  { name: 'Channel', desc: 'Il sub-prodotto deve essere assegnato ad almeno un canale di vendita.' },
];

/* ── Component ───────────────────────────────────────── */

export default function EcomValidationGuide() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* CTA Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition"
      >
        <span className="text-sm">📋</span>
        Guida Controlli
      </button>

      {/* Dialog */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <div>
                <h3 className="text-base font-semibold text-gray-100">
                  📋 Guida Controlli Validazione
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Elenco dei controlli eseguiti sul bundle e sui prodotti associati
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-gray-300 text-xl transition"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Main product section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-900/40 text-blue-400 text-sm font-bold">
                    B
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-100">
                      Prodotto Principale (Bundle)
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      {MAIN_CHECKS.length} controlli — Lo SKU inserito dall&apos;utente
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {MAIN_CHECKS.map((check, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg bg-gray-800/40 px-4 py-3 border border-gray-800/60"
                    >
                      <span className="flex items-center justify-center w-5 h-5 rounded bg-blue-900/30 text-blue-400 text-[10px] font-bold flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <div>
                        <div className="text-sm font-medium text-gray-200">{check.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{check.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sub-products section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-purple-900/40 text-purple-400 text-sm font-bold">
                    S
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-100">
                      Sub-Prodotti (Associati)
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      {SUB_CHECKS.length} controlli — Prodotti collegati tramite modifiers
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {SUB_CHECKS.map((check, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg bg-gray-800/40 px-4 py-3 border border-gray-800/60"
                    >
                      <span className="flex items-center justify-center w-5 h-5 rounded bg-purple-900/30 text-purple-400 text-[10px] font-bold flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <div>
                        <div className="text-sm font-medium text-gray-200">{check.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{check.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="rounded-xl bg-gray-800/30 border border-gray-700/50 p-4">
                <h4 className="text-xs font-semibold text-gray-300 mb-2">Note</h4>
                <ul className="text-xs text-gray-400 space-y-1.5">
                  <li>
                    <span className="text-green-400 mr-1.5">✓</span>
                    Lo stato <strong className="text-gray-300">Preorder</strong> è valido solo se è presente una data di rilascio (preorder_release_date).
                  </li>
                  <li>
                    <span className="text-green-400 mr-1.5">✓</span>
                    Il prezzo del <strong className="text-gray-300">bundle</strong> deve essere &gt; 0, mentre per i <strong className="text-gray-300">sub-prodotti</strong> è ammesso il valore 0.
                  </li>
                  <li>
                    <span className="text-green-400 mr-1.5">✓</span>
                    I controlli su <strong className="text-gray-300">Categoria</strong>, <strong className="text-gray-300">Descrizione</strong> e <strong className="text-gray-300">Immagine</strong> si applicano solo al prodotto principale.
                  </li>
                  <li>
                    <span className="text-green-400 mr-1.5">✓</span>
                    Il check <strong className="text-gray-300">Channel</strong> verifica che il prodotto sia assegnato a uno o più canali di vendita BigCommerce.
                  </li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end px-6 py-4 border-t border-gray-800">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white transition"
              >
                Ho capito
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
