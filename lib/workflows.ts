/**
 * Static registry of the two BRT shipping workflows.
 *
 * IDs match your n8n instance.  Update here if they ever change.
 */

export interface WorkflowMeta {
  id: string;
  label: string;
  description: string;
  schedule: string;
  direction: 'in' | 'out';
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
];
