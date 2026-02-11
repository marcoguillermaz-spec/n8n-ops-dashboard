import { NextRequest, NextResponse } from 'next/server';
import { gvizQuery } from '@/lib/gsheet';
import { LW_SHEET_ID, COL } from '@/lib/lw-config';

/**
 * GET /api/lw/summary?days=7
 *
 * Returns aggregated counts per action + total errors.
 */
export async function GET(req: NextRequest) {
  const days = parseInt(req.nextUrl.searchParams.get('days') || '30', 10);

  try {
    // Aggregation: count by action × outcome
    const dateFilter =
      days > 0
        ? ` where ${COL.ts_iso} >= '${daysAgoISO(days)}'`
        : '';

    const rows = await gvizQuery({
      sheetId: LW_SHEET_ID,
      query: `select ${COL.action}, ${COL.outcome}, count(${COL.action}) ${dateFilter} group by ${COL.action}, ${COL.outcome}`,
    });

    // Skip header row, build summary map
    const summary: Record<string, { ok: number; error: number }> = {};
    let totalErrors = 0;

    for (let i = 1; i < rows.length; i++) {
      const [action, outcome, countStr] = rows[i];
      const count = parseInt(countStr, 10) || 0;

      if (!summary[action]) summary[action] = { ok: 0, error: 0 };

      if (outcome === 'OK') {
        summary[action].ok += count;
      } else {
        summary[action].error += count;
        totalErrors += count;
      }
    }

    // Total processed
    const totalProcessed = Object.values(summary).reduce(
      (acc, v) => acc + v.ok + v.error,
      0
    );

    return NextResponse.json({
      days,
      totalProcessed,
      totalErrors,
      byAction: summary,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}
