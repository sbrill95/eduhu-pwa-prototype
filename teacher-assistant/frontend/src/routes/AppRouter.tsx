import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../lib/auth-context';
import { ProtectedRoute } from '../components';
// import { Layout } from '../components/Layout'; // DISABLED: Layout component was deleted, this file is unused anyway
import Home from '../pages/Home';
import Chat from '../pages/Chat';
import Library from '../pages/Library';

type ActiveTab = 'home' | 'chat' | 'library';

// Note: This AppRouter is kept for compatibility but is not used in the current mobile-first implementation
// The main App.tsx now handles state management directly
const AppRouter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
  };

  const handleNewChat = () => {
    setActiveTab('chat');
  };

  return (
    <AuthProvider>
      <Router>
        <ProtectedRoute>
          {/* Layout component disabled - this file is unused */}
          <div>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/library" element={<Library />} />
              {/* Redirect unknown routes to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </ProtectedRoute>
      </Router>
    </AuthProvider>
  );
};

export default AppRouter;