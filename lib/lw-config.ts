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
