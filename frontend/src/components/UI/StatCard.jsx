import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, trend, color = 'blue' }) {
  const colorStyles = {
    blue: 'border-blue-500/20 bg-blue-600/10 text-blue-400',
    purple: 'border-purple-500/20 bg-purple-600/10 text-purple-400',
    emerald: 'border-emerald-500/20 bg-emerald-600/10 text-emerald-400',
    amber: 'border-amber-500/20 bg-amber-600/10 text-amber-400',
    red: 'border-red-500/20 bg-red-600/10 text-red-400',
    cyan: 'border-cyan-500/20 bg-cyan-600/10 text-cyan-400',
  };

  return (
    <div className="glass-card rounded-xl p-5 relative overflow-hidden group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{title}</p>
          <h3 className="text-xl font-bold text-white mt-1 font-mono tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-xl border ${colorStyles[color]} transition-transform group-hover:scale-110`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-3 pt-2.5 border-t border-gray-800/80 flex items-center justify-between text-[11px]">
          <span className={trend.positive ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
            {trend.text}
          </span>
          <span className="text-gray-500">vs last month</span>
        </div>
      )}
    </div>
  );
}
