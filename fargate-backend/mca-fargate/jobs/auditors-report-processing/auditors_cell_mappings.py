from services.bedrock_mapping_service import cell_mapping_using_bedrock

"""
Cell mappings for Auditors Report Excel template
This module maps JSON data to Excel cell addresses for the Auditors Report
"""

def flatten_json(extracted_data: dict) -> dict:
    out = {}

    def flatten(x, name=''):
        if type(x) is dict:
            for a in x:
                flatten(x[a], name + a + '.')
        elif type(x) is list:
            i = 0
            for a in x:
                flatten(a, name + str(i) + '.')
                i += 1
        else:
            out[name[:-1]] = x

    flatten(extracted_data)
    return out

def prepare_auditors_cell_mappings(financial_data: dict , template_data: dict) -> dict:
    """
    Prepare cell mappings for Directors Report Excel template.
    
    Args:
        financial_data: Dictionary containing the financial data from JSON
    
    Returns:
        Dictionary mapping cell addresses to values
        Format: {"A1": "value", "B2": 123, ...}
    """
    
    # Extract nested data for easier access
    extracted_fields = financial_data.get("extracted_fields", {})
    cell_mappings = cell_mapping_using_bedrock(extracted_fields, template_data, False)
    return cell_mappings