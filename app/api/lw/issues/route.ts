import { NextRequest, NextResponse } from 'next/server';
import { gvizQuery } from '@/lib/gsheet';
import {
  LW_SHEET_ID,
  COL,
  gvizWarningContains,
  gvizNotWarning,
  WARNING_TYPES,
  ERROR_TYPES,
  classifyWarning,
  classifyError,
} from '@/lib/lw-config';

/**
 * GET /api/lw/issues?severity=ALL&days=30&page=1&limit=30
 *
 * Unified endpoint for warnings and errors.
 *
 * severity (required): 'ALL' | 'WARNING' | 'ERROR'
 *   ALL     → all sheet outcome = 'ERROR' rows (both warnings and real errors)
 *   WARNING → sheet outcome = 'ERROR' AND error_message matches warning patterns
 *   ERROR   → sheet outcome = 'ERROR' AND error_message does NOT match warning patterns
 *
 * Returns macroBreakdown: { all, WARNING, ERROR } alongside paginated data.
 * Each row includes a `severity` field ('WARNING' | 'ERROR') for per-row colouring.
 */
export async function GET(req: NextRequest) {
  const severity = req.nextUrl.searchParams.get('severity');
  const days = parseInt(req.nextUrl.searchParams.get('days') || '30', 10);
  const page = parseInt(req.nextUrl.searchParams.get('page') || '1', 10);
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '30', 10);

  if (!severity || !['ALL', 'WARNING', 'ERROR'].includes(severity)) {
    return NextResponse.json(
      { error: 'severity parameter required (ALL, WARNING or ERROR)' },
      { status: 400 },
    );
  }

  try {
    const filters: string[] = [`${COL.outcome} = 'ERROR'`];

    if (days > 0) {
      filters.push(`${COL.ts_iso} >= '${daysAgo(days)}'`);
    }

    // Severity filter (ALL = no extra filter, includes both warnings and real errors)
    if (severity === 'WARNING') {
      filters.push(`(${gvizWarningContains()})`);
    } else if (severity === 'ERROR') {
      filters.push(gvizNotWarning());
    }
    // severity === 'ALL' → no additional filter

    const where = ` where ${filters.join(' and ')}`;

    // Total count
    const countRows = await gvizQuery({
      sheetId: LW_SHEET_ID,
      query: `select count(${COL.action})${where}`,
    });
    const totalCount =
      countRows.length > 1 ? parseInt(countRows[1][0], 10) || 0 : 0;

    // Paginated data
    const offset = (page - 1) * limit;
    const dataRows = await gvizQuery({
      sheetId: LW_SHEET_ID,
      query: `select ${COL.ts_iso}, ${COL.action}, ${COL.order_id}, ${COL.email}, ${COL.lw_course_id}, ${COL.status_code}, ${COL.error_message}${where} order by ${COL.ts_iso} desc limit ${limit} offset ${offset}`,
    });

    const issues = dataRows.slice(1).map((r) => {
      const msg = r[6] || '';
      const isWarning = classifyWarning(msg) !== null;
      const typeKey = isWarning
        ? classifyWarning(msg) || 'other'
        : classifyError(msg);
      return {
        ts: r[0],
        action: r[1],
        orderId: r[2],
        email: r[3],
        courseId: r[4],
        statusCode: r[5],
        errorMessage: r[6],
        issueType: typeKey,
        severity: isWarning ? 'WARNING' : 'ERROR',
      };
    });

    // ── Macro breakdown (always computed, regardless of current severity filter) ──
    // Base = all ERROR outcome rows in the time window
    const baseFilters: string[] = [`${COL.outcome} = 'ERROR'`];
    if (days > 0) baseFilters.push(`${COL.ts_iso} >= '${daysAgo(days)}'`);
    const baseWhere = ` where ${baseFilters.join(' and ')}`;

    // Count all issues
    const allCountRows = await gvizQuery({
      sheetId: LW_SHEET_ID,
      query: `select count(${COL.action})${baseWhere}`,
    });
    const allCount =
      allCountRows.length > 1 ? parseInt(allCountRows[1][0], 10) || 0 : 0;

    // Count warnings
    const warnWhere = `${baseWhere} and (${gvizWarningContains()})`;
    const warnCountRows = await gvizQuery({
      sheetId: LW_SHEET_ID,
      query: `select count(${COL.action})${warnWhere}`,
    });
    const warnCount =
      warnCountRows.length > 1 ? parseInt(warnCountRows[1][0], 10) || 0 : 0;

    const macroBreakdown = {
      all: allCount,
      WARNING: warnCount,
      ERROR: allCount - warnCount,
    };

    return NextResponse.json({
      issues,
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      macroBreakdown,
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
