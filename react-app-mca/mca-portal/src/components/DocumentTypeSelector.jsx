// src/components/DocumentTypeSelector.jsx
import React from 'react';
import { CheckCircle2, FileText, Briefcase } from 'lucide-react';

export default function DocumentTypeSelector({ documentType, onChange }) {
  const options = [
    {
      value: 'auditors-report',
      title: "Auditor's Report",
      description: 'Upload: auditors-report/uploads/ | Results: auditors-report/json/',
      icon: FileText,
    },
    {
      value: 'aoc4',
      title: 'AOC-4',
      description: 'Upload: aoc4/uploads/ | Results: aoc4/json/',
      icon: Briefcase,
    }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-2xl shadow-gold/20 border border-yellow-500/20 p-8 mb-8 animate-scale-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-lg shadow-gold">
          <FileText className="w-5 h-5 text-black" />
        </div>
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-400">
          Select Document Type
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {options.map(option => {
          const Icon = option.icon;
          const isSelected = documentType === option.value;
          
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
                relative overflow-hidden p-6 rounded-xl border-2 transition-all duration-300
                ${isSelected 
                  ? 'border-yellow-500 bg-gradient-to-br from-yellow-500/10 to-amber-500/10 shadow-glow-gold scale-105' 
                  : 'border-gray-700 bg-gray-800/50 hover:border-yellow-500/50 hover:shadow-gold hover:scale-102'}
              `}>
                {/* Gold shimmer effect */}
                {isSelected && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent animate-shimmer"></div>
                )}
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl transition-all duration-300 ${
                      isSelected 
                        ? 'bg-gradient-to-br from-yellow-400 to-amber-500 shadow-gold' 
                        : 'bg-gray-700 group-hover:bg-gray-600'
                    }`}>
                      <Icon className={`w-6 h-6 ${isSelected ? 'text-black' : 'text-gray-300'}`} />
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-6 h-6 text-yellow-400 animate-scale-in" />
                    )}
                  </div>
                  
                  <h3 className={`text-xl font-bold mb-2 ${isSelected ? 'text-yellow-400' : 'text-gray-200'}`}>
                    {option.title}
                  </h3>     
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}