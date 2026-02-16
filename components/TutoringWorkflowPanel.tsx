'use client';

import { useCallback, useEffect, useState } from 'react';
import WorkflowCard from './WorkflowCard';
import ExecutionTable from './ExecutionTable';

interface WorkflowState {
  id: string;
  label: string;
  description: string;
  schedule: string;
  direction: 'in' | 'out' | 'feed';
  color: string;
  active: boolean;
  updatedAt: string;
}

interface Execution {
  id: string;
  status: string;
  startedAt: string;
  stoppedAt: string | null;
  finished: boolean;
  mode: string;
}

const POLL_INTERVAL = 30_000;

export default function TutoringWorkflowPanel() {
  const [expanded, setExpanded] = useState(false);
  const [workflow, setWorkflow] = useState<WorkflowState | null>(null);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loadingWf, setLoadingWf] = useState(true);
  const [loadingExec, setLoadingExec] = useState(false);
  const [error, setError] = useState('');

  const fetchWorkflow = useCallback(async () => {
    try {
      const res = await fetch('/api/workflows');
      if (!res.ok) throw new Error('Errore caricamento workflow');
      const data: WorkflowState[] = await res.json();
      const wf = data.find((w) => w.label === 'Tutoring Post-purchase');
      setWorkflow(wf ?? null);
      setError('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoadingWf(false);
    }
  }, []);

  const fetchExecutions = useCallback(async (wfId: string) => {
    setLoadingExec(true);
    try {
      const res = await fetch(`/api/executions?workflowId=${wfId}&limit=15`);
      if (!res.ok) throw new Error('Errore caricamento esecuzioni');
      const data: Execution[] = await res.json();
      setExecutions(data);
    } catch {
      setExecutions([]);
    } finally {
      setLoadingExec(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkflow();
    const interval = setInterval(fetchWorkflow, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchWorkflow]);

  useEffect(() => {
    if (workflow && expanded) fetchExecutions(workflow.id);
  }, [workflow, expanded, fetchExecutions]);

  async function handleToggle(id: string, newState: boolean) {
    try {
      const res = await fetch('/api/workflows/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: newState }),
      });
      if (!res.ok) throw new Error('Toggle fallito');
      await fetchWorkflow();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Errore toggle');
    }
  }

  const statusDot = workflow
    ? workflow.active
      ? 'text-emerald-400'
      : 'text-red-400'
    : 'text-gray-600';

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/50">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-6 py-4 text-left transition hover:bg-gray-800/30 rounded-2xl"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">⚙️</span>
          <div>
            <h3 className="text-sm font-semibold text-gray-100">
              Monitoraggio Workflow
            </h3>
            {workflow && !loadingWf && (
              <p className="text-xs text-gray-500 mt-0.5">
                <span className={statusDot}>●</span>{' '}
                {workflow.active ? 'Attivo' : 'Inattivo'} — {workflow.label}
              </p>
            )}
          </div>
        </div>
        <span className={`text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>

      {expanded && (
        <div className="border-t border-gray-800 px-6 py-6 space-y-8">
          {loadingWf && !workflow && (
            <div className="h-48 animate-pulse rounded-2xl border border-gray-800 bg-gray-900" />
          )}

          {error && (
            <div className="rounded-xl border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-300">
              ⚠️ {error}
            </div>
          )}

          {!loadingWf && !workflow && !error && (
            <div className="py-8 text-center text-sm text-gray-500">
              Workflow Tutoring non trovato.
            </div>
          )}

          {workflow && (
            <>
              <div className="max-w-xl">
                <WorkflowCard
                  {...workflow}
                  onToggle={handleToggle}
                  onSelect={() => {}}
                  selected={false}
                />
              </div>

              <section>
                <h2 className="mb-4 text-lg font-semibold">
                  Esecuzioni — {workflow.label}
                </h2>
                <ExecutionTable
                  executions={executions}
                  loading={loadingExec}
                  workflowLabel={workflow.label}
                />
              </section>
            </>
          )}
        </div>
      )}
    </div>
  );
}
