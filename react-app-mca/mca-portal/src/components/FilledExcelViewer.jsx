// src/components/FilledExcelViewer.jsx - Complete version
import React, { useState, useEffect } from "react";
import { FileSpreadsheet, Download, RefreshCw, Trash2 } from "lucide-react";

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

  // Load all filled Excel files
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

  // Download Excel file
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

  // Delete file
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
      loadFilledFiles(); // Reload the list
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-lg">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            Filled Excel Files
          </h2>
        </div>
        <button
          onClick={loadFilledFiles}
          disabled={isLoading}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="text-center text-gray-500 py-8 flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
          <p>Loading files...</p>
        </div>
      ) : filledFiles.length === 0 ? (
        <div className="text-center py-12">
          <FileSpreadsheet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-base font-medium mb-1">No filled Excel files yet</p>
          <p className="text-gray-400 text-sm">Upload a document and template to get started</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {filledFiles.map((file) => {
            const isDownloading = downloadingKey === file.key;
            const isDeleting = deletingKey === file.key;

            return (
              <div
                key={file.key}
                className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-all group"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <FileSpreadsheet className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                      {file.name}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span>{formatDate(file.lastModified)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  <button
                    onClick={() => handleDownload(file)}
                    disabled={isDownloading || isDeleting}
                    className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
                      isDownloading || isDeleting
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
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

                  <button
                    onClick={() => handleDelete(file)}
                    disabled={isDownloading || isDeleting}
                    className={`p-2 rounded-md text-sm font-medium transition-colors ${
                      isDownloading || isDeleting
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-red-50 text-red-600 hover:bg-red-100"
                    }`}
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
            );
          })}
        </div>
      )}
    </div>
  );
}