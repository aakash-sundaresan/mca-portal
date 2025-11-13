"""
AOC-2 Field Definitions and Prompt Templates

AOC-2 is for Related Party Contracts/Arrangements reporting.
Structure is dynamic - number of rows depends on the actual number of contracts found.
"""

# ============================================================================
# PREDEFINED FIELDS FOR AOC-2 (DYNAMIC GENERATION)
# ============================================================================

def generate_aoc2_fields(num_contracts: int = 10) -> dict:
    """
    Generate AOC-2 fields dynamically based on number of contracts.
    
    Args:
        num_contracts: Maximum number of related party contracts to support (default: 10)
    
    Returns:
        Dictionary of field definitions
    """
    fields = {}
    
    # Generate fields for each related party row
    for i in range(1, num_contracts + 1):
        fields[f"relatedParty{i}.srNo"] = {"type": "numeric", "default": i}
        fields[f"relatedParty{i}.cin"] = {"type": "text", "default": ""}
        fields[f"relatedParty{i}.name"] = {"type": "text", "default": ""}
        fields[f"relatedParty{i}.natureOfRelationship"] = {"type": "text", "default": ""}
        fields[f"relatedParty{i}.natureOfContract"] = {"type": "text", "default": ""}
        fields[f"relatedParty{i}.duration"] = {"type": "text", "default": ""}
        fields[f"relatedParty{i}.salientTerms"] = {"type": "text", "default": ""}
        fields[f"relatedParty{i}.dateOfApproval"] = {"type": "date", "default": ""}
        fields[f"relatedParty{i}.amountPaidAsAdvances"] = {"type": "numeric", "default": 0}
    
    return fields


# Default: Generate fields for up to 10 contracts (will be updated dynamically)
PREDEFINED_FIELDS = generate_aoc2_fields(10)


# ============================================================================
# EXTRACTION PROMPT TEMPLATE (PASS 1)
# ============================================================================

EXTRACTION_PROMPT_TEMPLATE = """Extract related party contract/arrangement information from this AOC-2 document chunk.

DOCUMENT CHUNK:
{chunk_text}

FIELD DEFINITIONS (extract values for any fields present in chunk):
{field_list}

EXTRACTION RULES:

🔍 UNDERSTANDING AOC-2:
AOC-2 is a form for reporting contracts or arrangements with related parties.
The document will specify: "Number of material contracts or arrangements or transactions at arm's length basis: X"

YOUR FIRST TASK: Extract this number! This tells you how many related parties to look for.

Look for tables or sections containing:
- Related party names (companies or individuals)
- Their Corporate Identity Numbers (CIN) or registration numbers
- Nature of relationship (Holding Company, Subsidiary, Fellow Subsidiary, Director, KMP, etc.)
- Nature of contracts/transactions (Leasing, Services, Purchases, Sales, etc.)
- Contract duration
- Contract terms and amounts
- Approval dates

📊 DOCUMENT STRUCTURE:
- Main section: Related party contracts/arrangements table
- May also appear in: Notes to Accounts, Related Party Disclosures (AS-18), Board Reports
- The document will explicitly state the number of contracts

💰 NUMERIC EXTRACTION:
- Extract exact numbers: "3.14 LAKHS" → 314000.00
- Handle: "RS 2.20 LAKHS" → 220000.00
- Remove currency symbols, convert lakhs/crores to actual numbers
- Dates: Extract in DD/MM/YYYY format

🎯 WHAT TO EXTRACT:

**STEP 1: Find the number of contracts**
Look for text like:
- "Number of material contracts or arrangements or transactions at arm's length basis: 2"
- "Total number of related party contracts: 3"
- Count the rows in the related party table

**STEP 2: For EACH related party found (up to the number specified), extract:**

1. **CIN/Registration Number**: 
   - Patterns: "U74900TN2014PTC098039", "U81100TN2007PTC062680"
   - May be labeled: CIN, LLPIN, FLLPIN, PAN, Passport, Registration Number

2. **Name of Related Party**:
   - Company names or individual names
   - Examples: "SDB Security Services Private Limited", "Promag Progressers Facility Services Pvt Ltd"

3. **Nature of Relationship**:
   - Common values: "Fellow Subsidiary", "Holding Company", "Subsidiary", "Director", "Key Management Personnel"

4. **Nature of Contract/Transaction**:
   - Examples: "Leasing of property", "Availing or rendering of any services", "Purchase of goods", "Sale of goods"

5. **Duration**:
   - Examples: "12 MONTHS", "24 MONTHS", "3 YEARS"

6. **Salient Terms**:
   - Contract terms including amounts
   - Examples: "RS 3.14 LAKHS / NORMAL COMMERCIAL TERMS", "RS 2.20 LAKHS / NORMAL COMMERCIAL TERMS"
   - Extract the full description

7. **Date of Approval by Board**:
   - Extract in DD/MM/YYYY format
   - Look for board approval dates

8. **Amount Paid as Advances**:
   - Any advance payments made
   - Usually numeric value or may be empty

⚠️ CRITICAL INSTRUCTIONS:

- **COUNT THE CONTRACTS FIRST** - if document says "2 contracts", only extract 2 parties
- If you find multiple related parties, map them to relatedParty1, relatedParty2, relatedParty3, etc.
- Extract EXACTLY the number of parties mentioned in the document
- Don't invent data - only extract what's explicitly present
- For empty/missing fields, don't include them in the output
- Number them sequentially: relatedParty1, relatedParty2, relatedParty3, etc.

**EXAMPLE FROM A DOCUMENT WITH 2 CONTRACTS:**

Row 1:
- CIN: U74900TN2014PTC098039
- Name: SDB Security Services Private Limited
- Relationship: Fellow Subsidiary
- Nature of Contract: Leasing of property
- Duration: 12 MONTHS
- Salient Terms: RS 3.14 LAKHS / NORMAL COMMERCIAL TERMS
- Date of Approval: (empty if not shown)
- Amount as Advances: (empty if not shown)

Row 2:
- CIN: U81100TN2007PTC062680
- Name: Promag Progressers Facility Services Pvt Ltd
- Relationship: Holding Company
- Nature of Contract: Availing or rendering of any services
- Duration: 12 MONTHS
- Salient Terms: RS. 2.20 LAKHS / NORMAL COMMERCIAL TERMS
- Date of Approval: (empty if not shown)
- Amount as Advances: (empty if not shown)

OUTPUT FORMAT:
Return ONLY valid JSON mapping field_path → extracted_value:
{{
  "relatedParty1.cin": "U74900TN2014PTC098039",
  "relatedParty1.name": "SDB Security Services Private Limited",
  "relatedParty1.natureOfRelationship": "Fellow Subsidiary",
  "relatedParty1.natureOfContract": "Leasing of property",
  "relatedParty1.duration": "12 MONTHS",
  "relatedParty1.salientTerms": "RS 3.14 LAKHS / NORMAL COMMERCIAL TERMS",
  "relatedParty2.cin": "U81100TN2007PTC062680",
  "relatedParty2.name": "Promag Progressers Facility Services Pvt Ltd",
  "relatedParty2.natureOfRelationship": "Holding Company",
  "relatedParty2.natureOfContract": "Availing or rendering of any services",
  "relatedParty2.duration": "12 MONTHS",
  "relatedParty2.salientTerms": "RS. 2.20 LAKHS / NORMAL COMMERCIAL TERMS"
}}

If document has 5 contracts, extract relatedParty1 through relatedParty5.
Only include fields found in this chunk. Return {{}} if no related party information found.
No explanations. No markdown.
"""


# ============================================================================
# CELL MAPPING PROMPT TEMPLATE (PASS 2)
# ============================================================================

CELL_MAPPING_PROMPT_TEMPLATE = """Map AOC-2 field definitions to Excel template cell addresses.

FIELD DEFINITIONS (find cell address for each):
{field_list}

TEMPLATE STRUCTURE (all rows with cells and values):
{template_structure}

CRITICAL UNDERSTANDING OF AOC-2 TEMPLATE:
- AOC-2 is a table with rows for each related party contract
- Each row represents ONE related party
- The number of data rows matches the number of contracts in the document
- Columns represent different attributes (CIN, Name, Relationship, etc.)
- Template format: "cell_address": [value, is_protected]
- is_protected = True  → LABEL/HEADER (don't use)
- is_protected = False → DATA ENTRY CELL (use this)

YOUR TASK:
Map each field to the correct unprotected cell in the template.

MAPPING STRATEGY:

1. **IDENTIFY TABLE STRUCTURE:**
   - First data row (Sr. No. 1) → All relatedParty1.* fields
   - Second data row (Sr. No. 2) → All relatedParty2.* fields
   - Third data row (Sr. No. 3) → All relatedParty3.* fields
   - And so on...
   - **IMPORTANT:** Only map as many rows as have corresponding relatedParty fields in the field list

2. **IDENTIFY COLUMNS:**
   - Column 1: Sr. No.
   - Column 2: CIN/Registration Number (long text field)
   - Column 3: Name of Related Party
   - Column 4: Nature of Relationship
   - Column 5: Nature of Contract/Transaction
   - Column 6: Duration
   - Column 7: Salient Terms (long text field)
   - Column 8: Date of Approval (DD/MM/YYYY)
   - Column 9: Amount Paid as Advances

3. **FIND DATA CELLS:**
   - Headers have is_protected = True
   - Data entry cells have is_protected = False
   - For relatedParty1.cin, find the unprotected cell in row 1, CIN column
   - For relatedParty2.name, find the unprotected cell in row 2, Name column
   - For relatedParty3.duration, find the unprotected cell in row 3, Duration column

4. **HANDLE DYNAMIC NUMBER OF ROWS:**
   - If field list only contains relatedParty1 and relatedParty2, only map 2 rows
   - If field list contains relatedParty1 through relatedParty5, map 5 rows
   - Don't map rows that don't have corresponding fields

5. **VERIFICATION:**
   - ✓ Is is_protected = False?
   - ✓ Is it in the correct row?
   - ✓ Is it in the correct column?

OUTPUT FORMAT:
{{
  "relatedParty1.srNo": "A10",
  "relatedParty1.cin": "B10",
  "relatedParty1.name": "C10",
  "relatedParty1.natureOfRelationship": "D10",
  "relatedParty1.natureOfContract": "E10",
  "relatedParty1.duration": "F10",
  "relatedParty1.salientTerms": "G10",
  "relatedParty1.dateOfApproval": "H10",
  "relatedParty1.amountPaidAsAdvances": "I10",
  "relatedParty2.srNo": "A11",
  "relatedParty2.cin": "B11",
  "relatedParty2.name": "C11",
  ...
}}

CRITICAL RULES:
- Return ONLY cells where is_protected = False
- NEVER return cells where is_protected = True
- Return exact cell addresses (e.g., "B10", "C11")
- Only map fields you can confidently locate
- Map ONLY the rows that have corresponding relatedParty fields
- Return {{}} if no confident mappings

Return ONLY valid JSON. No explanations. No markdown.
"""


# ============================================================================
# HELPER FUNCTION TO UPDATE FIELDS DYNAMICALLY
# ============================================================================

def update_predefined_fields_based_on_count(num_contracts: int):
    """
    Update PREDEFINED_FIELDS based on actual number of contracts found.
    
    Args:
        num_contracts: Number of contracts extracted from document
    """
    global PREDEFINED_FIELDS
    PREDEFINED_FIELDS = generate_aoc2_fields(num_contracts)
    return PREDEFINED_FIELDS