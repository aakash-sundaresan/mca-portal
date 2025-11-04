// src/components/Header.js - Professional UI with Dark Mode Toggle

import React from 'react';
import { Sun, Moon, LogOut } from 'lucide-react';

export default function Header({ user, onSignOut, isDarkMode, onToggleTheme }) {
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

  // Get initials for avatar
  const getInitials = () => {
    const name = getDisplayName();
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 transition-colors duration-300">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-5">
          {/* Left: Logo and Title */}
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 shadow-lg">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                MCA Portal
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Document Processing System
              </p>
            </div>
          </div>
          
          {/* Right: User Info and Actions */}
          {user && (
            <div className="flex items-center gap-3">
              {/* Theme Toggle Button */}
              <button
                onClick={onToggleTheme}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-300 group shadow-sm hover:shadow-md"
                aria-label="Toggle theme"
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-amber-500 group-hover:rotate-180 transition-transform duration-500" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-600 group-hover:text-slate-800 group-hover:-rotate-12 transition-all duration-300" />
                )}
              </button>

              {/* User Info Card */}
              <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                {/* Avatar */}
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 text-white font-semibold text-sm shadow-sm">
                  {getInitials()}
                </div>
                
                {/* User Details */}
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {displayName}
                  </p>
                  {email && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {email}
                    </p>
                  )}
                </div>
              </div>

              {/* Sign Out Button */}
              <button
                onClick={onSignOut}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 dark:from-red-500 dark:to-red-600 text-white text-sm font-semibold rounded-xl hover:from-red-700 hover:to-red-800 dark:hover:from-red-600 dark:hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-slate-800 transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}