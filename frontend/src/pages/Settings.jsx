import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Sliders, DollarSign, Key, Save, Lock, Sparkles, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Settings() {
  const { user } = useAuth();
  const { addToast } = useApp();
  const [settings, setSettings] = useState(null);
  const [modelPricing, setModelPricing] = useState({});
  const [apiKeys, setApiKeys] = useState({ openai: '', anthropic: '', google: '', deepseek: '' });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const [setRes, keyRes] = await Promise.all([
        api.get('/settings'),
        api.get('/llm/api-keys'),
      ]);
      setSettings(setRes.data.settings);
      setModelPricing(setRes.data.model_pricing);
      setApiKeys(keyRes.data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await api.put('/settings', settings);
      addToast('Settings Updated', 'Policy threshold rules saved.', 'success');
    } catch (err) {
      addToast('Error', err.response?.data?.message || 'Save failed', 'critical');
    }
  };

  const handleSaveApiKeys = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/llm/api-keys', apiKeys);
      addToast('API Keys Saved', res.data.message, 'success');
      fetchSettings();
    } catch (err) {
      addToast('Error', 'Failed to save API Keys', 'critical');
    }
  };

  if (loading || !settings) {
    return <div className="p-8 text-center text-xs text-gray-400">Loading Governance Settings...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-blue-400" /> Platform Governance & Real LLM Integration
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">Configure real LLM provider API keys, policy thresholds, and rate pricing matrices</p>
      </div>

      {/* Real LLM API Keys Section */}
      <div className="glass-card rounded-2xl p-6 space-y-4 border border-blue-500/30">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-200 tracking-wide uppercase flex items-center gap-2">
            <Key className="w-4 h-4 text-purple-400" /> Real Provider API Keys (OpenAI, Anthropic, Google, DeepSeek)
          </h3>
          <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Live AI Execution Ready
          </span>
        </div>

        <form onSubmit={handleSaveApiKeys} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">OpenAI API Key (sk-...)</label>
              <input
                type="password"
                placeholder="sk-proj-..."
                value={apiKeys.openai}
                onChange={(e) => setApiKeys({ ...apiKeys, openai: e.target.value })}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Anthropic API Key (sk-ant-...)</label>
              <input
                type="password"
                placeholder="sk-ant-..."
                value={apiKeys.anthropic}
                onChange={(e) => setApiKeys({ ...apiKeys, anthropic: e.target.value })}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Google Gemini API Key (AIzaSy...)</label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={apiKeys.google}
                onChange={(e) => setApiKeys({ ...apiKeys, google: e.target.value })}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">DeepSeek API Key (sk-...)</label>
              <input
                type="password"
                placeholder="sk-..."
                value={apiKeys.deepseek}
                onChange={(e) => setApiKeys({ ...apiKeys, deepseek: e.target.value })}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-sm"
          >
            <Lock className="w-4 h-4" /> Save API Keys
          </button>
        </form>
      </div>

      {/* Policy Threshold Settings */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="glass-card rounded-2xl p-6 space-y-5">
          <h3 className="text-xs font-bold text-gray-200 tracking-wide uppercase flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-400" /> Policy Engine Automatic Rules
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-gray-300 font-semibold">Soft Warning Alert Threshold</span>
                <span className="font-mono text-amber-400 font-bold">{settings.warning_threshold}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="90"
                value={settings.warning_threshold}
                onChange={(e) => setSettings({ ...settings, warning_threshold: Number(e.target.value) })}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-gray-300 font-semibold">High Priority Alert & Fallback Suggestion</span>
                <span className="font-mono text-orange-400 font-bold">{settings.critical_threshold}%</span>
              </div>
              <input
                type="range"
                min="60"
                max="95"
                value={settings.critical_threshold}
                onChange={(e) => setSettings({ ...settings, critical_threshold: Number(e.target.value) })}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-gray-300 font-semibold">Request Block & Session Termination</span>
                <span className="font-mono text-red-400 font-bold">{settings.block_threshold}%</span>
              </div>
              <input
                type="range"
                min="90"
                max="100"
                value={settings.block_threshold}
                onChange={(e) => setSettings({ ...settings, block_threshold: Number(e.target.value) })}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>
          </div>
        </div>

        {/* Model Pricing Rate Matrix */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h3 className="text-xs font-bold text-gray-200 tracking-wide uppercase flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" /> LLM Model Pricing Rates (per 1K Tokens)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-900/60 text-[10px] uppercase text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="p-3">Model</th>
                  <th className="p-3">Provider</th>
                  <th className="p-3">Input Cost / 1k Tok</th>
                  <th className="p-3">Output Cost / 1k Tok</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 font-mono">
                {Object.entries(modelPricing).map(([mName, data]) => (
                  <tr key={mName} className="hover:bg-gray-800/30">
                    <td className="p-3 font-bold text-blue-400">{mName}</td>
                    <td className="p-3 text-gray-300 font-sans">{data.provider}</td>
                    <td className="p-3 text-emerald-400">${data.input}</td>
                    <td className="p-3 text-emerald-400">${data.output}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {user?.role === 'Admin' && (
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-glow-blue transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Governance Rules
          </button>
        )}
      </form>
    </div>
  );
}
