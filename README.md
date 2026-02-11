# n8n Ops Dashboard

Dashboard interna per il monitoraggio e la gestione dei workflow n8n operativi.

## Sezioni

### Shipping BRT
- **Toggle on/off** per attivare/disattivare i workflow BRT (IN / OUT)
- **Monitoring esecuzioni** con stato, durata e storico
- **Modale di conferma** per prevenire disattivazioni accidentali

### LW Post-Purchase
- **Summary cards**: utenti creati, tags assegnati, enrollments, errori totali
- **Error table**: lista errori con status code, messaggio, corso
- **Drill-down per ordine**: click su un errore per vedere tutte le operazioni dell'ordine
- **Filtro temporale**: 7 / 30 / 90 giorni o tutti

## Funzionalità trasversali
- **Auto-refresh** ogni 30 secondi
- **Autenticazione** con password semplice (cookie httpOnly)
- **Dark theme** con Tailwind CSS
- **Tab navigation** tra le sezioni

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
| `DASHBOARD_PASSWORD`| Password di accesso alla dashboard             |
| `AUTH_SECRET`       | Stringa segreta per firmare il cookie (min 32 chars) |
| `LW_SHEET_ID`      | ID del Google Sheet con i log post-purchase LW |

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
│   ├── api/
│   │   ├── auth/route.ts              # Login/logout
│   │   ├── workflows/route.ts         # GET stato workflow
│   │   ├── workflows/toggle/route.ts  # POST attiva/disattiva
│   │   ├── executions/route.ts        # GET storico esecuzioni
│   │   ├── lw/summary/route.ts        # GET aggregati LW
│   │   ├── lw/errors/route.ts         # GET errori LW
│   │   └── lw/orders/route.ts         # GET drill-down ordine
│   ├── login/page.tsx                 # Pagina login
│   ├── page.tsx                       # Dashboard principale (tab)
│   ├── layout.tsx                     # Layout root
│   └── globals.css                    # Tailwind base
├── components/
│   ├── WorkflowCard.tsx               # Card workflow con toggle + modale
│   ├── ExecutionTable.tsx             # Tabella esecuzioni n8n
│   ├── TabNav.tsx                     # Navigazione a tab
│   ├── LWSummaryCards.tsx             # Cards riassuntive LW
│   ├── LWErrorTable.tsx              # Tabella errori + drill-down
│   └── LWSection.tsx                  # Container sezione LW
├── lib/
│   ├── n8n.ts                         # Client API n8n
│   ├── workflows.ts                   # Registry workflow BRT
│   ├── gsheet.ts                      # Client Google Sheet (gviz/tq)
│   └── lw-config.ts                   # Configurazione sheet LW
└── middleware.ts                       # Auth middleware
```
