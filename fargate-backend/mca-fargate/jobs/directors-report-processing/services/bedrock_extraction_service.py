import boto3
import json
import logging
from botocore.exceptions import ClientError
from utils.logger import log_error, log_info
from config import BEDROCK_MODEL_ID, BEDROCK_REGION

logger = logging.getLogger()

class BedrockService:
    def __init__(self, region_name, model_id):
        self.bedrock_runtime = boto3.client(
            service_name='bedrock-runtime',
            region_name=region_name
        )
        self.model_id = model_id
    
    def extract_fields(self, document_text):
        """Extract fields from document text using Bedrock"""
        try:
            prompt = self._build_extraction_prompt(document_text)
            
            # Prepare the request body for Claude
            request_body = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 4096,
                "temperature": 0,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            }
            
            # Invoke the model
            response = self.bedrock_runtime.invoke_model(
                modelId=self.model_id,
                body=json.dumps(request_body)
            )
            
            # Parse response
            response_body = json.loads(response['body'].read())
            extracted_content = response_body['content'][0]['text']
            
            # Parse JSON from response
            extracted_json = self._parse_json_from_response(extracted_content)
            
            logger.info("Successfully extracted fields using Bedrock")
            return extracted_json
            
        except ClientError as e:
            logger.error(f"Error invoking Bedrock: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Error processing Bedrock response: {str(e)}")
            raise
    
    def _build_extraction_prompt(self, document_text):
        """Build the prompt for field extraction"""
        from utils.field_definitions import get_extraction_prompt
        
        field_schema = get_extraction_prompt()
        
        validation_rules = """
**CRITICAL VALIDATION RULES - MUST BE FOLLOWED:**

1. **Field 3: Directors Responsibility Statement**
   - MANDATORY field
   - Maximum length: 1000 characters
   - Must be concise and within character limit
   - If source text is longer, summarize key points to fit within 1000 characters

2. **Field 9(d): Brief details as to why transaction is not reportable**
   - Maximum length: 500 characters
   - If details are available in the document, extract and provide them (max 500 chars)
   - If no details are available or transaction is not applicable, use "Not Applicable"
   - Never leave empty or null

3. **Field 12(b): Amount**
   - MANDATORY if field 12(a) "Brief Description" is populated
   - Must be a valid numeric amount
   - Cannot be null/None if 12(a) has content

4. **Field 13(b): Amount**
   - MANDATORY if field 13(a) "Brief Description" is populated
   - Must be a valid numeric amount
   - Cannot be null/None if 13(a) has content

5. **Field 23(j): Employee Numbers (if field 2(a) is "No")**
   - Number of female employees: MANDATORY, numeric, max 5 digits
   - Number of male employees: MANDATORY, numeric, max 5 digits
   - Number of Transgender employees: MANDATORY, numeric, max 5 digits
   - Use 0 if count is zero, never use null/None

6. **Field 23.f - Deposit Information (all amounts must be valid positive numbers):**
   - 23.f(i) Deposits accepted during year: valid numeric amount
   - 23.f(ii) Deposits remained unpaid/unclaimed at end of year: valid positive amount only
   - 23.f(iii) Amount of default at beginning of year: valid positive amount only
   - 23.f(iv) Maximum amount of default during year: valid positive amount only
   - 23.f(v) Amount of default at end of year: valid positive amount only
   - Use 0 for zero amounts, never use null/None

7. **Field 23.f - Deposit Cases (all must be numeric):**
   - 23.f(vi) Number of cases at beginning of year: numeric, max 5 digits
   - 23.f(vii) Maximum number of cases during year: numeric, max 5 digits
   - 23.f(viii) Number of cases at end of year: numeric, max 5 digits
   - Use 0 for zero cases, never use null/None

**EXTRACTION GUIDELINES:**
- When a field is not found in the document, use null for optional fields
- For mandatory fields, never use null - provide extracted value or appropriate default
- For field 9(d): use "Not Applicable" if no details found, otherwise extract details
- Respect character limits by summarizing content when necessary
- All numeric fields should be numbers, not strings
- All amounts should be positive values where specified
- For conditional mandatory fields, check the condition before deciding if required
"""
        
        prompt = f"""You are an expert at extracting structured data from Directors' Report documents under the Indian Companies Act, 2013.

Analyze the following document text and extract information according to the field schema provided below.

{field_schema}

{validation_rules}

**DOCUMENT TEXT:**
{document_text[:20000]}

Extract all available information and return ONLY a valid JSON object matching the schema above. Ensure all validation rules are strictly followed. Do not include any explanations or markdown formatting."""
        
        return prompt
    
    def _parse_json_from_response(self, response_text):
        """Parse JSON from the model response"""
        try:
            # Try to find JSON in the response
            response_text = response_text.strip()
            
            # Remove markdown code blocks if present
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.startswith('```'):
                response_text = response_text[3:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            response_text = response_text.strip()
            
            # Parse JSON
            extracted_json = json.loads(response_text)
            return extracted_json
            
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing JSON from response: {str(e)}")
            logger.error(f"Response text: {response_text[:500]}")
            # Return a structured error response
            return {
                "error": "Failed to parse JSON from AI response",
                "raw_response": response_text[:1000]
            }


def extract_fields_with_bedrock(document_text: str) -> dict:
    """
    Extract structured fields from directors report text using Bedrock
    
    Args:
        document_text: Raw text extracted from document via Textract
    
    Returns:
        dict: Hierarchical structured data extracted from document
    """
    try:
        log_info("Initializing BedrockService for directors report extraction")
        
        # Initialize Bedrock service
        bedrock_service = BedrockService(
            region_name=BEDROCK_REGION,
            model_id=BEDROCK_MODEL_ID
        )
        
        # Extract fields
        log_info(f"Extracting fields from {len(document_text):,} characters of text")
        extracted_fields = bedrock_service.extract_fields(document_text)
        
        log_info(f"Successfully extracted {len(extracted_fields)} top-level fields")
        
        return extracted_fields
        
    except Exception as e:
        log_error(f"Field extraction failed: {str(e)}")
        raise