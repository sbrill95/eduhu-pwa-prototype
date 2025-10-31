import React from 'react';

/**
 * Router Override Component (AC5)
 *
 * Displays when router confidence < 0.9, allowing manual agent selection.
 * Shown inline in chat for less disruptive UX.
 */

export interface RouterOverrideProps {
  /** Detected intent from router */
  detectedIntent: 'create' | 'edit';
  /** Confidence score (0-1) */
  confidence: number;
  /** Callback when user selects an intent */
  onSelect: (intent: 'create' | 'edit') => void;
  /** Callback when user confirms detected intent */
  onConfirm: () => void;
}

export const RouterOverride: React.FC<RouterOverrideProps> = ({
  detectedIntent,
  confidence,
  onSelect,
  onConfirm,
}) => {
  const confidencePercent = Math.round(confidence * 100);

  // Determine confidence level color
  const getConfidenceColor = () => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get German text for intent
  const getIntentText = (intent: 'create' | 'edit') => {
    return intent === 'create' ? 'Neues Bild erstellen' : 'Bestehendes Bild bearbeiten';
  };

  return (
    <div data-testid="router-override" className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <svg
          className="w-5 h-5 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="font-semibold text-blue-900">
          Ich denke, du möchtest ein Bild{' '}
          {detectedIntent === 'create' ? 'erstellen' : 'bearbeiten'}
        </h3>
      </div>

      {/* Confidence Display */}
      <div className="mb-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">Sicherheit:</span>
          <span className={`font-semibold ${getConfidenceColor()}`}>
            {confidencePercent}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${confidencePercent}%` }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Confirm Button */}
        <button
          data-testid="confirm-button"
          onClick={onConfirm}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
        >
          ✓ Ja, das stimmt
        </button>

        {/* Override Dropdown */}
        <div className="flex-1 flex flex-col gap-1">
          <span className="text-xs text-gray-600">Nicht richtig? Wähle manuell:</span>
          <div className="flex gap-2">
            <button
              data-testid="create-button"
              onClick={() => onSelect('create')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                detectedIntent === 'create'
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
              }`}
              disabled={detectedIntent === 'create'}
            >
              🎨 Erstellen
            </button>
            <button
              data-testid="edit-button"
              onClick={() => onSelect('edit')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                detectedIntent === 'edit'
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
              }`}
              disabled={detectedIntent === 'edit'}
            >
              ✏️ Bearbeiten
            </button>
          </div>
        </div>
      </div>

      {/* Help Text */}
      <p className="text-xs text-gray-500 mt-3">
        Deine Auswahl wird gespeichert, um die Erkennung zu verbessern.
      </p>
    </div>
  );
};

export default RouterOverride;
