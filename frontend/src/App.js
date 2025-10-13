import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [selectedUpload, setSelectedUpload] = useState(null);
  const [jsonData, setJsonData] = useState(null);
  const [jsonError, setJsonError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load existing uploads on component mount
  useEffect(() => {
    loadUploads();
  }, []);

  const loadUploads = async () => {
    try {
      const response = await axios.get('/api/uploads');
      setUploads(response.data);
    } catch (error) {
      console.error('Error loading uploads:', error);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setSuccess(null);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setSuccess(null);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('document', selectedFile);

    try {
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('File uploaded successfully! Processing...');
      setUploadStatus(response.data);
      
      // Start polling for status updates
      pollUploadStatus(response.data.uploadId);
      
      // Reload uploads list
      loadUploads();
      
    } catch (error) {
      setError(`Upload failed: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const pollUploadStatus = async (uploadId) => {
    const maxAttempts = 120; // 2 minutes max for pipeline processing
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await axios.get(`/api/status/${uploadId}`);
        const status = response.data;

        if (status.status === 'completed') {
          setSuccess('Pipeline processing completed! JSON is now available.');
          setUploadStatus(status);
          loadUploads(); // Reload to show updated status
          return;
        } else if (status.status === 'error') {
          setError('Processing failed');
          setUploadStatus(status);
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000); // Poll every 2 seconds (pipeline may take longer)
        } else {
          setError('Pipeline processing timeout - please check status manually or try refreshing');
        }
      } catch (error) {
        console.error('Error polling status:', error);
        setError('Error checking upload status');
      }
    };

    poll();
  };

  const loadJsonData = async (uploadId) => {
    try {
      setJsonError(null);
      const response = await axios.get(`/api/json/${uploadId}`);
      setJsonData(response.data);
      setSelectedUpload(uploadId);
    } catch (error) {
      setJsonError(`Failed to load JSON data: ${error.response?.data?.error || error.message}`);
      setJsonData(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Data table viewer component
  const DataViewer = ({ data, title = "Pipeline Data" }) => {
    const [expandedItems, setExpandedItems] = useState(new Set());
    
    const toggleExpanded = (id) => {
      setExpandedItems(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return newSet;
      });
    };
    const formatValue = (value) => {
      if (value === null || value === undefined) {
        return <span className="null-value">Not Available</span>;
      }
      
      if (typeof value === "boolean") {
        return (
          <span className={`boolean-value ${value ? 'true' : 'false'}`}>
            {value ? '✓ Yes' : '✗ No'}
          </span>
        );
      }
      
      if (typeof value === "number") {
        return <span className="number-value">{value.toLocaleString()}</span>;
      }
      
      if (typeof value === "string") {
        // Check if it's a date string
        if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
          return (
            <div className="date-value">
              <div className="date-formatted">{new Date(value).toLocaleString()}</div>
              <div className="date-iso">{value}</div>
            </div>
          );
        }
        
        // Check if it's a URL or file path
        if (value.startsWith('http') || value.includes('s3://') || value.includes('/')) {
          return (
            <div className="path-value">
              <span className="path-text">{value}</span>
              {value.startsWith('http') && (
                <a href={value} target="_blank" rel="noopener noreferrer" className="external-link">
                  🔗 Open
                </a>
              )}
            </div>
          );
        }
        
        return <span className="string-value">{value}</span>;
      }
      
      if (Array.isArray(value)) {
        if (value.length === 0) {
          return <span className="empty-array">No items</span>;
        }
        
        const arrayId = `array-${JSON.stringify(value).slice(0, 50)}`;
        const isExpanded = expandedItems.has(arrayId);
        
        return (
          <div className="array-container">
            <div className="array-header" onClick={() => toggleExpanded(arrayId)}>
              <span className="array-count">
                {value.length} item{value.length !== 1 ? 's' : ''}
              </span>
              <button className="expand-button">
                {isExpanded ? '▼' : '▶'}
              </button>
            </div>
            {isExpanded && (
              <div className="array-items">
                {value.map((item, index) => (
                  <div key={index} className="array-item">
                    <span className="array-index">[{index}]</span>
                    {formatValue(item)}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }
      
      if (typeof value === "object") {
        const keys = Object.keys(value);
        const objectId = `object-${JSON.stringify(value).slice(0, 50)}`;
        const isExpanded = expandedItems.has(objectId);
        
        return (
          <div className="object-container">
            <div className="object-header" onClick={() => toggleExpanded(objectId)}>
              <span className="object-summary">
                {keys.length} propert{keys.length !== 1 ? 'ies' : 'y'}
              </span>
              <button className="expand-button">
                {isExpanded ? '▼' : '▶'}
              </button>
            </div>
            {isExpanded && (
              <div className="object-items">
                {keys.map((key) => (
                  <div key={key} className="object-item">
                    <div className="object-key">{formatKeyName(key)}</div>
                    <div className="object-value">{formatValue(value[key])}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }
      
      return <span className="unknown-value">{String(value)}</span>;
    };

    const renderAsTable = () => {
      const keys = Object.keys(data);
      
      return (
        <div className="data-table-container">
          <table className="data-table">
            <tbody>
              {keys.map((key) => (
                <tr key={key} className="data-row">
                  <td className="data-key">
                    <span className="key-label">{formatKeyName(key)}</span>
                  </td>
                  <td className="data-value">
                    {formatValue(data[key])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    };

    const formatKeyName = (key) => {
      // Convert camelCase to Title Case
      return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
    };

    return (
      <div className="data-viewer">
        <div className="data-viewer-header">
          <h3>{title}</h3>
          <div className="data-viewer-actions">
            <button 
              className="copy-json-btn"
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(data, null, 2));
              }}
            >
              📋 Copy Raw JSON
            </button>
          </div>
        </div>
        <div className="data-viewer-content">
          {renderAsTable()}
        </div>
      </div>
    );
  };

  return (
    <div className="container">
      <div className="header">
        <h1>MCA Portal</h1>
        <p>Document Upload & Processing System</p>
      </div>

      {/* Upload Section */}
      <div className="upload-section">
        <h2>Upload Document</h2>
        
        <div 
          className="upload-area"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => document.getElementById('fileInput').click()}
        >
          <div className="upload-icon">📁</div>
          <div className="upload-text">
            {selectedFile ? selectedFile.name : 'Click to select a file or drag and drop'}
          </div>
          <div className="upload-subtext">
            {selectedFile ? `Size: ${formatFileSize(selectedFile.size)}` : 'Supported formats: PDF, DOC, DOCX, TXT, etc.'}
          </div>
        </div>

        <input
          id="fileInput"
          type="file"
          className="file-input"
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
        />

        <button 
          className="upload-button"
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
        >
          {isUploading ? (
            <>
              <span className="loading"></span>
              Uploading...
            </>
          ) : (
            'Upload Document'
          )}
        </button>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
      </div>

      {/* Upload Status */}
        {uploadStatus && (
        <div className="status-section">
          <h2>Upload Status</h2>
          <div className="status-item">
            <div className="status-header">
              <span className="status-title">{uploadStatus.fileName}</span>
              <span className={`status-badge ${uploadStatus.status}`}>
                {uploadStatus.status}
              </span>
            </div>
            <p>Upload ID: {uploadStatus.uploadId}</p>
            {uploadStatus.message && (
              <p><em>{uploadStatus.message}</em></p>
            )}
            {uploadStatus.status === 'completed' && (
              <button 
                className="refresh-button"
                onClick={() => loadJsonData(uploadStatus.uploadId)}
              >
                View Pipeline JSON
              </button>
            )}
            {uploadStatus.status === 'processing' && (
              <p><strong>Waiting for pipeline to process...</strong></p>
            )}
          </div>
        </div>
      )}

      {/* All Uploads */}
      {uploads.length > 0 && (
        <div className="status-section">
          <h2>All Uploads</h2>
          {uploads.map((upload) => (
            <div key={upload.id} className="status-item">
              <div className="status-header">
                <span className="status-title">{upload.fileName}</span>
                <span className={`status-badge ${upload.status}`}>
                  {upload.status}
                </span>
              </div>
              <p>Upload ID: {upload.id}</p>
              {upload.status === 'completed' && (
                <button 
                  className="refresh-button"
                  onClick={() => loadJsonData(upload.id)}
                >
                  View Pipeline JSON
                </button>
              )}
              {upload.status === 'processing' && (
                <p><em>Pipeline processing...</em></p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Data Display */}
      {jsonData && (
        <div className="json-display">
          <DataViewer 
            data={jsonData} 
            title="Pipeline Analysis Results"
          />
          <div className="json-metadata">
            <p><strong>Upload ID:</strong> {selectedUpload}</p>
            <p><strong>Source:</strong> Your existing pipeline (bucket/auditors-report/json/)</p>
          </div>
        </div>
      )}

      {/* JSON Error Display */}
      {jsonError && (
        <div className="json-display">
          <div className="error-message">{jsonError}</div>
        </div>
      )}
    </div>
  );
}

export default App;
