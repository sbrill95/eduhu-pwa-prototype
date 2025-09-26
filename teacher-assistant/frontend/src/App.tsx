import React, { useState } from 'react';
import { AuthProvider } from './lib/auth-context';
import { ProtectedRoute } from './components';
import { Layout } from './components/Layout';
import { HomeView, ChatView, LibraryView } from './components';

type ActiveTab = 'home' | 'chat' | 'library';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
  };

  const handleNewChat = () => {
    // For now, just ensure we're on the chat tab
    // In the future, this could clear the chat or create a new chat session
    setActiveTab('chat');
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'home':
        return <HomeView />;
      case 'chat':
        return <ChatView onNewChat={handleNewChat} />;
      case 'library':
        return <LibraryView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <AuthProvider>
      <ProtectedRoute>
        <Layout
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onNewChat={handleNewChat}
        >
          {renderActiveView()}
        </Layout>
      </ProtectedRoute>
    </AuthProvider>
  );
};

export default App;
