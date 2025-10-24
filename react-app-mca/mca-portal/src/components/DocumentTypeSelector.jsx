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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-blue-50 rounded-lg">
          <FileText className="w-5 h-5 text-blue-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">
          Select Document Type
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                relative p-5 rounded-lg border-2 transition-all duration-200
                ${isSelected 
                  ? 'border-blue-600 bg-blue-50 shadow-sm' 
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50'}
              `}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2.5 rounded-lg transition-all duration-200 ${
                    isSelected 
                      ? 'bg-blue-600' 
                      : 'bg-gray-100 group-hover:bg-gray-200'
                  }`}>
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                
                <h3 className={`text-base font-semibold mb-1 ${
                  isSelected ? 'text-blue-900' : 'text-gray-900'
                }`}>
                  {option.title}
                </h3>
                
                <p className="text-xs text-gray-500 leading-relaxed">
                  {option.description}
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}