import boto3
import json
import logging
from datetime import datetime
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

class S3Service:
    def __init__(self, bucket_name):
        self.s3_client = boto3.client('s3')
        self.bucket_name = bucket_name
    
    def get_object(self, key):
        """Download object from S3"""
        try:
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=key)
            return response['Body'].read()
        except ClientError as e:
            logger.error(f"Error getting object {key}: {str(e)}")
            raise
    
    def put_object(self, key, body, content_type='application/json'):
        """Upload object to S3"""
        try:
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=key,
                Body=body,
                ContentType=content_type
            )
            logger.info(f"Successfully uploaded to {key}")
            return True
        except ClientError as e:
            logger.error(f"Error putting object {key}: {str(e)}")
            raise
    
    def copy_object(self, source_key, destination_key):
        """Copy object within S3"""
        try:
            copy_source = {'Bucket': self.bucket_name, 'Key': source_key}
            self.s3_client.copy_object(
                CopySource=copy_source,
                Bucket=self.bucket_name,
                Key=destination_key
            )
            logger.info(f"Successfully copied {source_key} to {destination_key}")
            return True
        except ClientError as e:
            logger.error(f"Error copying object: {str(e)}")
            raise
    
    def delete_object(self, key):
        """Delete object from S3"""
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=key)
            logger.info(f"Successfully deleted {key}")
            return True
        except ClientError as e:
            logger.error(f"Error deleting object {key}: {str(e)}")
            raise
    
    def move_to_processed(self, source_key, processed_prefix):
        """Move file from uploads to processed folder"""
        try:
            # Extract filename from source key
            filename = source_key.split('/')[-1]
            timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
            destination_key = f"{processed_prefix}{timestamp}_{filename}"
            
            # Copy to processed folder
            self.copy_object(source_key, destination_key)
            
            # Delete from uploads folder
            self.delete_object(source_key)
            
            logger.info(f"Moved {source_key} to {destination_key}")
            return destination_key
        except Exception as e:
            logger.error(f"Error moving file to processed: {str(e)}")
            raise
    
    def save_json_result(self, original_key, json_data, json_prefix):
        """Save extracted JSON to S3"""
        try:
            # Extract filename without extension
            filename = original_key.split('/')[-1].rsplit('.', 1)[0]
            json_key = f"{json_prefix}{filename}.json"
            
            # Convert to JSON string with proper formatting
            json_body = json.dumps(json_data, indent=2, ensure_ascii=False)
            
            # Upload to S3
            self.put_object(json_key, json_body, content_type='application/json')
            
            logger.info(f"Saved JSON result to {json_key}")
            return json_key
        except Exception as e:
            logger.error(f"Error saving JSON result: {str(e)}")
            raise
    
    def get_file_extension(self, key):
        """Get file extension from S3 key"""
        return '.' + key.rsplit('.', 1)[-1].lower() if '.' in key else ''


# --------------------------------------------------------------------------- #
# Functional wrappers for existing Lambdas
# --------------------------------------------------------------------------- #

def upload_json_to_s3(bucket, prefix, filename, data):
    """
    Compatible wrapper for unified Lambdas.
    Automatically instantiates S3Service and uploads JSON.
    """
    s3_service = S3Service(bucket)
    json_key = f"{prefix}{filename}"
    json_body = json.dumps(data, indent=2, ensure_ascii=False)
    s3_service.put_object(json_key, json_body, content_type="application/json")
    return json_key


def move_file(bucket, source_key, destination_prefix):
    """
    Compatible wrapper for unified Lambdas.
    Moves a file by copying then deleting.
    """
    s3_service = S3Service(bucket)
    return s3_service.move_to_processed(source_key, destination_prefix)
