// src/components/StatusMessage.jsx
import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function StatusMessage({ message }) {
  if (!message.text) return null;

  const config = {
    success: {
      bg: 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20',
      border: 'border-emerald-500/50',
      text: 'text-emerald-400',
      icon: CheckCircle2,
      iconColor: 'text-emerald-400'
    },
    error: {
      bg: 'bg-gradient-to-r from-red-500/20 to-rose-500/20',
      border: 'border-red-500/50',
      text: 'text-red-400',
      icon: AlertCircle,
      iconColor: 'text-red-400'
    },
    info: {
      bg: 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20',
      border: 'border-blue-500/50',
      text: 'text-blue-400',
      icon: Info,
      iconColor: 'text-blue-400'
    }
  };

  const style = config[message.type] || config.info;
  const Icon = style.icon;

  return (
    <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl border-2 shadow-2xl animate-slide-in max-w-md backdrop-blur-sm ${style.bg} ${style.border}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${style.iconColor}`} />
        <p className={`font-semibold ${style.text}`}>{message.text}</p>
      </div>
    </div>
  );
}