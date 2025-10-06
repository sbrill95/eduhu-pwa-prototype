/**
 * Data Seeder Service for Predefined Collections
 *
 * This service handles the initialization of predefined data collections
 * for German states, teaching subjects, and teaching preferences.
 */

import { InstantDBService } from './instantdbService';
import { GermanState, TeachingSubject, TeachingPreference } from '../schemas/instantdb';

export class DataSeederService {
  private instantdb: typeof InstantDBService;

  constructor() {
    this.instantdb = InstantDBService;
  }

  /**
   * German States (Bundesländer) - All 16 German states
   */
  private static readonly GERMAN_STATES: Omit<GermanState, 'id'>[] = [
    { name: 'Baden-Württemberg', abbreviation: 'BW', created_at: Date.now(), is_active: true },
    { name: 'Bayern', abbreviation: 'BY', created_at: Date.now(), is_active: true },
    { name: 'Berlin', abbreviation: 'BE', created_at: Date.now(), is_active: true },
    { name: 'Brandenburg', abbreviation: 'BB', created_at: Date.now(), is_active: true },
    { name: 'Bremen', abbreviation: 'HB', created_at: Date.now(), is_active: true },
    { name: 'Hamburg', abbreviation: 'HH', created_at: Date.now(), is_active: true },
    { name: 'Hessen', abbreviation: 'HE', created_at: Date.now(), is_active: true },
    { name: 'Mecklenburg-Vorpommern', abbreviation: 'MV', created_at: Date.now(), is_active: true },
    { name: 'Niedersachsen', abbreviation: 'NI', created_at: Date.now(), is_active: true },
    { name: 'Nordrhein-Westfalen', abbreviation: 'NW', created_at: Date.now(), is_active: true },
    { name: 'Rheinland-Pfalz', abbreviation: 'RP', created_at: Date.now(), is_active: true },
    { name: 'Saarland', abbreviation: 'SL', created_at: Date.now(), is_active: true },
    { name: 'Sachsen', abbreviation: 'SN', created_at: Date.now(), is_active: true },
    { name: 'Sachsen-Anhalt', abbreviation: 'ST', created_at: Date.now(), is_active: true },
    { name: 'Schleswig-Holstein', abbreviation: 'SH', created_at: Date.now(), is_active: true },
    { name: 'Thüringen', abbreviation: 'TH', created_at: Date.now(), is_active: true },
  ];

  /**
   * Teaching Subjects - Common German school subjects by category
   */
  private static readonly TEACHING_SUBJECTS: Omit<TeachingSubject, 'id'>[] = [
    // Core Subjects
    { name: 'Deutsch', category: 'Languages', grade_levels: JSON.stringify(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13']), created_at: Date.now(), is_active: true },
    { name: 'Mathematik', category: 'STEM', grade_levels: JSON.stringify(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13']), created_at: Date.now(), is_active: true },
    { name: 'Englisch', category: 'Languages', grade_levels: JSON.stringify(['3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13']), created_at: Date.now(), is_active: true },

    // STEM Subjects
    { name: 'Biologie', category: 'STEM', grade_levels: JSON.stringify(['5', '6', '7', '8', '9', '10', '11', '12', '13']), created_at: Date.now(), is_active: true },
    { name: 'Chemie', category: 'STEM', grade_levels: JSON.stringify(['7', '8', '9', '10', '11', '12', '13']), created_at: Date.now(), is_active: true },
    { name: 'Physik', category: 'STEM', grade_levels: JSON.stringify(['6', '7', '8', '9', '10', '11', '12', '13']), created_at: Date.now(), is_active: true },
    { name: 'Informatik', category: 'STEM', grade_levels: JSON.stringify(['5', '6', '7', '8', '9', '10', '11', '12', '13']), created_at: Date.now(), is_active: true },

    // Social Sciences
    { name: 'Geschichte', category: 'Social Sciences', grade_levels: JSON.stringify(['5', '6', '7', '8', '9', '10', '11', '12', '13']), created_at: Date.now(), is_active: true },
    { name: 'Erdkunde', category: 'Social Sciences', grade_levels: JSON.stringify(['5', '6', '7', '8', '9', '10', '11', '12', '13']), created_at: Date.now(), is_active: true },
    { name: 'Politik', category: 'Social Sciences', grade_levels: JSON.stringify(['8', '9', '10', '11', '12', '13']), created_at: Date.now(), is_active: true },
    { name: 'Wirtschaft', category: 'Social Sciences', grade_levels: JSON.stringify(['8', '9', '10', '11', '12', '13']), created_at: Date.now(), is_active: true },
    { name: 'Sozialkunde', category: 'Social Sciences', grade_levels: JSON.stringify(['8', '9', '10', '11', '12', '13']), created_at: Date.now(), is_active: true },

    // Languages
    { name: 'Französisch', category: 'Languages', grade_levels: JSON.stringify(['6', '7', '8', '9', '10', '11', '12', '13']), created_at: Date.now(), is_active: true },
    { name: 'Spanisch', category: 'Languages', grade_levels: JSON.stringify(['6', '7', '8', '9', '10', '11', '12', '13']), created_at: Date.now(), is_active: true },
    { name: 'Latein', category: 'Languages', grade_levels: JSON.stringify(['6', '7', '8', '9', '10', '11', '12', '13']), created_at: Date.now(), is_active: true },
    { name: 'Italienisch', category: 'Languages', grade_levels: JSON.stringify(['8', '9', '10', '11', '12', '13']), created_at: Date.now(), is_active: true },

    // Arts and Culture
    { name: 'Kunst', category: 'Arts', grade_levels: JSON.stringify(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13']), created_at: Date.now(), is_active: true },
    { name: 'Musik', category: 'Arts', grade_levels: JSON.stringify(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13']), created_at: Date.now(), is_active: true },
    { name: 'Theater', category: 'Arts', grade_levels: JSON.stringify(['5', '6', '7', '8', '9', '10', '11', '12', '13']), created_at: Date.now(), is_active: true },

    // Physical Education and Life Skills
    { name: 'Sport', category: 'Physical Education', grade_levels: JSON.stringify(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13']), created_at: Date.now(), is_active: true },
    { name: 'Hauswirtschaft', category: 'Life Skills', grade_levels: JSON.stringify(['5', '6', '7', '8', '9', '10']), created_at: Date.now(), is_active: true },
    { name: 'Technik', category: 'Life Skills', grade_levels: JSON.stringify(['5', '6', '7', '8', '9', '10']), created_at: Date.now(), is_active: true },

    // Religion and Ethics
    { name: 'Religion', category: 'Ethics and Religion', grade_levels: JSON.stringify(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13']), created_at: Date.now(), is_active: true },
    { name: 'Ethik', category: 'Ethics and Religion', grade_levels: JSON.stringify(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13']), created_at: Date.now(), is_active: true },
    { name: 'Philosophie', category: 'Ethics and Religion', grade_levels: JSON.stringify(['11', '12', '13']), created_at: Date.now(), is_active: true },

    // Specialized Subjects
    { name: 'Psychologie', category: 'Social Sciences', grade_levels: JSON.stringify(['11', '12', '13']), created_at: Date.now(), is_active: true },
    { name: 'Pädagogik', category: 'Social Sciences', grade_levels: JSON.stringify(['11', '12', '13']), created_at: Date.now(), is_active: true },
    { name: 'Sachunterricht', category: 'General', grade_levels: JSON.stringify(['1', '2', '3', '4']), created_at: Date.now(), is_active: true },
    { name: 'Naturwissenschaften', category: 'STEM', grade_levels: JSON.stringify(['5', '6', '7', '8', '9', '10']), created_at: Date.now(), is_active: true },
  ];

  /**
   * Teaching Preferences - Methods, approaches, and tools
   */
  private static readonly TEACHING_PREFERENCES: Omit<TeachingPreference, 'id'>[] = [
    // Teaching Methods
    { name: 'Frontalunterricht', description: 'Traditioneller lehrerzentrierter Unterricht', category: 'Method', created_at: Date.now(), is_active: true },
    { name: 'Gruppenarbeit', description: 'Kollaboratives Lernen in kleinen Gruppen', category: 'Method', created_at: Date.now(), is_active: true },
    { name: 'Projektarbeit', description: 'Längerfristige, selbstgesteuerte Projektarbeit', category: 'Method', created_at: Date.now(), is_active: true },
    { name: 'Partnerarbeit', description: 'Kooperatives Lernen zu zweit', category: 'Method', created_at: Date.now(), is_active: true },
    { name: 'Einzelarbeit', description: 'Selbstständiges, individuelles Arbeiten', category: 'Method', created_at: Date.now(), is_active: true },
    { name: 'Stationenlernen', description: 'Lernen an verschiedenen Stationen', category: 'Method', created_at: Date.now(), is_active: true },
    { name: 'Flipped Classroom', description: 'Umgekehrter Unterricht mit Vorverlagerung', category: 'Method', created_at: Date.now(), is_active: true },
    { name: 'Blended Learning', description: 'Mischung aus Präsenz- und Onlineunterricht', category: 'Method', created_at: Date.now(), is_active: true },

    // Pedagogical Approaches
    { name: 'Montessori-Pädagogik', description: 'Selbstbestimmtes Lernen nach Maria Montessori', category: 'Approach', created_at: Date.now(), is_active: true },
    { name: 'Waldorf-Pädagogik', description: 'Ganzheitliche Pädagogik nach Rudolf Steiner', category: 'Approach', created_at: Date.now(), is_active: true },
    { name: 'Konstruktivismus', description: 'Wissen wird aktiv durch den Lernenden konstruiert', category: 'Approach', created_at: Date.now(), is_active: true },
    { name: 'Behaviorismus', description: 'Verhaltensbasierte Lerntheorie', category: 'Approach', created_at: Date.now(), is_active: true },
    { name: 'Kognitivismus', description: 'Informationsverarbeitung und Denkprozesse', category: 'Approach', created_at: Date.now(), is_active: true },
    { name: 'Differenzierung', description: 'Individualisierung für verschiedene Lerntypen', category: 'Approach', created_at: Date.now(), is_active: true },
    { name: 'Inklusion', description: 'Gemeinsames Lernen aller Schüler*innen', category: 'Approach', created_at: Date.now(), is_active: true },

    // Digital Tools and Media
    { name: 'Digitale Medien', description: 'Einsatz von Computern, Tablets und Software', category: 'Tool', created_at: Date.now(), is_active: true },
    { name: 'Interactive Whiteboards', description: 'Interaktive Tafeln für multimediale Präsentation', category: 'Tool', created_at: Date.now(), is_active: true },
    { name: 'Lernmanagementsysteme', description: 'Digitale Plattformen für Kursorganisation', category: 'Tool', created_at: Date.now(), is_active: true },
    { name: 'Gamification', description: 'Spielerische Elemente im Unterricht', category: 'Tool', created_at: Date.now(), is_active: true },
    { name: 'Virtual Reality', description: 'Immersive 3D-Lernerfahrungen', category: 'Tool', created_at: Date.now(), is_active: true },
    { name: 'Podcasts', description: 'Audio-basierte Lernmaterialien', category: 'Tool', created_at: Date.now(), is_active: true },
    { name: 'Videos', description: 'Visuelle Lernmaterialien und Erklärvideos', category: 'Tool', created_at: Date.now(), is_active: true },

    // Assessment Methods
    { name: 'Formative Bewertung', description: 'Kontinuierliche Lernfortschrittsmessung', category: 'Assessment', created_at: Date.now(), is_active: true },
    { name: 'Summative Bewertung', description: 'Abschließende Leistungsbewertung', category: 'Assessment', created_at: Date.now(), is_active: true },
    { name: 'Peer Assessment', description: 'Gegenseitige Bewertung durch Schüler*innen', category: 'Assessment', created_at: Date.now(), is_active: true },
    { name: 'Selbstbewertung', description: 'Reflexion und Einschätzung der eigenen Leistung', category: 'Assessment', created_at: Date.now(), is_active: true },
    { name: 'Portfolio-Bewertung', description: 'Sammlung von Arbeiten über längeren Zeitraum', category: 'Assessment', created_at: Date.now(), is_active: true },
    { name: 'Rubrik-basierte Bewertung', description: 'Strukturierte Bewertungskriterien', category: 'Assessment', created_at: Date.now(), is_active: true },

    // Classroom Management
    { name: 'Positive Verstärkung', description: 'Belohnung erwünschten Verhaltens', category: 'Management', created_at: Date.now(), is_active: true },
    { name: 'Klare Regeln', description: 'Eindeutige Verhaltenserwartungen', category: 'Management', created_at: Date.now(), is_active: true },
    { name: 'Demokratische Klassenführung', description: 'Partizipative Entscheidungsfindung', category: 'Management', created_at: Date.now(), is_active: true },
    { name: 'Restorative Justice', description: 'Wiedergutmachung bei Konflikten', category: 'Management', created_at: Date.now(), is_active: true },
  ];

  /**
   * Seed all predefined data collections
   */
  async seedAllData(): Promise<void> {
    try {
      console.log('Starting data seeding process...');

      await this.seedGermanStates();
      await this.seedTeachingSubjects();
      await this.seedTeachingPreferences();

      console.log('Data seeding completed successfully!');
    } catch (error) {
      console.error('Error seeding data:', error);
      throw error;
    }
  }

  /**
   * Seed German states data
   */
  async seedGermanStates(): Promise<void> {
    try {
      console.log('Seeding German states...');

      for (const state of DataSeederService.GERMAN_STATES) {
        // For now, just log the seeding - the DataSeederService needs proper InstantDB integration
        console.log(`✓ Would seed German state: ${state.name}`);
        // TODO: Implement proper InstantDB integration when schema is ready
      }

      console.log('German states seeding completed.');
    } catch (error) {
      console.error('Error seeding German states:', error);
      throw error;
    }
  }

  /**
   * Seed teaching subjects data
   */
  async seedTeachingSubjects(): Promise<void> {
    try {
      console.log('Seeding teaching subjects...');

      for (const subject of DataSeederService.TEACHING_SUBJECTS) {
        // For now, just log the seeding - the DataSeederService needs proper InstantDB integration
        console.log(`✓ Would seed teaching subject: ${subject.name} (${subject.category})`);
        // TODO: Implement proper InstantDB integration when schema is ready
      }

      console.log('Teaching subjects seeding completed.');
    } catch (error) {
      console.error('Error seeding teaching subjects:', error);
      throw error;
    }
  }

  /**
   * Seed teaching preferences data
   */
  async seedTeachingPreferences(): Promise<void> {
    try {
      console.log('Seeding teaching preferences...');

      for (const preference of DataSeederService.TEACHING_PREFERENCES) {
        // For now, just log the seeding - the DataSeederService needs proper InstantDB integration
        console.log(`✓ Would seed teaching preference: ${preference.name} (${preference.category})`);
        // TODO: Implement proper InstantDB integration when schema is ready
      }

      console.log('Teaching preferences seeding completed.');
    } catch (error) {
      console.error('Error seeding teaching preferences:', error);
      throw error;
    }
  }

  /**
   * Get all German states
   */
  async getGermanStates(): Promise<GermanState[]> {
    try {
      // For now, return the static data - the DataSeederService needs proper InstantDB integration
      return DataSeederService.GERMAN_STATES.map((state, index) => ({
        id: `state_${index}`,
        ...state
      })) as GermanState[];
    } catch (error) {
      console.error('Error fetching German states:', error);
      throw error;
    }
  }

  /**
   * Get all teaching subjects
   */
  async getTeachingSubjects(): Promise<TeachingSubject[]> {
    try {
      // For now, return the static data - the DataSeederService needs proper InstantDB integration
      return DataSeederService.TEACHING_SUBJECTS.map((subject, index) => ({
        id: `subject_${index}`,
        ...subject,
        grade_levels: JSON.parse(subject.grade_levels as string || '[]')
      })) as TeachingSubject[];
    } catch (error) {
      console.error('Error fetching teaching subjects:', error);
      throw error;
    }
  }

  /**
   * Get all teaching preferences
   */
  async getTeachingPreferences(): Promise<TeachingPreference[]> {
    try {
      // For now, return the static data - the DataSeederService needs proper InstantDB integration
      return DataSeederService.TEACHING_PREFERENCES.map((preference, index) => ({
        id: `preference_${index}`,
        ...preference
      })) as TeachingPreference[];
    } catch (error) {
      console.error('Error fetching teaching preferences:', error);
      throw error;
    }
  }

  /**
   * Search function for fuzzy matching
   */
  searchData<T extends { name: string }>(data: T[], searchTerm: string): T[] {
    if (!searchTerm.trim()) {
      return data;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();

    return data.filter(item =>
      item.name.toLowerCase().includes(lowerSearchTerm)
    ).sort((a, b) => {
      // Prioritize exact matches and matches at the beginning
      const aStartsWith = a.name.toLowerCase().startsWith(lowerSearchTerm);
      const bStartsWith = b.name.toLowerCase().startsWith(lowerSearchTerm);

      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;

      return a.name.localeCompare(b.name);
    });
  }
}

export default DataSeederService;