import { NextRequest, NextResponse } from 'next/server';
import { gvizQuery } from '@/lib/gsheet';
import {
  TUTORING_SHEET_ID,
  TUTORING_COLS,
  isValidTab,
} from '@/lib/tutoring-config';

/**
 * GET /api/tutoring/data?tab=tb-docente
 *
 * Returns rows from the specified tutoring sheet tab (columns A–L).
 */
export async function GET(req: NextRequest) {
  const tabId = req.nextUrl.searchParams.get('tab') || '';
  const tab = isValidTab(tabId);

  if (!tab) {
    return NextResponse.json({ error: 'Tab non valido' }, { status: 400 });
  }

  const selectClause = TUTORING_COLS.letters.join(', ');

  try {
    const rows = await gvizQuery({
      sheetId: TUTORING_SHEET_ID,
      query: `SELECT ${selectClause}`,
      gid: tab.gid,
    });

    // First row is header — skip it
    const items = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const obj: Record<string, string> = {};
      for (let j = 0; j < TUTORING_COLS.keys.length; j++) {
        obj[TUTORING_COLS.keys[j]] = (row[j] ?? '').trim();
      }
      items.push(obj);
    }

    return NextResponse.json({
      tab: tabId,
      label: tab.label,
      count: items.length,
      items,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
