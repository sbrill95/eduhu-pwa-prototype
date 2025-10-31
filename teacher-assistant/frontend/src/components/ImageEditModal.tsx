import React, { useState } from 'react';
import { X, Wand2, Type, Palette, Image, Trash2, Loader2, Save, RefreshCw } from 'lucide-react';
import { apiClient } from '../lib/api';
import { useAuth } from '../lib/auth-context';

interface MaterialItem {
  id: string;
  title: string;
  type: string;
  url?: string;
  imageUrl?: string;
  content?: string;
  createdAt: Date;
  metadata?: {
    originalImageId?: string;
    editInstruction?: string;
    version?: number;
  };
}

interface ImageEditModalProps {
  image: MaterialItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (editedImage: MaterialItem) => void;
  dailyUsage?: { used: number; limit: number };
}

const ImageEditModal: React.FC<ImageEditModalProps> = ({
  image,
  isOpen,
  onClose,
  onSave,
  dailyUsage = { used: 0, limit: 20 }
}) => {
  const [instruction, setInstruction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentEditedImage, setCurrentEditedImage] = useState<MaterialItem | null>(null);

  if (!isOpen) return null;

  const imageUrl = image.imageUrl || image.url;
  const canEdit = dailyUsage.used < dailyUsage.limit;

  // Preset operation buttons
  const presetOperations = [
    { icon: Type, label: 'Text hinzufügen', instruction: 'Füge Text hinzu: ' },
    { icon: Palette, label: 'Stil ändern', instruction: 'Ändere den Stil zu ' },
    { icon: Image, label: 'Hintergrund ändern', instruction: 'Ersetze den Hintergrund mit ' },
    { icon: Trash2, label: 'Objekt entfernen', instruction: 'Entferne ' },
    { icon: Wand2, label: 'Farben anpassen', instruction: 'Ändere die Farben zu ' },
  ];

  const handlePresetClick = (preset: string) => {
    setInstruction(preset);
  };

  const { user } = useAuth();

  const handleProcessEdit = async () => {
    if (!instruction.trim()) {
      setError('Bitte geben Sie eine Bearbeitungsanweisung ein');
      return;
    }

    if (!user) {
      setError('Sie müssen angemeldet sein um Bilder zu bearbeiten');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await apiClient.editImage({
        imageId: image.id,
        instruction: instruction,
        userId: user.id,
      });

      setPreviewImage(result.editedImage.url);

      // Store the edited image data for saving
      const editedImageData: MaterialItem = {
        ...image,
        id: result.editedImage.id,
        imageUrl: result.editedImage.url,
        url: result.editedImage.url,
        title: `${image.title} (Bearbeitet)`,
        createdAt: new Date(),
        metadata: {
          originalImageId: result.editedImage.originalImageId,
          editInstruction: result.editedImage.editInstruction,
          version: result.editedImage.version,
        },
      };

      // Update preview and allow user to save
      setCurrentEditedImage(editedImageData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    if (currentEditedImage) {
      onSave(currentEditedImage);
      onClose();
    }
  };

  const handleFurtherEdit = () => {
    setPreviewImage(null);
    setInstruction('');
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      data-testid="edit-modal"
    >
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Bild bearbeiten</h2>
            <p className="text-purple-100 mt-1">
              {canEdit
                ? `${dailyUsage.limit - dailyUsage.used} Bearbeitungen heute verfügbar`
                : 'Tägliches Limit erreicht'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-200px)]">
          {/* Original Image (40%) */}
          <div className="w-[40%] p-6 border-r bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Original</h3>
            <div className="relative rounded-lg overflow-hidden bg-white shadow-md">
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt={image.title}
                  className="w-full h-auto object-contain"
                  data-testid="original-image"
                />
              )}
              {image.metadata?.version && (
                <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                  Version {image.metadata.version}
                </div>
              )}
            </div>
            <div className="mt-3 text-sm text-gray-600">
              <p className="font-medium">{image.title}</p>
              <p className="text-xs mt-1">
                Erstellt: {new Date(image.createdAt).toLocaleDateString('de-DE')}
              </p>
            </div>
          </div>

          {/* Edit Area (60%) */}
          <div className="w-[60%] p-6 flex flex-col">
            {!previewImage ? (
              <>
                {/* Preset Buttons */}
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3">Schnellaktionen</h3>
                  <div className="flex flex-wrap gap-2" data-testid="preset-buttons">
                    {presetOperations.map((preset, index) => {
                      const Icon = preset.icon;
                      return (
                        <button
                          key={index}
                          onClick={() => handlePresetClick(preset.instruction)}
                          disabled={!canEdit}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200
                                   rounded-lg text-sm font-medium text-gray-700 transition-colors
                                   disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Icon className="w-4 h-4" />
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Instruction Input */}
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-600 mb-3">
                    Bearbeitungsanweisung
                  </label>
                  <textarea
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    placeholder="Beschreiben Sie, wie das Bild bearbeitet werden soll..."
                    disabled={!canEdit || isProcessing}
                    className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-purple-500
                             resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="edit-instruction"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Beispiel: "Füge einen blauen Himmel hinzu" oder "Entferne die Person im Hintergrund"
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mt-4 p-3 bg-red-100 border border-red-400 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                {/* Process Button */}
                <div className="mt-6">
                  <button
                    onClick={handleProcessEdit}
                    disabled={!canEdit || isProcessing || !instruction.trim()}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500
                             text-white font-semibold rounded-lg hover:from-purple-600
                             hover:to-pink-600 transition-all duration-200
                             disabled:opacity-50 disabled:cursor-not-allowed
                             flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Bearbeite Bild...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-5 h-5" />
                        Bild bearbeiten
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              /* Preview Section */
              <div className="flex flex-col h-full">
                <h3 className="text-sm font-semibold text-gray-600 mb-3">Vorschau</h3>
                <div className="flex-1 relative rounded-lg overflow-hidden bg-white shadow-md" data-testid="edit-preview">
                  {previewImage && (
                    <img
                      src={previewImage}
                      alt="Bearbeitete Version"
                      className="w-full h-full object-contain"
                      data-testid="preview-image"
                    />
                  )}
                  <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                    Neu bearbeitet
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleSave}
                    className="flex-1 py-3 bg-green-500 text-white font-semibold
                             rounded-lg hover:bg-green-600 transition-colors
                             flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Speichern
                  </button>
                  <button
                    onClick={handleFurtherEdit}
                    className="flex-1 py-3 bg-blue-500 text-white font-semibold
                             rounded-lg hover:bg-blue-600 transition-colors
                             flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Weitere Änderung
                  </button>
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold
                             rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer with Usage Info */}
        {!canEdit && (
          <div className="bg-yellow-50 border-t border-yellow-200 px-6 py-3">
            <p className="text-sm text-yellow-800">
              🔒 Tägliches Limit von {dailyUsage.limit} Bildern erreicht.
              Morgen ab 00:00 Uhr wieder verfügbar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageEditModal;