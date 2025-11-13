import zipfile
from io import BytesIO
from lxml import etree
import logging

logger = logging.getLogger()

EXCEL_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
NS_MAP = {None: EXCEL_NS}

def modify_excel_xml_byte_perfect(excel_bytes, cell_mappings, cells_to_skip_if_zero=None):
    """
    Modify Excel file by directly manipulating XML while preserving EVERYTHING else.
    Only changes cell values, leaves all formatting, formulas, features intact.
    
    Args:
        excel_bytes: Original Excel file as bytes
        cell_mappings: Dict of cell addresses to new values
        cells_to_skip_if_zero: List of cells that should be cleared if value is 0
    
    Returns:
        Modified Excel file as bytes
    """
    if cells_to_skip_if_zero is None:
        cells_to_skip_if_zero = []
    
    # Load template as ZIP
    template_zip = BytesIO(excel_bytes)
    output_zip = BytesIO()
    
    with zipfile.ZipFile(template_zip, 'r') as template_zip_file:
        with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as output_zip_file:
            
            # Process each file in the ZIP
            for item in template_zip_file.infolist():
                file_data = template_zip_file.read(item.filename)
                
                # Check if this is a worksheet XML file
                if item.filename.startswith('xl/worksheets/') and item.filename.endswith('.xml'):
                    logger.info(f"Processing worksheet: {item.filename}")
                    
                    # Modify worksheet XML with cell values
                    modified_xml = modify_worksheet_xml(file_data, cell_mappings, cells_to_skip_if_zero, item.filename)
                    output_zip_file.writestr(item, modified_xml)
                    
                else:
                    # Copy all other files as-is (preserves everything: styles, sharedStrings, charts, etc.)
                    output_zip_file.writestr(item, file_data)
    
    output_zip.seek(0)
    return output_zip.getvalue()


def modify_worksheet_xml(xml_bytes, cell_mappings, cells_to_skip_if_zero, filename):
    """
    Modify worksheet XML by changing only cell values.
    Preserves EVERYTHING else: formatting, formulas, dimensions, page setup, etc.
    
    Args:
        xml_bytes: Original worksheet XML as bytes
        cell_mappings: Dict of cell addresses to new values
        cells_to_skip_if_zero: List of cells to clear if value is 0
        filename: Worksheet filename for logging
    
    Returns:
        Modified XML as bytes
    """
    # Use lxml parser that preserves whitespace and structure
    parser = etree.XMLParser(remove_blank_text=False, strip_cdata=False)
    tree = etree.fromstring(xml_bytes, parser)
    
    ns = {'x': EXCEL_NS}
    ns_prefix = '{%s}' % EXCEL_NS
    
    # Get all existing cells in the worksheet
    existing_cells = {}
    for cell in tree.xpath('//x:c', namespaces=ns):
        cell_ref = cell.get('r')
        if cell_ref:
            existing_cells[cell_ref] = cell
    
    cells_modified = 0
    cells_skipped = 0
    
    # Modify each cell
    for cell_address, new_value in cell_mappings.items():
        # Check if we should skip this cell if value is 0
        if cell_address in cells_to_skip_if_zero:
            try:
                numeric_value = float(new_value) if isinstance(new_value, (int, float, str)) and str(new_value).replace('.', '', 1).replace('-', '', 1).isdigit() else None
                if numeric_value is not None and numeric_value == 0:
                    # Skip this cell (don't fill it)
                    cells_skipped += 1
                    logger.info(f"Skipping cell {cell_address} because value is 0")
                    continue
            except (ValueError, TypeError):
                pass  # Not a numeric value, proceed normally
        
        if cell_address in existing_cells:
            cell = existing_cells[cell_address]
            
            # Check if cell has a formula
            formula = cell.find(f'{ns_prefix}f')
            if formula is not None:
                logger.info(f"Skipping {cell_address} - contains formula")
                continue
            
            # Get or create value element
            v_elem = cell.find(f'{ns_prefix}v')
            is_elem = cell.find(f'{ns_prefix}is')
            
            # Determine if we should use inline string or regular value
            cell_type = cell.get('t', '')
            
            if isinstance(new_value, str) and not new_value.replace('.', '', 1).replace('-', '', 1).isdigit():
                # String value - use inline string
                if v_elem is not None:
                    cell.remove(v_elem)
                if is_elem is not None:
                    cell.remove(is_elem)
                
                cell.set('t', 'inlineStr')
                is_elem = etree.SubElement(cell, f'{ns_prefix}is')
                t_elem = etree.SubElement(is_elem, f'{ns_prefix}t')
                t_elem.text = str(new_value)
                
            else:
                # Numeric or date value - use regular value
                if is_elem is not None:
                    cell.remove(is_elem)
                
                if v_elem is None:
                    v_elem = etree.SubElement(cell, f'{ns_prefix}v')
                
                v_elem.text = str(new_value)
                
                # Remove string type if it was set
                if cell_type == 's' or cell_type == 'inlineStr':
                    del cell.attrib['t']
            
            cells_modified += 1
            
        # else:
        #     # logger.warning(f"Cell {cell_address} not found in {filename}")
    
    logger.info(f"Modified {cells_modified} cells, skipped {cells_skipped} cells in {filename}")
    
    # Serialize back to bytes with exact formatting preservation
    output = etree.tostring(
        tree,
        xml_declaration=True,
        encoding='UTF-8',
        pretty_print=False  # Critical: preserves exact whitespace
    )
    
    return output
