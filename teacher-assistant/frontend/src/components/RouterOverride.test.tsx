import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { RouterOverride } from './RouterOverride';

/**
 * RouterOverride Component Tests
 *
 * Tests manual override UI for router classification (AC5)
 */

describe('RouterOverride Component', () => {
  const mockOnSelect = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    test('should render with create intent', () => {
      render(
        <RouterOverride
          detectedIntent="create"
          confidence={0.85}
          onSelect={mockOnSelect}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText(/möchtest ein Bild erstellen/i)).toBeInTheDocument();
    });

    test('should render with edit intent', () => {
      render(
        <RouterOverride
          detectedIntent="edit"
          confidence={0.75}
          onSelect={mockOnSelect}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText(/möchtest ein Bild bearbeiten/i)).toBeInTheDocument();
    });

    test('should display confidence percentage', () => {
      render(
        <RouterOverride
          detectedIntent="create"
          confidence={0.85}
          onSelect={mockOnSelect}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    test('should display confidence bar', () => {
      const { container } = render(
        <RouterOverride
          detectedIntent="create"
          confidence={0.85}
          onSelect={mockOnSelect}
          onConfirm={mockOnConfirm}
        />
      );

      const progressBar = container.querySelector('.bg-blue-600');
      expect(progressBar).toHaveStyle({ width: '85%' });
    });

    test('should show manual selection buttons', () => {
      render(
        <RouterOverride
          detectedIntent="create"
          confidence={0.75}
          onSelect={mockOnSelect}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText('🎨 Erstellen')).toBeInTheDocument();
      expect(screen.getByText('✏️ Bearbeiten')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    test('should call onConfirm when user confirms detected intent', () => {
      render(
        <RouterOverride
          detectedIntent="create"
          confidence={0.85}
          onSelect={mockOnSelect}
          onConfirm={mockOnConfirm}
        />
      );

      const confirmButton = screen.getByText('✓ Ja, das stimmt');
      fireEvent.click(confirmButton);

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    test('should call onSelect with "create" when user selects create', () => {
      render(
        <RouterOverride
          detectedIntent="edit" // Detected edit, user overrides to create
          confidence={0.75}
          onSelect={mockOnSelect}
          onConfirm={mockOnConfirm}
        />
      );

      const createButton = screen.getByText('🎨 Erstellen');
      fireEvent.click(createButton);

      expect(mockOnSelect).toHaveBeenCalledWith('create');
    });

    test('should call onSelect with "edit" when user selects edit', () => {
      render(
        <RouterOverride
          detectedIntent="create" // Detected create, user overrides to edit
          confidence={0.75}
          onSelect={mockOnSelect}
          onConfirm={mockOnConfirm}
        />
      );

      const editButton = screen.getByText('✏️ Bearbeiten');
      fireEvent.click(editButton);

      expect(mockOnSelect).toHaveBeenCalledWith('edit');
    });

    test('should disable currently detected intent button', () => {
      render(
        <RouterOverride
          detectedIntent="create"
          confidence={0.85}
          onSelect={mockOnSelect}
          onConfirm={mockOnConfirm}
        />
      );

      const createButton = screen.getByText('🎨 Erstellen');
      expect(createButton).toBeDisabled();
    });

    test('should enable opposite intent button', () => {
      render(
        <RouterOverride
          detectedIntent="create"
          confidence={0.85}
          onSelect={mockOnSelect}
          onConfirm={mockOnConfirm}
        />
      );

      const editButton = screen.getByText('✏️ Bearbeiten');
      expect(editButton).not.toBeDisabled();
    });
  });

  describe('Confidence Level Display', () => {
    test('should show high confidence (≥90%) in green', () => {
      render(
        <RouterOverride
          detectedIntent="create"
          confidence={0.95}
          onSelect={mockOnSelect}
          onConfirm={mockOnConfirm}
        />
      );

      const confidenceText = screen.getByText('95%');
      expect(confidenceText).toHaveClass('text-green-600');
    });

    test('should show medium confidence (70-89%) in yellow', () => {
      render(
        <RouterOverride
          detectedIntent="create"
          confidence={0.75}
          onSelect={mockOnSelect}
          onConfirm={mockOnConfirm}
        />
      );

      const confidenceText = screen.getByText('75%');
      expect(confidenceText).toHaveClass('text-yellow-600');
    });

    test('should show low confidence (<70%) in red', () => {
      render(
        <RouterOverride
          detectedIntent="create"
          confidence={0.65}
          onSelect={mockOnSelect}
          onConfirm={mockOnConfirm}
        />
      );

      const confidenceText = screen.getByText('65%');
      expect(confidenceText).toHaveClass('text-red-600');
    });
  });

  describe('Accessibility', () => {
    test('should have accessible button labels', () => {
      render(
        <RouterOverride
          detectedIntent="create"
          confidence={0.85}
          onSelect={mockOnSelect}
          onConfirm={mockOnConfirm}
        />
      );

      const confirmButton = screen.getByText('✓ Ja, das stimmt');
      expect(confirmButton.tagName).toBe('BUTTON');
    });

    test('should show help text for user guidance', () => {
      render(
        <RouterOverride
          detectedIntent="create"
          confidence={0.85}
          onSelect={mockOnSelect}
          onConfirm={mockOnConfirm}
        />
      );

      expect(
        screen.getByText(/Deine Auswahl wird gespeichert/i)
      ).toBeInTheDocument();
    });
  });
});
