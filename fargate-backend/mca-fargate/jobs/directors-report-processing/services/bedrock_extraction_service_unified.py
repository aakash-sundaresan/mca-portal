"""
Bedrock Service for AOC-4 (CORRECTED VERSION)
Handles intelligent field extraction for AOC-4 financial statements using Amazon Bedrock (Claude)
Extracts ALL 300+ variables across multiple passes with EXACT field names matching cell mappings
"""

import json
import boto3
from typing import Dict, Any
from config import (
    BEDROCK_MODEL_ID, MAX_TOKENS, TEMPERATURE,
    CHUNK_SIZE, CHUNK_OVERLAP
)
from utils.logger import log_info, log_error

bedrock_client = boto3.client('bedrock-runtime')

def _extract_json_from_response(text: str) -> str:
    """
    Extract JSON from Claude's response
    Handles markdown code blocks and malformed JSON
    """
    import re
    
    log_info(f"Attempting to extract JSON from response of length: {len(text)}")
    
    # Try to find JSON in markdown code blocks first
    if '```json' in text:
        start = text.find('```json') + 7
        end = text.find('```', start)
        if end > start:
            json_str = text[start:end].strip()
            log_info("Found JSON in ```json block")
        else:
            log_error("Found ```json but no closing ```")
            json_str = text[start:].strip()
    elif '```' in text:
        start = text.find('```') + 3
        end = text.find('```', start)
        if end > start:
            json_str = text[start:end].strip()
            log_info("Found JSON in ``` block")
        else:
            json_str = text[start:].strip()
    else:
        # No code blocks, try to find raw JSON
        start = text.find('{')
        end = text.rfind('}') + 1
        if start != -1 and end > start:
            json_str = text[start:end]
            log_info(f"Found raw JSON from position {start} to {end}")
            return json_str
        else:
            log_error("Could not find JSON in response")
            log_error(f"Response preview: {text}")
            raise ValueError(f"Could not find JSON object in response. Response starts with: {text[:200]}")
        

def _invoke_bedrock(prompt: str) -> str:
    """Invoke Bedrock with the given prompt"""
    
    request_body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": MAX_TOKENS,
        "temperature": TEMPERATURE,
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ]
    }
    
    try:
        log_info(f"Invoking Bedrock with prompt length: {len(prompt)} characters")
        
        response = bedrock_client.invoke_model(
            modelId=BEDROCK_MODEL_ID,
            body=json.dumps(request_body)
        )
        
        response_body = json.loads(response['body'].read())
        
        if 'content' not in response_body or len(response_body['content']) == 0:
            log_error(f"Unexpected response structure: {json.dumps(response_body)}")
            raise ValueError("Bedrock response missing 'content' field")
        
        content = response_body['content'][0]['text']
        
        log_info(f"Bedrock response received: {len(content)} characters")
        log_info(f"Response preview: {content[:200]}...")
        
        return content
        
    except Exception as e:
        log_error(f"Bedrock invocation failed: {str(e)}")
        log_error(f"Model ID: {BEDROCK_MODEL_ID}")
        raise


def extract_directors_report_fields_in_chunk_with_bedrock(chunk_text: str, template_data: dict, unprotected_cell: list[str]) -> Dict[str, Any]:
    prompt = f"""
    You are an expert at extracting structured data from Directors' Report documents under the Indian Companies Act, 2013.
    analyze the following document chunk and template context and extract information to the questions. 

    You are given a JSON object and the document chunk as a string:

    1. **Template Data (Grouped by Rows)** — a JSON-deserialized dictionary where:
    - Each *key* is a row number (e.g., 5, 6, 7)
    - Each *value* is a dictionary mapping cell coordinates ("CELL") to (cell_value, is_protected) tuples.
    - A CELL is defined to be unprotected if is_protected=false
    - This format preserves **row context**, i.e., related text and numeric cells appear together.
    **Example (simplified)**:
    ```json
    {{
        "5": {{
        "A5": ["(a) Share Capital", true],
        "C5": ["", false],
        "D5": ["1000", true]
        }},
        "6": {{
        "A6": ["(b) Reserves and Surplus", true],
        "C6": ["", false],
        "D6": ["-439600", true]
        }}
    }}
    2. Document Chunk - A string representation of a chunk of the document from which we want to extract all available information.

    Perform the following steps exactly obtain the values mapped to every cell
    ## DEFINE UNPROTECTED_CELLS = {unprotected_cell}
    Your Task
    Step 1:
    - For each cell in UNPROTECTED_CELLS, identify the question the cell is answering using the entire Template Data as context as mentioned below.
    - Do not include the cells in the Declaration section.
    - First look for a protected text cell in the same column of the cell under consideration and call it column_header,
    enusre the column header is in the same table as the protected text cell, it is a common mistake to map a column header from a diffferent table, if column_header exists this would be the last level for the question, we then look for a protected text cell in the same row of the cell and call it row_header, if column_header exists this would be the second last level 
    and if not it would be the last level. Once row_header has been identified, backtrack for headers of this row_header by moving up the same row of row_header
    using the indexes of the row_header which is present in the row_header itself or in the cell to it's left cell in the same column finally ending the backtracking at a 
    cell which is the name of a table in the sheet.
    Create table1:
    {{ "CELL": "QUESTION" }} for all cells in UNPROTECTED_CELLS
    where "QUESTION" is a concatenation of all the texts from the protected cells backtracked above delimited by a '.'
    Ensure all cells in UNPROTECTED_CELLS are a part of table1 and ensure no cells outside UNPROTECTED_CELLS are a part of table1
    For example:
    template_data = {{
    "12": {{  # Section 12
        "B1": ["12 Disclosure relating to amounts if any which is proposed to carry to any reserves", True],
        "C2": ["(a) Brief description", True],
        "C3": ["(b) Amount (in INR)", True],
        "G2": ["", False],
        "G3": ["", False],
    }},
    "13": {{  # Section 13
        "B4": ["13 Disclosures relating to amount recommended to be paid as dividend", True],
        "C5": ["(a) Brief description", True],
        "C6": ["(b) Amount (in INR)", True],
        "G5": ["", False],
        "G6": ["", False],
    }}
    }}

    For cell G2 (Section 12, row with “Brief description”):
    Column scan up G: No protected text above → no column header.
    Row header (same row, column C): "Brief description" → this becomes one level of hierarchy.
    Section header: Move up column B until you hit a protected text:
    "12 Disclosure relating to amounts if any which is proposed to carry to any reserves"
    → that’s the section label.
    Combine them hierarchically:
    Disclosure.amounts proposed to carry to any reserves.Brief description
    For cell G3 (Section 12, row with “Amount (in INR)”):
    Column G: no header → skip.
    Row C: "Amount (in INR)" → row header.
    Move up to section header in column B:
    "12 Disclosure relating to amounts if any which is proposed to carry to any reserves".
    Combined path:
    Disclosure relating to amounts proposed to carry to any reserves.Amount (in INR)
    For cell G5 (Section 13, row with “Brief description”):
    Column G: no header.
    Row header from C: "Brief description".
    Section header (column B, above):
    "13 Disclosures relating to amount recommended to be paid as dividend".
    Combined path:
    Disclosures relating to amount recommended to be paid as dividend.Brief description

    [IMPORTANT NOTE] THIS IS JUST ONE EXAMPLE AND THE SAME PATTERN MIGHT NOT FOLLOW FOR EVERY UNPROTECTED CELL WHICH COULD OCCUR IN ANY COLUMN/ROW
    THE UNDERLYING LOGIC IN MAPPING THE CELL TO THE QUESTION WOULD BE THE SAME THOUGH. 

    Step 2:
    For all the cells in table, using the mapped question, try to EXTRACT THE ENTIRE VALUE if it exists in the document
    or DERIVE A VALUE ONLY based on the critical instructions below strictly.
    **CRITICAL INSTRUCTIONS TO DERIVE SOME VALUES*
    **Text outputs**
        - EXTRACT THE COMPLETE TEXT answering the question from the DOCUMENT CHUNK. (ONLY EXTRACT DO NOT INVENT OR MODIFY OR LEAVE OUT TEXT THAT ANSWER THE QUESTION)
        - For the question "Directors Responsibility Statement" if the extracted text is longer than 1000 characters, use only the first 945 characters of the extracted text 
        and concatenate " .Please refer to Director's Report for more detail" at the end.
        - For the other questions if the extracted text is longer than 500 characters, use only the first 445 characters of the extracted text 
        and concatenate " .Please refer to Director's Report for more details" at the end
        - Use 'Nil' if text answering the question can't be found in DOCUMENT CHUNK, for the question "Brief details as to why transaction is not reportable" if answer doesn't exist
        in DOCUMENT CHUNK, use "no such transaction".
        - All dates MUST BE CONVERTED TO "DD/MM/YYYY" format
    **Numeric outputs**
        - Must be a valid numeric amount
        - It can't be more than 5 digits
        - use 0 if value can't be found in the DOCUMENT CHUNK

    Input Data:

    Document Chunk: {chunk_text}

    Template Data: {template_data}

    Output Format:

    Return EXACTLY a JSON object mapping cell addresses from the template data to it's appropriate value
    sorted by row number and then by column letter.
    Example:
    {{
    "B75": The Directors have prepared the annual accounts on a 'going concern' basis. 
    The Company being unlisted, sub clause (e) of section 134(3) of the Companies Act, 2013 pertaining to laying down internal financial controls is not applicable to the Company.
    The Directors had devised proper systems to ensure compliance with the provisions of all applicable laws and that such systems were adequate and operating effectively.",
    "B89": "No dividend is declared for this year, as the distributable surplus being Nil.",
    "M89": 0
    "B90": "Nil"
    }}
    Return only this JSON mapping — do not output any other text or reasoning or explanations.
    """

    return json.loads(_extract_json_from_response(_invoke_bedrock(prompt)))

def extract_directors_report_fields_with_bedrock(document_text: str, template_data: dict) -> Dict[str, Any]:
    """
    Use Bedrock Claude to extract ALL AOC-4 fields from financial statement text
    Uses 8-pass extraction for complete coverage of 300+ variables
    
    Args:
        document_text: Full text extracted from document
    
    Returns:
        Dictionary with all extracted financial fields (including calculated Net Worth)
    
    Raises:
        Exception: If Bedrock invocation fails or response is invalid
    """
    log_info("Starting comprehensive AOC-4 extraction with Bedrock Claude...")
    log_info(f"Document length: {len(document_text):,} characters")
    try:
        unprotected_cells = {
            cell: info[0] for cell, info in template_data.items()
            if (not info[1])
        }
        extracted_data = {}

        document_start_idx=0
        while document_start_idx<len(document_text):
            document_end_idx = document_start_idx + CHUNK_SIZE
            chunk_text = document_text[document_start_idx:document_end_idx]
            document_start_idx = document_end_idx-CHUNK_OVERLAP
            
            chunk_extracted_data = extract_directors_report_fields_in_chunk_with_bedrock(chunk_text, template_data,unprotected_cells)
            for key, value in chunk_extracted_data.items():
                if key in extracted_data:
                    if extracted_data[key] in ("",'None','null','0',0,None):
                        extracted_data[key] = value
                else:
                    extracted_data[key]=value
        return extracted_data
        # Pass 1: Balance Sheet - Equity & Liabilities (Basic)
    except Exception as e:
        log_error(f"AOC-4 extraction failed: {str(e)}")
        raise


def extract_fields_with_bedrock(document_text: str, tempate_data: dict) -> dict[str, Any]:
    """
    Extract structured fields from AOC-4 financial statement using Bedrock
    This is a wrapper that maintains consistency with other document processors
    
    Args:
        document_text: Raw text extracted from document via Textract
    
    Returns:
        dict: Hierarchical structured data extracted from AOC-4
    """
    try:
        log_info("Starting AOC-4 field extraction using Bedrock")
        log_info(f"Document text length: {len(document_text):,} characters")
        
        # Call the comprehensive 8-pass AOC4 extraction
        extracted_fields = extract_directors_report_fields_with_bedrock(document_text, tempate_data)
        
        log_info("✓ AOC-4 field extraction completed successfully")
        log_info(f"Preview extracted cell mapping: {extracted_fields}")
            
    except Exception as e:
        log_error(f"AOC-4 field extraction failed: {str(e)}")
        raise

    return extracted_fields
