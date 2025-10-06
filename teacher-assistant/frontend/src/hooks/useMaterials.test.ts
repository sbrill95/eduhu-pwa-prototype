import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMaterials } from './useMaterials';
import type { UnifiedMaterial } from './useMaterials';

// Mock dependencies
vi.mock('../lib/instantdb', () => ({
  default: {
    useQuery: vi.fn(),
  },
}));

vi.mock('../lib/auth-context', () => ({
  useAuth: vi.fn(),
}));

import db from '../lib/instantdb';
import { useAuth } from '../lib/auth-context';

describe('useMaterials', () => {
  const mockUser = {
    id: 'test-user-123',
    email: 'test@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: user is authenticated
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isLoading: false,
      error: null,
      signOut: vi.fn(),
      sendMagicCode: vi.fn(),
      signInWithMagicCode: vi.fn(),
    });
  });

  it('should transform artifacts correctly', () => {
    // Mock data for artifacts
    const mockArtifacts = {
      artifacts: [
        {
          id: 'artifact-1',
          title: 'Mathe Arbeitsblatt',
          content: 'Dies ist ein Arbeitsblatt für Mathematik. Es behandelt Brüche und Dezimalzahlen.',
          type: 'worksheet',
          created_at: 1000000,
          updated_at: 1000500,
          is_favorite: true,
          usage_count: 5,
          tags: '["Mathematik", "Brüche"]',
          subject: 'Mathematik',
          grade_level: '5. Klasse',
        },
      ],
    };

    // Setup mocks
    let queryCallIndex = 0;
    vi.mocked(db.useQuery).mockImplementation(() => {
      queryCallIndex++;
      if (queryCallIndex === 1) {
        return { data: mockArtifacts, isLoading: false, error: null };
      }
      return { data: null, isLoading: false, error: null };
    });

    const { result } = renderHook(() => useMaterials());

    expect(result.current.materials).toHaveLength(1);
    expect(result.current.loading).toBe(false);

    const material = result.current.materials[0];
    expect(material.id).toBe('artifact-1');
    expect(material.title).toBe('Mathe Arbeitsblatt');
    expect(material.description).toBe('Dies ist ein Arbeitsblatt für Mathematik. Es behandelt Brüche und Dezimalzahlen.');
    expect(material.type).toBe('worksheet');
    expect(material.source).toBe('manual');
    expect(material.created_at).toBe(1000000);
    expect(material.updated_at).toBe(1000500);
    expect(material.is_favorite).toBe(true);
    expect(material.usage_count).toBe(5);
    expect(material.metadata.tags).toEqual(['Mathematik', 'Brüche']);
    expect(material.metadata.subject).toBe('Mathematik');
    expect(material.metadata.grade).toBe('5. Klasse');
    expect(material.metadata.content).toBe('Dies ist ein Arbeitsblatt für Mathematik. Es behandelt Brüche und Dezimalzahlen.');
  });

  it('should transform generated_artifacts correctly', () => {
    // Mock data for generated artifacts
    const mockGeneratedArtifacts = {
      generated_artifacts: [
        {
          id: 'generated-1',
          title: 'Generiertes Quiz',
          type: 'quiz',
          artifact_data: '{"questions": [{"q": "Was ist 2+2?", "a": "4"}]}',
          prompt: 'Erstelle ein Mathe-Quiz für Klasse 3',
          agent_id: 'quiz-agent',
          agent: { name: 'Quiz Generator' },
          model_used: 'gpt-4o',
          created_at: 2000000,
          updated_at: 2000500,
          is_favorite: false,
          usage_count: 2,
        },
      ],
    };

    // Setup mocks
    let queryCallIndex = 0;
    vi.mocked(db.useQuery).mockImplementation(() => {
      queryCallIndex++;
      if (queryCallIndex === 2) {
        return { data: mockGeneratedArtifacts, isLoading: false, error: null };
      }
      return { data: null, isLoading: false, error: null };
    });

    const { result } = renderHook(() => useMaterials());

    expect(result.current.materials).toHaveLength(1);
    expect(result.current.loading).toBe(false);

    const material = result.current.materials[0];
    expect(material.id).toBe('generated-1');
    expect(material.title).toBe('Generiertes Quiz');
    expect(material.type).toBe('quiz');
    expect(material.source).toBe('agent-generated');
    expect(material.description).toBe('Erstelle ein Mathe-Quiz für Klasse 3');
    expect(material.created_at).toBe(2000000);
    expect(material.updated_at).toBe(2000500);
    expect(material.is_favorite).toBe(false);
    expect(material.usage_count).toBe(2);
    expect(material.metadata.agent_id).toBe('quiz-agent');
    expect(material.metadata.agent_name).toBe('Quiz Generator');
    expect(material.metadata.prompt).toBe('Erstelle ein Mathe-Quiz für Klasse 3');
    expect(material.metadata.model_used).toBe('gpt-4o');
    expect(material.metadata.artifact_data).toEqual({
      questions: [{ q: 'Was ist 2+2?', a: '4' }],
    });
  });

  it('should extract uploads from messages', () => {
    // Mock data for messages with uploads
    const mockMessages = {
      messages: [
        {
          id: 'msg-1',
          content: '{"fileIds": ["file-123"], "filenames": ["test.pdf"]}',
          timestamp: 3000000,
        },
      ],
    };

    // Setup mocks
    let queryCallIndex = 0;
    vi.mocked(db.useQuery).mockImplementation(() => {
      queryCallIndex++;
      if (queryCallIndex === 3) {
        return { data: mockMessages, isLoading: false, error: null };
      }
      return { data: null, isLoading: false, error: null };
    });

    const { result } = renderHook(() => useMaterials());

    expect(result.current.materials).toHaveLength(1);
    expect(result.current.loading).toBe(false);

    const material = result.current.materials[0];
    expect(material.id).toBe('upload-file-file-123');
    expect(material.title).toBe('test.pdf');
    expect(material.type).toBe('upload-pdf');
    expect(material.source).toBe('upload');
    expect(material.created_at).toBe(3000000);
    expect(material.updated_at).toBe(3000000);
    expect(material.is_favorite).toBe(false);
    expect(material.metadata.filename).toBe('test.pdf');
    expect(material.metadata.file_url).toBe('file-123');
    expect(material.metadata.file_type).toBe('application/pdf');
  });

  it('should handle image uploads', () => {
    // Mock data for messages with image uploads
    const mockMessages = {
      messages: [
        {
          id: 'msg-2',
          content: '{"image_data": "data:image/jpeg;base64,/9j/4AAQ..."}',
          timestamp: 4000000,
        },
      ],
    };

    // Setup mocks
    let queryCallIndex = 0;
    vi.mocked(db.useQuery).mockImplementation(() => {
      queryCallIndex++;
      if (queryCallIndex === 3) {
        return { data: mockMessages, isLoading: false, error: null };
      }
      return { data: null, isLoading: false, error: null };
    });

    const { result } = renderHook(() => useMaterials());

    expect(result.current.materials).toHaveLength(1);
    expect(result.current.loading).toBe(false);

    const material = result.current.materials[0];
    expect(material.id).toBe('upload-img-msg-2');
    expect(material.title).toMatch(/^Bild vom/); // Matches "Bild vom [date]"
    expect(material.type).toBe('upload-image');
    expect(material.source).toBe('upload');
    expect(material.created_at).toBe(4000000);
    expect(material.updated_at).toBe(4000000);
    expect(material.is_favorite).toBe(false);
    expect(material.metadata.filename).toBe('image_msg-2.jpg');
    expect(material.metadata.file_type).toBe('image/jpeg');
    expect(material.metadata.image_data).toBe('data:image/jpeg;base64,/9j/4AAQ...');
  });

  it('should handle file uploads with different types', () => {
    // Mock data for messages with multiple file types
    const mockMessages = {
      messages: [
        {
          id: 'msg-3',
          content: '{"fileIds": ["file-1", "file-2", "file-3"], "filenames": ["document.pdf", "notes.docx", "data.txt"]}',
          timestamp: 5000000,
        },
      ],
    };

    // Setup mocks
    let queryCallIndex = 0;
    vi.mocked(db.useQuery).mockImplementation(() => {
      queryCallIndex++;
      if (queryCallIndex === 3) {
        return { data: mockMessages, isLoading: false, error: null };
      }
      return { data: null, isLoading: false, error: null };
    });

    const { result } = renderHook(() => useMaterials());

    expect(result.current.materials).toHaveLength(3);
    expect(result.current.loading).toBe(false);

    // Check PDF
    const pdfMaterial = result.current.materials.find((m) => m.title === 'document.pdf');
    expect(pdfMaterial).toBeDefined();
    expect(pdfMaterial!.type).toBe('upload-pdf');
    expect(pdfMaterial!.metadata.file_type).toBe('application/pdf');

    // Check DOCX
    const docxMaterial = result.current.materials.find((m) => m.title === 'notes.docx');
    expect(docxMaterial).toBeDefined();
    expect(docxMaterial!.type).toBe('upload-doc');
    expect(docxMaterial!.metadata.file_type).toBe('application/octet-stream');

    // Check TXT
    const txtMaterial = result.current.materials.find((m) => m.title === 'data.txt');
    expect(txtMaterial).toBeDefined();
    expect(txtMaterial!.type).toBe('upload-doc');
    expect(txtMaterial!.metadata.file_type).toBe('application/octet-stream');
  });

  it('should sort materials by updated_at descending', () => {
    // Mock data with different timestamps
    const mockArtifacts = {
      artifacts: [
        {
          id: 'artifact-1',
          title: 'Oldest',
          content: 'Content',
          type: 'worksheet',
          created_at: 1000000,
          updated_at: 1000000, // Oldest
          is_favorite: false,
          usage_count: 0,
        },
        {
          id: 'artifact-2',
          title: 'Middle',
          content: 'Content',
          type: 'quiz',
          created_at: 2000000,
          updated_at: 2000000, // Middle
          is_favorite: false,
          usage_count: 0,
        },
        {
          id: 'artifact-3',
          title: 'Newest',
          content: 'Content',
          type: 'lesson-plan',
          created_at: 3000000,
          updated_at: 3000000, // Newest
          is_favorite: false,
          usage_count: 0,
        },
      ],
    };

    // Setup mocks
    let queryCallIndex = 0;
    vi.mocked(db.useQuery).mockImplementation(() => {
      queryCallIndex++;
      if (queryCallIndex === 1) {
        return { data: mockArtifacts, isLoading: false, error: null };
      }
      return { data: null, isLoading: false, error: null };
    });

    const { result } = renderHook(() => useMaterials());

    expect(result.current.materials).toHaveLength(3);
    expect(result.current.loading).toBe(false);

    // Check sorting (newest first)
    expect(result.current.materials[0].title).toBe('Newest');
    expect(result.current.materials[0].updated_at).toBe(3000000);
    expect(result.current.materials[1].title).toBe('Middle');
    expect(result.current.materials[1].updated_at).toBe(2000000);
    expect(result.current.materials[2].title).toBe('Oldest');
    expect(result.current.materials[2].updated_at).toBe(1000000);
  });

  it('should handle empty data', () => {
    // Setup mocks with empty data
    vi.mocked(db.useQuery).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useMaterials());

    expect(result.current.materials).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  // Additional edge case tests
  it('should handle invalid JSON in artifact tags gracefully', () => {
    const mockArtifacts = {
      artifacts: [
        {
          id: 'artifact-1',
          title: 'Test',
          content: 'Content',
          type: 'worksheet',
          created_at: 1000000,
          updated_at: 1000000,
          is_favorite: false,
          usage_count: 0,
          tags: 'invalid-json{', // Invalid JSON
        },
      ],
    };

    let queryCallIndex = 0;
    vi.mocked(db.useQuery).mockImplementation(() => {
      queryCallIndex++;
      if (queryCallIndex === 1) {
        return { data: mockArtifacts, isLoading: false, error: null };
      }
      return { data: null, isLoading: false, error: null };
    });

    const { result } = renderHook(() => useMaterials());

    expect(result.current.materials).toHaveLength(1);
    expect(result.current.materials[0].metadata.tags).toEqual([]);
  });

  it('should handle invalid JSON in artifact_data gracefully', () => {
    const mockGeneratedArtifacts = {
      generated_artifacts: [
        {
          id: 'generated-1',
          title: 'Test',
          type: 'quiz',
          artifact_data: 'invalid-json{', // Invalid JSON
          prompt: 'Test prompt',
          agent_id: 'test-agent',
          created_at: 1000000,
          updated_at: 1000000,
          is_favorite: false,
          usage_count: 0,
        },
      ],
    };

    let queryCallIndex = 0;
    vi.mocked(db.useQuery).mockImplementation(() => {
      queryCallIndex++;
      if (queryCallIndex === 2) {
        return { data: mockGeneratedArtifacts, isLoading: false, error: null };
      }
      return { data: null, isLoading: false, error: null };
    });

    const { result } = renderHook(() => useMaterials());

    expect(result.current.materials).toHaveLength(1);
    expect(result.current.materials[0].metadata.artifact_data).toEqual({});
  });

  it('should handle invalid JSON in message content gracefully', () => {
    const mockMessages = {
      messages: [
        {
          id: 'msg-1',
          content: 'invalid-json{', // Invalid JSON
          timestamp: 1000000,
        },
      ],
    };

    let queryCallIndex = 0;
    vi.mocked(db.useQuery).mockImplementation(() => {
      queryCallIndex++;
      if (queryCallIndex === 3) {
        return { data: mockMessages, isLoading: false, error: null };
      }
      return { data: null, isLoading: false, error: null };
    });

    const { result } = renderHook(() => useMaterials());

    // Should not crash, just skip invalid messages
    expect(result.current.materials).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('should set loading state when any query is loading', () => {
    // Setup mocks with loading state
    let queryCallIndex = 0;
    vi.mocked(db.useQuery).mockImplementation(() => {
      queryCallIndex++;
      if (queryCallIndex === 1) {
        return { data: null, isLoading: true, error: null }; // Artifacts loading
      }
      return { data: null, isLoading: false, error: null };
    });

    const { result } = renderHook(() => useMaterials());

    expect(result.current.loading).toBe(true);
  });

  it('should handle missing optional fields', () => {
    const mockArtifacts = {
      artifacts: [
        {
          id: 'artifact-1',
          title: 'Test',
          content: 'Content',
          type: 'worksheet',
          created_at: 1000000,
          updated_at: 1000000,
          is_favorite: false,
          usage_count: 0,
          // Missing: tags, subject, grade_level
        },
      ],
    };

    let queryCallIndex = 0;
    vi.mocked(db.useQuery).mockImplementation(() => {
      queryCallIndex++;
      if (queryCallIndex === 1) {
        return { data: mockArtifacts, isLoading: false, error: null };
      }
      return { data: null, isLoading: false, error: null };
    });

    const { result } = renderHook(() => useMaterials());

    expect(result.current.materials).toHaveLength(1);
    const material = result.current.materials[0];
    expect(material.metadata.tags).toEqual([]);
    expect(material.metadata.subject).toBeUndefined();
    expect(material.metadata.grade).toBeUndefined();
  });

  it('should return empty array when user is not authenticated', () => {
    // Mock: no user
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      error: null,
      signOut: vi.fn(),
      sendMagicCode: vi.fn(),
      signInWithMagicCode: vi.fn(),
    });

    vi.mocked(db.useQuery).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useMaterials());

    expect(result.current.materials).toEqual([]);
    expect(result.current.loading).toBe(false);
  });
});