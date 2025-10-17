// src/components/JsonTableView.jsx
import React from 'react';
import ValueDisplay from './ValueDisplay';

export default function JsonTableView({ data }) {
  if (data.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No data to display
      </div>
    );
  }

  return (
    <div>
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-3 font-semibold">
        Total fields: {data.length}
      </div>
      <table className="w-full">
        <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white sticky top-0">
          <tr>
            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider w-16">#</th>
            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider">Field Path</th>
            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider">Value</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr 
              key={index} 
              className="border-b border-gray-100 hover:bg-indigo-50 transition-colors"
            >
              <td className="px-5 py-3 text-center font-mono text-sm text-indigo-600 font-semibold bg-indigo-50">
                {index + 1}
              </td>
              <td className="px-5 py-3 bg-blue-50">
                <code className="inline-block px-3 py-1.5 bg-blue-100 text-blue-800 rounded text-xs font-mono border border-blue-200">
                  {item.path}
                </code>
              </td>
              <td className="px-5 py-3">
                <ValueDisplay value={item.value} type={item.type} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}