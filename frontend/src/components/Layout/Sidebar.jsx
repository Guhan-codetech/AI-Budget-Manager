import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  Bot,
  Activity,
  Receipt,
  TrendingUp,
  AlertTriangle,
  FileSpreadsheet,
  Settings,
  User,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Organizations', href: '/organizations', icon: Building2 },
  { name: 'Teams', href: '/teams', icon: Users },
  { name: 'AI Agents', href: '/agents', icon: Bot },
  { name: 'Sessions', href: '/sessions', icon: Activity },
  { name: 'API Usage Logs', href: '/usage', icon: Receipt },
  { name: 'AI Analytics', href: '/analytics', icon: TrendingUp },
  { name: 'Alerts', href: '/alerts', icon: AlertTriangle },
  { name: 'Reports', href: '/reports', icon: FileSpreadsheet },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="w-64 bg-[#0F172A]/95 border-r border-gray-800/80 flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none z-30">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-800/80 bg-[#0B0F19]/50">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-glow-blue">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-white tracking-wide leading-tight">Agent Budget</h1>
            <p className="text-[10px] uppercase tracking-wider text-blue-400 font-semibold">AI Cost Governance</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User Info Footer */}
      <div className="p-3 border-t border-gray-800/80 bg-[#0B0F19]/60">
        <NavLink
          to="/profile"
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/60 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold text-xs">
            {user?.username?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-200 truncate">{user?.username || 'Admin User'}</p>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="text-[10px] text-gray-400 font-mono capitalize">{user?.role || 'Admin'}</span>
            </div>
          </div>
          <User className="w-4 h-4 text-gray-400" />
        </NavLink>
      </div>
    </aside>
  );
}
