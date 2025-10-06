import React, { useState, useEffect } from 'react';
import {
  IonIcon,
  IonSpinner,
  IonToast,
  IonProgressBar,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonButtons,
  IonItem,
  IonList,
  IonInput,
  IonText,
  IonChip,
  IonAvatar
} from '@ionic/react';
import {
  chevronBack,
  chevronForward,
  checkmark,
  school,
  person,
  location,
  bookmark,
  close,
  arrowForward,
  starOutline,
  star,
  bookOutline,
  bulbOutline
} from 'ionicons/icons';
import SearchableSelect from './SearchableSelect';
import { useOnboarding } from '../hooks/useOnboarding';
import { useDataSearch } from '../hooks/useDataSearch';
import type { OnboardingData } from '../lib/types';

export interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip?: () => void;
  allowSkip?: boolean;
}

interface OnboardingFormData {
  name: string;
  germanState: string;
  subjects: string[];
  gradeLevel: string;
  teachingPreferences: string[];
  school: string;
}

const TOTAL_STEPS = 4;

/**
 * Professional OnboardingWizard component
 * Modern step-by-step guided setup with proper responsive design
 */
const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  onComplete,
  onSkip,
  allowSkip = true
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingFormData>({
    name: '',
    germanState: '',
    subjects: [],
    gradeLevel: '',
    teachingPreferences: [],
    school: '',
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const { saveOnboardingData, loading: onboardingLoading, error: onboardingError } = useOnboarding();
  const {
    states,
    statesLoading,
    statesError,
    searchStates,
    subjects,
    subjectsLoading,
    subjectsError,
    searchSubjects,
    preferences,
    preferencesLoading,
    preferencesError,
    searchPreferences,
  } = useDataSearch();

  // Progress calculation
  const progress = currentStep / TOTAL_STEPS;

  // Validation for each step
  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return true; // Welcome step - no validation needed
      case 2:
        return formData.name.trim().length > 0 && formData.germanState.trim().length > 0;
      case 3:
        return formData.subjects.length > 0 && formData.gradeLevel.trim().length > 0;
      case 4:
        return formData.teachingPreferences.length > 0;
      default:
        return false;
    }
  };

  // Navigation handlers with smooth transitions
  const goToNextStep = () => {
    if (currentStep < TOTAL_STEPS && isStepValid(currentStep) && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsTransitioning(false);
      }, 200);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1 && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsTransitioning(false);
      }, 200);
    }
  };

  // Handle exit confirmation - allow exit from any step
  const handleExitAttempt = () => {
    if (allowSkip && onSkip) {
      setShowExitConfirm(true);
    }
  };

  const confirmExit = () => {
    setShowExitConfirm(false);
    if (onSkip) {
      onSkip();
    }
  };

  // Form data update handlers
  const updateFormData = (field: keyof OnboardingFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Complete onboarding with success animation
  const handleComplete = async () => {
    if (!isStepValid(currentStep)) {
      setToastMessage('Bitte füllen Sie alle erforderlichen Felder aus.');
      setShowToast(true);
      return;
    }

    try {
      const onboardingData: Omit<OnboardingData, 'userId'> = {
        name: formData.name.trim(),
        germanState: formData.germanState,
        subjects: formData.subjects,
        gradeLevel: formData.gradeLevel,
        teachingPreferences: formData.teachingPreferences,
        school: formData.school.trim() || undefined,
        role: 'teacher',
      };

      await saveOnboardingData(onboardingData);

      // Show success animation briefly before completing
      setToastMessage('🎉 Willkommen bei eduhu.app! Ihr Profil wurde erfolgreich erstellt.');
      setShowToast(true);

      // Add a slight delay to show the success message
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setToastMessage('Fehler beim Speichern der Daten. Bitte versuchen Sie es erneut.');
      setShowToast(true);
    }
  };

  // Grade level options (German education system)
  const gradeLevelOptions = [
    { id: '1-4', name: 'Klasse 1-4 (Grundschule)', description: 'Grundschule' },
    { id: '5-6', name: 'Klasse 5-6 (Orientierungsstufe)', description: 'Orientierungsstufe' },
    { id: '7-10', name: 'Klasse 7-10 (Sekundarstufe I)', description: 'Sekundarstufe I' },
    { id: '11-13', name: 'Klasse 11-13 (Sekundarstufe II)', description: 'Gymnasium/Gesamtschule' },
    { id: 'berufsschule', name: 'Berufsschule', description: 'Berufliche Bildung' },
    { id: 'erwachsenenbildung', name: 'Erwachsenenbildung', description: 'Weiterbildung' },
  ];

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center py-8">
            {/* Welcome Icon - FIXED SIZE, NO OVERFLOW */}
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <IonIcon icon={school} className="text-white text-2xl" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Willkommen bei eduhu.app!
            </h1>
            <p className="text-gray-600 mb-8 text-base leading-relaxed max-w-md mx-auto">
              Ihr persönlicher KI-Assistent für den Lehralltag. Lassen Sie uns Ihre Erfahrung personalisieren.
            </p>

            {/* Feature List - Compact Design */}
            <div className="space-y-3 text-left max-w-sm mx-auto">
              {[
                { icon: person, text: 'Personalisierte Unterstützung' },
                { icon: bookmark, text: 'Passende Materialien' },
                { icon: checkmark, text: 'KI-gestützte Planung' }
              ].map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-100"
                >
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <IonIcon icon={feature.icon} className="text-white text-xs" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="py-4">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <IonIcon icon={person} className="text-blue-600 text-lg" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Persönliche Informationen
                </h2>
                <p className="text-sm text-gray-500">Grundlegende Angaben zu Ihrer Person</p>
              </div>
            </div>

            <IonList>
              {/* Name Input */}
              <IonItem>
                <IonInput
                  type="text"
                  value={formData.name}
                  onIonInput={(e) => updateFormData('name', e.detail.value!)}
                  placeholder="Ihr vollständiger Name"
                  label="Name"
                  labelPlacement="stacked"
                  required
                  clearInput
                  counter
                  maxlength={100}
                />
              </IonItem>

              {/* State Selection - Using local data for now */}
              <IonItem>
                <IonInput
                  type="text"
                  value={formData.germanState}
                  onIonInput={(e) => updateFormData('germanState', e.detail.value!)}
                  placeholder="z.B. Nordrhein-Westfalen, Bayern, Berlin..."
                  label="Bundesland"
                  labelPlacement="stacked"
                  required
                  clearInput
                />
                <datalist id="german-states">
                  <option value="Baden-Württemberg" />
                  <option value="Bayern" />
                  <option value="Berlin" />
                  <option value="Brandenburg" />
                  <option value="Bremen" />
                  <option value="Hamburg" />
                  <option value="Hessen" />
                  <option value="Mecklenburg-Vorpommern" />
                  <option value="Niedersachsen" />
                  <option value="Nordrhein-Westfalen" />
                  <option value="Rheinland-Pfalz" />
                  <option value="Saarland" />
                  <option value="Sachsen" />
                  <option value="Sachsen-Anhalt" />
                  <option value="Schleswig-Holstein" />
                  <option value="Thüringen" />
                </datalist>
              </IonItem>

              {/* School Input */}
              <IonItem>
                <IonInput
                  type="text"
                  value={formData.school}
                  onIonInput={(e) => updateFormData('school', e.detail.value!)}
                  placeholder="Name Ihrer Schule"
                  label="Schule (optional)"
                  labelPlacement="stacked"
                  clearInput
                  counter
                  maxlength={200}
                />
              </IonItem>
            </IonList>
          </div>
        );

      case 3:
        return (
          <div className="py-4">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <IonIcon icon={bookOutline} className="text-green-600 text-lg" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Unterrichtsfächer & Klassenstufen
                </h2>
                <p className="text-sm text-gray-500">Was und wen unterrichten Sie?</p>
              </div>
            </div>

            <IonList>
              {/* Subjects Input */}
              <IonItem>
                <IonInput
                  type="text"
                  value={formData.subjects.join(', ')}
                  onIonInput={(e) => {
                    const value = e.detail.value || '';
                    const subjects = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
                    updateFormData('subjects', subjects.slice(0, 5)); // Max 5 subjects
                  }}
                  placeholder="z.B. Mathematik, Deutsch, Englisch..."
                  label="Unterrichtsfächer (bis zu 5, getrennt durch Komma)"
                  labelPlacement="stacked"
                  required
                  clearInput
                  counter
                  maxlength={200}
                />
                <datalist id="teaching-subjects">
                  <option value="Mathematik" />
                  <option value="Deutsch" />
                  <option value="Englisch" />
                  <option value="Französisch" />
                  <option value="Spanisch" />
                  <option value="Latein" />
                  <option value="Geschichte" />
                  <option value="Geographie" />
                  <option value="Politik" />
                  <option value="Wirtschaft" />
                  <option value="Biologie" />
                  <option value="Chemie" />
                  <option value="Physik" />
                  <option value="Informatik" />
                  <option value="Kunst" />
                  <option value="Musik" />
                  <option value="Sport" />
                  <option value="Religion" />
                  <option value="Ethik" />
                  <option value="Philosophie" />
                </datalist>
              </IonItem>

              {/* Grade Level Selection */}
              <IonItem>
                <IonInput
                  type="text"
                  value={formData.gradeLevel}
                  onIonInput={(e) => updateFormData('gradeLevel', e.detail.value!)}
                  placeholder="Klassenstufe auswählen..."
                  label="Klassenstufe"
                  labelPlacement="stacked"
                  required
                />
                <datalist id="grade-levels">
                  <option value="1-4">Klasse 1-4 (Grundschule)</option>
                  <option value="5-6">Klasse 5-6 (Orientierungsstufe)</option>
                  <option value="7-10">Klasse 7-10 (Sekundarstufe I)</option>
                  <option value="11-13">Klasse 11-13 (Sekundarstufe II)</option>
                  <option value="berufsschule">Berufsschule</option>
                  <option value="erwachsenenbildung">Erwachsenenbildung</option>
                </datalist>
              </IonItem>
            </IonList>
          </div>
        );

      case 4:
        return (
          <div className="py-4">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <IonIcon icon={bulbOutline} className="text-purple-600 text-lg" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Lehrpräferenzen & Methoden
                </h2>
                <p className="text-sm text-gray-500">Ihre bevorzugten Unterrichtsansätze</p>
              </div>
            </div>

            <IonList>
              {/* Teaching Preferences Input */}
              <IonItem>
                <IonInput
                  type="text"
                  value={formData.teachingPreferences.join(', ')}
                  onIonInput={(e) => {
                    const value = e.detail.value || '';
                    const preferences = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
                    updateFormData('teachingPreferences', preferences.slice(0, 8)); // Max 8 preferences
                  }}
                  placeholder="z.B. Projektarbeit, Gruppenlernen, Differenzierung..."
                  label="Bevorzugte Lehrmethoden (bis zu 8, getrennt durch Komma)"
                  labelPlacement="stacked"
                  required
                  clearInput
                  counter
                  maxlength={300}
                />
                <datalist id="teaching-methods">
                  <option value="Projektarbeit" />
                  <option value="Gruppenlernen" />
                  <option value="Differenzierung" />
                  <option value="Digitale Medien" />
                  <option value="Gamification" />
                  <option value="Flipped Classroom" />
                  <option value="Kooperatives Lernen" />
                  <option value="Problemorientiertes Lernen" />
                  <option value="Individualisierung" />
                  <option value="Kompetenzorientierung" />
                  <option value="Handlungsorientierung" />
                  <option value="Interdisziplinäres Lernen" />
                  <option value="Peer Learning" />
                  <option value="Selbstgesteuertes Lernen" />
                  <option value="Methodenvielfalt" />
                  <option value="Konstruktivismus" />
                </datalist>
              </IonItem>

              {/* Completion Message */}
              <IonItem lines="none" className="mt-4">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 w-full">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <IonIcon icon={checkmark} className="text-white text-sm" />
                    </div>
                    <div>
                      <h4 className="text-green-800 font-medium text-sm mb-1">Fast geschafft!</h4>
                      <p className="text-green-700 text-sm leading-relaxed">
                        Diese Informationen helfen uns dabei, personalisierte Empfehlungen und
                        Materialien für Ihren Unterricht zu erstellen.
                      </p>
                    </div>
                  </div>
                </div>
              </IonItem>
            </IonList>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* FIXED HEADER - No Fixed Positioning Issues */}
      <div className="bg-white shadow-sm border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            {/* FIXED LOGO SIZE - 24px max */}
            <img
              src="/eduhu-logo.svg"
              alt="eduhu"
              className="h-6 w-6 object-contain flex-shrink-0"
              style={{ maxWidth: '24px', maxHeight: '24px' }}
            />
            <span className="text-lg font-semibold text-gray-900">Einrichtung</span>
          </div>

          {allowSkip && (
            <IonButton
              fill="clear"
              onClick={handleExitAttempt}
              className="min-w-[44px] min-h-[44px]"
              aria-label="Überspringen"
            >
              <IonIcon icon={close} className="text-gray-500 text-xl" />
            </IonButton>
          )}
        </div>

        {/* Standard Ionic Progress Bar */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <IonText color="medium">
              <small>Schritt {currentStep} von {TOTAL_STEPS}</small>
            </IonText>
            <IonText color="medium">
              <small>{Math.round(progress * 100)}% abgeschlossen</small>
            </IonText>
          </div>

          <IonProgressBar value={progress} color="primary" />

          {/* Step Indicators using IonChip */}
          <div className="flex justify-center space-x-2 mt-3">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => {
              const stepNum = i + 1;
              const isCompleted = stepNum < currentStep;
              const isCurrent = stepNum === currentStep;

              return (
                <IonChip
                  key={stepNum}
                  color={isCompleted ? 'success' : isCurrent ? 'primary' : 'medium'}
                  className="min-w-[32px] min-h-[32px] text-xs"
                >
                  {isCompleted ? (
                    <IonIcon icon={checkmark} className="text-sm" />
                  ) : (
                    <IonText className="text-sm font-medium">{stepNum}</IonText>
                  )}
                </IonChip>
              );
            })}
          </div>
        </div>
      </div>

      {/* SCROLLABLE MAIN CONTENT - Proper Layout */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-lg mx-auto p-4">
          {/* Step Content using IonCard */}
          <IonCard className={`w-full ${isTransitioning ? 'ion-card-transitioning' : ''}`}>
            <IonCardContent className="p-6">
              {renderStepContent()}
            </IonCardContent>
          </IonCard>

          {/* Error Display */}
          {onboardingError && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <IonIcon icon={close} className="text-red-500 text-lg mt-0.5" />
                <div>
                  <h4 className="text-red-800 font-medium text-sm">Fehler</h4>
                  <p className="text-red-700 text-sm mt-1">{onboardingError}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FIXED FOOTER using Ionic Buttons */}
      <div className="bg-white border-t border-gray-100 px-4 py-4 flex-shrink-0">
        <div className="w-full max-w-lg mx-auto">
          <div className="flex justify-between items-center gap-4">
            {/* Back Button */}
            <IonButton
              fill="clear"
              onClick={goToPreviousStep}
              disabled={currentStep === 1 || isTransitioning}
              size="default"
              className="flex-shrink-0"
            >
              <IonIcon icon={chevronBack} slot="start" />
              Zurück
            </IonButton>

            {/* Spacer */}
            <div className="flex-1"></div>

            {/* Skip Option (only on first step) */}
            {currentStep === 1 && onSkip && allowSkip && (
              <IonButton
                fill="clear"
                color="medium"
                onClick={onSkip}
                size="default"
                className="flex-shrink-0"
              >
                Überspringen
              </IonButton>
            )}

            {/* Next/Complete Button */}
            {currentStep < TOTAL_STEPS ? (
              <IonButton
                onClick={goToNextStep}
                disabled={!isStepValid(currentStep) || isTransitioning}
                size="default"
                color="primary"
                className="flex-shrink-0"
              >
                {isTransitioning ? (
                  <IonSpinner name="crescent" slot="start" />
                ) : (
                  <IonIcon icon={chevronForward} slot="end" />
                )}
                Weiter
              </IonButton>
            ) : (
              <IonButton
                onClick={handleComplete}
                disabled={!isStepValid(currentStep) || onboardingLoading}
                size="default"
                color="success"
                className="flex-shrink-0"
              >
                {onboardingLoading ? (
                  <IonSpinner name="crescent" slot="start" />
                ) : (
                  <IonIcon icon={checkmark} slot="start" />
                )}
                {onboardingLoading ? 'Wird gespeichert...' : 'Fertigstellen'}
              </IonButton>
            )}
          </div>
        </div>
      </div>

      {/* Toast for notifications */}
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        position="top"
      />

      {/* Exit Confirmation Modal - Fixed Positioning OK for Modals */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <IonIcon icon={school} className="text-blue-600 text-3xl" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Einrichtung abbrechen?</h2>
            <p className="text-gray-600 text-sm mb-6">
              Ihre Angaben gehen verloren und Sie können die App später erneut einrichten.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Zurück
              </button>
              <button
                onClick={confirmExit}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingWizard;