/**
 * Static registry of monitored n8n workflows.
 *
 * IDs match your n8n instance.  Update here if they ever change.
 */

export interface WorkflowMeta {
  id: string;
  label: string;
  description: string;
  schedule: string;
  direction: 'in' | 'out' | 'feed';
  color: string;        // Tailwind ring/accent color class
}

export const WORKFLOWS: WorkflowMeta[] = [
  {
    id: 'MHR5H1WGqII0wKmg',
    label: 'BRT IN (ecommerce)',
    description:
      'Legge ordini ELIGIBLE dal Master Sheet, genera CSV BRT (XX3OL), carica su FTP e aggiorna status a SHIPPED.',
    schedule: 'Ogni giorno lun–ven alle 08:00',
    direction: 'in',
    color: 'blue',
  },
  {
    id: 'ndkzechTS5hVYcym',
    label: 'BRT OUT',
    description:
      'Ogni 30 min controlla FTP per file XX2LIV, aggiorna ordini BC a Shipped → Completed e logga su GSheet.',
    schedule: 'Ogni 30 minuti',
    direction: 'out',
    color: 'emerald',
  },
  {
    id: 'BvAUzuIZmdNUCEm5',
    label: 'LW Post-purchase',
    description:
      'Automazione post-purchase LearnWorlds: creazione utente, enrollment corsi, tag assegnazione e logging.',
    schedule: 'Ad ogni nuovo ordine LW',
    direction: 'feed',
    color: 'cyan',
  },
  {
    id: 'PUynBiE4NJTnvURn',
    label: 'Catalogue Feed',
    description:
      'Genera e aggiorna i feed prodotti Google Merchant e AWIN per tutti i brand a partire dal catalogo BigCommerce.',
    schedule: 'Ad ogni create/update/delete prodotto',
    direction: 'feed',
    color: 'violet',
  },
  {
    id: 'M5F9iJgrmu3FsVBq',
    label: 'Tutoring Post-purchase',
    description:
      'Automazione post-purchase per tutoring: assegnazione tutor, notifiche e aggiornamento GSheet multi-tab.',
    schedule: 'Ad ogni nuovo ordine tutoring',
    direction: 'feed',
    color: 'amber',
  },
];
