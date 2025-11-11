"""
Bedrock Service
Handles intelligent field extraction using Amazon Bedrock (Claude)
"""

import json
import boto3
from typing import Dict, Optional
from config import BEDROCK_MODEL_ID, MAX_TOKENS, TEMPERATURE, REQUIRED_FIELDS
from utils.logger import log_info, log_error

bedrock_client = boto3.client('bedrock-runtime')

# Character limits for fields
FIELD_CHAR_LIMITS = {
    "Opinion of the Auditor": 5000,
    "Basis of Opinion": 5000,
    "Emphasis of Matter": 5000,
    "Key Audit Matters": 5000,
    "Other Information (if any)": 5000,
    "Responsibilities of Management and those charged with governance for the financial statements": 5000,
    "Auditor's responsibilities for the audit of standalone financial statements": 5000,
    "State other matters as per rule 11 of Companies (Audit and Auditors) Rules, 2014": 5000,
    "Report on other legal and regulatory requirements": 5000,
    "Reporting on the internal financial controls": 5000
}


def extract_fields_with_bedrock(document_text: str) -> Dict[str, Optional[str]]:
    """
    Use Bedrock Claude to extract auditor report fields from text
    
    Args:
        document_text: Full text extracted from document
    
    Returns:
        Dictionary with 15 extracted fields
    
    Raises:
        Exception: If Bedrock invocation fails or response is invalid
    """
    log_info("Invoking Bedrock Claude for intelligent extraction...")
    
    # Build prompt
    prompt = _build_extraction_prompt(document_text)
    
    # Prepare request
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
        # Invoke Bedrock
        response = bedrock_client.invoke_model(
            modelId=BEDROCK_MODEL_ID,
            body=json.dumps(request_body)
        )
        
        # Parse response
        response_body = json.loads(response['body'].read())
        content = response_body['content'][0]['text']
        
        log_info(f"Bedrock response received: {len(content)} characters")
        
        # Extract JSON from response
        extracted_json = _extract_json_from_response(content)
        extracted_fields = json.loads(extracted_json)
        
        # Apply business validations
        extracted_fields = _apply_business_validations(extracted_fields)
        
        # Validate fields
        fields_found = sum(1 for f in REQUIRED_FIELDS if f in extracted_fields)
        log_info(f"✓ Extraction complete: {fields_found}/{len(REQUIRED_FIELDS)} fields found")
        
        return extracted_fields
        
    except Exception as e:
        log_error(f"Bedrock extraction failed: {str(e)}")
        raise


def _apply_business_validations(extracted_fields: Dict) -> Dict:
    """
    Apply business validation rules to extracted fields
    
    Args:
        extracted_fields: Dictionary of extracted fields
    
    Returns:
        Validated and corrected dictionary
    """
    log_info("Applying business validations...")
    
    # List of mandatory fields
    mandatory_fields = [
        "Opinion of the Auditor",
        "Basis of Opinion",
        "Emphasis of Matter",
        "Key Audit Matters",
        "Other Information (if any)",
        "Responsibilities of Management and those charged with governance for the financial statements",
        "Auditor's responsibilities for the audit of standalone financial statements",
        "State other matters as per rule 11 of Companies (Audit and Auditors) Rules, 2014",
        "Report on other legal and regulatory requirements",
        "Reporting on the internal financial controls"
    ]
    
    # 1. Ensure all mandatory fields are present and not empty
    for field in mandatory_fields:
        if field not in extracted_fields or not extracted_fields[field] or str(extracted_fields[field]).strip() == '':
            if field == "Emphasis of Matter":
                # Special case: if Emphasis of Matter is empty, set to "Nil"
                extracted_fields[field] = "Nil"
                log_info(f"✓ Set '{field}' to 'Nil' (empty field)")
            else:
                # For other mandatory fields, set placeholder
                extracted_fields[field] = "Not found in document"
    
    # 2. Enforce character limits (truncate if exceeded)
    for field, limit in FIELD_CHAR_LIMITS.items():
        if field in extracted_fields and extracted_fields[field]:
            value = str(extracted_fields[field])
            if len(value) > limit:
                extracted_fields[field] = value[:limit]
    
    # 3. Validate "Whether CARO is applicable" - must be "Yes" or "No"
    if "Whether CARO is applicable" in extracted_fields:
        caro_value = str(extracted_fields["Whether CARO is applicable"]).strip().lower()
        if caro_value not in ["yes", "no"]:
            # Try to infer from text
            if any(word in caro_value for word in ["not applicable", "exempt", "not apply"]):
                extracted_fields["Whether CARO is applicable"] = "No"
            else:
                extracted_fields["Whether CARO is applicable"] = "Yes"
        else:
            extracted_fields["Whether CARO is applicable"] = caro_value.capitalize()
        log_info(f"✓ CARO applicable: {extracted_fields['Whether CARO is applicable']}")
    
    # 4. Validate Signatory Type/Designation - must not be empty and must be valid
    valid_designations = ["Director", "Partner", "Proprietor"]
    if "Signatory Type/ Designation" in extracted_fields:
        designation = extracted_fields["Signatory Type/ Designation"]
        if not designation or str(designation).strip() == '' or designation not in valid_designations:
            # Try to infer from document or set default
            extracted_fields["Signatory Type/ Designation"] = "Director"
        log_info(f"✓ Signatory designation: {extracted_fields['Signatory Type/ Designation']}")
    
    # 5. Validate DIN - should be 8 digits if present, only for Directors
    if "DIN" in extracted_fields and extracted_fields["DIN"]:
        din = str(extracted_fields["DIN"]).strip()
        if din and din != "null":
            # Remove non-digits
            din_digits = ''.join(filter(str.isdigit, din))
            if len(din_digits) == 8:
                extracted_fields["DIN"] = din_digits
                log_info(f"✓ DIN validated: {din_digits}")
            else:
                extracted_fields["DIN"] = None
        else:
            extracted_fields["DIN"] = None
    
    # 6. Validate PAN - should be in format ABCDE1234F
    if "PAN" in extracted_fields and extracted_fields["PAN"]:
        pan = str(extracted_fields["PAN"]).strip().upper()
        if pan and pan != "NULL":
            # PAN format: 5 letters, 4 digits, 1 letter
            import re
            if re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]$', pan):
                extracted_fields["PAN"] = pan
                log_info(f"✓ PAN validated: {pan}")
            else:
                extracted_fields["PAN"] = None
        else:
            extracted_fields["PAN"] = None
    
    log_info("✓ Business validations completed")
    return extracted_fields


def _build_extraction_prompt(document_text: str) -> str:
    """Build the extraction prompt for Claude"""
    
    prompt = """You are a professional document analyst specializing in auditor reports. Extract the following 15 fields from the Independent Auditor's Report text.

**CRITICAL BUSINESS RULES:**
- ALL fields listed as MANDATORY must have content - never return null or empty string for them
- Each field has a 5000 character maximum limit - extract comprehensively but stay within limits
- Each field name must appear EXACTLY ONCE in the JSON output
- Do NOT repeat any field names - this is critical for valid JSON
- For optional fields that don't exist, return null
- Be accurate - extract actual text from the document
- Do not hallucinate or invent information
- Preserve original wording from the document
- **For sections with multiple points/paragraphs, extract ALL of them - do not stop at the first point**

**MANDATORY FIELDS (MUST have content, max 5000 chars each):**
1. Opinion of the Auditor
2. Basis of Opinion
3. Emphasis of Matter (if not found, extract "Nil" or "Not Applicable")
4. Key Audit Matters
5. Other Information (if any)
6. Responsibilities of Management and those charged with governance for the financial statements
7. Auditor's responsibilities for the audit of standalone financial statements
8. State other matters as per rule 11 of Companies (Audit and Auditors) Rules, 2014
9. Report on other legal and regulatory requirements
10. Reporting on the internal financial controls

**SPECIAL VALIDATION RULES:**
- Field 11 (Whether CARO is applicable): return ONLY "Yes" or "No"
- Field 13 (Signatory Type/Designation): return ONLY "Director" or "Partner" or "Proprietor" (MANDATORY - must not be empty)
- Field 14 (DIN): return 8-digit number only (null if not found or not a Director)
- Field 15 (PAN): return format ABCDE1234F only (null if not found)
- Membership numbers are NOT DIN or PAN

**FIELDS TO EXTRACT:**

1. **Opinion of the Auditor** [MANDATORY, max 5000 chars]
   - Keywords: "Opinion", "Auditor's Opinion", "In our opinion"
   - Extract: Complete opinion paragraph(s)
   - If not found: Extract any statement about financial statement assessment

2. **Basis of Opinion** [MANDATORY, max 5000 chars]
   - Keywords: "Basis for Opinion", "Basis of Opinion"  
   - Extract: Complete basis section
   - If not found: Extract any statement about audit standards followed

3. **Emphasis of Matter** [MANDATORY, max 5000 chars]
   - Keywords: "Emphasis of Matter"
   - Extract: Complete paragraph
   - If not found: Return "Nil"

4. **Key Audit Matters** [MANDATORY, max 5000 chars]
   - Keywords: "Key Audit Matters", "KAM", "Critical Audit Matters"
   - Extract: Complete section including all KAMs listed
   - If states "not applicable", extract that full explanation

5. **Other Information (if any)** [MANDATORY, max 5000 chars]
   - Keywords: "Other Information", "Information other than"
   - Extract: Complete section
   - If not found: Return "Not Applicable" or "None"

6. **Responsibilities of Management and those charged with governance for the financial statements** [MANDATORY, max 5000 chars]
   - Keywords: "Management's Responsibility", "Responsibilities of Management"
   - Extract: Complete section with all points

7. **Auditor's responsibilities for the audit of standalone financial statements** [MANDATORY, max 5000 chars]
   - Keywords: "Auditor's Responsibilities"
   - Extract: Complete section with all responsibilities listed

8. **State other matters as per rule 11 of Companies (Audit and Auditors) Rules, 2014** [MANDATORY, max 5000 chars]
   - Keywords: "Rule 11", "Section 143(3)", "Companies (Audit and Auditors) Rules"
   - Extract: Complete section with all clauses
   - If not found: Return "Not Applicable"

9. **State, any other matters if any** [Optional]
   - Keywords: "Other Matters", "Any Other Matters"
   - Extract: Complete section (null if not found)

10. **Report on other legal and regulatory requirements** [MANDATORY, max 5000 chars]
    - Keywords: "Report on Other Legal and Regulatory Requirements", "CARO", "Section 143"
    - **CRITICAL: Extract ALL numbered/lettered points: (a), (b), (c), (i), (ii), (iii), 1., 2., 3.**
    - Include: All CARO content, all Section 143 matters, all sub-clauses
    - Extract: COMPLETE section from start until next major heading
    - Do NOT stop at first point - get everything in this section

11. **Whether CARO is applicable** [MANDATORY - must be "Yes" or "No" only]
    - Look for: "CARO", "Companies (Auditor's Report) Order", "not applicable"
    - Return: ONLY "Yes" or "No" (nothing else)

12. **Reporting on the internal financial controls** [MANDATORY, max 5000 chars]
    - Keywords: "Internal Financial Controls", "IFC", "internal control"
    - Extract: Complete section including exemption status if mentioned

13. **Signatory Type/ Designation** [MANDATORY - must not be empty]
    - Look for: "Partner", "Director", "Proprietor" near signature at bottom
    - Return: ONLY "Director" or "Partner" or "Proprietor"
    - Default to "Director" if unclear but signatory present

14. **DIN** [Optional - only if Director]
    - Keywords: "DIN" followed by 8 digits
    - Return: ONLY 8-digit number (null if not found)
    - Ignore membership numbers

15. **PAN** [Optional]
    - Keywords: "PAN", format ABCDE1234F
    - Return: ONLY PAN in correct format (null if not found)

**DOCUMENT TEXT:**
{document_text}

**OUTPUT FORMAT:**
Return ONLY a valid JSON object with these exact 15 field names (each appearing ONCE):
```json
{{
    "Opinion of the Auditor": "...",
    "Basis of Opinion": "...",
    "Emphasis of Matter": "Nil",
    "Key Audit Matters": "...",
    "Other Information (if any)": "...",
    "Responsibilities of Management and those charged with governance for the financial statements": "...",
    "Auditor's responsibilities for the audit of standalone financial statements": "...",
    "State other matters as per rule 11 of Companies (Audit and Auditors) Rules, 2014": "...",
    "State, any other matters if any": null,
    "Report on other legal and regulatory requirements": "...",
    "Whether CARO is applicable": "No",
    "Reporting on the internal financial controls": "...",
    "Signatory Type/ Designation": "Director",
    "DIN": null,
    "PAN": null
}}
```

**REMINDER:** 
- Never leave mandatory fields empty or null
- Extract ALL points from multi-point sections
- Stay within 5000 character limits
- Use exact format for Yes/No, designations, DIN, PAN
- Return ONLY the JSON object, no explanations"""
    
    return prompt.format(document_text=document_text)


def _extract_json_from_response(text: str) -> str:
    """
    Extract JSON from Claude's response
    Handles markdown code blocks, malformed JSON, and duplicate keys
    """
    import re
    log_info(f"Raw Bedrock response length: {len(text)} characters")

    # Handle markdown json blocks
    if '```json' in text:
        start = text.find('```json') + 7
        end = text.find('```', start)
        json_str = text[start:end].strip()
    # Handle generic code blocks
    elif '```' in text:
        start = text.find('```') + 3
        end = text.find('```', start)
        json_str = text[start:end].strip()
    # Try to find raw JSON object
    else:
        start = text.find('{')
        end = text.rfind('}') + 1
        if start != -1 and end > start:
            json_str = text[start:end]
        else:
            raise ValueError("Could not find JSON object in response")

    # Remove trailing commas before closing braces/brackets
    json_str = re.sub(r',(\s*[}\]])', r'\1', json_str)

    # Handle duplicate keys by keeping only first occurrence
    lines = json_str.split('\n')
    seen_keys = set()
    cleaned_lines = []
    skip_next_lines = 0

    for i, line in enumerate(lines):
        if skip_next_lines > 0:
            skip_next_lines -= 1
            continue
            
        # Check if line contains a key definition
        key_match = re.match(r'\s*"([^"]+)"\s*:', line)
        if key_match:
            key = key_match.group(1)
            if key in seen_keys:
                log_info(f"Removing duplicate key: {key}")
                # Skip value lines for duplicate key
                j = i + 1
                while j < len(lines):
                    next_line = lines[j]
                    if re.match(r'\s*"[^"]+"\s*:', next_line) or re.match(r'\s*}', next_line):
                        break
                    skip_next_lines += 1
                    j += 1
                continue
            seen_keys.add(key)
        cleaned_lines.append(line)

    json_str = '\n'.join(cleaned_lines)

    # Remove control characters
    json_str = ''.join(char for char in json_str if ord(char) >= 32 or char in ['\n', '\r', '\t'])

    log_info(f"Cleaned JSON with {len(seen_keys)} unique keys")

    return json_str


# --------------------------------------------------------------------------- #
# Functional wrapper for unified Lambdas
# --------------------------------------------------------------------------- #
def extract_fields_with_bedrock(document_text, region_name=None, model_id=None):
    """
    Compatible wrapper for unified Lambdas.
    Creates a BedrockService instance and calls extract_fields().
    """
    bedrock = BedrockService(region_name=region_name, model_id=model_id)
    return bedrock.extract_fields(document_text)
