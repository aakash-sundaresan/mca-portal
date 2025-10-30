// src/App.js
import React, { useState, useEffect } from 'react';
import { AWS_CONFIG } from './config';
import Header from './components/Header';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import StatusMessage from './components/StatusMessage';
import DocumentTypeSelector from './components/DocumentTypeSelector';
import UploadSection from './components/UploadSection';
import ExcelGenerator from './components/ExcelGenerator';

const AWS = window.AWS;

export default function App() {
  const [s3Client, setS3Client] = useState(null);
  const [documentType, setDocumentType] = useState('auditors-report');
  const [currentPath, setCurrentPath] = useState('auditors-report/json/');
  const [pathHistory, setPathHistory] = useState([]);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [viewerFile, setViewerFile] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isPolling, setIsPolling] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);

  const uploadPath = `${documentType}/uploads/`;
  const resultsPath = `${documentType}/json/`;

  // Initialize AWS SDK
  useEffect(() => {
    try {
      AWS.config.update({
        region: AWS_CONFIG.region,
        accessKeyId: AWS_CONFIG.accessKeyId,
        secretAccessKey: AWS_CONFIG.secretAccessKey,
        signatureVersion: 'v4'
      });

      const s3 = new AWS.S3({
        region: AWS_CONFIG.region,
        credentials: new AWS.Credentials(
          AWS_CONFIG.accessKeyId,
          AWS_CONFIG.secretAccessKey
        )
      });

      setS3Client(s3);
      showMessage('System initialized successfully', 'success');
    } catch (error) {
      showMessage('Error initializing system: ' + error.message, 'error');
      console.error('AWS initialization error:', error);
    }
  }, []);

  // Load files when path changes
  useEffect(() => {
    if (s3Client && currentPath) {
      loadFiles(currentPath);
    }
  }, [s3Client, currentPath]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const getDocumentDisplayName = (type) => {
    const names = {
      'auditors-report': "Auditor's Report",
      'aoc4': 'AOC-4',
      'directors-report': "Director's Report"
    };
    return names[type] || type;
  };

  const handleDocumentTypeChange = (type) => {
    setDocumentType(type);
    const newResultsPath = `${type}/json/`;
    setCurrentPath(newResultsPath);
    setPathHistory([]);
    showMessage(
      `Switched to ${getDocumentDisplayName(type)}`,
      'success'
    );
  };

  const loadFiles = async (prefix) => {
    if (!s3Client) return;

    setIsLoading(true);
    try {
      const params = {
        Bucket: AWS_CONFIG.bucketName,
        Prefix: prefix,
        Delimiter: '/'
      };

      const data = await s3Client.listObjectsV2(params).promise();
      const fileList = [];

      // Add parent directory
      if (prefix && prefix !== '') {
        const parentPath =
          prefix.split('/').slice(0, -2).join('/') +
          (prefix.split('/').length > 2 ? '/' : '');
        fileList.push({
          name: '..',
          key: parentPath,
          type: 'parent',
          size: null
        });
      }

      // Add folders
      if (data.CommonPrefixes) {
        data.CommonPrefixes.forEach((prefixObj) => {
          const folderName = prefixObj.Prefix.replace(prefix, '').replace(
            /\/$/,
            ''
          );
          fileList.push({
            name: folderName,
            key: prefixObj.Prefix,
            type: 'folder',
            size: null
          });
        });
      }

      // Add files
      if (data.Contents) {
        data.Contents.forEach((object) => {
          if (object.Key === prefix || object.Key.endsWith('/')) return;
          const fileName = object.Key.split('/').pop();
          const fileType = fileName.split('.').pop().toLowerCase();
          fileList.push({
            name: fileName,
            key: object.Key,
            type: fileType,
            size: object.Size
          });
        });
      }

      setFiles(fileList);
    } catch (error) {
      showMessage('Error loading files: ' + error.message, 'error');
      console.error('Error loading files:', error);
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToPath = (path) => {
    if (path !== currentPath && currentPath) {
      setPathHistory((prev) => [...prev, currentPath]);
    }
    setCurrentPath(path);
  };

  const goBack = () => {
    if (pathHistory.length > 0) {
      const previousPath = pathHistory[pathHistory.length - 1];
      setPathHistory((prev) => prev.slice(0, -1));
      setCurrentPath(previousPath);
    } else {
      setCurrentPath('');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      showMessage('File selected: ' + file.name, 'success');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !s3Client) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const key = `${uploadPath}${selectedFile.name}`;
      const params = {
        Bucket: AWS_CONFIG.bucketName,
        Key: key,
        Body: selectedFile,
        ContentType: selectedFile.type || 'application/octet-stream'
      };

      const upload = s3Client.upload(params);

      upload.on('httpUploadProgress', (progress) => {
        const percentage = Math.round(
          (progress.loaded / progress.total) * 100
        );
        setUploadProgress(percentage);
      });

      await upload.promise();

      showMessage(
        'File uploaded successfully. Processing may take a few minutes.',
        'success'
      );
      
      const uploadedFileName = selectedFile.name;
      setSelectedFile(null);
      setIsPolling(true);
      startPolling(uploadedFileName);
    } catch (error) {
      showMessage('Upload failed: ' + error.message, 'error');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const startPolling = (fileName) => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    let pollCount = 0;
    const maxPolls = 36; // Poll for 6 minutes (36 * 10 seconds)

    const interval = setInterval(async () => {
      pollCount++;

      try {
        const baseFileName = fileName.replace(/\.[^/.]+$/, '');
        const jsonKey = `${resultsPath}${baseFileName}.json`;

        console.log(
          `Polling attempt ${pollCount}/${maxPolls} - Looking for: ${jsonKey}`
        );

        const exists = await checkFileExists(jsonKey);

        if (exists) {
          clearInterval(interval);
          setPollingInterval(null);
          setIsPolling(false);
          showMessage('Processing complete. Result file is ready.', 'success');
          setCurrentPath(resultsPath);
          
          setTimeout(() => {
            viewFile({
              name: `${baseFileName}.json`,
              key: jsonKey,
              type: 'json'
            });
          }, 500);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }

      if (pollCount >= maxPolls) {
        clearInterval(interval);
        setPollingInterval(null);
        setIsPolling(false);
        showMessage(
          'Polling stopped after 6 minutes. Please check manually for results.',
          'info'
        );
      }
    }, 10000);

    setPollingInterval(interval);
  };

  const checkFileExists = async (key) => {
    try {
      const params = {
        Bucket: AWS_CONFIG.bucketName,
        Key: key
      };

      await s3Client.headObject(params).promise();
      return true;
    } catch (error) {
      if (error.code === 'NotFound' || error.code === '404') {
        return false;
      }
      console.error('Error checking file:', error);
      return false;
    }
  };

  const viewFile = async (file) => {
    try {
      const params = { Bucket: AWS_CONFIG.bucketName, Key: file.key };
      const data = await s3Client.getObject(params).promise();

      setViewerFile({
        name: file.name,
        key: file.key,
        content: data.Body.toString(),
        type: file.type
      });
    } catch (error) {
      showMessage('Error loading file: ' + error.message, 'error');
      console.error('Error viewing file:', error);
    }
  };

  const handleFileClick = (file) => {
    if (file.type === 'folder' || file.type === 'parent') {
      navigateToPath(file.key);
    } else {
      viewFile(file);
    }
  };

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <main>
          <h1>Hello {user.username}</h1>
          <button onClick={signOut}>Sign out</button>

        <div className="min-h-screen bg-gray-100">
          <div className="max-w-7xl mx-auto">
            <Header />

            {/* Status Message */}
            <StatusMessage message={message} />

            <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
              {/* Document Type Selector */}
              <DocumentTypeSelector
                documentType={documentType}
                onChange={handleDocumentTypeChange}
              />

              {/* Upload Section */}
              <UploadSection
                selectedFile={selectedFile}
                onFileSelect={handleFileSelect}
                onUpload={handleUpload}
                isUploading={isUploading}
                uploadProgress={uploadProgress}
                isPolling={isPolling}
                uploadPath={uploadPath}
                resultsPath={resultsPath}
                onCheckResults={() => setCurrentPath(resultsPath)}
              />

              {/* Excel Generator Section */}
              <ExcelGenerator
                documentType={documentType}
                s3Client={s3Client}
                bucketName={AWS_CONFIG.bucketName}
                onShowMessage={showMessage}
              />
            </div>
          </div>
        </div>
        </main>
      )}

    </Authenticator>
  );
}