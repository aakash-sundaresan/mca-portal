// src/components/BrowserSection.jsx
import React, { useState, useEffect } from 'react';
import { ChevronRight, RefreshCw, ArrowLeft, FolderUp } from 'lucide-react';
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
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-indigo-600 pb-2">
        JSON Results Browser
      </h2>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg mb-4 border-l-4 border-indigo-600">
        <p className="text-sm mb-2">
          <strong className="text-indigo-700">Current Path:</strong>{' '}
          <code className="bg-indigo-100 px-2 py-1 rounded text-indigo-800 font-mono text-xs">
            bucket/{currentPath}
          </code>
        </p>
        <p className="text-sm text-gray-600">
          Browse and view processed JSON results from uploaded documents.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex-1 min-w-[300px] flex gap-2">
          <input
            type="text"
            value={pathInput}
            onChange={(e) => setPathInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onPathChange(pathInput)}
            className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-600 focus:ring focus:ring-indigo-200 outline-none"
            placeholder="Path (e.g., auditors-report/json/)"
          />
          <button
            onClick={() => onPathChange(pathInput)}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <ChevronRight className="w-4 h-4" />
            Navigate
          </button>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={onGoBack}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={onGoToResults}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
          >
            <FolderUp className="w-4 h-4" />
            Go to Results
          </button>
        </div>
      </div>

      <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 mx-auto mb-2 text-indigo-600 animate-spin" />
            <p className="text-gray-600">Loading files...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No files found in this directory
          </div>
        ) : (
          files.map((file, index) => (
            <FileItem key={index} file={file} onClick={() => onFileClick(file)} />
          ))
        )}
      </div>
    </div>
  );
}