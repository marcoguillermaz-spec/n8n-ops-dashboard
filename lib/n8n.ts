/**
 * n8n REST API client
 *
 * Docs: https://docs.n8n.io/api/
 */

const BASE_URL = process.env.N8N_BASE_URL?.replace(/\/+$/, '') || '';
const API_KEY = process.env.N8N_API_KEY || '';

interface N8nRequestOptions {
  method?: string;
  body?: Record<string, unknown>;
}

async function n8nFetch<T>(path: string, opts: N8nRequestOptions = {}): Promise<T> {
  const url = `${BASE_URL}/api/v1${path}`;
  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers: {
      'X-N8N-API-KEY': API_KEY,
      'Content-Type': 'application/json',
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`n8n API ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ── Types ────────────────────────────────────────

export interface WorkflowSummary {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Execution {
  id: string;
  finished: boolean;
  mode: string;
  startedAt: string;
  stoppedAt: string | null;
  workflowId: string;
  status: 'success' | 'error' | 'running' | 'waiting' | 'unknown';
}

interface ExecutionsResponse {
  data: Execution[];
  nextCursor?: string;
}

// ── Public helpers ───────────────────────────────

export async function getWorkflow(id: string): Promise<WorkflowSummary> {
  return n8nFetch<WorkflowSummary>(`/workflows/${id}`);
}

export async function activateWorkflow(id: string): Promise<WorkflowSummary> {
  return n8nFetch<WorkflowSummary>(`/workflows/${id}/activate`, { method: 'POST' });
}

export async function deactivateWorkflow(id: string): Promise<WorkflowSummary> {
  return n8nFetch<WorkflowSummary>(`/workflows/${id}/deactivate`, { method: 'POST' });
}

export async function getExecutions(
  workflowId: string,
  limit = 15
): Promise<Execution[]> {
  const res = await n8nFetch<ExecutionsResponse>(
    `/executions?workflowId=${workflowId}&limit=${limit}&includeData=false`
  );
  return res.data ?? [];
}
