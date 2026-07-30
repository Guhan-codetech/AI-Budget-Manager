import React, { useState, useEffect } from 'react';
import { Bot, Plus, Edit2, Zap, ArrowRightLeft, ShieldAlert, Cpu } from 'lucide-react';
import ProgressBar from '../components/UI/ProgressBar';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function AIAgents() {
  const { user } = useAuth();
  const { globalSearch, addToast, refreshTrigger } = useApp();
  const [agents, setAgents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [formData, setFormData] = useState({
    team_id: '',
    agent_name: '',
    preferred_model: 'gpt-4o',
    fallback_model: 'gpt-4o-mini',
    monthly_budget: 500,
  });

  const fetchData = async () => {
    try {
      const [agentsRes, teamsRes, recoRes] = await Promise.all([
        api.get('/agents'),
        api.get('/teams'),
        api.get('/analytics/recommendations'),
      ]);
      setAgents(agentsRes.data);
      setTeams(teamsRes.data);
      setRecommendations(recoRes.data);
      if (teamsRes.data.length > 0) {
        setFormData((prev) => ({ ...prev, team_id: teamsRes.data[0].team_id }));
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);

  const handleSwitchModel = async (agentId, agentName) => {
    try {
      const res = await api.post(`/agents/${agentId}/switch-model`);
      addToast('Model Switched', res.data.message, 'success');
      fetchData();
    } catch (err) {
      addToast('Error', 'Failed to switch model', 'critical');
    }
  };

  const handleOpenCreate = () => {
    setEditingAgent(null);
    setFormData({
      team_id: teams.length > 0 ? teams[0].team_id : '',
      agent_name: '',
      preferred_model: 'gpt-4o',
      fallback_model: 'gpt-4o-mini',
      monthly_budget: 500,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (agent) => {
    setEditingAgent(agent);
    setFormData({
      team_id: agent.team_id,
      agent_name: agent.agent_name,
      preferred_model: agent.preferred_model,
      fallback_model: agent.fallback_model,
      monthly_budget: agent.monthly_budget,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAgent) {
        await api.put(`/agents/${editingAgent.agent_id}`, formData);
        addToast('Agent Updated', `Updated agent ${formData.agent_name}`, 'success');
      } else {
        await api.post('/agents', formData);
        addToast('Agent Created', `Created agent ${formData.agent_name}`, 'success');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      addToast('Error', err.response?.data?.message || 'Operation failed', 'critical');
    }
  };

  const filteredAgents = agents.filter(
    (a) =>
      a.agent_name.toLowerCase().includes(globalSearch.toLowerCase()) ||
      a.preferred_model.toLowerCase().includes(globalSearch.toLowerCase()) ||
      a.team_name.toLowerCase().includes(globalSearch.toLowerCase()) ||
      a.organization_name.toLowerCase().includes(globalSearch.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-400" /> AI Agent Governance & Optimization
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Manage agent preferred & fallback models, monthly budget limits and statuses</p>
        </div>
        {(user?.role === 'Admin' || user?.role === 'Manager') && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-glow-blue transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create AI Agent</span>
          </button>
        )}
      </div>

      {/* Model Recommendations Banner */}
      {recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-gray-900 border border-amber-500/30 p-4 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
            <Zap className="w-4 h-4" /> Model Fallback Savings Recommendations ({recommendations.length})
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recommendations.slice(0, 4).map((r) => (
              <div key={r.agent_id} className="p-3 rounded-xl bg-gray-900/80 border border-gray-800 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-gray-200">{r.agent_name}</p>
                  <p className="text-[11px] text-gray-400">
                    Switch from <span className="text-amber-300 font-mono">{r.current_model}</span> → <span className="text-emerald-300 font-mono">{r.recommended_fallback}</span>
                  </p>
                  <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">Save ~{r.estimated_cost_reduction_pct}% on tokens</p>
                </div>
                {(user?.role === 'Admin' || user?.role === 'Manager') && (
                  <button
                    onClick={() => handleSwitchModel(r.agent_id, r.agent_name)}
                    className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 text-[11px] font-semibold flex items-center gap-1 transition-all"
                  >
                    <ArrowRightLeft className="w-3 h-3" /> Switch Model
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAgents.map((agent) => (
          <div key={agent.agent_id} className="glass-card rounded-2xl p-5 space-y-4 relative group">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      agent.status === 'Active'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : agent.status === 'Blocked'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {agent.status}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono truncate">{agent.team_name}</span>
                </div>
                <h3 className="font-bold text-sm text-white mt-1.5">{agent.agent_name}</h3>
              </div>
              {(user?.role === 'Admin' || user?.role === 'Manager') && (
                <button
                  onClick={() => handleOpenEdit(agent)}
                  className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-blue-400 opacity-80 group-hover:opacity-100 transition-opacity"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Model Badges */}
            <div className="p-2.5 rounded-xl bg-gray-900/60 border border-gray-800 space-y-1 text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Preferred Model:</span>
                <span className="font-mono text-blue-400 font-bold bg-blue-600/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                  {agent.preferred_model}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Fallback Model:</span>
                <span className="font-mono text-purple-400 font-bold bg-purple-600/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                  {agent.fallback_model}
                </span>
              </div>
            </div>

            {/* Budget Meter */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Used Budget</span>
                <span className="font-mono font-bold text-emerald-400">${agent.used_budget.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Remaining</span>
                <span className="font-mono font-bold text-blue-400">${agent.remaining_budget.toFixed(2)}</span>
              </div>
            </div>

            <ProgressBar percentage={agent.budget_percentage} />
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">{editingAgent ? 'Edit AI Agent' : 'Create AI Agent'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Parent Team</label>
                <select
                  value={formData.team_id}
                  onChange={(e) => setFormData({ ...formData, team_id: Number(e.target.value) })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
                >
                  {teams.map((t) => (
                    <option key={t.team_id} value={t.team_id}>
                      {t.team_name} ({t.organization_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Agent Name</label>
                <input
                  type="text"
                  required
                  value={formData.agent_name}
                  onChange={(e) => setFormData({ ...formData, agent_name: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Preferred Model</label>
                  <select
                    value={formData.preferred_model}
                    onChange={(e) => setFormData({ ...formData, preferred_model: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                    <option value="claude-3-opus">Claude 3 Opus</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                    <option value="deepseek-r1">DeepSeek R1</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Fallback Model</label>
                  <select
                    value={formData.fallback_model}
                    onChange={(e) => setFormData({ ...formData, fallback_model: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="gpt-4o-mini">GPT-4o-mini</option>
                    <option value="claude-3-haiku">Claude 3 Haiku</option>
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Monthly Budget Cap ($ USD)</label>
                <input
                  type="number"
                  required
                  min="10"
                  step="50"
                  value={formData.monthly_budget}
                  onChange={(e) => setFormData({ ...formData, monthly_budget: parseFloat(e.target.value) })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-1/2 py-2 rounded-xl bg-gray-800 text-gray-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-glow-blue"
                >
                  Save Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
