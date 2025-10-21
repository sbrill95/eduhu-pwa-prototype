# Story: Image Editing Sub-Agent with Gemini

**Epic:** 3.1 - Image Agent: Creation + Editing
**Story ID:** epic-3.1.story-2
**Created:** 2025-10-20
**Updated:** 2025-10-20 (mit Steffens Spezifikationen)
**Status:** Ready for Development
**Priority:** P0 (Critical)
**Sprint:** Week 6-7
**Assignee:** Dev Agent

## Context

Nach der Gemini API Integration (Story 3.1.1) implementieren wir den Image Editing Sub-Agent, der bestehende Bilder mit natürlicher Sprache bearbeiten kann.

### Spezifikationen von Steffen

1. **Bildformate**: PNG, JPEG, WebP, HEIC, HEIF (Gemini API unterstützt alle)
2. **Max Dateigröße**: 20 MB (Gemini Empfehlung)
3. **DALL-E Bilder bearbeiten**: Ja, alle Bilder können bearbeitet werden
4. **Versionierung**: Original immer behalten, unbegrenzte Versionen
5. **Speichern**: Immer automatisch, mit Preview vor dem Speichern
6. **Limit**: 20 Bilder/Tag (Create + Edit zusammen)

## User Story

**Als** Lehrer mit einem generierten Bild
**Möchte ich** das Bild mit natürlichen deutschen Anweisungen bearbeiten
**Damit** ich nicht komplett neu generieren muss

## Acceptance Criteria

### AC1: Edit Modal Implementation
- [ ] "Bearbeiten" Button bei jedem Bild in der Library
- [ ] Edit Modal öffnet sich mit:
  - Original Bild links (40% Breite)
  - Edit-Bereich rechts (60% Breite)
  - Eingabefeld für Bearbeitungsanweisung
  - Preset-Buttons für häufige Operationen
- [ ] Preview wird nach Bearbeitung angezeigt
- [ ] Buttons: "Speichern", "Weitere Änderung", "Abbrechen"

### AC2: Edit Operations
- [ ] **Text hinzufügen**: "Füge 'Klasse 5b' oben rechts hinzu"
- [ ] **Objekte hinzufügen**: "Füge einen Dinosaurier im Hintergrund hinzu"
- [ ] **Objekte entfernen**: "Entferne die Person links"
- [ ] **Stil ändern**: "Mache es im Cartoon-Stil"
- [ ] **Farben anpassen**: "Ändere den Himmel zu Sonnenuntergang"
- [ ] **Hintergrund ändern**: "Ersetze Hintergrund mit Klassenzimmer"

### AC3: Natural Language Processing (German)
- [ ] Versteht deutsche Anweisungen:
  - "ändere", "bearbeite", "füge hinzu", "entferne"
  - "mache", "ersetze", "verschiebe", "vergrößere"
- [ ] Kontextverständnis:
  - "das rote Auto" → identifiziert spezifisches Objekt
  - "alle Personen" → multiple Objekte
  - "im Vordergrund" → räumliche Anweisungen

### AC4: Image Reference Resolution
- [ ] Natürliche Sprache Referenzen:
  - "das letzte Bild"
  - "das Bild von gestern"
  - "das Dinosaurier-Bild"
- [ ] Bei Unklarheit:
  - System fragt nach: "Welches Bild meinst du?"
  - Zeigt Mini-Vorschau der letzten 3-4 Bilder im Chat
  - User kann per Klick auswählen
- [ ] Direkte Referenz aus Library möglich

### AC5: Gemini Integration
- [ ] API Call zu Gemini 2.5 Flash Image
- [ ] Unterstützte Formate: PNG, JPEG, WebP, HEIC, HEIF
- [ ] Max Dateigröße: 20 MB
- [ ] Base64 Encoding für Bilder < 20 MB
- [ ] File API für größere Dateien
- [ ] SynthID Watermark wird automatisch hinzugefügt

### AC6: Usage Tracking
- [ ] Combined Limit: 20 Bilder/Tag (Create + Edit)
- [ ] Counter in UI: "15/20 Bilder heute verwendet"
- [ ] Reset um Mitternacht (User Timezone)
- [ ] Bei Limit erreicht: "Tägliches Limit erreicht. Morgen wieder verfügbar."
- [ ] Admin Dashboard zeigt Gemini Kosten ($0.039/Bild)

### AC7: Version Management
- [ ] Original wird IMMER behalten (nie überschrieben)
- [ ] Unbegrenzte Edit-Versionen pro Bild
- [ ] Jede Version einzeln in Library gespeichert
- [ ] Keine Gruppierung (jedes Bild standalone)
- [ ] Versions-Metadata:
  ```typescript
  {
    originalImageId?: string,
    editInstruction: string,
    createdAt: Date,
    version: number
  }
  ```

### AC8: Error Handling
- [ ] Gemini API Fehler: "Bearbeitung fehlgeschlagen. Bitte erneut versuchen."
- [ ] Timeout nach 30 Sekunden
- [ ] Rate Limit: Warnung bei 18/20 Bildern
- [ ] Unsupported Format: "Bitte PNG, JPEG oder WebP verwenden"

## Technical Implementation

### Edit Modal Component
```typescript
// teacher-assistant/frontend/src/components/ImageEditModal.tsx
interface ImageEditModalProps {
  image: MaterialItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (editedImage: MaterialItem) => void;
}

const ImageEditModal: React.FC<ImageEditModalProps> = ({
  image,
  isOpen,
  onClose,
  onSave
}) => {
  // Modal with original + edit interface
  // Preview functionality
  // Preset buttons for common operations
}
```

### Gemini Edit Service
```typescript
// teacher-assistant/backend/src/services/geminiEditService.ts
export class GeminiEditService {
  async editImage(params: {
    imageBase64: string,
    instruction: string,
    userId: string
  }): Promise<{
    editedImageUrl: string,
    metadata: EditMetadata
  }>

  async checkDailyLimit(userId: string): Promise<{
    used: number,
    limit: number,
    canEdit: boolean
  }>
}
```

### Router Enhancement
```typescript
// When confidence < 70% for image reference
if (confidence < 0.7 && hasImageReference) {
  return {
    needsClarification: true,
    recentImages: await getRecentImages(userId, 4),
    question: "Welches Bild möchtest du bearbeiten?"
  }
}
```

## Task Breakdown

### Task 1: Create Edit Modal UI
- [ ] Design modal layout (original + edit side-by-side)
- [ ] Implement preset operation buttons
- [ ] Add instruction input field
- [ ] Create preview functionality

### Task 2: Implement Gemini Edit Service
- [ ] Setup Gemini 2.5 Flash Image client
- [ ] Image encoding/decoding logic
- [ ] API call with error handling
- [ ] Response processing

### Task 3: Natural Language Processing
- [ ] German instruction parser
- [ ] Image reference resolver
- [ ] Clarification dialog system
- [ ] Context extraction

### Task 4: Usage Tracking
- [ ] Daily limit counter (20 combined)
- [ ] Reset mechanism at midnight
- [ ] UI indicators
- [ ] Limit enforcement

### Task 5: Version Management
- [ ] Save edited images separately
- [ ] Preserve original always
- [ ] Add version metadata
- [ ] Library integration

### Task 6: Testing
- [ ] E2E test: Complete edit workflow
- [ ] Test all preset operations
- [ ] Test German instructions
- [ ] Test limit enforcement
- [ ] Test error scenarios

## Success Criteria

- ✅ Edit Modal funktioniert mit Preview
- ✅ Alle Edit-Operationen erfolgreich
- ✅ Deutsche Anweisungen verstanden
- ✅ 20 Bilder/Tag Limit enforced
- ✅ Original immer erhalten
- ✅ Performance < 10 Sekunden
- ✅ Zero console errors

## Notes

- Gemini kostet $0.039 pro Bild (wichtig für Cost Dashboard)
- SynthID Watermark wird automatisch hinzugefügt
- Bei Unklarheit IMMER nachfragen mit Mini-Vorschau
- Preset-Buttons reduzieren Eingabeaufwand

---

**Story Owner:** Dev Agent
**Reviewed By:** QA Agent (Quinn)
**Last Updated:** 2025-10-20