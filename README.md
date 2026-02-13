# n8n Ops Dashboard

Dashboard interna per il monitoraggio e la gestione dei workflow n8n operativi, validazione prodotti BigCommerce e strumenti eCommerce.

## Sezioni

### Shipping BRT
- **Toggle on/off** per attivare/disattivare i workflow BRT (IN / OUT)
- **Monitoring esecuzioni** con stato, durata e storico
- **Modale di conferma** per prevenire disattivazioni accidentali

### LW Post-Purchase
- **Summary cards** cliccabili: utenti creati, tags assegnati, enrollments, errori totali
- **Issues table**: lista problemi raggruppati per severity (OK / WARNING / ERROR)
- **Error table**: lista errori con status code, messaggio, corso
- **Drill-down per ordine**: click su un errore per vedere tutte le operazioni dell'ordine
- **Filtro temporale**: 7 / 30 / 90 giorni o tutti
- **Tab dinamici**: Summary, Issues, Errors, Detail (ordine)

### eCommerce Utils
Tre sub-tab dedicati alle operazioni eCommerce:

#### SKU Validation
Validazione completa dei prodotti BigCommerce tramite SKU. Esegue controlli automatici su prodotto principale (bundle) e sub-prodotti associati.

**Controlli prodotto principale (11):**
Visibilità, Acquistabilità (con logica preorder + data), Nome, SKU, Prezzo > 0, Tipo, Brand, Channel, Categoria, Descrizione, Immagine

**Controlli sub-prodotti (8):**
Visibilità, Acquistabilità (con logica preorder + data), Nome, SKU, Prezzo ≥ 0, Tipo, Brand, Channel

- **Guida Controlli**: CTA + dialog che spiega tutti i check eseguiti su bundle e sub-prodotti
- **Tabella risultati** con colonna aggregata checks (pass/total)
- **Detail modal** con griglia check per prodotto principale e per ogni sub-prodotto
- **Batch validation** per più SKU contemporaneamente
- **Batch channel assignments** ottimizzato (una sola chiamata API per tutti i prodotti)

#### Voucher
Creazione coupon LearnWorlds con validazione Zod dei parametri.

## Funzionalità trasversali
- **Auto-refresh** ogni 30 secondi
- **Autenticazione** con Google SSO via Supabase (solo account @testbusters.it)
- **Dark theme** con Tailwind CSS puro (no shadcn/ui)
- **Tab navigation** tra le sezioni
- **In-memory storage** per risultati validazione (transiente)

## Quick start

```bash
# 1. Clona il progetto
git clone https://github.com/marcoguillerrmaz-spec/n8n-ops-dashboard.git
cd n8n-ops-dashboard

# 2. Installa dipendenze
npm install

# 3. Configura le variabili d'ambiente
cp .env.local.example .env.local
# Modifica .env.local con i tuoi valori

# 4. Avvia in sviluppo
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000).

## Variabili d'ambiente

| Variabile           | Descrizione                                    |
| ------------------- | ---------------------------------------------- |
| `N8N_BASE_URL`      | URL della tua istanza n8n (es. `https://n8n.tuodominio.com`) |
| `N8N_API_KEY`       | API key n8n (Settings → API → Create API Key)  |
| `NEXT_PUBLIC_SUPABASE_URL` | URL progetto Supabase (`https://<ref>.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key Supabase                         |
| `LW_SHEET_ID`      | ID del Google Sheet con i log post-purchase LW |
| `BC_STORE_HASH`    | Store hash BigCommerce (es. `abc123`)          |
| `BC_ACCESS_TOKEN`  | Access token API BigCommerce (V3 Catalog)      |
| `LW_API_KEY`       | API key LearnWorlds (per creazione voucher)     |
| `LW_SCHOOL_URL`    | URL della scuola LearnWorlds (es. `https://scuola.learnworlds.com`) |

> **Nota:** Il Google Sheet deve essere condiviso come "Chiunque abbia il link" per il funzionamento dell'endpoint gviz.

## Deploy

Il progetto è configurato con `output: 'standalone'` per un deploy semplice:

```bash
npm run build
node .next/standalone/server.js
```

Compatibile con Vercel, Docker, Railway, Fly.io e qualsiasi hosting Node.js.

## Struttura

```
├── app/
│   ├── auth/callback/route.ts                   # OAuth callback (PKCE code exchange)
│   ├── api/
│   │   ├── workflows/route.ts                   # GET stato workflow
│   │   ├── workflows/toggle/route.ts            # POST attiva/disattiva
│   │   ├── executions/route.ts                  # GET storico esecuzioni
│   │   ├── lw/summary/route.ts                  # GET aggregati LW
│   │   ├── lw/errors/route.ts                   # GET errori LW
│   │   ├── lw/issues/route.ts                   # GET issues raggruppati per severity
│   │   ├── lw/orders/route.ts                   # GET drill-down ordine
│   │   ├── lw/detail/route.ts                   # GET dettaglio operazione
│   │   ├── ecom/validate-sku/[sku]/route.ts     # GET validazione singolo SKU
│   │   ├── ecom/validate-skus/route.ts          # POST validazione batch SKU
│   │   ├── ecom/validation-results/route.ts     # GET lista risultati validazione
│   │   ├── ecom/validation-results/[id]/route.ts # GET/DELETE singolo risultato
│   │   └── ecom/voucher/route.ts                # POST creazione voucher LW
│   ├── login/page.tsx                           # Pagina login
│   ├── page.tsx                                 # Dashboard principale (3 tab)
│   ├── layout.tsx                               # Layout root
│   └── globals.css                              # Tailwind base
├── components/
│   ├── WorkflowCard.tsx                         # Card workflow con toggle + modale
│   ├── ExecutionTable.tsx                       # Tabella esecuzioni n8n
│   ├── TabNav.tsx                               # Navigazione a tab
│   ├── LWSummaryCards.tsx                       # Cards riassuntive LW (cliccabili)
│   ├── LWIssuesTable.tsx                        # Tabella issues per severity
│   ├── LWDetailTable.tsx                        # Tabella dettaglio operazione
│   ├── LWSection.tsx                            # Container sezione LW (sub-tab)
│   ├── EcomSection.tsx                          # Container eCommerce Utils (sub-tab)
│   ├── EcomSkuInput.tsx                         # Input SKU + pulsanti validazione
│   ├── EcomValidationResults.tsx                # Tabella risultati con colonna checks
│   ├── EcomDetailModal.tsx                      # Modal dettaglio con griglia check
│   ├── EcomValidationGuide.tsx                  # CTA + dialog guida controlli
│   └── EcomVoucherSection.tsx                   # Form creazione voucher LW
├── lib/
│   ├── supabase/client.ts                       # Browser Supabase client
│   ├── supabase/server.ts                       # Server Supabase client
│   ├── n8n.ts                                   # Client API n8n
│   ├── workflows.ts                             # Registry workflow BRT
│   ├── gsheet.ts                                # Client Google Sheet (gviz/tq)
│   ├── lw-config.ts                             # Configurazione sheet LW
│   ├── ecom-validation.ts                       # Engine validazione BigCommerce (11+8 check)
│   ├── ecom-storage.ts                          # In-memory storage risultati + tipi
│   └── ecom-schemas.ts                          # Schema Zod per voucher
└── middleware.ts                                 # Supabase Auth middleware (getUser + domain check)
```

## Tech stack
- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS** (dark theme, no component library)
- **BigCommerce Catalog API v3** (prodotti, immagini, channel assignments)
- **LearnWorlds API** (voucher)
- **Google Sheets gviz** (log post-purchase)
- **Supabase Auth** (Google SSO, @supabase/ssr)
- **Zod** (validazione input)
