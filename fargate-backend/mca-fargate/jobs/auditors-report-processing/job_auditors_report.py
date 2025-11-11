"""
Unified Auditors Report Processor - Fargate Version
Processes auditor document and fills Excel template in a single execution

Flow:
1. Extract text from document (Textract)
2. Extract structured fields (Bedrock Call #1)
3. Save JSON to S3
4. Load Excel template
5. Map fields to cells intelligently (Bedrock Call #2)
6. Fill Excel template
7. Save filled Excel to S3
"""

import json
import boto3
import os
import sys
from datetime import datetime
from io import BytesIO
import re
from openpyxl.utils import column_index_from_string

# Services
from services.textract_service import TextractService
from services.s3_service import upload_json_to_s3
from services.bedrock_extraction_service import extract_fields_with_bedrock
from services.bedrock_mapping_service import cell_mapping_using_bedrock
from services.bedrock_extraction_service_unified import extract_fields_with_bedrock

# Excel operations
from excel_operations.xml_manipulation import modify_excel_xml_byte_perfect
from excel_operations.template_helpers import create_template_cell_map, get_s3_file

# Utils
from utils.logger import log_info, log_error as log_err
from config import SUPPORTED_EXTENSIONS

# Cell mappings
from auditors_cell_mappings import prepare_auditors_cell_mappings
from botocore.config import Config

config = Config(read_timeout=3600, retries={"max_attempts": 5})
s3_client = boto3.client('s3', config=config)

BUCKET_NAME = os.environ.get("BUCKET_NAME", "mca-filing-bucket")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")


def process_auditors_report(bucket, document_key, template_key):
    """
    Main processing function for auditors report
    """
    log_info("=" * 80)
    log_info("UNIFIED AUDITORS REPORT PROCESSOR - EXECUTION STARTED")
    log_info(f"Timestamp: {datetime.now().isoformat()}")
    log_info("=" * 80)

    user_id = None
    document_type = None

    try:
        # STEP 0: Validate input
        log_info("\n" + "=" * 80)
        log_info("STEP 0: VALIDATE INPUT PARAMETERS")
        log_info("=" * 80)

        if not bucket:
            raise ValueError("Missing required parameter: 'bucket'")
        if not document_key:
            raise ValueError("Missing required parameter: 'document_key'")
        if not template_key:
            raise ValueError("Missing required parameter: 'template_key'")

        log_info(f"Parameters:\n  Bucket: {bucket}\n  Document Key: {document_key}\n  Template Key: {template_key}")

        # Parse user_id and document_type
        user_id, document_type = extract_user_and_document_type(document_key)
        if not user_id or not document_type:
            raise ValueError(f"Invalid document_key format: {document_key}")

        filename = document_key.split('/')[-1]
        file_extension = '.' + filename.lower().split('.')[-1]

        log_info(f"Processing:\n  User ID: {user_id}\n  Document Type: {document_type}\n  Filename: {filename}\n  Extension: {file_extension}")

        # File validation
        if file_extension not in SUPPORTED_EXTENSIONS:
            raise ValueError(f"Unsupported file type: {file_extension}. Supported: {SUPPORTED_EXTENSIONS}")

        # STEP 1: Extract text
        log_info("\n" + "=" * 80)
        log_info("STEP 1: TEXT EXTRACTION (Textract)")
        log_info("=" * 80)

        document_text = extract_document_text(bucket, document_key, file_extension)
        log_info(f"✓ Extracted {len(document_text):,} characters from document")

        # STEP 2: Load template
        log_info("\n" + "=" * 80)
        log_info("STEP 2: LOAD EXCEL TEMPLATE")
        log_info("=" * 80)

        template_data = get_s3_file(bucket, template_key)
        log_info(f"✓ Loaded template: {len(template_data):,} bytes")

        # STEP 3: Analyze template
        log_info("\n" + "=" * 80)
        log_info("STEP 3: ANALYZE TEMPLATE STRUCTURE")
        log_info("=" * 80)

        template_cell_map = create_template_cell_map(template_data)
        log_info(f"✓ Analyzed {len(template_cell_map)} cells in template")

        sorted_template = dict(
            sorted(
                template_cell_map.items(),
                key=lambda kv: (
                    int(re.findall(r"\d+", kv[0])[0]),
                    column_index_from_string(re.findall(r"[A-Z]+", kv[0])[0])
                )
            )
        )

        grouped_template = {}
        for cell, (val, prot) in sorted_template.items():
            row = int(re.findall(r"\d+", cell)[0])
            grouped_template.setdefault(row, {})[cell] = (val, prot)

        # STEP 4: Bedrock extraction
        log_info("\n" + "=" * 80)
        log_info("STEP 4: EXTRACT AND MAP FIELDS (Bedrock)")
        log_info("=" * 80)

        cell_mappings = extract_fields_with_bedrock(document_text, template_cell_map)
        log_info("✓ Extracted and mapped fields to cells")

        # STEP 5: Save JSON
        log_info("\n" + "=" * 80)
        log_info("STEP 5: SAVE EXTRACTED JSON")
        log_info("=" * 80)

        json_key = save_extracted_json(bucket, user_id, document_type, document_key, cell_mappings)
        log_info(f"✓ Saved JSON to: {json_key}")

        # STEP 6: Fill Excel
        log_info("\n" + "=" * 80)
        log_info("STEP 6: FILL EXCEL TEMPLATE")
        log_info("=" * 80)

        filled_excel_data = modify_excel_xml_byte_perfect(template_data, cell_mappings)
        log_info(f"✓ Generated filled Excel: {len(filled_excel_data):,} bytes")

        # STEP 7: Upload filled Excel
        log_info("\n" + "=" * 80)
        log_info("STEP 7: SAVE FILLED EXCEL")
        log_info("=" * 80)

        output_key = save_filled_excel(bucket, user_id, document_type, document_key, filled_excel_data)
        log_info(f"✓ Saved filled Excel to: {output_key}")

        # ✅ NO MOVE TO PROCESSED — Keep file in uploads
        log_info("\n" + "=" * 80)
        log_info("✓✓✓ PROCESSING COMPLETED SUCCESSFULLY ✓✓✓")
        log_info("=" * 80)

        return {
            "success": True,
            "message": "Auditor's Report processed and Excel filled successfully",
            "user_id": user_id,
            "document_type": document_type,
            "filename": filename,
            "bedrock_calls": 1,
            "json_output": f"s3://{bucket}/{json_key}",
            "filled_excel": f"s3://{bucket}/{output_key}",
            "processed_document": f"s3://{bucket}/{document_key}",
            "timestamp": datetime.now().isoformat(),
        }

    except Exception as e:
        error_message = str(e)
        log_err(f"\n{'=' * 80}")
        log_err("✗✗✗ ERROR OCCURRED ✗✗✗")
        log_err(f"Error: {error_message}")
        log_err(f"{'=' * 80}")
        log_err("Full traceback:")
        import traceback
        log_err(traceback.format_exc())

        # ✅ Skip move-to-failed; keep file in uploads
        return {
            "success": False,
            "error": error_message,
            "user_id": user_id,
            "document_type": document_type,
            "timestamp": datetime.now().isoformat(),
        }


# ============================================================================ #
# Helper functions #
# ============================================================================ #

def extract_user_and_document_type(s3_key):
    parts = s3_key.split('/')
    if len(parts) >= 4:
        return parts[0], parts[1]
    return None, None


def extract_document_text(bucket, key, file_extension):
    textract_service = TextractService(region_name=AWS_REGION)
    if file_extension == '.pdf':
        log_info("Using Textract for PDF extraction")
        return textract_service.extract_text_from_pdf(bucket, key)
    elif file_extension == '.docx':
        log_info("Using Textract for DOCX extraction")
        response = s3_client.get_object(Bucket=bucket, Key=key)
        file_content = response["Body"].read()
        return textract_service.extract_text_from_word(file_content)
    elif file_extension == '.doc':
        raise ValueError(".doc files not supported. Please convert to .docx or PDF")
    else:
        raise ValueError(f"Unsupported file extension: {file_extension}")


def save_extracted_json(bucket, user_id, document_type, document_key, extracted_data):
    filename = document_key.split('/')[-1]
    json_filename = filename.rsplit('.', 1)[0] + '.json'
    user_json_prefix = f"{user_id}/{document_type}/json/"

    output_data = {
        "metadata": {
            "source_file": filename,
            "source_bucket": bucket,
            "source_key": document_key,
            "user_id": user_id,
            "document_type": document_type,
            "processed_at": datetime.now().isoformat(),
            "extraction_method": "Textract + Bedrock Claude",
            "processor_version": "fargate-auditors-v1.0",
        },
        "extracted_fields": extracted_data,
    }

    return upload_json_to_s3(bucket, user_json_prefix, json_filename, output_data)


def save_filled_excel(bucket, user_id, document_type, document_key, filled_excel_data):
    filename = document_key.split('/')[-1]
    basename = filename.rsplit('.', 1)[0]
    timestamp = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")

    output_filename = f"{basename}_filled_{timestamp}.xlsx"
    output_prefix = f"{user_id}/{document_type}/filled/"
    output_key = f"{output_prefix}{output_filename}"

    s3_client.put_object(
        Bucket=bucket,
        Key=output_key,
        Body=filled_excel_data,
        ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
    return output_key


def main():
    log_info("Starting Auditors Report Processor (Fargate Version)")

    if len(sys.argv) > 1:
        log_info("Reading parameters from command line arguments")
        if len(sys.argv) != 4:
            log_err("Usage: python auditors_processor.py <bucket> <document_key> <template_key>")
            sys.exit(1)
        bucket, document_key, template_key = sys.argv[1:4]
    else:
        log_info("Reading parameters from environment variables")
        bucket = os.environ.get("BUCKET_NAME")
        document_key = os.environ.get("DOCUMENT_KEY")
        template_key = os.environ.get("TEMPLATE_KEY")
        if not all([bucket, document_key, template_key]):
            log_err("Missing required environment variables")
            sys.exit(1)

    result = process_auditors_report(bucket, document_key, template_key)
    log_info("\n" + "=" * 80)
    log_info("PROCESSING RESULTS:")
    log_info(json.dumps(result, indent=2))
    log_info("=" * 80)

    if result.get("success"):
        log_info("Exiting with success code 0")
        sys.exit(0)
    else:
        log_err("Exiting with error code 1")
        sys.exit(1)


if __name__ == "__main__":
    main()
