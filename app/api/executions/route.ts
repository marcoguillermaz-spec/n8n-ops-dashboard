import { NextRequest, NextResponse } from 'next/server';
import { getExecutions } from '@/lib/n8n';
import { WORKFLOWS } from '@/lib/workflows';

/**
 * GET /api/executions?workflowId=xxx&limit=15
 */
export async function GET(req: NextRequest) {
  const workflowId = req.nextUrl.searchParams.get('workflowId') || '';
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '15', 10);

  if (!WORKFLOWS.some((w) => w.id === workflowId)) {
    return NextResponse.json({ error: 'Workflow non autorizzato' }, { status: 403 });
  }

  try {
    const executions = await getExecutions(workflowId, limit);
    return NextResponse.json(executions);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
