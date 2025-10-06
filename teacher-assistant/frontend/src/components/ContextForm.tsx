import React, { useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonText,
  IonCard,
  IonCardContent,
  IonNote,
  IonCheckbox,
  IonRange
} from '@ionic/react';
import {
  closeOutline,
  addOutline,
  checkmarkOutline,
  informationCircleOutline
} from 'ionicons/icons';
import type { ContextType, ContextFormData } from '../lib/types';

interface ContextFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ContextFormData) => Promise<void>;
  initialData?: Partial<ContextFormData>;
  mode?: 'create' | 'edit';
}

const CONTEXT_TYPE_LABELS: Record<ContextType, string> = {
  subject: 'Unterrichtsfach',
  grade: 'Klassenstufe',
  method: 'Lehrmethode',
  topic: 'Thema',
  challenge: 'Herausforderung',
  custom: 'Eigener Eintrag'
};

const CONTEXT_TYPE_DESCRIPTIONS: Record<ContextType, string> = {
  subject: 'Fächer, die Sie unterrichten (z.B. Mathematik, Deutsch, Geschichte)',
  grade: 'Klassenstufen Ihrer Schüler (z.B. 5. Klasse, Oberstufe)',
  method: 'Bevorzugte Unterrichtsmethoden (z.B. Gruppenarbeit, Projektlernen)',
  topic: 'Häufige Unterrichtsthemen oder Schwerpunkte',
  challenge: 'Herausforderungen im Unterricht (z.B. Motivation, Differenzierung)',
  custom: 'Andere wichtige Informationen für Ihren Unterrichtskontext'
};

const PRIORITY_LABELS: Record<number, string> = {
  1: 'Sehr niedrig - Selten relevant',
  2: 'Niedrig - Gelegentlich relevant',
  3: 'Niedrig - Gelegentlich relevant',
  4: 'Niedrig-mittel - Manchmal wichtig',
  5: 'Mittel - Regelmäßig relevant',
  6: 'Mittel-hoch - Oft wichtig',
  7: 'Hoch - Sehr wichtig',
  8: 'Hoch - Sehr wichtig',
  9: 'Sehr hoch - Kritisch wichtig',
  10: 'Kritisch - Immer berücksichtigen'
};

export const ContextForm: React.FC<ContextFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode = 'create'
}) => {
  const [formData, setFormData] = useState<ContextFormData>({
    content: initialData?.content || '',
    contextType: initialData?.contextType || 'custom',
    priority: initialData?.priority || 5
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.content.trim()) {
      newErrors.content = 'Inhalt ist erforderlich';
    } else if (formData.content.trim().length < 3) {
      newErrors.content = 'Inhalt muss mindestens 3 Zeichen lang sein';
    } else if (formData.content.trim().length > 500) {
      newErrors.content = 'Inhalt darf maximal 500 Zeichen lang sein';
    }

    if (!formData.contextType) {
      newErrors.contextType = 'Kategorie ist erforderlich';
    }

    if (formData.priority < 1 || formData.priority > 10) {
      newErrors.priority = 'Priorität muss zwischen 1 und 10 liegen';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
      // Reset form
      setFormData({
        content: '',
        contextType: 'custom',
        priority: 5
      });
      setErrors({});
    } catch (error) {
      console.error('Error submitting context form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onClose();
      setErrors({});
    }
  };

  const getPriorityLabel = (priority: number): string => {
    return PRIORITY_LABELS[priority] || `Priorität ${priority}`;
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={handleClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            {mode === 'create' ? 'Neuen Kontext hinzufügen' : 'Kontext bearbeiten'}
          </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleClose} disabled={submitting}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div style={{ padding: '16px' }}>
          {/* Category Selection */}
          <IonCard>
            <IonCardContent>
              <IonItem lines="none">
                <IonLabel position="stacked">
                  <h3>Kategorie</h3>
                  <p>Wählen Sie die passende Kategorie für Ihren Kontext</p>
                </IonLabel>
                <IonSelect
                  value={formData.contextType}
                  placeholder="Kategorie auswählen"
                  onIonChange={(e) => {
                    setFormData({ ...formData, contextType: e.detail.value });
                    setErrors({ ...errors, contextType: '' });
                  }}
                  interface="popover"
                  fill="outline"
                >
                  {Object.entries(CONTEXT_TYPE_LABELS).map(([value, label]) => (
                    <IonSelectOption key={value} value={value}>
                      {label}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
              {errors.contextType && (
                <IonText color="danger">
                  <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>{errors.contextType}</p>
                </IonText>
              )}
              {formData.contextType && (
                <IonNote color="medium" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                  <IonIcon icon={informationCircleOutline} style={{ marginRight: '4px' }} />
                  {CONTEXT_TYPE_DESCRIPTIONS[formData.contextType]}
                </IonNote>
              )}
            </IonCardContent>
          </IonCard>

          {/* Content Input */}
          <IonCard>
            <IonCardContent>
              <IonItem lines="none">
                <IonLabel position="stacked">
                  <h3>Inhalt</h3>
                  <p>Beschreiben Sie den Kontext präzise und konkret</p>
                </IonLabel>
                <IonTextarea
                  value={formData.content}
                  placeholder={`Beispiel: ${formData.contextType === 'subject' ? 'Mathematik 10. Klasse - Differentialrechnung' :
                    formData.contextType === 'method' ? 'Flipped Classroom mit digitalen Medien' :
                    formData.contextType === 'challenge' ? 'Motivation schwacher Schüler in der Oberstufe' :
                    'Beschreiben Sie Ihren Kontext...'}`}
                  onIonInput={(e) => {
                    setFormData({ ...formData, content: e.detail.value! });
                    setErrors({ ...errors, content: '' });
                  }}
                  rows={3}
                  maxlength={500}
                  counter={true}
                  fill="outline"
                />
              </IonItem>
              {errors.content && (
                <IonText color="danger">
                  <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>{errors.content}</p>
                </IonText>
              )}
            </IonCardContent>
          </IonCard>

          {/* Advanced Options */}
          <IonCard>
            <IonCardContent>
              <IonItem
                button
                lines="none"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <IonCheckbox
                  checked={showAdvanced}
                  onIonChange={(e) => setShowAdvanced(e.detail.checked)}
                  style={{ marginRight: '12px' }}
                />
                <IonLabel>
                  <h3>Erweiterte Einstellungen</h3>
                  <p>Priorität und weitere Optionen</p>
                </IonLabel>
              </IonItem>

              {showAdvanced && (
                <div style={{ marginTop: '16px' }}>
                  <IonItem lines="none">
                    <IonLabel position="stacked">
                      <h3>Priorität: {formData.priority}/10</h3>
                      <p>{getPriorityLabel(formData.priority)}</p>
                    </IonLabel>
                    <IonRange
                      min={1}
                      max={10}
                      step={1}
                      value={formData.priority}
                      onIonChange={(e) => {
                        setFormData({ ...formData, priority: e.detail.value as number });
                        setErrors({ ...errors, priority: '' });
                      }}
                      color="primary"
                      style={{ width: '100%', marginTop: '8px' }}
                    />
                  </IonItem>
                  {errors.priority && (
                    <IonText color="danger">
                      <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>{errors.priority}</p>
                    </IonText>
                  )}

                  <IonNote color="medium" style={{ fontSize: '12px', lineHeight: '1.4', marginTop: '8px' }}>
                    <IonIcon icon={informationCircleOutline} style={{ marginRight: '4px' }} />
                    Höhere Priorität bedeutet, dass dieser Kontext wichtiger für Ihre Unterrichtsplanung ist
                  </IonNote>
                </div>
              )}
            </IonCardContent>
          </IonCard>

          {/* Submit Button */}
          <div style={{ marginTop: '24px' }}>
            <IonButton
              expand="block"
              onClick={handleSubmit}
              disabled={submitting || !formData.content.trim()}
              color="primary"
            >
              <IonIcon icon={mode === 'create' ? addOutline : checkmarkOutline} slot="start" />
              {submitting ? 'Wird gespeichert...' :
               mode === 'create' ? 'Kontext hinzufügen' : 'Änderungen speichern'}
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default ContextForm;