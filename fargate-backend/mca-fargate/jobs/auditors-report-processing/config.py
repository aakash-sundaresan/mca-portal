"""
Configuration file for Lambda function
All environment variables and constants
"""

import os

# ============================================================
# AWS CONFIGURATION
# ============================================================

# S3 folder prefixes
PROCESSED_PREFIX = os.environ.get('PROCESSED_PREFIX', 'auditors-report/processed/')
FAILED_PREFIX = os.environ.get('FAILED_PREFIX', 'auditors-report/failed/')
JSON_OUTPUT_PREFIX = os.environ.get('JSON_OUTPUT_PREFIX', 'auditors-report/json/')

CHUNK_SIZE = 20000  # characters per chunk (to stay within token limits)
CHUNK_OVERLAP = 10000

# Supported file extensions
SUPPORTED_EXTENSIONS = ['.pdf', '.docx']

# ============================================================
# BEDROCK CONFIGURATION
# ============================================================

# Claude Sonnet model - Use inference profile (cross-region)
BEDROCK_MODEL_ID = "us.anthropic.claude-3-5-sonnet-20240620-v1:0"

# Bedrock parameters
MAX_TOKENS = 8000
TEMPERATURE = 0  # Low temperature for accuracy

# ============================================================
# TEXTRACT CONFIGURATION
# ============================================================

# Maximum polling attempts for Textract job
MAX_TEXTRACT_ATTEMPTS = 60  # 3 minutes (60 * 3 seconds)
TEXTRACT_POLL_INTERVAL = 3  # seconds

# ============================================================
# FIELD CONFIGURATION
# ============================================================

# Expected fields in extraction (updated with signatory_type)
REQUIRED_FIELDS = [
    'opinion_of_auditor',
    'basis_of_opinion',
    'emphasis_of_matter',
    'key_audit_matters',
    'other_information',
    'responsibilities_of_management',
    'auditors_responsibilities',
    'state_other_matters_rule_11',
    'state_any_other_matters',
    'report_on_legal_regulatory',
    'caro_applicable',
    'reporting_on_internal_financial_controls',
    'signatory_type',  # Changed from director_or_irp
    'din',
    'pan'
]