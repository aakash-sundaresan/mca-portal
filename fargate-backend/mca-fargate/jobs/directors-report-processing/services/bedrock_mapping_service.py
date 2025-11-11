"""
Bedrock Service for AOC-4 (CORRECTED VERSION)
Handles intelligent field extraction for AOC-4 financial statements using Amazon Bedrock (Claude)
Extracts ALL 300+ variables across multiple passes with EXACT field names matching cell mappings
"""

import json
import math
import boto3
from typing import Dict, Any
from config import (
    BEDROCK_MODEL_ID, MAX_TOKENS, TEMPERATURE,
    CHUNK_SIZE, CHUNK_OVERLAP
)
from utils.logger import log_info, log_error
from openpyxl.utils import column_index_from_string
import re

bedrock_client = boto3.client('bedrock-runtime')


def create_prompt(grouped_template: dict, extracted_fields: dict, is_aoc4: bool, unprotected_cell: list[str]) -> str:
    prompt = f"""
You are an intelligent financial document assistant designed to map extracted field values
(from a hierarchical financial JSON) to corresponding cells in an Excel template.

You are given two JSON objects:

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
2. Extracted Fields (Hierarchical) — a nested JSON dictionary capturing the structure of financial data
extracted from a form like AOC-4.
For example:

{{
  "Balance Sheet": {{
    "Equity and Liabilities": {{
      "Shareholders' Fund": {{
        "Share Capital": {{"Current Year": 50000}},
        "Reserves and Surplus": {{"Current Year": 438325}},
        "Money Received Against Share Warrants": {{"Current Year": null}}
      }}
    }}
  }}
}}
## DEFINE UNPROTECTED_CELLS = {unprotected_cell}
Your Task
Step 1:
- For each cell in UNPROTECTED_CELLS, identify the question the cell is answering using the entire Template Data as context as mentioned below.
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
Consider a template_data like this:
{{
    "1": {{
       "B1": ["",true]
       "C1": ["Particulars", true],
       "G1": ["Current reporting period", true],
       "J1": ["Previous reporting period", true],
       "M1": ["Reason for change",true]
     }},
    "2": {{
       "B1": [1,true]
       "C2": ["Share Holder's Funds", true],
     }},
    "3": {{
       "B3": ["",true]
       "C3": ["(a) Share Capital", true],
       "G3": ["", false],
       "J3": ["1000", true],
       "M3": ["",false]
     }},
    "4": {{
       "B4": ["",true]
       "C4": ["(b) Reserves and surplus", true],
       "G4": ["", false],
       "J4": ["-40000", true],
       "M4": ["",false]
     }},
     "5": {{
       "B5": [2,true]
       "C5": ["Non - current liabilities", true],
     }},
     "6": {{
       "C6": ["Long Term Borrowings", true],
       "G6": ["", false],
       "J6": ["900000", true],
       "M6": ["",false]
     }}
}}
For cell
G3:
- Going up column G, we identify protecteed text "Current reporting period" as the column_header, because it exists this would be the last level of the "QUESTION"
- Looking at Row 3, in column C we find the text "Share Capital" as the row_header and it's index as (a) in the same cell, 
- because column_header exists, this would be the second last level of the "QUESTION"
- Now Going up column C, we find "Share Holder's Funds" with an index of 1 in the cell to it's left indicating a new super-section 
and hence this would be added to the to the "QUESTION" at the third last level
- Hence G3 should map to Share Holder's Funds.Share Capital.Current reporting period
- Similarly M6 should map to Non-current liabilities.Long Term Borrowings.Reason for change

[IMPORTANT NOTE] THIS IS JUST ONE EXAMPLE AND THE SAME PATTERN MIGHT NOT FOLLOW FOR EVERY UNPROTECTED CELL WHICH COULD OCCUR IN ANY COLUMN/ROW
THE UNDERLYING LOGIC IN MAPPING WOULD BE THE SAME THOUGH. 

Step 2:
Match each "QUESTION" in table1 to the closest flattened key path in Extracted Fields. 
Note that while matching them, look for similar meaning and not just exact/simlar words.
For example:
  current year and current reporting period are similar words and should be matched.
Save these in table2a:
{{ "QUESTION": "FLATTENED_KEY_PATH" }}
For example:

"(a) Share Holder's Funds.Share Capital.Current reporting period maps to flattened representation of

"Shareholders Fund": {{
    "Share Capital": {{
      "Current Year": 1000
    }},
}}

hence {{
  "Share Holder's Funds.Share Capital.Current" : "Shareholders Fund.Share Capital.Current Year"
}}

"(b) Non-current liabilities.Long Term Borrowings.Reason maps to flattened representation of
"Non-Current Liabilitie": {{
    "Long-Term Borrowings": {{
      "Reason": ""
    }},
}}

hence {{
  "Non-current liabilities.Long Term Borrowings.Reason" : "Non-Current Liabilitie".Long-Term Borrowings.Reason"
}}

Then derive table2:
{{ "CELL": {{
  "FLATTENED_KEY_PATH" : "FLATTENED_KEY_PATH",
  "QUESTION": "QUESTION
}} }}
by mapping every cell in table1 with the FLATTENED_KEY_PATH table 2a 
and if FLATTENED_KEY_PATH use null

Step 3:
Using table2, the hierarchical values in Extracted Fields, and the Rules below
create table3 mapping each cell to the correct VALUE and KEY_PATH. 
Rules:
- The FLATTENED_KEY_PATH is null, None, or '' 
  -Check if "QUESTION" requires a non numeric output 
  for example: name, reasoning, designation, description
   {'''or "QUESTION" contains text "Total Premium" and "Raised Share Capital"
   or "QUESTION" contains text "Others" and "Raised Share Capital"''' if is_aoc4 else ''}
   then map cell to ('', "Q.QUESTION") as ("VALUE","KEY_PATH")
   - Otherwise map to (0, "Q.QUESTION") as ("VALUE","KEY_PATH")
- Else If the VALUE is null, None or ''
 - Check if "FLATTENED_KEY_PATH" is answering a question that requires a string output
   {'''or "FLATTENED_KEY_PATH" contains text "Total Premium" and "Raised Share Capital"
   or "FLATTENED_KEY_PATH"contains text "Others" and "Raised Share Capital"''' if is_aoc4 else ''}
   then map cell to ('', "KP - FLATTENED_KEY_PATH") as ("VALUE","KEY_PATH")
   - Otherwise map to (0, "KP - FLATTENED_KEY_PATH") as ("VALUE","KEY_PATH")
- Otherwise, map cell to ("VALUE", "KP - FLATTENED_KEY_PATH") as ("VALUE","KEY_PATH")
Do not invent or infer any values not explicitly in Extracted Fields.

Create table3:
{{ "CELL": ("VALUE","KEY_PATH") }}
[Compulsory Check]: Ensure all cells in UNPROTECTED_CELLS are a part of table3
and ensure no cells outside UNPROTECTED_CELLS are a part of table3

Example:
From the above tables
G3 -> (1000, "KP - Shareholders Fund.Share Capital.Current Year")
M6 -> (0, "KP - Non-Current Liabilities.Long-Term Borrowings.Reason")

Step 4:

{'''
 STRICTLY PERFORM ONLY THE BELOW STEPS EXACTLY, DO NOT MODIFY OR IMPROVISE
1. Find unprotected cells mapped to a "QUESTION" with text similar to "Figures as at the end of (Previous reporting period)" 
 and map it to (0,"MANUAL_ZERO").
2. **Finding the date** by parsing Template Data again:
a Identify Signatory Details section (cell with value "Signatory Details" and is_protected=true)
b Locate the text "Date of signing of financial statement"
c Find the cell below it (protected, with a date like DD/MM/YYYY)
d Remember that date as that DATE_FOUND.
3. **Finding the cell to be filled with the DATE_FOUND by parsing Template Data again**
a Locate the Declaration section (cell with value "Declaration" and is_protected=true)
b In cells in the same column, a few rows below (<10), find the cell with value "dated*" and is_protected=true
c Find the cell in the same row with is_protected=false and exactly one cells to the right of the cell found in the step 3b
d Map this unprotected cell found in the step 3c to (DATE_FOUND,"MANUAL_DATE_FOUND") from step 2d.
Ensure all cells in UNPROTECTED_CELLS are a part of table3 after these steps
and ensure no cells outside UNPROTECTED_CELLS are a part of table3 after these steps
 ''' if is_aoc4 else 
  '' }
Input Data:
Template Data (Grouped):

{json.dumps(grouped_template, indent=2)}
Extracted Fields (Hierarchical):

{json.dumps(extracted_fields, indent=2)}
Output Requirements:
Output a valid JSON object mapping cells to the corresponding "VALUE" from the table
Order the cells by row number and then by column number.
example:
{{
  "G3":1000,
  "M3":0,
  "C7":"03/09/2025"
}}
Return only this JSON mapping — do not output any other text or reasoning or explanations.
"""
    return prompt

def cell_mapping_using_bedrock(extracted_fields: dict, template_data: dict, is_aoc4: bool) -> Dict[str, Any]:
    """
    Infer mapping between unprotected cells in template_data and extracted_fields using Bedrock.

    The LLM sees both protected and unprotected cells for context,
    but the final output mapping only includes unprotected cells.

    Args:
        extracted_fields (dict): JSON string of extracted fields (key -> value)
        template_data (dict): JSON string of cell data (cell -> (value, is_protected))

    Returns:
        Dict[str, Any]: Mapping of unprotected cell -> inferred value
    """
    try:
        log_info("Starting cell mapping using Bedrock")

        # Identify which cells are unprotected (but don’t filter them out for the prompt)
        unprotected_cells = {
            cell: info[0] for cell, info in template_data.items()
            if (not info[1])
            }
        

        log_info(f"Unprotected cells identified: {len(unprotected_cells)}")

        sorted_template = dict(
              sorted(
                  template_data.items(),
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

        log_info(f"Number of characters in extracted data: {len(json.dumps(extracted_fields, indent=2))}")

        # log_info(f"Extracted data: {(json.dumps(extracted_fields, indent=2))}")

        log_info(f"Number of characters in template data: {len(json.dumps(grouped_template, indent=2))}")
  
        # Construct the LLM prompt (includes ALL cells for context)
        prompt = create_prompt(grouped_template,extracted_fields,is_aoc4,list(unprotected_cells.keys()))
            # Invoke Bedrock
        bedrock_response = _invoke_claude_bedrock(prompt)
            # Extract JSON from Bedrock output
        json_str = _extract_json_from_response(bedrock_response)
        result = json.loads(json_str)
        
        log_info(f"mapping count before restricting to unprotected cells: {len(result)}")

        log_info(f"Samples of unfiltered result: {list(result.items())}")



        # Filter again to ensure only unprotected cells are retained
        filtered_result = {
            cell: value
            for cell, value in result.items()
            if cell in unprotected_cells
        }

        log_info(f"Samples of filtered result: {list(filtered_result.items())}")

        log_info(f"Final unprotected mapping count: {len(filtered_result)}")

    except Exception as e:
        log_error(f"cell_mapping_using_bedrock failed: {str(e)}")
        raise   
    return filtered_result
    
def _invoke_mistral_bedrock(prompt:str) -> str:
    request_body = {
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
        log_info(f"Response preview: {content}...")
        
        return content
    except Exception as e:
        log_error(f"Bedrock invocation failed: {str(e)}")
        log_error(f"Model ID: {BEDROCK_MODEL_ID}")
        raise

def _invoke_deepseek_bedrock(prompt:str) -> str:
    formatted_prompt = f"""
    <｜begin▁of▁sentence｜><｜User｜>{prompt}<｜Assistant｜><think>\n
    """
    request_body = {
        "prompt": formatted_prompt,
        "max_tokens": MAX_TOKENS,
        "temperature": TEMPERATURE,
        "top_p": 0.1,
        
    }
    try:
        response = bedrock_client.invoke_model(
            modelId=BEDROCK_MODEL_ID,
            body=json.dumps(request_body),
            contentType = "application/json"
        )

        response_body = json.loads(response['body'].read())
        
        if 'choices' not in response_body or len(response_body['choices']) == 0:
            log_error(f"Unexpected response structure: {json.dumps(response_body)}")
            raise ValueError("Bedrock response missing 'content' field")
        
        content = response_body['choices'][0]['text']
        
        log_info(f"Bedrock response received: {len(content)} characters")
        log_info(f"Response preview: {content}...")
        
        return content
    except Exception as e:
        log_error(f"Bedrock invocation failed: {str(e)}")
        log_error(f"Model ID: {BEDROCK_MODEL_ID}")
        raise


def _invoke_claude_bedrock(prompt: str) -> str:
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
        log_info(f"Response preview: {content}...")
        
        return content
        
    except Exception as e:
        log_error(f"Bedrock invocation failed: {str(e)}")
        log_error(f"Model ID: {BEDROCK_MODEL_ID}")
        raise



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
        else:
            log_error("Could not find JSON in response")
            log_error(f"Response preview: {text}")
            raise ValueError(f"Could not find JSON object in response. Response starts with: {text[:200]}")
    
    # Clean up the JSON string
    # Remove trailing commas before closing braces/brackets
    json_str = re.sub(r',(\s*[}\]])', r'\1', json_str)
    
    # Remove any text before first { and after last }
    first_brace = json_str.find('{')
    last_brace = json_str.rfind('}')
    if first_brace != -1 and last_brace != -1:
        json_str = json_str[first_brace:last_brace + 1]
    
    log_info(f"Cleaned JSON string length: {len(json_str)}")
    
    return json_str