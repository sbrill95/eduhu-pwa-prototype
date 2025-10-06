import React, { useState, useEffect, useRef } from 'react';
import {
  IonItem,
  IonLabel,
  IonSearchbar,
  IonList,
  IonCheckbox,
  IonChip,
  IonButton,
  IonIcon,
  IonSpinner,
  IonText,
  IonNote,
  IonCard,
  IonCardContent
} from '@ionic/react';
import { checkmark, add, close } from 'ionicons/icons';

export interface SearchableSelectOption {
  id: string;
  name: string;
  description?: string;
  category?: string;
}

export interface SearchableSelectProps {
  label: string;
  placeholder: string;
  options: SearchableSelectOption[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  onSearch: (query: string) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  allowCustom?: boolean;
  multiSelect?: boolean;
  maxSelections?: number;
  required?: boolean;
  disabled?: boolean;
  description?: string;
}

/**
 * Reusable searchable select component for onboarding
 * Supports single/multi-select, custom entries, and backend search
 */
const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  placeholder,
  options,
  selectedValues,
  onSelectionChange,
  onSearch,
  loading = false,
  error = null,
  allowCustom = false,
  multiSelect = false,
  maxSelections,
  required = false,
  disabled = false,
  description,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const searchTimeout = useRef<number | undefined>(undefined);

  // Handle search with debouncing
  const handleSearch = (query: string) => {
    setSearchQuery(query);

    // Clear existing timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Set new timeout for search
    searchTimeout.current = window.setTimeout(() => {
      onSearch(query);
    }, 300); // 300ms debounce
  };

  // Handle option selection
  const handleOptionSelect = (optionId: string, optionName: string) => {
    if (disabled) return;

    let newSelection: string[];

    if (multiSelect) {
      if (selectedValues.includes(optionName)) {
        newSelection = selectedValues.filter(value => value !== optionName);
      } else {
        if (maxSelections && selectedValues.length >= maxSelections) {
          return; // Don't add if max reached
        }
        newSelection = [...selectedValues, optionName];
      }
    } else {
      newSelection = selectedValues.includes(optionName) ? [] : [optionName];
      setShowDropdown(false); // Close dropdown for single select
    }

    onSelectionChange(newSelection);
  };

  // Handle custom value addition
  const handleAddCustom = () => {
    if (!customValue.trim() || disabled) return;

    const trimmedValue = customValue.trim();

    if (multiSelect) {
      if (!selectedValues.includes(trimmedValue)) {
        if (maxSelections && selectedValues.length >= maxSelections) {
          return; // Don't add if max reached
        }
        onSelectionChange([...selectedValues, trimmedValue]);
      }
    } else {
      onSelectionChange([trimmedValue]);
    }

    setCustomValue('');
    setShowCustomInput(false);
    setShowDropdown(false);
  };

  // Remove selected value
  const handleRemoveValue = (value: string) => {
    if (disabled) return;
    onSelectionChange(selectedValues.filter(v => v !== value));
  };

  // Clear search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  // Filter options based on search and selected values (for display)
  const filteredOptions = options.filter(option => {
    // If multiSelect, don't show already selected options
    if (multiSelect && selectedValues.includes(option.name)) {
      return false;
    }
    return true;
  });

  return (
    <div className="searchable-select">
      <IonLabel className="ion-margin-bottom">
        <h2 className="text-base font-medium text-gray-900">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </h2>
        {description && (
          <IonNote className="text-sm text-gray-600 block mt-1">
            {description}
          </IonNote>
        )}
      </IonLabel>

      {/* Selected Values Display */}
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedValues.map((value, index) => (
            <IonChip
              key={index}
              color="primary"
              className="selected-chip"
            >
              <IonLabel>{value}</IonLabel>
              {!disabled && (
                <IonIcon
                  icon={close}
                  onClick={() => handleRemoveValue(value)}
                  className="cursor-pointer"
                />
              )}
            </IonChip>
          ))}
        </div>
      )}

      {/* Search Input */}
      <IonSearchbar
        value={searchQuery}
        placeholder={placeholder}
        onIonInput={(e) => handleSearch(e.detail.value!)}
        onIonFocus={() => setShowDropdown(true)}
        disabled={disabled}
        className="searchable-select-input"
      />

      {/* Dropdown */}
      {showDropdown && !disabled && (
        <IonCard className="dropdown-card mt-2">
          <IonCardContent className="p-0">
            {/* Loading State */}
            {loading && (
              <IonItem>
                <IonSpinner name="crescent" slot="start" />
                <IonLabel>Suche läuft...</IonLabel>
              </IonItem>
            )}

            {/* Error State */}
            {error && (
              <IonItem color="danger">
                <IonLabel>
                  <IonText color="danger">Fehler: {error}</IonText>
                </IonLabel>
              </IonItem>
            )}

            {/* Options List */}
            {!loading && !error && (
              <IonList>
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => (
                    <IonItem
                      key={option.id}
                      button
                      onClick={() => handleOptionSelect(option.id, option.name)}
                      className="option-item"
                    >
                      {multiSelect && (
                        <IonCheckbox
                          slot="start"
                          checked={selectedValues.includes(option.name)}
                        />
                      )}
                      <IonLabel>
                        <h3>{option.name}</h3>
                        {option.description && (
                          <p className="text-sm text-gray-600">{option.description}</p>
                        )}
                        {option.category && (
                          <IonNote className="text-xs">{option.category}</IonNote>
                        )}
                      </IonLabel>
                      {!multiSelect && selectedValues.includes(option.name) && (
                        <IonIcon icon={checkmark} slot="end" color="primary" />
                      )}
                    </IonItem>
                  ))
                ) : (
                  <IonItem>
                    <IonLabel>
                      <IonText color="medium">
                        Keine Ergebnisse gefunden
                      </IonText>
                    </IonLabel>
                  </IonItem>
                )}

                {/* Custom Input Option */}
                {allowCustom && (
                  <>
                    {!showCustomInput ? (
                      <IonItem
                        button
                        onClick={() => setShowCustomInput(true)}
                        className="custom-option-trigger"
                      >
                        <IonIcon icon={add} slot="start" color="primary" />
                        <IonLabel color="primary">
                          Eigenen Eintrag hinzufügen
                        </IonLabel>
                      </IonItem>
                    ) : (
                      <IonItem>
                        <IonLabel position="stacked">Eigener Eintrag:</IonLabel>
                        <div className="flex w-full gap-2 mt-2">
                          <input
                            type="text"
                            value={customValue}
                            onChange={(e) => setCustomValue(e.target.value)}
                            placeholder="Eintrag eingeben..."
                            className="flex-1 p-2 border border-gray-300 rounded"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleAddCustom();
                              }
                            }}
                            autoFocus
                          />
                          <IonButton
                            size="small"
                            onClick={handleAddCustom}
                            disabled={!customValue.trim()}
                          >
                            <IonIcon icon={checkmark} />
                          </IonButton>
                          <IonButton
                            size="small"
                            fill="clear"
                            onClick={() => {
                              setShowCustomInput(false);
                              setCustomValue('');
                            }}
                          >
                            <IonIcon icon={close} />
                          </IonButton>
                        </div>
                      </IonItem>
                    )}
                  </>
                )}
              </IonList>
            )}

            {/* Close Dropdown Button */}
            <IonItem>
              <IonButton
                fill="clear"
                expand="full"
                onClick={() => setShowDropdown(false)}
              >
                Schließen
              </IonButton>
            </IonItem>
          </IonCardContent>
        </IonCard>
      )}

      {/* Selection Limit Info */}
      {multiSelect && maxSelections && (
        <IonNote className="text-xs text-gray-500 mt-1 block">
          {selectedValues.length} von {maxSelections} ausgewählt
        </IonNote>
      )}
    </div>
  );
};

export default SearchableSelect;