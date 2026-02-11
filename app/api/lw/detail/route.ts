import { NextRequest, NextResponse } from 'next/server';
import { gvizQuery } from '@/lib/gsheet';
import {
  LW_SHEET_ID,
  COL,
  gvizWarningContains,
  gvizNotWarning,
  classifyOutcome,
} from '@/lib/lw-config';

/**
 * GET /api/lw/detail?action=ENROLLMENT&outcome=WARNING&days=30&page=1&limit=30
 *
 * Returns paginated rows for a specific action, filtered by reclassified outcome.
 *
 * outcome param mapping:
 *   OK      → sheet outcome = 'OK'
 *   WARNING → sheet outcome = 'ERROR' AND error_message matches warning patterns
 *   ERROR   → sheet outcome = 'ERROR' AND error_message does NOT match warning patterns
 */
export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  const outcome = req.nextUrl.searchParams.get('outcome'); // OK | WARNING | ERROR | null
  const days = parseInt(req.nextUrl.searchParams.get('days') || '30', 10);
  const page = parseInt(req.nextUrl.searchParams.get('page') || '1', 10);
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '30', 10);

  if (!action) {
    return NextResponse.json({ error: 'action parameter required' }, { status: 400 });
  }

  try {
    const filters: string[] = [`${COL.action} = '${action}'`];

    if (days > 0) {
      filters.push(`${COL.ts_iso} >= '${daysAgo(days)}'`);
    }

    // Map the reclassified outcome to gviz filters
    if (outcome === 'OK') {
      filters.push(`${COL.outcome} = 'OK'`);
    } else if (outcome === 'WARNING') {
      filters.push(`${COL.outcome} = 'ERROR'`);
      filters.push(`(${gvizWarningContains()})`);
    } else if (outcome === 'ERROR') {
      filters.push(`${COL.outcome} = 'ERROR'`);
      filters.push(gvizNotWarning());
    }
    // If outcome is null/undefined → return all rows (no outcome filter)

    const where = ` where ${filters.join(' and ')}`;

    // Total count
    const countRows = await gvizQuery({
      sheetId: LW_SHEET_ID,
      query: `select count(${COL.action})${where}`,
    });
    const totalCount = countRows.length > 1 ? parseInt(countRows[1][0], 10) || 0 : 0;

    // Paginated data
    const offset = (page - 1) * limit;
    const dataRows = await gvizQuery({
      sheetId: LW_SHEET_ID,
      query: `select ${COL.ts_iso}, ${COL.action}, ${COL.order_id}, ${COL.email}, ${COL.lw_course_id}, ${COL.outcome}, ${COL.status_code}, ${COL.error_message}${where} order by ${COL.ts_iso} desc limit ${limit} offset ${offset}`,
    });

    const rows = dataRows.slice(1).map((r) => ({
      ts: r[0],
      action: r[1],
      orderId: r[2],
      email: r[3],
      courseId: r[4],
      outcome: classifyOutcome(r[5] || '', r[7] || ''),
      statusCode: r[6],
      errorMessage: r[7],
    }));

    return NextResponse.json({
      rows,
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}
