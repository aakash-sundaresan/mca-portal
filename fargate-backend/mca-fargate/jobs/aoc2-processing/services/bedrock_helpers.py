"""
AOC-4 Helper Functions

Contains utility functions for Bedrock API interactions and JSON parsing.
"""

import json
import boto3
import re
import time
from typing import Dict, Any
from config import (
    BEDROCK_MODEL_ID, MAX_TOKENS, TEMPERATURE
)
from utils.logger import log_info, log_error

bedrock_client = boto3.client('bedrock-runtime')


def invoke_bedrock(prompt: str) -> str:
    """
    Invoke Bedrock API with a prompt.
    
    Args:
        prompt: The prompt string to send to Bedrock
    
    Returns:
        The response text from Bedrock
    
    Raises:
        Exception: If Bedrock invocation fails
    """
    start_time = time.time()
    
    request_body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": MAX_TOKENS,
        "temperature": TEMPERATURE,
        "messages": [{"role": "user", "content": prompt}]
    }
    
    try:
        log_info(f"Invoking Bedrock (prompt: {len(prompt):,} chars)")
        
        response = bedrock_client.invoke_model(
            modelId=BEDROCK_MODEL_ID,
            body=json.dumps(request_body)
        )
        
        response_body = json.loads(response['body'].read())
        content = response_body['content'][0]['text']
        elapsed = time.time() - start_time
        
        log_info(f"Response in {elapsed:.1f}s ({len(content):,} chars)")
        return content
        
    except Exception as e:
        log_error(f"Bedrock failed: {str(e)}")
        raise


def extract_json(text: str) -> dict:
    """
    Extract JSON from AI response text.
    
    Handles various formats:
    - JSON wrapped in ```json code blocks
    - JSON wrapped in ``` code blocks
    - Plain JSON text
    
    Args:
        text: The response text from AI
    
    Returns:
        Parsed JSON as a dictionary, or empty dict if parsing fails
    """
    try:
        clean_text = text
        if '```json' in text:
            clean_text = text.split('```json')[1].split('```')[0]
        elif '```' in text:
            parts = text.split('```')
            if len(parts) >= 3:
                clean_text = parts[1]
        
        start = clean_text.find('{')
        end = clean_text.rfind('}') + 1
        
        if start == -1:
            return {}
        
        json_str = clean_text[start:end].strip() if end > start else clean_text[start:].strip()
        json_str = re.sub(r',(\s*[}\]])', r'\1', json_str)  # Remove trailing commas
        
        return json.loads(json_str)
        
    except Exception as e:
        log_error(f"JSON parse error: {str(e)}")
        return {}


# ============================================================================
# TEMPLATE PROCESSING HELPERS
# ============================================================================

def extract_date_of_signing_from_template(template_data: dict) -> str:
    """
    Extract the date of signing of financial statements from the template
    
    This date appears in a protected cell near the top of the template,
    under the header "Date of signing of financial statements"
    
    Args:
        template_data: Dict of {cell: [value, is_protected]}
    
    Returns:
        Date string in DD/MM/YYYY format, or empty string if not found
    """
    log_info("\n--- Extracting Date of Signing from Template ---")
    
    # Search for the header first
    header_keywords = [
        "date of signing of financial statements",
        "date of signing",
        "financial statements date"
    ]
    
    date_pattern = re.compile(r'\d{2}/\d{2}/\d{4}')  # Matches DD/MM/YYYY
    
    # Strategy 1: Find header cell, then look below it
    for cell, (value, is_protected) in template_data.items():
        if isinstance(value, str):
            value_lower = value.lower()
            
            # Check if this is the header
            if any(keyword in value_lower for keyword in header_keywords):
                log_info(f"  Found header in cell {cell}: {value}")
                
                # Extract row number from current cell
                match = re.search(r'(\d+)', cell)
                if match:
                    header_row = int(match.group(1))
                    
                    # Look for dates in the next few rows
                    for next_row in range(header_row + 1, header_row + 10):
                        for candidate_cell, (candidate_value, _) in template_data.items():
                            if str(next_row) in candidate_cell:
                                if isinstance(candidate_value, str) and date_pattern.match(candidate_value):
                                    log_info(f"  ✓ Found date in cell {candidate_cell}: {candidate_value}")
                                    return candidate_value
    
    # Strategy 2: Search for any date in top rows (fallback)
    log_info("  Header not found, searching top 20 rows for date pattern...")
    
    for cell, (value, is_protected) in template_data.items():
        match = re.search(r'(\d+)', cell)
        if match:
            row_num = int(match.group(1))
            
            # Only check top 20 rows
            if row_num <= 20:
                if isinstance(value, str) and date_pattern.match(value):
                    log_info(f"  ✓ Found date in cell {cell}: {value}")
                    return value
    
    log_info("  ⚠ Date of signing not found in template")
    return ""


# ============================================================================
# BUSINESS LOGIC HELPERS
# ============================================================================

def apply_custom_rounding(value: Any, field_path: str) -> Any:
    """
    Apply custom rounding logic based on field type
    
    Rules from old code:
    - EPS fields: DO NOT ROUND (keep full precision)
    - Negative values: Round absolute value, then make negative
    - Positive values: Round normally
    """
    if not isinstance(value, (int, float)):
        return value
    
    # Check if this is an EPS field - DO NOT ROUND
    if "earningsPerEquityShare" in field_path or "earningsPerShare" in field_path or "eps" in field_path.lower():
        log_info(f"  EPS field detected, skipping rounding: {field_path} = {value}")
        return value
    
    # Apply negative-specific rounding
    if value < 0:
        rounded = -round(abs(value))
        log_info(f"  Negative rounding: {value} → {rounded}")
        return rounded
    else:
        rounded = round(value)
        return rounded


def replicate_eps_values(extracted_values: Dict[str, Any]) -> Dict[str, Any]:
    """
    Replicate EPS values across the 3 instances if only one is found
    
    There are 3 places EPS appears:
    1. earningsPerEquityShareBeforeExtraordinaryItems (basic/diluted)
    2. earningsPerEquityShareAfterExtraordinaryItems (basic/diluted)
    3. financialParameters.profitAndLossItems.earningsPerShare (basic/diluted)
    
    Logic:
    - If only ONE instance has values, copy to the other 2 instances
    - Basic and Diluted remain separate (don't copy basic to diluted)
    - If document doesn't explicitly differentiate, all 3 instances likely have same values
    """
    log_info("\n--- Replicating EPS Values Across Instances ---")
    
    # Define the 3 EPS field groups
    eps_before = {
        "basic": "statementOfProfitAndLoss.earningsPerEquityShareBeforeExtraordinaryItems.basic",
        "diluted": "statementOfProfitAndLoss.earningsPerEquityShareBeforeExtraordinaryItems.diluted"
    }
    
    eps_after = {
        "basic": "statementOfProfitAndLoss.earningsPerEquityShareAfterExtraordinaryItems.basic",
        "diluted": "statementOfProfitAndLoss.earningsPerEquityShareAfterExtraordinaryItems.diluted"
    }
    
    eps_financial = {
        "basic": "financialParameters.profitAndLossItems.earningsPerShare.basic",
        "diluted": "financialParameters.profitAndLossItems.earningsPerShare.diluted"
    }
    
    all_groups = [eps_before, eps_after, eps_financial]
    
    # Check which groups have values for basic
    basic_values = []
    for group in all_groups:
        val = extracted_values.get(group["basic"], 0)
        if val not in (0, "", None):
            basic_values.append(val)
    
    # Check which groups have values for diluted
    diluted_values = []
    for group in all_groups:
        val = extracted_values.get(group["diluted"], 0)
        if val not in (0, "", None):
            diluted_values.append(val)
    
    log_info(f"  Basic EPS values found: {len(basic_values)}")
    log_info(f"  Diluted EPS values found: {len(diluted_values)}")
    
    # If only 1 basic value found, replicate to all 3 groups
    if len(basic_values) == 1:
        source_basic = basic_values[0]
        log_info(f"  Replicating Basic EPS: {source_basic} to all 3 instances")
        for group in all_groups:
            if extracted_values.get(group["basic"], 0) in (0, "", None):
                extracted_values[group["basic"]] = source_basic
                log_info(f"    ✓ {group['basic']} = {source_basic}")
    
    # If only 1 diluted value found, replicate to all 3 groups
    if len(diluted_values) == 1:
        source_diluted = diluted_values[0]
        log_info(f"  Replicating Diluted EPS: {source_diluted} to all 3 instances")
        for group in all_groups:
            if extracted_values.get(group["diluted"], 0) in (0, "", None):
                extracted_values[group["diluted"]] = source_diluted
                log_info(f"    ✓ {group['diluted']} = {source_diluted}")
    
    # If no values found at all
    if len(basic_values) == 0 and len(diluted_values) == 0:
        log_info("  ⚠ No EPS values found in document")
    
    return extracted_values

