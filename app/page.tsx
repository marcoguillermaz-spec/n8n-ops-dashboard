'use client';

import { useCallback, useEffect, useState } from 'react';
import TabNav from '@/components/TabNav';
import WorkflowCard from '@/components/WorkflowCard';
import ExecutionTable from '@/components/ExecutionTable';
import LWSection from '@/components/LWSection';
import EcomSection from '@/components/EcomSection';
import KBSection from '@/components/KBSection';
import CatFeedSection from '@/components/CatFeedSection';
import TutoringSection from '@/components/TutoringSection';
import { createClient } from '@/lib/supabase/client';

/* ── Types ───────────────────────────────────────── */

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

/* ── Constants ───────────────────────────────────── */

const TABS = [
  { id: 'ecom', label: 'eCommerce Utils', icon: '🛒' },
  { id: 'shipping', label: 'Shipping', icon: '📦' },
  { id: 'lw', label: 'LearnWorlds', icon: '🎓' },
  { id: 'catalogue', label: 'Catalogue Feed', icon: '📡' },
  { id: 'tutoring', label: 'Tutoring', icon: '🎓' },
  { id: 'kb', label: 'AI Knowledge Base', icon: '🧠' },
];

const POLL_INTERVAL = 30_000;

/* ── Page ────────────────────────────────────────── */

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('ecom');

  // ── Shipping state ─────────────────────────────
  const [workflows, setWorkflows] = useState<WorkflowState[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loadingWf, setLoadingWf] = useState(true);
  const [loadingExec, setLoadingExec] = useState(false);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // ── Fetch workflows ────────────────────────────
  const fetchWorkflows = useCallback(async () => {
    try {
      const res = await fetch('/api/workflows');
      if (!res.ok) throw new Error('Errore caricamento workflow');
      const data: WorkflowState[] = await res.json();
      setWorkflows(data);
      setError('');
      if (!selectedId && data.length) setSelectedId(data[0].id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoadingWf(false);
      setLastRefresh(new Date());
    }
  }, [selectedId]);

  // ── Fetch executions ───────────────────────────
  const fetchExecutions = useCallback(async (wfId: string) => {
    if (!wfId) return;
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

  // ── Polling (shipping) ─────────────────────────
  useEffect(() => {
    fetchWorkflows();
    const interval = setInterval(fetchWorkflows, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchWorkflows]);

  useEffect(() => {
    if (selectedId) fetchExecutions(selectedId);
  }, [selectedId, fetchExecutions]);

  // ── Toggle handler ─────────────────────────────
  async function handleToggle(id: string, newState: boolean) {
    try {
      const res = await fetch('/api/workflows/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: newState }),
      });
      if (!res.ok) throw new Error('Toggle fallito');
      await fetchWorkflows();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Errore toggle');
    }
  }

  // ── Logout ─────────────────────────────────────
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  const selectedWf = workflows.find((w) => w.id === selectedId);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* ── Header ──────────────────────────────── */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Operations Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Ecommerce Utils &amp; n8n Workflow Management
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastRefresh && (
            <span className="text-xs text-gray-600">
              Aggiornato alle{' '}
              {lastRefresh.toLocaleTimeString('it-IT', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
          <button
            onClick={() => {
              setLoadingWf(true);
              fetchWorkflows();
              if (selectedId) fetchExecutions(selectedId);
            }}
            className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs transition hover:bg-gray-800"
          >
            ↻ Aggiorna
          </button>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400 transition hover:bg-gray-800 hover:text-white"
          >
            Esci
          </button>
        </div>
      </header>

      {/* ── Tabs ────────────────────────────────── */}
      <div className="mb-8">
        <TabNav tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* ── Error banner ────────────────────────── */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-300">
          ⚠️ {error}
        </div>
      )}

      {/* ━━ SHIPPING TAB ━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {activeTab === 'shipping' && (
        <>
          {loadingWf && !workflows.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="h-48 animate-pulse rounded-2xl border border-gray-800 bg-gray-900"
                />
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                {workflows
                  .filter((wf) => wf.direction === 'in' || wf.direction === 'out')
                  .map((wf) => (
                    <WorkflowCard
                      key={wf.id}
                      {...wf}
                      onToggle={handleToggle}
                      onSelect={setSelectedId}
                      selected={wf.id === selectedId}
                    />
                  ))}
              </div>

              {selectedWf && (
                <section className="mt-8">
                  <h2 className="mb-4 text-lg font-semibold">
                    Esecuzioni — {selectedWf.label}
                  </h2>
                  <ExecutionTable
                    executions={executions}
                    loading={loadingExec}
                    workflowLabel={selectedWf.label}
                  />
                </section>
              )}
            </>
          )}
        </>
      )}

      {/* ━━ LW POST-PURCHASE TAB ━━━━━━━━━━━━━━━━━ */}
      {activeTab === 'lw' && <LWSection />}

      {/* ━━ ECOMMERCE UTILS TAB ━━━━━━━━━━━━━━━━━ */}
      {activeTab === 'ecom' && <EcomSection />}

      {/* ━━ CATALOGUE FEED TAB ━━━━━━━━━━━━━━━━━━ */}
      {activeTab === 'catalogue' && <CatFeedSection />}

      {/* ━━ TUTORING TAB ━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {activeTab === 'tutoring' && <TutoringSection />}

      {/* ━━ AI KNOWLEDGE BASE TAB ━━━━━━━━━━━━━━━ */}
      {activeTab === 'kb' && <KBSection />}
    </div>
  );
}
