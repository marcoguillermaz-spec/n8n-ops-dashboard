'use client';

import { useState } from 'react';
import TutoringWorkflowPanel from './TutoringWorkflowPanel';
import TutoringDataTable from './TutoringDataTable';
import { TUTORING_TABS } from '@/lib/tutoring-config';

export default function TutoringSection() {
  const [activeTab, setActiveTab] = useState(TUTORING_TABS[0].id);
  const [dataExpanded, setDataExpanded] = useState(true);

  const currentTab = TUTORING_TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="space-y-4">
      {/* ━━ ACCORDION 1 — Monitoraggio Workflow ━━━━━━ */}
      <TutoringWorkflowPanel />

      {/* ━━ ACCORDION 2 — Dati Tutoring ━━━━━━━━━━━━━ */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900/50">
        {/* Header */}
        <button
          onClick={() => setDataExpanded((v) => !v)}
          className="flex w-full items-center justify-between px-6 py-4 text-left transition hover:bg-gray-800/30 rounded-2xl"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">📋</span>
            <div>
              <h3 className="text-sm font-semibold text-gray-100">
                Dati Tutoring
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {currentTab.label}
              </p>
            </div>
          </div>
          <span className={`text-gray-500 transition-transform ${dataExpanded ? 'rotate-180' : ''}`}>
            ▾
          </span>
        </button>

        {/* Content */}
        {dataExpanded && (
          <div className="border-t border-gray-800 px-6 py-6 space-y-5">
            {/* Sub-tab selector */}
            <div className="flex gap-1 rounded-xl bg-gray-900 border border-gray-800 p-1 w-fit">
              {TUTORING_TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition ${
                    activeTab === t.id
                      ? 'bg-gray-800 text-white shadow'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Data table */}
            <TutoringDataTable tabId={activeTab} />
          </div>
        )}
      </div>
    </div>
  );
}
