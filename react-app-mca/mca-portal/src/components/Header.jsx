// src/components/Header.jsx
import React from 'react';
import { FileText } from 'lucide-react';

export default function Header() {
  return (
    <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl shadow-2xl p-8 mb-8 text-white">
      <div className="flex items-center justify-center gap-3 mb-3">
        <FileText className="w-10 h-10" />
        <h1 className="text-4xl font-bold">MCA Portal</h1>
      </div>
      <p className="text-center text-indigo-100 text-lg">S3 Document Reader & Processor</p>
    </div>
  );
}