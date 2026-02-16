'use client';

import { useState } from 'react';

interface WorkflowCardProps {
  id: string;
  label: string;
  description: string;
  schedule: string;
  direction: 'in' | 'out' | 'feed';
  color: string;
  active: boolean;
  updatedAt: string;
  onToggle: (id: string, newState: boolean) => Promise<void>;
  onSelect: (id: string) => void;
  selected: boolean;
}

export default function WorkflowCard({
  id,
  label,
  description,
  schedule,
  direction,
  active,
  updatedAt,
  onToggle,
  onSelect,
  selected,
}: WorkflowCardProps) {
  const [toggling, setToggling] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const dirIcon = direction === 'feed' ? '📡' : direction === 'in' ? '⬆️' : '⬇️';
  const dirLabel = direction === 'feed' ? 'GENERAZIONE FEED' : direction === 'in' ? 'INVIO A BRT' : 'RICEZIONE DA BRT';

  const borderColor = selected
    ? 'border-blue-500'
    : 'border-gray-800 hover:border-gray-700';

  function handleToggleClick() {
    if (active) {
      // Deactivation → ask confirmation
      setConfirmOpen(true);
    } else {
      // Activation → proceed immediately
      doToggle(true);
    }
  }

  async function doToggle(newState: boolean) {
    setConfirmOpen(false);
    setToggling(true);
    await onToggle(id, newState);
    setToggling(false);
  }

  const updatedDate = updatedAt
    ? new Date(updatedAt).toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

  return (
    <>
      <div
        onClick={() => onSelect(id)}
        className={`cursor-pointer rounded-2xl border bg-gray-900 p-6 transition ${borderColor}`}
      >
        {/* Header row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{dirIcon}</span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                {dirLabel}
              </p>
              <h2 className="text-lg font-semibold">{label}</h2>
            </div>
          </div>

          {/* Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleClick();
            }}
            disabled={toggling}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors
              ${active ? 'bg-emerald-500' : 'bg-gray-700'}
              ${toggling ? 'opacity-50' : ''}`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform
                ${active ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
        </div>

        {/* Description */}
        <p className="mt-3 text-sm leading-relaxed text-gray-400">{description}</p>

        {/* Meta */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
          <span>🕐 {schedule}</span>
          <span>·</span>
          <span>Aggiornato: {updatedDate}</span>
          <span>·</span>
          <span className={active ? 'text-emerald-400' : 'text-red-400'}>
            {active ? '● Attivo' : '○ Inattivo'}
          </span>
        </div>
      </div>

      {/* ── Confirmation modal (deactivation only) ── */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-2xl"
          >
            {/* Warning icon */}
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/15 text-2xl">
              ⚠️
            </div>

            <h3 className="text-lg font-semibold">
              Disattivare {label}?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">
              Il workflow verrà fermato e non eseguirà più le operazioni
              pianificate ({schedule.toLowerCase()}) fino alla riattivazione.
            </p>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm
                           transition hover:bg-gray-800"
              >
                Annulla
              </button>
              <button
                onClick={() => doToggle(false)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium
                           transition hover:bg-red-500"
              >
                Disattiva
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
