// src/components/DocumentTypeSelector.jsx - Professional UI with Dark Mode
import React from 'react';
import { CheckCircle2, FileText, Briefcase, Users } from 'lucide-react';

export default function DocumentTypeSelector({ documentType, onChange }) {
  const options = [
    {
      value: 'auditors-report',
      title: "Auditor's Report",
      icon: FileText,
      color: "blue"
    },
    {
      value: 'aoc4',
      title: 'AOC-4',
      icon: Briefcase,
      color: "indigo"
    },
    {
      value: 'directors-report',
      title: "Director's Report",
      icon: Users,
      color: "purple"
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
          Document Type
        </h2>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          • Select one to begin
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {options.map(option => {
          const Icon = option.icon;
          const isSelected = documentType === option.value;
          
          const colorClasses = {
            blue: {
              border: 'border-blue-500 dark:border-blue-400',
              bg: 'bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/30',
              iconBg: 'bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600',
              iconBgUnselected: 'bg-slate-100 dark:bg-slate-700/50 group-hover:bg-slate-200 dark:group-hover:bg-slate-600',
              text: 'text-blue-900 dark:text-blue-100',
              checkmark: 'text-blue-600 dark:text-blue-400',
              ring: 'ring-blue-500/20 dark:ring-blue-400/30'
            },
            indigo: {
              border: 'border-indigo-500 dark:border-indigo-400',
              bg: 'bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/40 dark:to-indigo-900/30',
              iconBg: 'bg-gradient-to-br from-indigo-600 to-indigo-700 dark:from-indigo-500 dark:to-indigo-600',
              iconBgUnselected: 'bg-slate-100 dark:bg-slate-700/50 group-hover:bg-slate-200 dark:group-hover:bg-slate-600',
              text: 'text-indigo-900 dark:text-indigo-100',
              checkmark: 'text-indigo-600 dark:text-indigo-400',
              ring: 'ring-indigo-500/20 dark:ring-indigo-400/30'
            },
            purple: {
              border: 'border-purple-500 dark:border-purple-400',
              bg: 'bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/40 dark:to-purple-900/30',
              iconBg: 'bg-gradient-to-br from-purple-600 to-purple-700 dark:from-purple-500 dark:to-purple-600',
              iconBgUnselected: 'bg-slate-100 dark:bg-slate-700/50 group-hover:bg-slate-200 dark:group-hover:bg-slate-600',
              text: 'text-purple-900 dark:text-purple-100',
              checkmark: 'text-purple-600 dark:text-purple-400',
              ring: 'ring-purple-500/20 dark:ring-purple-400/30'
            }
          };

          const colors = colorClasses[option.color];
          
          return (
            <label
              key={option.value}
              className="group relative cursor-pointer"
            >
              <input
                type="radio"
                name="docType"
                value={option.value}
                checked={isSelected}
                onChange={(e) => onChange(e.target.value)}
                className="sr-only"
              />
              
              <div className={`
                relative p-6 rounded-xl border-2 transition-all duration-300
                shadow-sm hover:shadow-md
                ${isSelected 
                  ? `${colors.border} ${colors.bg} ring-4 ${colors.ring}` 
                  : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}
                transform hover:scale-[1.02] active:scale-[0.98]
              `}>
                {/* Background pattern overlay */}
                {isSelected && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 dark:to-transparent rounded-xl pointer-events-none"></div>
                )}

                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl transition-all duration-300 shadow-sm ${
                      isSelected 
                        ? colors.iconBg
                        : colors.iconBgUnselected
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        isSelected 
                          ? 'text-white' 
                          : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                      }`} />
                    </div>
                    {isSelected && (
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/80 dark:bg-slate-900/50 shadow-sm animate-fade-in">
                        <CheckCircle2 className={`w-5 h-5 ${colors.checkmark}`} />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className={`text-base font-bold transition-colors ${
                      isSelected 
                        ? colors.text
                        : 'text-slate-900 dark:text-slate-100'
                    }`}>
                      {option.title}
                    </h3>
                    <p className={`text-sm transition-colors ${
                      isSelected
                        ? 'text-slate-700 dark:text-slate-300'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}>
                    </p>
                  </div>
                </div>

                {/* Selection indicator bar */}
                {isSelected && (
                  <div className={`absolute bottom-0 left-0 right-0 h-1 ${colors.iconBg} rounded-b-xl`}></div>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}