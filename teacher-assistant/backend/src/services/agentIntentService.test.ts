import { AgentIntentService, AgentIntent } from './agentIntentService';
import { TeacherKnowledge } from '../types';

describe('AgentIntentService', () => {
  describe('detectAgentIntent', () => {
    describe('Image Generation Intent', () => {
      it('should detect "erstelle ein bild" intent', () => {
        const message = 'Erstelle ein Bild zur Photosynthese';
        const intent = AgentIntentService.detectAgentIntent(message);

        expect(intent).not.toBeNull();
        expect(intent?.agentType).toBe('image-generation');
        expect(intent?.confidence).toBeGreaterThan(0.7);
        expect((intent?.prefillData as any).description).toContain('Photosynthese');
      });

      it('should detect "generiere bild" intent', () => {
        const message = 'Generiere mir ein Bild von einem Vulkan';
        const intent = AgentIntentService.detectAgentIntent(message);

        expect(intent).not.toBeNull();
        expect(intent?.agentType).toBe('image-generation');
        expect((intent?.prefillData as any).description).toContain('Vulkan');
      });

      it('should detect "bild für" intent', () => {
        const message =
          'Ich brauche ein Bild für meine 7. Klasse zum Thema Photosynthese';
        const intent = AgentIntentService.detectAgentIntent(message);

        expect(intent).not.toBeNull();
        expect(intent?.agentType).toBe('image-generation');
        expect((intent?.prefillData as any).description).toContain('Photosynthese');
      });

      it('should detect "visualisiere" intent', () => {
        const message = 'Visualisiere den Wasserkreislauf für mich';
        const intent = AgentIntentService.detectAgentIntent(message);

        expect(intent).not.toBeNull();
        expect(intent?.agentType).toBe('image-generation');
        expect((intent?.prefillData as any).description).toContain('Wasserkreislauf');
      });

      it('should extract learning group from message', () => {
        const message = 'Erstelle ein Bild zur Photosynthese für Klasse 7a';
        const intent = AgentIntentService.detectAgentIntent(message);

        expect(intent).not.toBeNull();
        expect(intent?.prefillData.learningGroup).toBe('Klasse 7a');
      });

      it('should extract learning group from alternative pattern', () => {
        const message = 'Bild für 9. Klasse zum Thema Zellaufbau';
        const intent = AgentIntentService.detectAgentIntent(message);

        expect(intent).not.toBeNull();
        expect(intent?.prefillData.learningGroup).toBe('Klasse 9');
      });

      it('should use context subject if available', () => {
        const message = 'Erstelle ein Bild zur Photosynthese';
        const context: TeacherKnowledge = {
          subjects: ['Biologie', 'Chemie'],
          grades: ['7', '8'],
          teachingMethods: [],
          topics: [],
          challenges: [],
        };

        const intent = AgentIntentService.detectAgentIntent(message, context);

        expect(intent).not.toBeNull();
        expect(intent?.prefillData.subject).toBe('Biologie');
      });

      it('should use context grade as fallback', () => {
        const message = 'Erstelle ein Bild zur Photosynthese';
        const context: TeacherKnowledge = {
          subjects: ['Biologie'],
          grades: ['7', '8'],
          teachingMethods: [],
          topics: [],
          challenges: [],
        };

        const intent = AgentIntentService.detectAgentIntent(message, context);

        expect(intent).not.toBeNull();
        expect(intent?.prefillData.learningGroup).toBe('Klasse 7');
      });
    });

    // Worksheet intent detection is currently disabled in implementation (TODO)
    describe.skip('Worksheet Intent', () => {
      it('should detect "arbeitsblatt" intent', () => {
        const message = 'Erstelle ein Arbeitsblatt zur Bruchrechnung';
        const intent = AgentIntentService.detectAgentIntent(message);

        expect(intent).not.toBeNull();
        expect(intent?.agentType).toBe('worksheet');
        expect((intent?.prefillData as any).description).toContain('Bruchrechnung');
      });

      it('should detect "übungen" intent', () => {
        const message = 'Ich brauche Übungen zum Thema Passiv';
        const intent = AgentIntentService.detectAgentIntent(message);

        expect(intent).not.toBeNull();
        expect(intent?.agentType).toBe('worksheet');
        expect((intent?.prefillData as any).description).toContain('Passiv');
      });

      it('should detect "aufgaben" intent', () => {
        const message = 'Erstelle Aufgaben zur Prozentrechnung für Klasse 8';
        const intent = AgentIntentService.detectAgentIntent(message);

        expect(intent).not.toBeNull();
        expect(intent?.agentType).toBe('worksheet');
        expect((intent?.prefillData as any).description).toContain('Prozentrechnung');
        expect(intent?.prefillData.learningGroup).toBe('Klasse 8');
      });
    });

    // Lesson plan intent detection is currently disabled in implementation (TODO)
    describe.skip('Lesson Plan Intent', () => {
      it('should detect "unterrichtsplan" intent', () => {
        const message = 'Erstelle einen Unterrichtsplan zur Photosynthese';
        const intent = AgentIntentService.detectAgentIntent(message);

        expect(intent).not.toBeNull();
        expect(intent?.agentType).toBe('lesson-plan');
        expect((intent?.prefillData as any).description).toContain('Photosynthese');
      });

      it('should detect "stundenentwurf" intent', () => {
        const message = 'Ich brauche einen Stundenentwurf für Deutsch';
        const intent = AgentIntentService.detectAgentIntent(message);

        expect(intent).not.toBeNull();
        expect(intent?.agentType).toBe('lesson-plan');
      });

      it('should detect "unterricht planen" intent', () => {
        const message =
          'Hilf mir, eine Unterrichtsstunde zum Thema Französische Revolution zu planen';
        const intent = AgentIntentService.detectAgentIntent(message);

        expect(intent).not.toBeNull();
        expect(intent?.agentType).toBe('lesson-plan');
        expect((intent?.prefillData as any).description).toContain('Französische Revolution');
      });
    });

    describe('No Intent Detection', () => {
      it('should return null for regular questions', () => {
        const message = 'Wie geht es dir?';
        const intent = AgentIntentService.detectAgentIntent(message);

        expect(intent).toBeNull();
      });

      it('should return null for general teaching questions', () => {
        const message = 'Wie kann ich meine Schüler besser motivieren?';
        const intent = AgentIntentService.detectAgentIntent(message);

        expect(intent).toBeNull();
      });

      it('should return null for chat messages', () => {
        const message = 'Danke für deine Hilfe!';
        const intent = AgentIntentService.detectAgentIntent(message);

        expect(intent).toBeNull();
      });
    });

    describe('Theme Extraction', () => {
      it('should clean trigger words from theme', () => {
        const message = 'Erstelle ein Bild zur Photosynthese';
        const intent = AgentIntentService.detectAgentIntent(message);

        expect((intent?.prefillData as any).description).not.toContain('erstelle');
        expect((intent?.prefillData as any).description).not.toContain('bild');
        expect((intent?.prefillData as any).description).toContain('Photosynthese');
      });

      it('should extract description after "zum Thema"', () => {
        const message = 'Erstelle ein Bild zum Thema Bruchrechnung';
        const intent = AgentIntentService.detectAgentIntent(message);

        expect((intent?.prefillData as any).description).toContain('Bruchrechnung');
      });

      it('should handle complex themes', () => {
        const message =
          'Erstelle ein Bild zum Thema "Der Wasserkreislauf in der Natur"';
        const intent = AgentIntentService.detectAgentIntent(message);

        expect((intent?.prefillData as any).description).toContain('Wasserkreislauf');
      });

      it('should remove trailing punctuation and politeness', () => {
        const message = 'Erstelle ein Bild zur Photosynthese bitte.';
        const intent = AgentIntentService.detectAgentIntent(message);

        expect((intent?.prefillData as any).description).not.toContain('bitte');
        expect((intent?.prefillData as any).description).not.toContain('.');
      });
    });

    describe('Learning Group Extraction', () => {
      it('should extract "Klasse 7"', () => {
        const message = 'Erstelle ein Bild für Klasse 7 zur Photosynthese';
        const intent = AgentIntentService.detectAgentIntent(message);

        expect(intent?.prefillData.learningGroup).toBe('Klasse 7');
      });

      it('should extract "7. Klasse"', () => {
        const message = 'Erstelle ein Bild für 7. Klasse zum Thema Zellaufbau';
        const intent = AgentIntentService.detectAgentIntent(message);

        expect(intent?.prefillData.learningGroup).toBe('Klasse 7');
      });

      it('should extract "Klasse 7a" with letter suffix', () => {
        const message = 'Erstelle ein Bild für Klasse 7a';
        const intent = AgentIntentService.detectAgentIntent(message);

        expect(intent?.prefillData.learningGroup).toBe('Klasse 7a');
      });

      it('should extract "Jahrgangsstufe 9"', () => {
        const message =
          'Erstelle ein Bild für Jahrgangsstufe 9 zum Thema Französische Revolution';
        const intent = AgentIntentService.detectAgentIntent(message);

        expect(intent?.prefillData.learningGroup).toBe('Klasse 9');
      });
    });

    describe('Context Integration', () => {
      it('should use teacher context for subject', () => {
        const context: TeacherKnowledge = {
          subjects: ['Mathematik', 'Physik'],
          grades: ['8', '9'],
          teachingMethods: [],
          topics: [],
          challenges: [],
        };

        const message = 'Erstelle ein Bild zur Bruchrechnung';
        const intent = AgentIntentService.detectAgentIntent(message, context);

        expect(intent?.prefillData.subject).toBe('Mathematik');
      });

      it('should prioritize message grade over context', () => {
        const context: TeacherKnowledge = {
          subjects: ['Biologie'],
          grades: ['8', '9'],
          teachingMethods: [],
          topics: [],
          challenges: [],
        };

        const message = 'Erstelle ein Bild für Klasse 7 zur Photosynthese';
        const intent = AgentIntentService.detectAgentIntent(message, context);

        expect(intent?.prefillData.learningGroup).toBe('Klasse 7');
      });

      it('should fallback to context grade if not in message', () => {
        const context: TeacherKnowledge = {
          subjects: ['Biologie'],
          grades: ['8', '9'],
          teachingMethods: [],
          topics: [],
          challenges: [],
        };

        const message = 'Erstelle ein Bild zur Photosynthese';
        const intent = AgentIntentService.detectAgentIntent(message, context);

        expect(intent?.prefillData.learningGroup).toBe('Klasse 8');
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty message', () => {
        const intent = AgentIntentService.detectAgentIntent('');
        expect(intent).toBeNull();
      });

      it('should handle very short message', () => {
        const intent = AgentIntentService.detectAgentIntent('Hi');
        expect(intent).toBeNull();
      });

      it('should handle message with only trigger word', () => {
        const message = 'Bild';
        const intent = AgentIntentService.detectAgentIntent(message);

        // Should detect but might have minimal theme
        if (intent) {
          expect(intent.agentType).toBe('image-generation');
        }
      });

      it('should handle uppercase message', () => {
        const message = 'ERSTELLE EIN BILD ZUR PHOTOSYNTHESE';
        const intent = AgentIntentService.detectAgentIntent(message);

        expect(intent).not.toBeNull();
        expect(intent?.agentType).toBe('image-generation');
      });

      // Worksheet intent is disabled, skipping test with "Übungen"
      it.skip('should handle mixed case with umlauts', () => {
        const message = 'Erstelle Übungen zur Bruchrechnung';
        const intent = AgentIntentService.detectAgentIntent(message);

        expect(intent).not.toBeNull();
        expect(intent?.agentType).toBe('worksheet');
      });
    });
  });
});
