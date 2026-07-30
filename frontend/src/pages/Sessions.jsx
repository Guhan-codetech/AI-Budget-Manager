import React, { useState, useEffect } from 'react';
import { Activity, Power, Clock, Bot } from 'lucide-react';
import ProgressBar from '../components/UI/ProgressBar';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Sessions() {
  const { user } = useAuth();
  const { globalSearch, addToast, refreshTrigger } = useApp();
  const [sessions, setSessions] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const res = await api.get('/sessions');
      setSessions(res.data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [refreshTrigger]);

  const handleTerminate = async (sessionId) => {
    try {
      await api.post(`/sessions/${sessionId}/terminate`);
      addToast('Session Terminated', `Session #${sessionId} stopped immediately`, 'warning');
      fetchSessions();
    } catch (err) {
      addToast('Error', 'Failed to terminate session', 'critical');
    }
  };

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.agent_name.toLowerCase().includes(globalSearch.toLowerCase()) ||
      s.session_id.toString().includes(globalSearch);
    const matchesStatus = filterStatus === 'All' || s.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" /> Active Session Governance
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Real-time session monitoring & hard cap budget enforcement</p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-gray-900/80 border border-gray-800 p-1 rounded-xl">
          {['All', 'Running', 'Completed', 'Terminated', 'Closed'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filterStatus === st ? 'bg-blue-600 text-white shadow-glow-blue' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Sessions Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-900/60 text-[10px] uppercase tracking-wider text-gray-400 border-b border-gray-800">
              <tr>
                <th className="p-4">Session ID</th>
                <th className="p-4">Assigned AI Agent</th>
                <th className="p-4">Session Budget</th>
                <th className="p-4">Spent Budget</th>
                <th className="p-4">Remaining</th>
                <th className="p-4">Budget Meter</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {filteredSessions.map((s) => (
                <tr key={s.session_id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="p-4 font-mono font-bold text-blue-400">#{s.session_id}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-purple-400 shrink-0" />
                      <span className="font-semibold text-gray-200">{s.agent_name}</span>
                    </div>
                  </td>
                  <td className="p-4 font-mono font-bold text-gray-200">${s.session_budget.toFixed(2)}</td>
                  <td className="p-4 font-mono text-emerald-400 font-bold">${s.used_budget.toFixed(2)}</td>
                  <td className="p-4 font-mono text-blue-400 font-bold">${s.remaining_budget.toFixed(2)}</td>
                  <td className="p-4 w-48">
                    <ProgressBar percentage={s.budget_percentage} showLabel={false} height="h-2" />
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        s.status === 'Running'
                          ? 'bg-emerald-500/20 text-emerald-400 animate-pulse'
                          : s.status === 'Completed'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {s.status === 'Running' && (user?.role === 'Admin' || user?.role === 'Manager') && (
                      <button
                        onClick={() => handleTerminate(s.session_id)}
                        className="px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 text-[10px] font-bold flex items-center gap-1 transition-all"
                      >
                        <Power className="w-3 h-3" /> Terminate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
