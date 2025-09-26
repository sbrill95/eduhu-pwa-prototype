import React, { useState } from 'react';

interface LibraryItem {
  id: string;
  title: string;
  type: 'lesson-plan' | 'worksheet' | 'assessment' | 'resource';
  subject: string;
  grade: string;
  dateCreated: Date;
  description: string;
}

const LibraryView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'lesson-plan' | 'worksheet' | 'assessment' | 'resource'>('all');

  // Mock data - in real app, this would come from InstantDB
  const libraryItems: LibraryItem[] = [
    {
      id: '1',
      title: 'Bruchrechnung Grundlagen',
      type: 'lesson-plan',
      subject: 'Mathematik',
      grade: '5',
      dateCreated: new Date('2024-09-20'),
      description: 'Einführung in die Bruchrechnung mit praktischen Beispielen'
    },
    {
      id: '2',
      title: 'Deutsche Grammatik Übungen',
      type: 'worksheet',
      subject: 'Deutsch',
      grade: '7',
      dateCreated: new Date('2024-09-18'),
      description: 'Arbeitsblätter zu Satzgliedern und Zeitformen'
    },
    {
      id: '3',
      title: 'Photosynthese Test',
      type: 'assessment',
      subject: 'Biologie',
      grade: '8',
      dateCreated: new Date('2024-09-15'),
      description: 'Klassenarbeit über Photosynthese-Prozesse'
    }
  ];

  const getTypeIcon = (type: LibraryItem['type']) => {
    switch (type) {
      case 'lesson-plan':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case 'worksheet':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'assessment':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        );
      case 'resource':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        );
    }
  };

  const getTypeColor = (type: LibraryItem['type']) => {
    switch (type) {
      case 'lesson-plan': return 'bg-blue-100 text-blue-700';
      case 'worksheet': return 'bg-green-100 text-green-700';
      case 'assessment': return 'bg-purple-100 text-purple-700';
      case 'resource': return 'bg-orange-100 text-orange-700';
    }
  };

  const getTypeLabel = (type: LibraryItem['type']) => {
    switch (type) {
      case 'lesson-plan': return 'Stundenplan';
      case 'worksheet': return 'Arbeitsblatt';
      case 'assessment': return 'Bewertung';
      case 'resource': return 'Ressource';
    }
  };

  const filteredItems = libraryItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || item.type === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Bibliothek</h1>
        <p className="text-gray-600 text-sm">Verwalten Sie Ihre Lehrmaterialien und Ressourcen</p>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Materialien durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
          />
          <svg className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
        {[
          { key: 'all', label: 'Alle' },
          { key: 'lesson-plan', label: 'Stunden' },
          { key: 'worksheet', label: 'Blätter' },
          { key: 'assessment', label: 'Tests' },
          { key: 'resource', label: 'Material' }
        ].map((filter) => (
          <button
            key={filter.key}
            onClick={() => setSelectedFilter(filter.key as any)}
            className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-colors ${
              selectedFilter === filter.key
                ? 'bg-white text-primary-500 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Add New Material Button */}
      <button className="w-full mb-6 flex items-center justify-center space-x-2 p-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span className="font-medium">Neues Material hinzufügen</span>
      </button>

      {/* Library Items */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Materialien gefunden</h3>
            <p className="text-gray-600 text-sm mb-4">
              {searchQuery ? 'Versuchen Sie andere Suchbegriffe' : 'Beginnen Sie mit dem Erstellen von Materialien über den Chat'}
            </p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getTypeColor(item.type)}`}>
                    {getTypeIcon(item.type)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">{item.title}</h3>
                    <p className="text-xs text-gray-500">{item.subject} • Klasse {item.grade}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button className="p-1 text-gray-400 hover:text-primary-500 rounded transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                  <button className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-600 mb-3">{item.description}</p>

              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                  {getTypeLabel(item.type)}
                </span>
                <span className="text-xs text-gray-500">
                  {item.dateCreated.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LibraryView;