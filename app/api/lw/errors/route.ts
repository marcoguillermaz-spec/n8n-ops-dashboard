import { NextRequest, NextResponse } from 'next/server';
import { gvizQuery } from '@/lib/gsheet';
import { LW_SHEET_ID, COL } from '@/lib/lw-config';

/**
 * GET /api/lw/errors?limit=30&days=30
 *
 * Returns recent error rows with order_id + email context.
 */
export async function GET(req: NextRequest) {
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '30', 10);
  const days = parseInt(req.nextUrl.searchParams.get('days') || '30', 10);

  try {
    const dateFilter =
      days > 0
        ? ` and ${COL.ts_iso} >= datetime '${daysAgoISO(days)}'`
        : '';

    const rows = await gvizQuery({
      sheetId: LW_SHEET_ID,
      query: `select ${COL.ts_iso}, ${COL.action}, ${COL.order_id}, ${COL.email}, ${COL.lw_course_id}, ${COL.status_code}, ${COL.http_note}, ${COL.error_message} where ${COL.outcome} = 'ERROR'${dateFilter} order by ${COL.ts_iso} desc limit ${limit}`,
    });

    // Skip header row
    const errors = rows.slice(1).map((r) => ({
      ts: r[0],
      action: r[1],
      orderId: r[2],
      email: r[3],
      courseId: r[4],
      statusCode: r[5],
      httpNote: r[6],
      errorMessage: r[7],
    }));

    return NextResponse.json(errors);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 19);
}
