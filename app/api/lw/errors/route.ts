import { NextRequest, NextResponse } from 'next/server';
import { gvizQuery } from '@/lib/gsheet';
import { LW_SHEET_ID, COL, classifyError } from '@/lib/lw-config';

/**
 * GET /api/lw/errors?days=30&page=1&limit=30&errorType=already_owned
 *
 * Returns paginated error rows with optional error-type filter.
 * errorType: 'already_owned' | 'not_found' | 'other' | undefined (all)
 */
export async function GET(req: NextRequest) {
  const days = parseInt(req.nextUrl.searchParams.get('days') || '30', 10);
  const page = parseInt(req.nextUrl.searchParams.get('page') || '1', 10);
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '30', 10);
  const errorType = req.nextUrl.searchParams.get('errorType'); // filter key

  try {
    const filters: string[] = [`${COL.outcome} = 'ERROR'`];

    if (days > 0) {
      filters.push(`${COL.ts_iso} >= '${daysAgo(days)}'`);
    }

    // Error type filtering via error_message pattern
    if (errorType === 'already_owned') {
      filters.push(`${COL.error_message} contains 'Product is already owned'`);
    } else if (errorType === 'not_found') {
      filters.push(`${COL.error_message} contains 'Product not found'`);
    } else if (errorType === 'other') {
      filters.push(`not ${COL.error_message} contains 'Product is already owned'`);
      filters.push(`not ${COL.error_message} contains 'Product not found'`);
    }

    const where = ` where ${filters.join(' and ')}`;

    // Total count for pagination
    const countRows = await gvizQuery({
      sheetId: LW_SHEET_ID,
      query: `select count(${COL.action})${where}`,
    });
    const totalCount = countRows.length > 1 ? parseInt(countRows[1][0], 10) || 0 : 0;

    // Paginated data
    const offset = (page - 1) * limit;
    const rows = await gvizQuery({
      sheetId: LW_SHEET_ID,
      query: `select ${COL.ts_iso}, ${COL.action}, ${COL.order_id}, ${COL.email}, ${COL.lw_course_id}, ${COL.status_code}, ${COL.http_note}, ${COL.error_message}${where} order by ${COL.ts_iso} desc limit ${limit} offset ${offset}`,
    });

    const errors = rows.slice(1).map((r) => ({
      ts: r[0],
      action: r[1],
      orderId: r[2],
      email: r[3],
      courseId: r[4],
      statusCode: r[5],
      httpNote: r[6],
      errorMessage: r[7],
      errorType: classifyError(r[7] || ''),
    }));

    // Error type breakdown for filter counts
    const breakdownRows = await gvizQuery({
      sheetId: LW_SHEET_ID,
      query: `select ${COL.error_message}, count(${COL.error_message}) where ${COL.outcome} = 'ERROR'${days > 0 ? ` and ${COL.ts_iso} >= '${daysAgo(days)}'` : ''} group by ${COL.error_message}`,
    });

    const breakdown: Record<string, number> = { all: 0 };
    for (let i = 1; i < breakdownRows.length; i++) {
      const [msg, cnt] = breakdownRows[i];
      const count = parseInt(cnt, 10) || 0;
      const key = classifyError(msg || '');
      breakdown[key] = (breakdown[key] || 0) + count;
      breakdown.all += count;
    }

    return NextResponse.json({
      errors,
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      breakdown,
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
