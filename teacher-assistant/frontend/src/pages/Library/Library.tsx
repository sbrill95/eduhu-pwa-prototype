import React, { useState } from 'react';

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

const Library: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'chats' | 'artifacts'>('chats');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'document' | 'image' | 'worksheet' | 'quiz' | 'lesson_plan'>('all');

  // Chat history and artifacts will be loaded from InstantDB in Phase 3
  const chatHistory: ChatHistoryItem[] = [
    // Placeholder - will be populated from InstantDB
  ];

  const artifacts: ArtifactItem[] = [
    // Placeholder - will be populated from InstantDB
  ];

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
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (selectedTab === 'chats' ?
                          (item as ChatHistoryItem).lastMessage?.toLowerCase().includes(searchQuery.toLowerCase()) :
                          (item as ArtifactItem).description?.toLowerCase().includes(searchQuery.toLowerCase())
                         );
    const matchesFilter = selectedTab === 'chats' || selectedFilter === 'all' ||
                         (item as ArtifactItem).type === selectedFilter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Bibliothek
        </h1>
        <p className="text-gray-600">
          Ihre Chat-Historie und erstellten Materialien
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setSelectedTab('chats')}
            className={`flex-1 px-6 py-4 text-sm font-medium text-center transition-colors ${
              selectedTab === 'chats'
                ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
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
                ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
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
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={selectedTab === 'chats' ? 'Chats durchsuchen...' : 'Materialien durchsuchen...'}
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
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
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
          {/* This will be populated in Phase 3 with real data */}
          <div className="text-center py-12 text-gray-500">
            <p>Inhalt wird in Phase 3 implementiert</p>
          </div>
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
              ? 'Starten Sie einen Chat im Chat-Tab, um Ihre Konversationen hier zu sehen.'
              : 'Materialien werden automatisch aus Ihren Chat-Gesprächen erstellt.'
            }
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
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