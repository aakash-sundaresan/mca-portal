// src/components/FilledExcelViewer.jsx - Professional UI with Black/Gray Dark Mode
import React, { useState, useEffect } from "react";
import { FileSpreadsheet, Download, RefreshCw, Trash2, Clock, HardDrive } from "lucide-react";

export default function FilledExcelViewer({
  documentType,
  s3Client,
  bucketName,
  identityId,
  onShowMessage
}) {
  const [filledFiles, setFilledFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadingKey, setDownloadingKey] = useState(null);
  const [deletingKey, setDeletingKey] = useState(null);

  useEffect(() => {
    if (s3Client && identityId) {
      loadFilledFiles();
    }
  }, [s3Client, documentType, identityId]);

  const loadFilledFiles = async () => {
    setIsLoading(true);
    try {
      const filledPrefix = `${identityId}/${documentType}/filled/`;
      
      const response = await s3Client
        .listObjectsV2({ Bucket: bucketName, Prefix: filledPrefix })
        .promise();

      const files =
        response.Contents?.filter((f) => f.Key.endsWith(".xlsx") || f.Key.endsWith(".xls"))
          .map((f) => ({
            key: f.Key,
            name: f.Key.split("/").pop(),
            lastModified: f.LastModified,
            size: f.Size
          }))
          .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified)) || [];

      setFilledFiles(files);
      if (files.length > 0) {
        onShowMessage?.(`Loaded ${files.length} filled Excel file${files.length > 1 ? 's' : ''}`, "success");
      }
    } catch (err) {
      console.error("Error loading filled files:", err);
      onShowMessage?.("Error loading files: " + err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (file) => {
    setDownloadingKey(file.key);
    try {
      const url = s3Client.getSignedUrl("getObject", {
        Bucket: bucketName,
        Key: file.key,
        Expires: 300
      });

      const response = await fetch(url);
      const blob = await response.blob();
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      onShowMessage?.(`Downloaded: ${file.name}`, "success");
    } catch (err) {
      console.error("Download failed:", err);
      onShowMessage?.("Download failed: " + err.message, "error");
    } finally {
      setDownloadingKey(null);
    }
  };

  const handleDelete = async (file) => {
    if (!window.confirm(`Are you sure you want to delete "${file.name}"?`)) {
      return;
    }

    setDeletingKey(file.key);
    try {
      await s3Client.deleteObject({
        Bucket: bucketName,
        Key: file.key
      }).promise();

      onShowMessage?.(`Deleted: ${file.name}`, "success");
      loadFilledFiles();
    } catch (err) {
      console.error("Delete failed:", err);
      onShowMessage?.("Delete failed: " + err.message, "error");
    } finally {
      setDeletingKey(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRelativeTime = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return formatDate(date);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {filledFiles.length} {filledFiles.length === 1 ? 'File' : 'Files'}
          </span>
          {filledFiles.length > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              • {formatFileSize(filledFiles.reduce((sum, f) => sum + f.size, 0))} total
            </span>
          )}
        </div>
        <button
          onClick={loadFilledFiles}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          title="Refresh file list"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-800 border-t-gray-900 dark:border-t-gray-100 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-r-gray-400 dark:border-r-gray-600 rounded-full animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading your files...</p>
        </div>
      ) : filledFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl">
            <FileSpreadsheet className="w-12 h-12 text-gray-400 dark:text-gray-600" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-gray-700 dark:text-gray-300 text-base font-semibold">No files yet</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md">
              Upload a document and template to generate your first Excel file
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {filledFiles.map((file, index) => {
            const isDownloading = downloadingKey === file.key;
            const isDeleting = deletingKey === file.key;
            const isProcessing = isDownloading || isDeleting;

            return (
              <div
                key={file.key}
                className="group relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Background gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-gray-500/0 via-gray-400/0 to-gray-500/0 group-hover:from-gray-500/5 group-hover:via-gray-400/5 group-hover:to-gray-500/5 dark:group-hover:from-gray-300/5 dark:group-hover:via-gray-400/5 dark:group-hover:to-gray-300/5 transition-all duration-500"></div>
                
                <div className="relative flex items-center gap-4 p-4">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="absolute inset-0 bg-green-500 dark:bg-green-600 rounded-xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
                      <div className="relative p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border border-green-200 dark:border-green-800">
                        <FileSpreadsheet className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate mb-1.5" title={file.name}>
                      {file.name}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <HardDrive className="w-3.5 h-3.5" />
                        <span className="font-medium">{formatFileSize(file.size)}</span>
                      </div>
                      <span className="text-gray-400 dark:text-gray-600">•</span>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span title={formatDate(file.lastModified)}>
                          {getRelativeTime(file.lastModified)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Download Button */}
                    <button
                      onClick={() => handleDownload(file)}
                      disabled={isProcessing}
                      className={`
                        relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold
                        transition-all duration-300 shadow-sm hover:shadow-md
                        ${isProcessing
                          ? "bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                          : "bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-500 dark:to-emerald-500 text-white hover:from-green-700 hover:to-emerald-700 dark:hover:from-green-600 dark:hover:to-emerald-600 transform hover:scale-105 active:scale-95"
                        }
                      `}
                      title="Download file"
                    >
                      {isDownloading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span className="hidden sm:inline">Downloading...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span className="hidden sm:inline">Download</span>
                        </>
                      )}
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(file)}
                      disabled={isProcessing}
                      className={`
                        relative p-2.5 rounded-lg text-sm font-semibold
                        transition-all duration-300 shadow-sm hover:shadow-md
                        ${isProcessing
                          ? "bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                          : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-900 transform hover:scale-110 active:scale-95"
                        }
                      `}
                      title="Delete file"
                    >
                      {isDeleting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Processing overlay */}
                {isProcessing && (
                  <div className="absolute inset-0 bg-gray-900/5 dark:bg-gray-100/5 backdrop-blur-[1px] rounded-xl pointer-events-none"></div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}