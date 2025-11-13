"""
Configuration file for AOC-4 Lambda function
All environment variables and constants
"""

import os

# ============================================================
# AWS CONFIGURATION
# ============================================================

# S3 folder prefixes for AOC-4
S3_BUCKET = os.environ.get('S3_BUCKET', 'mca-filing-bucket')
PROCESSED_PREFIX = os.environ.get('PROCESSED_PREFIX', 'aoc2/processed/')
FAILED_PREFIX = os.environ.get('FAILED_PREFIX', 'aoc2/failed/')
JSON_OUTPUT_PREFIX = os.environ.get('JSON_OUTPUT_PREFIX', 'aoc2/json/')

# Supported file extensions
SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.xlsx', '.xls']
BEDROCK_REGION = os.environ.get('BEDROCK_REGION', 'us-east-2')
TEXTRACT_REGION = os.environ.get('TEXTRACT_REGION', 'us-east-2')

# ============================================================
# BEDROCK CONFIGURATION
# ============================================================

# Claude Sonnet model - Use inference profile (cross-region)
BEDROCK_MODEL_ID = "us.anthropic.claude-3-5-sonnet-20240620-v1:0"

# Bedrock parameters
MAX_TOKENS = 8000  # Increased for complex financial data
TEMPERATURE = 0  # Low temperature for accuracy

# ============================================================
# TEXTRACT CONFIGURATION
# ============================================================

# Maximum polling attempts for Textract job
MAX_TEXTRACT_ATTEMPTS = 60  # 3 minutes (60 * 3 seconds)
TEXTRACT_POLL_INTERVAL = 3  # seconds

# ============================================================
# AOC-4 EXTRACTION CONFIGURATION
# ============================================================

# Chunking strategy for large documents
CHUNK_SIZE = 20000  # characters per chunk (to stay within token limits)
CHUNK_OVERLAP = 1000
DEBUG = False
# Section markers to help identify document structure
SECTION_MARKERS = [
    'balance sheet',
    'statement of profit and loss',
    'equity and liabilities',
    'assets',
    'revenue from operations',
    'expenses',
    'shareholders fund',
    'non-current liabilities',
    'current liabilities',
    'non-current assets',
    'current assets'
]