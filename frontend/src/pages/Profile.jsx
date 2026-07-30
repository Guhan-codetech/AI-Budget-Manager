import React from 'react';
import { User, ShieldCheck, Key, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, token } = useAuth();

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <User className="w-5 h-5 text-blue-400" /> User Profile & Security Credentials
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">Manage your user identity, active RBAC permissions, and API tokens</p>
      </div>

      <div className="glass-card rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold text-2xl">
            {user?.username?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{user?.username}</h2>
            <p className="text-xs text-gray-400">{user?.email}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-[10px] font-bold uppercase">
              {user?.role} Role
            </span>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-5 space-y-3">
          <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wide flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Assigned Governance Permissions ({user?.role})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 text-gray-300">
              <CheckCircle className="w-4 h-4 text-emerald-400" /> View Organizations & Teams
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <CheckCircle className="w-4 h-4 text-emerald-400" /> Live AI Telemetry Dashboard
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <CheckCircle className="w-4 h-4 text-emerald-400" /> Generate Executive Reports
            </div>
            {user?.role !== 'Viewer' && (
              <>
                <div className="flex items-center gap-2 text-gray-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> Manage Team & Agent Budgets
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> Switch Fallback Models
                </div>
              </>
            )}
            {user?.role === 'Admin' && (
              <div className="flex items-center gap-2 text-gray-300">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> Configure Global Policy Rules
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-800 pt-5 space-y-2">
          <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wide flex items-center gap-2">
            <Key className="w-4 h-4 text-purple-400" /> Active Bearer JWT Token
          </h3>
          <pre className="p-3 bg-gray-950 rounded-xl text-[11px] text-gray-400 font-mono overflow-x-auto border border-gray-800">
            {token}
          </pre>
        </div>
      </div>
    </div>
  );
}
