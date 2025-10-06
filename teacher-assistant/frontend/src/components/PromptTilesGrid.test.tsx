import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PromptTilesGrid } from './PromptTilesGrid';
import type { PromptSuggestion } from '../lib/types';

describe('PromptTilesGrid', () => {
  const mockSuggestions: PromptSuggestion[] = [
    {
      id: 'prompt-1',
      title: 'Erstelle ein Quiz',
      description: 'Mathematik für 7. Klasse',
      prompt: 'Erstelle ein Quiz für Mathematik, 7. Klasse zum Thema Bruchrechnung.',
      category: 'quiz',
      icon: 'helpCircleOutline',
      color: '#FB6542',
      estimatedTime: '2-3 Minuten',
      metadata: {
        templateId: 'quiz-basic',
        personalized: true,
      },
    },
    {
      id: 'prompt-2',
      title: 'Erstelle Arbeitsblatt',
      description: 'Übungsaufgaben für Mathematik',
      prompt: 'Erstelle ein Arbeitsblatt mit Übungsaufgaben für Mathematik, 7. Klasse.',
      category: 'worksheet',
      icon: 'documentTextOutline',
      color: '#FFBB00',
      estimatedTime: '3-4 Minuten',
      metadata: {
        templateId: 'worksheet-exercises',
        personalized: true,
      },
    },
    {
      id: 'prompt-3',
      title: 'Erstelle ein Bild',
      description: 'Visuelles Material',
      prompt: 'Erstelle ein Bild für Mathematik-Unterricht.',
      category: 'image',
      icon: 'imageOutline',
      color: '#4CAF50',
      estimatedTime: '1-2 Minuten',
      metadata: {
        templateId: 'image-generation',
        personalized: true,
      },
    },
  ];

  let mockOnPromptClick: ReturnType<typeof vi.fn>;
  let mockOnRefresh: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnPromptClick = vi.fn();
    mockOnRefresh = vi.fn();
  });

  it('should render grid with correct number of tiles', () => {
    render(
      <PromptTilesGrid
        suggestions={mockSuggestions}
        loading={false}
        error={null}
        onPromptClick={mockOnPromptClick}
        onRefresh={mockOnRefresh}
      />
    );

    // Check if grid is rendered
    const grid = screen.getByTestId('prompt-tiles-grid');
    expect(grid).toBeInTheDocument();

    // Check if all tiles are rendered
    expect(screen.getByTestId('prompt-tile-prompt-1')).toBeInTheDocument();
    expect(screen.getByTestId('prompt-tile-prompt-2')).toBeInTheDocument();
    expect(screen.getByTestId('prompt-tile-prompt-3')).toBeInTheDocument();
  });

  it('should show loading state with spinner', () => {
    render(
      <PromptTilesGrid
        suggestions={[]}
        loading={true}
        error={null}
        onPromptClick={mockOnPromptClick}
        onRefresh={mockOnRefresh}
      />
    );

    // Check if loading indicator is shown
    const loadingElement = screen.getByTestId('prompt-grid-loading');
    expect(loadingElement).toBeInTheDocument();
    expect(screen.getByText('Lade Vorschläge...')).toBeInTheDocument();

    // Grid should not be rendered
    expect(screen.queryByTestId('prompt-tiles-grid')).not.toBeInTheDocument();
  });

  it('should show error state with error message and retry button', () => {
    const errorMessage = 'Fehler beim Laden der Vorschläge';

    render(
      <PromptTilesGrid
        suggestions={[]}
        loading={false}
        error={errorMessage}
        onPromptClick={mockOnPromptClick}
        onRefresh={mockOnRefresh}
      />
    );

    // Check if error message is displayed
    expect(screen.getByTestId('prompt-grid-error')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();

    // Check if retry button is present
    const retryButton = screen.getByTestId('retry-button');
    expect(retryButton).toBeInTheDocument();
    expect(retryButton).toHaveTextContent('Erneut versuchen');
  });

  it('should call onRefresh when refresh button is clicked', () => {
    render(
      <PromptTilesGrid
        suggestions={mockSuggestions}
        loading={false}
        error={null}
        onPromptClick={mockOnPromptClick}
        onRefresh={mockOnRefresh}
      />
    );

    // Find and click refresh button
    const refreshButton = screen.getByTestId('refresh-button');
    fireEvent.click(refreshButton);

    // Verify onRefresh was called
    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });

  it('should call onPromptClick when a tile is clicked', () => {
    render(
      <PromptTilesGrid
        suggestions={mockSuggestions}
        loading={false}
        error={null}
        onPromptClick={mockOnPromptClick}
        onRefresh={mockOnRefresh}
      />
    );

    // Click the first tile
    const firstTile = screen.getByTestId('prompt-tile-prompt-1');
    fireEvent.click(firstTile);

    // Verify onPromptClick was called with the prompt
    expect(mockOnPromptClick).toHaveBeenCalledWith(mockSuggestions[0].prompt);
  });

  it('should display grid title', () => {
    render(
      <PromptTilesGrid
        suggestions={mockSuggestions}
        loading={false}
        error={null}
        onPromptClick={mockOnPromptClick}
        onRefresh={mockOnRefresh}
      />
    );

    const title = screen.getByTestId('grid-title');
    expect(title).toHaveTextContent('Vorschläge für dich');
  });

  it('should show empty state when suggestions array is empty', () => {
    render(
      <PromptTilesGrid
        suggestions={[]}
        loading={false}
        error={null}
        onPromptClick={mockOnPromptClick}
        onRefresh={mockOnRefresh}
      />
    );

    // Check if empty state is displayed
    const emptyState = screen.getByTestId('prompt-grid-empty');
    expect(emptyState).toBeInTheDocument();
    expect(screen.getByText('Keine Vorschläge verfügbar.')).toBeInTheDocument();
  });

  it('should call onRefresh when retry button in error state is clicked', () => {
    render(
      <PromptTilesGrid
        suggestions={[]}
        loading={false}
        error="Test error"
        onPromptClick={mockOnPromptClick}
        onRefresh={mockOnRefresh}
      />
    );

    // Click retry button
    const retryButton = screen.getByTestId('retry-button');
    fireEvent.click(retryButton);

    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });

  it('should render correct number of tiles for different suggestion counts', () => {
    const singleSuggestion = [mockSuggestions[0]];

    render(
      <PromptTilesGrid
        suggestions={singleSuggestion}
        loading={false}
        error={null}
        onPromptClick={mockOnPromptClick}
        onRefresh={mockOnRefresh}
      />
    );

    // Only one tile should be rendered
    expect(screen.getByTestId('prompt-tile-prompt-1')).toBeInTheDocument();
    expect(screen.queryByTestId('prompt-tile-prompt-2')).not.toBeInTheDocument();
  });
});
