"""
S3 Service
Handles S3 file operations
"""

import boto3
import json
from utils.logger import log_info, log_error

s3_client = boto3.client('s3')


def move_file(bucket: str, source_key: str, dest_prefix: str) -> str:
    """
    Move S3 object from one location to another
    
    Args:
        bucket: S3 bucket name
        source_key: Current object key
        dest_prefix: Destination folder prefix
    
    Returns:
        New object key after move
    
    Raises:
        Exception: If S3 operation fails
    """
    from datetime import datetime
    from urllib.parse import unquote_plus, quote  # ✅ Added quote import here (local)

    # URL decode the key
    decoded_key = unquote_plus(source_key)
    filename = decoded_key.split('/')[-1]
    dest_key = f"{dest_prefix}{filename}"
    
    # Only check for duplicates if moving to 'processed' folder
    if 'processed' in dest_prefix.lower():
        try:
            s3_client.head_object(Bucket=bucket, Key=dest_key)
            # File exists, add timestamp
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            name_parts = filename.rsplit('.', 1)
            if len(name_parts) == 2:
                dest_key = f"{dest_prefix}{name_parts[0]}_{timestamp}.{name_parts[1]}"
            else:
                dest_key = f"{dest_prefix}{filename}_{timestamp}"
            log_info(f"File exists, using timestamped name: {dest_key}")
        except:
            # File doesn't exist, use original name
            pass
    
    log_info(f"Moving file: {decoded_key} → {dest_key}")
    
    try:
        # ✅ Encode CopySource so S3 handles spaces/colons safely
        encoded_source = quote(decoded_key, safe='/')
        
        # Copy to destination
        s3_client.copy_object(
            Bucket=bucket,
            CopySource={'Bucket': bucket, 'Key': encoded_source},
            Key=dest_key
        )
        
        # Delete source
        s3_client.delete_object(
            Bucket=bucket,
            Key=decoded_key
        )
        
        log_info(f"✓ File moved successfully to {dest_key}")
        return dest_key
        
    except Exception as e:
        log_error(f"Failed to move file: {str(e)}")
        raise


def upload_json_to_s3(bucket: str, prefix: str, filename: str, data: dict) -> str:
    """
    Upload JSON data to S3
    
    Args:
        bucket: S3 bucket name
        prefix: S3 prefix (folder path)
        filename: JSON filename
        data: Dictionary to save as JSON
    
    Returns:
        S3 key of uploaded file
    
    Raises:
        Exception: If upload fails
    """
    s3_key = f"{prefix}{filename}"
    
    log_info(f"Uploading JSON to s3://{bucket}/{s3_key}")
    
    try:
        # Convert dict to JSON string
        json_content = json.dumps(data, indent=2, ensure_ascii=False)
        
        # Upload to S3
        s3_client.put_object(
            Bucket=bucket,
            Key=s3_key,
            Body=json_content.encode('utf-8'),
            ContentType='application/json'
        )
        
        log_info(f"✓ JSON uploaded successfully: {len(json_content)} bytes")
        return s3_key
        
    except Exception as e:
        log_error(f"Failed to upload JSON: {str(e)}")
        raise