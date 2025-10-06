/**
 * Format timestamp to German relative date string
 * Consistent across Homepage and Library views
 *
 * Examples:
 * - "14:30" (today)
 * - "Gestern" (yesterday)
 * - "vor 2 Tagen" (< 7 days)
 * - "12. Okt" (< 1 year)
 * - "12. Okt 2024" (> 1 year)
 */
export function formatRelativeDate(timestamp: number | Date | string): string {
  const now = new Date();
  const date = typeof timestamp === 'number'
    ? new Date(timestamp)
    : typeof timestamp === 'string'
    ? new Date(timestamp)
    : timestamp;

  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  // Today - show time
  if (diffInDays === 0) {
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Yesterday
  if (diffInDays === 1) {
    return 'Gestern';
  }

  // Last 7 days
  if (diffInDays < 7) {
    return `vor ${diffInDays} Tag${diffInDays > 1 ? 'en' : ''}`;
  }

  // This year - show date without year
  if (diffInDays < 365) {
    return date.toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'short'
    });
  }

  // Older - show full date
  return date.toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// Also export as default for backward compatibility
export default formatRelativeDate;