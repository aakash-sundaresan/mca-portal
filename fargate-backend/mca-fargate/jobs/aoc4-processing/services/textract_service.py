"""
Textract Service
Handles document text extraction using AWS Textract and Excel parsing
"""

import boto3
import logging
import time
import io
import zipfile
import re
from botocore.exceptions import ClientError

logger = logging.getLogger()

class TextractService:
    def __init__(self, region_name):
        self.textract_client = boto3.client('textract', region_name=region_name)
        self.s3_client = boto3.client('s3', region_name=region_name)
        self.max_attempts = 60
        self.poll_interval = 5
    
    def extract_text_from_pdf(self, bucket, key):
        """
        Extract all text from PDF using AWS Textract (async)
        """
        logger.info(f"Starting Textract extraction: s3://{bucket}/{key}")
        
        # Start async text detection job
        response = self.textract_client.start_document_text_detection(
            DocumentLocation={
                'S3Object': {
                    'Bucket': bucket,
                    'Name': key
                }
            }
        )
        
        job_id = response['JobId']
        logger.info(f"Textract Job ID: {job_id}")
        
        # Poll for completion
        attempt = 0
        while attempt < self.max_attempts:
            attempt += 1
            
            result = self.textract_client.get_document_text_detection(JobId=job_id)
            status = result['JobStatus']
            
            if status == 'SUCCEEDED':
                logger.info(f"✓ Textract completed (attempt {attempt})")
                break
            elif status == 'FAILED':
                error_msg = result.get('StatusMessage', 'Unknown error')
                raise Exception(f"Textract job failed: {error_msg}")
            
            logger.info(f"Textract status: {status} (attempt {attempt}/{self.max_attempts})")
            time.sleep(self.poll_interval)
        
        if attempt >= self.max_attempts:
            raise Exception(f"Textract job timed out after {self.max_attempts} attempts")
        
        # Collect all blocks from all pages
        blocks = result['Blocks']
        
        # Handle pagination for multi-page documents
        next_token = result.get('NextToken')
        page_count = 1
        
        while next_token:
            page_count += 1
            logger.info(f"Fetching page {page_count}...")
            
            result = self.textract_client.get_document_text_detection(
                JobId=job_id,
                NextToken=next_token
            )
            blocks.extend(result['Blocks'])
            next_token = result.get('NextToken')
        
        # Extract text from LINE blocks
        text_lines = []
        for block in blocks:
            if block['BlockType'] == 'LINE':
                text_lines.append(block.get('Text', ''))
        
        full_text = '\n'.join(text_lines)
        
        char_count = len(full_text)
        line_count = len(text_lines)
        
        logger.info(f"✓ Extracted {char_count:,} characters across {line_count:,} lines from {page_count} page(s)")
        
        return full_text
    
    def extract_text_from_docx(self, file_content):
        """
        Extract text from .docx file (Office Open XML format)
        .docx files are ZIP archives containing XML files
        """
        logger.info("Extracting text from .docx file...")
        
        try:
            # .docx is a ZIP file containing XML
            file_obj = io.BytesIO(file_content)
            
            with zipfile.ZipFile(file_obj, 'r') as docx_zip:
                # The main document is in word/document.xml
                if 'word/document.xml' not in docx_zip.namelist():
                    raise Exception("Invalid .docx file: missing word/document.xml")
                
                # Read the XML content
                xml_content = docx_zip.read('word/document.xml').decode('utf-8')
                
                # Extract text from XML (simple approach)
                # Look for text between <w:t> tags
                text_pattern = r'<w:t[^>]*>([^<]+)</w:t>'
                text_matches = re.findall(text_pattern, xml_content)
                
                # Also look for text with xml:space attribute
                text_pattern2 = r'<w:t xml:space="preserve">([^<]*)</w:t>'
                text_matches2 = re.findall(text_pattern2, xml_content)
                
                all_text = text_matches + text_matches2
                full_text = '\n'.join(all_text)
                
                # Clean up extra whitespace
                full_text = '\n'.join(line.strip() for line in full_text.split('\n') if line.strip())
                
                char_count = len(full_text)
                line_count = len(full_text.split('\n'))
                
                logger.info(f"✓ Extracted {char_count:,} characters across {line_count:,} lines from .docx")
                
                return full_text
                
        except zipfile.BadZipFile:
            logger.error("File is not a valid .docx (not a ZIP archive)")
            raise Exception("Invalid .docx file format")
        except Exception as e:
            logger.error(f"Failed to extract text from .docx: {str(e)}")
            raise
    
    def extract_text_from_xls(self, file_content):
        """
        Extract text from legacy Excel (.xls) file using xlrd.
        Automatically falls back to openpyxl if file is actually XLSX.

        Args:
            file_content: Excel file as bytes
        Returns:
            Full text content of the Excel file (all sheets concatenated)
        """
        logger.info("Extracting text from .xls file using xlrd...")

        try:
            import xlrd
            file_obj = io.BytesIO(file_content)
            workbook = xlrd.open_workbook(file_contents=file_obj.read())
            logger.info(f"Loaded workbook with {workbook.nsheets} sheets")

            all_text = []
            for sheet in workbook.sheets():
                if sheet.visibility == 1:
                    continue
                logger.info(f"Processing sheet: {sheet.name}")
                sheet_text = [f"\n=== SHEET: {sheet.name} ===\n"]

                row_count = 0
                for row_idx in range(sheet.nrows):
                    row_values = [
                        str(cell) if cell is not None else ""
                        for cell in sheet.row_values(row_idx)
                    ]
                    if any(val.strip() for val in row_values):  # skip empty rows
                        sheet_text.append(" | ".join(row_values))
                        row_count += 1

                logger.info(f"Extracted {row_count} rows from sheet '{sheet.name}'")
                all_text.extend(sheet_text)

            full_text = "\n".join(all_text)
            char_count = len(full_text)
            line_count = len(full_text.split('\n'))

            logger.info(
                f"✓ Extracted {char_count:,} characters across {line_count:,} lines "
                f"from {workbook.nsheets} sheet(s)"
            )
            return full_text

        except Exception as e:
            # Detect XLSX mislabeled as XLS and fall back
            if "xlsx" in str(e).lower() or "zip" in str(e).lower():
                logger.warning("File appears to be XLSX mislabeled as .xls — retrying with openpyxl...")
                return self.extract_text_from_excel(file_content)
            logger.error(f"Failed to extract text from .xls: {str(e)}")
            raise


    def extract_text_from_excel(self, file_content):
        """
        Extract text from Excel file (.xlsx)
        
        Args:
            file_content: Excel file as bytes
        
        Returns:
            Full text content of the Excel file (all sheets concatenated)
        """
        logger.info("Extracting text from Excel file using openpyxl...")
        
        try:
            import openpyxl
            from openpyxl import load_workbook
            
            # Load workbook from bytes
            file_obj = io.BytesIO(file_content)
            
            try:
                workbook = load_workbook(file_obj, data_only=True, read_only=True)
                logger.info(f"Loaded workbook with {len(workbook.sheetnames)} sheets")
            except Exception as e:
                logger.error(f"Failed to load Excel file: {str(e)}")
                raise Exception(f"Could not load Excel file. Ensure it's a valid .xlsx file. Error: {str(e)}")
            
            # Extract text from all sheets
            all_text = []
            
            for sheet_name in workbook.sheetnames:
                sheet = workbook[sheet_name]
                if sheet.sheet_state == 'hidden':
                    continue
                logger.info(f"Processing sheet: {sheet_name}")
                
                sheet_text = [f"\n=== SHEET: {sheet_name} ===\n"]
                
                # Iterate through rows
                row_count = 0
                for row in sheet.iter_rows(values_only=True):
                    # Convert row values to strings, skip empty rows
                    row_values = [str(cell) if cell is not None else "" for cell in row]
                    if any(val.strip() for val in row_values):  # Skip completely empty rows
                        sheet_text.append(" | ".join(row_values))
                        row_count += 1
                
                logger.info(f"Extracted {row_count} rows from sheet '{sheet_name}'")
                all_text.extend(sheet_text)
            
            full_text = "\n".join(all_text)
            
            char_count = len(full_text)
            line_count = len(full_text.split('\n'))
            
            logger.info(f"✓ Extracted {char_count:,} characters across {line_count:,} lines from {len(workbook.sheetnames)} sheet(s)")
            
            workbook.close()
            return full_text
            
        except ImportError:
            logger.error("openpyxl library not found - required for Excel processing")
            raise Exception(
                "Excel processing requires openpyxl library. "
                "Please add it to your Lambda deployment package."
            )
        except Exception as e:
            logger.error(f"Failed to extract text from Excel: {str(e)}")
            raise
    
    def extract_text(self, document_bytes, file_extension, bucket=None, key=None):
        """
        Extract text based on file type
        - PDF: Use Textract (requires S3 location)
        - DOCX: Parse XML directly from bytes
        - XLSX: Parse Excel from bytes
        - DOC: Not supported (suggest conversion to DOCX or PDF)
        """
        file_extension = file_extension.lower()
        
        if file_extension == '.pdf':
            if not bucket or not key:
                raise Exception("PDF extraction requires S3 location (bucket and key)")
            return self.extract_text_from_pdf(bucket, key)
        
        elif file_extension == '.docx':
            return self.extract_text_from_docx(document_bytes)
        
        elif file_extension == '.xlsx':
            return self.extract_text_from_excel(document_bytes)
        
        elif file_extension == '.xls':
            return self.extract_text_from_xls(document_bytes)
        
        elif file_extension == '.doc':
            raise Exception(
                ".doc files are not supported. "
                "Please convert to .docx or PDF format."
            )
        
        elif file_extension == '.xls':
            raise Exception(
                ".xls files are not supported. "
                "Please convert to .xlsx format."
            )
        
        else:
            raise ValueError(f"Unsupported file extension: {file_extension}")