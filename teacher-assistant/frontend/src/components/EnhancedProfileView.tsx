import React, { useState, useEffect, useRef } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonText,
  IonChip,
  IonLabel,
  IonSkeletonText,
  IonList,
  IonItem,
  IonBadge,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
  IonInput,
  IonButton,
  IonButtons,
  IonAlert,
  IonSegment,
  IonSegmentButton,
  IonFab,
  IonFabButton,
  IonToast,
  IonCheckbox,
  IonActionSheet
} from '@ionic/react';
import {
  personOutline,
  schoolOutline,
  bookOutline,
  bulbOutline,
  warningOutline,
  timeOutline,
  chatbubbleOutline,
  trendingUpOutline,
  createOutline,
  checkmarkOutline,
  closeOutline,
  addOutline,
  listOutline,
  trashOutline,
  settingsOutline,
  sparklesOutline
} from 'ionicons/icons';
import { useAuth } from '../lib/auth-context';
import { useTeacherProfile } from '../hooks/useTeacherProfile';
import { useManualContext } from '../hooks/useManualContext';
import { ContextItem } from './ContextItem';
import { ContextForm } from './ContextForm';
import type { ContextType, ContextEditMode, ContextFormData, ManualContextItem } from '../lib/types';

type ProfileSection = 'overview' | 'subjects' | 'grades' | 'methods' | 'topics' | 'challenges' | 'custom';

const SECTION_LABELS: Record<ProfileSection, string> = {
  overview: 'Übersicht',
  subjects: 'Fächer',
  grades: 'Klassenstufen',
  methods: 'Methoden',
  topics: 'Themen',
  challenges: 'Herausforderungen',
  custom: 'Eigene'
};

const SECTION_ICONS: Record<ProfileSection, string> = {
  overview: trendingUpOutline,
  subjects: bookOutline,
  grades: schoolOutline,
  methods: bulbOutline,
  topics: chatbubbleOutline,
  challenges: warningOutline,
  custom: settingsOutline
};

const CONTEXT_TYPE_TO_SECTION: Record<ContextType, ProfileSection> = {
  subject: 'subjects',
  grade: 'grades',
  method: 'methods',
  topic: 'topics',
  challenge: 'challenges',
  custom: 'custom'
};

export const EnhancedProfileView: React.FC = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading, error: profileError, refreshProfile, updateDisplayName } = useTeacherProfile();
  const {
    contexts,
    groupedContexts,
    loading: contextLoading,
    error: contextError,
    refreshContexts,
    createContext,
    updateContext,
    deleteContext,
    bulkOperation,
    clearError
  } = useManualContext();

  // UI State
  const [activeSection, setActiveSection] = useState<ProfileSection>('overview');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [contextEditMode, setContextEditMode] = useState<ContextEditMode>({});
  const [showContextForm, setShowContextForm] = useState(false);
  const [contextFormType, setContextFormType] = useState<ContextType>('custom');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedContexts, setSelectedContexts] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkSelectionMode, setBulkSelectionMode] = useState(false);

  const saveTimeoutRef = useRef<number | null>(null);

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await Promise.all([refreshProfile(), refreshContexts()]);
    event.detail.complete();
  };

  const handleEditName = () => {
    setEditedName(profile?.display_name || '');
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (!profile || !editedName.trim()) {
      setIsEditingName(false);
      return;
    }

    try {
      await updateDisplayName(editedName.trim());
      setIsEditingName(false);
      showToastMessage('Name erfolgreich aktualisiert');
    } catch (error) {
      console.error('Failed to update display name:', error);
      showToastMessage('Fehler beim Aktualisieren des Namens');
    }
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setEditedName('');
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const handleAddContext = (contextType: ContextType) => {
    setContextFormType(contextType);
    setShowContextForm(true);
  };

  const handleCreateContext = async (data: ContextFormData) => {
    try {
      await createContext(data);
      showToastMessage('Kontext erfolgreich hinzugefügt');
    } catch (error) {
      console.error('Failed to create context:', error);
      showToastMessage('Fehler beim Hinzufügen des Kontexts');
    }
  };

  const handleEditContext = (contextId: string) => {
    setContextEditMode({ ...contextEditMode, [contextId]: true });
  };

  const handleSaveContext = async (contextId: string, updates: Partial<ManualContextItem>) => {
    try {
      await updateContext(contextId, updates);
      setContextEditMode({ ...contextEditMode, [contextId]: false });
      showToastMessage('Kontext erfolgreich aktualisiert');
    } catch (error) {
      console.error('Failed to update context:', error);
      showToastMessage('Fehler beim Aktualisieren des Kontexts');
    }
  };

  const handleDeleteContext = async (contextId: string) => {
    try {
      await deleteContext(contextId);
      showToastMessage('Kontext erfolgreich gelöscht');
    } catch (error) {
      console.error('Failed to delete context:', error);
      showToastMessage('Fehler beim Löschen des Kontexts');
    }
  };

  const handleCancelEditContext = (contextId: string) => {
    setContextEditMode({ ...contextEditMode, [contextId]: false });
  };

  const toggleContextSelection = (contextId: string) => {
    const newSelection = new Set(selectedContexts);
    if (newSelection.has(contextId)) {
      newSelection.delete(contextId);
    } else {
      newSelection.add(contextId);
    }
    setSelectedContexts(newSelection);
  };

  const handleBulkOperation = async (operation: 'activate' | 'deactivate' | 'delete') => {
    if (selectedContexts.size === 0) return;

    try {
      await bulkOperation(operation, Array.from(selectedContexts));
      setSelectedContexts(new Set());
      setBulkSelectionMode(false);
      showToastMessage(`${selectedContexts.size} Einträge erfolgreich ${operation === 'delete' ? 'gelöscht' : operation === 'activate' ? 'aktiviert' : 'deaktiviert'}`);
    } catch (error) {
      console.error('Bulk operation failed:', error);
      showToastMessage('Fehler bei der Bulk-Operation');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSchoolTypeLabel = (type?: string) => {
    switch (type) {
      case 'elementary':
        return 'Grundschule';
      case 'secondary':
        return 'Weiterführende Schule';
      case 'university':
        return 'Universität';
      case 'vocational':
        return 'Berufsschule';
      default:
        return 'Nicht angegeben';
    }
  };

  const renderAIExtractedSection = (
    title: string,
    icon: string,
    items: string[],
    emptyText: string,
    colorClasses: { bg: string; text: string; border: string; chip: string } = {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      chip: 'bg-purple-100 text-purple-800'
    }
  ) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4 transition-all duration-200 hover:shadow-md">
      {/* AI Section Header with sparkles */}
      <div className={`${colorClasses.bg} px-4 py-3 border-b ${colorClasses.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className={`w-8 h-8 ${colorClasses.chip} rounded-full flex items-center justify-center`}>
                <IonIcon icon={icon} className={`${colorClasses.text} text-lg`} />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                <IonIcon icon={sparklesOutline} className="text-yellow-700 text-xs" />
              </div>
            </div>
            <div>
              <h3 className={`font-semibold ${colorClasses.text} text-lg`}>{title}</h3>
              <p className="text-xs text-gray-500">KI-erkannt</p>
            </div>
          </div>
          {items && items.length > 0 && (
            <span className={`${colorClasses.chip} px-2 py-1 text-xs font-medium rounded-full`}>
              {items.length}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {items && items.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {items.map((item, index) => (
              <span
                key={index}
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${colorClasses.chip} border ${colorClasses.border} transition-colors hover:opacity-80`}
              >
                {item}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 relative">
              <IonIcon icon={icon} className="text-gray-400 text-xl" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                <IonIcon icon={sparklesOutline} className="text-yellow-700 text-xs" />
              </div>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
              {emptyText}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderManualContextSection = (sectionType: ProfileSection) => {
    const contextType = Object.keys(CONTEXT_TYPE_TO_SECTION).find(
      key => CONTEXT_TYPE_TO_SECTION[key as ContextType] === sectionType
    ) as ContextType;

    const sectionContexts = contextType ? groupedContexts[contextType] || [] : [];

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4 transition-all duration-200 hover:shadow-md">
        {/* Manual Section Header */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 border-b border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-8 h-8 bg-green-100 text-green-800 rounded-full flex items-center justify-center">
                  <IonIcon icon={SECTION_ICONS[sectionType]} className="text-green-700 text-lg" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <IonIcon icon={personOutline} className="text-white text-xs" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-green-700 text-lg">{SECTION_LABELS[sectionType]}</h3>
                <p className="text-xs text-green-600">Manuell hinzugefügt</p>
              </div>
            </div>
            <button
              onClick={() => contextType && handleAddContext(contextType)}
              className="p-2 text-green-600 hover:text-green-700 rounded-lg hover:bg-green-100 transition-colors"
              title="Hinzufügen"
            >
              <IonIcon icon={addOutline} className="text-lg" />
            </button>
          </div>
        </div>
        <div className="p-4">
          {sectionContexts.length > 0 ? (
            <div className="space-y-3">
              {bulkSelectionMode && (
                <div className="flex items-center p-3 bg-gray-50 rounded-lg border">
                  <input
                    type="checkbox"
                    checked={sectionContexts.every(ctx => selectedContexts.has(ctx.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedContexts(new Set([...selectedContexts, ...sectionContexts.map(ctx => ctx.id)]));
                      } else {
                        const newSelection = new Set(selectedContexts);
                        sectionContexts.forEach(ctx => newSelection.delete(ctx.id));
                        setSelectedContexts(newSelection);
                      }
                    }}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label className="ml-3 text-sm font-medium text-gray-700">
                    Alle auswählen ({sectionContexts.length})
                  </label>
                </div>
              )}
              {sectionContexts.map((context) => (
                <div key={context.id} className="flex items-start space-x-3">
                  {bulkSelectionMode && (
                    <input
                      type="checkbox"
                      checked={selectedContexts.has(context.id)}
                      onChange={() => toggleContextSelection(context.id)}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 mt-4"
                    />
                  )}
                  <div className="flex-1">
                    <ContextItem
                      item={context}
                      isEditing={contextEditMode[context.id] || false}
                      onEdit={() => handleEditContext(context.id)}
                      onSave={(updates) => handleSaveContext(context.id, updates)}
                      onDelete={() => handleDeleteContext(context.id)}
                      onCancel={() => handleCancelEditContext(context.id)}
                      disabled={contextLoading}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <IonIcon icon={SECTION_ICONS[sectionType]} className="text-gray-400 text-xl" />
              </div>
              <p className="text-gray-500 text-sm mb-4">
                Noch keine manuellen Einträge für {SECTION_LABELS[sectionType].toLowerCase()}.
              </p>
              <button
                onClick={() => contextType && handleAddContext(contextType)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <IonIcon icon={addOutline} className="mr-2 text-sm" />
                Hinzufügen
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderOverviewSection = () => (
    <>
      {/* User Information Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-background-teal to-primary/10 px-4 py-3 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <IonIcon icon={personOutline} className="text-white text-lg" />
            </div>
            <h3 className="font-semibold text-primary-700 text-lg">Benutzerinformationen</h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
            <p className="text-gray-900">{user?.email || 'Nicht verfügbar'}</p>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Anzeigename</label>
            {isEditingName ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Ihren Namen eingeben"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                />
                <button
                  onClick={handleSaveName}
                  className="p-2 text-green-500 hover:text-green-600 rounded-lg transition-colors"
                  title="Speichern"
                >
                  <IonIcon icon={checkmarkOutline} className="text-lg" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                  title="Abbrechen"
                >
                  <IonIcon icon={closeOutline} className="text-lg" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-gray-900">{profile?.display_name || 'Nicht angegeben'}</p>
                <button
                  onClick={handleEditName}
                  className="p-2 text-primary hover:text-primary-600 rounded-lg transition-colors"
                >
                  <IonIcon icon={createOutline} className="text-lg" />
                </button>
              </div>
            )}
          </div>

          {profile && (
            <>
              {/* School Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Schultyp</label>
                <p className="text-gray-900">{getSchoolTypeLabel(profile.school_type)}</p>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profil erstellt</label>
                  <p className="text-gray-900 text-sm">{formatDate(profile.created_at)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Letzte Aktualisierung</label>
                  <p className="text-gray-900 text-sm">{formatTime(profile.last_updated)}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Profile Statistics */}
      {profile && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <IonIcon icon={trendingUpOutline} className="text-white text-lg" />
              </div>
              <h3 className="font-semibold text-purple-700 text-lg">Lernfortschritt</h3>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-background-teal rounded-lg border border-primary/20">
                <div className="text-3xl font-bold text-primary-600 mb-1">
                  {profile.conversation_count}
                </div>
                <div className="text-sm text-primary-700 font-medium">
                  Gespräche
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-100">
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {profile.extraction_history?.length || 0}
                </div>
                <div className="text-sm text-purple-700 font-medium">
                  KI-Updates
                </div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {contexts.length}
                </div>
                <div className="text-sm text-green-700 font-medium">
                  Manuelle
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Mein Profil</IonTitle>
          <IonButtons slot="end">
            {contexts.length > 0 && (
              <IonButton onClick={() => setBulkSelectionMode(!bulkSelectionMode)}>
                <IonIcon icon={listOutline} />
              </IonButton>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="content-with-tabs bg-gray-50">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Enhanced Section Navigation */}
        <div className="bg-white border-b border-gray-100 px-4 py-3">
          <div className="max-w-2xl mx-auto">
            <div className="flex overflow-x-auto scrollbar-hide space-x-1">
              {Object.entries(SECTION_LABELS).map(([key, label]) => {
                const isActive = activeSection === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveSection(key as ProfileSection)}
                    className={`flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      isActive
                        ? 'bg-primary/10 text-primary-700 border-2 border-primary/30'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    <IonIcon
                      icon={SECTION_ICONS[key as ProfileSection]}
                      className={`text-lg ${isActive ? 'text-primary-600' : 'text-gray-500'}`}
                    />
                    <span className="whitespace-nowrap">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto p-4">
          {/* Error Messages */}
          {(profileError || contextError) && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <div className="flex items-start space-x-3">
                <IonIcon icon={warningOutline} className="text-red-500 text-xl mt-0.5" />
                <div>
                  <h3 className="text-red-800 font-semibold text-lg">Fehler beim Laden</h3>
                  <p className="text-red-700 text-sm mt-1">{profileError || contextError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Loading State */}
          {(profileLoading || contextLoading) && activeSection === 'overview' ? (
            <div className="space-y-6">
              {/* User Info Skeleton */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full" />
                    <div className="h-5 w-40 bg-gray-200 rounded" />
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  <div className="h-4 w-full bg-gray-200 rounded" />
                  <div className="h-4 w-3/4 bg-gray-200 rounded" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-4 w-full bg-gray-200 rounded" />
                    <div className="h-4 w-full bg-gray-200 rounded" />
                  </div>
                </div>
              </div>

              {/* Statistics Skeleton */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full" />
                    <div className="h-5 w-32 bg-gray-200 rounded" />
                  </div>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="h-8 w-12 bg-gray-200 rounded mx-auto mb-2" />
                        <div className="h-3 w-16 bg-gray-200 rounded mx-auto" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Content based on active section */}
              {activeSection === 'overview' && renderOverviewSection()}

              {activeSection === 'subjects' && (
                <>
                  {renderAIExtractedSection(
                    'Unterrichtsfächer',
                    bookOutline,
                    profile?.subjects || [],
                    'Noch keine Unterrichtsfächer identifiziert. Sprechen Sie über Ihre Fächer im Chat.',
                    {
                      bg: 'bg-blue-50',
                      text: 'text-blue-700',
                      border: 'border-blue-200',
                      chip: 'bg-blue-100 text-blue-800'
                    }
                  )}
                  {renderManualContextSection('subjects')}
                </>
              )}

              {activeSection === 'grades' && (
                <>
                  {renderAIExtractedSection(
                    'Klassenstufen',
                    schoolOutline,
                    profile?.grades || [],
                    'Noch keine Klassenstufen identifiziert. Erwähnen Sie Ihre Zielgruppe im Chat.',
                    {
                      bg: 'bg-green-50',
                      text: 'text-green-700',
                      border: 'border-green-200',
                      chip: 'bg-green-100 text-green-800'
                    }
                  )}
                  {renderManualContextSection('grades')}
                </>
              )}

              {activeSection === 'methods' && (
                <>
                  {renderAIExtractedSection(
                    'Lehrmethoden',
                    bulbOutline,
                    profile?.teaching_methods || [],
                    'Noch keine bevorzugten Lehrmethoden identifiziert. Diskutieren Sie Ihre Ansätze im Chat.',
                    {
                      bg: 'bg-purple-50',
                      text: 'text-purple-700',
                      border: 'border-purple-200',
                      chip: 'bg-purple-100 text-purple-800'
                    }
                  )}
                  {renderManualContextSection('methods')}
                </>
              )}

              {activeSection === 'topics' && (
                <>
                  {renderAIExtractedSection(
                    'Häufige Themen',
                    chatbubbleOutline,
                    profile?.topics || [],
                    'Noch keine häufigen Themen identifiziert. Führen Sie Gespräche über Unterrichtsinhalte.',
                    {
                      bg: 'bg-yellow-50',
                      text: 'text-yellow-700',
                      border: 'border-yellow-200',
                      chip: 'bg-yellow-100 text-yellow-800'
                    }
                  )}
                  {renderManualContextSection('topics')}
                </>
              )}

              {activeSection === 'challenges' && (
                <>
                  {renderAIExtractedSection(
                    'Herausforderungen',
                    warningOutline,
                    profile?.challenges || [],
                    'Noch keine Herausforderungen identifiziert. Sprechen Sie über Schwierigkeiten im Unterricht.',
                    {
                      bg: 'bg-red-50',
                      text: 'text-red-700',
                      border: 'border-red-200',
                      chip: 'bg-red-100 text-red-800'
                    }
                  )}
                  {renderManualContextSection('challenges')}
                </>
              )}

              {activeSection === 'custom' && renderManualContextSection('custom')}
            </>
          )}
        </div>

        {/* Add Context FAB */}
        {activeSection !== 'overview' && (
          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton color="primary" onClick={() => {
              const contextType = Object.keys(CONTEXT_TYPE_TO_SECTION).find(
                key => CONTEXT_TYPE_TO_SECTION[key as ContextType] === activeSection
              ) as ContextType;
              if (contextType) handleAddContext(contextType);
            }}>
              <IonIcon icon={addOutline} />
            </IonFabButton>
          </IonFab>
        )}

        {/* Context Form Modal */}
        <ContextForm
          isOpen={showContextForm}
          onClose={() => setShowContextForm(false)}
          onSubmit={handleCreateContext}
          initialData={{ contextType: contextFormType, content: '', priority: 5 }}
        />

        {/* Bulk Actions Action Sheet */}
        <IonActionSheet
          isOpen={showBulkActions}
          onDidDismiss={() => setShowBulkActions(false)}
          buttons={[
            {
              text: `${selectedContexts.size} Einträge aktivieren`,
              icon: checkmarkOutline,
              handler: () => handleBulkOperation('activate')
            },
            {
              text: `${selectedContexts.size} Einträge deaktivieren`,
              icon: closeOutline,
              handler: () => handleBulkOperation('deactivate')
            },
            {
              text: `${selectedContexts.size} Einträge löschen`,
              icon: trashOutline,
              role: 'destructive',
              handler: () => handleBulkOperation('delete')
            },
            {
              text: 'Abbrechen',
              role: 'cancel'
            }
          ]}
        />

        {/* Bulk Selection Bar */}
        {bulkSelectionMode && (
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'var(--ion-color-primary)',
            color: 'white',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <span>{selectedContexts.size} ausgewählt</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <IonButton
                fill="clear"
                size="small"
                color="light"
                onClick={() => setShowBulkActions(true)}
                disabled={selectedContexts.size === 0}
              >
                Aktionen
              </IonButton>
              <IonButton
                fill="clear"
                size="small"
                color="light"
                onClick={() => {
                  setBulkSelectionMode(false);
                  setSelectedContexts(new Set());
                }}
              >
                Fertig
              </IonButton>
            </div>
          </div>
        )}

        {/* Toast */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="bottom"
        />
      </IonContent>
    </IonPage>
  );
};

export default EnhancedProfileView;