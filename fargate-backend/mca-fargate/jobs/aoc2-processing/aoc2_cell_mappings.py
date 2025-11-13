"""
Cell mappings for AOC4 Excel template
Maps JSON data to Excel cell addresses for AOC-4 financial statements
"""

from services.bedrock_extraction_service_unified import cell_mapping_using_bedrock
from utils.logger import log_info


def flatten_json(extracted_data: dict) -> dict:
    """Flatten nested JSON for easier access"""
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


def prepare_aoc4_cell_mappings(financial_data: dict, template_data: dict) -> dict:
    """
    Prepare cell mappings for AOC-4 Excel template.
    
    Args:
        financial_data: Dictionary containing the financial data from JSON
        template_data: Template cell information {cell: (value, is_protected)}
    
    Returns:
        Dictionary mapping cell addresses to values
        Format: {"A1": "value", "B2": 123, ...}
    """
    log_info("Preparing AOC-4 cell mappings using Bedrock...")
    
    # Extract nested data for easier access
    extracted_fields = financial_data.get("extracted_fields", financial_data)
    
    # Call Bedrock mapping service with is_aoc4=True (this is AOC4)
    cell_mappings = cell_mapping_using_bedrock(
        extracted_fields=extracted_fields,
        template_data=template_data,
        is_aoc4=True
    )
    
    log_info(f"AOC-2 cell mappings prepared: {len(cell_mappings)} cells")
    
    return cell_mappings