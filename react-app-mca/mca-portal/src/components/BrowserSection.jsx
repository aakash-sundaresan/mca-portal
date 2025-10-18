// src/components/BrowserSection.jsx
import React, { useState, useEffect } from 'react';
import { ChevronRight, RefreshCw, ArrowLeft, FolderUp, Search } from 'lucide-react';
import FileItem from './FileItem';

export default function BrowserSection({ 
  currentPath, 
  onPathChange, 
  onGoBack, 
  onRefresh, 
  onGoToResults, 
  files, 
  isLoading, 
  onFileClick, 
  resultsPath 
}) {
  const [pathInput, setPathInput] = useState(currentPath);

  useEffect(() => {
    setPathInput(currentPath);
  }, [currentPath]);

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-2xl shadow-gold/20 border border-yellow-500/20 p-8 mb-8 animate-scale-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-lg shadow-gold">
          <Search className="w-5 h-5 text-black" />
        </div>
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-400">
          JSON Results Browser
        </h2>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 p-5 rounded-xl mb-6 border-l-4 border-yellow-500">
        <p className="text-sm mb-2">
          <span className="font-semibold text-yellow-400">Current Path:</span>{' '}
          <code className="bg-black/50 px-2 py-1 rounded text-yellow-300 font-mono text-xs border border-yellow-500/30">
            bucket/{currentPath}
          </code>
        </p>
        <p className="text-sm text-gray-400">
          Browse and view processed JSON results from uploaded documents.
        </p>
      </div>

      {/* Navigation Controls */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[300px] flex gap-2">
          <input
            type="text"
            value={pathInput}
            onChange={(e) => setPathInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onPathChange(pathInput)}
            className="flex-1 px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg 
                     text-gray-200 placeholder-gray-500
                     focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 outline-none
                     transition-all duration-300"
            placeholder="Path (e.g., auditors-report/json/)"
          />
          <button
            onClick={() => onPathChange(pathInput)}
            className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-5 py-3 rounded-lg 
                     hover:shadow-gold transition-all flex items-center gap-2 font-semibold
                     hover:scale-105 active:scale-95"
          >
            <ChevronRight className="w-4 h-4" />
            Go
          </button>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            className="bg-gray-800 border-2 border-gray-700 text-yellow-400 px-4 py-3 rounded-lg 
                     hover:border-yellow-500 hover:shadow-gold/50 transition-all flex items-center gap-2 font-semibold
                     hover:scale-105 active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={onGoBack}
            className="bg-gray-800 border-2 border-gray-700 text-yellow-400 px-4 py-3 rounded-lg 
                     hover:border-yellow-500 hover:shadow-gold/50 transition-all flex items-center gap-2 font-semibold
                     hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={onGoToResults}
            className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-5 py-3 rounded-lg 
                     hover:shadow-gold transition-all flex items-center gap-2 font-semibold
                     hover:scale-105 active:scale-95"
          >
            <FolderUp className="w-4 h-4" />
            Results
          </button>
        </div>
      </div>

      {/* File List */}
      <div className="border-2 border-gray-800 rounded-xl overflow-hidden bg-gray-900/50 backdrop-blur-sm">
        {isLoading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-10 h-10 mx-auto mb-3 text-yellow-400 animate-spin" />
            <p className="text-gray-400 font-medium">Loading files...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-block p-4 bg-gray-800 rounded-2xl mb-4">
              <Search className="w-12 h-12 text-gray-600" />
            </div>
            <p className="text-gray-500 font-medium">No files found in this directory</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {files.map((file, index) => (
              <FileItem key={index} file={file} onClick={() => onFileClick(file)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}