// src/components/ValueDisplay.jsx
import React from 'react';

export default function ValueDisplay({ value, type }) {
  if (value === null || value === undefined) {
    return <span className="text-gray-400 italic">null</span>;
  }

  if (type === 'empty-array' || type === 'empty-object') {
    return <span className="text-gray-400 italic">{String(value)}</span>;
  }

  if (type === 'array-summary') {
    return (
      <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded text-xs font-mono border border-orange-200 font-semibold">
        {String(value)}
      </span>
    );
  }

  if (type === 'boolean') {
    return (
      <span className="inline-block px-3 py-1 bg-pink-100 text-pink-700 rounded text-xs font-bold uppercase tracking-wide">
        {String(value)}
      </span>
    );
  }

  if (type === 'number') {
    return (
      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-mono font-bold">
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
          className="inline-block px-3 py-1 bg-blue-100 text-blue-600 rounded text-xs border border-blue-200 hover:bg-blue-200 transition-colors underline"
        >
          {strValue}
        </a>
      );
    }
    
    // Check if it's a date
    if (strValue.match(/^\d{4}-\d{2}-\d{2}/)) {
      return (
        <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded text-xs font-mono">
          {strValue}
        </span>
      );
    }
    
    // Regular string
    return (
      <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded text-xs font-mono">
        "{strValue}"
      </span>
    );
  }

  return <span className="text-gray-700">{String(value)}</span>;
}