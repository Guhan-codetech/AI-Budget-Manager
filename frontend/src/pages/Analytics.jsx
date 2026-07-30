import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, Cpu, Zap, ShieldAlert, CheckCircle, ArrowUpRight } from 'lucide-react';
import StatCard from '../components/UI/StatCard';
import { useApp } from '../context/AppContext';
import api from '../services/api';

export default function Analytics() {
  const { refreshTrigger } = useApp();
  const [forecast, setForecast] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const [foreRes, anoRes, recoRes] = await Promise.all([
        api.get('/analytics/forecast'),
        api.get('/analytics/anomalies'),
        api.get('/analytics/recommendations'),
      ]);
      setForecast(foreRes.data);
      setAnomalies(anoRes.data);
      setRecommendations(recoRes.data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [refreshTrigger]);

  if (loading || !forecast) {
    return <div className="p-8 text-center text-xs text-gray-400">Loading AI Analytics Engine...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" /> AI Budget Forecasting & Anomaly Detection
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">Machine learning algorithms predicting future burn rate & detecting token anomalies</p>
      </div>

      {/* AI Prediction Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Projected Monthly Spend"
          value={`$${forecast.projected_monthly_spend.toLocaleString()}`}
          subtitle={`Total budget pool: $${forecast.total_monthly_budget.toLocaleString()}`}
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Daily Burn Rate"
          value={`$${forecast.daily_burn_rate.toFixed(2)}/day`}
          subtitle="Average consumption velocity"
          icon={Cpu}
          color="emerald"
        />
        <StatCard
          title="Budget Exhaustion Window"
          value={`${forecast.days_until_budget_exhausted} Days`}
          subtitle="Estimated time to depletion"
          icon={AlertTriangle}
          color={forecast.days_until_budget_exhausted < 15 ? 'red' : 'amber'}
        />
        <StatCard
          title="Current Month Spend"
          value={`$${forecast.current_month_spend.toLocaleString()}`}
          subtitle="Accumulated so far"
          icon={Zap}
          color="purple"
        />
      </div>

      {/* AI Intelligence Insights Box */}
      <div className="glass-panel p-5 rounded-2xl border border-blue-500/30 space-y-2">
        <h3 className="text-xs font-bold text-blue-400 tracking-wide uppercase flex items-center gap-2">
          <Zap className="w-4 h-4" /> AI Predictive Governance Insights
        </h3>
        <p className="text-xs text-gray-200 font-medium">{forecast.recommendation}</p>
      </div>

      {/* Anomaly Detection List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-200 tracking-wide uppercase flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" /> Abnormal Token Usage Spikes (Z-Score &gt; 2.0)
            </h3>
            <span className="text-[10px] text-gray-500 font-mono">{anomalies.length} Flagged Logs</span>
          </div>

          <div className="space-y-3">
            {anomalies.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">No statistical anomalies detected.</p>
            ) : (
              anomalies.map((a) => (
                <div key={a.usage_id} className="p-3 rounded-xl bg-gray-900/60 border border-gray-800 space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-200">{a.agent_name}</span>
                    <span className="font-mono text-red-400 font-bold">${a.cost.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-gray-400">
                    <span>Model: <strong className="text-gray-300 font-mono">{a.model}</strong></span>
                    <span className="font-mono text-amber-300">{a.tokens.toLocaleString()} tokens</span>
                  </div>
                  <p className="text-[10px] text-gray-500 italic mt-1">{a.anomaly_reason}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Model Optimization Suggestions */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-200 tracking-wide uppercase flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> Cost Savings Recommendations
            </h3>
            <span className="text-[10px] text-gray-500 font-mono">Auto Optimization</span>
          </div>

          <div className="space-y-3">
            {recommendations.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">All active agents are optimized.</p>
            ) : (
              recommendations.map((r) => (
                <div key={r.agent_id} className="p-3 rounded-xl bg-gray-900/60 border border-gray-800 space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-200">{r.agent_name}</span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/20 px-2 py-0.5 rounded">
                      ~{r.estimated_cost_reduction_pct}% Savings
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400">{r.action_suggested}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
