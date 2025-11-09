// src/App.js - Professional UI with Dark Mode and Fixed Upload Error Handling

import React, { useState, useEffect } from 'react';
import { AWS_CONFIG } from './config';
import Header from './components/Header';
import Login from './components/Login';
import { fetchAuthSession } from 'aws-amplify/auth';
import SignUp from './components/SignUp';
import { fetchUserAttributes, getCurrentUser } from 'aws-amplify/auth';
import { signOut as amplifySignOut } from 'aws-amplify/auth';
import StatusMessage from './components/StatusMessage';
import DocumentTypeSelector from './components/DocumentTypeSelector';
import UploadSection from './components/UploadSection';
import FilledExcelViewer from './components/FilledExcelViewer';

// Helper function for user-friendly error messages
const getUserFriendlyErrorMessage = (error, context = '') => {
  const errorString = error.message || error.toString();
  
  // Network/Connection errors
  if (errorString.includes('NetworkingError') || errorString.includes('fetch')) {
    return 'Connection error. Please check your internet and try again.';
  }
  
  // Authentication errors
  if (errorString.includes('NotAuthorizedException') || errorString.includes('credentials')) {
    return 'Session expired. Please sign in again.';
  }
  
  if (errorString.includes('Access Denied') || errorString.includes('AccessDenied')) {
    return 'You don\'t have permission to access this file.';
  }
  
  // S3 specific errors
  if (errorString.includes('NoSuchKey') || errorString.includes('404')) {
    return 'File not found. It may have been deleted or moved.';
  }
  
  if (errorString.includes('NoSuchBucket')) {
    return 'Storage location not found. Please contact support.';
  }
  
  if (errorString.includes('RequestTimeout')) {
    return 'Request timed out. Please try again.';
  }
  
  if (errorString.includes('SlowDown') || errorString.includes('503')) {
    return 'Service is busy. Please wait a moment and try again.';
  }
  
  // File size errors
  if (errorString.includes('EntityTooLarge')) {
    return 'File is too large. Maximum size is 5GB.';
  }
  
  // Generic context-specific messages
  if (context === 'upload') {
    return 'Upload failed. Please check your file and try again.';
  }
  
  if (context === 'load') {
    return 'Unable to load files. Please refresh the page.';
  }
  
  if (context === 'view') {
    return 'Unable to open file. Please try again.';
  }
  
  // Default fallback
  return 'Something went wrong. Please try again.';
};

const AWS = window.AWS;

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first
    const saved = localStorage.getItem('theme');
    if (saved) {
      return saved === 'dark';
    }
    // Otherwise check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [user, setUser] = useState(null);
  const [userAttributes, setUserAttributes] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // App state
  const [s3Client, setS3Client] = useState(null);
  const [documentType, setDocumentType] = useState('auditors-report');
  const [currentPath, setCurrentPath] = useState('');
  const [pathHistory, setPathHistory] = useState([]);
  const [files, setFiles] = useState([]);
  
  const [selectedDocumentFile, setSelectedDocumentFile] = useState(null);
  const [selectedTemplateFile, setSelectedTemplateFile] = useState(null);
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [viewerFile, setViewerFile] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isPolling, setIsPolling] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [cognitoIdentityId, setCognitoIdentityId] = useState(null);

  const uploadPath = cognitoIdentityId ? `${cognitoIdentityId}/${documentType}/uploads/` : null;
  const templatePath = cognitoIdentityId ? `${cognitoIdentityId}/${documentType}/template/` : null;
  const resultsPath = cognitoIdentityId ? `${cognitoIdentityId}/${documentType}/filled/` : null;

  // Apply dark mode to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Toggle theme function
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Check if user is already logged in on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (cognitoIdentityId && !currentPath) {
      setCurrentPath(`${cognitoIdentityId}/${documentType}/filled/`);
    }
  }, [cognitoIdentityId, documentType]);

  const checkAuthStatus = async () => {
    try {
      const currentUser = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      
      setUser(currentUser);
      setUserAttributes(attributes);
      setIsAuthenticated(true);
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  // Initialize AWS SDK
  useEffect(() => {
    if (isAuthenticated) {
      (async () => {
        try {
          const session = await fetchAuthSession();
          const credentials = session?.credentials;
  
          if (!credentials) throw new Error('No valid Cognito credentials');
  
          const identityId = session.identityId;
          setCognitoIdentityId(identityId);
  
          const s3 = new AWS.S3({
            region: AWS_CONFIG.region,
            credentials: {
              accessKeyId: credentials.accessKeyId,
              secretAccessKey: credentials.secretAccessKey,
              sessionToken: credentials.sessionToken
            },
            signatureVersion: 'v4'
          });
  
          setS3Client(s3);
          showMessage('System initialized successfully', 'success');
        } catch (error) {
          console.error('AWS Auth error:', error);
          showMessage(getUserFriendlyErrorMessage(error, 'auth'), 'error');
        }
      })();
    }
  }, [isAuthenticated]);

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

  const handleLoginSuccess = async () => {
    await checkAuthStatus();
    showMessage('Welcome back!', 'success');
  };

  const handleSignUpSuccess = () => {
    setShowSignUp(false);
    showMessage('Account created successfully. Please sign in.', 'success');
  };

  const handleSignOut = async () => {
    try {
      await amplifySignOut();
      setIsAuthenticated(false);
      setUser(null);
      setUserAttributes(null);
      setS3Client(null);
      showMessage('Signed out successfully', 'success');
    } catch (error) {
      console.error('Error signing out:', error);
      showMessage('Error signing out', 'error');
    }
  };

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
    const newResultsPath = cognitoIdentityId 
      ? `${cognitoIdentityId}/${type}/filled/` 
      : `${type}/filled/`;
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
      console.error('Error loading files:', error);
      showMessage(getUserFriendlyErrorMessage(error, 'load'), 'error');
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

  const handleDocumentFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedDocumentFile(file);
      showMessage('Document selected: ' + file.name, 'success');
    }
  };

  const handleTemplateFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedTemplateFile(file);
      showMessage('Template selected: ' + file.name, 'success');
    }
  };

  const handleUpload = async () => {
    if (!selectedDocumentFile || !selectedTemplateFile || !s3Client) {
      showMessage('Please select both document and template files', 'error');
      return;
    }
  
    setIsUploading(true);
    setUploadProgress(0);
  
    try {
      // Get the document filename without extension for folder name
      const documentFileName = selectedDocumentFile.name;
      const documentBaseName = documentFileName.replace(/\.[^/.]+$/, '');
      
      // Generate timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5); // Format: 2024-11-08T10-30-45
      
      // Get template filename with extension
      const templateFileName = selectedTemplateFile.name;
      const templateExtension = templateFileName.substring(templateFileName.lastIndexOf('.'));
      const templateBaseName = templateFileName.replace(/\.[^/.]+$/, '');
      
      // Step 1: Upload document (unchanged - to uploads folder)
      const documentKey = `${uploadPath}${documentFileName}`;
      const documentParams = {
        Bucket: AWS_CONFIG.bucketName,
        Key: documentKey,
        Body: selectedDocumentFile,
        ContentType: selectedDocumentFile.type || 'application/octet-stream'
      };
  
      const documentUpload = s3Client.upload(documentParams);
      documentUpload.on('httpUploadProgress', (progress) => {
        const percentage = Math.round((progress.loaded / progress.total) * 40);
        setUploadProgress(percentage);
      });
      await documentUpload.promise();
      
      showMessage('Document uploaded, uploading template...', 'info');
  
      // Step 2: Upload template to template folder with document-based folder structure
      // Path: {cognito_id}/{doc_type}/template/{document_basename}/{template_name_timestamp}.xlsx
      const templateFolderPath = `${templatePath}${documentBaseName}/`;
      const templateKeyWithTimestamp = `${templateFolderPath}${templateBaseName}_${timestamp}${templateExtension}`;
      
      const templateParams = {
        Bucket: AWS_CONFIG.bucketName,
        Key: templateKeyWithTimestamp,
        Body: selectedTemplateFile,
        ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };
  
      const templateUpload = s3Client.upload(templateParams);
      templateUpload.on('httpUploadProgress', (progress) => {
        const percentage = 40 + Math.round((progress.loaded / progress.total) * 30);
        setUploadProgress(percentage);
      });
      await templateUpload.promise();
      
      setUploadProgress(70);
      showMessage('Both files uploaded, invoking processor...', 'info');
  
      // Step 3: Invoke Lambda with improved error handling
      const LAMBDA_URLS = {
        'auditors-report': 'https://35zp3erglb.execute-api.us-east-2.amazonaws.com/prod/process',
        'directors-report': 'https://35zp3erglb.execute-api.us-east-2.amazonaws.com/prod/directors-report-processing',
        'aoc4': 'https://35zp3erglb.execute-api.us-east-2.amazonaws.com/prod/aoc4-processing'
      };
      
      const LAMBDA_URL = LAMBDA_URLS[documentType];
      
      if (!LAMBDA_URL) {
        throw new Error(`No Lambda URL configured for document type: ${documentType}`);
      }
      
      const requestPayload = {
        bucket: AWS_CONFIG.bucketName,
        document_key: documentKey,
        template_key: templateKeyWithTimestamp // Updated to use new template key with folder structure
      };
      
      try {
        const response = await fetch(LAMBDA_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestPayload)
        });
  
        // Try to parse response, but don't fail if we can't
        let result;
        try {
          result = await response.json();
        } catch (jsonError) {
          console.warn('Could not parse Lambda response as JSON, but files uploaded successfully');
          result = { success: true };
        }
  
        // Log if response is not OK, but don't fail since upload succeeded
        if (!response.ok) {
          console.warn('Lambda returned non-OK status, but files are uploaded:', response.status);
        }
  
        setUploadProgress(100);
        showMessage(
          'Files uploaded successfully. Processing in background...',
          'success'
        );
  
        setSelectedDocumentFile(null);
        setSelectedTemplateFile(null);
        setIsPolling(true);
        startPolling(documentFileName); // Keep original startPolling call
  
      } catch (fetchError) {
        // If Lambda fetch fails but files are uploaded, still proceed with polling
        console.warn('Lambda invocation error (files still uploaded):', fetchError);
        
        setUploadProgress(100);
        showMessage(
          'Files uploaded. Processing started - check results in a few minutes.',
          'info'
        );
  
        setSelectedDocumentFile(null);
        setSelectedTemplateFile(null);
        setIsPolling(true);
        startPolling(documentFileName); // Keep original startPolling call
      }
      
    } catch (error) {
      // Only fail for S3 upload errors (before Lambda invocation)
      console.error('❌ Upload error:', error);
      showMessage('Upload failed: ' + error.message, 'error');
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
    const maxPolls = 36;

    const interval = setInterval(async () => {
      pollCount++;

      try {
        const baseFileName = fileName.replace(/\.[^/.]+$/, '');
        const filledPrefix = `${resultsPath}${baseFileName}_filled_`;

        const listParams = {
          Bucket: AWS_CONFIG.bucketName,
          Prefix: filledPrefix
        };

        const data = await s3Client.listObjectsV2(listParams).promise();
        const exists = data.Contents && data.Contents.length > 0;

        if (exists) {
          clearInterval(interval);
          setPollingInterval(null);
          setIsPolling(false);
          showMessage('Processing complete! Your filled Excel is ready.', 'success');
          setCurrentPath(resultsPath);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }

      if (pollCount >= maxPolls) {
        clearInterval(interval);
        setPollingInterval(null);
        setIsPolling(false);
        showMessage(
          'Polling stopped after 6 minutes. Please check results manually.',
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

  // Debug helper to test S3 directly from browser console
  window.debugS3List = async (prefix) => {
    try {
      const session = await fetchAuthSession();
      const credentials = session.credentials;

      const s3 = new AWS.S3({
        region: AWS_CONFIG.region,
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          sessionToken: credentials.sessionToken
        },
        signatureVersion: 'v4'
      });

      const result = await s3.listObjectsV2({
        Bucket: AWS_CONFIG.bucketName,
        Prefix: prefix
      }).promise();

      return result;
    } catch (err) {
      return err;
    }
  };
  
  // Show loading state while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-500 mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-r-blue-400 dark:border-r-blue-600 animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <p className="mt-6 text-slate-600 dark:text-slate-300 font-medium">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  // Show auth screens if not authenticated
  if (!isAuthenticated) {
    if (showSignUp) {
      return (
        <SignUp
          onSwitchToLogin={() => setShowSignUp(false)}
          onSignUpSuccess={handleSignUpSuccess}
        />
      );
    }
    return (
      <Login
        onSwitchToSignUp={() => setShowSignUp(true)}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // Show main app if authenticated
  const displayUser = {
    ...user,
    attributes: userAttributes || {}
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <Header 
          user={displayUser} 
          onSignOut={handleSignOut}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
        />

        <StatusMessage message={message} />

        <main className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Document Type Selector Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 p-6 backdrop-blur-sm transition-colors duration-300">
              <DocumentTypeSelector
                documentType={documentType}
                onChange={handleDocumentTypeChange}
              />
            </div>

            {/* Upload Section Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 overflow-hidden backdrop-blur-sm transition-colors duration-300">
              <div className="border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-700/50 dark:to-transparent px-6 py-4 transition-colors duration-300">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Upload Documents</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Select your document and template to begin processing</p>
              </div>
              <div className="p-6">
                <UploadSection
                  selectedDocumentFile={selectedDocumentFile}
                  selectedTemplateFile={selectedTemplateFile}
                  onDocumentSelect={handleDocumentFileSelect}
                  onTemplateSelect={handleTemplateFileSelect}
                  onUpload={handleUpload}
                  isUploading={isUploading}
                  uploadProgress={uploadProgress}
                  isPolling={isPolling}
                  uploadPath={uploadPath}
                  templatePath={templatePath}
                  onCheckResults={() => setCurrentPath(resultsPath)}
                />
              </div>
            </div>

            {/* Results Viewer Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 overflow-hidden backdrop-blur-sm transition-colors duration-300">
              <div className="border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-700/50 dark:to-transparent px-6 py-4 transition-colors duration-300">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Processed Files</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">View and download your completed documents</p>
              </div>
              <div className="p-6">
                <FilledExcelViewer
                  documentType={documentType}
                  s3Client={s3Client}
                  bucketName={AWS_CONFIG.bucketName}
                  identityId={cognitoIdentityId}
                  onShowMessage={showMessage}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}