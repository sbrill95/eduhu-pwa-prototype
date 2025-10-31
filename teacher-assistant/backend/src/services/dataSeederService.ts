/**
 * Data Seeder Service for Predefined Collections
 *
 * This service handles the initialization of predefined data collections
 * for German states, teaching subjects, and teaching preferences.
 */

import { InstantDBService } from './instantdbService';
import {
  GermanState,
  TeachingSubject,
  TeachingPreference,
} from '../schemas/instantdb';

export class DataSeederService {
  private instantdb: typeof InstantDBService;

  constructor() {
    this.instantdb = InstantDBService;
  }

  /**
   * German States (Bundesländer) - All 16 German states
   */
  private static readonly GERMAN_STATES: Omit<GermanState, 'id'>[] = [
    { name: 'Baden-Württemberg', abbreviation: 'BW' },
    { name: 'Bayern', abbreviation: 'BY' },
    { name: 'Berlin', abbreviation: 'BE' },
    { name: 'Brandenburg', abbreviation: 'BB' },
    { name: 'Bremen', abbreviation: 'HB' },
    { name: 'Hamburg', abbreviation: 'HH' },
    { name: 'Hessen', abbreviation: 'HE' },
    { name: 'Mecklenburg-Vorpommern', abbreviation: 'MV' },
    { name: 'Niedersachsen', abbreviation: 'NI' },
    { name: 'Nordrhein-Westfalen', abbreviation: 'NW' },
    { name: 'Rheinland-Pfalz', abbreviation: 'RP' },
    { name: 'Saarland', abbreviation: 'SL' },
    { name: 'Sachsen', abbreviation: 'SN' },
    { name: 'Sachsen-Anhalt', abbreviation: 'ST' },
    { name: 'Schleswig-Holstein', abbreviation: 'SH' },
    { name: 'Thüringen', abbreviation: 'TH' },
  ];

  /**
   * Teaching Subjects - Common German school subjects by category
   */
  private static readonly TEACHING_SUBJECTS: Omit<TeachingSubject, 'id'>[] = [
    // Core Subjects
    {
      name: 'Deutsch',
      category: 'Languages',
      grade_levels: [
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '10',
        '11',
        '12',
        '13',
      ],
    },
    {
      name: 'Mathematik',
      category: 'STEM',
      grade_levels: [
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '10',
        '11',
        '12',
        '13',
      ],
    },
    {
      name: 'Englisch',
      category: 'Languages',
      grade_levels: ['3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'],
    },

    // STEM Subjects
    {
      name: 'Biologie',
      category: 'STEM',
      grade_levels: ['5', '6', '7', '8', '9', '10', '11', '12', '13'],
    },
    {
      name: 'Chemie',
      category: 'STEM',
      grade_levels: ['7', '8', '9', '10', '11', '12', '13'],
    },
    {
      name: 'Physik',
      category: 'STEM',
      grade_levels: ['6', '7', '8', '9', '10', '11', '12', '13'],
    },
    {
      name: 'Informatik',
      category: 'STEM',
      grade_levels: ['5', '6', '7', '8', '9', '10', '11', '12', '13'],
    },

    // Social Sciences
    {
      name: 'Geschichte',
      category: 'Social Sciences',
      grade_levels: ['5', '6', '7', '8', '9', '10', '11', '12', '13'],
    },
    {
      name: 'Erdkunde',
      category: 'Social Sciences',
      grade_levels: ['5', '6', '7', '8', '9', '10', '11', '12', '13'],
    },
    {
      name: 'Politik',
      category: 'Social Sciences',
      grade_levels: ['8', '9', '10', '11', '12', '13'],
    },
    {
      name: 'Wirtschaft',
      category: 'Social Sciences',
      grade_levels: ['8', '9', '10', '11', '12', '13'],
    },
    {
      name: 'Sozialkunde',
      category: 'Social Sciences',
      grade_levels: ['8', '9', '10', '11', '12', '13'],
    },

    // Languages
    {
      name: 'Französisch',
      category: 'Languages',
      grade_levels: ['6', '7', '8', '9', '10', '11', '12', '13'],
    },
    {
      name: 'Spanisch',
      category: 'Languages',
      grade_levels: ['6', '7', '8', '9', '10', '11', '12', '13'],
    },
    {
      name: 'Latein',
      category: 'Languages',
      grade_levels: ['6', '7', '8', '9', '10', '11', '12', '13'],
    },
    {
      name: 'Italienisch',
      category: 'Languages',
      grade_levels: ['8', '9', '10', '11', '12', '13'],
    },

    // Arts and Culture
    {
      name: 'Kunst',
      category: 'Arts',
      grade_levels: [
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '10',
        '11',
        '12',
        '13',
      ],
    },
    {
      name: 'Musik',
      category: 'Arts',
      grade_levels: [
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '10',
        '11',
        '12',
        '13',
      ],
    },
    {
      name: 'Theater',
      category: 'Arts',
      grade_levels: ['5', '6', '7', '8', '9', '10', '11', '12', '13'],
    },

    // Physical Education and Life Skills
    {
      name: 'Sport',
      category: 'Physical Education',
      grade_levels: [
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '10',
        '11',
        '12',
        '13',
      ],
    },
    {
      name: 'Hauswirtschaft',
      category: 'Life Skills',
      grade_levels: ['5', '6', '7', '8', '9', '10'],
    },
    {
      name: 'Technik',
      category: 'Life Skills',
      grade_levels: ['5', '6', '7', '8', '9', '10'],
    },

    // Religion and Ethics
    {
      name: 'Religion',
      category: 'Ethics and Religion',
      grade_levels: [
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '10',
        '11',
        '12',
        '13',
      ],
    },
    {
      name: 'Ethik',
      category: 'Ethics and Religion',
      grade_levels: [
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '10',
        '11',
        '12',
        '13',
      ],
    },
    {
      name: 'Philosophie',
      category: 'Ethics and Religion',
      grade_levels: ['11', '12', '13'],
    },

    // Specialized Subjects
    {
      name: 'Psychologie',
      category: 'Social Sciences',
      grade_levels: ['11', '12', '13'],
    },
    {
      name: 'Pädagogik',
      category: 'Social Sciences',
      grade_levels: ['11', '12', '13'],
    },
    {
      name: 'Sachunterricht',
      category: 'General',
      grade_levels: ['1', '2', '3', '4'],
    },
    {
      name: 'Naturwissenschaften',
      category: 'STEM',
      grade_levels: ['5', '6', '7', '8', '9', '10'],
    },
  ];

  /**
   * Teaching Preferences - Methods, approaches, and tools
   */
  private static readonly TEACHING_PREFERENCES: Omit<
    TeachingPreference,
    'id'
  >[] = [
    // Teaching Methods
    { preference: 'Frontalunterricht', category: 'Method' },
    { preference: 'Gruppenarbeit', category: 'Method' },
    { preference: 'Projektarbeit', category: 'Method' },
    { preference: 'Partnerarbeit', category: 'Method' },
    { preference: 'Einzelarbeit', category: 'Method' },
    { preference: 'Stationenlernen', category: 'Method' },
    { preference: 'Flipped Classroom', category: 'Method' },
    { preference: 'Blended Learning', category: 'Method' },

    // Pedagogical Approaches
    { preference: 'Montessori-Pädagogik', category: 'Approach' },
    { preference: 'Waldorf-Pädagogik', category: 'Approach' },
    { preference: 'Konstruktivismus', category: 'Approach' },
    { preference: 'Behaviorismus', category: 'Approach' },
    { preference: 'Kognitivismus', category: 'Approach' },
    { preference: 'Differenzierung', category: 'Approach' },
    { preference: 'Inklusion', category: 'Approach' },

    // Digital Tools and Media
    { preference: 'Digitale Medien', category: 'Tool' },
    { preference: 'Interactive Whiteboards', category: 'Tool' },
    { preference: 'Lernmanagementsysteme', category: 'Tool' },
    { preference: 'Gamification', category: 'Tool' },
    { preference: 'Virtual Reality', category: 'Tool' },
    { preference: 'Podcasts', category: 'Tool' },
    { preference: 'Videos', category: 'Tool' },

    // Assessment Methods
    { preference: 'Formative Bewertung', category: 'Assessment' },
    { preference: 'Summative Bewertung', category: 'Assessment' },
    { preference: 'Peer Assessment', category: 'Assessment' },
    { preference: 'Selbstbewertung', category: 'Assessment' },
    { preference: 'Portfolio-Bewertung', category: 'Assessment' },
    { preference: 'Rubrik-basierte Bewertung', category: 'Assessment' },

    // Classroom Management
    { preference: 'Positive Verstärkung', category: 'Management' },
    { preference: 'Klare Regeln', category: 'Management' },
    { preference: 'Demokratische Klassenführung', category: 'Management' },
    { preference: 'Restorative Justice', category: 'Management' },
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
        console.log(
          `✓ Would seed teaching subject: ${subject.name} (${subject.category})`
        );
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
        console.log(
          `✓ Would seed teaching preference: ${preference.preference} (${preference.category})`
        );
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
        ...state,
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
      return DataSeederService.TEACHING_PREFERENCES.map(
        (preference, index) => ({
          id: `preference_${index}`,
          ...preference,
        })
      ) as TeachingPreference[];
    } catch (error) {
      console.error('Error fetching teaching preferences:', error);
      throw error;
    }
  }

  /**
   * Search function for fuzzy matching
   */
  searchData<T extends { name?: string; preference?: string }>(
    data: T[],
    searchTerm: string
  ): T[] {
    if (!searchTerm.trim()) {
      return data;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();

    return data
      .filter((item) => {
        const searchField = item.name || item.preference || '';
        return searchField.toLowerCase().includes(lowerSearchTerm);
      })
      .sort((a, b) => {
        const aField = a.name || a.preference || '';
        const bField = b.name || b.preference || '';

        // Prioritize exact matches and matches at the beginning
        const aStartsWith = aField.toLowerCase().startsWith(lowerSearchTerm);
        const bStartsWith = bField.toLowerCase().startsWith(lowerSearchTerm);

        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;

        return aField.localeCompare(bField);
      });
  }
}

export default DataSeederService;
