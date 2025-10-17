// src/components/UploadSection.jsx
import React, { useState, useRef } from 'react';
import { Upload, RefreshCw } from 'lucide-react';
import { formatFileSize } from '../utils/helpers';

export default function UploadSection({ 
  selectedFile, 
  onFileSelect, 
  onUpload, 
  isUploading, 
  uploadProgress, 
  isPolling, 
  uploadPath, 
  resultsPath, 
  onCheckResults 
}) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const event = { target: { files: [file] } };
      onFileSelect(event);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-indigo-600 pb-2">
        Upload Document for Processing
      </h2>
      
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg mb-4 border-l-4 border-indigo-600">
        <p className="text-sm mb-2">
          <strong className="text-indigo-700">Upload Path:</strong>{' '}
          <code className="bg-indigo-100 px-2 py-1 rounded text-indigo-800 font-mono text-xs">
            bucket/{uploadPath}
          </code>
        </p>
        <p className="text-sm mb-2">
          <strong className="text-indigo-700">Results Path:</strong>{' '}
          <code className="bg-indigo-100 px-2 py-1 rounded text-indigo-800 font-mono text-xs">
            bucket/{resultsPath}
          </code>
        </p>
        <p className="text-sm text-gray-600">
          Files uploaded here will be processed and results will appear in the JSON results below.
        </p>
      </div>

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-3 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-indigo-600 bg-indigo-50'
            : 'border-gray-300 hover:border-indigo-500 hover:bg-indigo-50/30'
        }`}
      >
        <Upload className="w-16 h-16 mx-auto mb-4 text-indigo-600" />
        <div className="text-lg font-semibold text-gray-800 mb-2">
          {selectedFile ? selectedFile.name : 'Click to select a file or drag and drop'}
        </div>
        <div className="text-sm text-gray-600">
          {selectedFile
            ? `Size: ${formatFileSize(selectedFile.size)}`
            : 'Supported formats: PDF, DOC, DOCX, XLS, XLSX, TXT, etc.'}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        onChange={onFileSelect}
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif"
      />

      <button
        onClick={onUpload}
        disabled={!selectedFile || isUploading}
        className="mt-4 w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {isUploading ? `Uploading... ${uploadProgress}%` : 'Upload for Processing'}
      </button>

      {isUploading && (
        <div className="mt-4">
          <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-600 to-purple-600 h-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {isPolling && (
        <div className="mt-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-yellow-600 animate-spin" />
              <span className="font-semibold text-yellow-800">
                File uploaded! Processing may take a few minutes... (Auto-checking for results)
              </span>
            </div>
            <button
              onClick={onCheckResults}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
            >
              Check Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}