import { NextRequest, NextResponse } from 'next/server';
import { gvizQuery } from '@/lib/gsheet';
import { LW_SHEET_ID, COL, classifyOutcome } from '@/lib/lw-config';

/**
 * GET /api/lw/summary?days=7
 *
 * Returns aggregated counts per action with three severity levels:
 *   ok / warning / error
 *
 * Strategy: gviz only stores OK|ERROR in the outcome column.
 * We fetch OK counts directly, then fetch every ERROR row's error_message
 * and reclassify into WARNING vs ERROR at the app level.
 */
export async function GET(req: NextRequest) {
  const days = parseInt(req.nextUrl.searchParams.get('days') || '30', 10);

  try {
    const dateFilter =
      days > 0
        ? ` and ${COL.ts_iso} >= '${daysAgoISO(days)}'`
        : '';

    // ── OK counts per action ──────────────────────────
    const okRows = await gvizQuery({
      sheetId: LW_SHEET_ID,
      query: `select ${COL.action}, count(${COL.action}) where ${COL.outcome} = 'OK'${dateFilter} group by ${COL.action}`,
    });

    // ── All ERROR rows (action + error_message) for reclassification ──
    const errRows = await gvizQuery({
      sheetId: LW_SHEET_ID,
      query: `select ${COL.action}, ${COL.error_message} where ${COL.outcome} = 'ERROR'${dateFilter}`,
    });

    // Build summary map
    const summary: Record<string, { ok: number; warning: number; error: number }> = {};

    // Process OK counts
    for (let i = 1; i < okRows.length; i++) {
      const [action, countStr] = okRows[i];
      if (!summary[action]) summary[action] = { ok: 0, warning: 0, error: 0 };
      summary[action].ok = parseInt(countStr, 10) || 0;
    }

    // Process ERROR rows → reclassify into warning or error
    let totalWarnings = 0;
    let totalErrors = 0;
    for (let i = 1; i < errRows.length; i++) {
      const [action, errorMessage] = errRows[i];
      if (!summary[action]) summary[action] = { ok: 0, warning: 0, error: 0 };

      const severity = classifyOutcome('ERROR', errorMessage || '');
      if (severity === 'WARNING') {
        summary[action].warning += 1;
        totalWarnings += 1;
      } else {
        summary[action].error += 1;
        totalErrors += 1;
      }
    }

    // Totals
    const totalProcessed = Object.values(summary).reduce(
      (acc, v) => acc + v.ok + v.warning + v.error,
      0
    );

    return NextResponse.json({
      days,
      totalProcessed,
      totalWarnings,
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
