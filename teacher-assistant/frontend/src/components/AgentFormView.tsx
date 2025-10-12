import React, { useState, useEffect } from 'react';
import { IonButton, IonSpinner } from '@ionic/react';
import { useAgent } from '../lib/AgentContext';
import { ImageGenerationFormData, ImageGenerationPrefillData } from '../lib/types';
import { logger } from '../lib/logger';

export const AgentFormView: React.FC = () => {
  const { state, closeModal, submitForm } = useAgent();
  const [submitting, setSubmitting] = useState(false);

  // T036: Log agent open event when component mounts
  useEffect(() => {
    logger.agentLifecycle('open', {
      agentType: state.agentType || 'image-generation',
      hasPrefillData: Object.keys(state.formData).length > 0,
      sessionId: state.sessionId || undefined
    });
  }, []); // Empty dependency array - log once on mount

  // T028-T029: Initialize form with prefill data from shared ImageGenerationPrefillData type
  // T029: Pre-fill form fields from originalParams when metadata exists and is valid
  // T028: Graceful degradation - use empty strings when metadata is null or invalid (per FR-008, CHK111)
  const [formData, setFormData] = useState<ImageGenerationFormData>(() => {
    console.log('[AgentFormView] Initializing form with state.formData:', state.formData);

    // Cast to shared type for type safety
    const prefillData = state.formData as Partial<ImageGenerationPrefillData>;

    // T029: Extract from originalParams if present (parsed by MaterialPreviewModal from FR-004 JSON string)
    // T028: If metadata was null, these fields will be empty strings (graceful degradation)
    const description = prefillData.description || '';
    const learningGroup = prefillData.learningGroup || '';
    const imageStyle = prefillData.imageStyle || 'realistic';

    // Combine description and learning group if needed
    let finalDescription = description;
    if (learningGroup && !description.includes(learningGroup)) {
      finalDescription = description + ` für ${learningGroup}`;
    }

    const initialData = {
      description: finalDescription,
      imageStyle: (imageStyle as ImageGenerationFormData['imageStyle']) || 'realistic'
    };

    console.log('[AgentFormView] Mapped to form data (T028-T029):', initialData);
    return initialData;
  });

  // Update form when state changes (pre-fill support)
  useEffect(() => {
    console.log('[AgentFormView] state.formData changed:', state.formData);

    // Cast to shared type for type safety
    const prefillData = state.formData as Partial<ImageGenerationPrefillData>;

    // Get description and learningGroup from shared type
    const description = prefillData.description || '';
    const learningGroup = prefillData.learningGroup || '';

    // Only update if we have actual data from backend
    if (description) {
      // Check if description already contains learningGroup to avoid duplication
      let finalDescription = description;
      if (learningGroup && !description.includes(learningGroup)) {
        finalDescription = description + ` für ${learningGroup}`;
      }

      console.log('[AgentFormView] Updating form with mapped data:', { finalDescription });

      setFormData(prev => ({
        ...prev,
        description: finalDescription,
        imageStyle: (prefillData.imageStyle as ImageGenerationFormData['imageStyle']) || prev.imageStyle
      }));
    }
  }, [state.formData]);

  // Validation: description required, min 3 characters
  const isValidForm = formData.description.trim().length >= 3;

  // T036: Handle close with logging
  const handleClose = () => {
    logger.agentLifecycle('close', {
      agentType: state.agentType || 'image-generation',
      formCompleted: false,
      sessionId: state.sessionId || undefined
    });
    closeModal();
  };

  const handleSubmit = async () => {
    console.log('[AgentFormView] 🚀 SUBMIT TRIGGERED', {
      timestamp: new Date().toISOString(),
      isValidForm,
      submitting,
      formData,
      agentType: state.agentType
    });

    if (!isValidForm) {
      console.warn('[AgentFormView] ❌ VALIDATION FAILED - description too short');
      alert('Bitte beschreibe das Bild (mindestens 3 Zeichen).');
      return;
    }

    if (submitting) {
      console.warn('[AgentFormView] ⚠️  Already submitting, skipping duplicate submit');
      return;
    }

    try {
      setSubmitting(true);
      console.log('[AgentFormView] ✅ Validation passed, submitting form', formData);

      // T036: Log agent submit event
      logger.agentLifecycle('submit', {
        agentType: state.agentType || 'image-generation',
        formData: {
          descriptionLength: formData.description.length,
          imageStyle: formData.imageStyle
        },
        sessionId: state.sessionId || undefined
      });

      // BUG-027 FIX: Send correct field names for backend
      // Backend expects: { description, imageStyle, learningGroup, subject }
      const backendFormData = {
        description: formData.description,  // Keep as 'description'
        imageStyle: formData.imageStyle,    // Keep as 'imageStyle'
        learningGroup: '',                  // Optional - extracted from description if needed
        subject: ''                         // Optional - extracted from description if needed
      };

      console.log('[AgentFormView] 📤 Calling submitForm with:', backendFormData);
      await submitForm(backendFormData);
      console.log('[AgentFormView] 🎉 submitForm completed successfully');
    } catch (error) {
      console.error('[AgentFormView] ❌ Submit failed', error);
      alert('Fehler beim Starten. Bitte versuche es erneut.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-teal/10 flex flex-col">
      {/* Header - NO back arrow, NO X button per spec */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <h1 className="text-xl font-semibold text-primary">Bildgenerierung</h1>
      </header>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-32">
        <div className="max-w-md mx-auto space-y-6">
          {/* Subtitle */}
          <p className="text-sm text-gray-600">
            Erstelle ein maßgeschneidertes Bild für deinen Unterricht.
          </p>

          {/* Description Field (Textarea) */}
          <div>
            <label htmlFor="description-input" className="block text-sm font-medium text-gray-700 mb-2">
              Was soll das Bild zeigen?
            </label>
            <textarea
              id="description-input"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 min-h-[120px] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
              placeholder="z.B. Ein Diagramm zur Photosynthese mit beschrifteten Chloroplasten für Klasse 7"
              rows={4}
              required
            />
          </div>

          {/* Image Style Field (Dropdown) */}
          <div>
            <label htmlFor="image-style-select" className="block text-sm font-medium text-gray-700 mb-2">
              Bildstil
            </label>
            <select
              id="image-style-select"
              value={formData.imageStyle}
              onChange={(e) => setFormData({ ...formData, imageStyle: e.target.value as ImageGenerationFormData['imageStyle'] })}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            >
              <option value="realistic">Realistisch</option>
              <option value="cartoon">Cartoon</option>
              <option value="illustrative">Illustrativ</option>
              <option value="abstract">Abstrakt</option>
            </select>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 space-y-3 safe-area-bottom">
        {/* Primary Button: Bild generieren */}
        <IonButton
          expand="block"
          onClick={handleSubmit}
          disabled={!isValidForm || submitting}
          className="h-12 text-base font-medium"
          data-testid="generate-image-button"
          style={{
            '--background': isValidForm && !submitting ? '#FB6542' : '#ccc',
            '--background-hover': '#E85A36',
            '--background-activated': '#D14F2F',
            '--color': '#fff'
          } as React.CSSProperties}
        >
          {submitting ? (
            <>
              <IonSpinner name="crescent" className="mr-2" />
              Generiere Bild...
            </>
          ) : (
            'Bild generieren'
          )}
        </IonButton>

        {/* Secondary Button: Zurück zum Chat */}
        <button
          onClick={handleClose}
          disabled={submitting}
          className="w-full text-center text-sm text-gray-600 hover:text-gray-900 transition-colors py-2 disabled:opacity-50"
        >
          Zurück zum Chat
        </button>
      </div>
    </div>
  );
};