/**
 * Utility functions for the Teacher Assistant application
 */

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

export function calculateGrade(points: number, totalPoints: number): number {
  if (totalPoints === 0) return 0
  return Math.round((points / totalPoints) * 100)
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Returns dynamic Tailwind font size class based on text length
 *
 * Used for chat summaries to ensure readability across different summary lengths
 *
 * @param text - The text to evaluate
 * @returns Tailwind font size class
 *
 * @example
 * getDynamicFontSize('Kurz') // Returns 'text-sm'
 * getDynamicFontSize('Mittellang Text') // Returns 'text-xs'
 * getDynamicFontSize('Sehr langer Text hier') // Returns 'text-xs'
 */
export function getDynamicFontSize(text: string): string {
  const length = text.length;

  // Short text (≤10 chars): text-sm (14px)
  if (length <= 10) return 'text-sm';

  // Medium text (11-15 chars): text-xs (12px)
  if (length <= 15) return 'text-xs';

  // Long text (16-20 chars): text-xs (12px) - minimum readable size
  return 'text-xs';
}