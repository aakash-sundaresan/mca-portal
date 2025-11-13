"""
AOC-4 Complete Extraction System with Improved Mapping Validation

FIXES:
- Validates that mapped cells are unprotected (is_protected = False)
- Auto-corrects mappings that point to protected cells
- Better prompt emphasizing unprotected cell selection
- Handles negative numbers correctly in calculations
- Added missing business logic from old code
- Fixed EPS, Rent, and AS-18 extraction issues
- Extract date of signing from template for declaration
- Total Expenses used only for calculation, not filled
- EPS replication across 3 instances (before/after extraordinary, financial params)
- Enhanced rent detection
"""

import json
import re
import os
from typing import Dict, Any
from config import CHUNK_SIZE, CHUNK_OVERLAP
from utils.logger import log_info, log_error
from services.bedrock_constants_aoc2 import (
    PREDEFINED_FIELDS,
    EXTRACTION_PROMPT_TEMPLATE,
    CELL_MAPPING_PROMPT_TEMPLATE
)
from services.bedrock_helpers import (
    invoke_bedrock,
    extract_json,
    extract_date_of_signing_from_template,
    apply_custom_rounding,
    replicate_eps_values
)

# Cache directory
CACHE_DIR = "/tmp/aoc4_cache"
MAPPING_FILE = os.path.join(CACHE_DIR, "field_to_cell_mapping.json")
os.makedirs(CACHE_DIR, exist_ok=True)


# ============================================================================
# PASS 1: Extract Values from Data File
# ============================================================================

def extract_number_of_contracts(document_text: str) -> int:
    """
    Extract the number of material contracts from the document.
    
    Looks for patterns like:
    - "Number of material contracts or arrangements or transactions at arm's length basis: 2"
    - "Total related party contracts: 3"
    
    Args:
        document_text: The full document text
    
    Returns:
        Number of contracts found (default: 5 if not found)
    """
    import re
    
    log_info("\n--- Extracting Number of Contracts ---")
    
    # Pattern 1: "Number of material contracts ... : X"
    pattern1 = r'number\s+of\s+material\s+contracts[^:]*:\s*(\d+)'
    match1 = re.search(pattern1, document_text.lower())
    
    if match1:
        num = int(match1.group(1))
        log_info(f"  ✓ Found in document: {num} material contracts")
        return num
    
    # Pattern 2: Count rows in related party table (fallback)
    # Look for multiple occurrences of CIN patterns
    cin_pattern = r'[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}'
    cin_matches = re.findall(cin_pattern, document_text)
    
    if cin_matches:
        num = len(set(cin_matches))  # Unique CINs
        log_info(f"  ✓ Counted from CIN patterns: {num} related parties")
        return num
    
    # Default to 5 if can't determine
    log_info(f"  ⚠ Could not determine number of contracts, defaulting to 5")
    return 5

def extract_field_values_from_document(document_text: str) -> Dict[str, Any]:
    """
    PASS 1: Extract field values from AOC-2 document
    
    Args:
        document_text: The extracted text from AOC-2 PDF
    
    Returns:
        Dict of {field_path: extracted_value}
    """
    log_info("=" * 80)
    log_info("PASS 1: EXTRACT VALUES FROM DATA FILE")
    log_info("=" * 80)
    log_info(f"Document length: {len(document_text):,} chars")
    
    # FIRST: Determine how many contracts exist
    from services.bedrock_constants_aoc2 import update_predefined_fields_based_on_count
    num_contracts = extract_number_of_contracts(document_text)
    update_predefined_fields_based_on_count(num_contracts)
    
    log_info(f"Total fields to extract: {len(PREDEFINED_FIELDS)} (for {num_contracts} contracts)")
    
    # Initialize ALL fields with defaults
    extracted_values = {
        field_path: field_config["default"]
        for field_path, field_config in PREDEFINED_FIELDS.items()
    }
    log_info(f"✓ Initialized {len(extracted_values)} fields with default values")
        
    # Process document in chunks
    chunk_num = 0
    doc_position = 0
    fields_found = 0
    
    while doc_position < len(document_text):
        chunk_num += 1
        chunk_end = min(doc_position + CHUNK_SIZE, len(document_text))
        chunk_text = document_text[doc_position:chunk_end]
        
        log_info(f"\n--- Chunk {chunk_num} ({len(chunk_text):,} chars) ---")
        
        # AI extracts values from chunk
        prompt = EXTRACTION_PROMPT_TEMPLATE.format(
            chunk_text=chunk_text,
            field_list=json.dumps(list(PREDEFINED_FIELDS.keys()), indent=2)
        )
        
        try:
            response = invoke_bedrock(prompt)
            chunk_results = extract_json(response)
            
            if chunk_results:
                # Round and merge
                for field_path, value in chunk_results.items():
                    if field_path not in extracted_values:
                        continue
                    
                    if isinstance(value, (int, float)):
                        value = round(float(value), 2)
                    
                    old_value = extracted_values[field_path]
                    if old_value in (0, "", None) and value not in (0, "", None):
                        extracted_values[field_path] = value
                        fields_found += 1
                        log_info(f"  ✓ {field_path}: {value}")
        
        except Exception as e:
            log_error(f"Chunk {chunk_num} failed: {str(e)}")
        
        # Advance position
        if chunk_end >= len(document_text):
            break
        doc_position = chunk_end - CHUNK_OVERLAP
        if doc_position <= 0 or doc_position >= chunk_end:
            doc_position = chunk_end
        
        if chunk_num >= 100:
            log_error(f"Safety limit: stopped after {chunk_num} chunks")
            break
    
    # Summary
    log_info(f"\n{'='*80}")
    log_info(f"✓ PASS 1 COMPLETE: VALUE EXTRACTION")
    log_info(f"{'='*80}")
    log_info(f"Total fields: {len(extracted_values)}")
    log_info(f"Fields with values: {fields_found}")
    log_info(f"Fields with defaults: {len(extracted_values) - fields_found}")
    
    return extracted_values


# ============================================================================
# PASS 2: Extract Cell Addresses from Template (ONE-TIME, CACHEABLE)
# ============================================================================

def generate_field_to_cell_mapping(template_data: dict, force_regenerate: bool = False) -> Dict[str, str]:
    """
    PASS 2: Generate field_path → cell_address mapping from template
    
    This is a ONE-TIME operation. The mapping is cached and reused.
    
    Args:
        template_data: Dict of {cell: [value, is_protected]}
        force_regenerate: If True, regenerate even if cache exists
    
    Returns:
        Dict of {field_path: cell_address}
        Example: {"balanceSheet.equityAndLiabilities.shareHoldersFund.shareCapital": "M201"}
    """
    log_info("=" * 80)
    log_info("PASS 2: EXTRACT CELL ADDRESSES FROM TEMPLATE")
    log_info("=" * 80)
    
    # Check cache
    if not force_regenerate and os.path.exists(MAPPING_FILE):
        log_info(f"✓ Loading cached mapping from {MAPPING_FILE}")
        with open(MAPPING_FILE, 'r') as f:
            mapping = json.load(f)
        log_info(f"✓ Loaded {len(mapping)} field-to-cell mappings")
        return mapping
    
    log_info("Generating new field-to-cell mapping...")
    log_info(f"Template has {len(template_data)} cells")
    log_info(f"Fields to map: {len(PREDEFINED_FIELDS)}")
    
    # Group template by rows for context
    grouped_template = {}
    for cell, (value, is_protected) in template_data.items():
        match = re.search(r'(\d+)', cell)
        if match:
            row_num = int(match.group(1))
            if row_num not in grouped_template:
                grouped_template[row_num] = {}
            grouped_template[row_num][cell] = [value, is_protected]
    
    log_info(f"Template has {len(grouped_template)} rows")
    
    # Process fields in batches
    complete_mapping = {}
    batch_size = 50
    field_list = list(PREDEFINED_FIELDS.keys())
    
    for batch_num in range(0, len(field_list), batch_size):
        batch_fields = field_list[batch_num:batch_num + batch_size]
        
        log_info(f"\n--- Batch {batch_num//batch_size + 1}: {len(batch_fields)} fields ---")
        
        prompt = CELL_MAPPING_PROMPT_TEMPLATE.format(
            field_list=json.dumps(batch_fields, indent=2),
            template_structure=json.dumps(grouped_template, indent=2)
        )
        
        try:
            response = invoke_bedrock(prompt)
            batch_mapping = extract_json(response)
            
            if batch_mapping:
                # VALIDATION: Check that mapped cells are unprotected
                validated_mapping = {}
                rejected_count = 0
                corrected_count = 0
                
                for field_path, cell_address in batch_mapping.items():
                    if cell_address in template_data:
                        value, is_protected = template_data[cell_address]
                        
                        if not is_protected:
                            # Good - it's an unprotected cell
                            validated_mapping[field_path] = cell_address
                        else:
                            # Bad - AI mapped to a protected cell (label)
                            rejected_count += 1
                            log_error(f"    ✗ REJECTED: {field_path} → {cell_address} (protected cell)")
                            
                            # Try to auto-correct by finding unprotected cell in same row
                            match = re.search(r'([A-Z]+)(\d+)', cell_address)
                            if match:
                                col_letter = match.group(1)
                                row_num = match.group(2)
                                
                                # Look for unprotected cells in the same row
                                for candidate_cell, (val, protected) in template_data.items():
                                    if candidate_cell.endswith(row_num) and not protected:
                                        validated_mapping[field_path] = candidate_cell
                                        corrected_count += 1
                                        log_info(f"    ✓ AUTO-CORRECTED: {field_path} → {candidate_cell}")
                                        break
                    else:
                        log_error(f"    ✗ Cell {cell_address} not found in template")
                
                complete_mapping.update(validated_mapping)
                log_info(f"  ✓ Mapped {len(validated_mapping)} fields")
                
                if rejected_count > 0:
                    log_info(f"  ⚠ Rejected {rejected_count} protected cells")
                if corrected_count > 0:
                    log_info(f"  ✓ Auto-corrected {corrected_count} mappings")
        
        except Exception as e:
            log_error(f"  ✗ Batch {batch_num//batch_size + 1} failed: {str(e)}")
    
    # Summary
    log_info(f"\n{'='*80}")
    log_info(f"✓ PASS 2 COMPLETE: CELL ADDRESS MAPPING")
    log_info(f"{'='*80}")
    log_info(f"Total fields: {len(PREDEFINED_FIELDS)}")
    log_info(f"Successfully mapped: {len(complete_mapping)}")
    log_info(f"Unmapped: {len(PREDEFINED_FIELDS) - len(complete_mapping)}")
    
    # Show unmapped
    unmapped = set(PREDEFINED_FIELDS.keys()) - set(complete_mapping.keys())
    if unmapped:
        log_info(f"\nUnmapped fields ({len(unmapped)}):")
        for field in list(unmapped)[:10]:
            log_info(f"  - {field}")
        if len(unmapped) > 10:
            log_info(f"  ... and {len(unmapped) - 10} more")
    
    # Save to cache
    with open(MAPPING_FILE, 'w') as f:
        json.dump(complete_mapping, f, indent=2)
    log_info(f"\n✓ Saved mapping to {MAPPING_FILE}")
    
    return complete_mapping


# ============================================================================
# PASS 3: Combine Both JSONs + Apply Business Logic
# ============================================================================

def combine_values_and_mapping(extracted_values: Dict[str, Any], 
                               field_to_cell_mapping: Dict[str, str],
                               template_data: dict) -> Dict[str, Any]:
    """
    PASS 3: Combine extracted values with cell mapping + Apply Business Logic
    
    This includes:
    - Dictionary lookup (instant)
    - Extract date of signing from template
    - Replicate EPS values across instances
    - Endowment Fund addition to Reserves & Surplus
    - Managerial Remuneration subtraction from Employee Benefits
    - Net Worth calculation
    - Other Expenses calculation
    - Custom rounding logic
    """
    log_info("=" * 80)
    log_info("PASS 3: COMBINE VALUES + MAPPING + BUSINESS LOGIC")
    log_info("=" * 80)
    
    # ============================================================
    # STEP 0: EXTRACT DATE OF SIGNING FROM TEMPLATE
    # ============================================================
    date_of_signing = extract_date_of_signing_from_template(template_data)
    
    if date_of_signing:
        # Add to extracted values
        date_field = "declaration.dated"
        extracted_values[date_field] = date_of_signing
        log_info(f"✓ Date of signing extracted from template: {date_of_signing}")
    
    # ============================================================
    # STEP 0.5: REPLICATE EPS VALUES ACROSS INSTANCES
    # ============================================================
    extracted_values = replicate_eps_values(extracted_values)
    
    # ============================================================
    # STEP 1: APPLY PRE-CALCULATION BUSINESS LOGIC
    # ============================================================
    log_info("\n--- Step 1: Pre-Calculation Adjustments ---")
    
    # 1A. Add Endowment Fund to Reserves & Surplus
    reserves_surplus_field = "balanceSheet.equityAndLiabilities.shareHoldersFund.reservesAndSurplus"
    endowment_fund_field = "balanceSheet.equityAndLiabilities.shareHoldersFund.endowmentFund"
    
    reserves_surplus = extracted_values.get(reserves_surplus_field, 0)
    endowment_fund = extracted_values.get(endowment_fund_field, 0)
    
    if endowment_fund not in (0, "", None):
        if reserves_surplus in ("", None):
            reserves_surplus = 0
        else:
            reserves_surplus = float(reserves_surplus)
        
        endowment_fund = float(endowment_fund)
        adjusted_reserves = reserves_surplus + endowment_fund
        
        log_info(f"  Endowment Fund Adjustment:")
        log_info(f"    Original Reserves & Surplus: {reserves_surplus}")
        log_info(f"    Endowment Fund: {endowment_fund}")
        log_info(f"    Adjusted Reserves & Surplus: {adjusted_reserves}")
        
        extracted_values[reserves_surplus_field] = adjusted_reserves
    
    # 1B. Subtract Managerial Remuneration from Employee Benefit Expenses
    employee_benefits_field = "statementOfProfitAndLoss.expenses.employeeBenefitExpenses"
    managerial_remuneration_field = "statementOfProfitAndLoss.expenses.managerialRemuneration"
    
    employee_benefits = extracted_values.get(employee_benefits_field, 0)
    managerial_remuneration = extracted_values.get(managerial_remuneration_field, 0)
    
    if managerial_remuneration not in (0, "", None):
        if employee_benefits in ("", None):
            employee_benefits = 0
        else:
            employee_benefits = float(employee_benefits)
        
        managerial_remuneration = float(managerial_remuneration)
        adjusted_employee_benefits = employee_benefits - managerial_remuneration
        
        log_info(f"  Managerial Remuneration Adjustment:")
        log_info(f"    Original Employee Benefits: {employee_benefits}")
        log_info(f"    Managerial Remuneration: {managerial_remuneration}")
        log_info(f"    Adjusted Employee Benefits: {adjusted_employee_benefits}")
        
        extracted_values[employee_benefits_field] = adjusted_employee_benefits
    
    # ============================================================
    # STEP 2: MAP VALUES TO CELLS
    # ============================================================
    log_info("\n--- Step 2: Mapping Values to Cells ---")
    
    cell_values = {}
    mapped_count = 0
    value_count = 0
    unmapped_with_values = []
    
    # Fields to exclude from mapping (used only for calculations)
    excluded_fields = {
        "statementOfProfitAndLoss.expenses.totalExpenses"
    }
    
    for field_path, value in extracted_values.items():
        # Skip excluded fields
        if field_path in excluded_fields:
            log_info(f"  ⊘ Skipping {field_path} (used only for calculation)")
            continue
        
        # Count fields with actual values (include negatives and zero!)
        if value not in ("", None):
            value_count += 1
        
        # Try to map to cell
        if field_path in field_to_cell_mapping:
            cell_address = field_to_cell_mapping[field_path]
            
            # Apply custom rounding (but not for dates!)
            if isinstance(value, (int, float)):
                value = apply_custom_rounding(value, field_path)
            
            cell_values[cell_address] = value
            mapped_count += 1
            
        else:
            # Track unmapped fields that have values
            if value not in ("", None):
                unmapped_with_values.append((field_path, value))
    
    # ============================================================
    # STEP 3: CALCULATED FIELDS
    # ============================================================
    log_info("\n--- Step 3: Calculating Derived Fields ---")
    
    # 3A. Calculate Net Worth = Share Capital + Reserves & Surplus (already adjusted)
    share_capital_field = "balanceSheet.equityAndLiabilities.shareHoldersFund.shareCapital"
    net_worth_field = "financialParameters.netWorthOfCompany"
    
    share_capital = extracted_values.get(share_capital_field, 0)
    reserves_surplus = extracted_values.get(reserves_surplus_field, 0)  # Use adjusted value
    
    # Convert to numeric, handle empty strings (but keep negatives!)
    if share_capital in ("", None):
        share_capital = 0
    else:
        share_capital = float(share_capital)
    
    if reserves_surplus in ("", None):
        reserves_surplus = 0
    else:
        reserves_surplus = float(reserves_surplus)
    
    net_worth = share_capital + reserves_surplus
    
    log_info(f"  Net Worth Calculation:")
    log_info(f"    Share Capital: {share_capital}")
    log_info(f"    Reserves & Surplus (adjusted): {reserves_surplus}")
    log_info(f"    Net Worth: {net_worth}")
    
    # Map net worth to cell if mapping exists
    if net_worth_field in field_to_cell_mapping:
        net_worth_cell = field_to_cell_mapping[net_worth_field]
        net_worth_rounded = apply_custom_rounding(net_worth, net_worth_field)
        cell_values[net_worth_cell] = net_worth_rounded
        log_info(f"  {net_worth_cell} ← {net_worth_field} = {net_worth_rounded} (calculated)")
        mapped_count += 1
    else:
        log_info(f"  ⚠ No mapping found for {net_worth_field}")
    
    # 3B. Calculate Other Expenses
    log_info(f"\n  Other Expenses Calculation:")
    
    total_expenses_field = "statementOfProfitAndLoss.expenses.totalExpenses"
    other_expenses_field = "statementOfProfitAndLoss.expenses.otherExpenses"
    
    # Get all expense components
    total_expenses = extracted_values.get(total_expenses_field, 0)
    employee_benefits = extracted_values.get(employee_benefits_field, 0)  # Already adjusted
    managerial_rem = extracted_values.get(managerial_remuneration_field, 0)
    payment_to_auditors = extracted_values.get("statementOfProfitAndLoss.expenses.paymentToAuditors", 0)
    insurance = extracted_values.get("statementOfProfitAndLoss.expenses.insuranceExpenses", 0)
    power_fuel = extracted_values.get("statementOfProfitAndLoss.expenses.powerAndFuel", 0)
    finance_cost = extracted_values.get("statementOfProfitAndLoss.expenses.financeCost", 0)
    depreciation = extracted_values.get("statementOfProfitAndLoss.expenses.depreciationAndAmortization", 0)
    cost_materials = extracted_values.get("statementOfProfitAndLoss.expenses.costOfMaterialsConsumed", 0)
    purchases_stock = extracted_values.get("statementOfProfitAndLoss.expenses.purchasesOfStockInTrade", 0)
    inventory_changes = extracted_values.get("statementOfProfitAndLoss.expenses.changesInInventory", 0)
    
    # Convert all to float, treating empty/None as 0
    def to_float(val):
        return float(val) if val not in ("", None, 0) else 0.0
    
    total_expenses = to_float(total_expenses)
    employee_benefits = to_float(employee_benefits)
    managerial_rem = to_float(managerial_rem)
    payment_to_auditors = to_float(payment_to_auditors)
    insurance = to_float(insurance)
    power_fuel = to_float(power_fuel)
    finance_cost = to_float(finance_cost)
    depreciation = to_float(depreciation)
    cost_materials = to_float(cost_materials)
    purchases_stock = to_float(purchases_stock)
    inventory_changes = to_float(inventory_changes)
    
    # Calculate sum of all other costs
    sum_other_costs = (
        employee_benefits + managerial_rem + payment_to_auditors + insurance +
        power_fuel + finance_cost + depreciation + cost_materials +
        purchases_stock + inventory_changes
    )
    
    # Other Expenses = Total Expenses - Sum of all other costs
    calculated_other_expenses = total_expenses - sum_other_costs
    
    log_info(f"    Total Expenses: {total_expenses}")
    log_info(f"    Sum of Other Costs: {sum_other_costs}")
    log_info(f"      - Employee Benefits (adjusted): {employee_benefits}")
    log_info(f"      - Managerial Remuneration: {managerial_rem}")
    log_info(f"      - Payment to Auditors: {payment_to_auditors}")
    log_info(f"      - Insurance: {insurance}")
    log_info(f"      - Power & Fuel: {power_fuel}")
    log_info(f"      - Finance Cost: {finance_cost}")
    log_info(f"      - Depreciation: {depreciation}")
    log_info(f"      - Cost of Materials: {cost_materials}")
    log_info(f"      - Purchases of Stock: {purchases_stock}")
    log_info(f"      - Inventory Changes: {inventory_changes}")
    log_info(f"    Calculated Other Expenses: {calculated_other_expenses}")
    
    # Only use calculated value if it's meaningful
    if total_expenses != 0 and calculated_other_expenses >= 0:
        extracted_values[other_expenses_field] = calculated_other_expenses
        
        # Map to cell if mapping exists
        if other_expenses_field in field_to_cell_mapping:
            other_expenses_cell = field_to_cell_mapping[other_expenses_field]
            other_expenses_rounded = apply_custom_rounding(calculated_other_expenses, other_expenses_field)
            cell_values[other_expenses_cell] = other_expenses_rounded
            log_info(f"  {other_expenses_cell} ← {other_expenses_field} = {other_expenses_rounded} (calculated)")
            mapped_count += 1
    else:
        log_info(f"  ⚠ Cannot calculate Other Expenses (Total Expenses = {total_expenses})")
    
    # 3C. Share Application Money Fallback
    log_info(f"\n  Share Application Money Fallback Logic:")
    
    share_application_field = "financialParameters.shareApplicationMoneyReceivedDuringReportingPeriod"
    share_capital_field = "balanceSheet.equityAndLiabilities.shareHoldersFund.shareCapital"
    
    share_application = extracted_values.get(share_application_field, 0)
    share_capital = extracted_values.get(share_capital_field, 0)
    
    # If share application money is not found or is 0, use share capital value
    if share_application in (0, "", None):
        if share_capital not in (0, "", None):
            log_info(f"  Share Application Money not found in document")
            log_info(f"  Using Share Capital as fallback: {share_capital}")
            extracted_values[share_application_field] = share_capital
            
            # Map to cell if mapping exists
            if share_application_field in field_to_cell_mapping:
                share_app_cell = field_to_cell_mapping[share_application_field]
                share_app_rounded = apply_custom_rounding(share_capital, share_application_field)
                cell_values[share_app_cell] = share_app_rounded
                log_info(f"  {share_app_cell} ← {share_application_field} = {share_app_rounded} (from Share Capital)")
                mapped_count += 1
        else:
            log_info(f"  ⚠ Both Share Application Money and Share Capital not found")
    else:
        log_info(f"  ✓ Share Application Money found in document: {share_application}")
    
    # Summary
    log_info(f"\n{'='*80}")
    log_info(f"✓ PASS 3 COMPLETE: COMBINATION + BUSINESS LOGIC")
    log_info(f"{'='*80}")
    log_info(f"Total fields processed: {len(extracted_values)}")
    log_info(f"Fields with values: {value_count}")
    log_info(f"Successfully mapped to cells: {mapped_count}")
    log_info(f"Total cells filled: {len(cell_values)}")
    
    # Show cells with non-zero values
    non_zero_cells = {k: v for k, v in cell_values.items() if v not in ("", None)}
    log_info(f"Cells with non-zero values: {len(non_zero_cells)}")
    
    # Warn about unmapped fields with values
    if unmapped_with_values:
        log_info(f"\n⚠ WARNING: {len(unmapped_with_values)} fields have values but no cell mapping:")
        for field, value in unmapped_with_values[:10]:
            log_info(f"  - {field}: {value}")
        if len(unmapped_with_values) > 10:
            log_info(f"  ... and {len(unmapped_with_values) - 10} more")
    
    return cell_values


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

def extract_aoc4_fields_with_bedrock(document_text: str, template_data: dict) -> Dict[str, Any]:
    """
    Main entry point for AOC-4 extraction
    
    Args:
        document_text: Extracted text from AOC-4 PDF
        template_data: Excel template structure {cell: [value, is_protected]}
    
    Returns:
        Dict of {cell_address: value} ready to fill into Excel
    """
    log_info("\n" + "=" * 80)
    log_info("AOC-4 COMPLETE EXTRACTION SYSTEM")
    log_info("=" * 80)
    
    # Define fields to track
    tracked_fields = {
        "financialParameters.profitAndLossItems.rentPaid": "Rent Paid",
        "financialParameters.grossValueOfTransactionAsPerAS18": "AS-18 Gross Value",
        "financialParameters.profitAndLossItems.grossValueOfTransactionWithRelatedPartiesAsPerAS18": "AS-18 Related Party Transactions",
        "financialParameters.profitAndLossItems.badDebtsOfRelatedPartiesAsPerAS18": "AS-18 Bad Debts"
    }
    
    # PASS 1: Extract values from document (AI, per document)
    extracted_values = extract_field_values_from_document(document_text)
    
    # === DEBUG: PASS 1 - Check tracked fields ===
    log_info("\n" + "=" * 80)
    log_info("DEBUG: PASS 1 - Value Extraction")
    log_info("=" * 80)
    for field, label in tracked_fields.items():
        value = extracted_values.get(field, "NOT FOUND")
        status = "✓" if value not in (0, "", None, "NOT FOUND") else "✗"
        log_info(f"  {status} {label}: {value}")
    
    # PASS 2: Get field-to-cell mapping from template (cached, one-time)
    field_to_cell_mapping = generate_field_to_cell_mapping(template_data)
    
    # === DEBUG: PASS 2 - Check cell mappings ===
    log_info("\n" + "=" * 80)
    log_info("DEBUG: PASS 2 - Cell Mapping")
    log_info("=" * 80)
    for field, label in tracked_fields.items():
        cell = field_to_cell_mapping.get(field, "NOT MAPPED")
        value = extracted_values.get(field, 0)
        status = "✓" if cell != "NOT MAPPED" else "✗"
        log_info(f"  {status} {label}: {field} → {cell} (value: {value})")
    
    # PASS 3: Combine both + apply business logic (no AI, instant)
    cell_values = combine_values_and_mapping(extracted_values, field_to_cell_mapping, template_data)
    
    # === DEBUG: PASS 3 - Check final output ===
    log_info("\n" + "=" * 80)
    log_info("DEBUG: PASS 3 - Final Output")
    log_info("=" * 80)
    for field, label in tracked_fields.items():
        if field in field_to_cell_mapping:
            cell = field_to_cell_mapping[field]
            value = cell_values.get(cell, "NOT IN OUTPUT")
            status = "✓" if value not in (0, "", None, "NOT IN OUTPUT") else "✗"
            log_info(f"  {status} {label}: Cell {cell} = {value}")
        else:
            log_info(f"  ✗ {label}: NOT MAPPED (no cell)")
    
    log_info("\n" + "=" * 80)
    log_info("✓ EXTRACTION COMPLETE")
    log_info("=" * 80)
    
    return cell_values