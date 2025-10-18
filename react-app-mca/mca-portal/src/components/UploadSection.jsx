// src/components/UploadSection.jsx
import React, { useState, useRef } from 'react';
import { Upload, RefreshCw, CloudUpload, CheckCircle, Info, Zap } from 'lucide-react';
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
    <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-2xl shadow-gold/20 border border-yellow-500/20 p-8 mb-8 animate-scale-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-lg shadow-gold">
          <CloudUpload className="w-5 h-5 text-black" />
        </div>
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-400">
          Upload Document for Processing
        </h2>
      </div>
      
      {/* Info Card */}
      <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 p-5 rounded-xl mb-6 border-l-4 border-yellow-500 shadow-sm">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-semibold text-yellow-400">Upload Path:</span>{' '}
              <code className="bg-black/50 px-2 py-1 rounded text-yellow-300 font-mono text-xs border border-yellow-500/30">
                {uploadPath}
              </code>
            </p>
            <p>
              <span className="font-semibold text-yellow-400">Results Path:</span>{' '}
              <code className="bg-black/50 px-2 py-1 rounded text-yellow-300 font-mono text-xs border border-yellow-500/30">
                {resultsPath}
              </code>
            </p>
            <p className="text-gray-400">
              Files uploaded here will be processed by AI and results will appear in the JSON results browser below.
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
          relative overflow-hidden group
          border-3 border-dashed rounded-2xl p-12 text-center cursor-pointer 
          transition-all duration-300 ease-out
          ${isDragging
            ? 'border-yellow-500 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 scale-105 shadow-glow-gold'
            : selectedFile
            ? 'border-yellow-500 bg-gradient-to-br from-yellow-500/10 to-amber-500/10 shadow-gold'
            : 'border-gray-700 bg-gray-800/30 hover:border-yellow-500/50 hover:bg-gradient-to-br hover:from-yellow-500/5 hover:to-amber-500/5 hover:shadow-gold/50'}
        `}
      >
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/0 via-yellow-600/5 to-amber-600/0 group-hover:via-yellow-600/10 transition-all duration-700"></div>
        
        <div className="relative z-10">
          {selectedFile ? (
            <>
              <div className="inline-block p-4 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl mb-4 animate-scale-in shadow-gold">
                <CheckCircle className="w-16 h-16 text-black" />
              </div>
              <div className="text-xl font-bold text-yellow-400 mb-2">{selectedFile.name}</div>
              <div className="text-sm text-yellow-300 font-semibold">
                Size: {formatFileSize(selectedFile.size)}
              </div>
            </>
          ) : (
            <>
              <div className="inline-block p-4 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-gold">
                <Upload className="w-16 h-16 text-black" />
              </div>
              <div className="text-xl font-bold text-gray-200 mb-2">
                Click to select a file or drag and drop
              </div>
              <div className="text-sm text-gray-400">
                Supported formats: PDF, DOC, DOCX, XLS, XLSX, TXT, Images
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
        className="mt-6 w-full bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 text-black px-8 py-4 rounded-xl font-bold text-lg
                   hover:shadow-glow-gold hover:scale-105 active:scale-95
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
                   transition-all duration-300 ease-out
                   relative overflow-hidden group"
      >
        <span className="relative z-10 flex items-center justify-center gap-3">
          {isUploading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Uploading... {uploadProgress}%
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Upload for AI Processing
            </>
          )}
        </span>
        {!isUploading && (
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        )}
      </button>

      {/* Progress Bar */}
      {isUploading && (
        <div className="mt-6 animate-fade-in">
          <div className="bg-gray-800 rounded-full h-3 overflow-hidden shadow-inner border border-gray-700">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 transition-all duration-300 ease-out rounded-full relative overflow-hidden"
              style={{ width: `${uploadProgress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
          </div>
          <p className="text-center text-sm text-yellow-400 mt-2 font-medium">Processing your document...</p>
        </div>
      )}

      {/* Polling Status */}
      {isPolling && (
        <div className="mt-6 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-2 border-yellow-500/50 rounded-xl p-5 shadow-gold animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <RefreshCw className="w-6 h-6 text-yellow-400 animate-spin" />
              <div>
                <p className="font-bold text-yellow-400 text-lg">Processing in Progress</p>
                <p className="text-sm text-yellow-300">Auto-checking for results every 10 seconds...</p>
              </div>
            </div>
            <button
              onClick={onCheckResults}
              className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-5 py-2 rounded-lg hover:shadow-gold transition-all font-semibold text-sm shadow-md hover:scale-105"
            >
              Check Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}