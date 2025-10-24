// src/components/Header.jsx
import React from 'react';
import { FileText } from 'lucide-react';

export default function Header() {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-5 mb-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              MCA Annual Filing System
            </h1>
            <p className="text-sm text-gray-600 mt-0.5">
              Automated document processing and compliance management
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}