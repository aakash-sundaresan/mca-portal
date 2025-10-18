// src/components/FileItem.jsx
import React from 'react';
import { FolderOpen, FileText, FileJson, File } from 'lucide-react';
import { formatFileSize } from '../utils/helpers';

export default function FileItem({ file, onClick }) {
  const getIcon = () => {
    if (file.type === 'folder' || file.type === 'parent') {
      return <FolderOpen className="w-6 h-6 text-yellow-400" />;
    }
    if (file.type === 'json') {
      return <FileJson className="w-6 h-6 text-amber-400" />;
    }
    if (file.type === 'pdf') {
      return <FileText className="w-6 h-6 text-red-400" />;
    }
    return <File className="w-6 h-6 text-gray-400" />;
  };

  return (
    <div
      onClick={onClick}
      className="flex items-center p-4 cursor-pointer transition-all duration-200
               hover:bg-gradient-to-r hover:from-yellow-500/10 hover:to-amber-500/10
               group relative overflow-hidden"
    >
      {/* Hover effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/0 via-yellow-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative z-10 flex items-center w-full">
        <div className="mr-4 p-2 bg-gray-800 rounded-lg group-hover:bg-gray-700 transition-colors">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-200 group-hover:text-yellow-400 transition-colors truncate">
            {file.name}
          </div>
          <div className="text-sm text-gray-500 font-mono truncate">{file.key}</div>
        </div>
        {file.size && (
          <div className="text-sm text-gray-400 font-medium ml-4">
            {formatFileSize(file.size)}
          </div>
        )}
      </div>
    </div>
  );
}