// src/components/Header.jsx
import React from 'react';
import { FileText, Sparkles, Zap } from 'lucide-react';

export default function Header() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-3xl shadow-2xl shadow-gold p-10 mb-8 animate-fade-in border border-yellow-500/20">
      {/* Animated gold particles */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-20 right-20 w-40 h-40 bg-yellow-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-10 left-1/3 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(251,191,36,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="p-3 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl shadow-gold animate-glow-pulse">
            <FileText className="w-10 h-10 text-black" />
          </div>
          <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 tracking-tight">
            MCA Portal
          </h1>
          <Zap className="w-8 h-8 text-yellow-400 animate-pulse" />
        </div>
        <div className="flex items-center justify-center gap-2">
          <div className="h-px w-20 bg-gradient-to-r from-transparent via-yellow-500 to-transparent"></div>
          <p className="text-center text-yellow-400/90 text-xl font-semibold tracking-wide">
            AI-Powered Document Processing & Analysis
          </p>
          <div className="h-px w-20 bg-gradient-to-r from-transparent via-yellow-500 to-transparent"></div>
        </div>
      </div>
    </div>
  );
}