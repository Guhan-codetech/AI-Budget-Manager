import React, { useState, useEffect } from 'react';
import { Search, Bell, Play, LogOut, Shield, ChevronDown, CheckCircle, AlertTriangle, RefreshCw, Radio } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import api from '../../services/api';

export default function Header() {
  const { user, logout } = useAuth();
  const { globalSearch, setGlobalSearch, setSimulatorOpen, triggerRefresh, autoStream, toggleLiveStream } = useApp();
  const [alerts, setAlerts] = useState([]);
  const [showAlertMenu, setShowAlertMenu] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAlerts = async () => {
    try {
      const res = await api.get('/alerts?is_resolved=false');
      setAlerts(res.data);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    triggerRefresh();
    fetchAlerts();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <header className="h-16 bg-[#0F172A]/90 backdrop-blur-md border-b border-gray-800/80 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Global Search */}
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Global search (Org, Team, Agent, Model, Provider)..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full bg-gray-900/80 border border-gray-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Real-Time Live Streaming Toggle Button */}
        <button
          onClick={toggleLiveStream}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
            autoStream
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-white'
          }`}
        >
          <Radio className={`w-3.5 h-3.5 ${autoStream ? 'animate-pulse text-emerald-400' : ''}`} />
          <span>{autoStream ? 'LIVE TRAFFIC ACTIVE' : 'Start Real-Time Stream'}</span>
        </button>

        {/* Refresh button */}
        <button
          onClick={handleRefresh}
          title="Refresh Data"
          className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
        </button>

        {/* Live Simulator Launcher */}
        <button
          onClick={() => setSimulatorOpen(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs shadow-glow-blue transition-all"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Simulate AI Request</span>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowAlertMenu(!showAlertMenu)}
            className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition-all relative"
          >
            <Bell className="w-4 h-4" />
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                {alerts.length > 99 ? '99+' : alerts.length}
              </span>
            )}
          </button>

          {/* Alerts Dropdown */}
          {showAlertMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-[#111827] border border-gray-800 rounded-xl shadow-2xl p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Active Policy Alerts
                </span>
                <span className="text-[10px] text-gray-400 font-mono">{alerts.length} pending</span>
              </div>
              <div className="max-h-64 overflow-y-auto my-2 space-y-2">
                {alerts.length === 0 ? (
                  <p className="text-xs text-gray-500 py-4 text-center">No active unresolved alerts</p>
                ) : (
                  alerts.slice(0, 5).map((a) => (
                    <div key={a.alert_id} className="p-2 rounded-lg bg-gray-900/60 border border-gray-800/80 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                          a.severity === 'Critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {a.severity}
                        </span>
                        <span className="text-[9px] text-gray-500">{new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-[11px] text-gray-300 line-clamp-2">{a.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Logout */}
        <div className="h-6 w-px bg-gray-800"></div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs font-medium transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
