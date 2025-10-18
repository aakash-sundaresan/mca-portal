// src/utils/helpers.js

export function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  // Export the cleaning function
  export function cleanFieldPath(path) {
    if (!path) return path;
    
    return String(path)
      .replace(/^extracted_fields\./gi, '')
      .replace(/^metadata\./gi, '')
      .replace(/^data\./gi, '')
      .replace(/^fields\./gi, '')
      .replace(/^document\./gi, '')
      .replace(/^extracted_fields_/gi, '')
      .replace(/^metadata_/gi, '')
      .replace(/^data_/gi, '')
      .replace(/^fields_/gi, '')
      .replace(/^document_/gi, '')
      .replace(/\.Current Year$/gi, '')
      .replace(/\.current year$/gi, '')
      .replace(/ Current Year$/gi, '')
      .replace(/ current year$/gi, '');
  }

  // Group flattened data into hierarchical structure while preserving order
  export function groupByHierarchy(flatData) {
    const grouped = {};
    const orderMap = {}; // Track the first occurrence order of each group
    let orderCounter = 0;
    
    flatData.forEach(item => {
      const parts = item.path.split('.');
      
      if (parts.length === 1) {
        // Top-level field
        if (!grouped['_root']) {
          grouped['_root'] = [];
          orderMap['_root'] = orderCounter++;
        }
        grouped['_root'].push(item);
      } else {
        // Nested field - use all parts except the last as the group key
        const groupPath = parts.slice(0, -1).join('.');
        if (!grouped[groupPath]) {
          grouped[groupPath] = [];
          orderMap[groupPath] = orderCounter++;
        }
        
        // Store only the final part as the display name
        grouped[groupPath].push({
          ...item,
          displayName: parts[parts.length - 1]
        });
      }
    });
    
    // Return both the grouped data and the order map
    return { grouped, orderMap };
  }
  
  export function flattenJson(obj, prefix = '', result = []) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];
        
        // Clean up the field path
        const cleanKey = cleanFieldPath(newKey);
        
        if (value === null || value === undefined) {
          result.push({ path: cleanKey, value: value, type: 'null' });
        } else if (Array.isArray(value)) {
          if (value.length === 0) {
            result.push({ path: cleanKey, value: '[]', type: 'empty-array' });
          } else {
            result.push({ path: cleanKey, value: `Array(${value.length})`, type: 'array-summary' });
            value.forEach((item, index) => {
              if (typeof item === 'object' && item !== null) {
                flattenJson(item, `${newKey}[${index}]`, result);
              } else {
                result.push({ path: cleanFieldPath(`${newKey}[${index}]`), value: item, type: typeof item });
              }
            });
          }
        } else if (typeof value === 'object') {
          if (Object.keys(value).length === 0) {
            result.push({ path: cleanKey, value: '{}', type: 'empty-object' });
          } else {
            flattenJson(value, newKey, result);
          }
        } else {
          result.push({ path: cleanKey, value: value, type: typeof value });
        }
      }
    }
    return result;
  }