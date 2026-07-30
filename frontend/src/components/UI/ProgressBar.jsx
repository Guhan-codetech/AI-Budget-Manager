import React from 'react';

export default function ProgressBar({ percentage, showLabel = true, height = 'h-2' }) {
  const pct = Math.min(100, Math.max(0, percentage || 0));

  let colorClass = 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
  if (pct >= 90) {
    colorClass = 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]';
  } else if (pct >= 80) {
    colorClass = 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]';
  }

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1 text-[11px]">
          <span className="text-gray-400 font-medium">Used Budget</span>
          <span className={`font-mono font-bold ${pct >= 90 ? 'text-red-400' : pct >= 80 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {pct.toFixed(1)}%
          </span>
        </div>
      )}
      <div className={`w-full bg-gray-800 rounded-full overflow-hidden ${height}`}>
        <div
          className={`${height} ${colorClass} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${pct}%` }}
        ></div>
      </div>
    </div>
  );
}
