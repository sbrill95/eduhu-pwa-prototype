import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PromptTile } from './PromptTile';
import type { PromptSuggestion } from '../lib/types';

describe('PromptTile', () => {
  const mockSuggestion: PromptSuggestion = {
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
  };

  let mockOnClick: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnClick = vi.fn();
  });

  it('should render title, description, and category', () => {
    render(<PromptTile suggestion={mockSuggestion} onClick={mockOnClick} />);

    // Check if title is rendered
    expect(screen.getByTestId('prompt-title')).toHaveTextContent('Erstelle ein Quiz');

    // Check if description is rendered
    expect(screen.getByTestId('prompt-description')).toHaveTextContent(
      'Mathematik für 7. Klasse'
    );

    // Check if category is rendered
    expect(screen.getByTestId('prompt-category')).toHaveTextContent('quiz');
  });

  it('should display correct icon', () => {
    render(<PromptTile suggestion={mockSuggestion} onClick={mockOnClick} />);

    // Check if icon container exists
    const iconContainer = screen.getByTestId('prompt-icon-container');
    expect(iconContainer).toBeInTheDocument();

    // Check if icon exists
    const icon = screen.getByTestId('prompt-icon');
    expect(icon).toBeInTheDocument();
  });

  it('should call onClick handler with prompt when clicked', () => {
    render(<PromptTile suggestion={mockSuggestion} onClick={mockOnClick} />);

    // Find the card element
    const card = screen.getByTestId(`prompt-tile-${mockSuggestion.id}`);

    // Click the card
    fireEvent.click(card);

    // Verify onClick was called with the prompt
    expect(mockOnClick).toHaveBeenCalledWith(mockSuggestion.prompt);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should apply border color matching suggestion color', () => {
    render(<PromptTile suggestion={mockSuggestion} onClick={mockOnClick} />);

    const card = screen.getByTestId(`prompt-tile-${mockSuggestion.id}`);

    // Check if border-left style is applied
    expect(card).toHaveStyle({ borderLeft: `4px solid ${mockSuggestion.color}` });
  });

  it('should display estimated time', () => {
    render(<PromptTile suggestion={mockSuggestion} onClick={mockOnClick} />);

    const timeElement = screen.getByTestId('prompt-time');
    expect(timeElement).toHaveTextContent('2-3 Minuten');
  });

  it('should apply icon background color with opacity', () => {
    render(<PromptTile suggestion={mockSuggestion} onClick={mockOnClick} />);

    const iconContainer = screen.getByTestId('prompt-icon-container');

    // Check if background color is applied with 20% opacity
    expect(iconContainer).toHaveStyle({
      backgroundColor: `${mockSuggestion.color}20`,
    });
  });

  it('should render with different suggestion data', () => {
    const differentSuggestion: PromptSuggestion = {
      id: 'prompt-2',
      title: 'Erstelle Arbeitsblatt',
      description: 'Übungsaufgaben für Deutsch',
      prompt: 'Erstelle ein Arbeitsblatt für Deutsch.',
      category: 'worksheet',
      icon: 'documentTextOutline',
      color: '#FFBB00',
      estimatedTime: '3-4 Minuten',
      metadata: {
        templateId: 'worksheet-exercises',
        personalized: true,
      },
    };

    render(<PromptTile suggestion={differentSuggestion} onClick={mockOnClick} />);

    expect(screen.getByTestId('prompt-title')).toHaveTextContent('Erstelle Arbeitsblatt');
    expect(screen.getByTestId('prompt-description')).toHaveTextContent(
      'Übungsaufgaben für Deutsch'
    );
    expect(screen.getByTestId('prompt-category')).toHaveTextContent('worksheet');
    expect(screen.getByTestId('prompt-time')).toHaveTextContent('3-4 Minuten');
  });

  it('should handle multiple clicks', () => {
    render(<PromptTile suggestion={mockSuggestion} onClick={mockOnClick} />);

    const card = screen.getByTestId(`prompt-tile-${mockSuggestion.id}`);

    // Click multiple times
    fireEvent.click(card);
    fireEvent.click(card);
    fireEvent.click(card);

    expect(mockOnClick).toHaveBeenCalledTimes(3);
  });
});
