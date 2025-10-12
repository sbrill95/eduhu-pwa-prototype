import React, { useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonAlert
} from '@ionic/react';
import {
  closeOutline,
  downloadOutline,
  heartOutline,
  heart,
  trashOutline,
  shareOutline,
  createOutline,
  refreshOutline
} from 'ionicons/icons';
import { useAgent } from '../lib/AgentContext';

export type MaterialSource = 'manual' | 'upload' | 'agent-generated';

export type MaterialType =
  | 'lesson-plan'
  | 'worksheet'
  | 'quiz'
  | 'document'
  | 'image'
  | 'upload-pdf'
  | 'upload-image'
  | 'upload-doc'
  | 'resource';

export interface UnifiedMaterial {
  id: string;
  title: string;
  description?: string;
  type: MaterialType;
  source: MaterialSource;
  created_at: number;
  updated_at: number;
  metadata: {
    // For uploads
    filename?: string;
    file_url?: string;
    file_type?: string;
    image_data?: string;

    // For generated artifacts
    agent_id?: string;
    agent_name?: string;
    prompt?: string;
    model_used?: string;
    artifact_data?: Record<string, any>;
    image_style?: string;  // TASK-010: Image generation style parameter

    // For manual materials
    tags?: string[];
    subject?: string;
    grade?: string;
    content?: string;
  };
  is_favorite: boolean;
  usage_count?: number;
}

interface MaterialPreviewModalProps {
  material: UnifiedMaterial | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (materialId: string) => Promise<void>;
  onUpdateTitle?: (materialId: string, newTitle: string) => Promise<void>;
  onToggleFavorite?: (materialId: string) => Promise<void>;
}

export const MaterialPreviewModal: React.FC<MaterialPreviewModalProps> = ({
  material,
  isOpen,
  onClose,
  onDelete,
  onUpdateTitle,
  onToggleFavorite
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  // TASK-010: Import AgentContext for regeneration
  const { openModal } = useAgent();

  if (!material) return null;

  const handleSaveTitle = async () => {
    if (editedTitle && editedTitle !== material.title && onUpdateTitle) {
      await onUpdateTitle(material.id, editedTitle);
      setIsEditingTitle(false);
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete(material.id);
      setShowDeleteAlert(false);
      onClose();
    }
  };

  const handleDownload = () => {
    // Implementation depends on material type
    if (material.source === 'upload' && material.metadata.image_data) {
      // Download image
      const link = document.createElement('a');
      link.href = material.metadata.image_data;
      link.download = material.metadata.filename || 'download.jpg';
      link.click();
    } else if (material.metadata.artifact_data?.url) {
      // Download generated artifact
      window.open(material.metadata.artifact_data.url, '_blank');
    }
  };

  const getSourceLabel = () => {
    switch (material.source) {
      case 'manual':
        return 'Manuell erstellt';
      case 'upload':
        return 'Hochgeladen';
      case 'agent-generated':
        return 'KI-generiert';
      default:
        return material.source;
    }
  };

  // T028-T029: Handle regeneration of images with new metadata structure
  const handleRegenerate = () => {
    console.log('[MaterialPreviewModal] Regenerating image - checking metadata...');

    let originalParams = {
      description: '',
      imageStyle: 'realistic' as const
    };

    // T029: Try to parse metadata JSON string (new structure from FR-004)
    // T028: If metadata is null or invalid, use empty form (graceful degradation)
    if (material.metadata) {
      try {
        const parsedMetadata = typeof material.metadata === 'string'
          ? JSON.parse(material.metadata)
          : material.metadata;

        // Extract originalParams from parsed metadata (FR-008)
        if (parsedMetadata.originalParams) {
          originalParams = {
            description: parsedMetadata.originalParams.description || '',
            imageStyle: (parsedMetadata.originalParams.imageStyle as any) || 'realistic'
          };
          console.log('[MaterialPreviewModal] ✅ Metadata parsed successfully:', originalParams);
        } else {
          // Fallback to old structure for backward compatibility
          originalParams = {
            description: parsedMetadata.prompt || material.metadata.prompt || material.description || material.title || '',
            imageStyle: (parsedMetadata.image_style || material.metadata.image_style || 'realistic') as any
          };
          console.log('[MaterialPreviewModal] ⚠️ Using legacy metadata structure:', originalParams);
        }
      } catch (error) {
        // T028: Validation failed - show empty form (FR-008 graceful degradation)
        console.warn('[MaterialPreviewModal] ⚠️ Metadata parse failed - using empty form:', error);
        originalParams = {
          description: material.description || material.title || '',
          imageStyle: 'realistic'
        };
      }
    } else {
      // T028: Metadata is null - use fallback (graceful degradation per CHK111)
      console.warn('[MaterialPreviewModal] ⚠️ Metadata is null - using fallback values');
      originalParams = {
        description: material.description || material.title || '',
        imageStyle: 'realistic'
      };
    }

    console.log('[MaterialPreviewModal] Final params for regeneration:', originalParams);

    // Close preview modal
    onClose();

    // Open agent form with prefilled data
    openModal('image-generation', originalParams, undefined);
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={onClose}>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={onClose} data-testid="close-button">
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
            <IonTitle>
              {isEditingTitle ? (
                <IonInput
                  value={editedTitle}
                  onIonInput={e => setEditedTitle(e.detail.value!)}
                  placeholder="Titel eingeben..."
                  data-testid="title-input"
                />
              ) : (
                <span data-testid="material-title">{material.title}</span>
              )}
            </IonTitle>
            <IonButtons slot="end">
              {isEditingTitle ? (
                <IonButton onClick={handleSaveTitle} data-testid="save-title-button">Speichern</IonButton>
              ) : (
                <IonButton onClick={() => {
                  setEditedTitle(material.title);
                  setIsEditingTitle(true);
                }} data-testid="edit-title-button">
                  <IonIcon icon={createOutline} />
                </IonButton>
              )}
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          {/* Material Preview Content */}
          <div style={{ padding: '16px' }}>
            {/* Show material based on type */}
            {material.type === 'upload-image' && material.metadata.image_data && (
              <img
                src={material.metadata.image_data}
                alt={material.title}
                style={{ width: '100%', borderRadius: '8px' }}
                data-testid="material-image"
              />
            )}

            {material.type === 'image' && material.metadata.artifact_data?.url && (
              <img
                src={material.metadata.artifact_data.url}
                alt={material.title}
                style={{ width: '100%', borderRadius: '8px' }}
                data-testid="material-image"
              />
            )}

            {material.metadata.content && (
              <div style={{ marginTop: '16px' }} data-testid="material-content">
                <IonLabel>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{material.metadata.content}</p>
                </IonLabel>
              </div>
            )}

            {/* Metadata */}
            <div style={{ marginTop: '24px' }}>
              <IonItem>
                <IonLabel>
                  <h3>Typ</h3>
                  <p data-testid="material-type">{material.type}</p>
                </IonLabel>
              </IonItem>
              <IonItem>
                <IonLabel>
                  <h3>Quelle</h3>
                  <p data-testid="material-source">{getSourceLabel()}</p>
                </IonLabel>
              </IonItem>
              <IonItem>
                <IonLabel>
                  <h3>Erstellt am</h3>
                  <p data-testid="material-date">
                    {new Date(material.created_at).toLocaleDateString('de-DE')}
                  </p>
                </IonLabel>
              </IonItem>
              {material.metadata.agent_name && (
                <IonItem>
                  <IonLabel>
                    <h3>Agent</h3>
                    <p data-testid="material-agent">{material.metadata.agent_name}</p>
                  </IonLabel>
                </IonItem>
              )}
            </div>

            {/* Actions */}
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* TASK-010: Regenerate button for images */}
              {material.type === 'image' && material.source === 'agent-generated' && (
                <IonButton
                  expand="block"
                  color="secondary"
                  onClick={handleRegenerate}
                  data-testid="regenerate-button"
                >
                  <IonIcon icon={refreshOutline} slot="start" />
                  Neu generieren
                </IonButton>
              )}

              <IonButton expand="block" onClick={handleDownload} data-testid="download-button">
                <IonIcon icon={downloadOutline} slot="start" />
                Download
              </IonButton>
              <IonButton expand="block" fill="outline" onClick={() => onToggleFavorite?.(material.id)} data-testid="favorite-button">
                <IonIcon icon={material.is_favorite ? heart : heartOutline} slot="start" />
                {material.is_favorite ? 'Favorit entfernen' : 'Als Favorit'}
              </IonButton>
              <IonButton expand="block" fill="outline" data-testid="share-button">
                <IonIcon icon={shareOutline} slot="start" />
                Teilen
              </IonButton>
              <IonButton expand="block" color="danger" fill="outline" onClick={() => setShowDeleteAlert(true)} data-testid="delete-button">
                <IonIcon icon={trashOutline} slot="start" />
                Löschen
              </IonButton>
            </div>
          </div>
        </IonContent>
      </IonModal>

      {/* Delete Confirmation */}
      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header="Material löschen"
        message={`Möchten Sie "${material.title}" wirklich löschen?`}
        buttons={[
          { text: 'Abbrechen', role: 'cancel' },
          { text: 'Löschen', role: 'destructive', handler: handleDelete }
        ]}
        data-testid="delete-alert"
      />
    </>
  );
};