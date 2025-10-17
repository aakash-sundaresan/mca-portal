// src/components/DocumentTypeSelector.jsx
import React from 'react';

export default function DocumentTypeSelector({ documentType, onChange }) {
  const options = [
    {
      value: 'auditors-report',
      title: "Auditor's Report",
      description: 'Upload: auditors-report/uploads/ | Results: auditors-report/json/'
    },
    {
      value: 'aoc4',
      title: 'AOC-4',
      description: 'Upload: aoc4/uploads/ | Results: aoc4/json/'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-indigo-600 pb-2">
        Select Document Type
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map(option => (
          <label
            key={option.value}
            className={`flex items-start p-5 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
              documentType === option.value
                ? 'border-indigo-600 bg-indigo-50 shadow-md'
                : 'border-gray-200 bg-gray-50 hover:border-indigo-400'
            }`}
          >
            <input
              type="radio"
              name="docType"
              value={option.value}
              checked={documentType === option.value}
              onChange={(e) => onChange(e.target.value)}
              className="mt-1 mr-3 w-5 h-5 text-indigo-600 focus:ring-indigo-500"
            />
            <div className="flex-1">
              <div className="text-lg font-semibold text-gray-800 mb-1">{option.title}</div>
              <div className="text-sm text-gray-600 font-mono bg-white px-3 py-2 rounded">
                {option.description}
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}