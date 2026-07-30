import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2, DollarSign, Users, AlertCircle } from 'lucide-react';
import ProgressBar from '../components/UI/ProgressBar';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Organizations() {
  const { user } = useAuth();
  const { globalSearch, addToast, refreshTrigger } = useApp();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [formData, setFormData] = useState({ organization_name: '', monthly_budget: 15000 });

  const fetchOrgs = async () => {
    try {
      const res = await api.get('/organizations');
      setOrganizations(res.data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, [refreshTrigger]);

  const handleOpenCreate = () => {
    setEditingOrg(null);
    setFormData({ organization_name: '', monthly_budget: 15000 });
    setShowModal(true);
  };

  const handleOpenEdit = (org) => {
    setEditingOrg(org);
    setFormData({ organization_name: org.organization_name, monthly_budget: org.monthly_budget });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingOrg) {
        await api.put(`/organizations/${editingOrg.organization_id}`, formData);
        addToast('Organization Updated', `Updated budget for ${formData.organization_name}`, 'success');
      } else {
        await api.post('/organizations', formData);
        addToast('Organization Created', `Created organization ${formData.organization_name}`, 'success');
      }
      setShowModal(false);
      fetchOrgs();
    } catch (err) {
      addToast('Error', err.response?.data?.message || 'Operation failed', 'critical');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await api.delete(`/organizations/${id}`);
      addToast('Organization Deleted', `Deleted ${name}`, 'info');
      fetchOrgs();
    } catch (err) {
      addToast('Error', 'Failed to delete organization', 'critical');
    }
  };

  const filteredOrgs = organizations.filter((o) =>
    o.organization_name.toLowerCase().includes(globalSearch.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" /> Organization Budget Governance
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Manage top-level organizational budgets and team allocations</p>
        </div>
        {user?.role === 'Admin' && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-glow-blue transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Organization</span>
          </button>
        )}
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredOrgs.map((org) => (
          <div key={org.organization_id} className="glass-card rounded-2xl p-5 space-y-4 relative group">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors">{org.organization_name}</h3>
                <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                  <Users className="w-3 h-3 text-blue-400" /> {org.teams_count} Active Teams
                </span>
              </div>
              {user?.role === 'Admin' && (
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenEdit(org)}
                    className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(org.organization_id, org.organization_name)}
                    className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-medium">Monthly Allocation</span>
                <span className="font-mono font-bold text-white">${org.monthly_budget.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-medium">Spent Budget</span>
                <span className="font-mono text-emerald-400 font-bold">${org.used_budget.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-medium">Remaining Budget</span>
                <span className="font-mono text-blue-400 font-bold">${org.remaining_budget.toLocaleString()}</span>
              </div>
            </div>

            <ProgressBar percentage={org.budget_percentage} />
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">
              {editingOrg ? 'Edit Organization Budget' : 'Create Organization'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Organization Name</label>
                <input
                  type="text"
                  required
                  value={formData.organization_name}
                  onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Monthly Budget Cap ($ USD)</label>
                <input
                  type="number"
                  required
                  min="100"
                  step="500"
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
                  Save Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
