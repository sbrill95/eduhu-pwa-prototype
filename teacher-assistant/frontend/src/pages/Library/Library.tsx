import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../lib/auth-context';
import db from '../../lib/instantdb';
import useLibraryMaterials from '../../hooks/useLibraryMaterials';
import { formatRelativeDate } from '../../lib/formatRelativeDate';

interface ChatHistoryItem {
  id: string;
  title: string;
  messages: number;
  lastMessage: string;
  dateCreated: Date;
  dateModified: Date;
  tags?: string[];
}

interface ArtifactItem {
  id: string;
  title: string;
  type: 'document' | 'image' | 'worksheet' | 'quiz' | 'lesson_plan';
  description: string;
  dateCreated: Date;
  source: 'chat_generated' | 'uploaded' | 'manual';
  chatId?: string;
  size?: string;
}

type LibraryItem = ChatHistoryItem | ArtifactItem;

interface LibraryProps {
  onChatSelect?: (sessionId: string) => void;
  onTabChange?: (tab: 'home' | 'chat' | 'library') => void;
}

const Library: React.FC<LibraryProps> = ({ onChatSelect, onTabChange }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'chats' | 'artifacts'>('chats');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'document' | 'image' | 'worksheet' | 'quiz' | 'lesson_plan'>('all');

  // Get chat sessions from InstantDB with messages for lastMessage display
  const { data: chatData } = db.useQuery(
    user ? {
      chat_sessions: {
        $: {
          where: { user_id: user.id },
          order: { serverCreatedAt: 'desc' }
        },
        messages: {} // Include messages relation to get last message
      }
    } : null
  );

  // Get library materials
  const { materials } = useLibraryMaterials();

  // Track which chats are currently extracting tags to prevent duplicate requests
  const [extractingTags, setExtractingTags] = useState<Set<string>>(new Set());

  // Auto-extract tags for chats that don't have any
  const autoExtractTags = useCallback(async (chatId: string) => {
    // Skip if already extracting tags for this chat
    if (extractingTags.has(chatId)) return;

    setExtractingTags((prev) => new Set(prev).add(chatId));

    try {
      const response = await fetch(`/api/chat/${chatId}/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ forceRegenerate: false }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`Tags extracted for chat ${chatId}:`, data.data?.tags || []);
        // Tags will be automatically reflected in the next InstantDB query
      } else {
        console.error(`Failed to extract tags for chat ${chatId}:`, data.error);
      }
    } catch (err) {
      console.error(`Error extracting tags for chat ${chatId}:`, err);
    } finally {
      setExtractingTags((prev) => {
        const next = new Set(prev);
        next.delete(chatId);
        return next;
      });
    }
  }, [extractingTags]);

  // Listen for navigation events from Homepage
  useEffect(() => {
    const handleLibraryNav = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('[Library] Received navigate-library-tab event:', customEvent.detail);

      if (customEvent.detail?.tab === 'materials') {
        setSelectedTab('artifacts'); // 'artifacts' is the materials tab
      }
    };

    window.addEventListener('navigate-library-tab', handleLibraryNav);

    return () => {
      window.removeEventListener('navigate-library-tab', handleLibraryNav);
    };
  }, []);

  // DISABLED BUG-009: Auto-tag extraction - backend routes not registered
  // This feature requires /api/chat/:chatId/tags route to be registered in Express app.ts
  // Currently causes infinite 404 loop and "Maximum update depth exceeded" error
  // TODO: Register chatTags routes in backend before re-enabling
  /*
  useEffect(() => {
    if (!chatData?.chat_sessions || selectedTab !== 'chats') return;

    // Find chats without tags (limit to first 3 to avoid overwhelming the API)
    const chatsWithoutTags = (chatData.chat_sessions || [])
      .filter((session: any) => !session.tags || session.tags === '[]' || session.tags === '')
      .slice(0, 3); // Only process first 3 chats per load

    if (chatsWithoutTags.length > 0) {
      console.log(`Auto-extracting tags for ${chatsWithoutTags.length} chats without tags`);
      chatsWithoutTags.forEach((session: any) => {
        autoExtractTags(session.id);
      });
    }
  }, [chatData?.chat_sessions, selectedTab, autoExtractTags]);
  */

  // Map chat_sessions to ChatHistoryItem format
  const chatHistory: ChatHistoryItem[] = (chatData?.chat_sessions || []).map((session: any) => {
    // Parse tags from JSON string stored in InstantDB
    let parsedTags: string[] = [];
    if (session.tags) {
      try {
        const tagsData = typeof session.tags === 'string' ? JSON.parse(session.tags) : session.tags;
        // Tags are stored as ChatTag[] objects with label and category
        // Extract just the labels for display
        parsedTags = Array.isArray(tagsData)
          ? tagsData.map((tag: any) => typeof tag === 'string' ? tag : tag.label || tag)
          : [];
      } catch (err) {
        console.error('Error parsing chat tags:', err);
        parsedTags = [];
      }
    }

    // Get messages array from session (sorted by timestamp descending to get most recent)
    const sessionMessages = session.messages || [];
    const sortedMessages = [...sessionMessages].sort((a: any, b: any) => b.timestamp - a.timestamp);

    // Extract last message content (skip system/agent messages, show only user/assistant content)
    const lastMsg = sortedMessages.find((msg: any) =>
      msg.role === 'user' || msg.role === 'assistant'
    )?.content || '';

    // Truncate lastMessage to 50 chars with ellipsis
    const truncatedLastMessage = lastMsg.length > 50
      ? lastMsg.substring(0, 50) + '...'
      : lastMsg;

    return {
      id: session.id,
      title: session.title || 'Neuer Chat', // Use 'title' field (same as Home.tsx)
      messages: sessionMessages.length, // Actual message count
      lastMessage: truncatedLastMessage, // Proper last message from chat
      dateCreated: new Date(session.created_at),
      dateModified: new Date(session.updated_at),
      tags: parsedTags
    };
  });

  // Map materials to ArtifactItem format
  const artifacts: ArtifactItem[] = materials.map((material: any) => ({
    id: material.id,
    title: material.title,
    type: material.type || 'document',
    description: material.content || material.description || '',
    dateCreated: new Date(material.created_at),
    source: 'chat_generated' as const,
    chatId: material.chat_session_id,
    size: undefined
  }));

  const artifactTypes = [
    { key: 'all', label: 'Alle', icon: '📁' },
    { key: 'document', label: 'Dokumente', icon: '📄' },
    { key: 'image', label: 'Bilder', icon: '🖼️' },
    { key: 'worksheet', label: 'Arbeitsblätter', icon: '📝' },
    { key: 'quiz', label: 'Quiz', icon: '❓' },
    { key: 'lesson_plan', label: 'Stundenpläne', icon: '📅' },
  ] as const;

  const getArtifactIcon = (type: ArtifactItem['type']) => {
    const typeMap = {
      document: '📄',
      image: '🖼️',
      worksheet: '📝',
      quiz: '❓',
      lesson_plan: '📅',
    };
    return typeMap[type];
  };

  const currentData = selectedTab === 'chats' ? chatHistory : artifacts;

  const filteredItems = currentData.filter((item) => {
    const lowercaseQuery = searchQuery.toLowerCase();

    // Search in title, description/lastMessage, AND tags
    const matchesSearch = item.title.toLowerCase().includes(lowercaseQuery) ||
                         (selectedTab === 'chats' ?
                          ((item as ChatHistoryItem).lastMessage?.toLowerCase().includes(lowercaseQuery) ||
                           (item as ChatHistoryItem).tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))) :
                          (item as ArtifactItem).description?.toLowerCase().includes(lowercaseQuery)
                         );
    const matchesFilter = selectedTab === 'chats' || selectedFilter === 'all' ||
                         (item as ArtifactItem).type === selectedFilter;

    return matchesSearch && matchesFilter;
  });

  // Handle chat item click - navigate to Chat tab with selected session
  const handleChatClick = useCallback((chatId: string) => {
    console.log('[Library] Chat clicked:', chatId);

    // Set session ID in parent (App.tsx)
    if (onChatSelect) {
      onChatSelect(chatId);
    }

    // Navigate to chat tab
    if (onTabChange) {
      onTabChange('chat');
    }
  }, [onChatSelect, onTabChange]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Bibliothek
        </h1>
        <p className="text-gray-600">
          Deine Chat-Historie und erstellte Materialien
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setSelectedTab('chats')}
            className={`flex-1 px-6 py-4 text-sm font-medium text-center transition-colors ${
              selectedTab === 'chats'
                ? 'text-primary-500 bg-primary-50 border-b-2 border-primary-500'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Chat-Historie</span>
            </div>
          </button>
          <button
            onClick={() => setSelectedTab('artifacts')}
            className={`flex-1 px-6 py-4 text-sm font-medium text-center transition-colors ${
              selectedTab === 'artifacts'
                ? 'text-primary-500 bg-primary-50 border-b-2 border-primary-500'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Materialien</span>
            </div>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-gray-200 mb-6">
        {/* Search Bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder={selectedTab === 'chats' ? 'Chats durchsuchen (Titel, Inhalt oder Tags)...' : 'Materialien durchsuchen...'}
          />
        </div>

        {/* Filter Buttons - Only show for artifacts tab */}
        {selectedTab === 'artifacts' && (
          <div className="flex flex-wrap gap-2">
            {artifactTypes.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setSelectedFilter(filter.key)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedFilter === filter.key
                    ? 'bg-primary-50 text-primary-500 border border-primary-500'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent'
                }`}
              >
                <span className="mr-2">{filter.icon}</span>
                {filter.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          {filteredItems.length} {selectedTab === 'chats' ? 'Chats' : 'Materialien'}
        </p>
      </div>

      {/* Content Display */}
      {filteredItems.length > 0 ? (
        <div className="space-y-4">
          {selectedTab === 'chats' ? (
            /* Chat Items */
            filteredItems.map((item) => {
              const chat = item as ChatHistoryItem;
              return (
                <div
                  key={chat.id}
                  onClick={() => handleChatClick(chat.id)}
                  className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">{chat.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{chat.lastMessage}</p>

                      {/* Tags Display */}
                      {chat.tags && chat.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {chat.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSearchQuery(tag);
                              }}
                              className="px-2 py-1 bg-primary-50 text-primary-500 text-xs rounded-full border border-primary-500 cursor-pointer hover:bg-primary-100 transition-colors"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 ml-4">
                      {formatRelativeDate(chat.dateModified)}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            /* Material Items */
            filteredItems.map((item) => {
              const artifact = item as ArtifactItem;
              return (
                <div
                  key={artifact.id}
                  className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{getArtifactIcon(artifact.type)}</div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">{artifact.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{artifact.description}</p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                        <span>{artifact.dateCreated.toLocaleDateString('de-DE')}</span>
                        <span>•</span>
                        <span>{artifact.type}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            {selectedTab === 'chats' ? (
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            ) : (
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {selectedTab === 'chats' ? 'Keine Chat-Historie vorhanden' : 'Keine Materialien vorhanden'}
          </h3>
          <p className="text-gray-600 mb-4">
            {selectedTab === 'chats'
              ? 'Starte einen Chat im Chat-Tab, um deine Konversationen hier zu sehen.'
              : 'Materialien werden automatisch aus deinen Chat-Gesprächen erstellt.'
            }
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="bg-primary-500 hover:bg-primary-600 text-white font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Suchfilter zurücksetzen
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Library;