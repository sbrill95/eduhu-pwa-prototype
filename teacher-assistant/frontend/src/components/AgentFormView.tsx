import React, { useState, useEffect } from 'react';
import { IonButton, IonSpinner } from '@ionic/react';
import { useAgent } from '../lib/AgentContext';
import { ImageGenerationFormData } from '../lib/types';

export const AgentFormView: React.FC = () => {
  const { state, closeModal, submitForm } = useAgent();
  const [submitting, setSubmitting] = useState(false);

  // Initialize form with prefill data - Map backend fields to frontend fields
  const [formData, setFormData] = useState<ImageGenerationFormData>(() => {
    console.log('[AgentFormView] Initializing form with state.formData:', state.formData);

    // Map backend fields (theme, learningGroup) to frontend form fields
    const theme = state.formData.theme || '';
    const learningGroup = state.formData.learningGroup || '';

    // Combine theme and learning group into description
    // Check if theme already contains learningGroup to avoid duplication
    let description = theme;
    if (learningGroup && !theme.includes(learningGroup)) {
      description = theme + ` für ${learningGroup}`;
    }

    const initialData = {
      description: description,
      imageStyle: state.formData.imageStyle || 'realistic'
    };

    console.log('[AgentFormView] Mapped to form data:', initialData);
    return initialData;
  });

  // Update form when state changes (pre-fill support)
  useEffect(() => {
    console.log('[AgentFormView] state.formData changed:', state.formData);

    // Map backend fields (theme, learningGroup) to frontend form fields
    const theme = state.formData.theme || '';
    const learningGroup = state.formData.learningGroup || '';

    // Only update if we have actual data from backend
    if (theme) {
      // Check if theme already contains learningGroup to avoid duplication
      let description = theme;
      if (learningGroup && !theme.includes(learningGroup)) {
        description = theme + ` für ${learningGroup}`;
      }

      console.log('[AgentFormView] Updating form with mapped data:', { description });

      setFormData(prev => ({
        ...prev,
        description: description,
        imageStyle: state.formData.imageStyle || prev.imageStyle
      }));
    }
  }, [state.formData.theme, state.formData.learningGroup, state.formData.imageStyle]);

  // Validation: description required, min 3 characters
  const isValidForm = formData.description.trim().length >= 3;

  const handleSubmit = async () => {
    if (!isValidForm) {
      alert('Bitte beschreibe das Bild (mindestens 3 Zeichen).');
      return;
    }

    try {
      setSubmitting(true);
      console.log('[AgentFormView] Submitting form', formData);

      // Map frontend field names to backend expected format
      const backendFormData = {
        prompt: formData.description,      // description → prompt
        style: formData.imageStyle,         // imageStyle → style
        aspectRatio: '1:1'                  // Default aspect ratio
      };

      console.log('[AgentFormView] Mapped to backend format', backendFormData);
      await submitForm(backendFormData);
    } catch (error) {
      console.error('[AgentFormView] Submit failed', error);
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
          onClick={closeModal}
          disabled={submitting}
          className="w-full text-center text-sm text-gray-600 hover:text-gray-900 transition-colors py-2 disabled:opacity-50"
        >
          Zurück zum Chat
        </button>
      </div>
    </div>
  );
};