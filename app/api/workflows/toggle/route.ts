import { NextRequest, NextResponse } from 'next/server';
import { activateWorkflow, deactivateWorkflow } from '@/lib/n8n';
import { WORKFLOWS } from '@/lib/workflows';

/**
 * POST /api/workflows/toggle
 *
 * Body: { id: string, active: boolean }
 * Activates or deactivates a workflow.
 */
export async function POST(req: NextRequest) {
  const { id, active } = await req.json();

  // Only allow toggling our known workflows
  if (!WORKFLOWS.some((w) => w.id === id)) {
    return NextResponse.json({ error: 'Workflow non autorizzato' }, { status: 403 });
  }

  try {
    const result = active
      ? await activateWorkflow(id)
      : await deactivateWorkflow(id);

    return NextResponse.json({ id: result.id, active: result.active });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
