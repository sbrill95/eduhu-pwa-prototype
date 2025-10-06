/**
 * Prompt Templates Data File
 *
 * This file contains static prompt templates for the Home Screen Redesign feature.
 * Templates are used to generate personalized suggestions for teachers based on their profile.
 *
 * Categories: quiz, worksheet, lesson-plan, image, search, explanation, other
 * Colors: Inspired by Google Gemini color palette
 */

export type PromptCategory =
  | 'quiz'
  | 'worksheet'
  | 'lesson-plan'
  | 'image'
  | 'search'
  | 'explanation'
  | 'other';

export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  promptTemplate: string; // With placeholders like {{fach}}, {{klassenstufe}}, {{topic}}
  category: PromptCategory;
  icon: string; // Ionic icon name
  color: string; // Hex color
  estimatedTime: string; // "2-3 Minuten"
  requiresContext: string[]; // e.g., ['fach', 'klassenstufe']
  weight: number; // For weighted randomization (1-10, higher = more likely)
}

/**
 * Collection of predefined prompt templates
 *
 * Placeholders:
 * - {{fach}}: Subject (e.g., "Mathematik", "Deutsch")
 * - {{klassenstufe}}: Grade level (e.g., "5", "7", "10")
 * - {{schultyp}}: School type (e.g., "Gymnasium", "Realschule")
 * - {{topic}}: Topic (randomly selected or from context)
 */
export const PROMPT_TEMPLATES: PromptTemplate[] = [
  // Quiz Templates
  {
    id: 'quiz-basic',
    title: 'Erstelle ein Quiz',
    description: '{{fach}} für {{klassenstufe}}. Klasse',
    promptTemplate: 'Erstelle ein Quiz für {{fach}}, {{klassenstufe}}. Klasse zum Thema {{topic}}. Das Quiz soll 10 Fragen enthalten mit Multiple Choice Antworten.',
    category: 'quiz',
    icon: 'helpCircleOutline',
    color: '#FB6542',
    estimatedTime: '2-3 Minuten',
    requiresContext: ['fach', 'klassenstufe'],
    weight: 10
  },
  {
    id: 'quiz-advanced',
    title: 'Erstelle schwieriges Quiz',
    description: 'Herausforderndes Quiz für {{fach}}',
    promptTemplate: 'Erstelle ein herausforderndes Quiz für {{fach}}, {{klassenstufe}}. Klasse zum Thema {{topic}}. Das Quiz soll 15 Fragen mit unterschiedlichen Schwierigkeitsgraden enthalten.',
    category: 'quiz',
    icon: 'trophyOutline',
    color: '#FB6542',
    estimatedTime: '3-4 Minuten',
    requiresContext: ['fach', 'klassenstufe'],
    weight: 6
  },
  {
    id: 'quiz-fun',
    title: 'Erstelle spielerisches Quiz',
    description: 'Unterhaltsames Quiz für {{fach}}',
    promptTemplate: 'Erstelle ein spielerisches und motivierendes Quiz für {{fach}}, {{klassenstufe}}. Klasse. Nutze kreative Fragestellungen und beziehe Alltagsbezüge ein.',
    category: 'quiz',
    icon: 'gameControllerOutline',
    color: '#FF9800',
    estimatedTime: '2-3 Minuten',
    requiresContext: ['fach', 'klassenstufe'],
    weight: 7
  },

  // Worksheet Templates
  {
    id: 'worksheet-exercises',
    title: 'Erstelle Arbeitsblatt',
    description: 'Übungsaufgaben für {{fach}}',
    promptTemplate: 'Erstelle ein Arbeitsblatt mit Übungsaufgaben für {{fach}}, {{klassenstufe}}. Klasse. Schwierigkeitsgrad: mittel. Format: PDF-ready mit klarer Struktur.',
    category: 'worksheet',
    icon: 'documentTextOutline',
    color: '#FFBB00',
    estimatedTime: '3-4 Minuten',
    requiresContext: ['fach', 'klassenstufe'],
    weight: 8
  },
  {
    id: 'worksheet-differentiated',
    title: 'Differenziertes Arbeitsblatt',
    description: 'Für unterschiedliche Leistungsniveaus',
    promptTemplate: 'Erstelle ein differenziertes Arbeitsblatt für {{fach}}, {{klassenstufe}}. Klasse mit drei Schwierigkeitsstufen (leicht, mittel, schwer). Thema: {{topic}}.',
    category: 'worksheet',
    icon: 'layersOutline',
    color: '#FFBB00',
    estimatedTime: '4-5 Minuten',
    requiresContext: ['fach', 'klassenstufe'],
    weight: 6
  },

  // Lesson Plan Templates
  {
    id: 'lesson-plan-45min',
    title: 'Unterrichtsplan (45 Min)',
    description: 'Strukturierte Stundenvorbereitung',
    promptTemplate: 'Erstelle einen Unterrichtsplan für {{fach}}, {{klassenstufe}}. Klasse, Dauer: 45 Minuten. Thema: {{topic}}. Inklusive: Einstieg, Erarbeitung, Sicherung.',
    category: 'lesson-plan',
    icon: 'calendarOutline',
    color: '#9C27B0',
    estimatedTime: '4-5 Minuten',
    requiresContext: ['fach', 'klassenstufe'],
    weight: 7
  },
  {
    id: 'lesson-plan-double',
    title: 'Doppelstunden-Plan',
    description: 'Ausführlicher Plan für 90 Minuten',
    promptTemplate: 'Erstelle einen detaillierten Unterrichtsplan für eine Doppelstunde (90 Min) in {{fach}}, {{klassenstufe}}. Klasse. Thema: {{topic}}. Berücksichtige Methodenvielfalt und Sozialformen.',
    category: 'lesson-plan',
    icon: 'timeOutline',
    color: '#9C27B0',
    estimatedTime: '5-6 Minuten',
    requiresContext: ['fach', 'klassenstufe'],
    weight: 5
  },

  // Image Generation Templates
  {
    id: 'image-educational',
    title: 'Erstelle Unterrichtsbild',
    description: 'Visuelles Material für {{fach}}',
    promptTemplate: 'Erstelle ein illustratives Bild für {{fach}}-Unterricht, {{klassenstufe}}. Klasse zum Thema {{topic}}. Stil: pädagogisch, klar, ansprechend, kindgerecht.',
    category: 'image',
    icon: 'imageOutline',
    color: '#4CAF50',
    estimatedTime: '1-2 Minuten',
    requiresContext: ['fach', 'klassenstufe'],
    weight: 6
  },
  {
    id: 'image-diagram',
    title: 'Erstelle Diagramm',
    description: 'Schaubild für Erklärungen',
    promptTemplate: 'Erstelle ein übersichtliches Diagramm oder Schaubild für {{fach}}, {{klassenstufe}}. Klasse zum Thema {{topic}}. Klare Beschriftungen, gut lesbar.',
    category: 'image',
    icon: 'gitNetworkOutline',
    color: '#4CAF50',
    estimatedTime: '2-3 Minuten',
    requiresContext: ['fach', 'klassenstufe'],
    weight: 5
  },

  // Web Search Templates
  {
    id: 'search-materials',
    title: 'Suche Materialien',
    description: 'Aktuelle Ressourcen finden',
    promptTemplate: 'Suche im Web nach aktuellen Unterrichtsmaterialien für {{fach}}, {{klassenstufe}}. Klasse zum Thema {{topic}}. Fokus auf frei verfügbare und qualitativ hochwertige Ressourcen.',
    category: 'search',
    icon: 'searchOutline',
    color: '#2196F3',
    estimatedTime: '1-2 Minuten',
    requiresContext: ['fach', 'klassenstufe'],
    weight: 5
  },

  // Explanation Templates
  {
    id: 'explanation-simple',
    title: 'Erkläre ein Konzept',
    description: 'Schülergerechte Erklärung',
    promptTemplate: 'Erkläre {{topic}} für {{klassenstufe}}. Klasse im Fach {{fach}}. Nutze einfache Sprache, anschauliche Beispiele und Alltagsbezüge.',
    category: 'explanation',
    icon: 'bulbOutline',
    color: '#FF9800',
    estimatedTime: '1-2 Minuten',
    requiresContext: ['fach', 'klassenstufe'],
    weight: 6
  },
  {
    id: 'explanation-step-by-step',
    title: 'Schritt-für-Schritt Erklärung',
    description: 'Detaillierte Anleitung erstellen',
    promptTemplate: 'Erstelle eine Schritt-für-Schritt Erklärung für {{topic}} im Fach {{fach}}, {{klassenstufe}}. Klasse. Strukturiere die Erklärung in klare, nachvollziehbare Schritte.',
    category: 'explanation',
    icon: 'listOutline',
    color: '#FF9800',
    estimatedTime: '2-3 Minuten',
    requiresContext: ['fach', 'klassenstufe'],
    weight: 5
  },

  // Other Templates
  {
    id: 'homework-assignment',
    title: 'Erstelle Hausaufgabe',
    description: 'Sinnvolle Übung für zu Hause',
    promptTemplate: 'Erstelle eine sinnvolle Hausaufgabe für {{fach}}, {{klassenstufe}}. Klasse zum Thema {{topic}}. Zeitaufwand: ca. 20-30 Minuten.',
    category: 'other',
    icon: 'homeOutline',
    color: '#607D8B',
    estimatedTime: '2-3 Minuten',
    requiresContext: ['fach', 'klassenstufe'],
    weight: 6
  },
  {
    id: 'assessment-criteria',
    title: 'Erstelle Bewertungskriterien',
    description: 'Transparente Bewertung definieren',
    promptTemplate: 'Erstelle transparente Bewertungskriterien für eine Aufgabe in {{fach}}, {{klassenstufe}}. Klasse zum Thema {{topic}}. Nutze ein Punktesystem.',
    category: 'other',
    icon: 'checkmarkCircleOutline',
    color: '#607D8B',
    estimatedTime: '2-3 Minuten',
    requiresContext: ['fach', 'klassenstufe'],
    weight: 4
  }
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: PromptCategory): PromptTemplate[] {
  return PROMPT_TEMPLATES.filter(template => template.category === category);
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): PromptTemplate | undefined {
  return PROMPT_TEMPLATES.find(template => template.id === id);
}

/**
 * Get all available categories
 */
export function getAllCategories(): PromptCategory[] {
  return Array.from(new Set(PROMPT_TEMPLATES.map(t => t.category)));
}
