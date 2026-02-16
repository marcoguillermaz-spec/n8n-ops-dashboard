# n8n Ops Dashboard — Project Context

## Overview
Dashboard interna per il monitoraggio e la gestione dei workflow n8n operativi, validazione prodotti BigCommerce e strumenti eCommerce.

## Tech Stack
- **Framework**: Next.js 16 (App Router, TypeScript, `output: 'standalone'`)
- **Styling**: Tailwind CSS puro — **NO shadcn/ui, NO component library**
- **API Client**: Axios per BigCommerce API v3
- **Validation**: Zod per input schema
- **Storage**: In-memory Map con `globalThis` singleton (no database)
- **Auth**: Supabase Auth con Google SSO (solo @testbusters.it), PKCE flow, @supabase/ssr
- **Theme**: Dark mode only
- **Deploy**: Replit (standalone output + GitHub integration)

## Architecture Decisions
- **Tailwind puro**: tutti i componenti usano classi Tailwind dirette, nessuna libreria UI
- **In-memory storage**: risultati validazione sono transienti (Map su `globalThis` per sopravvivere a HMR/Turbopack)
- **Supabase Auth**: Google OAuth via `@supabase/ssr`, PKCE flow con `exchangeCodeForSession`, domain check `@testbusters.it` nel middleware
- **Reverse proxy aware**: middleware e callback usano `x-forwarded-host`/`x-forwarded-proto` per redirect corretti dietro Replit
- **API credentials via `.env.local`**: nessun pannello API Config nel frontend. Le credenziali si configurano solo via environment variables
- **App Router**: tutte le API routes in `app/api/`, nessun pages router
- **Sub-tab pattern**: le sezioni principali (LW, eCommerce) hanno sub-tab interni gestiti con useState

## Project Structure
```
app/
  auth/callback/route.ts                   → OAuth callback (PKCE code exchange)
  api/
    workflows/route.ts                     → GET stato workflow n8n
    workflows/toggle/route.ts              → POST attiva/disattiva workflow
    executions/route.ts                    → GET storico esecuzioni
    lw/summary/route.ts                    → GET aggregati LearnWorlds
    lw/errors/route.ts                     → GET errori LW
    lw/issues/route.ts                     → GET issues raggruppati per severity
    lw/orders/route.ts                     → GET drill-down ordine
    lw/detail/route.ts                     → GET dettaglio operazione
    ecom/validate-sku/[sku]/route.ts       → POST validazione singolo SKU
    ecom/validate-skus/route.ts            → POST validazione batch SKU
    ecom/validation-results/route.ts       → GET/DELETE lista risultati
    ecom/validation-results/[id]/route.ts  → GET/DELETE singolo risultato
    ecom/voucher/route.ts                  → POST creazione voucher LW
    ecom/bundle-index/build/route.ts       → POST build indice bundle
    ecom/bundle-index/status/route.ts      → GET stato indice bundle
    ecom/bundle-lookup/route.ts            → GET ricerca inversa SKU bundle
    ecom/coupon/promotions/route.ts        → GET lista promozioni BigCommerce
    ecom/coupon/promotion/[id]/route.ts    → GET/DELETE singola promozione
    ecom/coupon/codes/route.ts             → POST creazione codici coupon
    ecom/coupon/codes/[promotionId]/route.ts → GET codici per promozione
    kb/chat/route.ts                         → POST chat AI Knowledge Base (proxy webhook n8n)
  page.tsx                                 → Dashboard principale (4 tab)
  login/page.tsx                           → Login (Google SSO + Suspense boundary)
  layout.tsx                               → Layout root
  globals.css                              → Tailwind base

components/
  TabNav.tsx                → Navigazione tab principali
  WorkflowCard.tsx          → Card workflow con toggle + modale conferma
  ExecutionTable.tsx        → Tabella esecuzioni n8n
  LWSummaryCards.tsx        → Cards riassuntive LW (cliccabili)
  LWIssuesTable.tsx         → Tabella issues per severity (OK/WARNING/ERROR)
  LWDetailTable.tsx         → Tabella dettaglio operazione
  LWSection.tsx             → Container sezione LW (sub-tab: Summary, Issues, Errors, Detail)
  EcomSection.tsx           → Container eCommerce Utils (sub-tab)
  EcomSkuInput.tsx          → Input SKU singolo/bulk + CSV upload
  EcomValidationResults.tsx → Tabella risultati con colonna checks aggregati
  EcomDetailModal.tsx       → Modal dettaglio con griglia check
  EcomCheckBadge.tsx        → Badge singolo check (pass/fail)
  EcomValidationGuide.tsx   → CTA + dialog guida con 11+8 check
  EcomVoucherSection.tsx    → Form creazione voucher LearnWorlds
  EcomBundleLookup.tsx      → Ricerca inversa SKU bundle
  EcomCouponSection.tsx     → Container gestione coupon
  EcomCouponList.tsx        → Lista promozioni BigCommerce
  EcomCouponCodeGen.tsx     → Generazione codici coupon
  EcomCouponUpload.tsx      → Upload coupon
  KBSection.tsx             → Container sezione AI Knowledge Base (state owner chat)
  KBMessageList.tsx         → Lista messaggi chat con auto-scroll e typing indicator
  KBChatInput.tsx           → Textarea auto-resize con invio messaggio

lib/
  supabase/client.ts     → Browser Supabase client (createBrowserClient)
  supabase/server.ts     → Server Supabase client (createServerClient + cookies())
  n8n.ts                 → Client API n8n
  workflows.ts           → Registry workflow BRT
  gsheet.ts              → Client Google Sheet (gviz/tq)
  lw-config.ts           → Configurazione sheet LW
  ecom-validation.ts     → Engine validazione BigCommerce (11+8 check)
  ecom-storage.ts        → In-memory storage risultati + tipi (globalThis singleton)
  ecom-schemas.ts        → Schema Zod per voucher
  ecom-coupon.ts         → Client BigCommerce coupon/promotions API
  ecom-bundle-index.ts   → Indice bundle per ricerca inversa SKU
  kb-types.ts            → Tipi TypeScript per chat AI Knowledge Base

middleware.ts            → Supabase Auth middleware (getUser + domain check + x-forwarded-host)
next.config.js           → Next.js config (output: 'standalone')
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

#### Ricerca Inversa SKU Bundle
Ricerca quale bundle contiene un dato SKU sub-prodotto. Usa indice in-memory costruibile on-demand.

#### Coupon Management
Gestione promozioni e codici coupon BigCommerce: lista, creazione, generazione codici.

#### Voucher
Creazione coupon LearnWorlds con validazione Zod.

### 4. AI Knowledge Base
Interfaccia chat per interrogare la knowledge base aziendale (Pinecone) tramite RAG (OpenAI + fallback Perplexity). Proxy verso workflow n8n "KB • Ask FAQ" via webhook. Sessione client-side (persa al refresh), nessuna gestione KB.

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL       → Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  → Supabase anon key
N8N_BASE_URL                   → URL istanza n8n
N8N_API_KEY                    → API key n8n
LW_SHEET_ID                   → ID Google Sheet log post-purchase LW
BC_API_ENDPOINT                → BigCommerce API base URL
BC_STORE_HASH                  → Store hash BigCommerce
BC_API_KEY                     → Access token API BigCommerce (V3 Catalog)
LW_API_KEY                     → API key LearnWorlds (per voucher)
LW_SCHOOL_URL                  → URL scuola LearnWorlds
N8N_KB_WEBHOOK_URL             → Webhook URL workflow n8n KB Ask FAQ
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
- Sub-tab navigation con `useState<SubTab>` pattern
- Supabase SSR: `getAll`/`setAll` cookie pattern per browser↔server sync
- Middleware: `getUser()` (mai `getSession()`) per validare token server-side
- Domain check `@testbusters.it` nel middleware con signOut + redirect su mismatch
- Reverse proxy: `x-forwarded-host`/`x-forwarded-proto` per redirect corretti (Replit standalone)

## Pending / Planned Features
- Dashboard analytics con statistiche aggregate validazione
- Validation progress component (barra progresso real-time per batch)
- Settings page (max risultati, auto-refresh interval)

## Build & Run
```bash
npm install
npm run dev          # Dev server (localhost:3000)
npx next build       # Production build (verifica TypeScript)
```

## Deploy (Replit)
- **Build command**: `npm run build && cp -r .next/static .next/standalone/.next/static`
- **Run command**: `HOSTNAME=0.0.0.0 node .next/standalone/server.js`
- **URL**: `https://n-8-n-ops-dashboard.replit.app`
- Deploy manuale: push to GitHub → su Replit "Pull latest from GitHub and republish"
