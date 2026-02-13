# n8n Ops Dashboard — Project Context

## Overview
Dashboard interna per il monitoraggio e la gestione dei workflow n8n operativi, validazione prodotti BigCommerce e strumenti eCommerce.

## Tech Stack
- **Framework**: Next.js 16 (App Router, TypeScript)
- **Styling**: Tailwind CSS puro — **NO shadcn/ui, NO component library**
- **API Client**: Axios per BigCommerce API v3
- **Validation**: Zod per input schema
- **Storage**: In-memory Map con `globalThis` singleton (no database)
- **Auth**: Supabase Auth con Google SSO (solo @testbusters.it), PKCE flow, @supabase/ssr
- **Theme**: Dark mode only

## Architecture Decisions
- **Tailwind puro**: tutti i componenti usano classi Tailwind dirette, nessuna libreria UI
- **In-memory storage**: risultati validazione sono transienti (Map su `globalThis` per sopravvivere a HMR/Turbopack)
- **Supabase Auth**: Google OAuth via `@supabase/ssr`, PKCE flow con `exchangeCodeForSession`, domain check `@testbusters.it` nel middleware
- **API credentials via `.env.local`**: nessun pannello API Config nel frontend. Le credenziali BigCommerce e LearnWorlds si configurano solo via environment variables
- **App Router**: tutte le API routes in `app/api/`, nessun pages router
- **Sub-tab pattern**: le sezioni principali (LW, eCommerce) hanno sub-tab interni gestiti con useState

## Project Structure
```
app/
  auth/callback/route.ts                 → OAuth callback (PKCE code exchange)
  api/
    workflows/route.ts                   → GET stato workflow n8n
    workflows/toggle/route.ts            → POST attiva/disattiva workflow
    executions/route.ts                  → GET storico esecuzioni
    lw/summary/route.ts                  → GET aggregati LearnWorlds
    lw/errors/route.ts                   → GET errori LW
    lw/issues/route.ts                   → GET issues raggruppati per severity
    lw/orders/route.ts                   → GET drill-down ordine
    lw/detail/route.ts                   → GET dettaglio operazione
    ecom/validate-sku/[sku]/route.ts     → POST validazione singolo SKU
    ecom/validate-skus/route.ts          → POST validazione batch SKU
    ecom/validation-results/route.ts     → GET/DELETE lista risultati
    ecom/validation-results/[id]/route.ts → GET/DELETE singolo risultato
    ecom/voucher/route.ts                → POST creazione voucher LW
  page.tsx                               → Dashboard principale (3 tab)
  login/page.tsx                         → Login
  layout.tsx                             → Layout root
  globals.css                            → Tailwind base

components/
  WorkflowCard.tsx          → Card workflow con toggle + modale conferma
  ExecutionTable.tsx        → Tabella esecuzioni n8n
  TabNav.tsx                → Navigazione tab principali
  LWSummaryCards.tsx        → Cards riassuntive LW (cliccabili)
  LWIssuesTable.tsx         → Tabella issues per severity (OK/WARNING/ERROR)
  LWDetailTable.tsx         → Tabella dettaglio operazione
  LWSection.tsx             → Container sezione LW (sub-tab: Summary, Issues, Errors, Detail)
  EcomSection.tsx           → Container eCommerce Utils (sub-tab: SKU Validation, Voucher)
  EcomSkuInput.tsx          → Input SKU singolo/bulk + CSV upload
  EcomValidationResults.tsx → Tabella risultati con colonna checks aggregati
  EcomDetailModal.tsx       → Modal dettaglio con griglia check (CheckBadge + ChecksSummary)
  EcomValidationGuide.tsx   → CTA "📋 Guida Controlli" + dialog guida con 11+8 check
  EcomVoucherSection.tsx    → Form creazione voucher LearnWorlds

lib/
  supabase/client.ts   → Browser Supabase client (createBrowserClient)
  supabase/server.ts   → Server Supabase client (createServerClient + cookies())
  n8n.ts               → Client API n8n
  workflows.ts         → Registry workflow BRT
  gsheet.ts            → Client Google Sheet (gviz/tq)
  lw-config.ts         → Configurazione sheet LW
  ecom-validation.ts   → Engine validazione BigCommerce (11+8 check)
  ecom-storage.ts      → In-memory storage risultati + tipi (globalThis singleton)
  ecom-schemas.ts      → Schema Zod per voucher

middleware.ts          → Supabase Auth middleware (getUser + domain check)
```

## Sections

### 1. Shipping BRT
Toggle on/off workflow n8n BRT IN/OUT, monitoring esecuzioni con stato e durata.

### 2. LW Post-Purchase
Summary cards cliccabili, issues per severity, errors con drill-down per ordine, filtro temporale.

### 3. eCommerce Utils

#### SKU Validation
Validazione completa prodotti BigCommerce tramite SKU.

**Prodotto principale (bundle) — 11 check:**
Visibilità, Purchasability (con logica preorder+data), Nome, SKU, Prezzo > 0, Tipo, Brand, Channel, Categoria, Descrizione, Immagine

**Sub-prodotti (associati) — 8 check:**
Visibilità, Purchasability (con logica preorder+data), Nome, SKU, Prezzo ≥ 0 (zero OK), Tipo, Brand, Channel

**Logica preorder:** `available` → pass; `preorder` + `preorder_release_date` presente → pass; `preorder` senza data → fail; `disabled` → fail

**Ottimizzazioni:** batch channel assignments con `product_id:in=`, images via `?include=images`

#### Voucher
Creazione coupon LearnWorlds con validazione Zod.

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL       → Supabase project URL (https://<ref>.supabase.co)
NEXT_PUBLIC_SUPABASE_ANON_KEY  → Supabase anon key
N8N_BASE_URL        → URL istanza n8n
N8N_API_KEY         → API key n8n
LW_SHEET_ID        → ID Google Sheet log post-purchase LW
BC_API_ENDPOINT     → BigCommerce API base URL (es. https://api.bigcommerce.com/stores)
BC_STORE_HASH       → Store hash BigCommerce
BC_API_KEY          → Access token API BigCommerce (V3 Catalog)
LW_API_KEY          → API key LearnWorlds (per voucher)
LW_SCHOOL_URL       → URL scuola LearnWorlds
```

## Coding Conventions
- Lingua UI: **italiano** per label, messaggi, guide utente
- Lingua codice: **inglese** per nomi variabili, funzioni, commenti tecnici
- Commit messages: inglese, conventional commits (feat/fix/docs/refactor)
- Interfaccia `ProductCheck`: `{ name, status: 'pass'|'fail', value, message? }`
- Interfaccia `SubProduct`: `{ name, sku, type, required, found, productId?, checks?, error? }`
- Status validazione: `'passed' | 'failed' | 'processing' | 'error'`
- Pattern componenti: CheckBadge (singolo check), ChecksSummary (pill aggregato)
- ZodError: usare `.issues` (NON `.errors`) per accedere ai messaggi di errore

## Known Patterns
- `globalThis` per singleton in-memory storage (evita problemi Turbopack/HMR)
- Channel assignments in batch: `GET /v3/catalog/products/channel-assignments?product_id:in=ID1,ID2,...`
- Images via query param: `?include=images` su endpoint prodotti
- HTML stripping per descrizione: `.replace(/<[^>]*>/g, '').trim()`
- Sub-tab navigation con `useState<SubTab>` pattern (sia in LWSection che EcomSection)
- Supabase SSR: `getAll`/`setAll` cookie pattern per browser↔server sync
- Middleware: `getUser()` (mai `getSession()`) per validare token server-side
- Domain check `@testbusters.it` nel middleware con signOut + redirect su mismatch

## Pending / Planned Features
- Dashboard analytics con statistiche aggregate validazione
- Validation progress component (barra progresso real-time per batch)
- Integrazione voucher BigCommerce orders (da repo Ecommerce-Utils separato)
- Settings page (max risultati, auto-refresh interval)
- Deploy su Replit (configurazione .replit + replit.nix)

## Build & Run
```bash
npm install
npm run dev          # Dev server
npx next build       # Production build (verifica TypeScript)
```
