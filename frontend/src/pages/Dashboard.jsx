import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Activity,
  Bot,
  AlertTriangle,
  ShieldBan,
  Receipt,
  Cpu,
  ArrowUpRight,
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import StatCard from '../components/UI/StatCard';
import ProgressBar from '../components/UI/ProgressBar';
import { useApp } from '../context/AppContext';
import api from '../services/api';

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4'];

export default function Dashboard() {
  const { refreshTrigger, setSimulatorOpen } = useApp();
  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [sumRes, chartRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/dashboard/charts'),
      ]);
      setSummary(sumRes.data.kpis);
      setCharts(chartRes.data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);

  if (loading || !summary || !charts) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-gray-800 rounded-lg w-1/4"></div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-gray-800/60 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const budgetUsedPct = summary.total_organization_budget > 0
    ? (summary.used_budget / summary.total_organization_budget) * 100
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-500/20 p-5 rounded-2xl shadow-glass">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            AI Cost Governance Center <Sparkles className="w-4 h-4 text-blue-400" />
          </h1>
          <p className="text-xs text-gray-400 mt-1">Real-time LLM telemetry, multi-tier budget tracking & policy enforcement</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSimulatorOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-glow-blue transition-all flex items-center gap-2"
          >
            <Cpu className="w-4 h-4" />
            <span>Simulate API Deduction</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Organization Budget"
          value={`$${summary.total_organization_budget.toLocaleString()}`}
          subtitle={`Remaining: $${summary.remaining_budget.toLocaleString()}`}
          icon={DollarSign}
          color="blue"
        />
        <StatCard
          title="Used Budget (Month-to-Date)"
          value={`$${summary.used_budget.toLocaleString()}`}
          subtitle={`${budgetUsedPct.toFixed(1)}% of total pool`}
          icon={TrendingUp}
          color={budgetUsedPct > 80 ? 'amber' : 'purple'}
        />
        <StatCard
          title="Today's Spending"
          value={`$${summary.today_spending.toFixed(2)}`}
          subtitle={`Avg/req: $${summary.average_cost_per_request}`}
          icon={Receipt}
          color="emerald"
        />
        <StatCard
          title="Active Telemetry"
          value={`${summary.running_sessions} Sessions`}
          subtitle={`${summary.active_ai_agents} Active AI Agents`}
          icon={Activity}
          color="cyan"
        />
      </div>

      {/* Second KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Budget Warnings"
          value={summary.budget_warnings}
          subtitle="Active policy alerts (>80% usage)"
          icon={AlertTriangle}
          color="amber"
        />
        <StatCard
          title="Blocked API Requests"
          value={summary.blocked_requests}
          subtitle="Enforced limit rejections"
          icon={ShieldBan}
          color="red"
        />
        <StatCard
          title="Total Token Consumption"
          value={summary.total_tokens.toLocaleString()}
          subtitle="Input + Output Tokens"
          icon={Cpu}
          color="blue"
        />
      </div>

      {/* Budget Progress Bar */}
      <div className="glass-panel p-5 rounded-2xl space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-gray-200">Global Organization Budget Allocation</span>
          <span className="font-mono text-gray-400">
            ${summary.used_budget.toLocaleString()} / ${summary.total_organization_budget.toLocaleString()}
          </span>
        </div>
        <ProgressBar percentage={budgetUsedPct} showLabel={false} height="h-3" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Spending Trend */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-200 tracking-wide uppercase">Daily Spending Trend (Last 14 Days)</h3>
            <span className="text-[10px] font-mono text-blue-400 bg-blue-600/10 px-2 py-0.5 rounded border border-blue-500/20">USD ($)</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.daily_spending}>
                <defs>
                  <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="date" stroke="#6B7280" fontSize={10} tickLine={false} />
                <YAxis stroke="#6B7280" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="spending" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorSpend)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Team Budget Comparison */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-200 tracking-wide uppercase">Top Teams Budget Utilization</h3>
            <span className="text-[10px] font-mono text-gray-400">Used vs Limit</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.team_comparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="team_name" stroke="#6B7280" fontSize={10} tickLine={false} />
                <YAxis stroke="#6B7280" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Bar dataKey="used_budget" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Used Budget ($)" />
                <Bar dataKey="monthly_budget" fill="#1F2937" radius={[4, 4, 0, 0]} name="Allocated Budget ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Model Distribution & Top Agents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Model Usage Distribution */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-gray-200 tracking-wide uppercase">Model Usage Distribution</h3>
          <div className="h-52 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.model_distribution}
                  dataKey="requests"
                  nameKey="model"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {charts.model_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.75rem', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-800 text-[11px]">
            {charts.model_distribution.map((m, idx) => (
              <div key={m.model} className="flex items-center gap-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                <span className="text-gray-300 truncate">{m.model}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Spending AI Agents */}
        <div className="glass-card rounded-2xl p-5 space-y-3 lg:col-span-2">
          <h3 className="text-xs font-bold text-gray-200 tracking-wide uppercase">Top Spending AI Agents</h3>
          <div className="space-y-2.5">
            {charts.top_agents.map((agent) => {
              const pct = (agent.used_budget / agent.monthly_budget) * 100;
              return (
                <div key={agent.agent_name} className="p-3 rounded-xl bg-gray-900/60 border border-gray-800/80 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-gray-200">{agent.agent_name}</span>
                    <span className="font-mono text-blue-400 font-bold">${agent.used_budget.toFixed(2)} / ${agent.monthly_budget.toFixed(2)}</span>
                  </div>
                  <ProgressBar percentage={pct} showLabel={false} height="h-1.5" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent API Requests */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-200 tracking-wide uppercase">Recent API Requests</h3>
            <span className="text-[10px] text-gray-400 font-mono">Live Logs</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase tracking-wider text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="pb-2">Agent</th>
                  <th className="pb-2">Model</th>
                  <th className="pb-2">Tokens</th>
                  <th className="pb-2">Cost</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {charts.recent_requests.map((r) => (
                  <tr key={r.usage_id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-2.5 font-medium text-gray-200">{r.agent_name}</td>
                    <td className="py-2.5 font-mono text-gray-400 text-[11px]">{r.model}</td>
                    <td className="py-2.5 font-mono text-gray-400">{r.tokens}</td>
                    <td className="py-2.5 font-mono font-bold text-emerald-400">${r.cost.toFixed(4)}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.status === 'Success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-200 tracking-wide uppercase">Policy Alerts Feed</h3>
            <span className="text-[10px] text-gray-400 font-mono">Real-time Alerts</span>
          </div>
          <div className="space-y-2.5">
            {charts.recent_alerts.map((a) => (
              <div key={a.alert_id} className="p-3 rounded-xl bg-gray-900/60 border border-gray-800/80 flex items-start gap-3">
                <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                  a.severity === 'Critical' ? 'text-red-400' : 'text-amber-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-200">{a.alert_type}</span>
                    <span className="text-[10px] text-gray-500 font-mono">{new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate">{a.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
