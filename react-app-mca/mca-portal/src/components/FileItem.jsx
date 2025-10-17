// src/components/FileItem.jsx
import React from 'react';
import { FolderOpen, FileText } from 'lucide-react';
import { formatFileSize } from '../utils/helpers';

export default function FileItem({ file, onClick }) {
  const getIcon = () => {
    if (file.type === 'folder' || file.type === 'parent') {
      return <FolderOpen className="w-6 h-6 text-yellow-500" />;
    }
    if (file.type === 'json') {
      return <FileText className="w-6 h-6 text-blue-500" />;
    }
    if (file.type === 'pdf') {
      return <FileText className="w-6 h-6 text-red-500" />;
    }
    return <FileText className="w-6 h-6 text-gray-500" />;
  };

  return (
    <div
      onClick={onClick}
      className="flex items-center p-4 border-b border-gray-200 last:border-b-0 hover:bg-indigo-50 cursor-pointer transition-colors group"
    >
      <div className="mr-4">{getIcon()}</div>
      <div className="flex-1">
        <div className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
          {file.name}
        </div>
        <div className="text-sm text-gray-500 font-mono">{file.key}</div>
      </div>
      {file.size && (
        <div className="text-sm text-gray-600">{formatFileSize(file.size)}</div>
      )}
    </div>
  );
}