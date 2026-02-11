import { NextResponse } from 'next/server';
import { getWorkflow } from '@/lib/n8n';
import { WORKFLOWS } from '@/lib/workflows';

/**
 * GET /api/workflows
 *
 * Returns current status for the two BRT workflows.
 */
export async function GET() {
  try {
    const results = await Promise.all(
      WORKFLOWS.map(async (wf) => {
        const live = await getWorkflow(wf.id);
        return {
          ...wf,
          active: live.active,
          updatedAt: live.updatedAt,
        };
      })
    );

    return NextResponse.json(results);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
