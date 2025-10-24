// src/components/ExcelGenerator.jsx
import React, { useState, useEffect } from "react";
import { FileJson, Zap, Download, RefreshCw, CheckCircle, Upload } from "lucide-react";

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
  const [uploadingTemplate, setUploadingTemplate] = useState(null);

  const API_URL =
    "https://wwiacs7356.execute-api.us-east-2.amazonaws.com/default/excel-filler-from-json";

  useEffect(() => {
    if (s3Client) loadJsonFiles();
  }, [s3Client, documentType]);

  // 🔹 Check if template exists for a JSON file
  const checkTemplateExists = async (jsonKey) => {
    try {
      const jsonName = jsonKey.split("/").pop().replace(".json", "");
      const templateKey = `${documentType}/template/${jsonName}/template.xlsx`;

      await s3Client
        .headObject({ Bucket: bucketName, Key: templateKey })
        .promise();
      
      return true;
    } catch (err) {
      return false;
    }
  };

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

  // 🔹 Handle template selection and upload
  const handleTemplateUpload = (jsonKey) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx,.xls";
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      setUploadingTemplate(jsonKey);
      try {
        await uploadTemplate(jsonKey, file);
        await handleGenerate(jsonKey);
      } catch (err) {
        onShowMessage?.("Template upload failed: " + err.message, "error");
      } finally {
        setUploadingTemplate(null);
      }
    };

    input.click();
  };

  // 🔹 Generate Excel
  const handleGenerate = async (jsonKey, skipTemplateCheck = false) => {
    setProcessingKey(jsonKey);
    try {
      if (!skipTemplateCheck) {
        const hasTemplate = await checkTemplateExists(jsonKey);
        if (!hasTemplate) {
          setProcessingKey(null);
          handleTemplateUpload(jsonKey);
          return;
        }
      }

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
            const isUploadingTemplate = uploadingTemplate === file.key;

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
                      onClick={() => handleGenerate(file.key)}
                      disabled={isProcessing || isUploadingTemplate}
                      className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
                        isProcessing || isUploadingTemplate
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {isUploadingTemplate ? (
                        <>
                          <Upload className="w-4 h-4" />
                          Uploading...
                        </>
                      ) : isProcessing ? (
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
                        onClick={() => handleGenerate(file.key, true)}
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
  );
}