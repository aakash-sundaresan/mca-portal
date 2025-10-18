// src/components/JsonTableView.jsx
import React from 'react';
import ValueDisplay from './ValueDisplay';
import { groupByHierarchy } from '../utils/helpers';

export default function JsonTableView({ data }) {
  if (data.length === 0) {
    return (
      <div className="p-12 text-center text-gray-500">
        No data to display
      </div>
    );
  }

  const { grouped: groupedData, orderMap } = groupByHierarchy(data);
  
  // Sort by original order instead of alphabetically
  const groupKeys = Object.keys(groupedData).sort((a, b) => orderMap[a] - orderMap[b]);
  
  // Separate root items from grouped items
  const rootItems = groupedData['_root'] || [];
  const nestedGroups = groupKeys.filter(key => key !== '_root');

  let itemCounter = 0;
  const renderedHeaders = new Set();

  const renderHeaderIfNeeded = (headerPath, level, pathParts) => {
    if (renderedHeaders.has(headerPath)) {
      return null;
    }
    
    renderedHeaders.add(headerPath);
    const part = pathParts[level];
    const isMainHeader = level === 0;
    const isSubHeader = level === 1;
    const isDeepHeader = level > 1;
    
    return (
      <tr key={`header-${headerPath}`} className="border-b border-gray-700">
        <td colSpan="3" className={`px-5 py-3 font-bold uppercase tracking-wide
          ${isMainHeader ? 'bg-gradient-to-r from-yellow-600 to-amber-700 text-white text-base pl-5' : ''}
          ${isSubHeader ? 'bg-gradient-to-r from-yellow-500/40 to-amber-600/40 text-yellow-200 text-sm pl-10' : ''}
          ${isDeepHeader ? 'bg-gradient-to-r from-yellow-500/20 to-amber-600/20 text-yellow-300 text-xs' : ''}
        `}
        style={isDeepHeader ? { paddingLeft: `${15 + level * 12}px` } : {}}>
          {part}
        </td>
      </tr>
    );
  };

  return (
    <div>
      <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-6 py-4 font-bold text-sm">
        Total fields: {data.length}
      </div>
      
      <table className="w-full">
        <thead className="bg-gradient-to-r from-yellow-400 to-amber-500 sticky top-0 z-10">
          <tr>
            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider w-16 text-black">#</th>
            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">Field Path</th>
            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-black">Value</th>
          </tr>
        </thead>
        <tbody>
          {/* Root level items */}
          {rootItems.map((item) => {
            itemCounter++;
            return (
              <tr 
                key={`root-${itemCounter}`}
                className="border-b border-gray-800 hover:bg-yellow-500/5 transition-colors"
              >
                <td className="px-5 py-3 text-center font-mono text-sm text-yellow-400 font-bold bg-gray-900/50">
                  {itemCounter}
                </td>
                <td className="px-5 py-3 bg-gray-900/30">
                  <code className="inline-block px-3 py-2 bg-black/50 text-yellow-300 rounded text-xs font-mono border border-yellow-500/30">
                    {item.path}
                  </code>
                </td>
                <td className="px-5 py-3 text-gray-300">
                  <ValueDisplay value={item.value} type={item.type} />
                </td>
              </tr>
            );
          })}

          {/* Grouped items */}
          {nestedGroups.map((groupKey) => {
            const items = groupedData[groupKey];
            const pathParts = groupKey.split('.');
            
            return (
              <React.Fragment key={groupKey}>
                {/* Render headers for each level of the hierarchy (only once) */}
                {pathParts.map((part, level) => {
                  const headerPath = pathParts.slice(0, level + 1).join('.');
                  return renderHeaderIfNeeded(headerPath, level, pathParts);
                })}

                {/* Render items in this group */}
                {items.map((item) => {
                  itemCounter++;
                  const indentLevel = pathParts.length;
                  const paddingLeft = 5 + (indentLevel * 4);
                  
                  return (
                    <tr 
                      key={`item-${itemCounter}`}
                      className="border-b border-gray-800 hover:bg-yellow-500/5 transition-colors"
                    >
                      <td className="px-5 py-3 text-center font-mono text-sm text-yellow-400 font-bold bg-gray-900/50">
                        {itemCounter}
                      </td>
                      <td className={`py-3 bg-gray-900/30`} style={{ paddingLeft: `${paddingLeft * 4}px` }}>
                        <code className="inline-block px-3 py-2 bg-black/50 text-yellow-300 rounded text-xs font-mono border border-yellow-500/30">
                          {item.displayName || item.path}
                        </code>
                      </td>
                      <td className="px-5 py-3 text-gray-300">
                        <ValueDisplay value={item.value} type={item.type} />
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}