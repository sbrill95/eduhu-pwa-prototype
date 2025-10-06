import React, { useState, useEffect } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCol,
  IonGrid,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonRow,
  IonTextarea,
  IonChip,
  IonText,
  IonAlert,
  IonSpinner,
  IonButtons
} from '@ionic/react';
import {
  closeOutline,
  documentOutline,
  calendarOutline,
  createOutline,
  helpOutline,
  linkOutline,
  addOutline,
  removeOutline
} from 'ionicons/icons';
import type { LibraryMaterial, CreateMaterialData, UpdateMaterialData } from '../hooks/useLibraryMaterials';

interface MaterialFormProps {
  material?: LibraryMaterial;
  onSubmit: (data: CreateMaterialData | UpdateMaterialData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
}

const MaterialForm: React.FC<MaterialFormProps> = ({
  material,
  onSubmit,
  onCancel,
  loading = false,
  error
}) => {
  const [formData, setFormData] = useState({
    title: '',
    type: 'document' as LibraryMaterial['type'],
    content: '',
    description: '',
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (material) {
      setFormData({
        title: material.title,
        type: material.type,
        content: material.content,
        description: material.description || '',
        tags: material.tags || [],
      });
    }
  }, [material]);

  const materialTypes = [
    { key: 'document', label: 'Dokument', icon: documentOutline },
    { key: 'lesson_plan', label: 'Stundenplan', icon: calendarOutline },
    { key: 'worksheet', label: 'Arbeitsblatt', icon: createOutline },
    { key: 'quiz', label: 'Quiz', icon: helpOutline },
    { key: 'resource', label: 'Ressource', icon: linkOutline },
  ] as const;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      return;
    }

    try {
      await onSubmit({
        title: formData.title.trim(),
        type: formData.type,
        content: formData.content.trim(),
        description: formData.description.trim() || undefined,
        tags: formData.tags.filter(tag => tag.trim().length > 0),
      });
    } catch (error) {
      // Error is handled by parent component
    }
  };

  const handleAddTag = () => {
    const newTag = tagInput.trim().toLowerCase();
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.currentTarget === e.target) {
      e.preventDefault();
      handleAddTag();
    }
  };

  const isValid = formData.title.trim() && formData.content.trim();

  return (
    <div style={{ padding: '16px' }}>
      {/* Error Alert */}
      <IonAlert
        isOpen={!!error}
        onDidDismiss={() => {}}
        header="Fehler"
        message={error || ''}
        buttons={['OK']}
      />

      <IonCard>
        <IonCardHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <IonCardTitle>
              {material ? 'Material bearbeiten' : 'Neues Material erstellen'}
            </IonCardTitle>
            <IonButton fill="clear" onClick={onCancel}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </div>
        </IonCardHeader>

        <IonCardContent>
          <form onSubmit={handleSubmit}>
            {/* Title */}
            <IonItem>
              <IonLabel position="stacked">Titel *</IonLabel>
              <IonInput
                value={formData.title}
                onIonInput={(e) => setFormData(prev => ({ ...prev, title: e.detail.value! }))}
                placeholder="Titel des Materials"
                required
                disabled={loading}
              />
            </IonItem>

            {/* Type Selection */}
            <div style={{ marginTop: '16px' }}>
              <IonText color="medium">
                <p style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Typ *</p>
              </IonText>
              <IonGrid>
                <IonRow>
                  {materialTypes.map((type) => (
                    <IonCol key={type.key} size="6" sizeMd="4">
                      <IonButton
                        expand="block"
                        fill={formData.type === type.key ? "solid" : "outline"}
                        color={formData.type === type.key ? "primary" : "medium"}
                        onClick={() => setFormData(prev => ({ ...prev, type: type.key }))}
                        disabled={loading}
                        style={{ height: '60px', fontSize: '12px' }}
                      >
                        <div style={{ textAlign: 'center' }}>
                          <IonIcon icon={type.icon} style={{ display: 'block', marginBottom: '4px' }} />
                          <span>{type.label}</span>
                        </div>
                      </IonButton>
                    </IonCol>
                  ))}
                </IonRow>
              </IonGrid>
            </div>

            {/* Description */}
            <IonItem style={{ marginTop: '16px' }}>
              <IonLabel position="stacked">Beschreibung</IonLabel>
              <IonInput
                value={formData.description}
                onIonInput={(e) => setFormData(prev => ({ ...prev, description: e.detail.value! }))}
                placeholder="Kurze Beschreibung des Materials"
                disabled={loading}
              />
            </IonItem>

            {/* Content */}
            <IonItem style={{ marginTop: '16px' }}>
              <IonLabel position="stacked">Inhalt *</IonLabel>
              <IonTextarea
                value={formData.content}
                onIonInput={(e) => setFormData(prev => ({ ...prev, content: e.detail.value! }))}
                placeholder="Inhalt des Materials..."
                rows={8}
                required
                disabled={loading}
              />
            </IonItem>

            {/* Tags */}
            <div style={{ marginTop: '16px' }}>
              <IonText color="medium">
                <p style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Tags</p>
              </IonText>

              <IonGrid>
                <IonRow>
                  <IonCol size="8">
                    <IonInput
                      value={tagInput}
                      onIonInput={(e) => setTagInput(e.detail.value!)}
                      onKeyPress={handleKeyPress}
                      placeholder="Tag hinzufügen..."
                      disabled={loading}
                    />
                  </IonCol>
                  <IonCol size="4">
                    <IonButton
                      expand="block"
                      fill="outline"
                      onClick={handleAddTag}
                      disabled={!tagInput.trim() || loading}
                    >
                      <IonIcon icon={addOutline} slot="icon-only" />
                    </IonButton>
                  </IonCol>
                </IonRow>
              </IonGrid>

              {/* Display Tags */}
              {formData.tags.length > 0 && (
                <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {formData.tags.map((tag) => (
                    <IonChip key={tag} color="primary">
                      <IonLabel>{tag}</IonLabel>
                      <IonIcon
                        icon={closeOutline}
                        onClick={() => handleRemoveTag(tag)}
                        style={{ cursor: 'pointer' }}
                      />
                    </IonChip>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{
              marginTop: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <IonButton
                expand="block"
                fill="outline"
                onClick={onCancel}
                disabled={loading}
                style={{ flex: 1 }}
              >
                Abbrechen
              </IonButton>
              <IonButton
                expand="block"
                type="submit"
                disabled={!isValid || loading}
                style={{ flex: 1 }}
              >
                {loading && <IonSpinner name="dots" />}
                {material ? 'Aktualisieren' : 'Erstellen'}
              </IonButton>
            </div>
          </form>
        </IonCardContent>
      </IonCard>
    </div>
  );
};

export default MaterialForm;