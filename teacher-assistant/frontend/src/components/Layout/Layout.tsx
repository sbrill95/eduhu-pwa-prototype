import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Navigation from './Navigation';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 pb-16 md:pb-0">
        {children || <Outlet />}
      </main>

      {/* Bottom Navigation (Mobile) / Side Navigation (Desktop) */}
      <Navigation />
    </div>
  );
};

export default Layout;