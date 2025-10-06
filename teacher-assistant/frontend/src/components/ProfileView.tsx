import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { sparkles, close, pencilOutline, checkmarkOutline, closeOutline } from 'ionicons/icons';
import { useAuth } from '../lib/auth-context';
import { useProfileCharacteristics } from '../hooks/useProfileCharacteristics';
import { LoadingSpinner } from './LoadingSpinner';
import { apiClient } from '../lib/api';

/**
 * ProfileView Component - Gemini Design Language
 *
 * Displays user's auto-extracted profile characteristics in a clean,
 * mobile-first design matching the Gemini prototype.
 *
 * Features:
 * - Profile Sync Indicator (60% hardcoded for MVP)
 * - Learned Characteristics (auto-extracted tags)
 * - Manual Tag Addition
 * - General User Information
 *
 * Design Reference: .specify/specs/Profil.png
 */
export const ProfileView: React.FC = () => {
  const { user } = useAuth();
  const { characteristics, groupedCharacteristics, isLoading, addCharacteristic } = useProfileCharacteristics();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  const handleAddTag = async () => {
    if (!newTag.trim()) return;

    try {
      await addCharacteristic(newTag);
      setNewTag('');
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding characteristic:', error);
      // Error is already handled by the hook
    }
  };

  const handleEditName = () => {
    setEditedName(user?.name || user?.email?.split('@')[0] || '');
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (!editedName.trim() || !user?.id) return;

    try {
      const result = await apiClient.updateUserName(user.id, editedName.trim());
      console.log('[ProfileView] Name updated successfully:', result);

      // Close edit mode
      setIsEditingName(false);

      // Force a page reload to refresh InstantDB cache
      // This ensures the updated name is immediately visible
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch (error: any) {
      console.error('[ProfileView] Error saving name:', error);

      // Show user-friendly error message
      const errorMessage = error?.response?.data?.error || error?.message || 'Fehler beim Speichern des Namens. Bitte versuchen Sie es erneut.';
      alert(errorMessage);
    }
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setEditedName('');
  };

  // Category order for display (grouped visually, no labels shown)
  const categoryOrder = ['subjects', 'gradeLevel', 'teachingStyle', 'schoolType', 'topics', 'uncategorized'];

  /**
   * Calculate profile sync percentage based on characteristics count
   * Logic:
   * - 0-2 chars: 20%
   * - 3-5 chars: 40%
   * - 6-10 chars: 60%
   * - 11-15 chars: 80%
   * - 16+ chars: 95%
   */
  const calculateProfilePercentage = (): number => {
    const totalChars = characteristics.length;
    if (totalChars === 0) return 0;
    if (totalChars <= 2) return 20;
    if (totalChars <= 5) return 40;
    if (totalChars <= 10) return 60;
    if (totalChars <= 15) return 80;
    return 95;
  };

  const profilePercentage = calculateProfilePercentage();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-primary">Dein Profil</h1>
        <p className="text-sm text-gray-600 mt-1">
          Passe an, wie eduhu dich unterstützt.
        </p>
      </div>

      {/* Profile Sync Indicator Card */}
      <div
        className="mx-4 mt-4 p-6 rounded-2xl relative overflow-hidden"
        style={{ backgroundColor: '#D3E4E6' }}
      >
        {/* Confetti dots decoration */}
        <div className="absolute inset-0 opacity-40">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: '#FB6542',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>

        {/* Sync Content */}
        <div className="relative text-center">
          <p className="text-xs font-medium text-gray-600 mb-2 tracking-wide">
            DEIN PROFIL-SYNC
          </p>
          <div className="text-6xl font-bold text-gray-800">{profilePercentage}%</div>
          <p className="text-sm text-gray-600 mt-2">
            {profilePercentage === 0 ? 'Noch leer' : profilePercentage < 60 ? 'Am Lernen' : 'Lernt dich kennen'}
          </p>
        </div>

        {/* Wave decoration at bottom */}
        <svg
          className="absolute bottom-0 left-0 w-full"
          viewBox="0 0 300 60"
          preserveAspectRatio="none"
          style={{ height: '60px' }}
        >
          <path
            d="M0,30 Q75,10 150,30 T300,30 L300,60 L0,60 Z"
            fill="#FB6542"
            opacity="0.8"
          />
        </svg>
      </div>

      {/* Encouraging Microcopy */}
      <p className="text-sm text-gray-600 text-center px-6 mt-4">
        Je mehr du mit eduhu interagierst, desto besser werden die Vorschläge.
      </p>

      {/* Learned Characteristics Section */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Gelernte Merkmale
        </h2>

        {/* Add Characteristic Button - MOVED TO TOP */}
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full mb-4 text-white font-medium py-3 rounded-xl transition-colors shadow-sm"
          style={{ backgroundColor: '#FB6542' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f54621';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FB6542';
          }}
        >
          Merkmal hinzufügen +
        </button>

        {isLoading ? (
          <div className="text-center py-8">
            <LoadingSpinner message="Lade Merkmale..." showLogo={false} size="small" />
          </div>
        ) : (
          <div className="space-y-4">
            {categoryOrder.map(category => {
              const chars = groupedCharacteristics[category];
              if (!chars || chars.length === 0) return null;

              return (
                <div key={category} className="flex flex-wrap gap-2">
                  {chars.map(char => (
                    <div
                      key={char.id}
                      className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-2.5 py-1.5 shadow-sm"
                    >
                      <IonIcon icon={sparkles} className="text-primary flex-shrink-0" style={{ fontSize: '14px' }} />
                      <span className="text-xs text-gray-800">
                        {char.characteristic}
                      </span>
                      <button
                        className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 -mr-0.5"
                        aria-label="Merkmal entfernen"
                      >
                        <IonIcon icon={close} style={{ fontSize: '14px' }} />
                      </button>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* General Info Section */}
      <div className="px-4 mt-8 pb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Allgemeine Informationen
        </h2>
        <div className="bg-white rounded-xl p-4 space-y-4 shadow-sm border border-gray-100">
          {/* Name Field - Editable */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide block mb-2">Name</label>
            <div className="flex items-center gap-3">
              {isEditingName ? (
                // EDIT MODE - Inline with icon buttons
                <>
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-primary rounded-lg focus:ring-2 focus:ring-primary text-sm focus:outline-none"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveName();
                      }
                      if (e.key === 'Escape') {
                        handleCancelEditName();
                      }
                    }}
                  />

                  {/* Save Button (Checkmark) */}
                  <button
                    onClick={handleSaveName}
                    disabled={!editedName.trim()}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    aria-label="Speichern"
                  >
                    <IonIcon icon={checkmarkOutline} className="text-2xl" />
                  </button>

                  {/* Cancel Button (X) */}
                  <button
                    onClick={handleCancelEditName}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                    aria-label="Abbrechen"
                  >
                    <IonIcon icon={closeOutline} className="text-2xl" />
                  </button>
                </>
              ) : (
                // VIEW MODE - Name with edit pencil
                <>
                  <h2 className="text-sm font-medium text-gray-800 flex-1">
                    {user?.name || user?.email?.split('@')[0] || 'Lehrkraft'}
                  </h2>

                  {/* Edit Button (Pencil) */}
                  <button
                    onClick={handleEditName}
                    className="p-2 text-primary hover:bg-primary-50 rounded-lg transition-colors flex-shrink-0"
                    aria-label="Name bearbeiten"
                  >
                    <IonIcon icon={pencilOutline} className="text-xl" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Email Field - Read Only */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide block mb-2">E-Mail</label>
            <p className="text-sm text-gray-800">{user?.email || 'Nicht angegeben'}</p>
          </div>
        </div>
      </div>

      {/* Add Tag Modal - Fullscreen */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-white flex flex-col"
          style={{
            zIndex: 9999,
            minHeight: '100dvh',
            maxHeight: '100dvh'
          }}
        >
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between flex-shrink-0">
            <h3 className="text-xl font-semibold text-gray-900">Merkmal hinzufügen</h3>
            <button
              onClick={() => {
                setShowAddModal(false);
                setNewTag('');
              }}
              className="text-gray-500 hover:text-gray-700 p-2"
              aria-label="Schließen"
            >
              <IonIcon icon={close} style={{ fontSize: '24px' }} />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 p-6 overflow-y-auto" style={{ paddingBottom: '100px' }}>
            <p className="text-sm text-gray-600 mb-4">
              Füge ein Merkmal hinzu, das beschreibt, wie du unterrichtest oder was dich als Lehrkraft ausmacht.
            </p>
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="z.B. Projektbasiertes Lernen"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-transparent"
              style={{
                boxShadow: 'none'
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0 2px #FB6542';
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddTag();
                }
                if (e.key === 'Escape') {
                  setShowAddModal(false);
                  setNewTag('');
                }
              }}
            />
          </div>

          {/* Footer with Actions - Fixed at bottom with safe area */}
          <div
            className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex gap-3 flex-shrink-0"
            style={{
              paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
              boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)'
            }}
          >
            <button
              onClick={() => {
                setShowAddModal(false);
                setNewTag('');
              }}
              className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl font-medium hover:bg-gray-300 transition-colors text-base"
            >
              Abbrechen
            </button>
            <button
              onClick={handleAddTag}
              disabled={!newTag.trim()}
              className="flex-1 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
              style={{ backgroundColor: newTag.trim() ? '#FB6542' : '#e5e7eb' }}
              onMouseEnter={(e) => {
                if (newTag.trim()) e.currentTarget.style.backgroundColor = '#f54621';
              }}
              onMouseLeave={(e) => {
                if (newTag.trim()) e.currentTarget.style.backgroundColor = '#FB6542';
              }}
            >
              Hinzufügen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileView;
