/**
 * Google Sheet reader via the Google Visualization API (gviz/tq).
 *
 * Works without auth as long as the sheet is shared with
 * "Anyone with the link" (viewer).  For production, replace
 * with Google Sheets API v4 + service account.
 */

const GVIZ_BASE = 'https://docs.google.com/spreadsheets/d';

interface GvizQueryOptions {
  sheetId: string;
  query: string;            // Google Visualization SQL-like query
  sheetName?: string;       // tab name (defaults to first sheet)
}

/**
 * Execute a gviz/tq query and return parsed CSV rows.
 * Each row is a string[] matching the selected columns.
 */
export async function gvizQuery(opts: GvizQueryOptions): Promise<string[][]> {
  const params = new URLSearchParams({
    tqx: 'out:csv',
    tq: opts.query,
  });
  if (opts.sheetName) params.set('sheet', opts.sheetName);

  const url = `${GVIZ_BASE}/${opts.sheetId}/gviz/tq?${params}`;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`gviz ${res.status}`);

  const text = await res.text();
  return parseCsv(text);
}

/**
 * Lightweight CSV parser – handles quoted fields with commas
 * and escaped quotes ("").  Good enough for gviz output.
 */
function parseCsv(raw: string): string[][] {
  const lines = raw.trim().split('\n');
  return lines.map((line) => {
    const cells: string[] = [];
    let i = 0;
    while (i < line.length) {
      if (line[i] === '"') {
        // Quoted field
        let val = '';
        i++; // skip opening quote
        while (i < line.length) {
          if (line[i] === '"' && line[i + 1] === '"') {
            val += '"';
            i += 2;
          } else if (line[i] === '"') {
            i++; // skip closing quote
            break;
          } else {
            val += line[i];
            i++;
          }
        }
        cells.push(val);
        if (line[i] === ',') i++; // skip separator
      } else {
        // Unquoted field
        const next = line.indexOf(',', i);
        if (next === -1) {
          cells.push(line.slice(i));
          break;
        }
        cells.push(line.slice(i, next));
        i = next + 1;
      }
    }
    return cells;
  });
}
