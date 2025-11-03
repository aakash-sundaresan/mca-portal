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
    
    
    // List all processed files across all document types
    const documentTypes = ['aoc4', 'auditors-report', 'directors-report'];
    let totalProcessedFiles = 0;

    for (const docType of documentTypes) {
      // Updated prefix to match IAM permissions structure
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
        // Continue checking other document types even if one fails
      }
    }


    const UPLOAD_LIMIT = 5;

    if (totalProcessedFiles >= UPLOAD_LIMIT) {
      return {
        allowed: false,
        currentCount: totalProcessedFiles,
        limit: UPLOAD_LIMIT,
        message: `You have already processed ${totalProcessedFiles} document(s). Your free limit is ${UPLOAD_LIMIT} documents across all types (AOC4, Auditors Report, Directors Report).`
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