import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center justify-between">
        {/* Left side - Home Icon */}
        <button
          type="button"
          className="p-2 text-gray-600 hover:text-primary-500 rounded-lg hover:bg-primary-50 transition-colors"
          aria-label="Home"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        </button>

        {/* Center - Brand/Title */}
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center mr-2">
            <span className="text-white font-bold text-sm">TA</span>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">
            Teacher Assistant
          </h1>
        </div>

        {/* Right side - Profile Icon */}
        <button
          type="button"
          className="p-2 text-gray-600 hover:text-primary-500 rounded-lg hover:bg-primary-50 transition-colors"
          aria-label="Profile"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;