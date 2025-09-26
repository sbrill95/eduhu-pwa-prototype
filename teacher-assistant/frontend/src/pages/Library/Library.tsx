import React, { useState } from 'react';

interface LibraryItem {
  id: number;
  title: string;
  type: 'document' | 'image' | 'video' | 'quiz' | 'worksheet';
  subject: string;
  grade: string;
  dateAdded: Date;
  size?: string;
  description?: string;
}

const Library: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'document' | 'image' | 'video' | 'quiz' | 'worksheet'>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  // Mock data for library items
  const libraryItems: LibraryItem[] = [
    {
      id: 1,
      title: 'Bruchrechnung Arbeitsblatt',
      type: 'worksheet',
      subject: 'Mathematik',
      grade: '7. Klasse',
      dateAdded: new Date('2024-01-15'),
      description: 'Übungen zur Addition und Subtraktion von Brüchen',
    },
    {
      id: 2,
      title: 'Fotosynthese Erklärvideo',
      type: 'video',
      subject: 'Biologie',
      grade: '8. Klasse',
      dateAdded: new Date('2024-01-14'),
      size: '45 MB',
      description: 'Detaillierte Erklärung der Photosynthese bei Pflanzen',
    },
    {
      id: 3,
      title: 'Deutsche Grammatik Quiz',
      type: 'quiz',
      subject: 'Deutsch',
      grade: '6. Klasse',
      dateAdded: new Date('2024-01-13'),
      description: '20 Fragen zu Substantiven, Adjektiven und Verben',
    },
    {
      id: 4,
      title: 'Mittelalter Präsentation',
      type: 'document',
      subject: 'Geschichte',
      grade: '7. Klasse',
      dateAdded: new Date('2024-01-12'),
      size: '12 MB',
      description: 'Übersicht über das Mittelalter in Europa',
    },
    {
      id: 5,
      title: 'Atomstruktur Diagramm',
      type: 'image',
      subject: 'Chemie',
      grade: '9. Klasse',
      dateAdded: new Date('2024-01-11'),
      size: '2 MB',
      description: 'Visuelle Darstellung der Atomstruktur',
    },
  ];

  const subjects = ['all', 'Mathematik', 'Biologie', 'Deutsch', 'Geschichte', 'Chemie'];
  const filterTypes = [
    { key: 'all', label: 'Alle', icon: '📁' },
    { key: 'document', label: 'Dokumente', icon: '📄' },
    { key: 'image', label: 'Bilder', icon: '🖼️' },
    { key: 'video', label: 'Videos', icon: '🎬' },
    { key: 'quiz', label: 'Quiz', icon: '❓' },
    { key: 'worksheet', label: 'Arbeitsblätter', icon: '📝' },
  ] as const;

  const getTypeIcon = (type: LibraryItem['type']) => {
    const typeMap = {
      document: '📄',
      image: '🖼️',
      video: '🎬',
      quiz: '❓',
      worksheet: '📝',
    };
    return typeMap[type];
  };

  const filteredItems = libraryItems.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || item.type === selectedFilter;
    const matchesSubject = selectedSubject === 'all' || item.subject === selectedSubject;

    return matchesSearch && matchesFilter && matchesSubject;
  });

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Bibliothek
        </h1>
        <p className="text-gray-600">
          Verwalten Sie Ihre Lehrmaterialien und Ressourcen
        </p>
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
            placeholder="Materialien durchsuchen..."
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {filterTypes.map((filter) => (
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

        {/* Subject Filter */}
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Fach:</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject === 'all' ? 'Alle Fächer' : subject}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Add New Material Button */}
      <div className="mb-6">
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Neues Material hinzufügen</span>
        </button>
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          {filteredItems.length} von {libraryItems.length} Materialien
        </p>
      </div>

      {/* Library Items Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              {/* Item Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getTypeIcon(item.type)}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600">{item.subject} • {item.grade}</p>
                  </div>
                </div>

                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>

              {/* Description */}
              {item.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {item.description}
                </p>
              )}

              {/* Metadata */}
              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <span>
                  {item.dateAdded.toLocaleDateString('de-DE')}
                </span>
                {item.size && <span>{item.size}</span>}
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium px-3 py-2 rounded-lg text-sm transition-colors">
                  Öffnen
                </button>
                <button className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                </button>
                <button className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Materialien gefunden</h3>
          <p className="text-gray-600 mb-4">
            Versuchen Sie einen anderen Suchbegriff oder ändern Sie die Filter.
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors">
            Filter zurücksetzen
          </button>
        </div>
      )}
    </div>
  );
};

export default Library;