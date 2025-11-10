// src/App.js - Simplified UI that calls Lambda → Fargate

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

const AWS = window.AWS;

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
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
  const [selectedDocumentFile, setSelectedDocumentFile] = useState(null);
  const [selectedTemplateFile, setSelectedTemplateFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isPolling, setIsPolling] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [cognitoIdentityId, setCognitoIdentityId] = useState(null);

  const uploadPath = cognitoIdentityId ? `${cognitoIdentityId}/${documentType}/uploads/` : null;
  const templatePath = cognitoIdentityId ? `${cognitoIdentityId}/${documentType}/template/` : null;
  const resultsPath = cognitoIdentityId ? `${cognitoIdentityId}/${documentType}/filled/` : null;

  // Apply dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Check auth on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

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
          showMessage('Authentication error', 'error');
        }
      })();
    }
  }, [isAuthenticated]);

  // Cleanup polling
  useEffect(() => {
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
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
    showMessage(`Switched to ${getDocumentDisplayName(type)}`, 'success');
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
      const documentFileName = selectedDocumentFile.name;
      const documentBaseName = documentFileName.replace(/\.[^/.]+$/, '');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const templateFileName = selectedTemplateFile.name;
      const templateExtension = templateFileName.substring(templateFileName.lastIndexOf('.'));
      const templateBaseName = templateFileName.replace(/\.[^/.]+$/, '');

      // Step 1: Upload document to /uploads/
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

      // Step 2: Upload template to /template/{documentBaseName}/
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
      showMessage('Files uploaded, starting Fargate processing...', 'info');

      // Step 3: Call Lambda to trigger Fargate
      const LAMBDA_URL = 'https://smu2xf2939.execute-api.us-east-2.amazonaws.com/prod/trigger-fargate';
      
      const requestPayload = {
        job_type: documentType,
        bucket: AWS_CONFIG.bucketName,
        document_key: documentKey,
        template_key: templateKeyWithTimestamp
      };
      
      console.log('🚀 Triggering Fargate with:', requestPayload);
      
      try {
        const response = await fetch(LAMBDA_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestPayload)
        });

        let result;
        try {
          result = await response.json();
        } catch (jsonError) {
          console.warn('Could not parse response, but processing started');
          result = { success: true };
        }

        if (!response.ok) {
          console.warn('Lambda response not OK, but processing may have started:', response.status);
        }

        setUploadProgress(100);
        showMessage(
          'Processing started! Your file will be ready in a few minutes.',
          'success'
        );

        setSelectedDocumentFile(null);
        setSelectedTemplateFile(null);
        setIsPolling(true);
        startPolling(documentFileName);

      } catch (fetchError) {
        console.warn('Lambda error (processing may still start):', fetchError);
        
        setUploadProgress(100);
        showMessage(
          'Files uploaded. Check results in a few minutes.',
          'info'
        );

        setSelectedDocumentFile(null);
        setSelectedTemplateFile(null);
        setIsPolling(true);
        startPolling(documentFileName);
      }
      
    } catch (error) {
      console.error('❌ Upload error:', error);
      showMessage('Upload failed: ' + error.message, 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const startPolling = (fileName) => {
    if (pollingInterval) clearInterval(pollingInterval);

    let pollCount = 0;
    const maxPolls = 60; // 10 minutes max

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
          showMessage('✅ Processing complete! Your filled Excel is ready.', 'success');
        }
      } catch (error) {
        console.error('Polling error:', error);
      }

      if (pollCount >= maxPolls) {
        clearInterval(interval);
        setPollingInterval(null);
        setIsPolling(false);
        showMessage(
          'Polling stopped. Please check results manually.',
          'info'
        );
      }
    }, 10000); // Check every 10 seconds

    setPollingInterval(interval);
  };

  // Loading state
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-500 mx-auto"></div>
          </div>
          <p className="mt-6 text-slate-600 dark:text-slate-300 font-medium">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  // Auth screens
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

  // Main app
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
            {/* Document Type Selector */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 p-6 backdrop-blur-sm transition-colors duration-300">
              <DocumentTypeSelector
                documentType={documentType}
                onChange={handleDocumentTypeChange}
              />
            </div>

            {/* Upload Section */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 overflow-hidden backdrop-blur-sm transition-colors duration-300">
              <div className="border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-700/50 dark:to-transparent px-6 py-4 transition-colors duration-300">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Upload Documents</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Files will be processed on AWS Fargate</p>
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
                />
              </div>
            </div>

            {/* Results Viewer */}
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