"""
Field definitions for Directors' Report extraction
"""

def get_extraction_prompt():
    """Generate the extraction prompt with field descriptions"""
    return """
Extract the following fields from the Directors' Report document and return as JSON:

{
  "web_address_annual_return": "Web address where annual return (section 92) has been placed",
  
  "directors_responsibility_statement": "Directors' Responsibility Statement (mandatory field marked with *)",
  
  "frauds_reported_by_auditors": "Details of frauds reported by auditors under section 143(12) other than those reportable to Central Government (mandatory field marked with *)",
  
  "independent_directors_declaration": "Disclosure of statement on declaration given by Independent Directors under section 149(6)",
  
  "directors_appointment_and_remuneration_disclosure": "Disclosure for Companies under section 178(1) on Directors appointment and remuneration including section 178(3) matters",
  
  "transaction_not_reportable_details": "Brief details as to why transaction is not reportable",
  
  "state_of_company_affairs": "Description of state of company's affairs (mandatory field marked with *)",
  
  "amounts_proposed_to_reserves": {
    "description": "Brief description of reserves",
    "amount_inr": "Amount in INR (as number)"
  },
  
  "dividend_recommendation": {
    "description": "Brief description of dividend",
    "amount_inr": "Amount in INR (as number)"
  },
  
  "material_changes_after_fy_end": "Details of material changes and commitments between end of FY and date of report affecting financial position (mandatory field marked with *)",
  
  "risk_management_policy": "Statement on development and implementation of risk management policy (mandatory field marked with *)",
  
  "rule_8_disclosures": {
    "technology_absorption": "Details regarding technology absorption per Rule 8(3)(B) (mandatory field marked with *)",
    "energy_conservation": "Details regarding energy conservation per Rule 8(3)(A) (mandatory field marked with *)",
    "foreign_exchange_earnings_outgo": "Details regarding foreign exchange earnings and outgo per Rule 8(3)(C) (mandatory field marked with *)"
  },
  
  "rule_8_5_disclosures": {
    "independent_directors_opinion": "Board opinion on integrity, expertise and experience of independent directors appointed during year",
    "internal_financial_controls": "Details of adequacy of internal financial controls with reference to Financial Statements",
    "cost_records_maintenance": "Whether cost records under section 148(1) are required and maintained by the Company",
    "insolvency_bankruptcy_proceedings": "Details of applications or proceedings under Insolvency and Bankruptcy Code, 2016 during the year",
    "one_time_settlement_valuation_difference": "Details of valuation difference between one-time settlement and loan taking from Banks/Financial Institutions",
    "financial_summary": "Disclosure of financial summary or highlights (mandatory field marked with *)",
    "change_in_business_nature": "Disclosure of change in nature of business (mandatory field marked with *)",
    "directors_kmp_changes": "Details of directors or key managerial personnel appointed or resigned during year (mandatory field marked with *)"
  },
  
  "deposits_disclosures": {
    "deposits_accepted_during_year": "Amount as number",
    "deposits_unpaid_unclaimed_end_year": "Amount as number",
    "default_amount_beginning_year": "Amount as number",
    "max_default_amount_during_year": "Amount as number",
    "default_amount_end_year": "Amount as number",
    "default_cases_beginning_year": "Count as integer",
    "max_default_cases_during_year": "Count as integer",
    "default_cases_end_year": "Count as integer",
    "non_compliant_deposits": "Details of deposits not in compliance with Chapter V"
  },
  
  "regulatory_orders": "Details of significant material orders by regulators/courts/tribunals impacting going concern (mandatory field marked with *)",
  
  "board_evaluation": "Statement on manner of formal annual evaluation by Board of its performance, committees and individual directors",
  
  "statutory_compliance": {
    "sexual_harassment_compliance": {
      "compliance_statement": "Statement on compliance with Sexual Harassment of Women at Workplace Act, 2013",
      "complaints_received": "Number as integer",
      "complaints_disposed": "Number as integer",
      "complaints_pending_beyond_90_days": "Number as integer"
    },
    "maternity_benefit_compliance": "Statement on compliance with Maternity Benefit Act"
  },
  
  "employee_count": {
    "female": "Count as integer",
    "male": "Count as integer",
    "transgender": "Count as integer"
  },
  
  "other_matters": {
    "count": "Number of other matters (integer)",
    "matters": [
      {
        "heading": "Heading for the matter",
        "section_reference": "Reference to section/rule to which it pertains",
        "description": "Brief description of the matter"
      }
    ]
  },
  
  "signature_section": {
    "designation": "Designation (Director/Liquidator/IRP/RP)",
    "identification_number": "DIN or PAN of the signatory"
  }
}

IMPORTANT INSTRUCTIONS:
1. Extract ONLY information explicitly present in the document
2. For missing fields, use null
3. For numerical fields (amounts, counts), use numbers not strings
4. For amounts in rupees, extract as plain numbers (e.g., 50000000 not "50 Crores")
5. Return ONLY valid JSON without markdown formatting
6. Maintain exact field names as shown above
"""