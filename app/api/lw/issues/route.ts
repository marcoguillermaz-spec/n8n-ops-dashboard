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
 * GET /api/lw/issues?severity=WARNING&days=30&page=1&limit=30&issueType=already_owned
 *
 * Unified endpoint for both warnings and errors.
 *
 * severity (required): 'WARNING' | 'ERROR'
 *   WARNING → sheet outcome = 'ERROR' AND error_message matches warning patterns
 *   ERROR   → sheet outcome = 'ERROR' AND error_message does NOT match warning patterns
 *
 * issueType (optional): key from WARNING_TYPES or ERROR_TYPES, or 'other' for unclassified errors
 */
export async function GET(req: NextRequest) {
  const severity = req.nextUrl.searchParams.get('severity');
  const days = parseInt(req.nextUrl.searchParams.get('days') || '30', 10);
  const page = parseInt(req.nextUrl.searchParams.get('page') || '1', 10);
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '30', 10);
  const issueType = req.nextUrl.searchParams.get('issueType');

  if (!severity || (severity !== 'WARNING' && severity !== 'ERROR')) {
    return NextResponse.json(
      { error: 'severity parameter required (WARNING or ERROR)' },
      { status: 400 },
    );
  }

  try {
    const filters: string[] = [`${COL.outcome} = 'ERROR'`];

    if (days > 0) {
      filters.push(`${COL.ts_iso} >= '${daysAgo(days)}'`);
    }

    // Severity filter
    if (severity === 'WARNING') {
      filters.push(`(${gvizWarningContains()})`);
    } else {
      filters.push(gvizNotWarning());
    }

    // Issue type filter (within severity)
    if (issueType) {
      const types = severity === 'WARNING' ? WARNING_TYPES : ERROR_TYPES;
      const found = types.find((t) => t.key === issueType);
      if (found) {
        filters.push(`${COL.error_message} contains '${found.pattern}'`);
      } else if (issueType === 'other' && severity === 'ERROR') {
        for (const t of ERROR_TYPES) {
          filters.push(`not ${COL.error_message} contains '${t.pattern}'`);
        }
      }
    }

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
      let typeKey: string;
      if (severity === 'WARNING') {
        typeKey = classifyWarning(msg) || 'other';
      } else {
        typeKey = classifyError(msg);
      }
      return {
        ts: r[0],
        action: r[1],
        orderId: r[2],
        email: r[3],
        courseId: r[4],
        statusCode: r[5],
        errorMessage: r[6],
        issueType: typeKey,
      };
    });

    // Breakdown by issue type (for filter pill counts)
    // Uses severity base filter only (no issueType filter)
    const baseFilters: string[] = [`${COL.outcome} = 'ERROR'`];
    if (days > 0) baseFilters.push(`${COL.ts_iso} >= '${daysAgo(days)}'`);
    if (severity === 'WARNING') {
      baseFilters.push(`(${gvizWarningContains()})`);
    } else {
      baseFilters.push(gvizNotWarning());
    }
    const baseWhere = ` where ${baseFilters.join(' and ')}`;

    const breakdownRows = await gvizQuery({
      sheetId: LW_SHEET_ID,
      query: `select ${COL.error_message}, count(${COL.error_message})${baseWhere} group by ${COL.error_message}`,
    });

    const breakdown: Record<string, number> = { all: 0 };
    for (let i = 1; i < breakdownRows.length; i++) {
      const [msg, cnt] = breakdownRows[i];
      const count = parseInt(cnt, 10) || 0;
      let key: string;
      if (severity === 'WARNING') {
        key = classifyWarning(msg || '') || 'other';
      } else {
        key = classifyError(msg || '');
      }
      breakdown[key] = (breakdown[key] || 0) + count;
      breakdown.all += count;
    }

    return NextResponse.json({
      issues,
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
