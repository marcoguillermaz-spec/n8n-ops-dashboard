'use client';

import { useState } from 'react';

export default function CatFeedGuide() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* CTA Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition"
      >
        <span className="text-sm">📋</span>
        Guida Gestione Feed
      </button>

      {/* Dialog */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <div>
                <h3 className="text-base font-semibold text-gray-100">
                  📋 Guida Gestione Feed Catalogo
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Come abilitare, disabilitare e gestire i prodotti nei feed Google Merchant e AWIN
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

              {/* ── 1. Introduzione ── */}
              <Section icon="📡" title="Introduzione">
                <p>
                  Il flusso di alimentazione dei feed di catalogo per tutti i brand verso Google Merchant e AWIN
                  è stato totalmente automatizzato ingegnerizzando ogni scenario possibile e limitando
                  l&apos;operatività alla scelta di quale prodotto &quot;eleggere&quot; come attivo nei diversi feed.
                </p>
                <NoteBox>
                  I prodotti presenti nei feed devono rappresentare esattamente il catalogo in vendita diretta e
                  pubblicato su ogni eCommerce di Brand perché il cliente deve sempre &quot;atterrare&quot; su una pagina
                  prodotto del sito esistente. Quindi, se il prodotto NON possiede una scheda NON può essere abilitato.
                </NoteBox>
              </Section>

              {/* ── 2. Logica abilitazione ── */}
              <Section icon="⚙️" title="Logica di abilitazione e disabilitazione">
                <p className="font-medium text-gray-200 mb-2">Un prodotto viene pubblicato/aggiornato nei feed solo se:</p>
                <CheckList items={[
                  'è visibile (is_visible: true, flag "Visible on Storefront" attivo)',
                  'price di listino e, se previsto, sale_price (oppure cost_price per i corsi P4M COR)',
                  'possiede almeno una categoria associata',
                  "possiede un'immagine di copertina",
                  'ha una descrizione compilata',
                  'possiede i custom field obbligatori: title, feed_enabled = true, e tutti gli altri campi necessari specifici per tipologia (Libro o Corso)',
                ]} />

                <p className="font-medium text-gray-200 mt-4 mb-2">Un prodotto viene rimosso dal feed se:</p>
                <ul className="space-y-1.5 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">✕</span>
                    Viene cancellato da BigCommerce (delete)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">✕</span>
                    Viene nascosto (is_visible: false) o feed_enabled viene tolto/messo a false
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">✕</span>
                    Non ha alcuna categoria → automaticamente marcato come non abilitato
                  </li>
                </ul>

                <NoteBox>
                  Se il custom field <code className="text-gray-300">feed_enabled</code> è assente sul prodotto,
                  è considerato non abilitato (equivale a false).
                </NoteBox>

                <NoteBox variant="warning">
                  La cancellazione del prodotto prevede una rimozione consapevole e non reversibile.
                  Questa azione, insieme alla disabilitazione di Visible on Storefront, deve essere effettuata
                  solo se il prodotto non risulta associato come parte di un bundle di un altro prodotto.
                </NoteBox>
              </Section>

              {/* ── 3. Come abilitare ── */}
              <Section icon="✅" title="Come abilitare un prodotto ai feed">
                <ol className="space-y-3 text-sm text-gray-400">
                  <Step n={1}>Vai su BigCommerce → Products e apri il prodotto principale.</Step>
                  <Step n={2}>
                    Vai in Custom Fields e aggiungi:
                    <div className="mt-1.5 ml-2 space-y-1">
                      <div className="text-gray-300">Name: <code>feed_enabled</code></div>
                      <div className="text-gray-300">Value: <code>true</code></div>
                    </div>
                  </Step>
                  <Step n={3}>Salva il prodotto.</Step>
                  <Step n={4}>
                    Requisiti aggiuntivi obbligatori:
                    <ul className="mt-1.5 ml-2 space-y-1 list-disc list-inside text-gray-400">
                      <li>Categorie: almeno una categoria attiva e corretta</li>
                      <li>Immagine di copertina impostata</li>
                      <li>Descrizione presente</li>
                      <li>Flag &quot;Visible on Storefront&quot; attivo</li>
                      <li>Custom field <code className="text-gray-300">title</code> e prezzi corretti</li>
                    </ul>
                  </Step>
                </ol>
                <ResultBox ok>
                  L&apos;automazione riceve l&apos;update e, se il prodotto è visibile, lo aggiunge/aggiorna nei feed
                  (Google Merchant e AWIN) del brand corretto.
                </ResultBox>
              </Section>

              {/* ── 4. Come disabilitare ── */}
              <Section icon="🚫" title="Come disabilitare un prodotto dai feed">
                <p className="text-sm text-gray-400 mb-4">
                  Due modalità (equivalenti ai fini dell&apos;automazione):
                </p>

                <div className="space-y-4">
                  <div className="rounded-lg bg-gray-800/40 border border-gray-800/60 p-4">
                    <h5 className="text-sm font-medium text-gray-200 mb-2">Opzione A — Rimuovere il custom field</h5>
                    <ol className="space-y-1.5 text-sm text-gray-400">
                      <Step n={1}>Apri il prodotto → Custom Fields.</Step>
                      <Step n={2}>Elimina il campo <code className="text-gray-300">feed_enabled</code>.</Step>
                      <Step n={3}>Salva.</Step>
                    </ol>
                  </div>

                  <div className="rounded-lg bg-gray-800/40 border border-gray-800/60 p-4">
                    <h5 className="text-sm font-medium text-gray-200 mb-2">Opzione B — Impostare a false</h5>
                    <ol className="space-y-1.5 text-sm text-gray-400">
                      <Step n={1}>Apri il prodotto → Custom Fields.</Step>
                      <Step n={2}>Modifica <code className="text-gray-300">feed_enabled</code> e metti Value = <code className="text-gray-300">false</code>.</Step>
                      <Step n={3}>Salva.</Step>
                    </ol>
                  </div>
                </div>

                <ResultBox ok>
                  Il prodotto viene rimosso dai feed del brand (se presente) e rimane invariato su eCommerce.
                </ResultBox>
              </Section>

              {/* ── 5. Riepilogo decisionale ── */}
              <Section icon="📊" title="Riepilogo decisionale">
                <div className="overflow-x-auto rounded-xl border border-gray-800">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-800 text-xs uppercase tracking-wider text-gray-500">
                        <th className="px-4 py-3">is_visible</th>
                        <th className="px-4 py-3">feed_enabled</th>
                        <th className="px-4 py-3">Categorie</th>
                        <th className="px-4 py-3">Azione sui feed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
                      <DecisionRow vis="true" feed="true" cat="≥ 1" action="Pubblica / Aggiorna" ok />
                      <DecisionRow vis="true" feed="false / assente" cat="≥ 1" action="Rimuovi" />
                      <DecisionRow vis="false" feed="qualsiasi" cat="qualsiasi" action="Rimuovi" />
                      <DecisionRow vis="true" feed="true" cat="0" action="Rimuovi (assenza categorie)" />
                      <DecisionRow vis="delete" feed="—" cat="—" action="Rimuovi" />
                    </tbody>
                  </table>
                </div>
              </Section>

              {/* ── 6. Regole per tipologia ── */}
              <Section icon="📚" title="Regole per tipologia">
                <div className="space-y-4">
                  <div className="rounded-lg bg-gray-800/40 border border-gray-800/60 p-4">
                    <h5 className="text-sm font-semibold text-gray-200 mb-2">🎓 Corsi</h5>
                    <ul className="space-y-1.5 text-sm text-gray-400 list-disc list-inside">
                      <li>Il prodotto da abilitare è sempre il PLUS (se presente), in caso contrario la linea di prodotto che prevede anche il materiale editoriale.</li>
                      <li>Cercare di abilitare solo un prodotto per annualità o per linea così da posizionare il miglior prodotto per rapporto qualità/prezzo.</li>
                    </ul>
                    <NoteBox variant="warning">
                      Quando un prodotto viene chiuso, valutare se rimuoverlo, disabilitarlo o rimuovere
                      semplicemente il custom field <code className="text-gray-300">feed_enabled</code> e cliccare su Salva.
                      Questo consente al feed di essere sempre allineato.
                    </NoteBox>
                  </div>

                  <div className="rounded-lg bg-gray-800/40 border border-gray-800/60 p-4">
                    <h5 className="text-sm font-semibold text-gray-200 mb-2">📖 Libri</h5>
                    <ul className="space-y-1.5 text-sm text-gray-400 list-disc list-inside">
                      <li>Tutti i prodotti editoriali in vendita diretta sul sito devono essere abilitati con <code className="text-gray-300">feed_enabled = true</code>.</li>
                      <li>I prodotti digitali NON devono mai essere abilitati perché funzionali ai QR code dei libri cartacei.</li>
                    </ul>
                    <NoteBox variant="warning">
                      Non abilitare MAI prodotti Acconti, Saldi e versioni digitali dei libri.
                    </NoteBox>
                  </div>
                </div>
              </Section>

              {/* ── 7. Prezzi P4M ── */}
              <Section icon="💰" title="Prezzi prodotti corso P4M">
                <p className="text-sm text-gray-400 mb-2">
                  Per i prodotti Corsi P4M o per tutti quelli principali su cui è prevista una logica di IVA mista
                  legata alla gestione fiscale:
                </p>
                <ul className="space-y-1.5 text-sm text-gray-400 list-disc list-inside">
                  <li>Tutti i prezzi reali dei corsi (<code className="text-gray-300">sale_price</code>) devono essere caricati su BigCommerce nel campo <code className="text-gray-300">cost_price</code>.</li>
                  <li>L&apos;automazione, nei feed P4M, utilizza <code className="text-gray-300">cost_price</code> come <code className="text-gray-300">sale_price</code> effettivo solo per gli SKU contenenti la sottostringa <code className="text-gray-300">COR</code>.</li>
                  <li>Per gli altri prodotti P4M (non &quot;COR&quot;), viene usato il <code className="text-gray-300">sale_price</code> standard.</li>
                </ul>
              </Section>

              {/* ── 8. Buone pratiche ── */}
              <Section icon="💡" title="Buone pratiche">
                <CheckList items={[
                  'Nome esatto del campo: feed_enabled (minuscolo, senza spazi).',
                  'Valori accettati: true per abilitare; qualsiasi altro valore o assenza → disabilitato.',
                  'Prodotti aggiornati spesso? Mantieni is_visible: true; usa feed_enabled per governare la presenza nei feed.',
                ]} />
              </Section>

              {/* ── 9. Dietro le quinte ── */}
              <Section icon="🔧" title="Cosa succede dietro le quinte">
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">→</span>
                    A ogni create/update/delete, il sistema riceve un evento.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">→</span>
                    Se <code className="text-gray-300">is_visible=true</code>, <code className="text-gray-300">feed_enabled=true</code> e il prodotto ha almeno una categoria → aggiunto/aggiornato nei feed.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">→</span>
                    Se <code className="text-gray-300">is_visible=false</code> oppure <code className="text-gray-300">feed_enabled=false</code>/assente oppure categorie=0 → rimosso dai feed.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400 mt-0.5">→</span>
                    In caso di delete, lo SKU viene recuperato dall&apos;indice interno e rimosso dai feed anche se il prodotto non è più interrogabile via API.
                  </li>
                </ul>
              </Section>
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

/* ── Helper sub-components ──────────────────────── */

function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <h4 className="text-sm font-semibold text-gray-100">{title}</h4>
      </div>
      <div className="text-sm text-gray-400 leading-relaxed space-y-3">
        {children}
      </div>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex items-center justify-center w-5 h-5 rounded bg-blue-900/30 text-blue-400 text-[10px] font-bold flex-shrink-0 mt-0.5">
        {n}
      </span>
      <div>{children}</div>
    </li>
  );
}

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 text-sm text-gray-400">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="text-green-400 mt-0.5">✓</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function NoteBox({ children, variant = 'info' }: { children: React.ReactNode; variant?: 'info' | 'warning' }) {
  const styles = variant === 'warning'
    ? 'bg-yellow-900/20 border-yellow-800/40 text-yellow-300'
    : 'bg-blue-900/20 border-blue-800/40 text-blue-300';
  return (
    <div className={`mt-3 rounded-lg border px-4 py-3 text-xs leading-relaxed ${styles}`}>
      {variant === 'warning' ? '⚠️ ' : 'ℹ️ '}
      {children}
    </div>
  );
}

function ResultBox({ children, ok }: { children: React.ReactNode; ok?: boolean }) {
  return (
    <div className={`mt-4 rounded-lg border px-4 py-3 text-xs leading-relaxed ${
      ok
        ? 'bg-green-900/20 border-green-800/40 text-green-300'
        : 'bg-gray-800/30 border-gray-700/50 text-gray-400'
    }`}>
      <span className="font-medium">Risultato atteso: </span>{children}
    </div>
  );
}

function DecisionRow({ vis, feed, cat, action, ok }: {
  vis: string; feed: string; cat: string; action: string; ok?: boolean;
}) {
  return (
    <tr className="transition hover:bg-gray-800/40">
      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-300">{vis}</td>
      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-300">{feed}</td>
      <td className="whitespace-nowrap px-4 py-3 text-gray-300">{cat}</td>
      <td className={`whitespace-nowrap px-4 py-3 text-sm font-medium ${ok ? 'text-green-400' : 'text-red-400'}`}>
        {action}
      </td>
    </tr>
  );
}
