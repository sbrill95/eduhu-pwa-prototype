import { describe, it, expect, beforeEach, vi } from 'vitest';
import formatRelativeDate from './formatRelativeDate';

describe('formatRelativeDate', () => {
  beforeEach(() => {
    // Mock current date to 2025-09-30 14:30:00 for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-09-30T14:30:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should format today with time', () => {
    // Today at 10:15
    const today = new Date('2025-09-30T10:15:00');
    const result = formatRelativeDate(today);

    expect(result).toBe('Heute 10:15');
  });

  it('should format yesterday with time', () => {
    // Yesterday at 16:45
    const yesterday = new Date('2025-09-29T16:45:00');
    const result = formatRelativeDate(yesterday);

    expect(result).toBe('Gestern 16:45');
  });

  it('should format 2-7 days ago as "vor X Tagen"', () => {
    // Test 2 days ago
    const twoDaysAgo = new Date('2025-09-28T09:00:00');
    expect(formatRelativeDate(twoDaysAgo)).toBe('vor 2 Tagen');

    // Test 3 days ago
    const threeDaysAgo = new Date('2025-09-27T12:30:00');
    expect(formatRelativeDate(threeDaysAgo)).toBe('vor 3 Tagen');

    // Test 7 days ago (edge case)
    const sevenDaysAgo = new Date('2025-09-23T08:00:00');
    expect(formatRelativeDate(sevenDaysAgo)).toBe('vor 7 Tagen');
  });

  it('should format >7 days as short date without year', () => {
    // 10 days ago - should show "20. Sep"
    const tenDaysAgo = new Date('2025-09-20T10:00:00');
    const result = formatRelativeDate(tenDaysAgo);

    // German locale formats as "20. Sep." or "20. Sep"
    expect(result).toMatch(/20\.\s*Sep/);

    // 30 days ago - should show "31. Aug"
    const thirtyDaysAgo = new Date('2025-08-31T15:30:00');
    const result2 = formatRelativeDate(thirtyDaysAgo);

    expect(result2).toMatch(/31\.\s*Aug/);

    // Start of year - should show "01. Jan"
    const startOfYear = new Date('2025-01-01T00:00:00');
    const result3 = formatRelativeDate(startOfYear);

    expect(result3).toMatch(/01\.\s*Jan/);
  });

  it('should format >365 days (different year) with full date', () => {
    // Last year - 2024-12-15
    const lastYear = new Date('2024-12-15T10:00:00');
    const result = formatRelativeDate(lastYear);

    // Should be "15.12.24"
    expect(result).toBe('15.12.24');

    // Much older date - 2023-03-20
    const olderDate = new Date('2023-03-20T12:00:00');
    const result2 = formatRelativeDate(olderDate);

    // Should be "20.03.23"
    expect(result2).toBe('20.03.23');

    // Future year test (edge case) - 2026-01-10
    const futureDate = new Date('2026-01-10T14:00:00');
    const result3 = formatRelativeDate(futureDate);

    // Should be "10.01.26"
    expect(result3).toBe('10.01.26');
  });

  // Additional edge case tests
  it('should handle midnight correctly', () => {
    // Today at midnight
    const todayMidnight = new Date('2025-09-30T00:00:00');
    expect(formatRelativeDate(todayMidnight)).toBe('Heute 00:00');

    // Yesterday at midnight
    const yesterdayMidnight = new Date('2025-09-29T00:00:00');
    expect(formatRelativeDate(yesterdayMidnight)).toBe('Gestern 00:00');
  });

  it('should handle late evening correctly', () => {
    // Today at 23:59
    const lateToday = new Date('2025-09-30T23:59:00');
    expect(formatRelativeDate(lateToday)).toBe('Heute 23:59');

    // Yesterday at 23:59
    const lateYesterday = new Date('2025-09-29T23:59:00');
    expect(formatRelativeDate(lateYesterday)).toBe('Gestern 23:59');
  });
});