// src/components/UploadSection.jsx - Professional UI with Black/Gray Dark Mode
import React, { useState, useRef } from 'react';
import { Upload, RefreshCw, CloudUpload, CheckCircle, Info, FileUp, FileText, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { formatFileSize } from '../utils/helpers';
import { checkUploadLimit } from '../services/api';

export default function UploadSection({ 
  selectedDocumentFile,
  selectedTemplateFile,
  onDocumentSelect,
  onTemplateSelect,
  onUpload, 
  isUploading, 
  uploadProgress, 
  isPolling, 
  uploadPath,
  templatePath,
  onCheckResults 
}) {
  const [isDraggingDocument, setIsDraggingDocument] = useState(false);
  const [isDraggingTemplate, setIsDraggingTemplate] = useState(false);
  const [isCheckingLimit, setIsCheckingLimit] = useState(false);
  const [limitError, setLimitError] = useState(null);
  const documentInputRef = useRef(null);
  const templateInputRef = useRef(null);

  // Document drag handlers
  const handleDocumentDragOver = (e) => {
    e.preventDefault();
    setIsDraggingDocument(true);
  };

  const handleDocumentDragLeave = () => {
    setIsDraggingDocument(false);
  };

  const handleDocumentDrop = (e) => {
    e.preventDefault();
    setIsDraggingDocument(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const event = { target: { files: [file] } };
      onDocumentSelect(event);
    }
  };

  // Template drag handlers
  const handleTemplateDragOver = (e) => {
    e.preventDefault();
    setIsDraggingTemplate(true);
  };

  const handleTemplateDragLeave = () => {
    setIsDraggingTemplate(false);
  };

  const handleTemplateDrop = (e) => {
    e.preventDefault();
    setIsDraggingTemplate(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const event = { target: { files: [file] } };
      onTemplateSelect(event);
    }
  };

  const handleUploadClick = async () => {
    setLimitError(null);
    setIsCheckingLimit(true);

    try {
      const limitCheck = await checkUploadLimit();
      
      if (!limitCheck.allowed) {
        setLimitError(limitCheck.message);
        setIsCheckingLimit(false);
        return;
      }

      setIsCheckingLimit(false);
      onUpload();
    } catch (error) {
      console.error('Error checking upload limit:', error);
      setLimitError('Failed to verify upload limit. Please try again.');
      setIsCheckingLimit(false);
    }
  };

  const bothFilesSelected = selectedDocumentFile && selectedTemplateFile;

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <Info className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              Upload both your document and Excel template together. The system will process them and generate a filled Excel file automatically.
            </p>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 w-fit">
              <div className="w-1.5 h-1.5 bg-gray-600 dark:bg-gray-400 rounded-full animate-pulse"></div>
              Free limit: 5 documents across all types
            </div>
          </div>
        </div>
      </div>

      {/* Limit Error Alert */}
      {limitError && (
        <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border border-red-200 dark:border-red-900/50 rounded-xl p-5 shadow-sm animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-red-900 dark:text-red-200 text-sm mb-1">Upload Limit Reached</p>
              <p className="text-sm text-red-700 dark:text-red-300 mb-2">{limitError}</p>
              <p className="text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 rounded-lg px-3 py-1.5 w-fit">
                💡 Contact the administrator to upgrade your account
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Two Upload Areas Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Document Upload Area */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold">
              1
            </div>
            <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Document to Process
            </label>
          </div>
          <div
            onClick={() => documentInputRef.current?.click()}
            onDragOver={handleDocumentDragOver}
            onDragLeave={handleDocumentDragLeave}
            onDrop={handleDocumentDrop}
            className={`
              group relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer 
              transition-all duration-300 min-h-[220px] flex flex-col items-center justify-center
              shadow-sm hover:shadow-md
              ${isDraggingDocument
                ? 'border-gray-500 dark:border-gray-400 bg-gray-50 dark:bg-gray-800 scale-105'
                : selectedDocumentFile
                ? 'border-green-500 dark:border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20'
                : 'border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-100/50 dark:hover:bg-gray-900/50'}
            `}
          >
            {selectedDocumentFile ? (
              <>
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl mb-4 shadow-sm">
                  <CheckCircle className="w-7 h-7 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1 break-all px-2 max-w-full">
                  {selectedDocumentFile.name}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  {formatFileSize(selectedDocumentFile.size)}
                </div>
                <div className="mt-3 text-xs text-green-700 dark:text-green-300 bg-green-100/50 dark:bg-green-900/30 px-3 py-1 rounded-full">
                  Ready to upload
                </div>
              </>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-4 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors shadow-sm">
                  <FileText className="w-7 h-7 text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors" />
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Click or drag to upload
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  PDF, DOCX, XLS or XLSX
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                  <Upload className="w-3 h-3" />
                  <span>Max 50MB</span>
                </div>
              </>
            )}
            {isDraggingDocument && (
              <div className="absolute inset-0 bg-gray-500/5 dark:bg-gray-400/5 rounded-xl border-2 border-gray-500 dark:border-gray-400 pointer-events-none"></div>
            )}
          </div>
          <input
            ref={documentInputRef}
            type="file"
            onChange={onDocumentSelect}
            className="hidden"
            accept=".pdf,.docx,.xlsx,.xls"
          />
        </div>

        {/* Template Upload Area */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold">
              2
            </div>
            <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Excel Template
            </label>
          </div>
          <div
            onClick={() => templateInputRef.current?.click()}
            onDragOver={handleTemplateDragOver}
            onDragLeave={handleTemplateDragLeave}
            onDrop={handleTemplateDrop}
            className={`
              group relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer 
              transition-all duration-300 min-h-[220px] flex flex-col items-center justify-center
              shadow-sm hover:shadow-md
              ${isDraggingTemplate
                ? 'border-gray-500 dark:border-gray-400 bg-gray-50 dark:bg-gray-800 scale-105'
                : selectedTemplateFile
                ? 'border-green-500 dark:border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20'
                : 'border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-100/50 dark:hover:bg-gray-900/50'}
            `}
          >
            {selectedTemplateFile ? (
              <>
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl mb-4 shadow-sm">
                  <CheckCircle className="w-7 h-7 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1 break-all px-2 max-w-full">
                  {selectedTemplateFile.name}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  {formatFileSize(selectedTemplateFile.size)}
                </div>
                <div className="mt-3 text-xs text-green-700 dark:text-green-300 bg-green-100/50 dark:bg-green-900/30 px-3 py-1 rounded-full">
                  Ready to upload
                </div>
              </>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-4 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors shadow-sm">
                  <FileSpreadsheet className="w-7 h-7 text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors" />
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Click or drag to upload
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  XLSX or XLS
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                  <Upload className="w-3 h-3" />
                  <span>Max 50MB</span>
                </div>
              </>
            )}
            {isDraggingTemplate && (
              <div className="absolute inset-0 bg-gray-500/5 dark:bg-gray-400/5 rounded-xl border-2 border-gray-500 dark:border-gray-400 pointer-events-none"></div>
            )}
          </div>
          <input
            ref={templateInputRef}
            type="file"
            onChange={onTemplateSelect}
            className="hidden"
            accept=".xlsx,.xls"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleUploadClick}
        disabled={!bothFilesSelected || isUploading || isCheckingLimit}
        className={`
          w-full px-6 py-4 rounded-xl font-semibold text-base
          transition-all duration-300 flex items-center justify-center gap-3
          shadow-sm hover:shadow-md
          ${bothFilesSelected && !isUploading && !isCheckingLimit
            ? 'bg-gradient-to-r from-gray-800 to-gray-900 dark:from-gray-200 dark:to-gray-100 text-white dark:text-gray-900 hover:from-gray-900 hover:to-black dark:hover:from-gray-100 dark:hover:to-white transform hover:scale-[1.02] active:scale-[0.98]'
            : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
          }
        `}
      >
        {isCheckingLimit ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            Verifying upload limit...
          </>
        ) : isUploading ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            Processing {uploadProgress}%
          </>
        ) : (
          <>
            <FileUp className="w-5 h-5" />
            {bothFilesSelected 
              ? 'Process & Generate Excel' 
              : 'Select both files to continue'
            }
          </>
        )}
      </button>

      {/* Progress Bar */}
      {isUploading && (
        <div className="space-y-3 animate-fade-in">
          <div className="bg-gray-200 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-300 dark:to-gray-100 transition-all duration-500 ease-out rounded-full relative overflow-hidden"
              style={{ width: `${uploadProgress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400 font-medium">
              Uploading and processing...
            </span>
            <span className="text-gray-700 dark:text-gray-300 font-bold">
              {uploadProgress}%
            </span>
          </div>
        </div>
      )}

      {/* Polling Status */}
      {isPolling && (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400 animate-spin" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Processing in Progress</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Generating your filled Excel file...</p>
              </div>
            </div>
            <button
              onClick={onCheckResults}
              className="bg-gradient-to-r from-gray-800 to-gray-900 dark:from-gray-200 dark:to-gray-100 text-white dark:text-gray-900 px-5 py-2.5 rounded-lg hover:from-gray-900 hover:to-black dark:hover:from-gray-100 dark:hover:to-white transition-all text-sm font-semibold shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95"
            >
              Check Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}