// src/components/ExcelGenerator.jsx
import React, { useState, useEffect } from "react";
import { FileJson, Zap, Download, RefreshCw, CheckCircle, Upload, X } from "lucide-react";

export default function ExcelGenerator({
  documentType,
  s3Client,
  bucketName,
  onShowMessage
}) {
  const [jsonFiles, setJsonFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingKey, setProcessingKey] = useState(null);
  const [readyFiles, setReadyFiles] = useState({});
  const [downloadingKey, setDownloadingKey] = useState(null);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedJsonKey, setSelectedJsonKey] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingTemplate, setUploadingTemplate] = useState(false);

  const API_URL =
    "https://wwiacs7356.execute-api.us-east-2.amazonaws.com/default/excel-filler-from-json";

  useEffect(() => {
    if (s3Client) loadJsonFiles();
  }, [s3Client, documentType]);

  // 🔹 Check if Excel file exists for a JSON file
  const checkExcelExists = async (jsonKey) => {
    try {
      const jsonName = jsonKey.split("/").pop().replace(".json", "");
      const filledPrefix = `${documentType}/filled/${jsonName}/`;

      const data = await s3Client
        .listObjectsV2({ Bucket: bucketName, Prefix: filledPrefix })
        .promise();

      return data.Contents && data.Contents.length > 0;
    } catch (err) {
      console.error("Error checking Excel existence:", err);
      return false;
    }
  };

  // 🔹 Load all JSON files and check which have Excel files
  const loadJsonFiles = async () => {
    setIsLoading(true);
    try {
      const jsonPrefix = `${documentType}/json/`;
      const response = await s3Client
        .listObjectsV2({ Bucket: bucketName, Prefix: jsonPrefix })
        .promise();

      const files =
        response.Contents?.filter((f) => f.Key.endsWith(".json")).map((f) => ({
          key: f.Key,
          name: f.Key.split("/").pop()
        })) || [];

      setJsonFiles(files);

      const readyStatus = {};
      await Promise.all(
        files.map(async (file) => {
          const hasExcel = await checkExcelExists(file.key);
          if (hasExcel) {
            readyStatus[file.key] = true;
          }
        })
      );
      setReadyFiles(readyStatus);

      onShowMessage?.(`Loaded ${files.length} JSON files`, "success");
    } catch (err) {
      console.error("Error loading JSON files:", err);
      onShowMessage?.("Error loading JSON files: " + err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // 🔹 Upload template to S3
  const uploadTemplate = async (jsonKey, file) => {
    try {
      const jsonName = jsonKey.split("/").pop().replace(".json", "");
      const templateKey = `${documentType}/template/${jsonName}/template.xlsx`;

      await s3Client
        .upload({
          Bucket: bucketName,
          Key: templateKey,
          Body: file,
          ContentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        })
        .promise();

      onShowMessage?.(`Template uploaded for ${jsonName}`, "success");
      return templateKey;
    } catch (err) {
      console.error("Error uploading template:", err);
      throw new Error("Failed to upload template: " + err.message);
    }
  };

  // 🔹 Open modal for template upload
  const openTemplateModal = (jsonKey) => {
    setSelectedJsonKey(jsonKey);
    setSelectedFile(null);
    setShowModal(true);
  };

  // 🔹 Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedJsonKey(null);
    setSelectedFile(null);
    setIsDragging(false);
  };

  // 🔹 Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setSelectedFile(file);
    } else {
      onShowMessage?.("Please select a valid Excel file (.xlsx or .xls)", "error");
    }
  };

  // 🔹 Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setSelectedFile(file);
    } else {
      onShowMessage?.("Please select a valid Excel file (.xlsx or .xls)", "error");
    }
  };

  // 🔹 Handle template upload and generation
  const handleUploadAndGenerate = async () => {
    if (!selectedFile || !selectedJsonKey) return;

    setUploadingTemplate(true);
    try {
      // Upload template
      await uploadTemplate(selectedJsonKey, selectedFile);
      
      // Close modal
      closeModal();
      
      // Generate Excel
      await handleGenerate(selectedJsonKey);
    } catch (err) {
      onShowMessage?.("Template upload failed: " + err.message, "error");
    } finally {
      setUploadingTemplate(false);
    }
  };

  // 🔹 Generate Excel
  const handleGenerate = async (jsonKey) => {
    setProcessingKey(jsonKey);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json_key: jsonKey })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to generate Excel");

      onShowMessage?.(`Excel generated for ${jsonKey}`, "success");
      setReadyFiles((prev) => ({ ...prev, [jsonKey]: true }));
    } catch (err) {
      console.error("Error generating Excel:", err);
      onShowMessage?.("Generation failed: " + err.message, "error");
    } finally {
      setProcessingKey(null);
    }
  };

  // 🔹 Download Excel
  const handleDownload = async (jsonKey) => {
    setDownloadingKey(jsonKey);
    try {
      const jsonName = jsonKey.split("/").pop().replace(".json", "");
      const filledPrefix = `${documentType}/filled/${jsonName}/`;

      const data = await s3Client
        .listObjectsV2({ Bucket: bucketName, Prefix: filledPrefix })
        .promise();

      if (!data.Contents || data.Contents.length === 0) {
        onShowMessage?.("No Excel versions found for this JSON.", "info");
        return;
      }

      const latest = data.Contents.sort(
        (a, b) => new Date(b.LastModified) - new Date(a.LastModified)
      )[0];

      const url = s3Client.getSignedUrl("getObject", {
        Bucket: bucketName,
        Key: latest.Key,
        Expires: 300
      });

      const response = await fetch(url);
      const blob = await response.blob();
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = latest.Key.split("/").pop();
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      onShowMessage?.(`Downloaded: ${latest.Key.split("/").pop()}`, "success");
    } catch (err) {
      console.error("Download failed:", err);
      onShowMessage?.("Download failed: " + err.message, "error");
    } finally {
      setDownloadingKey(null);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-green-50 rounded-lg">
            <FileJson className="w-5 h-5 text-green-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            Excel Generator
          </h2>
        </div>

        {isLoading ? (
          <div className="text-center text-gray-500 py-8">Loading JSON files...</div>
        ) : jsonFiles.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No JSON files found.</div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {jsonFiles.map((file) => {
              const isProcessing = processingKey === file.key;
              const isReady = readyFiles[file.key];
              const isDownloading = downloadingKey === file.key;

              return (
                <div
                  key={file.key}
                  className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileJson className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">{file.name}</span>
                  </div>

                  <div className="flex gap-2">
                    {!isReady ? (
                      <button
                        onClick={() => openTemplateModal(file.key)}
                        disabled={isProcessing}
                        className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
                          isProcessing
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {isProcessing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4" />
                            Generate
                          </>
                        )}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => openTemplateModal(file.key)}
                          disabled={isProcessing}
                          className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
                            isProcessing
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-gray-600 text-white hover:bg-gray-700"
                          }`}
                        >
                          {isProcessing ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Regenerating...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4" />
                              Regenerate
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleDownload(file.key)}
                          disabled={isDownloading}
                          className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
                            isDownloading
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-green-600 text-white hover:bg-green-700"
                          }`}
                        >
                          {isDownloading ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Preparing...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4" />
                              Download
                            </>
                          )}
                        </button>

                        <div className="flex items-center px-2">
                          <CheckCircle className="w-4 h-4 text-green-600" title="Ready" />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Template Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Upload Template
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedJsonKey?.split("/").pop().replace(".json", "")}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {/* Drag & Drop Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                  isDragging
                    ? "border-blue-500 bg-blue-50"
                    : selectedFile
                    ? "border-green-500 bg-green-50"
                    : "border-gray-300 bg-gray-50 hover:border-gray-400"
                }`}
              >
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-green-100 rounded-full">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Upload className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Drop your Excel template here
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        or click to browse files
                      </p>
                    </div>
                    <label className="cursor-pointer">
                      <span className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors">
                        Choose File
                      </span>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-400">
                      Supported formats: .xlsx, .xls
                    </p>
                  </div>
                )}
              </div>

              {/* Info Box */}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> This template will be used to generate the Excel file 
                  from the JSON data. Make sure it matches your required format.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button
                onClick={closeModal}
                disabled={uploadingTemplate}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadAndGenerate}
                disabled={!selectedFile || uploadingTemplate}
                className={`px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${
                  !selectedFile || uploadingTemplate
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {uploadingTemplate ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Upload & Generate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}