"""
Configuration for Unified Directors Report Processor
"""

import os

# S3 Configuration
S3_BUCKET = os.environ.get('S3_BUCKET', 'mca-filing-bucket')
UPLOADS_PREFIX = 'directors-report/uploads/'
PROCESSED_PREFIX = 'directors-report/processed/'
JSON_PREFIX = 'directors-report/json/'

# Bedrock Configuration
BEDROCK_MODEL_ID = os.environ.get('BEDROCK_MODEL_ID', 'us.anthropic.claude-3-5-sonnet-20241022-v2:0')
BEDROCK_REGION = os.environ.get('BEDROCK_REGION', 'us-east-2')

# Textract Configuration
TEXTRACT_REGION = os.environ.get('TEXTRACT_REGION', 'us-east-2')

# Lambda Configuration
MAX_TOKENS = int(os.environ.get('MAX_TOKENS', '100000'))
TEMPERATURE = float(os.environ.get('TEMPERATURE', '0'))

# File processing
SUPPORTED_EXTENSIONS = ['.pdf', '.docx']
CHUNK_SIZE = 20000
CHUNK_OVERLAP = 5000