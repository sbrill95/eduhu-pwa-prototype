import React, { useState, useCallback } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonButton,
  IonIcon,
  IonSearchbar,
  IonChip,
  IonList,
  IonText,
  IonButtons,
  IonModal,
  IonActionSheet,
  IonAlert,
  IonGrid,
  IonRow,
  IonCol,
  IonSkeletonText
} from '@ionic/react';
import {
  addOutline,
  searchOutline,
  chatbubbleOutline,
  documentOutline,
  createOutline,
  helpOutline,
  calendarOutline,
  linkOutline,
  heartOutline,
  heart,
  ellipsisVerticalOutline,
  trashOutline,
  settingsOutline
} from 'ionicons/icons';
import { useAuth } from '../../lib/auth-context';
import db from '../../lib/instantdb';
import useLibraryMaterials, { type LibraryMaterial } from '../../hooks/useLibraryMaterials';
import MaterialForm from '../../components/MaterialForm';
import { MaterialPreviewModal, type UnifiedMaterial } from '../../components/MaterialPreviewModal';

interface LibraryProps {
  onChatSelect?: (sessionId: string) => void;
  onTabChange?: (tab: 'home' | 'chat' | 'library') => void;
}

/**
 * Convert LibraryMaterial to UnifiedMaterial for preview modal
 */
const convertToUnifiedMaterial = (material: LibraryMaterial): UnifiedMaterial => {
  // Map LibraryMaterial type to UnifiedMaterial MaterialType
  const typeMap: Record<LibraryMaterial['type'], UnifiedMaterial['type']> = {
    'lesson_plan': 'lesson-plan',
    'quiz': 'quiz',
    'worksheet': 'worksheet',
    'resource': 'resource',
    'document': 'document',
    'image': 'image'
  };

  return {
    id: material.id,
    title: material.title,
    description: material.description,
    type: typeMap[material.type],
    source: 'manual',
    created_at: material.created_at,
    updated_at: material.updated_at,
    metadata: {
      tags: material.tags,
      content: material.content
    },
    is_favorite: material.is_favorite
  };
};

const Library: React.FC<LibraryProps> = React.memo(({ onChatSelect, onTabChange }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'chats' | 'artifacts'>('chats');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'document' | 'worksheet' | 'quiz' | 'lesson_plan' | 'resource'>('all');
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<LibraryMaterial | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<LibraryMaterial | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Get chat sessions from InstantDB
  const { data: chatData, error: chatError } = db.useQuery(
    user ? {
      chat_sessions: {
        $: {
          where: { user_id: user.id },
          order: { serverCreatedAt: 'desc' }
        }
      }
    } : null
  );

  // Get library materials using the custom hook
  const {
    materials,
    loading: materialsLoading,
    error: materialsError,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    toggleFavorite,
  } = useLibraryMaterials();

  const chatHistory = chatData?.chat_sessions || [];

  const artifactTypes = [
    { key: 'all', label: 'Alle', icon: documentOutline },
    { key: 'document', label: 'Dokumente', icon: documentOutline },
    { key: 'worksheet', label: 'Arbeitsblätter', icon: createOutline },
    { key: 'quiz', label: 'Quiz', icon: helpOutline },
    { key: 'lesson_plan', label: 'Stundenpläne', icon: calendarOutline },
    { key: 'resource', label: 'Ressourcen', icon: linkOutline }
  ];

  // Filter materials based on search and type
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = !searchQuery ||
      material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFilter = selectedFilter === 'all' || material.type === selectedFilter;

    return matchesSearch && matchesFilter;
  });

  // Filter chat history based on search and actual messages
  const filteredChats = chatHistory.filter((chat: any) => {
    // Only show chats that have actual messages (minimum 1 user message)
    const hasMessages = (chat.message_count || 0) > 0;
    const matchesSearch = !searchQuery ||
      chat.title?.toLowerCase().includes(searchQuery.toLowerCase());

    return hasMessages && matchesSearch;
  });

  const handleChatClick = (sessionId: string) => {
    if (onChatSelect) {
      onChatSelect(sessionId);
    }
    if (onTabChange) {
      onTabChange('chat');
    }
  };

  const handleNewMaterial = () => {
    setEditingMaterial(null);
    setShowMaterialForm(true);
  };

  const handleEditMaterial = (material: LibraryMaterial) => {
    setEditingMaterial(material);
    setShowMaterialForm(true);
  };

  const handleDeleteMaterial = async () => {
    if (selectedMaterial) {
      try {
        await deleteMaterial(selectedMaterial.id);
        setShowDeleteAlert(false);
        setSelectedMaterial(null);
      } catch (error) {
        console.error('Failed to delete material:', error);
      }
    }
  };

  const handleToggleFavorite = async (materialId: string) => {
    try {
      await toggleFavorite(materialId);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleMaterialAction = (material: LibraryMaterial) => {
    setSelectedMaterial(material);
    setShowActionSheet(true);
  };

  // Open material preview modal when material card is clicked
  const handleMaterialClick = useCallback((material: LibraryMaterial) => {
    setSelectedMaterial(material);
    setShowPreviewModal(true);
  }, []);

  // Delete callback for preview modal
  const handlePreviewDelete = useCallback(async (materialId: string) => {
    try {
      await deleteMaterial(materialId);
      setShowPreviewModal(false);
      setSelectedMaterial(null);
    } catch (error) {
      console.error('Fehler beim Löschen des Materials:', error);
      throw error;
    }
  }, [deleteMaterial]);

  // Update title callback for preview modal
  const handlePreviewUpdateTitle = useCallback(async (materialId: string, newTitle: string) => {
    try {
      await updateMaterial(materialId, { title: newTitle });
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Titels:', error);
      throw error;
    }
  }, [updateMaterial]);

  // Toggle favorite callback for preview modal
  const handlePreviewToggleFavorite = useCallback(async (materialId: string) => {
    try {
      await toggleFavorite(materialId);
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Favoriten-Status:', error);
      throw error;
    }
  }, [toggleFavorite]);

  const formatDate = (dateString: string | number) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Heute';
    } else if (diffInDays === 1) {
      return 'Gestern';
    } else {
      return date.toLocaleDateString('de-DE', {
        day: 'numeric',
        month: 'short',
        year: diffInDays > 365 ? 'numeric' : undefined
      });
    }
  };

  const getTypeIcon = (type: string) => {
    const typeInfo = artifactTypes.find(t => t.key === type);
    return typeInfo?.icon || documentOutline;
  };

  return (
    <>
      <div>
        {/* Tab Segment with Add Button */}
        <div style={{ padding: '16px 16px 0 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <IonSegment
              value={selectedTab}
              onIonChange={(e) => setSelectedTab(e.detail.value as 'chats' | 'artifacts')}
              style={{ flex: 1 }}
            >
              <IonSegmentButton value="chats">
                <IonIcon icon={chatbubbleOutline} />
                <IonLabel>Chats</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="artifacts">
                <IonIcon icon={documentOutline} />
                <IonLabel>Materialien</IonLabel>
              </IonSegmentButton>
            </IonSegment>
            {selectedTab === 'artifacts' && (
              <IonButton
                fill="clear"
                onClick={handleNewMaterial}
                style={{ marginLeft: '8px' }}
              >
                <IonIcon icon={addOutline} />
              </IonButton>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ padding: '16px' }}>
          <IonSearchbar
            value={searchQuery}
            onIonInput={(e) => setSearchQuery(e.detail.value!)}
            placeholder={
              selectedTab === 'chats' ? 'Chats durchsuchen...' :
              'Materialien durchsuchen...'
            }
            showClearButton="focus"
          />
        </div>

        {/* Filter Chips for Artifacts */}
        {selectedTab === 'artifacts' && (
          <div style={{ padding: '0 16px 16px 16px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {artifactTypes.map((type) => (
                <IonChip
                  key={type.key}
                  color={selectedFilter === type.key ? 'primary' : 'medium'}
                  onClick={() => setSelectedFilter(type.key as any)}
                >
                  <IonIcon icon={type.icon} />
                  <IonLabel>{type.label}</IonLabel>
                </IonChip>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '0 16px 16px 16px' }}>
          {selectedTab === 'chats' ? (
            // Chat History Tab
            <div>
              {chatError && (
                <IonCard color="danger">
                  <IonCardContent>
                    <IonText color="light">
                      Fehler beim Laden der Chats: {typeof chatError === 'string' ? chatError : chatError.message}
                    </IonText>
                  </IonCardContent>
                </IonCard>
              )}

              {filteredChats.length > 0 ? (
                <IonList>
                  {filteredChats.map((chat: any) => (
                    <IonCard key={chat.id} button onClick={() => handleChatClick(chat.id)}>
                      <IonCardContent>
                        <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                          <IonIcon
                            icon={chatbubbleOutline}
                            color="primary"
                            style={{ fontSize: '24px', marginTop: '2px' }}
                          />
                          <div style={{ flex: 1 }}>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>
                              {chat.title || `Chat vom ${formatDate(chat.created_at)}`}
                            </h3>
                            <IonText color="medium">
                              <p style={{ margin: '0 0 4px 0', fontSize: '14px' }}>
                                {(chat.message_count || 0).toString()} Nachrichten
                              </p>
                            </IonText>
                            <IonText color="medium">
                              <p style={{ margin: 0, fontSize: '12px' }}>
                                {formatDate(chat.updated_at)}
                              </p>
                            </IonText>
                          </div>
                        </div>
                      </IonCardContent>
                    </IonCard>
                  ))}
                </IonList>
              ) : (
                <div style={{ textAlign: 'center', padding: '48px 16px' }}>
                  <IonIcon
                    icon={chatbubbleOutline}
                    style={{ fontSize: '64px', color: 'var(--ion-color-medium)', marginBottom: '16px' }}
                  />
                  <h2>Keine Chats gefunden</h2>
                  <IonText color="medium">
                    <p>
                      {searchQuery
                        ? 'Keine Chats entsprechen Ihrer Suche.'
                        : 'Starten Sie einen neuen Chat im Chat-Tab.'}
                    </p>
                  </IonText>
                </div>
              )}
            </div>
          ) : (
            // Materials Tab
            <div>
              {materialsError && (
                <IonCard color="danger">
                  <IonCardContent>
                    <IonText color="light">
                      Fehler beim Laden der Materialien: {typeof materialsError === 'string' ? materialsError : materialsError.message}
                    </IonText>
                  </IonCardContent>
                </IonCard>
              )}

              {materialsLoading ? (
                <div>
                  {[1, 2, 3].map((i) => (
                    <IonCard key={i}>
                      <IonCardContent>
                        <IonSkeletonText animated style={{ width: '60%', height: '20px' }} />
                        <IonSkeletonText animated style={{ width: '80%', height: '14px', marginTop: '8px' }} />
                        <IonSkeletonText animated style={{ width: '40%', height: '12px', marginTop: '8px' }} />
                      </IonCardContent>
                    </IonCard>
                  ))}
                </div>
              ) : filteredMaterials.length > 0 ? (
                <IonList>
                  {filteredMaterials.map((material) => (
                    <IonCard
                      key={material.id}
                      button
                      onClick={() => handleMaterialClick(material)}
                      data-testid={`material-card-${material.id}`}
                    >
                      <IonCardContent>
                        <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                          <IonIcon
                            icon={getTypeIcon(material.type)}
                            color="secondary"
                            style={{ fontSize: '24px', marginTop: '2px' }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
                              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>
                                {material.title}
                              </h3>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <IonButton
                                  fill="clear"
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleFavorite(material.id);
                                  }}
                                >
                                  <IonIcon
                                    icon={material.is_favorite ? heart : heartOutline}
                                    color={material.is_favorite ? 'danger' : 'medium'}
                                  />
                                </IonButton>
                                <IonButton
                                  fill="clear"
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMaterialAction(material);
                                  }}
                                >
                                  <IonIcon icon={ellipsisVerticalOutline} color="medium" />
                                </IonButton>
                              </div>
                            </div>

                            {material.description && (
                              <IonText color="dark">
                                <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                                  {material.description}
                                </p>
                              </IonText>
                            )}

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                              {material.tags?.map((tag) => (
                                <IonChip key={tag} color="light">
                                  <IonLabel style={{ fontSize: '12px' }}>{tag}</IonLabel>
                                </IonChip>
                              ))}
                            </div>

                            <IonText color="medium">
                              <p style={{ margin: 0, fontSize: '12px' }}>
                                {formatDate(material.updated_at)}
                              </p>
                            </IonText>
                          </div>
                        </div>
                      </IonCardContent>
                    </IonCard>
                  ))}
                </IonList>
              ) : (
                <div style={{ textAlign: 'center', padding: '48px 16px' }}>
                  <IonIcon
                    icon={documentOutline}
                    style={{ fontSize: '64px', color: 'var(--ion-color-medium)', marginBottom: '16px' }}
                  />
                  <h2>Keine Materialien gefunden</h2>
                  <IonText color="medium">
                    <p>
                      {searchQuery
                        ? 'Keine Materialien entsprechen Ihrer Suche.'
                        : 'Erstellen Sie Ihr erstes Material über den Button oben.'}
                    </p>
                  </IonText>
                  {!searchQuery && (
                    <IonButton fill="clear" onClick={handleNewMaterial} style={{ marginTop: '16px' }}>
                      <IonIcon icon={addOutline} slot="start" />
                      Material erstellen
                    </IonButton>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Material Preview Modal */}
      <MaterialPreviewModal
        material={selectedMaterial ? convertToUnifiedMaterial(selectedMaterial) : null}
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setSelectedMaterial(null);
        }}
        onDelete={handlePreviewDelete}
        onUpdateTitle={handlePreviewUpdateTitle}
        onToggleFavorite={handlePreviewToggleFavorite}
      />

      {/* Material Form Modal */}
      <IonModal isOpen={showMaterialForm} onDidDismiss={() => setShowMaterialForm(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>
              {editingMaterial ? 'Material bearbeiten' : 'Neues Material'}
            </IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowMaterialForm(false)}>
                Schließen
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <MaterialForm
            material={editingMaterial || undefined}
            onSubmit={async (materialData: any) => {
              try {
                if (editingMaterial) {
                  await updateMaterial(editingMaterial.id, materialData);
                } else {
                  await createMaterial(materialData);
                }
                setShowMaterialForm(false);
                setEditingMaterial(null);
              } catch (error) {
                console.error('Failed to save material:', error);
              }
            }}
            onCancel={() => {
              setShowMaterialForm(false);
              setEditingMaterial(null);
            }}
          />
        </IonContent>
      </IonModal>

      {/* Material Action Sheet */}
      <IonActionSheet
        isOpen={showActionSheet}
        onDidDismiss={() => setShowActionSheet(false)}
        header="Material-Aktionen"
        buttons={[
          {
            text: 'Bearbeiten',
            icon: createOutline,
            handler: () => {
              if (selectedMaterial) {
                handleEditMaterial(selectedMaterial);
              }
            }
          },
          {
            text: 'Löschen',
            icon: trashOutline,
            role: 'destructive',
            handler: () => {
              setShowDeleteAlert(true);
            }
          },
          {
            text: 'Abbrechen',
            role: 'cancel'
          }
        ]}
      />

      {/* Delete Confirmation Alert */}
      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header="Material löschen"
        message={`Möchten Sie "${selectedMaterial?.title}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        buttons={[
          {
            text: 'Abbrechen',
            role: 'cancel'
          },
          {
            text: 'Löschen',
            role: 'destructive',
            handler: handleDeleteMaterial
          }
        ]}
      />
    </>
  );
});

export default Library;