/**
 * Materials Management Routes - Unit Tests
 * Library & Materials Unification Feature
 *
 * Tests for TASK-008 and TASK-009:
 * - Update material title endpoint
 * - Delete material endpoint
 */

import request from 'supertest';
import express, { Application } from 'express';
import materialsRouter from './materials';
import * as instantdbService from '../services/instantdbService';

// Mock the InstantDB service
jest.mock('../services/instantdbService');
jest.mock('../config/logger');

describe('Materials Management Routes', () => {
  let app: Application;
  let mockDB: any;

  beforeEach(() => {
    // Create Express app for testing
    app = express();
    app.use(express.json());
    app.use('/api/materials', materialsRouter);

    // Setup mock DB with transaction and query methods
    mockDB = {
      tx: {
        artifacts: {},
        generated_artifacts: {},
      },
      transact: jest.fn().mockResolvedValue({ txId: 'mock-tx-id' }),
      query: jest.fn(),
    };

    // Mock InstantDB service functions
    (instantdbService.isInstantDBAvailable as jest.Mock).mockReturnValue(true);
    (instantdbService.getInstantDB as jest.Mock).mockReturnValue(mockDB);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // TASK-008 Tests: Update Material Title
  // ==========================================

  describe('POST /api/materials/update-title', () => {
    describe('Manual artifacts', () => {
      it('should successfully update a manual artifact title', async () => {
        const materialId = 'artifact-123';
        const newTitle = 'Updated Lesson Plan';

        // Mock artifact exists
        mockDB.query.mockResolvedValueOnce({
          artifacts: [
            {
              id: materialId,
              title: 'Old Title',
              creator: { id: 'user-123' },
            },
          ],
        });

        // Mock update transaction
        mockDB.tx.artifacts[materialId] = {
          update: jest.fn(),
        };

        const response = await request(app)
          .post('/api/materials/update-title')
          .send({
            materialId,
            newTitle,
            source: 'manual',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.materialId).toBe(materialId);
        expect(response.body.data.newTitle).toBe(newTitle);
        expect(response.body.data.source).toBe('manual');
        expect(mockDB.transact).toHaveBeenCalledTimes(1);
      });

      it('should return 404 if manual artifact not found', async () => {
        const materialId = 'nonexistent-123';

        // Mock artifact does not exist
        mockDB.query.mockResolvedValueOnce({
          artifacts: [],
        });

        const response = await request(app)
          .post('/api/materials/update-title')
          .send({
            materialId,
            newTitle: 'Updated Title',
            source: 'manual',
          });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Material nicht gefunden.');
        expect(mockDB.transact).not.toHaveBeenCalled();
      });
    });

    describe('Generated artifacts', () => {
      it('should successfully update a generated artifact title', async () => {
        const materialId = 'generated-456';
        const newTitle = 'AI Generated Worksheet';

        // Mock generated artifact exists
        mockDB.query.mockResolvedValueOnce({
          generated_artifacts: [
            {
              id: materialId,
              title: 'Old Generated Title',
              creator: { id: 'user-123' },
            },
          ],
        });

        // Mock update transaction
        mockDB.tx.generated_artifacts[materialId] = {
          update: jest.fn(),
        };

        const response = await request(app)
          .post('/api/materials/update-title')
          .send({
            materialId,
            newTitle,
            source: 'agent-generated',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.materialId).toBe(materialId);
        expect(response.body.data.newTitle).toBe(newTitle);
        expect(response.body.data.source).toBe('agent-generated');
        expect(mockDB.transact).toHaveBeenCalledTimes(1);
      });

      it('should return 404 if generated artifact not found', async () => {
        const materialId = 'nonexistent-456';

        // Mock generated artifact does not exist
        mockDB.query.mockResolvedValueOnce({
          generated_artifacts: [],
        });

        const response = await request(app)
          .post('/api/materials/update-title')
          .send({
            materialId,
            newTitle: 'Updated Title',
            source: 'agent-generated',
          });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Material nicht gefunden.');
        expect(mockDB.transact).not.toHaveBeenCalled();
      });
    });

    describe('Upload title change rejection', () => {
      it('should reject title change for uploads', async () => {
        const response = await request(app)
          .post('/api/materials/update-title')
          .send({
            materialId: 'upload-789',
            newTitle: 'New Upload Title',
            source: 'upload',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe(
          'Upload-Titel können nicht geändert werden (der Dateiname dient als Titel).'
        );
        expect(mockDB.transact).not.toHaveBeenCalled();
      });
    });

    describe('Validation', () => {
      it('should reject request with missing materialId', async () => {
        const response = await request(app)
          .post('/api/materials/update-title')
          .send({
            newTitle: 'Updated Title',
            source: 'manual',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Fehlende Pflichtfelder');
      });

      it('should reject request with missing newTitle', async () => {
        const response = await request(app)
          .post('/api/materials/update-title')
          .send({
            materialId: 'artifact-123',
            source: 'manual',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Fehlende Pflichtfelder');
      });

      it('should reject request with missing source', async () => {
        const response = await request(app)
          .post('/api/materials/update-title')
          .send({
            materialId: 'artifact-123',
            newTitle: 'Updated Title',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Fehlende Pflichtfelder');
      });

      it('should reject request with empty title', async () => {
        const response = await request(app)
          .post('/api/materials/update-title')
          .send({
            materialId: 'artifact-123',
            newTitle: '   ',
            source: 'manual',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe(
          'Der neue Titel darf nicht leer sein.'
        );
      });

      it('should reject request with invalid source type', async () => {
        const response = await request(app)
          .post('/api/materials/update-title')
          .send({
            materialId: 'artifact-123',
            newTitle: 'Updated Title',
            source: 'invalid-source',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Ungültige Quelle');
      });
    });

    describe('Database availability', () => {
      it('should return 503 if InstantDB is not available', async () => {
        (instantdbService.isInstantDBAvailable as jest.Mock).mockReturnValue(
          false
        );

        const response = await request(app)
          .post('/api/materials/update-title')
          .send({
            materialId: 'artifact-123',
            newTitle: 'Updated Title',
            source: 'manual',
          });

        expect(response.status).toBe(503);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe(
          'Datenbank ist vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut.'
        );
      });
    });

    describe('Error handling', () => {
      it('should handle database errors gracefully', async () => {
        // Mock artifact exists
        mockDB.query.mockResolvedValueOnce({
          artifacts: [
            {
              id: 'artifact-123',
              title: 'Old Title',
              creator: { id: 'user-123' },
            },
          ],
        });

        // Mock transact to throw error
        mockDB.transact.mockRejectedValueOnce(new Error('Database error'));

        const response = await request(app)
          .post('/api/materials/update-title')
          .send({
            materialId: 'artifact-123',
            newTitle: 'Updated Title',
            source: 'manual',
          });

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe(
          'Ein Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.'
        );
      });
    });
  });

  // ==========================================
  // TASK-009 Tests: Delete Material
  // ==========================================

  describe('DELETE /api/materials/:id', () => {
    describe('Manual artifacts', () => {
      it('should successfully delete a manual artifact', async () => {
        const materialId = 'artifact-123';

        // Mock artifact exists
        mockDB.query.mockResolvedValueOnce({
          artifacts: [
            {
              id: materialId,
              title: 'Lesson Plan to Delete',
              creator: { id: 'user-123' },
            },
          ],
        });

        // Mock delete transaction
        mockDB.tx.artifacts[materialId] = {
          delete: jest.fn(),
        };

        const response = await request(app)
          .delete(`/api/materials/${materialId}`)
          .query({ source: 'manual' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.materialId).toBe(materialId);
        expect(response.body.data.source).toBe('manual');
        expect(mockDB.transact).toHaveBeenCalledTimes(1);
      });

      it('should return 404 if manual artifact not found', async () => {
        const materialId = 'nonexistent-123';

        // Mock artifact does not exist
        mockDB.query.mockResolvedValueOnce({
          artifacts: [],
        });

        const response = await request(app)
          .delete(`/api/materials/${materialId}`)
          .query({ source: 'manual' });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Material nicht gefunden.');
        expect(mockDB.transact).not.toHaveBeenCalled();
      });
    });

    describe('Generated artifacts', () => {
      it('should successfully delete a generated artifact', async () => {
        const materialId = 'generated-456';

        // Mock generated artifact exists
        mockDB.query.mockResolvedValueOnce({
          generated_artifacts: [
            {
              id: materialId,
              title: 'AI Image to Delete',
              creator: { id: 'user-123' },
            },
          ],
        });

        // Mock delete transaction
        mockDB.tx.generated_artifacts[materialId] = {
          delete: jest.fn(),
        };

        const response = await request(app)
          .delete(`/api/materials/${materialId}`)
          .query({ source: 'agent-generated' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.materialId).toBe(materialId);
        expect(response.body.data.source).toBe('agent-generated');
        expect(mockDB.transact).toHaveBeenCalledTimes(1);
      });

      it('should return 404 if generated artifact not found', async () => {
        const materialId = 'nonexistent-456';

        // Mock generated artifact does not exist
        mockDB.query.mockResolvedValueOnce({
          generated_artifacts: [],
        });

        const response = await request(app)
          .delete(`/api/materials/${materialId}`)
          .query({ source: 'agent-generated' });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Material nicht gefunden.');
        expect(mockDB.transact).not.toHaveBeenCalled();
      });
    });

    describe('Upload deletion rejection', () => {
      it('should reject deletion for uploads', async () => {
        const materialId = 'upload-789';

        const response = await request(app)
          .delete(`/api/materials/${materialId}`)
          .query({ source: 'upload' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe(
          'Uploads können nicht direkt gelöscht werden (sie sind in Nachrichten gespeichert).'
        );
        expect(mockDB.transact).not.toHaveBeenCalled();
      });
    });

    describe('Validation', () => {
      it('should reject request with missing source parameter', async () => {
        const response = await request(app).delete(
          '/api/materials/artifact-123'
        );

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe(
          'Fehlende Quelle (source-Parameter erforderlich).'
        );
      });

      it('should reject request with invalid source type', async () => {
        const response = await request(app)
          .delete('/api/materials/artifact-123')
          .query({ source: 'invalid-source' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Ungültige Quelle');
      });
    });

    describe('Database availability', () => {
      it('should return 503 if InstantDB is not available', async () => {
        (instantdbService.isInstantDBAvailable as jest.Mock).mockReturnValue(
          false
        );

        const response = await request(app)
          .delete('/api/materials/artifact-123')
          .query({ source: 'manual' });

        expect(response.status).toBe(503);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe(
          'Datenbank ist vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut.'
        );
      });
    });

    describe('Error handling', () => {
      it('should handle database errors gracefully', async () => {
        // Mock artifact exists
        mockDB.query.mockResolvedValueOnce({
          artifacts: [
            {
              id: 'artifact-123',
              title: 'Lesson Plan',
              creator: { id: 'user-123' },
            },
          ],
        });

        // Mock transact to throw error
        mockDB.transact.mockRejectedValueOnce(new Error('Database error'));

        const response = await request(app)
          .delete('/api/materials/artifact-123')
          .query({ source: 'manual' });

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe(
          'Ein Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.'
        );
      });
    });
  });

  // ==========================================
  // Integration Tests
  // ==========================================

  describe('Integration Tests', () => {
    it('should support complete workflow: update title then delete', async () => {
      const materialId = 'artifact-workflow';
      const newTitle = 'Updated Workflow Title';

      // Step 1: Update title
      mockDB.query.mockResolvedValueOnce({
        artifacts: [
          {
            id: materialId,
            title: 'Original Title',
            creator: { id: 'user-123' },
          },
        ],
      });

      mockDB.tx.artifacts[materialId] = {
        update: jest.fn(),
        delete: jest.fn(),
      };

      const updateResponse = await request(app)
        .post('/api/materials/update-title')
        .send({
          materialId,
          newTitle,
          source: 'manual',
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);

      // Step 2: Delete the material
      mockDB.query.mockResolvedValueOnce({
        artifacts: [
          {
            id: materialId,
            title: newTitle,
            creator: { id: 'user-123' },
          },
        ],
      });

      const deleteResponse = await request(app)
        .delete(`/api/materials/${materialId}`)
        .query({ source: 'manual' });

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);
      expect(mockDB.transact).toHaveBeenCalledTimes(2);
    });

    it('should handle mixed material types independently', async () => {
      // Update manual artifact
      mockDB.query.mockResolvedValueOnce({
        artifacts: [
          { id: 'manual-1', title: 'Manual', creator: { id: 'user-123' } },
        ],
      });

      mockDB.tx.artifacts['manual-1'] = { update: jest.fn() };

      const manualResponse = await request(app)
        .post('/api/materials/update-title')
        .send({
          materialId: 'manual-1',
          newTitle: 'Updated Manual',
          source: 'manual',
        });

      expect(manualResponse.status).toBe(200);

      // Update generated artifact
      mockDB.query.mockResolvedValueOnce({
        generated_artifacts: [
          {
            id: 'generated-1',
            title: 'Generated',
            creator: { id: 'user-123' },
          },
        ],
      });

      mockDB.tx.generated_artifacts['generated-1'] = { update: jest.fn() };

      const generatedResponse = await request(app)
        .post('/api/materials/update-title')
        .send({
          materialId: 'generated-1',
          newTitle: 'Updated Generated',
          source: 'agent-generated',
        });

      expect(generatedResponse.status).toBe(200);
      expect(mockDB.transact).toHaveBeenCalledTimes(2);
    });
  });
});
