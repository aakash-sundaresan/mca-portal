// src/components/ValueDisplay.jsx
import React from 'react';

export default function ValueDisplay({ value, type }) {
  if (value === null || value === undefined) {
    return <span className="text-gray-600 italic">null</span>;
  }

  if (type === 'empty-array' || type === 'empty-object') {
    return <span className="text-gray-600 italic">{String(value)}</span>;
  }

  if (type === 'array-summary') {
    return (
      <span className="inline-block px-3 py-1 bg-orange-500/20 text-orange-400 rounded text-xs font-mono border border-orange-500/30 font-semibold">
        {String(value)}
      </span>
    );
  }

  if (type === 'boolean') {
    return (
      <span className="inline-block px-3 py-1 bg-pink-500/20 text-pink-400 rounded text-xs font-bold uppercase tracking-wide border border-pink-500/30">
        {String(value)}
      </span>
    );
  }

  if (type === 'number') {
    return (
      <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-mono font-bold border border-blue-500/30">
        {value}
      </span>
    );
  }

  if (type === 'string') {
    const strValue = String(value);
    
    // Check if it's a URL
    if (strValue.match(/^https?:\/\//)) {
      return (
        
          <a href={strValue}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-xs border border-blue-500/30 hover:bg-blue-500/30 transition-colors underline"
>
{strValue}
</a>
);
}
// Check if it's a date
if (strValue.match(/^\d{4}-\d{2}-\d{2}/)) {
    return (
      <span className="inline-block px-3 py-1 bg-purple-500/20 text-purple-400 rounded text-xs font-mono border border-purple-500/30">
        {strValue}
      </span>
    );
  }
  
  // Regular string
  return (
    <span className="inline-block px-3 py-1 bg-green-500/20 text-green-400 rounded text-xs font-mono border border-green-500/30">
      "{strValue}"
    </span>
  );
}
return <span className="text-gray-400">{String(value)}</span>;
}