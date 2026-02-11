/**
 * Configuration for the LW Post-purchase monitoring section.
 */

/** Google Sheet ID for "LW • Post-purchase • Logs" */
export const LW_SHEET_ID =
  process.env.LW_SHEET_ID || '15iNCvx3IkXoTTzlWA1H4W8lgxifvz4eLURFiKBcbe3I';

/** Column mapping (0-indexed) matching the sheet layout */
export const COL = {
  log_key: 'A',
  ts_iso: 'B',
  action: 'C',
  bu_tag: 'D',
  order_id: 'E',
  email: 'F',
  lw_course_id: 'G',
  status_code: 'H',
  outcome: 'I',
  http_note: 'J',
  error_message: 'K',
} as const;

/** Human-readable labels for each action type */
export const ACTION_LABELS: Record<string, string> = {
  USER_CREATED: 'Utente creato',
  TAGS_UPDATED: 'Tag assegnati',
  ENROLLMENT: 'Enrollment corso',
};

/** Human-readable labels + icons for summary cards */
export const SUMMARY_CARDS = [
  { action: 'USER_CREATED', label: 'Utenti creati', icon: '👤' },
  { action: 'TAGS_UPDATED', label: 'Tag assegnati', icon: '🏷️' },
  { action: 'ENROLLMENT', label: 'Enrollment', icon: '📚' },
] as const;

/**
 * Error type classification.
 * Maps patterns found in error_message (col K) to human-readable labels.
 */
export const ERROR_TYPES: { key: string; pattern: string; label: string; code: number }[] = [
  { key: 'already_owned', pattern: 'Product is already owned', label: 'Prodotto già posseduto', code: 422 },
  { key: 'not_found', pattern: 'Product not found', label: 'Prodotto non trovato', code: 404 },
];

/** Classify an error_message string into a known type key, or 'other' */
export function classifyError(errorMessage: string): string {
  for (const t of ERROR_TYPES) {
    if (errorMessage.includes(t.pattern)) return t.key;
  }
  return 'other';
}

/** Get label for an error type key */
export function errorTypeLabel(key: string): string {
  const found = ERROR_TYPES.find((t) => t.key === key);
  return found ? `${found.code} — ${found.label}` : 'Altro';
}
