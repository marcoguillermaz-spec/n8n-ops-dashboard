import { NextRequest, NextResponse } from 'next/server';
import { gvizQuery } from '@/lib/gsheet';
import { LW_SHEET_ID, COL } from '@/lib/lw-config';

/**
 * GET /api/lw/orders?orderId=41193
 *
 * Returns all log rows for a specific order (drill-down).
 */
export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get('orderId') || '';

  if (!orderId) {
    return NextResponse.json({ error: 'orderId richiesto' }, { status: 400 });
  }

  try {
    const rows = await gvizQuery({
      sheetId: LW_SHEET_ID,
      query: `select ${COL.ts_iso}, ${COL.action}, ${COL.email}, ${COL.lw_course_id}, ${COL.status_code}, ${COL.outcome}, ${COL.http_note}, ${COL.error_message} where ${COL.order_id} = '${orderId}' order by ${COL.ts_iso} asc`,
    });

    const operations = rows.slice(1).map((r) => ({
      ts: r[0],
      action: r[1],
      email: r[2],
      courseId: r[3],
      statusCode: r[4],
      outcome: r[5],
      httpNote: r[6],
      errorMessage: r[7],
    }));

    return NextResponse.json({ orderId, operations });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
