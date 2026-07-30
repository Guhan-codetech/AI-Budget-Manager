import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, Mail, User, KeyRound, Sparkles, AlertCircle } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');

  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(username, password);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.message);
    }
  };

  const setPreset = (role) => {
    if (role === 'admin') {
      setUsername('admin');
      setPassword('admin123');
    } else if (role === 'manager') {
      setUsername('manager');
      setPassword('manager123');
    } else if (role === 'viewer') {
      setUsername('viewer');
      setPassword('viewer123');
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setForgotMsg(`Password reset instructions sent to ${forgotEmail}.`);
    setTimeout(() => {
      setShowForgotModal(false);
      setForgotMsg('');
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#111827]/90 border border-gray-800 rounded-2xl p-8 shadow-glass backdrop-blur-xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 mx-auto flex items-center justify-center text-white shadow-glow-blue mb-3">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide">Agent Budget Controller</h2>
          <p className="text-xs text-gray-400 mt-1">Enterprise AI Cost Governance Platform</p>
        </div>

        {/* Quick Demo Presets */}
        <div className="mb-6 p-3 rounded-xl bg-gray-900/60 border border-gray-800">
          <p className="text-[11px] font-semibold text-gray-400 mb-2 text-center uppercase tracking-wider">Quick Demo Login Presets</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setPreset('admin')}
              className="py-1.5 px-2 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-300 text-[11px] font-semibold hover:bg-blue-600/30 transition-colors"
            >
              Admin
            </button>
            <button
              onClick={() => setPreset('manager')}
              className="py-1.5 px-2 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-300 text-[11px] font-semibold hover:bg-purple-600/30 transition-colors"
            >
              Manager
            </button>
            <button
              onClick={() => setPreset('viewer')}
              className="py-1.5 px-2 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold hover:bg-emerald-600/30 transition-colors"
            >
              Viewer
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Username or Email</label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Enter username..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Enter password..."
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded bg-gray-900 border-gray-700 text-blue-600 focus:ring-0"
              />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="text-blue-400 hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-glow-blue transition-all"
          >
            {loading ? 'Authenticating...' : 'Sign In to Governance Platform'}
          </button>
        </form>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">Reset Password</h3>
            <p className="text-xs text-gray-400">Enter your registered organizational email address to receive reset instructions.</p>
            {forgotMsg ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                {forgotMsg}
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <input
                  type="email"
                  required
                  placeholder="admin@agentbudget.ai"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="w-1/2 py-2 rounded-xl bg-gray-800 text-gray-300 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2 rounded-xl bg-blue-600 text-white text-xs font-medium"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
