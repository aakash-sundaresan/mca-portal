// src/utils/helpers.js

export function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  export function flattenJson(obj, prefix = '', result = []) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];
        
        // Clean up the field path by removing common metadata prefixes
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
  
  // Helper function to clean field paths
  function cleanFieldPath(path) {
    // Remove common metadata prefixes like "extracted_fields.", "metadata.", etc.
    return path
      .replace(/^extracted_fields\./gi, '')
      .replace(/^metadata\./gi, '')
      .replace(/^data\./gi, '')
      .replace(/^fields\./gi, '')
      .replace(/^document\./gi, '');
  }