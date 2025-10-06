import React, { useState } from 'react';
import {
  IonItem,
  IonLabel,
  IonBadge,
  IonButton,
  IonIcon,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonAlert,
  IonText,
  IonNote,
  IonChip
} from '@ionic/react';
import {
  createOutline,
  trashOutline,
  checkmarkOutline,
  closeOutline,
  starOutline,
  star,
  personOutline,
  bulbOutline
} from 'ionicons/icons';
import type { ManualContextItem, ContextType } from '../lib/types';

interface ContextItemProps {
  item: ManualContextItem;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (updates: Partial<ManualContextItem>) => Promise<void>;
  onDelete: () => void;
  onCancel: () => void;
  disabled?: boolean;
}

const CONTEXT_TYPE_LABELS: Record<ContextType, string> = {
  subject: 'Fach',
  grade: 'Klassenstufe',
  method: 'Methode',
  topic: 'Thema',
  challenge: 'Herausforderung',
  custom: 'Eigener Eintrag'
};

const CONTEXT_TYPE_COLORS: Record<ContextType, string> = {
  subject: 'primary',
  grade: 'secondary',
  method: 'tertiary',
  topic: 'success',
  challenge: 'warning',
  custom: 'medium'
};

const PRIORITY_LABELS: Record<number, string> = {
  1: 'Sehr niedrig',
  2: 'Niedrig',
  3: 'Niedrig',
  4: 'Niedrig-mittel',
  5: 'Mittel',
  6: 'Mittel-hoch',
  7: 'Hoch',
  8: 'Hoch',
  9: 'Sehr hoch',
  10: 'Kritisch'
};

export const ContextItem: React.FC<ContextItemProps> = ({
  item,
  isEditing,
  onEdit,
  onSave,
  onDelete,
  onCancel,
  disabled = false
}) => {
  const [editedContent, setEditedContent] = useState(item.content);
  const [editedContextType, setEditedContextType] = useState(item.contextType);
  const [editedPriority, setEditedPriority] = useState(item.priority);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!editedContent.trim()) {
      return;
    }

    setSaving(true);
    try {
      await onSave({
        content: editedContent.trim(),
        contextType: editedContextType,
        priority: editedPriority
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedContent(item.content);
    setEditedContextType(item.contextType);
    setEditedPriority(item.priority);
    onCancel();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityStars = (priority: number) => {
    const stars = Math.ceil(priority / 2); // 1-10 scale to 1-5 stars
    return Array.from({ length: 5 }, (_, i) => (
      <IonIcon
        key={i}
        icon={i < stars ? star : starOutline}
        style={{
          fontSize: '12px',
          color: i < stars ? 'var(--ion-color-warning)' : 'var(--ion-color-light)',
          marginRight: '2px'
        }}
      />
    ));
  };

  if (isEditing) {
    return (
      <IonItem lines="full">
        <div style={{ width: '100%', padding: '8px 0' }}>
          {/* Content Input */}
          <IonInput
            value={editedContent}
            placeholder="Kontextinhalt eingeben..."
            onIonInput={(e) => setEditedContent(e.detail.value!)}
            style={{ marginBottom: '12px' }}
            maxlength={500}
            counter={true}
          />

          {/* Type and Priority Selectors */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <IonText color="medium">
                <p style={{ margin: '0 0 4px 0', fontSize: '12px' }}>Kategorie</p>
              </IonText>
              <IonSelect
                value={editedContextType}
                placeholder="Kategorie wählen"
                onIonChange={(e) => setEditedContextType(e.detail.value)}
                fill="outline"
                interface="popover"
              >
                {Object.entries(CONTEXT_TYPE_LABELS).map(([value, label]) => (
                  <IonSelectOption key={value} value={value}>
                    {label}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </div>

            <div style={{ flex: 1, minWidth: '120px' }}>
              <IonText color="medium">
                <p style={{ margin: '0 0 4px 0', fontSize: '12px' }}>Priorität</p>
              </IonText>
              <IonSelect
                value={editedPriority}
                placeholder="Priorität"
                onIonChange={(e) => setEditedPriority(e.detail.value)}
                fill="outline"
                interface="popover"
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((priority) => (
                  <IonSelectOption key={priority} value={priority}>
                    {priority} - {PRIORITY_LABELS[priority]}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <IonButton
              fill="clear"
              size="small"
              onClick={handleCancel}
              disabled={saving}
            >
              <IonIcon icon={closeOutline} />
              Abbrechen
            </IonButton>
            <IonButton
              fill="solid"
              size="small"
              onClick={handleSave}
              disabled={!editedContent.trim() || saving}
              color="primary"
            >
              <IonIcon icon={checkmarkOutline} />
              {saving ? 'Speichern...' : 'Speichern'}
            </IonButton>
          </div>
        </div>
      </IonItem>
    );
  }

  return (
    <>
      <IonItem lines="full" style={{ '--min-height': 'auto', '--padding-start': '16px' }}>
        <div style={{ width: '100%', padding: '12px 0' }}>
          {/* Header with type badge and priority */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <IonChip color={CONTEXT_TYPE_COLORS[item.contextType]}>
                <IonLabel>{CONTEXT_TYPE_LABELS[item.contextType]}</IonLabel>
              </IonChip>

              {item.isManual && (
                <IonChip color="success" outline>
                  <IonIcon icon={personOutline} style={{ fontSize: '12px' }} />
                  <IonLabel>Manuell</IonLabel>
                </IonChip>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {getPriorityStars(item.priority)}
            </div>
          </div>

          {/* Content */}
          <div style={{ marginBottom: '8px' }}>
            <IonText>
              <p style={{ margin: 0, lineHeight: '1.4', fontSize: '16px' }}>
                {item.content}
              </p>
            </IonText>
          </div>

          {/* Footer with timestamp and actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <IonNote color="medium" style={{ fontSize: '12px' }}>
              Erstellt: {formatDate(item.createdAt)}
              {item.updatedAt !== item.createdAt && (
                <span> • Bearbeitet: {formatDate(item.updatedAt)}</span>
              )}
            </IonNote>

            <div style={{ display: 'flex', gap: '4px' }}>
              <IonButton
                fill="clear"
                size="small"
                onClick={onEdit}
                disabled={disabled}
                title="Bearbeiten"
              >
                <IonIcon icon={createOutline} style={{ fontSize: '18px' }} />
              </IonButton>
              <IonButton
                fill="clear"
                size="small"
                color="danger"
                onClick={() => setShowDeleteAlert(true)}
                disabled={disabled}
                title="Löschen"
              >
                <IonIcon icon={trashOutline} style={{ fontSize: '18px' }} />
              </IonButton>
            </div>
          </div>
        </div>
      </IonItem>

      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header="Kontext löschen"
        message={`Möchten Sie "${item.content}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        buttons={[
          {
            text: 'Abbrechen',
            role: 'cancel'
          },
          {
            text: 'Löschen',
            role: 'destructive',
            handler: () => {
              onDelete();
            }
          }
        ]}
      />
    </>
  );
};

export default ContextItem;