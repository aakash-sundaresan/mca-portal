// src/components/StatusMessage.jsx
import React from 'react';

export default function StatusMessage({ message }) {
  if (!message.text) return null;

  const bgColors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  return (
    <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-lg border-2 shadow-lg animate-slide-in max-w-md ${bgColors[message.type]}`}>
      <p className="font-semibold">{message.text}</p>
    </div>
  );
}