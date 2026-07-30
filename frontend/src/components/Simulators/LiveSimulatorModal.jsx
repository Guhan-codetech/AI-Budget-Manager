import React, { useState, useEffect } from 'react';
import { X, Play, Cpu, CheckCircle2, AlertTriangle, ShieldAlert, Sparkles, RefreshCw, MessageSquare } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import api from '../../services/api';

export default function LiveSimulatorModal() {
  const { simulatorOpen, setSimulatorOpen, addToast, triggerRefresh } = useApp();
  const [agents, setAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [mode, setMode] = useState('real'); // 'real' prompt mode or 'simulation' token mode
  const [promptText, setPromptText] = useState('Write a concise 2-sentence summary of enterprise AI cost governance benefits.');
  const [inputTokens, setInputTokens] = useState(1500);
  const [outputTokens, setOutputTokens] = useState(600);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (simulatorOpen) {
      api.get('/agents').then((res) => {
        setAgents(res.data);
        if (res.data.length > 0) {
          setSelectedAgentId(res.data[0].agent_id);
          setSelectedModel(res.data[0].preferred_model);
        }
      });
    }
  }, [simulatorOpen]);

  const handleAgentChange = (e) => {
    const agentId = Number(e.target.value);
    setSelectedAgentId(agentId);
    const agent = agents.find((a) => a.agent_id === agentId);
    if (agent) {
      setSelectedModel(agent.preferred_model);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      let res;
      if (mode === 'real') {
        res = await api.post('/llm/chat', {
          agent_id: selectedAgentId,
          model: selectedModel,
          prompt: promptText
        });
      } else {
        res = await api.post('/usage/simulate', {
          agent_id: selectedAgentId,
          model: selectedModel,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
        });
      }

      setResult(res.data);
      triggerRefresh();

      if (res.data.allowed) {
        addToast(
          'API Request Processed',
          `Deducted $${res.data.cost} for ${res.data.tokens || res.data.input_tokens + res.data.output_tokens} tokens using ${selectedModel}.`,
          'success'
        );
        if (res.data.policy_triggers && res.data.policy_triggers.length > 0) {
          res.data.policy_triggers.forEach((pt) => {
            addToast(pt.type, pt.message, pt.severity.toLowerCase());
          });
        }
      }
    } catch (err) {
      const errData = err.response?.data || {};
      setResult(errData);
      triggerRefresh();
      addToast(
        'Request Blocked by Policy',
        errData.reason || 'Agent or Team budget limit exceeded!',
        'critical'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!simulatorOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#111827] border border-gray-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gradient-to-r from-blue-900/40 to-indigo-900/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600/30 border border-blue-500/30 text-blue-400 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Live AI API Request & Prompt Sandbox</h3>
              <p className="text-[11px] text-gray-400">Execute real LLM prompts or token payload simulations</p>
            </div>
          </div>
          <button
            onClick={() => setSimulatorOpen(false)}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Pills */}
        <div className="px-6 pt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode('real')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              mode === 'real' ? 'bg-blue-600 text-white shadow-glow-blue' : 'bg-gray-900 text-gray-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Real Prompt Mode
          </button>
          <button
            type="button"
            onClick={() => setMode('simulation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              mode === 'simulation' ? 'bg-purple-600 text-white shadow-glow-blue' : 'bg-gray-900 text-gray-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" /> Token Payload Simulation
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Agent Select */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Target AI Agent</label>
              <select
                value={selectedAgentId}
                onChange={handleAgentChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
              >
                {agents.map((a) => (
                  <option key={a.agent_id} value={a.agent_id}>
                    {a.agent_name} (${a.remaining_budget} left)
                  </option>
                ))}
              </select>
            </div>

            {/* Model Select */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">LLM Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
              >
                <option value="gpt-4o">GPT-4o (OpenAI)</option>
                <option value="gpt-4">GPT-4 (OpenAI)</option>
                <option value="gpt-4o-mini">GPT-4o-mini (OpenAI)</option>
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (Anthropic)</option>
                <option value="claude-3-opus">Claude 3 Opus (Anthropic)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Google)</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Google)</option>
                <option value="deepseek-r1">DeepSeek R1</option>
              </select>
            </div>
          </div>

          {mode === 'real' ? (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Prompt Text</label>
              <textarea
                rows={3}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Type real AI prompt text here..."
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500 resize-none font-sans"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Prompt Input Tokens</label>
                <input
                  type="number"
                  min="50"
                  max="50000"
                  value={inputTokens}
                  onChange={(e) => setInputTokens(Number(e.target.value))}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Response Output Tokens</label>
                <input
                  type="number"
                  min="10"
                  max="20000"
                  value={outputTokens}
                  onChange={(e) => setOutputTokens(Number(e.target.value))}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200"
                />
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-glow-blue transition-all"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>{mode === 'real' ? 'Execute Real LLM Prompt & Budget Check' : 'Execute Budget Engine Deduction'}</span>
              </>
            )}
          </button>
        </form>

        {/* Result View */}
        {result && (
          <div className="p-5 border-t border-gray-800 bg-gray-950/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-300">Policy Engine & Provider Response</span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                  result.allowed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                }`}
              >
                {result.allowed ? 'Request Approved' : 'Request Rejected'}
              </span>
            </div>

            {result.allowed ? (
              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 space-y-2 text-xs text-emerald-300">
                {result.response_text && (
                  <div className="p-2 rounded bg-gray-900/80 border border-gray-800 text-gray-200 font-sans text-xs italic">
                    "{result.response_text}"
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Calculated Cost:</span>
                  <span className="font-mono font-bold">${result.cost}</span>
                </div>
                <div className="flex justify-between">
                  <span>Extracted Tokens:</span>
                  <span className="font-mono">{result.tokens || result.input_tokens + result.output_tokens} tokens</span>
                </div>
                <div className="flex justify-between">
                  <span>Updated Agent Remaining:</span>
                  <span className="font-mono font-bold">${result.agent_remaining_budget}</span>
                </div>
                {result.note && <p className="text-[10px] text-gray-400 italic pt-1">{result.note}</p>}
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/30 space-y-2 text-xs text-red-300">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="font-bold">Reason: {result.reason}</span>
                </div>
                {result.suggested_model && (
                  <p className="text-[11px] text-amber-300 mt-1">
                    Recommendation: Switch model from <strong>{selectedModel}</strong> to fallback model <strong>{result.suggested_model}</strong>.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
