/**
 * Configuration for the Tutoring Post-purchase section.
 *
 * Single Google Sheet with multiple tabs (gid-based), one per tutoring type.
 * Columns A–L are displayed for each tab.
 */

/* ── Sheet ──────────────────────────────────────── */

export const TUTORING_SHEET_ID = '1PPdSfC1VXOu4W_-DsNZiy5G7ID67RZ9lPhziomnFih0';

/* ── Tabs ───────────────────────────────────────── */

export interface TutoringTab {
  id: string;
  label: string;
  gid: string;
}

export const TUTORING_TABS: TutoringTab[] = [
  { id: 'tb-docente', label: 'Testbusters - Docente privato', gid: '747728835' },
  { id: 'ts-docente', label: 'Topsquad - Docente privato', gid: '1215243594' },
  { id: 'ms-tutoring', label: 'Medschool tutoring', gid: '1313099980' },
];

/* ── Column definitions (A–L, same for all tabs) ── */

export const TUTORING_COLS = {
  letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'],
  keys: [
    'product_line',
    'prodotto',
    'sku',
    'data_ordine',
    'ordine',
    'citta',
    'email',
    'telefono',
    'nome',
    'cognome',
    'ore',
    'assegnazione_tutor',
  ] as const,
  labels: [
    'Product Line',
    'Prodotto',
    'SKU',
    'Data Ordine',
    '# Ordine',
    'Città',
    'Email',
    'Telefono',
    'Nome',
    'Cognome',
    'Ore',
    'Assegnazione Tutor',
  ],
};

export type TutoringRow = Record<(typeof TUTORING_COLS.keys)[number], string>;

/* ── Helpers ────────────────────────────────────── */

export function isValidTab(id: string): TutoringTab | undefined {
  return TUTORING_TABS.find((t) => t.id === id);
}
