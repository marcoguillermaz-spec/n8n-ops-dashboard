# n8n Ops Dashboard

Internal operations dashboard for monitoring and managing n8n workflows, BigCommerce product validation, and eCommerce tools.

**Live**: [n-8-n-ops-dashboard.replit.app](https://n-8-n-ops-dashboard.replit.app)

## Sections

### Shipping BRT
- **Toggle on/off** to activate/deactivate BRT workflows (IN / OUT)
- **Execution monitoring** with status, duration, and history
- **Confirmation modal** to prevent accidental deactivation

### LW Post-Purchase
- **Workflow monitoring** with toggle and execution history (accordion)
- **Summary cards** (clickable): users created, tags assigned, enrollments, total errors
- **Issues table**: problems grouped by severity (OK / WARNING / ERROR)
- **Error table**: errors with status code, message, course
- **Order drill-down**: click an error to view all operations for that order
- **Time filter**: 7 / 30 / 90 days or all

### eCommerce Utils

#### SKU Validation
Full BigCommerce product validation by SKU (11 bundle checks + 8 sub-product checks). Supports single and batch validation.

#### Reverse Bundle SKU Lookup
Find which bundle contains a given sub-product SKU. On-demand in-memory index.

#### Coupon Management
BigCommerce promotions and coupon codes: list promotions, create promotions, generate codes.

#### Voucher Verification (Carta Cultura / Carta del Docente)
Verify validity, beneficiary, and amount of a voucher without redeeming it (read-only). Direct SOAP communication with the Sogei service via mTLS. Supports both Carta Cultura Giovani and Carta del Docente with dedicated endpoints.

#### Voucher-Order Validation (Carta Cultura / Carta del Docente)
Validate Carta della Cultura Giovani and Carta del Docente vouchers by associating them with a BigCommerce order. Requires voucher code and Order ID.

#### Cache Flush (Revalidate)
On-demand Next.js cache invalidation on production/staging sites. Supports flush by relative path or by SKU. 4 brands (Testbusters, Peer4med, Topsquad, Medschool) x 2 environments (Production, Staging).

### Catalogue Feed
- **Product feed viewer** for Google Merchant and AWIN across 4 brands (Testbusters, Peer4med, Topsquad, Medschool)
- **8 Google Sheets** (4 brands x 2 providers) read via gviz
- **Pagination** at 50 results per page
- **Automatic error detection** for rows with missing values
- **Workflow toggle** for n8n "Catalogue Feed" with confirmation modal
- **Execution history** with 30-second polling
- **SKU feed validator**: 7-check validation against feed eligibility rules (visibility, feed_enabled, title, categories, image, description, price)
- **User guide** for enabling/disabling products in feeds

### Tutoring
- **Workflow monitoring** for n8n "Tutoring - Post purchase automation" with toggle and execution history
- **3 data sheets** (Testbusters, Topsquad, Medschool) from a multi-tab Google Sheet
- **12 columns** per sheet (Product Line through Tutor Assignment)
- **Pagination** at 50 results per page
- **Automatic error detection** for rows with missing values
- **Collapsible accordion layout** (Monitoring + Data)

### AI Knowledge Base
- **Interactive chat** with the company knowledge base (Pinecone via RAG)
- **Multi-turn**: conversation context maintained in session (lost on refresh)
- **Backend**: proxy to n8n "KB - Ask FAQ" workflow (OpenAI + Perplexity fallback)

## Cross-cutting Features
- **Authentication** with Google SSO via Supabase (@testbusters.it accounts only)
- **Auto-refresh** every 30 seconds
- **Dark theme** with pure Tailwind CSS (no shadcn/ui)
- **In-memory storage** for validation results (transient)

## Project Structure

```
app/
  auth/callback/route.ts                     # OAuth callback (PKCE code exchange)
  api/
    workflows/route.ts                       # GET workflow status from n8n
    workflows/toggle/route.ts                # POST activate/deactivate workflow
    executions/route.ts                      # GET execution history
    lw/summary/route.ts                      # GET LearnWorlds aggregates
    lw/errors/route.ts                       # GET LW errors
    lw/issues/route.ts                       # GET issues grouped by severity
    lw/orders/route.ts                       # GET order drill-down
    lw/detail/route.ts                       # GET operation detail
    ecom/validate-sku/[sku]/route.ts         # POST single SKU validation
    ecom/validate-skus/route.ts              # POST batch SKU validation
    ecom/validation-results/route.ts         # GET/DELETE results list
    ecom/validation-results/[id]/route.ts    # GET/DELETE single result
    ecom/voucher/route.ts                    # POST voucher-order validation
    ecom/carta-verify/route.ts               # POST voucher verification (SOAP Sogei mTLS)
    ecom/bundle-index/build/route.ts         # POST build bundle index
    ecom/bundle-index/status/route.ts        # GET bundle index status
    ecom/bundle-lookup/route.ts              # GET reverse bundle SKU lookup
    ecom/coupon/promotions/route.ts          # GET BigCommerce promotions list
    ecom/coupon/promotion/[id]/route.ts      # GET/DELETE single promotion
    ecom/coupon/codes/route.ts               # POST create coupon codes
    ecom/coupon/codes/[promotionId]/route.ts # GET codes for a promotion
    ecom/cache-flush/route.ts                # POST cache flush (revalidate) proxy
    catalogue-feed/products/route.ts         # GET feed products from GSheet
    catalogue-feed/validate-sku/route.ts     # POST SKU validation for feed (7 checks)
    tutoring/data/route.ts                   # GET tutoring data from GSheet multi-tab
    kb/chat/route.ts                         # POST AI Knowledge Base chat (n8n webhook proxy)
  page.tsx                                   # Main dashboard (6 tabs)
  login/page.tsx                             # Login page (Google SSO + Suspense boundary)
  layout.tsx                                 # Root layout
  globals.css                                # Tailwind base styles

components/
  TabNav.tsx                  # Main tab navigation
  WorkflowCard.tsx            # Workflow card with toggle + confirmation modal
  ExecutionTable.tsx          # n8n execution history table
  LWWorkflowPanel.tsx         # LW workflow accordion (toggle + executions)
  LWSummaryCards.tsx           # LW summary cards (clickable)
  LWIssuesTable.tsx            # Issues table by severity (OK/WARNING/ERROR)
  LWDetailTable.tsx            # Operation detail table
  LWSection.tsx                # LW section container
  EcomSection.tsx              # eCommerce Utils container (sub-tabs)
  EcomSkuInput.tsx             # SKU input (single/bulk + CSV upload)
  EcomValidationResults.tsx    # Results table with aggregated checks column
  EcomDetailModal.tsx          # Detail modal with check grid
  EcomCheckBadge.tsx           # Single check badge (pass/fail)
  EcomValidationGuide.tsx      # Guide dialog with 11+8 checks
  EcomVoucherSection.tsx       # Voucher verify + validate (Carta Cultura / Docente)
  EcomBundleLookup.tsx         # Reverse bundle SKU lookup
  EcomCouponSection.tsx        # Coupon management container
  EcomCouponList.tsx           # BigCommerce promotions list
  EcomCouponCodeGen.tsx        # Coupon code generation
  EcomCouponUpload.tsx         # Coupon upload
  EcomCacheFlushSection.tsx    # Cache flush (revalidate) by brand/environment
  CatFeedSection.tsx           # Catalogue Feed section (sub-tabs + brand selector)
  CatFeedProductTable.tsx      # Read-only product feed table with pagination
  CatFeedWorkflowPanel.tsx     # Catalogue Feed workflow toggle + executions
  CatFeedGuide.tsx             # Feed management user guide
  CatFeedSkuValidator.tsx      # SKU feed validation tool (7 checks: visibility, feed_enabled, title, categories, image, description, price)
  TutoringSection.tsx          # Tutoring section (2 accordions)
  TutoringWorkflowPanel.tsx    # Tutoring workflow accordion (toggle + executions)
  TutoringDataTable.tsx        # Tutoring data table with sub-tabs + pagination
  KBSection.tsx                # AI Knowledge Base section (chat state owner)
  KBMessageList.tsx            # Chat message list with auto-scroll + typing indicator
  KBChatInput.tsx              # Auto-resize textarea with send

lib/
  supabase/client.ts           # Browser Supabase client (createBrowserClient)
  supabase/server.ts           # Server Supabase client (createServerClient + cookies)
  n8n.ts                       # n8n REST API client
  workflows.ts                 # Monitored workflow registry
  gsheet.ts                    # Google Sheets gviz/tq client
  lw-config.ts                 # LW sheet configuration
  ecom-validation.ts           # BigCommerce validation engine (11+8 checks)
  ecom-storage.ts              # In-memory storage + types (globalThis singleton)
  ecom-schemas.ts              # Zod schemas for ecom inputs
  ecom-coupon.ts               # BigCommerce coupon/promotions API client
  ecom-bundle-index.ts         # Bundle index for reverse SKU lookup
  sogei-client.ts              # SOAP mTLS client for Sogei voucher verification
  catalogue-feed-config.ts     # Catalogue feed config (sheet IDs, columns, brands)
  tutoring-config.ts           # Tutoring config (sheet ID, tab gids, columns A-L)
  kb-types.ts                  # TypeScript types for AI Knowledge Base chat

middleware.ts                  # Supabase Auth middleware (getUser + domain check)
next.config.js                 # Next.js config (output: 'standalone')
.replit                        # Replit deployment config (build + run commands)
replit.nix                     # Nix environment (Node.js 20)
```

## Quick Start

```bash
git clone https://github.com/marcoguillermaz-spec/n8n-ops-dashboard.git
cd n8n-ops-dashboard
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description |
| -------- | ----------- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `N8N_BASE_URL` | n8n instance URL |
| `N8N_API_KEY` | n8n API key |
| `LW_SHEET_ID` | Google Sheet ID for LW post-purchase logs |
| `BC_API_ENDPOINT` | BigCommerce API base URL |
| `BC_STORE_HASH` | BigCommerce store hash |
| `BC_API_KEY` | BigCommerce API access token (V3 Catalog) |
| `LW_API_KEY` | LearnWorlds API key (for vouchers) |
| `LW_SCHOOL_URL` | LearnWorlds school URL |
| `N8N_KB_WEBHOOK_URL` | n8n webhook URL for KB Ask FAQ workflow |
| `SOGEI_CERT_PATH` | PEM certificate path for Sogei mTLS |
| `SOGEI_CERT_PASSPHRASE` | Sogei certificate passphrase |

> **Note:** Google Sheets must be shared as "Anyone with the link" for the gviz endpoint to work.

## Deploy (Replit)

The project is deployed on Replit with `output: 'standalone'`:

- **Build**: `npm install && npm run build && cp -r .next/static .next/standalone/.next/static && cp -r certs .next/standalone/certs`
- **Run**: `HOSTNAME=0.0.0.0 node .next/standalone/server.js`
- **Workflow**: push to GitHub → on Replit "Pull latest from GitHub and republish"

## Tech Stack
- **Next.js 16** (App Router, TypeScript, standalone output)
- **Tailwind CSS** (dark theme, no component library)
- **Supabase Auth** (Google SSO, @supabase/ssr, PKCE flow)
- **BigCommerce Catalog API v3** (products, images, channel assignments, coupons)
- **Sogei SOAP** (mTLS voucher verification for Carta Cultura / Carta del Docente)
- **Google Sheets gviz** (post-purchase logs, catalogue feeds, tutoring data)
- **Zod** (input validation)
