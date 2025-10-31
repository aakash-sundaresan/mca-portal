// src/components/Header.js - Updated to display name

import React from 'react';

export default function Header({ user, onSignOut }) {
  // Get the best display name available
  const getDisplayName = () => {
    // Priority order:
    // 1. name attribute (what we're collecting in sign-up)
    // 2. given_name + family_name
    // 3. email username part
    // 4. email full
    
    if (user?.attributes?.name) {
      return user.attributes.name;
    }
    
    if (user?.attributes?.given_name) {
      const firstName = user.attributes.given_name;
      const lastName = user.attributes?.family_name || '';
      return `${firstName} ${lastName}`.trim();
    }
    
    if (user?.attributes?.email) {
      // Extract name from email (e.g., john.doe@example.com -> john.doe)
      const emailUsername = user.attributes.email.split('@')[0];
      return emailUsername.replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    return 'User';
  };

  const displayName = getDisplayName();
  const email = user?.attributes?.email;

  return (
    <div className="bg-white shadow">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              MCA Portal
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Document Processing System
            </p>
          </div>
          
          {user && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {displayName}
                </p>
                {email && (
                  <p className="text-xs text-gray-500">
                    {email}
                  </p>
                )}
              </div>
              <button
                onClick={onSignOut}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}