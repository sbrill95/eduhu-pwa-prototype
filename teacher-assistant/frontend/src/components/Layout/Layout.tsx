import React from 'react';
import Header from './Header';
import TabBar from './TabBar';

interface LayoutProps {
  children?: React.ReactNode;
  activeTab: 'home' | 'chat' | 'library';
  onTabChange: (tab: 'home' | 'chat' | 'library') => void;
  onNewChat?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, onNewChat }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Fixed Header */}
      <Header />

      {/* Main Content Area - with padding for fixed header and bottom tab bar */}
      <main className="flex-1 pt-16 pb-20 overflow-y-auto">
        {children}
      </main>

      {/* Fixed Bottom Tab Bar */}
      <TabBar activeTab={activeTab} onTabChange={onTabChange} onNewChat={onNewChat} />
    </div>
  );
};

export default Layout;