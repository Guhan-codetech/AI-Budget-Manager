import React from 'react';
import { useApp } from '../../context/AppContext';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

export default function NotificationCenter() {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let Icon = Info;
        let borderColor = 'border-blue-500/40';
        let bgGradient = 'from-blue-900/90 to-gray-900/90';
        let textColor = 'text-blue-400';

        if (toast.type === 'critical' || toast.type === 'error') {
          Icon = AlertCircle;
          borderColor = 'border-red-500/50';
          bgGradient = 'from-red-950/90 to-gray-900/90';
          textColor = 'text-red-400';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          borderColor = 'border-amber-500/50';
          bgGradient = 'from-amber-950/90 to-gray-900/90';
          textColor = 'text-amber-400';
        } else if (toast.type === 'success') {
          Icon = CheckCircle;
          borderColor = 'border-emerald-500/50';
          bgGradient = 'from-emerald-950/90 to-gray-900/90';
          textColor = 'text-emerald-400';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border ${borderColor} bg-gradient-to-r ${bgGradient} backdrop-blur-md shadow-2xl transition-all duration-300 animate-slide-in`}
          >
            <Icon className={`w-5 h-5 shrink-0 ${textColor} mt-0.5`} />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white tracking-wide">{toast.title}</h4>
              <p className="text-xs text-gray-300 mt-0.5 leading-snug">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-white p-0.5 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
