// src/config.js
export const AWS_CONFIG = {
    // Replace these with your actual AWS credentials
    // OR use environment variables (recommended)
    bucketName: process.env.REACT_APP_S3_BUCKET_NAME || 'your-bucket-name',
    region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID || 'your-access-key-id',
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY || 'your-secret-access-key',
    userPoolId: process.env.REACT_APP_AWS_USER_POOL_ID,
    userPoolClientId: process.env.REACT_APP_AWS_USER_POOL_CLIENT_ID,
    identityPoolId: process.env.REACT_APP_AWS_IDENTITY_POOL_ID
  };
  
  // For development, you can also use window.AWS_CONFIG
  // This allows you to override config without rebuilding
  if (typeof window !== 'undefined' && window.AWS_CONFIG) {
    Object.assign(AWS_CONFIG, window.AWS_CONFIG);
  }
  
  // Log configuration status (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('AWS Configuration Status:');
    console.log('Bucket:', AWS_CONFIG.bucketName);
    console.log('Region:', AWS_CONFIG.region);
    console.log('Access Key:', AWS_CONFIG.accessKeyId ? '✓ Set' : '✗ Not Set');
    console.log('Secret Key:', AWS_CONFIG.secretAccessKey ? '✓ Set' : '✗ Not Set');
  }