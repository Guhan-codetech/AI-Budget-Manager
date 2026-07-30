import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Bot, Building2 } from 'lucide-react';
import ProgressBar from '../components/UI/ProgressBar';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Teams() {
  const { user } = useAuth();
  const { globalSearch, addToast, refreshTrigger } = useApp();
  const [teams, setTeams] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [formData, setFormData] = useState({ organization_id: '', team_name: '', monthly_budget: 5000 });

  const fetchData = async () => {
    try {
      const [teamsRes, orgsRes] = await Promise.all([
        api.get('/teams'),
        api.get('/organizations'),
      ]);
      setTeams(teamsRes.data);
      setOrganizations(orgsRes.data);
      if (orgsRes.data.length > 0) {
        setFormData((prev) => ({ ...prev, organization_id: orgsRes.data[0].organization_id }));
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

  const handleOpenCreate = () => {
    setEditingTeam(null);
    setFormData({
      organization_id: organizations.length > 0 ? organizations[0].organization_id : '',
      team_name: '',
      monthly_budget: 5000,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (team) => {
    setEditingTeam(team);
    setFormData({
      organization_id: team.organization_id,
      team_name: team.team_name,
      monthly_budget: team.monthly_budget,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTeam) {
        await api.put(`/teams/${editingTeam.team_id}`, formData);
        addToast('Team Updated', `Updated budget for ${formData.team_name}`, 'success');
      } else {
        await api.post('/teams', formData);
        addToast('Team Created', `Created team ${formData.team_name}`, 'success');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      addToast('Error', err.response?.data?.message || 'Operation failed', 'critical');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await api.delete(`/teams/${id}`);
      addToast('Team Deleted', `Deleted ${name}`, 'info');
      fetchData();
    } catch (err) {
      addToast('Error', 'Failed to delete team', 'critical');
    }
  };

  const filteredTeams = teams.filter(
    (t) =>
      t.team_name.toLowerCase().includes(globalSearch.toLowerCase()) ||
      t.organization_name.toLowerCase().includes(globalSearch.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" /> Team Budget Allocations
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Manage team-level AI cost caps and active agent counts</p>
        </div>
        {(user?.role === 'Admin' || user?.role === 'Manager') && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-glow-blue transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Team</span>
          </button>
        )}
      </div>

      {/* Grid of Teams */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTeams.map((t) => (
          <div key={t.team_id} className="glass-card rounded-2xl p-5 space-y-4 relative group">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider bg-blue-600/10 px-2 py-0.5 rounded border border-blue-500/20">
                  {t.organization_name}
                </span>
                <h3 className="font-bold text-sm text-white mt-1.5">{t.team_name}</h3>
                <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-1">
                  <Bot className="w-3 h-3 text-purple-400" /> {t.agents_count} Assigned AI Agents
                </span>
              </div>
              {(user?.role === 'Admin' || user?.role === 'Manager') && (
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenEdit(t)}
                    className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {user?.role === 'Admin' && (
                    <button
                      onClick={() => handleDelete(t.team_id, t.team_name)}
                      className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-medium">Monthly Allocation</span>
                <span className="font-mono font-bold text-white">${t.monthly_budget.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-medium">Used Budget</span>
                <span className="font-mono text-emerald-400 font-bold">${t.used_budget.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-medium">Remaining</span>
                <span className="font-mono text-blue-400 font-bold">${t.remaining_budget.toLocaleString()}</span>
              </div>
            </div>

            <ProgressBar percentage={t.budget_percentage} />
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">{editingTeam ? 'Edit Team' : 'Create Team'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Parent Organization</label>
                <select
                  value={formData.organization_id}
                  onChange={(e) => setFormData({ ...formData, organization_id: Number(e.target.value) })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
                >
                  {organizations.map((o) => (
                    <option key={o.organization_id} value={o.organization_id}>
                      {o.organization_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Team Name</label>
                <input
                  type="text"
                  required
                  value={formData.team_name}
                  onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Monthly Budget Cap ($ USD)</label>
                <input
                  type="number"
                  required
                  min="50"
                  step="100"
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
                  Save Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
