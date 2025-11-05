// src/services/api.js
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { fetchAuthSession } from 'aws-amplify/auth';

// AWS Configuration
const BUCKET_NAME = process.env.REACT_APP_S3_BUCKET_NAME || 'mca-filing-bucket';
const REGION = process.env.REACT_APP_AWS_REGION || 'us-east-2';

/**
 * Get authenticated user's Cognito Sub (unique identifier)
 */
const getUserId = async () => {
  try {
    const session = await fetchAuthSession();
    const userId = session.identityId; // ← Changed from sub to identityId
    
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    return userId;
  } catch (error) {
    throw new Error('User not authenticated. Please sign in.');
  }
};

/**
 * Get S3 client with Cognito credentials
 */
const getS3Client = async () => {
  try {
    const session = await fetchAuthSession();
    
    if (!session.credentials) {
      throw new Error('No credentials available');
    }
    
    return new S3Client({
      region: REGION,
      credentials: session.credentials,
    });
  } catch (error) {
    console.error('Error creating S3 client:', error);
    throw new Error('Failed to authenticate with S3');
  }
};

/**
 * Check if user has exceeded upload limit (2 documents across all types)
 */
export const checkUploadLimit = async () => {
  try {
    const userId = await getUserId();
    const s3Client = await getS3Client();

    // Define special users (Cognito Identity IDs or sub IDs)
    const privilegedUsers = [
      'us-east-2:01e5e392-2e72-c08e-c25a-5bc8f3d58043',
      'us-east-2:01e5e392-2e90-c07e-d718-cb11cc84f379',
      'us-east-2:01e5e392-2e99-c8b7-72d6-121fdcffa23c',
      'us-east-2:01e5e392-2edf-c251-ce73-f9e6bf3c7e83'
    ];

    // Default free upload limit
    let UPLOAD_LIMIT = 5;

    // Elevated limit for privileged users
    if (privilegedUsers.includes(userId)) {
      UPLOAD_LIMIT = 500;
    }

    // List all processed files across all document types
    const documentTypes = ['aoc4', 'auditors-report', 'directors-report'];
    let totalProcessedFiles = 0;

    for (const docType of documentTypes) {
      const prefix = `${userId}/${docType}/processed/`;
      try {
        const response = await s3Client.send(
          new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            Prefix: prefix,
          })
        );
        const fileCount = response.Contents?.length || 0;
        totalProcessedFiles += fileCount;
      } catch (error) {
        console.warn(`Could not list files for ${docType}:`, error.message);
      }
    }

    if (totalProcessedFiles >= UPLOAD_LIMIT) {
      return {
        allowed: false,
        currentCount: totalProcessedFiles,
        limit: UPLOAD_LIMIT,
        message: `You have already processed ${totalProcessedFiles} document(s). Your limit is ${UPLOAD_LIMIT}.`
      };
    }

    return {
      allowed: true,
      currentCount: totalProcessedFiles,
      limit: UPLOAD_LIMIT,
      remaining: UPLOAD_LIMIT - totalProcessedFiles
    };

  } catch (error) {
    if (error.message?.includes('not authenticated')) {
      throw error;
    }
    throw new Error('Failed to check upload limit');
  }
};
