import type { ProductCheck } from '@/lib/ecom-storage';

export function CheckBadge({ check }: { check: ProductCheck }) {
  const pass = check.status === 'pass';
  return (
    <div
      className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs border ${
        pass
          ? 'bg-green-900/20 border-green-800/30'
          : 'bg-red-900/20 border-red-800/30'
      }`}
    >
      <span className={`mt-0.5 flex-shrink-0 ${pass ? 'text-green-400' : 'text-red-400'}`}>
        {pass ? '✓' : '✕'}
      </span>
      <div className="min-w-0">
        <div className={`font-medium ${pass ? 'text-green-300' : 'text-red-300'}`}>
          {check.name}
        </div>
        <div className="text-[10px] text-gray-400 truncate">{check.value}</div>
        {check.message && (
          <div className="text-[10px] text-red-400/80 mt-0.5">{check.message}</div>
        )}
      </div>
    </div>
  );
}

export function ChecksSummary({ checks }: { checks: ProductCheck[] }) {
  const passed = checks.filter((c) => c.status === 'pass').length;
  const total = checks.length;
  const allPassed = passed === total;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        allPassed
          ? 'bg-green-900/40 text-green-400'
          : 'bg-red-900/40 text-red-400'
      }`}
    >
      {allPassed ? '✓' : '⚠'} {passed}/{total}
    </span>
  );
}
