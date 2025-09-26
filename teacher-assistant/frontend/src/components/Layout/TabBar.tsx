import React from 'react';

interface TabBarProps {
  activeTab: 'home' | 'chat' | 'library';
  onTabChange: (tab: 'home' | 'chat' | 'library') => void;
  onNewChat?: () => void;
}

const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange, onNewChat }) => {
  const tabs = [
    {
      id: 'home' as const,
      label: 'Home',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      id: 'chat' as const,
      label: 'Chat',
      icon: (
        <div className="relative">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        </div>
      ),
      isSpecial: true,
    },
    {
      id: 'library' as const,
      label: 'Library',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      ),
    },
  ];

  const handleTabClick = (tabId: 'home' | 'chat' | 'library') => {
    if (tabId === 'chat') {
      if (activeTab === 'chat' && onNewChat) {
        // If already on chat tab, trigger new chat
        onNewChat();
      } else {
        // Otherwise just switch to chat tab
        onTabChange(tabId);
      }
    } else {
      onTabChange(tabId);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2 z-40 h-16">
      <div className="flex justify-around items-center h-full">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isChat = tab.id === 'chat';

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab.id)}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors min-w-[60px] ${
                isActive
                  ? 'text-primary-500 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              } ${isChat ? 'relative' : ''}`}
              aria-label={`${tab.label} ${isChat ? '(New Chat)' : ''}`}
            >
              <div className={`${isChat && isActive ? 'animate-pulse' : ''}`}>
                {tab.icon}
              </div>
              <span className="text-xs mt-1 font-medium">{tab.label}</span>
              {isChat && isActive && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-primary-500 rounded-full animate-ping"></div>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default TabBar;