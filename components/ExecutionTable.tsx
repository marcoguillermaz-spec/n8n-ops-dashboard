'use client';

interface Execution {
  id: string;
  status: string;
  startedAt: string;
  stoppedAt: string | null;
  finished: boolean;
  mode: string;
}

interface ExecutionTableProps {
  executions: Execution[];
  loading: boolean;
  workflowLabel: string;
}

function statusBadge(status: string) {
  switch (status) {
    case 'success':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
          ✓ Successo
        </span>
      );
    case 'error':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-medium text-red-400">
          ✕ Errore
        </span>
      );
    case 'running':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2.5 py-0.5 text-xs font-medium text-blue-400">
          ↻ In esecuzione
        </span>
      );
    case 'waiting':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-2.5 py-0.5 text-xs font-medium text-yellow-400">
          ⏳ In attesa
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/15 px-2.5 py-0.5 text-xs font-medium text-gray-400">
          ? {status}
        </span>
      );
  }
}

function formatDuration(start: string, stop: string | null): string {
  if (!stop) return '—';
  const ms = new Date(stop).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  const secs = Math.round(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const remSecs = secs % 60;
  return `${mins}m ${remSecs}s`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function ExecutionTable({
  executions,
  loading,
  workflowLabel,
}: ExecutionTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        <svg
          className="mr-2 h-5 w-5 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        Caricamento esecuzioni…
      </div>
    );
  }

  if (!executions.length) {
    return (
      <div className="py-12 text-center text-sm text-gray-500">
        Nessuna esecuzione recente per <strong>{workflowLabel}</strong>
      </div>
    );
  }

  // Count stats
  const total = executions.length;
  const successes = executions.filter((e) => e.status === 'success').length;
  const errors = executions.filter((e) => e.status === 'error').length;

  return (
    <div>
      {/* Stats bar */}
      <div className="mb-4 flex items-center gap-4 text-xs text-gray-500">
        <span>Ultime {total} esecuzioni</span>
        <span className="text-emerald-400">{successes} ok</span>
        {errors > 0 && <span className="text-red-400">{errors} errori</span>}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-xs uppercase tracking-wider text-gray-500">
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Stato</th>
              <th className="px-4 py-3">Durata</th>
              <th className="px-4 py-3">Modalità</th>
              <th className="px-4 py-3">ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {executions.map((exec) => (
              <tr
                key={exec.id}
                className="transition hover:bg-gray-800/40"
              >
                <td className="whitespace-nowrap px-4 py-3 text-gray-300">
                  {formatDate(exec.startedAt)}
                </td>
                <td className="px-4 py-3">{statusBadge(exec.status)}</td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums text-gray-400">
                  {formatDuration(exec.startedAt, exec.stoppedAt)}
                </td>
                <td className="px-4 py-3 text-gray-500">{exec.mode}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-600">
                  {exec.id}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
