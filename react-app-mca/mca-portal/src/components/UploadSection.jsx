// src/components/UploadSection.jsx
import React, { useState, useRef } from 'react';
import { Upload, RefreshCw, CloudUpload, CheckCircle, Info, FileUp } from 'lucide-react';
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-blue-50 rounded-lg">
          <CloudUpload className="w-5 h-5 text-blue-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">
          Upload Document
        </h2>
      </div>
      
      {/* Info Card */}
      <div className="bg-blue-50 p-4 rounded-lg mb-5 border-l-4 border-blue-500">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-2 text-sm">
            <p className="text-gray-700">
              <span className="font-medium text-gray-900">Upload Path:</span>{' '}
              <code className="bg-white px-2 py-0.5 rounded text-gray-600 text-xs border border-gray-200">
                {uploadPath}
              </code>
            </p>
            <p className="text-gray-700">
              <span className="font-medium text-gray-900">Results Path:</span>{' '}
              <code className="bg-white px-2 py-0.5 rounded text-gray-600 text-xs border border-gray-200">
                {resultsPath}
              </code>
            </p>
            <p className="text-gray-600 text-xs">
              Uploaded files will be processed and results will be available in the results section.
            </p>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-10 text-center cursor-pointer 
          transition-colors
          ${isDragging
            ? 'border-blue-500 bg-blue-50'
            : selectedFile
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'}
        `}
      >
        <div>
          {selectedFile ? (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-base font-medium text-gray-900 mb-1">{selectedFile.name}</div>
              <div className="text-sm text-gray-600">
                {formatFileSize(selectedFile.size)}
              </div>
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Upload className="w-8 h-8 text-gray-400" />
              </div>
              <div className="text-base font-medium text-gray-900 mb-1">
                Click to select a file or drag and drop
              </div>
              <div className="text-sm text-gray-500">
                PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG
              </div>
            </>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        onChange={onFileSelect}
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif"
      />

      {/* Upload Button */}
      <button
        onClick={onUpload}
        disabled={!selectedFile || isUploading}
        className="mt-5 w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium text-base
                   hover:bg-blue-700
                   disabled:bg-gray-300 disabled:cursor-not-allowed
                   transition-colors
                   flex items-center justify-center gap-2"
      >
        {isUploading ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            Uploading... {uploadProgress}%
          </>
        ) : (
          <>
            <FileUp className="w-5 h-5" />
            Upload Document
          </>
        )}
      </button>

      {/* Progress Bar */}
      {isUploading && (
        <div className="mt-4">
          <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-center text-sm text-gray-600 mt-2">Processing your document...</p>
        </div>
      )}

      {/* Polling Status */}
      {isPolling && (
        <div className="mt-5 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
              <div>
                <p className="font-medium text-gray-900 text-sm">Processing in Progress</p>
                <p className="text-xs text-gray-600">Checking for results every 10 seconds</p>
              </div>
            </div>
            <button
              onClick={onCheckResults}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Check Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}