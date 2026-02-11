/**
 * Configuration for the LW Post-purchase monitoring section.
 *
 * Outcome reclassification logic:
 * - The Google Sheet stores outcome as OK | ERROR.
 * - Some "ERROR" rows are actually **warnings** (the flow continues):
 *   e.g. "Product is already owned", "User already exists", "Tag already assigned".
 * - Real **errors** block the flow: 404 Product not found, 5xx server errors.
 * - classifyOutcome() reclassifies at the app level: OK → OK, ERROR → WARNING | ERROR.
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
  ENROLLMENT: 'Prodotto assegnato',
};

/** Human-readable labels + icons for summary cards */
export const SUMMARY_CARDS = [
  { action: 'USER_CREATED', label: 'Utenti creati', icon: '👤' },
  { action: 'TAGS_UPDATED', label: 'Tag assegnati', icon: '🏷️' },
  { action: 'ENROLLMENT', label: 'Prodotti assegnati', icon: '📚' },
] as const;

/* ─── Severity types ────────────────────────────────────────────── */

export type Severity = 'OK' | 'WARNING' | 'ERROR';

interface IssueType {
  key: string;
  pattern: string;
  label: string;
  code: number;
}

/**
 * Warning types — the flow continues, these are expected/non-blocking.
 * Matched against error_message column (col K).
 */
export const WARNING_TYPES: IssueType[] = [
  { key: 'already_owned', pattern: 'Product is already owned', label: 'Prodotto già posseduto', code: 422 },
  // Future patterns (currently no data, but ready for when they appear):
  // { key: 'user_exists', pattern: 'already exists', label: 'Utente già esistente', code: 422 },
  // { key: 'tag_assigned', pattern: 'already assigned', label: 'Tag già assegnato', code: 422 },
];

/**
 * Error types — real errors that block the flow.
 */
export const ERROR_TYPES: IssueType[] = [
  { key: 'not_found', pattern: 'Product not found', label: 'Prodotto non trovato', code: 404 },
  // 5xx errors will fall into 'other' and get labelled as "Errore server"
];

/**
 * All gviz filter patterns for warning messages.
 * Used to build WHERE clauses that separate warnings from real errors.
 */
export const WARNING_PATTERNS = WARNING_TYPES.map((t) => t.pattern);

/**
 * Classify an error_message string into a WARNING type key, or null if not a warning.
 */
export function classifyWarning(errorMessage: string): string | null {
  for (const t of WARNING_TYPES) {
    if (errorMessage.includes(t.pattern)) return t.key;
  }
  return null;
}

/**
 * Classify an error_message string into an ERROR type key, or 'other'.
 */
export function classifyError(errorMessage: string): string {
  for (const t of ERROR_TYPES) {
    if (errorMessage.includes(t.pattern)) return t.key;
  }
  return 'other';
}

/**
 * Reclassify the raw sheet outcome (OK|ERROR) into the app-level severity (OK|WARNING|ERROR).
 * This is the single source of truth for severity mapping.
 */
export function classifyOutcome(rawOutcome: string, errorMessage: string): Severity {
  if (rawOutcome !== 'ERROR') return 'OK';
  // Check if it's a known warning pattern
  if (classifyWarning(errorMessage) !== null) return 'WARNING';
  return 'ERROR';
}

/**
 * Get human-readable label for a warning type key.
 */
export function warningTypeLabel(key: string): string {
  const found = WARNING_TYPES.find((t) => t.key === key);
  return found ? `${found.code} — ${found.label}` : 'Altro';
}

/**
 * Get human-readable label for an error type key.
 */
export function errorTypeLabel(key: string): string {
  if (key === 'other') return 'Altro errore';
  const found = ERROR_TYPES.find((t) => t.key === key);
  return found ? `${found.code} — ${found.label}` : 'Altro';
}

/**
 * Build gviz WHERE clause fragments that isolate WARNING rows
 * (outcome='ERROR' AND error_message matches a warning pattern).
 */
export function gvizWarningContains(): string {
  return WARNING_PATTERNS.map((p) => `${COL.error_message} contains '${p}'`).join(' or ');
}

/**
 * Build gviz WHERE clause fragment that isolates real ERROR rows
 * (outcome='ERROR' AND error_message does NOT match any warning pattern).
 */
export function gvizNotWarning(): string {
  return WARNING_PATTERNS.map((p) => `not ${COL.error_message} contains '${p}'`).join(' and ');
}
