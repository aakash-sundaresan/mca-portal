import { fetchAuthSession } from 'aws-amplify/auth';
import { AWS_CONFIG } from '../config';

const AWS = window.AWS;

export async function getAuthenticatedS3Client() {
  try {
    // Get temporary credentials from Cognito Identity Pool
    const session = await fetchAuthSession();
    const credentials = session.credentials;

    if (!credentials) {
      throw new Error('No credentials available');
    }

    // Create S3 client with temporary credentials
    const s3Client = new AWS.S3({
      region: AWS_CONFIG.region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken // Important!
      }
    });

    return s3Client;
  } catch (error) {
    console.error('Error getting authenticated S3 client:', error);
    throw error;
  }
}