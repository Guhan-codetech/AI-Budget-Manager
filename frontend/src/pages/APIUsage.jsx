import React, { useState, useEffect } from 'react';
import { Receipt, Search, Filter, Cpu, CheckCircle, ShieldBan, Eye } from 'lucide-react';
import { useApp } from '../context/AppContext';
import api from '../services/api';

export default function APIUsage() {
  const { globalSearch, refreshTrigger } = useApp();
  const [logs, setLogs] = useState([]);
  const [modelFilter, setModelFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/usage?limit=300');
      setLogs(res.data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [refreshTrigger]);

  const filteredLogs = logs.filter((l) => {
    const s = globalSearch.toLowerCase();
    const matchesSearch =
      !s ||
      l.agent_name.toLowerCase().includes(s) ||
      l.model.toLowerCase().includes(s) ||
      l.provider.toLowerCase().includes(s) ||
      l.organization_name.toLowerCase().includes(s) ||
      l.team_name.toLowerCase().includes(s);

    const matchesModel = !modelFilter || l.model === modelFilter;
    const matchesProvider = !providerFilter || l.provider === providerFilter;
    const matchesStatus = !statusFilter || l.status === statusFilter;

    return matchesSearch && matchesModel && matchesProvider && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-400" /> API Request Audit Telemetry
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Granular token consumption & cost audit trail across all LLM providers</p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Provider */}
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Providers</option>
            <option value="OpenAI">OpenAI</option>
            <option value="Anthropic">Anthropic</option>
            <option value="Google">Google</option>
            <option value="DeepSeek">DeepSeek</option>
          </select>

          {/* Model */}
          <select
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Models</option>
            <option value="gpt-4o">gpt-4o</option>
            <option value="gpt-4">gpt-4</option>
            <option value="gpt-4o-mini">gpt-4o-mini</option>
            <option value="claude-3-5-sonnet">claude-3-5-sonnet</option>
            <option value="gemini-1.5-pro">gemini-1.5-pro</option>
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="Success">Success</option>
            <option value="Blocked">Blocked</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-900/60 text-[10px] uppercase tracking-wider text-gray-400 border-b border-gray-800">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Agent & Organization</th>
                <th className="p-4">Provider / Model</th>
                <th className="p-4">Input Tokens</th>
                <th className="p-4">Output Tokens</th>
                <th className="p-4">Total Tokens</th>
                <th className="p-4">Request Cost</th>
                <th className="p-4">Status</th>
                <th className="p-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {filteredLogs.map((l) => (
                <tr key={l.usage_id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="p-4 font-mono text-[11px] text-gray-400">
                    {new Date(l.request_time).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-gray-200">{l.agent_name}</div>
                    <div className="text-[10px] text-gray-500">{l.organization_name} • {l.team_name}</div>
                  </td>
                  <td className="p-4">
                    <span className="font-mono text-blue-400 font-bold bg-blue-600/10 px-2 py-0.5 rounded border border-blue-500/20">
                      {l.provider} / {l.model}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-gray-400">{l.input_tokens.toLocaleString()}</td>
                  <td className="p-4 font-mono text-gray-400">{l.output_tokens.toLocaleString()}</td>
                  <td className="p-4 font-mono font-bold text-gray-200">{l.tokens.toLocaleString()}</td>
                  <td className="p-4 font-mono font-bold text-emerald-400">${l.cost.toFixed(5)}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        l.status === 'Success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {l.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => setSelectedLog(l)}
                      className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-blue-400 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Detail Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-800">
              <h3 className="text-sm font-bold text-white font-mono">API Log Payload #{selectedLog.usage_id}</h3>
              <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <pre className="p-4 bg-gray-950 rounded-xl text-xs text-blue-300 font-mono overflow-x-auto border border-gray-800 max-h-80">
              {JSON.stringify(selectedLog, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
