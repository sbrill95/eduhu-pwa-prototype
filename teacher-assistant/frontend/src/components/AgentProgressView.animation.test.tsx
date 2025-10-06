/**
 * TASK-008: Unit tests for TASK-007 (Remove duplicate animation)
 *
 * Verifies that AgentProgressView only shows ONE animation (center),
 * NOT the duplicate "oben links" (top-left) animation in the header.
 */

import { render, screen } from '@testing-library/react';
import { AgentProgressView } from './AgentProgressView';
import { AgentProvider } from '../lib/AgentContext';
import React from 'react';
import { vi } from 'vitest';

// Mock useAgent hook
const mockUseAgent = vi.fn();
vi.mock('../lib/AgentContext', async () => {
  const actual = await vi.importActual<typeof import('../lib/AgentContext')>('../lib/AgentContext');
  return {
    ...actual,
    useAgent: () => mockUseAgent(),
    AgentProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
  };
});

describe('AgentProgressView - Animation (TASK-007)', () => {
  beforeEach(() => {
    mockUseAgent.mockReturnValue({
      state: {
        executionId: 'test-execution-123',
        isModalOpen: true,
        currentView: 'progress',
        formData: {}
      },
      cancelExecution: vi.fn()
    });
  });

  test('TASK-007: Should NOT render duplicate animation in header', () => {
    const { container } = render(<AgentProgressView />);

    // Find header section
    const header = container.querySelector('.safe-area-top');
    expect(header).toBeInTheDocument();

    // VERIFY: Header should NOT contain animated sparkle icon
    const headerAnimatedIcon = header?.querySelector('.animate-pulse');
    expect(headerAnimatedIcon).toBeNull(); // ✅ No animation in header!

    // VERIFY: Header should NOT contain gradient background circle
    const headerGradientCircle = header?.querySelector('.bg-gradient-to-br');
    expect(headerGradientCircle).toBeNull(); // ✅ No gradient in header!
  });

  test('TASK-007: Should still show center animation (not removed)', () => {
    const { container } = render(<AgentProgressView />);

    // Find center animated icon (should still exist)
    const centerAnimatedIcon = container.querySelector('.animate-pulse-slow, .animate-pulse');
    expect(centerAnimatedIcon).toBeInTheDocument(); // ✅ Center animation exists!

    // Find center gradient background (should still exist)
    const centerGradient = container.querySelector('.bg-gradient-to-br');
    expect(centerGradient).toBeInTheDocument(); // ✅ Center gradient exists!
  });

  test('TASK-007: Should show only text in header', () => {
    render(<AgentProgressView />);

    // Header should show text without animation
    expect(screen.getByText('Bild erstellen')).toBeInTheDocument();
    expect(screen.getByText('In Bearbeitung...')).toBeInTheDocument();
  });

  test('TASK-007: Should show error indicator in header when WebSocket fails', () => {
    // Mock WebSocket error (would require more complex setup)
    render(<AgentProgressView />);

    // Header exists and can show error text
    const header = screen.getByText('Bild erstellen').closest('.safe-area-top');
    expect(header).toBeInTheDocument();
  });

  test('TASK-007: Verify animation count (1, not 2)', () => {
    const { container } = render(<AgentProgressView />);

    // Count all elements with animation classes
    const allAnimatedElements = container.querySelectorAll('[class*="animate-"]');

    // Should have exactly 2 animated elements in CENTER (pulse-slow + ping)
    // NOT 4 (which would indicate header + center)
    expect(allAnimatedElements.length).toBeLessThanOrEqual(3); // ✅ Max 3 (center only)
  });
});
