# n8n Ops Dashboard

Dashboard interna per il monitoraggio e la gestione dei workflow n8n operativi, validazione prodotti BigCommerce e strumenti eCommerce.

**Live**: [n-8-n-ops-dashboard.replit.app](https://n-8-n-ops-dashboard.replit.app)

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

### eCommerce Utils

#### SKU Validation
Validazione completa dei prodotti BigCommerce tramite SKU (11 check bundle + 8 check sub-prodotti). Supporta validazione singola e batch.

#### Ricerca Inversa SKU Bundle
Ricerca quale bundle contiene un dato SKU sub-prodotto. Indice in-memory costruibile on-demand.

#### Coupon Management
Gestione promozioni e codici coupon BigCommerce: lista promozioni, creazione, generazione codici.

#### Convalida Buono-Ordine Carta Cultura / Carta Docente
Convalida buoni Carta della Cultura Giovani e Carta del Docente associandoli a un ordine BigCommerce. Richiede codice buono e Order ID.

### AI Knowledge Base
- **Chat interattiva** con la knowledge base aziendale (Pinecone via RAG)
- **Multi-turn**: contesto conversazione mantenuto nella sessione (perso al refresh)
- **Backend**: proxy verso workflow n8n "KB • Ask FAQ" (OpenAI + fallback Perplexity)

## Funzionalità trasversali
- **Autenticazione** con Google SSO via Supabase (solo account @testbusters.it)
- **Auto-refresh** ogni 30 secondi
- **Dark theme** con Tailwind CSS puro (no shadcn/ui)
- **In-memory storage** per risultati validazione (transiente)

## Quick start

```bash
git clone https://github.com/marcoguillermaz-spec/n8n-ops-dashboard.git
cd n8n-ops-dashboard
npm install
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000).

## Variabili d'ambiente

| Variabile | Descrizione |
| --------- | ----------- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL progetto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key Supabase |
| `N8N_BASE_URL` | URL istanza n8n |
| `N8N_API_KEY` | API key n8n |
| `LW_SHEET_ID` | ID Google Sheet log post-purchase LW |
| `BC_API_ENDPOINT` | BigCommerce API base URL |
| `BC_STORE_HASH` | Store hash BigCommerce |
| `BC_API_KEY` | Access token API BigCommerce (V3 Catalog) |
| `LW_API_KEY` | API key LearnWorlds (per voucher) |
| `LW_SCHOOL_URL` | URL scuola LearnWorlds |
| `N8N_KB_WEBHOOK_URL` | Webhook URL workflow n8n KB Ask FAQ |

> **Nota:** Il Google Sheet deve essere condiviso come "Chiunque abbia il link" per il funzionamento dell'endpoint gviz.

## Deploy (Replit)

Il progetto è deployato su Replit con `output: 'standalone'`:

- **Build**: `npm run build && cp -r .next/static .next/standalone/.next/static`
- **Run**: `HOSTNAME=0.0.0.0 node .next/standalone/server.js`
- **Workflow**: push to GitHub → su Replit "Pull latest and republish"

## Tech stack
- **Next.js 16** (App Router, TypeScript, standalone output)
- **Tailwind CSS** (dark theme, no component library)
- **Supabase Auth** (Google SSO, @supabase/ssr, PKCE flow)
- **BigCommerce Catalog API v3** (prodotti, immagini, channel assignments, coupon)
- **LearnWorlds API** (voucher)
- **Google Sheets gviz** (log post-purchase)
- **Zod** (validazione input)
