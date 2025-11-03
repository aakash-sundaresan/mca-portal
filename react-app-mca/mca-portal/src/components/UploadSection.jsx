// src/components/UploadSection.jsx - Complete unified version
import React, { useState, useRef } from 'react';
import { Upload, RefreshCw, CloudUpload, CheckCircle, Info, FileUp, FileText, FileSpreadsheet } from 'lucide-react';
import { formatFileSize } from '../utils/helpers';

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

  const bothFilesSelected = selectedDocumentFile && selectedTemplateFile;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-blue-50 rounded-lg">
          <CloudUpload className="w-5 h-5 text-blue-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">
          Upload Files
        </h2>
      </div>
      
      {/* Info Card */}
      <div className="bg-blue-50 p-4 rounded-lg mb-5 border-l-4 border-blue-500">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-2 text-sm">
            <p className="text-gray-600 text-xs">
              Upload both your document and Excel template together. The system will process them and generate a filled Excel file automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Two Upload Areas Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        
        {/* Document Upload Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            1. Document to Process
          </label>
          <div
            onClick={() => documentInputRef.current?.click()}
            onDragOver={handleDocumentDragOver}
            onDragLeave={handleDocumentDragLeave}
            onDrop={handleDocumentDrop}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center cursor-pointer 
              transition-colors min-h-[200px] flex flex-col items-center justify-center
              ${isDraggingDocument
                ? 'border-blue-500 bg-blue-50'
                : selectedDocumentFile
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'}
            `}
          >
            {selectedDocumentFile ? (
              <>
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-sm font-medium text-gray-900 mb-1 break-all px-2">
                  {selectedDocumentFile.name}
                </div>
                <div className="text-xs text-gray-600">
                  {formatFileSize(selectedDocumentFile.size)}
                </div>
              </>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
                  <FileText className="w-6 h-6 text-gray-400" />
                </div>
                <div className="text-sm font-medium text-gray-900 mb-1">
                  Click or drag to upload
                </div>
                <div className="text-xs text-gray-500">
                  PDF or DOCX or XLSX
                </div>
              </>
            )}
          </div>
          <input
            ref={documentInputRef}
            type="file"
            onChange={onDocumentSelect}
            className="hidden"
            accept=".pdf,.docx,.xlsx"
          />
        </div>

        {/* Template Upload Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            2. Excel Template
          </label>
          <div
            onClick={() => templateInputRef.current?.click()}
            onDragOver={handleTemplateDragOver}
            onDragLeave={handleTemplateDragLeave}
            onDrop={handleTemplateDrop}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center cursor-pointer 
              transition-colors min-h-[200px] flex flex-col items-center justify-center
              ${isDraggingTemplate
                ? 'border-blue-500 bg-blue-50'
                : selectedTemplateFile
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'}
            `}
          >
            {selectedTemplateFile ? (
              <>
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-sm font-medium text-gray-900 mb-1 break-all px-2">
                  {selectedTemplateFile.name}
                </div>
                <div className="text-xs text-gray-600">
                  {formatFileSize(selectedTemplateFile.size)}
                </div>
              </>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
                  <FileSpreadsheet className="w-6 h-6 text-gray-400" />
                </div>
                <div className="text-sm font-medium text-gray-900 mb-1">
                  Click or drag to upload
                </div>
                <div className="text-xs text-gray-500">
                  XLSX or XLS
                </div>
              </>
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
        onClick={onUpload}
        disabled={!bothFilesSelected || isUploading}
        className={`
          w-full px-6 py-3 rounded-lg font-medium text-base
          transition-colors flex items-center justify-center gap-2
          ${bothFilesSelected && !isUploading
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }
        `}
      >
        {isUploading ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            Processing... {uploadProgress}%
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
        <div className="mt-4">
          <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-center text-sm text-gray-600 mt-2">
            Uploading files and processing document...
          </p>
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
                <p className="text-xs text-gray-600">Generating your filled Excel file...</p>
              </div>
            </div>
            <button
              onClick={onCheckResults}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Check Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}